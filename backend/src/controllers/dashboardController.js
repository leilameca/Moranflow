const { getDashboardData } = require('../services/dashboardService')

const getDashboard = (_req, res) => {
  res.json(getDashboardData())
}

module.exports = {
  getDashboard,
}
