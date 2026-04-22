const { z } = require('zod')

const db = require('../database')
const { createHttpError } = require('../utils/http')

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  paymentDate: z.string().min(4),
  paymentMethod: z.string().min(2),
  note: z.string().optional().nullable(),
})

const createPayment = (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId)
    const payload = paymentSchema.parse(req.body)

    const project = db
      .prepare('SELECT id, agreed_price FROM projects WHERE id = ?')
      .get(projectId)

    if (!project) {
      throw createHttpError(404, 'Proyecto no encontrado')
    }

    const result = db
      .prepare(
        `
          INSERT INTO payments (project_id, amount, payment_date, payment_method, note)
          VALUES (?, ?, ?, ?, ?)
        `
      )
      .run(
        projectId,
        payload.amount,
        payload.paymentDate,
        payload.paymentMethod,
        payload.note || ''
      )

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({
      item: {
        id: payment.id,
        projectId: payment.project_id,
        amount: Number(payment.amount || 0),
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        note: payment.note,
        createdAt: payment.created_at,
      },
    })
  } catch (error) {
    next(error)
  }
}

const deletePayment = (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = db.prepare('SELECT id FROM payments WHERE id = ?').get(id)

    if (!existing) {
      throw createHttpError(404, 'Pago no encontrado')
    }

    db.prepare('DELETE FROM payments WHERE id = ?').run(id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createPayment,
  deletePayment,
}
