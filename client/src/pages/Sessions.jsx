import { useEffect, useState } from "react";
import { sessionsApi, statsApi } from "../api/resources.js";
import {
  formatDuration,
  formatDate,
  FEEL_EMOJI,
  PRACTICE_LABELS,
  PRACTICE_TYPES,
} from "../utils/index.js";

function Heatmap({ data }) {
  const year = new Date().getFullYear();
  const start = new Date(`${year}-01-01`);
  const startDay = start.getDay();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  const today = new Date().toISOString().split("T")[0];
  let d = new Date(start);
  while (d.getFullYear() === year) {
    cells.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  const getLevel = (mins) => {
    if (!mins) return 0;
    if (mins < 20) return 1;
    if (mins < 45) return 2;
    if (mins < 75) return 3;
    return 4;
  };
  const colors = ["#f5f5f4", "#FAEEDA", "#FAC775", "#EF9F27", "#BA7517"];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const cellSize = 11;
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div
        className="flex gap-1"
        style={{ minWidth: `${weeks.length * (cellSize + 4)}px` }}
      >
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((date, di) => (
              <div
                key={di}
                title={
                  date
                    ? `${date}: ${data[date] ? `${data[date]} min` : "no practice"}`
                    : ""
                }
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 2,
                  background: date
                    ? colors[getLevel(data[date])]
                    : "transparent",
                  border: date === today ? "1.5px solid #BA7517" : "none",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-xs text-stone-400">Less</span>
        {colors.map((c, i) => (
          <div
            key={i}
            style={{ width: 10, height: 10, borderRadius: 2, background: c }}
          />
        ))}
        <span className="text-xs text-stone-400">More</span>
      </div>
    </div>
  );
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [heatmap, setHeatmap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");

  const load = () => {
    Promise.all([
      sessionsApi.list({
        limit: 100,
        ...(filterType ? { type: filterType } : {}),
      }),
      statsApi.heatmap(new Date().getFullYear()),
    ])
      .then(([s, h]) => {
        setSessions(s.data.data || []);
        setHeatmap(h.data.data || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filterType]);

  return (
    <div className="page-container space-y-4">
      <h1 className="font-display text-2xl text-stone-900">Sessions</h1>

      <div className="card">
        <h3 className="text-sm font-medium text-stone-700 mb-3">
          {new Date().getFullYear()} practice calendar
        </h3>
        <Heatmap data={heatmap} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="text-sm font-medium text-stone-700">All sessions</h3>
          <select
            className="input text-sm w-36 flex-shrink-0"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All types</option>
            {PRACTICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {PRACTICE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="text-stone-400 text-sm">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-stone-400 text-sm">No sessions yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {sessions.map((s) => (
              <div key={s.id} className="py-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {formatDate(s.date)}
                    </span>
                    <span className="text-sm text-stone-500">
                      {formatDuration(s.duration_minutes)}
                    </span>
                    {s.overall_feel && (
                      <span>{FEEL_EMOJI[s.overall_feel]}</span>
                    )}
                    {s.starting_bpm && s.ending_bpm && (
                      <span className="text-xs text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                        {s.starting_bpm}→{s.ending_bpm} BPM
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(s.practice_types || []).map((t) => (
                      <span key={t} className="tag">
                        {PRACTICE_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                  {s.notes && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
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
