import { useEffect, useState } from "react";
import { statsApi } from "../api/resources.js";
import { formatDuration } from "../utils/index.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#38BDF8",
  "#7DD3FC",
  "#0EA5E9",
  "#06B6D4",
  "#22D3EE",
  "#67E8F9",
  "#A5F3FC",
  "#0284C7",
  "#0369A1",
  "#075985",
];

export default function Stats() {
  const [summary, setSummary] = useState(null);
  const [streak, setStreak] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [byType, setByType] = useState([]);
  const [byPiece, setByPiece] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsApi.summary(),
      statsApi.streak(),
      statsApi.weekly(),
      statsApi.byType(),
      statsApi.byPiece(),
    ])
      .then(([s, st, w, bt, bp]) => {
        setSummary(s.data);
        setStreak(st.data);
        setWeekly(w.data.data || []);
        setByType(bt.data.data || []);
        setByPiece(bp.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="page-container text-stone-400 text-sm">Loading...</div>
    );

  return (
    <div className="page-container space-y-4">
      <h1 className="font-display text-2xl text-stone-900">Stats</h1>

      {/* 2x2 on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
            Total hrs
          </p>
          <p className="text-2xl font-medium">{summary?.totalHours ?? 0}</p>
          <p className="text-xs text-stone-400">
            {summary?.totalSessions ?? 0} sessions
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
            This month
          </p>
          <p style={{ fontSize: 22, fontWeight: 500, color: "#38BDF8" }}>
            {summary?.thisMonthHours ?? 0}
            <span className="text-sm ml-1">hrs</span>
          </p>
          <p className="text-xs text-stone-400">
            {summary?.thisMonthSessions ?? 0} sessions
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
            Avg session
          </p>
          <p className="text-2xl font-medium">
            {summary?.avgMinutes ?? 0}
            <span className="text-sm ml-1">min</span>
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
            Best streak
          </p>
          <p style={{ fontSize: 22, fontWeight: 500, color: "#38BDF8" }}>
            {streak?.longestStreak ?? 0}
            <span className="text-sm ml-1">days</span>
          </p>
          <p className="text-xs text-stone-400">
            Now: {streak?.currentStreak ?? 0}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-stone-700 mb-4">
          Weekly practice (last 12 weeks)
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekly} barSize={14}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#a8a29e" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              formatter={(v) => [`${v} min`, "Practice"]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #2e2e2e",
                background: "#1a1a1a",
                color: "#f0f0f0",
              }}
            />
            <Bar dataKey="minutes" fill="#38BDF8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-stone-700 mb-4">
            Time by practice type
          </h3>
          {byType.length === 0 ? (
            <p className="text-stone-400 text-sm">No data yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={byType}
                    dataKey="minutes"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                  >
                    {byType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v} min`]}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #2e2e2e",
                      background: "#1a1a1a",
                      color: "#f0f0f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {byType.slice(0, 5).map((t, i) => (
                  <div key={t.type} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-stone-600 flex-1 capitalize">
                      {t.type.replace("_", " ")}
                    </span>
                    <span className="text-stone-400">
                      {formatDuration(t.minutes)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-stone-700 mb-4">
            Time by piece
          </h3>
          {byPiece.length === 0 ? (
            <p className="text-stone-400 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {byPiece.slice(0, 6).map((p, i) => (
                <div key={p.piece_id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-700 truncate pr-2">
                      {p.title}
                    </span>
                    <span className="text-stone-400 flex-shrink-0">
                      {formatDuration(p.minutes)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((p.minutes / byPiece[0].minutes) * 100)}%`,
                        background: COLORS[i % COLORS.length],
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
  );
}
