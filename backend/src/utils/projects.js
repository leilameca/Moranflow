const toProjectResponse = (row) => {
  if (!row) {
    return null
  }

  const totalPaid = Number(row.total_paid || 0)
  const agreedPrice = Number(row.agreed_price || 0)
  const balance = Math.max(agreedPrice - totalPaid, 0)

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
    serviceName: row.service_name,
    totalPaid,
    balance,
    paymentStatus,
    lastPaymentDate: row.last_payment_date || null,
  }
}

const projectBaseQuery = `
  SELECT
    p.*,
    c.full_name AS client_name,
    c.business_name AS business_name,
    s.name AS service_name,
    COALESCE(SUM(pay.amount), 0) AS total_paid,
    MAX(pay.payment_date) AS last_payment_date
  FROM projects p
  INNER JOIN clients c ON c.id = p.client_id
  INNER JOIN services s ON s.id = p.service_id
  LEFT JOIN payments pay ON pay.project_id = p.id
`

module.exports = {
  projectBaseQuery,
  toProjectResponse,
}
