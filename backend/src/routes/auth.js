import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// POST /api/auth/register  — create a new lab (tenant) + admin user
router.post('/register', async (req, res) => {
  try {
    const { labName, email, password, name, logoUrl } = req.body
    if (!labName || !email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const existing = await prisma.tenant.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ message: 'A lab with this email already exists' })
    }

    const hashed = await bcrypt.hash(password, 10)

    const tenant = await prisma.tenant.create({
      data: {
        name:    labName,
        email,
        logoUrl: logoUrl || null,
        subscription: { create: { tier: 'STARTER', status: 'TRIAL' } },
        users: {
          create: { email, password: hashed, name, role: 'ADMIN' },
        },
      },
      include: { users: true },
    })

    const user  = tenant.users[0]
    const token = jwt.sign(
      { userId: user.id, tenantId: tenant.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, logoUrl: tenant.logoUrl },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  // Find user across all tenants by email — then verify password
  const user = await prisma.user.findFirst({
    where: { email },
    include: { tenant: true },
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    tenant: { id: user.tenant.id, name: user.tenant.name, logoUrl: user.tenant.logoUrl },
  })
})

// POST /api/auth/users  — admin adds a new user to the same tenant
router.post('/users', authenticate, async (req, res) => {
  if (req.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only admins can create users' })
  }

  const { email, password, name, role } = req.body
  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const hashed = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: { tenantId: req.tenantId, email, password: hashed, name, role },
    })
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
  } catch {
    res.status(409).json({ message: 'A user with this email already exists in your lab' })
  }
})

// GET /api/auth/users  — list all users in the tenant (admin only)
router.get('/users', authenticate, async (req, res) => {
  if (req.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only admins can view users' })
  }
  const users = await prisma.user.findMany({
    where:   { tenantId: req.tenantId },
    select:  { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json(users)
})

// DELETE /api/auth/users/:id  — admin removes a user (cannot delete self)
router.delete('/users/:id', authenticate, async (req, res) => {
  if (req.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only admins can delete users' })
  }
  const userId = Number(req.params.id)
  if (userId === req.userId) {
    return res.status(400).json({ message: 'You cannot delete your own account' })
  }
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId: req.tenantId } })
  if (!user) return res.status(404).json({ message: 'User not found' })

  await prisma.user.delete({ where: { id: userId } })
  res.status(204).send()
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { tenant: { include: { subscription: true } } },
  })
  if (!user) return res.status(404).json({ message: 'User not found' })

  res.json({
    user:   { id: user.id, name: user.name, email: user.email, role: user.role },
    tenant: { id: user.tenant.id, name: user.tenant.name, subscription: user.tenant.subscription },
  })
})

export default router
