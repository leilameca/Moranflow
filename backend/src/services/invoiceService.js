const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')
const dayjs = require('dayjs')

const db = require('../database')
const { createHttpError } = require('../utils/http')

const BRAND = {
  title: 'Moran Studio',
  subtitle: 'Sistemas creativos y soluciones digitales',
  contact: {
    email: 'leiladev20@gmial.com',
    phone: '8092697630',
  },
  colors: {
    ink: '#0F0F0F',
    paper: '#FFFFFF',
    beige: '#F5F1ED',
    olive: '#6B705C',
    blush: '#D6A4A4',
    soft: '#8B8178',
  },
}

const LOGO_PATH = path.resolve(__dirname, '../../../frontend/src/assets/logo.png')

const invoiceDetailsQuery = `
  SELECT
    i.*,
    p.title AS project_title,
    p.description AS project_description,
    p.agreed_price,
    p.start_date,
    p.due_date,
    c.full_name AS client_name,
    c.business_name,
    c.email AS client_email,
    c.phone AS client_phone,
    c.instagram AS client_instagram,
    s.name AS service_name,
    COALESCE(pay.total_paid, 0) AS total_paid
  FROM invoices i
  INNER JOIN projects p ON p.id = i.project_id
  INNER JOIN clients c ON c.id = p.client_id
  INNER JOIN services s ON s.id = p.service_id
  LEFT JOIN (
    SELECT project_id, SUM(amount) AS total_paid
    FROM payments
    GROUP BY project_id
  ) pay ON pay.project_id = p.id
  WHERE i.id = ?
`

const createInvoice = (projectId, notes) => {
  const project = db
    .prepare(
      `
        SELECT
          p.id,
          p.title,
          p.agreed_price,
          c.full_name AS client_name,
          s.name AS service_name,
          COALESCE(SUM(pay.amount), 0) AS total_paid
        FROM projects p
        INNER JOIN clients c ON c.id = p.client_id
        INNER JOIN services s ON s.id = p.service_id
        LEFT JOIN payments pay ON pay.project_id = p.id
        WHERE p.id = ?
        GROUP BY p.id
      `
    )
    .get(projectId)

  if (!project) {
    throw createHttpError(404, 'Proyecto no encontrado')
  }

  const invoiceCount = db.prepare('SELECT COUNT(*) AS total FROM invoices').get()
  const invoiceNumber = `MS-${String(Number(invoiceCount.total || 0) + 1).padStart(4, '0')}`
  const issueDate = dayjs().format('YYYY-MM-DD')

  const result = db
    .prepare(
      `
        INSERT INTO invoices (project_id, invoice_number, issue_date, subtotal, total, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      projectId,
      invoiceNumber,
      issueDate,
      Number(project.agreed_price || 0),
      Number(project.agreed_price || 0),
      notes || ''
    )

  return db.prepare(invoiceDetailsQuery).get(result.lastInsertRowid)
}

const getInvoiceById = (invoiceId) => {
  const invoice = db.prepare(invoiceDetailsQuery).get(invoiceId)

  if (!invoice) {
    throw createHttpError(404, 'Factura no encontrada')
  }

  return invoice
}

const listInvoices = () =>
  db
    .prepare(
      `
        SELECT
          i.id,
          i.invoice_number,
          i.issue_date,
          i.total,
          i.notes,
          p.id AS project_id,
          p.title AS project_title,
          c.full_name AS client_name,
          s.name AS service_name
        FROM invoices i
        INNER JOIN projects p ON p.id = i.project_id
        INNER JOIN clients c ON c.id = p.client_id
        INNER JOIN services s ON s.id = p.service_id
        ORDER BY i.created_at DESC
      `
    )
    .all()
    .map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date,
      total: Number(invoice.total || 0),
      notes: invoice.notes,
      projectId: invoice.project_id,
      projectTitle: invoice.project_title,
      clientName: invoice.client_name,
      serviceName: invoice.service_name,
    }))

const getPaymentStatus = (invoice) => {
  const totalPaid = Number(invoice.total_paid || 0)
  const total = Number(invoice.total || 0)

  if (totalPaid >= total && total > 0) {
    return 'Pagado'
  }

  if (totalPaid > 0) {
    return 'Parcial'
  }

  return 'Pendiente'
}

const formatInvoiceDate = (value) => {
  if (!value) {
    return 'No especificada'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const generateInvoicePdf = (res, invoice) => {
  const drawLabel = (text, x, y) => {
    doc
      .fillColor(brand.soft)
      .fontSize(10)
      .text(text, x, y, { characterSpacing: 0.7 })
  }

  const drawValue = (text, x, y, options = {}) => {
    doc
      .fillColor(brand.ink)
      .fontSize(options.size || 12)
      .text(text, x, y, {
        width: options.width,
        lineGap: options.lineGap || 3,
      })
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${invoice.invoice_number}.pdf"`
  )

  doc.pipe(res)

  const paymentStatus = getPaymentStatus(invoice)
  const brand = BRAND.colors
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const totalPaid = Number(invoice.total_paid || 0)
  const subtotal = Number(invoice.subtotal || 0)
  const total = Number(invoice.total || 0)
  const balanceDue = Math.max(total - totalPaid, 0)
  const statusStyle =
    paymentStatus === 'Pagado'
      ? { fill: '#E5EEE6', text: brand.olive }
      : paymentStatus === 'Parcial'
        ? { fill: '#F4E4E4', text: '#8A5C5C' }
        : { fill: '#F1EFEC', text: brand.ink }
  const rightX = 322
  const rightWidth = 225

  doc.rect(0, 0, doc.page.width, 174).fill(brand.ink)

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 48, 34, { fit: [176, 78], align: 'left', valign: 'center' })

    doc
      .fillColor('#E7DDD8')
      .fontSize(10)
      .text(BRAND.title.toUpperCase(), 48, 112, { characterSpacing: 1.8 })
      .fontSize(11)
      .fillColor(brand.blush)
      .text(BRAND.subtitle, 48, 128)
  } else {
    doc
      .fillColor(brand.paper)
      .fontSize(28)
      .text(BRAND.title, 48, 45)
      .fontSize(11)
      .fillColor(brand.blush)
      .text(BRAND.subtitle, 48, 82)
  }

  doc
    .fillColor(brand.paper)
    .fontSize(12)
    .text('Factura', rightX, 42, { width: rightWidth, align: 'right' })
    .fontSize(22)
    .text(invoice.invoice_number, rightX, 62, { width: rightWidth, align: 'right' })
    .fontSize(10)
    .fillColor('#E7DDD8')
    .text(`Emitida ${formatInvoiceDate(invoice.issue_date)}`, rightX, 96, {
      width: rightWidth,
      align: 'right',
    })

  if (invoice.due_date) {
    doc.text(`Entrega ${formatInvoiceDate(invoice.due_date)}`, rightX, 113, {
      width: rightWidth,
      align: 'right',
    })
  }

  doc.roundedRect(436, 134, 111, 28, 14).fill(statusStyle.fill)
  doc
    .fillColor(statusStyle.text)
    .fontSize(10)
    .text(paymentStatus.toUpperCase(), 436, 143, {
      width: 111,
      align: 'center',
      characterSpacing: 1.1,
    })

  doc
    .fillColor(brand.ink)
    .roundedRect(48, 196, 239, 134, 18)
    .fill(brand.beige)

  doc.roundedRect(309, 196, 238, 134, 18).fill('#FBF9F7')

  drawLabel('Cliente', 68, 218)
  drawValue(invoice.client_name, 68, 236, { size: 16, width: 190 })
  doc
    .fillColor(brand.soft)
    .fontSize(10)
    .text(invoice.business_name || 'Cliente independiente', 68, 260, { width: 190 })
    .text(invoice.client_email || 'Sin correo registrado', 68, 278, { width: 190 })
    .text(
      invoice.client_phone || invoice.client_instagram || 'Sin contacto adicional registrado',
      68,
      296,
      { width: 190 }
    )

  drawLabel('Estudio', 329, 218)
  drawValue(BRAND.title, 329, 236, { size: 16, width: 180 })
  doc
    .fillColor(brand.soft)
    .fontSize(10)
    .text(BRAND.subtitle, 329, 260, { width: 180, lineGap: 3 })
    .text(BRAND.contact.email, 329, 289, { width: 180 })
    .text(BRAND.contact.phone, 329, 307, { width: 180 })

  doc.roundedRect(48, 356, 316, 166, 18).fill('#FFFFFF')
  doc.roundedRect(378, 356, 169, 166, 18).fill(brand.olive)

  drawLabel('Resumen del servicio', 68, 378)
  drawValue(invoice.service_name, 68, 396, { size: 18, width: 260 })

  drawLabel('Proyecto', 68, 432)
  drawValue(invoice.project_title, 68, 450, { width: 260 })

  drawLabel('Fechas', 68, 484)
  doc
    .fillColor(brand.ink)
    .fontSize(11)
    .text(
      `${invoice.start_date ? formatInvoiceDate(invoice.start_date) : 'No especificada'} - ${
        invoice.due_date ? formatInvoiceDate(invoice.due_date) : 'Entrega abierta'
      }`,
      68,
      502,
      { width: 260 }
    )

  doc
    .fillColor(brand.paper)
    .fontSize(10)
    .text('Resumen financiero', 398, 378)
    .fontSize(11)
    .text('Subtotal', 398, 410)
    .text('Pagado a la fecha', 398, 442)
    .text('Saldo pendiente', 398, 474)
    .fontSize(17)
    .text(`$${subtotal.toFixed(2)}`, 398, 423)
    .text(`$${totalPaid.toFixed(2)}`, 398, 455)
    .text(`$${balanceDue.toFixed(2)}`, 398, 487)

  doc.roundedRect(48, 546, pageWidth, 124, 18).fill('#FBF9F7')
  drawLabel('Detalles del proyecto y notas', 68, 568)
  doc
    .fillColor('#4F473F')
    .fontSize(11)
    .text(
      invoice.project_description ||
        invoice.notes ||
        'Servicio creativo y tecnico personalizado entregado por Moran Studio.',
      68,
      590,
      {
        width: pageWidth - 40,
        lineGap: 5,
      }
    )

  doc
    .moveTo(48, 704)
    .lineTo(547, 704)
    .strokeColor('#E9E0D9')
    .stroke()

  doc
    .fontSize(10)
    .fillColor(brand.soft)
    .text('Moran Studio', 48, 722)
    .text(`Contacto: ${BRAND.contact.email} / ${BRAND.contact.phone}`, 48, 738)
    .text('Experiencias digitales premium, sistemas y soluciones visuales.', 48, 754)
    .text(`Generada el ${formatInvoiceDate(dayjs().format('YYYY-MM-DD'))}`, 336, 722, {
      align: 'right',
      width: 211,
    })
    .text('Gracias por confiar en Moran Studio para tu proyecto.', 336, 738, {
      align: 'right',
      width: 211,
    })

  doc.end()
}

module.exports = {
  createInvoice,
  getInvoiceById,
  listInvoices,
  generateInvoicePdf,
}
