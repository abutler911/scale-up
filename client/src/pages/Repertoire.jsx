import { useEffect, useState } from 'react'
import { piecesApi, uploadsApi } from '../api/resources.js'
import { PIECE_STATUSES, STATUS_COLORS, formatDate } from '../utils/index.js'

const KANBAN_COLS = PIECE_STATUSES.filter(s => s.value !== 'shelved')

function PieceModal({ piece, onClose, onSaved }) {
  const [form, setForm] = useState(piece || {
    title: '', composer: '', arranger: '', genre: '',
    difficulty: '', status: 'learning', date_started: '',
    target_bpm: '', current_bpm: '', notes: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (piece?.id) {
        await piecesApi.update(piece.id, form)
      } else {
        await piecesApi.create(form)
      }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-display text-xl">{piece ? 'Edit piece' : 'Add piece'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="Clair de Lune" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Composer</label>
              <input className="input" placeholder="Debussy" value={form.composer || ''}
                onChange={e => setForm(f => ({ ...f, composer: e.target.value }))} />
            </div>
            <div>
              <label className="label">Genre</label>
              <select className="input" value={form.genre || ''}
                onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}>
                <option value="">Select...</option>
                {['Classical', 'Romantic', 'Baroque', 'Jazz', 'Pop', 'Film', 'Contemporary', 'Other']
                  .map(g => <option key={g} value={g.toLowerCase()}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {PIECE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Difficulty (1–10)</label>
              <input type="number" min="1" max="10" className="input" value={form.difficulty || ''}
                onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Current BPM</label>
              <input type="number" className="input" placeholder="60" value={form.current_bpm || ''}
                onChange={e => setForm(f => ({ ...f, current_bpm: e.target.value }))} />
            </div>
            <div>
              <label className="label">Target BPM</label>
              <input type="number" className="input" placeholder="80" value={form.target_bpm || ''}
                onChange={e => setForm(f => ({ ...f, target_bpm: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Date started</label>
            <input type="date" className="input" value={form.date_started || ''}
              onChange={e => setForm(f => ({ ...f, date_started: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={3} value={form.notes || ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-stone-100 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.title} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Repertoire() {
  const [pieces, setPieces]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null) // null | 'add' | piece object

  const load = () => {
    piecesApi.list().then(r => setPieces(r.data.data || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const byStatus = (status) => pieces.filter(p => p.status === status)

  const handleDelete = async (id) => {
    if (!confirm('Delete this piece?')) return
    await piecesApi.delete(id)
    load()
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-stone-900">Repertoire</h1>
        <button onClick={() => setModal('add')} className="btn-primary">+ Add piece</button>
      </div>

      {loading ? (
        <p className="text-stone-400">Loading...</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {KANBAN_COLS.map(col => (
            <div key={col.value}>
              <div className={`text-xs font-medium uppercase tracking-wider mb-3 pb-2 border-b-2 ${
                col.value === 'learning'          ? 'text-blue-600 border-blue-300' :
                col.value === 'polishing'         ? 'text-amber-600 border-amber-300' :
                col.value === 'performance_ready' ? 'text-green-600 border-green-300' :
                                                    'text-purple-600 border-purple-300'
              }`}>
                {col.label}
                <span className="ml-2 text-stone-300 font-normal normal-case tracking-normal">
                  {byStatus(col.value).length}
                </span>
              </div>

              <div className="space-y-2">
                {byStatus(col.value).map(p => (
                  <div
                    key={p.id}
                    className="bg-white border border-stone-200 rounded-xl p-3 group hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-medium text-stone-800 leading-snug">{p.title}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal(p)} className="text-stone-400 hover:text-stone-700 text-xs p-0.5">✏</button>
                        <button onClick={() => handleDelete(p.id)} className="text-stone-400 hover:text-red-500 text-xs p-0.5">✕</button>
                      </div>
                    </div>
                    {p.composer && <p className="text-xs text-stone-400 mt-0.5">{p.composer}</p>}
                    {(p.current_bpm || p.target_bpm) && (
                      <div className="mt-2 text-xs text-stone-500 bg-stone-50 rounded-lg px-2 py-1 inline-block">
                        {p.current_bpm && <span>{p.current_bpm}</span>}
                        {p.current_bpm && p.target_bpm && <span className="text-stone-300 mx-1">/</span>}
                        {p.target_bpm && <span className="text-stone-400">{p.target_bpm}</span>}
                        <span className="text-stone-300 ml-0.5"> BPM</span>
                      </div>
                    )}
                    {p.date_started && (
                      <p className="text-xs text-stone-300 mt-1">Started {formatDate(p.date_started)}</p>
                    )}
                  </div>
                ))}

                {byStatus(col.value).length === 0 && (
                  <p className="text-xs text-stone-300 text-center py-4">Empty</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shelved */}
      {pieces.filter(p => p.status === 'shelved').length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-stone-400 mb-3">Shelved</h3>
          <div className="flex flex-wrap gap-2">
            {pieces.filter(p => p.status === 'shelved').map(p => (
              <div key={p.id} className="text-xs text-stone-400 bg-stone-50 border border-stone-100 rounded-lg px-3 py-1.5">
                {p.title} {p.composer && `— ${p.composer}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <PieceModal
          piece={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
