const toProjectResponse = (row) => {
  if (!row) {
    return null
  }

  const totalPaid = Number(row.total_paid || 0)
  const agreedPrice = Number(row.agreed_price || 0)
  const totalExpenses = Number(row.total_expenses || 0)
  const balance = Math.max(agreedPrice - totalPaid, 0)
  const expectedProfit = agreedPrice - totalExpenses
  const collectedProfit = totalPaid - totalExpenses

  let paymentStatus = 'Pendiente'

  if (totalPaid >= agreedPrice && agreedPrice > 0) {
    paymentStatus = 'Pagado'
  } else if (totalPaid > 0) {
    paymentStatus = 'Parcial'
  }

  return {
    id: row.id,
    clientId: row.client_id,
    serviceId: row.service_id,
    title: row.title,
    description: row.description,
    agreedPrice,
    startDate: row.start_date,
    dueDate: row.due_date,
    status: row.status,
    priority: row.priority,
    notes: row.notes,
    createdAt: row.created_at,
    clientName: row.client_name,
    businessName: row.business_name,
    clientEmail: row.client_email || '',
    clientPhone: row.client_phone || '',
    clientInstagram: row.client_instagram || '',
    serviceName: row.service_name,
    totalPaid,
    totalExpenses,
    balance,
    expectedProfit,
    collectedProfit,
    paymentStatus,
    lastPaymentDate: row.last_payment_date || null,
  }
}

const projectBaseQuery = `
  SELECT
    p.*,
    c.full_name AS client_name,
    c.business_name AS business_name,
    c.email AS client_email,
    c.phone AS client_phone,
    c.instagram AS client_instagram,
    s.name AS service_name,
    COALESCE(pay_totals.total_paid, 0) AS total_paid,
    pay_totals.last_payment_date AS last_payment_date,
    COALESCE(expense_totals.total_expenses, 0) AS total_expenses
  FROM projects p
  INNER JOIN clients c ON c.id = p.client_id
  INNER JOIN services s ON s.id = p.service_id
  LEFT JOIN (
    SELECT
      project_id,
      SUM(amount) AS total_paid,
      MAX(payment_date) AS last_payment_date
    FROM payments
    GROUP BY project_id
  ) pay_totals ON pay_totals.project_id = p.id
  LEFT JOIN (
    SELECT
      project_id,
      SUM(amount) AS total_expenses
    FROM expenses
    WHERE project_id IS NOT NULL
    GROUP BY project_id
  ) expense_totals ON expense_totals.project_id = p.id
`

module.exports = {
  projectBaseQuery,
  toProjectResponse,
}
