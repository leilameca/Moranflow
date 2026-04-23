const dayjs = require('dayjs')

const db = require('../database')

const getDashboardData = () => {
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
  const currentMonthLabel = dayjs().format('YYYY-MM')

  const counts = db
    .prepare(
      `
        SELECT
          (SELECT COUNT(*) FROM clients WHERE status = 'active') AS active_clients,
          (SELECT COUNT(*) FROM projects WHERE status IN ('Nuevo', 'En proceso', 'En revision')) AS projects_in_progress,
          (
            SELECT COALESCE(SUM(amount), 0)
            FROM payments
            WHERE payment_date >= ?
          ) AS month_income,
          (
            SELECT COALESCE(SUM(amount), 0)
            FROM expenses
            WHERE expense_date >= ?
          ) AS month_expenses,
          (
            SELECT COALESCE(SUM(p.agreed_price), 0) - COALESCE(SUM(pay_totals.total_paid), 0)
            FROM projects p
            LEFT JOIN (
              SELECT project_id, SUM(amount) AS total_paid
              FROM payments
              GROUP BY project_id
            ) pay_totals ON pay_totals.project_id = p.id
          ) AS pending_amount
      `
    )
    .get(monthStart, monthStart)

  const topServices = db
    .prepare(
      `
        SELECT
          s.id,
          s.name,
          COUNT(p.id) AS total_projects,
          COALESCE(SUM(p.agreed_price), 0) AS total_revenue
        FROM services s
        LEFT JOIN projects p ON p.service_id = s.id
        GROUP BY s.id
        ORDER BY total_projects DESC, total_revenue DESC, s.name ASC
        LIMIT 5
      `
    )
    .all()

  const paymentsByMonth = db
    .prepare(
      `
        SELECT
          substr(payment_date, 1, 7) AS month_key,
          COALESCE(SUM(amount), 0) AS income
        FROM payments
        WHERE payment_date >= ?
        GROUP BY month_key
        ORDER BY month_key ASC
      `
    )
    .all(dayjs().subtract(5, 'month').startOf('month').format('YYYY-MM-DD'))

  const monthMap = new Map(
    paymentsByMonth.map((item) => [item.month_key, Number(item.income || 0)])
  )

  const expensesByMonth = db
    .prepare(
      `
        SELECT
          substr(expense_date, 1, 7) AS month_key,
          COALESCE(SUM(amount), 0) AS expenses
        FROM expenses
        WHERE expense_date >= ?
        GROUP BY month_key
        ORDER BY month_key ASC
      `
    )
    .all(dayjs().subtract(5, 'month').startOf('month').format('YYYY-MM-DD'))

  const expenseMap = new Map(
    expensesByMonth.map((item) => [item.month_key, Number(item.expenses || 0)])
  )

  const incomeSeries = Array.from({ length: 6 }, (_, index) => {
    const month = dayjs().subtract(5 - index, 'month')
    const monthKey = month.format('YYYY-MM')
    const income = monthMap.get(monthKey) || 0
    const expenses = expenseMap.get(monthKey) || 0

    return {
      month: month.format('MMM'),
      label: month.format('MMM YYYY'),
      income,
      expenses,
      netProfit: income - expenses,
      isCurrentMonth: monthKey === currentMonthLabel,
    }
  })

  const paymentOverview = db
    .prepare(
      `
        SELECT
          COUNT(*) AS total_projects,
          SUM(CASE WHEN balance <= 0 AND agreed_price > 0 THEN 1 ELSE 0 END) AS paid_projects,
          SUM(CASE WHEN total_paid > 0 AND balance > 0 THEN 1 ELSE 0 END) AS partial_projects,
          SUM(CASE WHEN total_paid <= 0 THEN 1 ELSE 0 END) AS pending_projects
        FROM (
          SELECT
            p.id,
            p.agreed_price,
            COALESCE(SUM(pay.amount), 0) AS total_paid,
            p.agreed_price - COALESCE(SUM(pay.amount), 0) AS balance
          FROM projects p
          LEFT JOIN payments pay ON pay.project_id = p.id
          GROUP BY p.id
        )
      `
    )
    .get()

  return {
    metrics: {
      activeClients: Number(counts.active_clients || 0),
      projectsInProgress: Number(counts.projects_in_progress || 0),
      monthIncome: Number(counts.month_income || 0),
      monthExpenses: Number(counts.month_expenses || 0),
      monthNetProfit: Number(counts.month_income || 0) - Number(counts.month_expenses || 0),
      pendingAmount: Math.max(Number(counts.pending_amount || 0), 0),
    },
    topServices: topServices.map((service) => ({
      id: service.id,
      name: service.name,
      totalProjects: Number(service.total_projects || 0),
      totalRevenue: Number(service.total_revenue || 0),
    })),
    incomeSeries,
    paymentOverview: {
      totalProjects: Number(paymentOverview.total_projects || 0),
      paidProjects: Number(paymentOverview.paid_projects || 0),
      partialProjects: Number(paymentOverview.partial_projects || 0),
      pendingProjects: Number(paymentOverview.pending_projects || 0),
    },
  }
}

module.exports = {
  getDashboardData,
}
