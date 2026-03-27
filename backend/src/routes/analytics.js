import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// GET /api/analytics
router.get('/', async (req, res) => {
  try {
    const [totalPatients, totalTests, monthlyRaw] = await Promise.all([
      prisma.patient.count({ where: { tenantId: req.tenantId } }),
      prisma.testResult.count({ where: { tenantId: req.tenantId } }),
      prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS month,
          COUNT(*)::int AS count
        FROM "Patient"
        WHERE "tenantId" = ${req.tenantId}
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt")
      `,
    ])

    res.json({ totalPatients, totalTests, monthlyPatients: monthlyRaw })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ message: err.message })
  }
})

export default router
