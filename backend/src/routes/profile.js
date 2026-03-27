import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      include: { subscription: true },
    })
    res.json(tenant)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/profile  — admin only
router.put('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, logoUrl } = req.body
    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { name, logoUrl },
    })
    res.json(tenant)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
