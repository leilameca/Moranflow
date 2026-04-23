const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')
const dayjs = require('dayjs')

const db = require('../database')
const { createHttpError } = require('../utils/http')

const BRAND = {
  title: 'Moran Studio',
  subtitle: 'Diseno, tecnologia y soluciones digitales',
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
    border: '#E4D4CD',
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
    COALESCE(pay.total_paid, 0) AS total_paid,
    (
      SELECT pay2.payment_method
      FROM payments pay2
      WHERE pay2.project_id = p.id
      ORDER BY pay2.payment_date DESC, pay2.created_at DESC
      LIMIT 1
    ) AS latest_payment_method
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

const formatInvoiceDate = (value, month = 'long') => {
  if (!value) {
    return 'No especificada'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month,
    year: 'numeric',
  }).format(date)
}

const formatMoney = (value) =>
  `RD$ ${new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))}`

const buildServiceDescription = (invoice) =>
  [
    invoice.project_title,
    invoice.project_description,
    invoice.notes,
  ]
    .filter(Boolean)
    .join(' / ')

const getPaymentMethodLabel = (paymentMethod) => {
  const labels = {
    Transfer: 'Transferencia',
    Cash: 'Efectivo',
    Card: 'Tarjeta',
    QR: 'QR',
    'Bank deposit': 'Deposito bancario',
    Other: 'Otro',
  }

  return labels[paymentMethod] || 'Por definir'
}

const buildClientBillingLines = (invoice) =>
  [
    invoice.client_name,
    invoice.business_name || 'Cliente independiente',
    invoice.client_email,
    invoice.client_phone,
  ].filter(Boolean)

const generateInvoicePdf = (res, invoice) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${invoice.invoice_number}.pdf"`
  )

  doc.pipe(res)

  const colors = BRAND.colors
  const totalPaid = Number(invoice.total_paid || 0)
  const subtotal = Number(invoice.subtotal || 0)
  const total = Number(invoice.total || 0)
  const balanceDue = Math.max(total - totalPaid, 0)
  const paymentStatus = getPaymentStatus(invoice)
  const paymentDeadline = invoice.due_date || dayjs(invoice.issue_date).add(7, 'day').format('YYYY-MM-DD')
  const statusTone =
    paymentStatus === 'Pagado'
      ? { border: colors.olive, text: colors.olive }
      : paymentStatus === 'Parcial'
        ? { border: colors.blush, text: '#8A5C5C' }
        : { border: colors.olive, text: colors.olive }

  const drawMetaBlock = (label, lines, x, y, width) => {
    doc
      .fillColor(colors.olive)
      .font('Helvetica')
      .fontSize(9)
      .text(label.toUpperCase(), x, y, {
        width,
        characterSpacing: 2.2,
      })

    doc
      .moveTo(x, y + 18)
      .lineTo(x + width, y + 18)
      .lineWidth(0.7)
      .strokeColor(colors.blush)
      .stroke()

    doc
      .fillColor(colors.ink)
      .font('Helvetica')
      .fontSize(12)
      .text(lines.join('\n'), x, y + 28, {
        width,
        lineGap: 4,
      })
  }

  doc.rect(0, 0, doc.page.width, 142).fill(colors.ink)

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 48, 32, {
      fit: [92, 62],
      align: 'left',
      valign: 'center',
    })
  }

  doc
    .fillColor(colors.paper)
    .font('Helvetica')
    .fontSize(13)
    .text(BRAND.title.toUpperCase(), 48, 102, {
      characterSpacing: 4,
    })
    .fillColor(colors.olive)
    .fontSize(10)
    .text(BRAND.subtitle.toUpperCase(), 48, 119, {
      characterSpacing: 2.2,
    })

  doc
    .fillColor(colors.blush)
    .font('Helvetica')
    .fontSize(28)
    .text('FACTURA', 348, 38, {
      width: 200,
      align: 'right',
      characterSpacing: 4,
    })
    .fillColor(colors.olive)
    .fontSize(11)
    .text(`No. ${invoice.invoice_number}`, 348, 74, {
      width: 200,
      align: 'right',
      characterSpacing: 1.5,
    })
    .fillColor(colors.blush)
    .fontSize(11)
    .text(formatInvoiceDate(invoice.issue_date, 'long'), 348, 92, {
      width: 200,
      align: 'right',
    })

  doc
    .roundedRect(440, 113, 108, 24, 12)
    .lineWidth(0.8)
    .strokeColor(statusTone.border)
    .stroke()
    .fillColor(statusTone.text)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(paymentStatus.toUpperCase(), 440, 121, {
      width: 108,
      align: 'center',
      characterSpacing: 1.8,
    })

  doc.rect(0, 142, doc.page.width, 3).fill(colors.olive)
  doc.rect(180, 142, doc.page.width - 180, 3).fill(colors.blush)

  const bodyX = 48
  const bodyWidth = doc.page.width - 96
  const columnWidth = (bodyWidth - 24) / 2
  const metaTop = 182

  drawMetaBlock(
    'Facturado por',
    [
      BRAND.title,
      BRAND.subtitle,
      BRAND.contact.email,
      BRAND.contact.phone,
    ],
    bodyX,
    metaTop,
    columnWidth
  )

  drawMetaBlock(
    'Facturado a',
    buildClientBillingLines(invoice),
    bodyX + columnWidth + 24,
    metaTop,
    columnWidth
  )

  drawMetaBlock(
    'Fecha de emision',
    [formatInvoiceDate(invoice.issue_date)],
    bodyX,
    284,
    columnWidth
  )

  drawMetaBlock(
    'Fecha limite de pago',
    [formatInvoiceDate(paymentDeadline)],
    bodyX + columnWidth + 24,
    284,
    columnWidth
  )

  const tableTop = 372
  const tableWidth = bodyWidth
  const columnWidthMap = {
    number: 38,
    description: 210,
    quantity: 45,
    unitPrice: 103,
    total: 103,
  }
  const columnX = {
    number: bodyX,
    description: bodyX + columnWidthMap.number,
    quantity: bodyX + columnWidthMap.number + columnWidthMap.description,
    unitPrice:
      bodyX + columnWidthMap.number + columnWidthMap.description + columnWidthMap.quantity,
    total:
      bodyX +
      columnWidthMap.number +
      columnWidthMap.description +
      columnWidthMap.quantity +
      columnWidthMap.unitPrice,
  }

  const descriptionText = invoice.service_name
  const descriptionSubtext =
    buildServiceDescription(invoice) ||
    'Servicio profesional desarrollado por Moran Studio.'
  const descriptionHeight = Math.max(
    doc.heightOfString(descriptionSubtext, {
      width: columnWidthMap.description - 12,
      lineGap: 2,
    }),
    14
  )
  const rowHeight = 34 + descriptionHeight

  doc.rect(bodyX, tableTop, tableWidth, 32).fill(colors.ink)
  doc
    .fillColor(colors.paper)
    .font('Helvetica')
    .fontSize(10)
    .text('#', columnX.number + 10, tableTop + 11)
    .text('Descripcion del servicio', columnX.description + 6, tableTop + 11, {
      width: columnWidthMap.description - 12,
    })
    .text('Cant.', columnX.quantity, tableTop + 11, {
      width: columnWidthMap.quantity,
      align: 'center',
    })
    .text('Precio unit.', columnX.unitPrice, tableTop + 11, {
      width: columnWidthMap.unitPrice - 8,
      align: 'right',
    })
    .text('Total', columnX.total, tableTop + 11, {
      width: columnWidthMap.total - 8,
      align: 'right',
    })

  const rowTop = tableTop + 32
  doc.rect(bodyX, rowTop, tableWidth, rowHeight).fill(colors.paper)
  doc
    .moveTo(bodyX, rowTop + rowHeight)
    .lineTo(bodyX + tableWidth, rowTop + rowHeight)
    .lineWidth(0.7)
    .strokeColor(colors.border)
    .stroke()

  doc
    .fillColor(colors.ink)
    .font('Helvetica')
    .fontSize(12)
    .text('01', columnX.number + 10, rowTop + 12)

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(descriptionText, columnX.description + 6, rowTop + 10, {
      width: columnWidthMap.description - 12,
    })
    .font('Helvetica')
    .fillColor(colors.olive)
    .fontSize(10)
    .text(descriptionSubtext, columnX.description + 6, rowTop + 28, {
      width: columnWidthMap.description - 12,
      lineGap: 2,
    })

  doc
    .fillColor(colors.ink)
    .font('Helvetica')
    .fontSize(10)
    .text('1', columnX.quantity, rowTop + 18, {
      width: columnWidthMap.quantity,
      align: 'center',
    })
    .text(formatMoney(subtotal), columnX.unitPrice, rowTop + 18, {
      width: columnWidthMap.unitPrice - 8,
      align: 'right',
    })
    .text(formatMoney(total), columnX.total, rowTop + 18, {
      width: columnWidthMap.total - 8,
      align: 'right',
    })

  const totalsTop = rowTop + rowHeight + 28
  const totalsX = bodyX + tableWidth - 280

  const drawTotalRow = (label, value, y, isTotal = false) => {
    if (isTotal) {
      doc
        .moveTo(totalsX, y - 6)
        .lineTo(totalsX + 280, y - 6)
        .lineWidth(1.4)
        .strokeColor(colors.olive)
        .stroke()
    } else {
      doc
        .moveTo(totalsX, y + 16)
        .lineTo(totalsX + 280, y + 16)
        .lineWidth(0.6)
        .strokeColor(colors.border)
        .stroke()
    }

    doc
      .fillColor(isTotal ? colors.olive : colors.ink)
      .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(isTotal ? 11 : 12)
      .text(label, totalsX, y, {
        width: 160,
      })
      .fillColor(colors.ink)
      .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(isTotal ? 16 : 12)
      .text(value, totalsX + 160, y, {
        width: 120,
        align: 'right',
      })
  }

  drawTotalRow('Subtotal', formatMoney(subtotal), totalsTop)
  drawTotalRow('Descuento (0%)', '--', totalsTop + 26)
  drawTotalRow('ITBIS (0%)', 'No aplica', totalsTop + 52)
  drawTotalRow('TOTAL', formatMoney(total), totalsTop + 86, true)

  const paymentBoxTop = totalsTop + 132
  const paymentBoxHeight = 100

  doc
    .roundedRect(bodyX, paymentBoxTop, tableWidth, paymentBoxHeight, 8)
    .lineWidth(0.8)
    .strokeColor(colors.blush)
    .fillAndStroke(colors.paper, colors.blush)

  doc
    .fillColor(colors.olive)
    .font('Helvetica')
    .fontSize(9)
    .text('INFORMACION DE PAGO', bodyX + 20, paymentBoxTop + 16, {
      characterSpacing: 2.6,
    })

  doc
    .fillColor(colors.ink)
    .font('Helvetica')
    .fontSize(11)
    .text(
      `Estado: ${paymentStatus}\nPagado a la fecha: ${formatMoney(totalPaid)}\nSaldo pendiente: ${formatMoney(balanceDue)}`,
      bodyX + 20,
      paymentBoxTop + 38,
      {
        width: 220,
        lineGap: 6,
      }
    )
    .text(
      `Metodo registrado: ${getPaymentMethodLabel(invoice.latest_payment_method)}\nReferencia: ${invoice.invoice_number}\nContacto: ${BRAND.contact.phone}`,
      bodyX + 300,
      paymentBoxTop + 38,
      {
        width: 220,
        lineGap: 6,
      }
    )

  const footerTop = paymentBoxTop + paymentBoxHeight + 28

  doc.rect(0, footerTop, doc.page.width, 72).fill(colors.ink)
  doc
    .fillColor(colors.olive)
    .font('Helvetica')
    .fontSize(10)
    .text(`${BRAND.contact.email} | ${BRAND.contact.phone}`, 48, footerTop + 24)
    .fillColor(colors.blush)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('GRACIAS POR TU CONFIANZA', 330, footerTop + 24, {
      width: 220,
      align: 'right',
      characterSpacing: 2.2,
    })

  doc.end()
}

module.exports = {
  createInvoice,
  getInvoiceById,
  listInvoices,
  generateInvoicePdf,
}
