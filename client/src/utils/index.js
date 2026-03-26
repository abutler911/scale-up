// Format minutes to "1h 23m" or "45m"
export function formatDuration(minutes) {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// Format seconds to "1:23"
export function formatSeconds(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Today as YYYY-MM-DD
export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// Format date for display: "Mar 26, 2026"
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

// Feel emoji map
export const FEEL_EMOJI = { 1: '😫', 2: '😕', 3: '😐', 4: '🙂', 5: '🔥' }

// Practice type options
export const PRACTICE_TYPES = [
  'scales', 'arpeggios', 'chords', 'repertoire',
  'sight_reading', 'ear_training', 'theory',
  'improvisation', 'technique', 'warmup', 'other'
]

export const PRACTICE_LABELS = {
  scales: 'Scales', arpeggios: 'Arpeggios', chords: 'Chords',
  repertoire: 'Repertoire', sight_reading: 'Sight reading',
  ear_training: 'Ear training', theory: 'Theory',
  improvisation: 'Improvisation', technique: 'Technique',
  warmup: 'Warmup', other: 'Other'
}

// Piece status options
export const PIECE_STATUSES = [
  { value: 'learning',          label: 'Learning',          color: 'blue' },
  { value: 'polishing',         label: 'Polishing',         color: 'amber' },
  { value: 'performance_ready', label: 'Performance Ready', color: 'green' },
  { value: 'mastered',          label: 'Mastered',          color: 'purple' },
  { value: 'shelved',           label: 'Shelved',           color: 'gray' }
]

export const STATUS_COLORS = {
  learning:          'bg-blue-50 text-blue-700 border-blue-200',
  polishing:         'bg-amber-50 text-amber-700 border-amber-200',
  performance_ready: 'bg-green-50 text-green-700 border-green-200',
  mastered:          'bg-purple-50 text-purple-700 border-purple-200',
  shelved:           'bg-stone-100 text-stone-500 border-stone-200'
}

// Goal type options
export const GOAL_TYPES = [
  { value: 'session_count', label: 'Session count',    unit: 'sessions' },
  { value: 'total_minutes', label: 'Total minutes',    unit: 'minutes' },
  { value: 'streak_days',   label: 'Daily streak',     unit: 'days' },
  { value: 'piece_status',  label: 'Piece status',     unit: '' },
  { value: 'bpm_target',    label: 'BPM target',       unit: 'BPM' },
  { value: 'custom',        label: 'Custom',           unit: '' }
]

// Percentage helper
export function pct(current, target) {
  if (!target || target === 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}
