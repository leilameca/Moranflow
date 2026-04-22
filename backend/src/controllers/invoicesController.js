const { z } = require('zod')

const {
  createInvoice,
  getInvoiceById,
  listInvoices,
  generateInvoicePdf,
} = require('../services/invoiceService')

const invoiceSchema = z.object({
  notes: z.string().optional().nullable(),
})

const listAllInvoices = (_req, res) => {
  res.json({
    items: listInvoices(),
  })
}

const createInvoiceForProject = (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId)
    const payload = invoiceSchema.parse(req.body)

    const invoice = createInvoice(projectId, payload.notes)

    res.status(201).json({
      item: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issue_date,
        total: Number(invoice.total || 0),
        projectId: invoice.project_id,
      },
    })
  } catch (error) {
    next(error)
  }
}

const downloadInvoicePdf = (req, res, next) => {
  try {
    const invoiceId = Number(req.params.id)
    const invoice = getInvoiceById(invoiceId)
    generateInvoicePdf(res, invoice)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listAllInvoices,
  createInvoiceForProject,
  downloadInvoicePdf,
}
