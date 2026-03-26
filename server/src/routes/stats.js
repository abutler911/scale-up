import { Router } from 'express'
import { supabase } from '../db/supabase.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()
router.use(verifyToken)

// GET /api/stats/summary
router.get('/summary', async (req, res) => {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('duration_minutes, date')

  if (error) return res.status(500).json({ error: error.message })

  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0

  // This month
  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthSessions = sessions.filter(s => s.date?.startsWith(monthStr))
  const thisMonthMinutes = thisMonthSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  res.json({
    totalSessions,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    avgMinutes,
    thisMonthSessions: thisMonthSessions.length,
    thisMonthMinutes,
    thisMonthHours: Math.round((thisMonthMinutes / 60) * 10) / 10
  })
})

// GET /api/stats/streak
router.get('/streak', async (req, res) => {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('date')
    .order('date', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const uniqueDates = [...new Set(sessions.map(s => s.date))].sort().reverse()

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Current streak: count backwards from today or yesterday
  let streakDate = uniqueDates[0] === today || uniqueDates[0] === yesterday ? new Date(uniqueDates[0]) : null

  if (streakDate) {
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(streakDate)
      expected.setDate(expected.getDate() - i)
      const expectedStr = expected.toISOString().split('T')[0]
      if (uniqueDates.includes(expectedStr)) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Longest streak
  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) { tempStreak = 1; continue }
    const prev = new Date(uniqueDates[i - 1])
    const curr = new Date(uniqueDates[i])
    const diff = (prev - curr) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  res.json({ currentStreak, longestStreak })
})

// GET /api/stats/heatmap?year=2026
router.get('/heatmap', async (req, res) => {
  const year = req.query.year || new Date().getFullYear()
  const { data, error } = await supabase
    .from('sessions')
    .select('date, duration_minutes')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)

  if (error) return res.status(500).json({ error: error.message })

  // Group by date
  const map = {}
  data.forEach(s => {
    map[s.date] = (map[s.date] || 0) + (s.duration_minutes || 0)
  })

  res.json({ data: map })
})

// GET /api/stats/by-type
router.get('/by-type', async (req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('practice_types, duration_minutes')

  if (error) return res.status(500).json({ error: error.message })

  const map = {}
  data.forEach(s => {
    const mins = s.duration_minutes || 0
    const types = s.practice_types || []
    const perType = types.length > 0 ? mins / types.length : 0
    types.forEach(t => {
      map[t] = (map[t] || 0) + perType
    })
  })

  const result = Object.entries(map)
    .map(([type, minutes]) => ({ type, minutes: Math.round(minutes) }))
    .sort((a, b) => b.minutes - a.minutes)

  res.json({ data: result })
})

// GET /api/stats/by-piece
router.get('/by-piece', async (req, res) => {
  const { data: sessions, error: se } = await supabase
    .from('sessions')
    .select('pieces_practiced, duration_minutes')

  const { data: pieces, error: pe } = await supabase
    .from('pieces')
    .select('id, title, composer')

  if (se || pe) return res.status(500).json({ error: (se || pe).message })

  const map = {}
  sessions.forEach(s => {
    const mins = s.duration_minutes || 0
    const practiced = s.pieces_practiced || []
    const perPiece = practiced.length > 0 ? mins / practiced.length : 0
    practiced.forEach(id => {
      map[id] = (map[id] || 0) + perPiece
    })
  })

  const pieceMap = Object.fromEntries(pieces.map(p => [p.id, p]))
  const result = Object.entries(map)
    .map(([id, minutes]) => ({
      piece_id: id,
      title: pieceMap[id]?.title || 'Unknown',
      composer: pieceMap[id]?.composer || '',
      minutes: Math.round(minutes),
      sessions: sessions.filter(s => (s.pieces_practiced || []).includes(id)).length
    }))
    .sort((a, b) => b.minutes - a.minutes)

  res.json({ data: result })
})

// GET /api/stats/progress?piece_id=xxx
router.get('/progress', async (req, res) => {
  const { piece_id } = req.query
  if (!piece_id) return res.status(400).json({ error: 'piece_id required' })

  const { data, error } = await supabase
    .from('sessions')
    .select('date, starting_bpm, ending_bpm, target_bpm')
    .contains('pieces_practiced', [piece_id])
    .not('ending_bpm', 'is', null)
    .order('date', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ data })
})

// GET /api/stats/weekly
router.get('/weekly', async (req, res) => {
  const weeks = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const end = new Date(now)
    end.setDate(end.getDate() - i * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)

    weeks.push({
      label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0]
    })
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('date, duration_minutes')
    .gte('date', weeks[0].from)

  if (error) return res.status(500).json({ error: error.message })

  const result = weeks.map(w => {
    const sessionsInWeek = data.filter(s => s.date >= w.from && s.date <= w.to)
    return {
      label: w.label,
      minutes: sessionsInWeek.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
      sessions: sessionsInWeek.length
    }
  })

  res.json({ data: result })
})

export default router
