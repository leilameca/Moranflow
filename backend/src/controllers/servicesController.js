const { z } = require('zod')

const db = require('../database')
const { createHttpError } = require('../utils/http')

const serviceSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional().nullable(),
  basePrice: z.coerce.number().nonnegative().nullable().optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean(),
})

const listServices = (_req, res) => {
  const services = db
    .prepare(
      `
        SELECT
          s.*,
          COUNT(p.id) AS total_projects
        FROM services s
        LEFT JOIN projects p ON p.service_id = s.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `
    )
    .all()
    .map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      basePrice: service.base_price === null ? null : Number(service.base_price),
      description: service.description,
      isActive: Boolean(service.is_active),
      createdAt: service.created_at,
      totalProjects: Number(service.total_projects || 0),
    }))

  res.json({ items: services })
}

const createService = (req, res, next) => {
  try {
    const payload = serviceSchema.parse(req.body)

    const result = db
      .prepare(
        `
          INSERT INTO services (name, category, base_price, description, is_active)
          VALUES (?, ?, ?, ?, ?)
        `
      )
      .run(
        payload.name,
        payload.category || '',
        payload.basePrice ?? null,
        payload.description || '',
        payload.isActive ? 1 : 0
      )

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({
      item: {
        id: service.id,
        name: service.name,
        category: service.category,
        basePrice: service.base_price === null ? null : Number(service.base_price),
        description: service.description,
        isActive: Boolean(service.is_active),
        createdAt: service.created_at,
        totalProjects: 0,
      },
    })
  } catch (error) {
    next(error)
  }
}

const updateService = (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const payload = serviceSchema.parse(req.body)

    const existing = db.prepare('SELECT id FROM services WHERE id = ?').get(id)

    if (!existing) {
      throw createHttpError(404, 'Servicio no encontrado')
    }

    db.prepare(
      `
        UPDATE services
        SET
          name = ?,
          category = ?,
          base_price = ?,
          description = ?,
          is_active = ?
        WHERE id = ?
      `
    ).run(
      payload.name,
      payload.category || '',
      payload.basePrice ?? null,
      payload.description || '',
      payload.isActive ? 1 : 0,
      id
    )

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id)

    res.json({
      item: {
        id: service.id,
        name: service.name,
        category: service.category,
        basePrice: service.base_price === null ? null : Number(service.base_price),
        description: service.description,
        isActive: Boolean(service.is_active),
        createdAt: service.created_at,
      },
    })
  } catch (error) {
    next(error)
  }
}

const deleteService = (req, res, next) => {
  try {
    const id = Number(req.params.id)

    const existing = db.prepare('SELECT id FROM services WHERE id = ?').get(id)

    if (!existing) {
      throw createHttpError(404, 'Servicio no encontrado')
    }

    try {
      db.prepare('DELETE FROM services WHERE id = ?').run(id)
    } catch (_error) {
      throw createHttpError(
        409,
        'No puedes eliminar este servicio porque tiene proyectos relacionados'
      )
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listServices,
  createService,
  updateService,
  deleteService,
}
