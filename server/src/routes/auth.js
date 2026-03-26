import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { pin } = req.body
  if (!pin) return res.status(400).json({ error: 'PIN required' })

  const match = await bcrypt.compare(String(pin), process.env.PIN_HASH)
  if (!match) return res.status(401).json({ error: 'Incorrect PIN' })

  const token = jwt.sign({ user: 'andy' }, process.env.JWT_SECRET, { expiresIn: '30d' })
  res.json({ token })
})

// GET /api/auth/verify
router.get('/verify', verifyToken, (req, res) => {
  res.json({ valid: true })
})

export default router
