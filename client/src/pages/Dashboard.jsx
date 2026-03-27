import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { statsApi, sessionsApi, goalsApi } from "../api/resources.js";
import {
  formatDuration,
  formatDate,
  FEEL_EMOJI,
  PRACTICE_LABELS,
} from "../utils/index.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const TYPE_EMOJI = {
  streak_days: "🔥",
  days_per_week: "📅",
  minutes_per_day: "⏱",
  total_minutes: "⏳",
  session_count: "📋",
  bpm_target: "🎵",
  custom: "✏️",
};

function progressColor(p) {
  if (p >= 100) return "#22D3EE";
  if (p >= 66) return "#38BDF8";
  if (p >= 33) return "#0EA5E9";
  return "#1e3a4a";
}

export default function Dashboard() {
  const { openLogSession } = useOutletContext();
  const [summary, setSummary] = useState(null);
  const [streak, setStreak] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsApi.summary(),
      statsApi.streak(),
      statsApi.weekly(),
      sessionsApi.list({ limit: 5 }),
      goalsApi.list({ completed: false }),
    ])
      .then(([s, st, w, sess, g]) => {
        setSummary(s.data);
        setStreak(st.data);
        setWeekly(w.data.data || []);
        setSessions(sess.data.data || []);
        setGoals(g.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="page-container text-stone-400 text-sm">Loading...</div>
    );

  const recentWeeks = weekly.slice(-7);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const activeGoals = goals.slice(0, 4);

  return (
    <div className="page-container space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-stone-900">Dashboard</h1>
          <p className="text-stone-400 text-xs mt-0.5">{today}</p>
        </div>
        <button
          onClick={openLogSession}
          className="hidden md:block btn-primary"
        >
          + Log session
        </button>
      </div>

      {/* Stats — 2 col mobile, 4 desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
            Streak
          </p>
          <p style={{ fontSize: 22, fontWeight: 500, color: "#38BDF8" }}>
            {streak?.currentStreak ?? 0}
            <span className="text-sm ml-1">days</span>
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            Best: {streak?.longestStreak ?? 0}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
            This month
          </p>
          <p className="text-2xl font-medium">
            {summary?.thisMonthHours ?? 0}
            <span className="text-sm ml-1">hrs</span>
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
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
          <p className="text-xs text-stone-400 mt-0.5">all time</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
            Total hrs
          </p>
          <p className="text-2xl font-medium">{summary?.totalHours ?? 0}</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {summary?.totalSessions ?? 0} sessions
          </p>
        </div>
      </div>

      {/* Goals — prominent section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-stone-700">Active goals</h3>
          <Link to="/goals" className="text-xs text-amber-600 hover:underline">
            View all →
          </Link>
        </div>
        {activeGoals.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-stone-400 text-sm mb-2">No active goals</p>
            <Link
              to="/goals"
              className="text-xs text-amber-600 hover:underline"
            >
              Set a goal →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.map((g) => {
              const current = g.computed_current ?? g.current_value ?? 0;
              const target = g.computed_target ?? g.target_value ?? 1;
              const p = Math.min(100, Math.round((current / target) * 100));
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm flex-shrink-0">
                        {TYPE_EMOJI[g.type] || "🎯"}
                      </span>
                      <span className="text-sm text-stone-700 truncate">
                        {g.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-stone-400">
                        {current}/{target}
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: progressColor(p) }}
                      >
                        {p}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${p}%`,
                        background: progressColor(p),
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="card">
        <h3 className="text-sm font-medium text-stone-700 mb-3">
          Last 7 weeks
        </h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={recentWeeks} barSize={18}>
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
            <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
              {recentWeeks.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === recentWeeks.length - 1 ? "#38BDF8" : "#222"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-stone-700">
            Recent sessions
          </h3>
          <Link
            to="/sessions"
            className="text-xs text-amber-600 hover:underline"
          >
            View all →
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-stone-400 text-sm mb-2">No sessions yet</p>
            <button
              onClick={openLogSession}
              className="text-xs text-amber-600 hover:underline"
            >
              Log your first session →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {sessions.map((s) => (
              <div key={s.id} className="py-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {formatDuration(s.duration_minutes)}
                    </span>
                    {s.overall_feel && (
                      <span className="text-sm">
                        {FEEL_EMOJI[s.overall_feel]}
                      </span>
                    )}
                    {s.ending_bpm && s.starting_bpm && (
                      <span className="text-xs text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                        {s.starting_bpm}→{s.ending_bpm} BPM
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {formatDate(s.date)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(s.practice_types || []).slice(0, 3).map((t) => (
                      <span key={t} className="tag">
                        {PRACTICE_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
