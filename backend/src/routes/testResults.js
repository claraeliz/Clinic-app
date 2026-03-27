import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// GET /api/test-results?patientId=1
router.get('/', async (req, res) => {
  const { patientId } = req.query
  if (!patientId) return res.status(400).json({ message: 'patientId is required' })

  // Verify patient belongs to this tenant first
  const patient = await prisma.patient.findFirst({
    where: { id: Number(patientId), tenantId: req.tenantId },
  })
  if (!patient) return res.status(404).json({ message: 'Patient not found' })

  const results = await prisma.testResult.findMany({
    where:   { patientId: Number(patientId), tenantId: req.tenantId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(results)
})

// GET /api/test-results/:id
router.get('/:id', async (req, res) => {
  const result = await prisma.testResult.findFirst({
    where: { id: Number(req.params.id), tenantId: req.tenantId },
  })
  if (!result) return res.status(404).json({ message: 'Test result not found' })
  res.json(result)
})

// POST /api/test-results
router.post('/', requireRole('ADMIN', 'MEDIC'), async (req, res) => {
  const { patientId, category, date, status, notes, data } = req.body
  if (!patientId || !category) {
    return res.status(400).json({ message: 'patientId and category are required' })
  }

  const patient = await prisma.patient.findFirst({
    where: { id: Number(patientId), tenantId: req.tenantId },
  })
  if (!patient) return res.status(404).json({ message: 'Patient not found' })

  const result = await prisma.testResult.create({
    data: {
      tenantId:  req.tenantId,
      patientId: Number(patientId),
      category,
      date,
      status:    status ?? 'pending',
      notes,
      data:      data ? JSON.stringify(data) : null,
    },
  })
  res.status(201).json(result)
})

// PUT /api/test-results/:id
router.put('/:id', requireRole('ADMIN', 'MEDIC'), async (req, res) => {
  const existing = await prisma.testResult.findFirst({
    where: { id: Number(req.params.id), tenantId: req.tenantId },
  })
  if (!existing) return res.status(404).json({ message: 'Test result not found' })

  const { category, date, status, notes, data } = req.body
  const result = await prisma.testResult.update({
    where: { id: existing.id },
    data:  {
      category,
      date,
      status,
      notes,
      data: data ? JSON.stringify(data) : existing.data,
    },
  })
  res.json(result)
})

// DELETE /api/test-results/:id
router.delete('/:id', requireRole('ADMIN', 'MEDIC'), async (req, res) => {
  const existing = await prisma.testResult.findFirst({
    where: { id: Number(req.params.id), tenantId: req.tenantId },
  })
  if (!existing) return res.status(404).json({ message: 'Test result not found' })

  await prisma.testResult.delete({ where: { id: existing.id } })
  res.status(204).send()
})

export default router
