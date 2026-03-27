import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { checkPatientQuota } from '../middleware/quota.js'

const router = Router()

// All patient routes require authentication
router.use(authenticate)

// GET /api/patients
router.get('/', async (req, res) => {
  const patients = await prisma.patient.findMany({
    where:   { tenantId: req.tenantId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { testResults: true } } },
  })
  res.json(patients)
})

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  const patient = await prisma.patient.findFirst({
    where: { id: Number(req.params.id), tenantId: req.tenantId },
  })
  if (!patient) return res.status(404).json({ message: 'Patient not found' })
  res.json(patient)
})

// POST /api/patients
router.post('/', requireRole('ADMIN', 'FRONT_DESK'), checkPatientQuota, async (req, res) => {
  const { name, dob, gender, phone, email, address, insured } = req.body
  if (!name) return res.status(400).json({ message: 'Name is required' })

  const patient = await prisma.patient.create({
    data: { tenantId: req.tenantId, name, dob, gender, phone, email, address, insured },
  })
  res.status(201).json(patient)
})

// PUT /api/patients/:id
router.put('/:id', requireRole('ADMIN', 'FRONT_DESK'), async (req, res) => {
  const existing = await prisma.patient.findFirst({
    where: { id: Number(req.params.id), tenantId: req.tenantId },
  })
  if (!existing) return res.status(404).json({ message: 'Patient not found' })

  const { name, dob, gender, phone, email, address, insured } = req.body
  const patient = await prisma.patient.update({
    where: { id: existing.id },
    data:  { name, dob, gender, phone, email, address, insured },
  })
  res.json(patient)
})

// DELETE /api/patients/:id
router.delete('/:id', requireRole('ADMIN', 'FRONT_DESK'), async (req, res) => {
  const existing = await prisma.patient.findFirst({
    where: { id: Number(req.params.id), tenantId: req.tenantId },
  })
  if (!existing) return res.status(404).json({ message: 'Patient not found' })

  await prisma.patient.delete({ where: { id: existing.id } })
  res.status(204).send()
})

export default router
