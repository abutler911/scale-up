import { Router } from 'express'
import { supabase } from '../db/supabase.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
router.use(verifyToken)

// GET /api/goals
router.get('/', async (req, res) => {
  const { completed } = req.query
  let query = supabase.from('goals').select('*, piece:piece_id(id,title,composer)').order('created_at', { ascending: false })

  if (completed !== undefined) query = query.eq('completed', completed === 'true')

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

// GET /api/goals/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*, piece:piece_id(id,title,composer)')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Goal not found' })
  res.json(data)
})

// POST /api/goals
router.post('/', async (req, res) => {
  const { title, description, type, target_value, unit, piece_id, deadline } = req.body
  if (!title || !type) return res.status(400).json({ error: 'title and type required' })

  const { data, error } = await supabase
    .from('goals')
    .insert([{ title, description, type, target_value, current_value: 0, unit, piece_id, deadline }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PUT /api/goals/:id
router.put('/:id', async (req, res) => {
  const allowed = ['title','description','type','target_value','current_value','unit','piece_id','deadline','completed']
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/goals/:id/complete
router.post('/:id/complete', async (req, res) => {
  const { data, error } = await supabase
    .from('goals')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/goals/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('goals').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

export default router
