const { z } = require('zod')

const db = require('../database')
const { createHttpError } = require('../utils/http')

const expenseSchema = z.object({
  scope: z.enum(['fixed', 'project']),
  projectId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(2).max(120),
  category: z.string().trim().max(80).optional().nullable(),
  amount: z.coerce.number().positive(),
  expenseDate: z.string().min(4),
  vendor: z.string().trim().max(120).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
})

const expenseSelectQuery = `
  SELECT
    e.*,
    p.title AS project_title,
    c.full_name AS client_name
  FROM expenses e
  LEFT JOIN projects p ON p.id = e.project_id
  LEFT JOIN clients c ON c.id = p.client_id
`

const mapExpense = (expense) => ({
  id: expense.id,
  projectId: expense.project_id,
  scope: expense.scope,
  title: expense.title,
  category: expense.category,
  amount: Number(expense.amount || 0),
  expenseDate: expense.expense_date,
  vendor: expense.vendor,
  note: expense.note,
  createdAt: expense.created_at,
  projectTitle: expense.project_title,
  clientName: expense.client_name,
})

const ensureProjectForExpense = (scope, projectId) => {
  if (scope === 'fixed') {
    return null
  }

  if (!projectId) {
    throw createHttpError(400, 'Debes seleccionar un proyecto para este gasto')
  }

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId)

  if (!project) {
    throw createHttpError(404, 'Proyecto no encontrado')
  }

  return projectId
}

const listExpenses = (_req, res) => {
  const items = db
    .prepare(
      `
        ${expenseSelectQuery}
        ORDER BY e.expense_date DESC, e.created_at DESC
      `
    )
    .all()
    .map(mapExpense)

  res.json({ items })
}

const createExpense = (req, res, next) => {
  try {
    const payload = expenseSchema.parse(req.body)
    const projectId = ensureProjectForExpense(payload.scope, payload.projectId || null)

    const result = db
      .prepare(
        `
          INSERT INTO expenses (project_id, scope, title, category, amount, expense_date, vendor, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        projectId,
        payload.scope,
        payload.title,
        payload.category || '',
        payload.amount,
        payload.expenseDate,
        payload.vendor || '',
        payload.note || ''
      )

    const expense = db
      .prepare(
        `
          ${expenseSelectQuery}
          WHERE e.id = ?
        `
      )
      .get(result.lastInsertRowid)

    res.status(201).json({
      item: mapExpense(expense),
    })
  } catch (error) {
    next(error)
  }
}

const updateExpense = (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const payload = expenseSchema.parse(req.body)
    const existing = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id)

    if (!existing) {
      throw createHttpError(404, 'Gasto no encontrado')
    }

    const projectId = ensureProjectForExpense(payload.scope, payload.projectId || null)

    db.prepare(
      `
        UPDATE expenses
        SET
          project_id = ?,
          scope = ?,
          title = ?,
          category = ?,
          amount = ?,
          expense_date = ?,
          vendor = ?,
          note = ?
        WHERE id = ?
      `
    ).run(
      projectId,
      payload.scope,
      payload.title,
      payload.category || '',
      payload.amount,
      payload.expenseDate,
      payload.vendor || '',
      payload.note || '',
      id
    )

    const expense = db
      .prepare(
        `
          ${expenseSelectQuery}
          WHERE e.id = ?
        `
      )
      .get(id)

    res.json({
      item: mapExpense(expense),
    })
  } catch (error) {
    next(error)
  }
}

const deleteExpense = (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id)

    if (!existing) {
      throw createHttpError(404, 'Gasto no encontrado')
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
}
