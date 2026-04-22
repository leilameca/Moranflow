const { z } = require('zod')

const db = require('../database')
const { createHttpError } = require('../utils/http')

const clientSchema = z.object({
  fullName: z.string().min(2),
  businessName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  instagram: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']),
})

const listClients = (_req, res) => {
  const clients = db
    .prepare(
      `
        SELECT
          c.*,
          COUNT(DISTINCT p.id) AS total_projects,
          COALESCE(SUM(p.agreed_price), 0) AS projected_revenue
        FROM clients c
        LEFT JOIN projects p ON p.client_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `
    )
    .all()
    .map((client) => ({
      id: client.id,
      fullName: client.full_name,
      businessName: client.business_name,
      phone: client.phone,
      email: client.email,
      instagram: client.instagram,
      notes: client.notes,
      status: client.status,
      createdAt: client.created_at,
      totalProjects: Number(client.total_projects || 0),
      projectedRevenue: Number(client.projected_revenue || 0),
    }))

  res.json({ items: clients })
}

const createClient = (req, res, next) => {
  try {
    const payload = clientSchema.parse(req.body)

    const result = db
      .prepare(
        `
          INSERT INTO clients (full_name, business_name, phone, email, instagram, notes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        payload.fullName,
        payload.businessName || '',
        payload.phone || '',
        payload.email || '',
        payload.instagram || '',
        payload.notes || '',
        payload.status
      )

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({
      item: {
        id: client.id,
        fullName: client.full_name,
        businessName: client.business_name,
        phone: client.phone,
        email: client.email,
        instagram: client.instagram,
        notes: client.notes,
        status: client.status,
        createdAt: client.created_at,
        totalProjects: 0,
        projectedRevenue: 0,
      },
    })
  } catch (error) {
    next(error)
  }
}

const updateClient = (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const payload = clientSchema.parse(req.body)

    const existing = db.prepare('SELECT id FROM clients WHERE id = ?').get(id)

    if (!existing) {
      throw createHttpError(404, 'Cliente no encontrado')
    }

    db.prepare(
      `
        UPDATE clients
        SET
          full_name = ?,
          business_name = ?,
          phone = ?,
          email = ?,
          instagram = ?,
          notes = ?,
          status = ?
        WHERE id = ?
      `
    ).run(
      payload.fullName,
      payload.businessName || '',
      payload.phone || '',
      payload.email || '',
      payload.instagram || '',
      payload.notes || '',
      payload.status,
      id
    )

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id)

    res.json({
      item: {
        id: client.id,
        fullName: client.full_name,
        businessName: client.business_name,
        phone: client.phone,
        email: client.email,
        instagram: client.instagram,
        notes: client.notes,
        status: client.status,
        createdAt: client.created_at,
      },
    })
  } catch (error) {
    next(error)
  }
}

const deleteClient = (req, res, next) => {
  try {
    const id = Number(req.params.id)

    const existing = db.prepare('SELECT id FROM clients WHERE id = ?').get(id)

    if (!existing) {
      throw createHttpError(404, 'Cliente no encontrado')
    }

    try {
      db.prepare('DELETE FROM clients WHERE id = ?').run(id)
    } catch (_error) {
      throw createHttpError(
        409,
        'No puedes eliminar este cliente porque tiene proyectos relacionados'
      )
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listClients,
  createClient,
  updateClient,
  deleteClient,
}
