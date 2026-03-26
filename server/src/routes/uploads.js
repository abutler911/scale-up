import { Router } from 'express'
import multer from 'multer'
import { supabase } from '../db/supabase.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
router.use(verifyToken)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'), false)
    }
  }
})

// POST /api/uploads
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })

  const { piece_id, session_id, file_type } = req.body
  const ext = req.file.originalname.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `uploads/${filename}`

  const { error: uploadError } = await supabase.storage
    .from('piano-uploads')
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    })

  if (uploadError) return res.status(500).json({ error: uploadError.message })

  const { data: { publicUrl } } = supabase.storage
    .from('piano-uploads')
    .getPublicUrl(storagePath)

  const { data, error } = await supabase
    .from('uploads')
    .insert([{
      filename: req.file.originalname,
      storage_path: storagePath,
      public_url: publicUrl,
      file_type: file_type || 'other',
      mime_type: req.file.mimetype,
      size_bytes: req.file.size,
      piece_id: piece_id || null,
      session_id: session_id || null
    }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// GET /api/uploads
router.get('/', async (req, res) => {
  const { piece_id, session_id } = req.query
  let query = supabase.from('uploads').select('*').order('created_at', { ascending: false })

  if (piece_id)   query = query.eq('piece_id', piece_id)
  if (session_id) query = query.eq('session_id', session_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

// DELETE /api/uploads/:id
router.delete('/:id', async (req, res) => {
  const { data: upload, error: fetchErr } = await supabase
    .from('uploads')
    .select('storage_path')
    .eq('id', req.params.id)
    .single()

  if (fetchErr) return res.status(404).json({ error: 'Upload not found' })

  await supabase.storage.from('piano-uploads').remove([upload.storage_path])

  const { error } = await supabase.from('uploads').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

export default router
