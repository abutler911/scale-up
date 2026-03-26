import { useEffect, useState } from 'react'
import { statsApi } from '../api/resources.js'
import { formatDuration } from '../utils/index.js'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

const COLORS = ['#BA7517','#EF9F27','#FAC775','#378ADD','#639922','#D4537E','#534AB7','#1D9E75','#D85A30','#888780']

export default function Stats() {
  const [summary, setSummary] = useState(null)
  const [streak, setStreak]   = useState(null)
  const [weekly, setWeekly]   = useState([])
  const [byType, setByType]   = useState([])
  const [byPiece, setByPiece] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsApi.summary(),
      statsApi.streak(),
      statsApi.weekly(),
      statsApi.byType(),
      statsApi.byPiece()
    ]).then(([s, st, w, bt, bp]) => {
      setSummary(s.data)
      setStreak(st.data)
      setWeekly(w.data.data || [])
      setByType(bt.data.data || [])
      setByPiece(bp.data.data || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-stone-400">Loading...</div>

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="font-display text-2xl text-stone-900">Stats</h1>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Total hours</p>
          <p className="text-2xl font-medium">{summary?.totalHours ?? 0}</p>
          <p className="text-xs text-stone-400">{summary?.totalSessions ?? 0} sessions</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">This month</p>
          <p className="text-2xl font-medium text-amber-500">{summary?.thisMonthHours ?? 0}<span className="text-sm ml-1">hrs</span></p>
          <p className="text-xs text-stone-400">{summary?.thisMonthSessions ?? 0} sessions</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Avg session</p>
          <p className="text-2xl font-medium">{summary?.avgMinutes ?? 0}<span className="text-sm ml-1">min</span></p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Best streak</p>
          <p className="text-2xl font-medium text-amber-500">{streak?.longestStreak ?? 0}<span className="text-sm ml-1">days</span></p>
          <p className="text-xs text-stone-400">Current: {streak?.currentStreak ?? 0}</p>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="card">
        <h3 className="text-sm font-medium text-stone-700 mb-4">Weekly practice (last 12 weeks)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekly} barSize={18}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [`${v} min`, 'Practice']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
            />
            <Bar dataKey="minutes" fill="#EF9F27" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* By type pie */}
        <div className="card">
          <h3 className="text-sm font-medium text-stone-700 mb-4">Time by practice type</h3>
          {byType.length === 0 ? (
            <p className="text-stone-400 text-sm">No data yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={byType} dataKey="minutes" nameKey="type" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} min`]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {byType.slice(0, 5).map((t, i) => (
                  <div key={t.type} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-stone-600 flex-1 capitalize">{t.type.replace('_', ' ')}</span>
                    <span className="text-stone-400">{formatDuration(t.minutes)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* By piece */}
        <div className="card">
          <h3 className="text-sm font-medium text-stone-700 mb-4">Time by piece</h3>
          {byPiece.length === 0 ? (
            <p className="text-stone-400 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {byPiece.slice(0, 6).map((p, i) => (
                <div key={p.piece_id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-700 truncate pr-2">{p.title}</span>
                    <span className="text-stone-400 flex-shrink-0">{formatDuration(p.minutes)}</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((p.minutes / byPiece[0].minutes) * 100)}%`,
                        background: COLORS[i % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
