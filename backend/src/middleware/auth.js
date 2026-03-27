import jwt from 'jsonwebtoken'

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId   = payload.userId
    req.tenantId = payload.tenantId
    req.role     = payload.role
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  }
}
