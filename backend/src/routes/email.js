import { Router } from 'express'
import nodemailer from 'nodemailer'
import PDFDocument from 'pdfkit'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

const TEST_CATALOG = {
  hematology:    'Hematologie',
  biochemistry:  'Biochimie',
  hormones:      'Hormoni si Endocrinologie',
  immunology:    'Imunologie si Inflamatie',
  serology:      'Serologie - Boli Infectioase',
  vitamins:      'Vitamine si Minerale',
  urine:         'Sumar de Urina',
  coagulation:   'Coagulare',
  tumor_markers: 'Markeri Tumorali',
  microbiology:  'Microbiologie',
  allergy:       'Alergii si Imunoglobuline',
}

const STATUS_LABELS = {
  normal:    'Normal',
  abnormal:  'Anormal',
  critical:  'Critic',
  pending:   'In asteptare',
  completed: 'Finalizat',
  reviewed:  'Revizuit',
}

function createTransporter() {
  return nodemailer.createTransport({
    host:       process.env.SMTP_HOST || '127.0.0.1',
    port:       Number(process.env.SMTP_PORT) || 1025,
    secure:     false,
    ignoreTLS:  true,
    auth:       process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
}

function generatePDF(patient, results) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 40, size: 'A4' })
    const chunks = []

    doc.on('data',  chunk => chunks.push(chunk))
    doc.on('end',   ()    => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const today = new Date().toLocaleDateString('ro-RO', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    // Header
    doc.fontSize(18).fillColor('#2563eb').text('Clinic App', { continued: false })
    doc.fontSize(10).fillColor('#64748b').text(`Raport pacient · Tiparit ${today}`)
    doc.moveTo(40, doc.y + 6).lineTo(555, doc.y + 6).strokeColor('#2563eb').lineWidth(2).stroke()
    doc.moveDown(1)

    // Patient info
    doc.fontSize(13).fillColor('#1e293b').font('Helvetica-Bold').text(patient.name)
    doc.font('Helvetica').fontSize(10).fillColor('#475569')

    const fields = [
      ['Data nasterii', patient.dob],
      ['Sex',           patient.gender === 'male' ? 'Masculin' : patient.gender === 'female' ? 'Feminin' : patient.gender],
      ['Telefon',       patient.phone],
      ['Email',         patient.email],
      ['Adresa',        patient.address],
      ['Asigurat',      patient.insured === 'yes' ? 'Da' : patient.insured === 'no' ? 'Nu' : null],
    ].filter(([, v]) => v)

    fields.forEach(([label, value]) => {
      doc.text(`${label}: `, { continued: true }).fillColor('#1e293b').font('Helvetica-Bold').text(value)
      doc.font('Helvetica').fillColor('#475569')
    })

    doc.moveDown(1)
    doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold')
      .text(`Rezultate analize (${results.length})`)
    doc.moveDown(0.5)

    // Results
    results.forEach((r, idx) => {
      const categoryLabel = TEST_CATALOG[r.category] ?? r.category
      const statusLabel   = STATUS_LABELS[r.status]  ?? r.status
      let   data          = {}
      try { data = JSON.parse(r.data ?? '{}') } catch { /* empty */ }
      const entries = Object.entries(data).filter(([, v]) => v !== '' && v !== null && v !== undefined)

      // Section header
      if (doc.y > 700) doc.addPage()
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e3a8a')
        .text(`${idx + 1}. ${categoryLabel}`, { continued: true })
      doc.font('Helvetica').fontSize(9).fillColor('#64748b')
        .text(`   ${r.date ?? ''}   [${statusLabel}]`)

      // Table
      if (entries.length > 0) {
        const colParam = 40
        const colValue = 300

        // Table header
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569')
        doc.text('Parametru', colParam, doc.y, { width: 240, continued: false })
        doc.text('Valoare',   colValue, doc.y - doc.currentLineHeight(), { width: 200 })

        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke()

        entries.forEach(([key, value], i) => {
          if (doc.y > 720) doc.addPage()
          const rowY = doc.y + 2
          if (i % 2 === 0) {
            doc.rect(40, rowY - 1, 515, 14).fillColor('#f8fafc').fill()
          }
          doc.font('Helvetica').fontSize(9).fillColor('#475569')
            .text(key.replace(/_/g, ' '), colParam, rowY, { width: 240 })
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b')
            .text(String(value), colValue, rowY - doc.currentLineHeight(), { width: 200 })
        })
      }

      if (r.notes) {
        doc.moveDown(0.3)
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#92400e').text('Notite: ', { continued: true })
        doc.font('Helvetica').fillColor('#1e293b').text(r.notes)
      }

      doc.moveDown(1)
    })

    // Footer
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke()
    doc.moveDown(0.5)
    doc.fontSize(9).fillColor('#94a3b8').font('Helvetica')
      .text(`Raport generat de Clinic App · ${today}`, { align: 'center' })

    doc.end()
  })
}

// POST /api/email/send-report/:patientId
router.post('/send-report/:patientId', async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: Number(req.params.patientId), tenantId: req.tenantId },
    })
    if (!patient) return res.status(404).json({ message: 'Pacientul nu a fost gasit' })
    if (!patient.email) return res.status(400).json({ message: 'Pacientul nu are o adresa de email' })

    const results = await prisma.testResult.findMany({
      where:   { patientId: patient.id, tenantId: req.tenantId },
      orderBy: { createdAt: 'desc' },
    })

    const pdf = await generatePDF(patient, results)

    const transporter = createTransporter()
    const fileName    = `rezultate-${patient.name.replace(/\s+/g, '-')}.pdf`

    await transporter.sendMail({
      from:    process.env.SMTP_FROM || 'clinic@clinic.app',
      to:      patient.email,
      subject: `Rezultate analize - ${patient.name}`,
      html: `
        <p>Buna ziua, <strong>${patient.name}</strong>,</p>
        <p>Va trimitem atasat rezultatele analizelor dumneavoastra.</p>
        <p>Cu stima,<br>Echipa Clinic App</p>
      `,
      attachments: [{
        filename:    fileName,
        content:     pdf,
        contentType: 'application/pdf',
      }],
    })

    res.json({ message: `Email trimis cu succes la ${patient.email}` })
  } catch (err) {
    console.error('Email send error:', err.message)
    res.status(500).json({ message: `Eroare la trimiterea emailului: ${err.message}` })
  }
})

export default router
