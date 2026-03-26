import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { statsApi, sessionsApi, goalsApi } from "../api/resources.js";
import {
  formatDuration,
  formatDate,
  FEEL_EMOJI,
  PRACTICE_LABELS,
  pct,
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

  return (
    <div className="page-container space-y-4">
      {/* Header */}
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

      {/* Stats grid — 2 col on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
            Streak
          </p>
          <p className="text-2xl font-medium text-amber-500">
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

      {/* Chart + Goals — stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  border: "1px solid #e7e5e4",
                }}
              />
              <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                {recentWeeks.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === recentWeeks.length - 1 ? "#BA7517" : "#e7e5e4"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-stone-700 mb-3">
            Active goals
          </h3>
          {goals.length === 0 ? (
            <p className="text-stone-400 text-sm">No active goals yet.</p>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 3).map((g) => (
                <div key={g.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-700 truncate pr-2">
                      {g.title}
                    </span>
                    <span className="text-stone-400 flex-shrink-0">
                      {pct(g.current_value, g.target_value)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct(g.current_value, g.target_value)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="card">
        <h3 className="text-sm font-medium text-stone-700 mb-3">
          Recent sessions
        </h3>
        {sessions.length === 0 ? (
          <p className="text-stone-400 text-sm">
            No sessions yet. Log your first one!
          </p>
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
                    {(s.practice_types || []).map((t) => (
                      <span key={t} className="tag">
                        {PRACTICE_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                  {s.notes && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                      {s.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
