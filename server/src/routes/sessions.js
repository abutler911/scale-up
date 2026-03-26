import { Router } from 'express'
import { supabase } from '../db/supabase.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
router.use(verifyToken)

// GET /api/sessions
router.get('/', async (req, res) => {
  const { limit = 50, offset = 0, from, to, type } = req.query
  let query = supabase
    .from('sessions')
    .select('*, pieces:pieces_practiced(id,title,composer)')
    .order('date', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (from) query = query.gte('date', from)
  if (to)   query = query.lte('date', to)
  if (type) query = query.contains('practice_types', [type])

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, count })
})

// GET /api/sessions/today
router.get('/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('date', today)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Session not found' })
  res.json(data)
})

// POST /api/sessions
router.post('/', async (req, res) => {
  const {
    date, start_time, end_time, duration_minutes,
    practice_types, pieces_practiced,
    starting_bpm, ending_bpm, target_bpm,
    overall_feel, notes
  } = req.body

  if (!duration_minutes) return res.status(400).json({ error: 'duration_minutes required' })

  const { data, error } = await supabase
    .from('sessions')
    .insert([{
      date: date || new Date().toISOString().split('T')[0],
      start_time, end_time,
      duration_minutes: Number(duration_minutes),
      practice_types: practice_types || [],
      pieces_practiced: pieces_practiced || [],
      starting_bpm, ending_bpm, target_bpm,
      overall_feel, notes
    }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /api/sessions/:id
router.put('/:id', async (req, res) => {
  const allowed = [
    'date','start_time','end_time','duration_minutes','practice_types',
    'pieces_practiced','starting_bpm','ending_bpm','target_bpm','overall_feel','notes'
  ]
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/sessions/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('sessions').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

export default router
