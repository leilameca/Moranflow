const express = require('express')

const authRoutes = require('./authRoutes')
const clientRoutes = require('./clientRoutes')
const serviceRoutes = require('./serviceRoutes')
const projectRoutes = require('./projectRoutes')
const paymentRoutes = require('./paymentRoutes')
const dashboardRoutes = require('./dashboardRoutes')
const invoiceRoutes = require('./invoiceRoutes')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/dashboard', requireAuth, dashboardRoutes)
router.use('/clients', requireAuth, clientRoutes)
router.use('/services', requireAuth, serviceRoutes)
router.use('/projects', requireAuth, projectRoutes)
router.use('/payments', requireAuth, paymentRoutes)
router.use('/invoices', requireAuth, invoiceRoutes)

module.exports = router
