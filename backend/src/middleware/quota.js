import prisma from '../lib/prisma.js'

const TIER_LIMITS = {
  STARTER:    100,
  BASIC:      500,
  PRO:        1000,
  ENTERPRISE: 5000,
}

export async function checkPatientQuota(req, res, next) {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId: req.tenantId },
  })

  const tier  = sub?.tier ?? 'STARTER'
  const limit = TIER_LIMITS[tier]

  const count = await prisma.patient.count({
    where: { tenantId: req.tenantId },
  })

  if (count >= limit) {
    return res.status(403).json({
      message: `Patient limit reached for your ${tier} plan (${limit} patients). Please upgrade.`,
    })
  }

  next()
}
