const express = require('express')

const {
  listAllInvoices,
  createInvoiceForProject,
  downloadInvoicePdf,
} = require('../controllers/invoicesController')

const router = express.Router()

router.get('/', listAllInvoices)
router.post('/project/:projectId', createInvoiceForProject)
router.get('/:id/pdf', downloadInvoicePdf)

module.exports = router
