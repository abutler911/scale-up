import { Router } from 'express'
import { supabase } from '../db/supabase.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
router.use(verifyToken)

// GET /api/pieces
router.get('/', async (req, res) => {
  const { status, genre, search } = req.query
  let query = supabase.from('pieces').select('*').order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (genre)  query = query.eq('genre', genre)
  if (search) query = query.or(`title.ilike.%${search}%,composer.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

// GET /api/pieces/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('pieces')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Piece not found' })
  res.json(data)
})

// GET /api/pieces/:id/sessions
router.get('/:id/sessions', async (req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .contains('pieces_practiced', [req.params.id])
    .order('date', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

// POST /api/pieces
router.post('/', async (req, res) => {
  const {
    title, composer, arranger, genre, difficulty,
    status, date_started, date_mastered,
    target_bpm, current_bpm, notes, sheet_music_url
  } = req.body

  if (!title) return res.status(400).json({ error: 'title required' })

  const { data, error } = await supabase
    .from('pieces')
    .insert([{
      title, composer, arranger, genre,
      difficulty: difficulty ? Number(difficulty) : null,
      status: status || 'learning',
      date_started, date_mastered,
      target_bpm, current_bpm, notes, sheet_music_url
    }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /api/pieces/:id
router.put('/:id', async (req, res) => {
  const allowed = [
    'title','composer','arranger','genre','difficulty','status',
    'date_started','date_mastered','target_bpm','current_bpm','notes','sheet_music_url'
  ]
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  )
  updates.updated_at = new Date().toISOString()

  // Auto-set date_mastered when status → mastered
  if (updates.status === 'mastered' && !updates.date_mastered) {
    updates.date_mastered = new Date().toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('pieces')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/pieces/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('pieces').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

export default router
