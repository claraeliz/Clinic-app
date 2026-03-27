import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import patientRoutes from './routes/patients.js'
import testResultRoutes from './routes/testResults.js'
import analyticsRoutes from './routes/analytics.js'
import profileRoutes from './routes/profile.js'
import emailRoutes from './routes/email.js'

const app = express()

app.use(cors({
  origin: (origin, cb) => cb(null, true), // allow all origins in dev
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

app.use('/api/auth',                 authRoutes)
app.use('/api/pacienti',            patientRoutes)
app.use('/api/rezultate-analize',   testResultRoutes)
app.use('/api/statistici',          analyticsRoutes)
app.use('/api/profil',              profileRoutes)
app.use('/api/email',               emailRoutes)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
