import { useEffect, useState } from "react";
import { sessionsApi, piecesApi, statsApi } from "../api/resources.js";
import {
  formatDuration,
  formatDate,
  FEEL_EMOJI,
  PRACTICE_LABELS,
  PRACTICE_TYPES,
} from "../utils/index.js";
import SessionDetailModal from "../components/sessions/SessionDetailModal.jsx";

function Heatmap({ data }) {
  const year = new Date().getFullYear();
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const CELL = 13;

  // Build date list using local time throughout
  const localDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayStr = localDateStr(new Date());
  const start = new Date(year, 0, 1); // Jan 1 local time
  const startDay = start.getDay(); // 0=Sun

  // Build weeks: each week is [Sun..Sat], null = padding
  const weeks = [];
  let week = Array(startDay).fill(null);
  let d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    week.push(localDateStr(d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    d.setDate(d.getDate() + 1);
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  // Month label positions
  const monthLabels = [];
  weeks.forEach((w, wi) => {
    const firstDate = w.find(Boolean);
    if (firstDate) {
      const month = parseInt(firstDate.split("-")[1]) - 1;
      const day = parseInt(firstDate.split("-")[2]);
      if (day <= 7 && !monthLabels.find((l) => l.month === month)) {
        monthLabels.push({ month, wi });
      }
    }
  });

  const getLevel = (mins) => {
    if (!mins || mins === 0) return 0;
    if (mins < 20) return 1;
    if (mins < 45) return 2;
    if (mins < 75) return 3;
    return 4;
  };
  const colors = ["transparent", "#FAEEDA", "#FAC775", "#EF9F27", "#BA7517"];
  const totalWidth = weeks.length * (CELL + 2);

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: totalWidth, position: "relative" }}>
        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: 0 }}>
          {weeks.map((_, wi) => {
            const label = monthLabels.find((l) => l.wi === wi);
            return (
              <div key={wi} style={{ width: CELL + 2, flexShrink: 0 }}>
                {label && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#a8a29e",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {MONTHS[label.month]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Grid */}
        <div className="flex gap-0.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((date, di) => {
                const mins = date ? data[date] || 0 : 0;
                const level = date ? getLevel(mins) : -1;
                const isToday = date === todayStr;
                const isPast = date && date <= todayStr;
                return (
                  <div
                    key={di}
                    title={
                      date
                        ? mins
                          ? `${date}: ${mins} min`
                          : `${date}: no practice`
                        : ""
                    }
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 3,
                      background:
                        level === 0 && isPast
                          ? "#f0efed"
                          : level === 0
                            ? "transparent"
                            : colors[level],
                      border: isToday
                        ? "2px solid #BA7517"
                        : "1px solid transparent",
                      boxSizing: "border-box",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3">
          <span style={{ fontSize: 10, color: "#a8a29e" }}>Less</span>
          {["#f0efed", "#FAEEDA", "#FAC775", "#EF9F27", "#BA7517"].map(
            (c, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: c,
                }}
              />
            ),
          )}
          <span style={{ fontSize: 10, color: "#a8a29e" }}>More</span>
        </div>
      </div>
    </div>
  );
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [heatmap, setHeatmap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [selected, setSelected] = useState(null);

  const load = () => {
    Promise.all([
      sessionsApi.list({
        limit: 100,
        ...(filterType ? { type: filterType } : {}),
      }),
      statsApi.heatmap(new Date().getFullYear()),
      piecesApi.list(),
    ])
      .then(([s, h, p]) => {
        setSessions(s.data.data || []);
        setHeatmap(h.data.data || {});
        setPieces(p.data.data || []);
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
          <h3 className="text-sm font-medium text-stone-700">
            All sessions
            {sessions.length > 0 && (
              <span className="ml-1.5 text-stone-300 font-normal">
                {sessions.length}
              </span>
            )}
          </h3>
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
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full text-left py-3 flex items-start gap-3 hover:bg-stone-50 active:bg-stone-100 -mx-1 px-1 rounded-xl transition-colors touch-manipulation"
              >
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
                      <span className="text-sm">
                        {FEEL_EMOJI[s.overall_feel]}
                      </span>
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
                    <p className="text-xs text-stone-400 mt-1 line-clamp-1">
                      {s.notes}
                    </p>
                  )}
                </div>
                <span className="text-stone-300 text-sm flex-shrink-0 mt-0.5">
                  ›
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <SessionDetailModal
          session={selected}
          pieces={pieces}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            load();
          }}
          onDeleted={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}
