import { useState, useEffect, useRef } from 'react'
import { sessionsApi, piecesApi } from '../../api/resources.js'
import { PRACTICE_TYPES, PRACTICE_LABELS, FEEL_EMOJI, todayStr, formatSeconds } from '../../utils/index.js'

export default function LogSessionModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    date: todayStr(),
    duration_minutes: '',
    practice_types: [],
    pieces_practiced: [],
    starting_bpm: '',
    ending_bpm: '',
    target_bpm: '',
    overall_feel: null,
    notes: ''
  })
  const [pieces, setPieces] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    piecesApi.list().then(r => setPieces(r.data.data || []))
    return () => clearInterval(intervalRef.current)
  }, [])

  const toggleTimer = () => {
    if (timerRunning) {
      clearInterval(intervalRef.current)
      setTimerRunning(false)
      setForm(f => ({ ...f, duration_minutes: Math.ceil(timerSeconds / 60) }))
    } else {
      setTimerRunning(true)
      intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000)
    }
  }

  const resetTimer = () => {
    clearInterval(intervalRef.current)
    setTimerRunning(false)
    setTimerSeconds(0)
    setForm(f => ({ ...f, duration_minutes: '' }))
  }

  const toggleType = (t) => setForm(f => ({
    ...f,
    practice_types: f.practice_types.includes(t)
      ? f.practice_types.filter(x => x !== t)
      : [...f.practice_types, t]
  }))

  const togglePiece = (id) => setForm(f => ({
    ...f,
    pieces_practiced: f.pieces_practiced.includes(id)
      ? f.pieces_practiced.filter(x => x !== id)
      : [...f.pieces_practiced, id]
  }))

  const handleSave = async () => {
    if (!form.duration_minutes) { setError('Duration is required'); return }
    setSaving(true)
    setError('')
    try {
      await sessionsApi.create({
        ...form,
        duration_minutes: Number(form.duration_minutes),
        starting_bpm: form.starting_bpm ? Number(form.starting_bpm) : null,
        ending_bpm:   form.ending_bpm   ? Number(form.ending_bpm)   : null,
        target_bpm:   form.target_bpm   ? Number(form.target_bpm)   : null
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-display text-xl">Log a session</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Timer */}
          <div className="bg-stone-50 rounded-xl p-4 text-center">
            <div className="text-4xl font-mono font-medium text-stone-900 mb-3">
              {formatSeconds(timerSeconds)}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={toggleTimer}
                className={`btn-primary text-sm px-5 ${timerRunning ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                {timerRunning ? '⏸ Pause' : timerSeconds > 0 ? '▶ Resume' : '▶ Start timer'}
              </button>
              {timerSeconds > 0 && !timerRunning && (
                <button onClick={resetTimer} className="btn-ghost text-sm px-4">Reset</button>
              )}
            </div>
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" className="input" placeholder="45" value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
            </div>
          </div>

          {/* Practice types */}
          <div>
            <label className="label">Practice types</label>
            <div className="flex flex-wrap gap-2">
              {PRACTICE_TYPES.map(t => (
                <button key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`chip ${form.practice_types.includes(t) ? 'chip-active' : ''}`}
                >
                  {PRACTICE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Pieces */}
          {pieces.length > 0 && (
            <div>
              <label className="label">Pieces practiced</label>
              <div className="flex flex-wrap gap-2">
                {pieces.filter(p => p.status !== 'shelved').map(p => (
                  <button key={p.id}
                    type="button"
                    onClick={() => togglePiece(p.id)}
                    className={`chip ${form.pieces_practiced.includes(p.id) ? 'chip-active' : ''}`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BPM */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Start BPM</label>
              <input type="number" className="input" placeholder="60" value={form.starting_bpm}
                onChange={e => setForm(f => ({ ...f, starting_bpm: e.target.value }))} />
            </div>
            <div>
              <label className="label">End BPM</label>
              <input type="number" className="input" placeholder="72" value={form.ending_bpm}
                onChange={e => setForm(f => ({ ...f, ending_bpm: e.target.value }))} />
            </div>
            <div>
              <label className="label">Target BPM</label>
              <input type="number" className="input" placeholder="80" value={form.target_bpm}
                onChange={e => setForm(f => ({ ...f, target_bpm: e.target.value }))} />
            </div>
          </div>

          {/* Feel */}
          <div>
            <label className="label">How'd it feel?</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, overall_feel: f.overall_feel === n ? null : n }))}
                  className={`text-2xl transition-transform hover:scale-125 ${form.overall_feel === n ? 'scale-125 ring-2 ring-amber-400 rounded-full' : ''}`}
                >
                  {FEEL_EMOJI[n]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What clicked? What to work on next time..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : 'Save session'}
          </button>
        </div>
      </div>
    </div>
  )
}
