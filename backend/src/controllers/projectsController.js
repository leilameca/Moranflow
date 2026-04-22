const { z } = require('zod')

const db = require('../database')
const { createHttpError } = require('../utils/http')
const { projectBaseQuery, toProjectResponse } = require('../utils/projects')

const projectSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive(),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  agreedPrice: z.coerce.number().nonnegative(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum([
    'Nuevo',
    'En proceso',
    'En revision',
    'Aprobado',
    'Entregado',
    'Pausado',
    'Cancelado',
  ]),
  priority: z.enum(['Baja', 'Media', 'Alta']),
  notes: z.string().optional().nullable(),
})

const projectListQuery = `
  ${projectBaseQuery}
  GROUP BY p.id
  ORDER BY p.created_at DESC
`

const projectByIdQuery = `
  ${projectBaseQuery}
  WHERE p.id = ?
  GROUP BY p.id
`

const ensureReferencesExist = ({ clientId, serviceId }) => {
  const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId)
  const service = db.prepare('SELECT id FROM services WHERE id = ?').get(serviceId)

  if (!client) {
    throw createHttpError(404, 'Cliente no encontrado')
  }

  if (!service) {
    throw createHttpError(404, 'Servicio no encontrado')
  }
}

const listProjects = (_req, res) => {
  const items = db.prepare(projectListQuery).all().map(toProjectResponse)
  res.json({ items })
}

const getProject = (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const project = db.prepare(projectByIdQuery).get(id)

    if (!project) {
      throw createHttpError(404, 'Proyecto no encontrado')
    }

    const payments = db
      .prepare(
        `
          SELECT *
          FROM payments
          WHERE project_id = ?
          ORDER BY payment_date DESC, created_at DESC
        `
      )
      .all(id)
      .map((payment) => ({
        id: payment.id,
        projectId: payment.project_id,
        amount: Number(payment.amount || 0),
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        note: payment.note,
        createdAt: payment.created_at,
      }))

    const invoices = db
      .prepare(
        `
          SELECT id, invoice_number, issue_date, total, notes
          FROM invoices
          WHERE project_id = ?
          ORDER BY created_at DESC
        `
      )
      .all(id)
      .map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issue_date,
        total: Number(invoice.total || 0),
        notes: invoice.notes,
      }))

    res.json({
      item: {
        ...toProjectResponse(project),
        payments,
        invoices,
      },
    })
  } catch (error) {
    next(error)
  }
}

const createProject = (req, res, next) => {
  try {
    const payload = projectSchema.parse(req.body)
    ensureReferencesExist(payload)

    const result = db
      .prepare(
        `
          INSERT INTO projects (
            client_id,
            service_id,
            title,
            description,
            agreed_price,
            start_date,
            due_date,
            status,
            priority,
            notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        payload.clientId,
        payload.serviceId,
        payload.title,
        payload.description || '',
        payload.agreedPrice,
        payload.startDate || '',
        payload.dueDate || '',
        payload.status,
        payload.priority,
        payload.notes || ''
      )

    const item = db.prepare(projectByIdQuery).get(result.lastInsertRowid)

    res.status(201).json({
      item: toProjectResponse(item),
    })
  } catch (error) {
    next(error)
  }
}

const updateProject = (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const payload = projectSchema.parse(req.body)

    const existing = db.prepare('SELECT id FROM projects WHERE id = ?').get(id)

    if (!existing) {
      throw createHttpError(404, 'Proyecto no encontrado')
    }

    ensureReferencesExist(payload)

    db.prepare(
      `
        UPDATE projects
        SET
          client_id = ?,
          service_id = ?,
          title = ?,
          description = ?,
          agreed_price = ?,
          start_date = ?,
          due_date = ?,
          status = ?,
          priority = ?,
          notes = ?
        WHERE id = ?
      `
    ).run(
      payload.clientId,
      payload.serviceId,
      payload.title,
      payload.description || '',
      payload.agreedPrice,
      payload.startDate || '',
      payload.dueDate || '',
      payload.status,
      payload.priority,
      payload.notes || '',
      id
    )

    const item = db.prepare(projectByIdQuery).get(id)

    res.json({
      item: toProjectResponse(item),
    })
  } catch (error) {
    next(error)
  }
}

const deleteProject = (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = db.prepare('SELECT id FROM projects WHERE id = ?').get(id)

    if (!existing) {
      throw createHttpError(404, 'Proyecto no encontrado')
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
}
