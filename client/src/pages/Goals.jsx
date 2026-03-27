import { useEffect, useState } from "react";
import { goalsApi, piecesApi } from "../api/resources.js";
import { formatDate, pct } from "../utils/index.js";

const GOAL_TYPES = [
  {
    value: "streak_days",
    label: "🔥 Daily streak",
    description: "Practice N days in a row",
    fields: ["target_value"],
    targetLabel: "Days in a row",
    targetPlaceholder: "30",
    unit: "days",
  },
  {
    value: "days_per_week",
    label: "📅 Days per week",
    description: "Practice at least X days every week",
    fields: ["target_value"],
    targetLabel: "Days per week",
    targetPlaceholder: "3",
    unit: "days/week",
  },
  {
    value: "minutes_per_day",
    label: "⏱ Minutes per day",
    description: "Hit a daily minute target for N days",
    fields: ["target_value", "secondary_value"],
    targetLabel: "Minutes per day",
    targetPlaceholder: "15",
    secondaryLabel: "For how many days",
    secondaryPlaceholder: "10",
    unit: "min/day",
  },
  {
    value: "total_minutes",
    label: "⏳ Total minutes",
    description: "Accumulate X minutes of practice",
    fields: ["target_value", "deadline"],
    targetLabel: "Total minutes",
    targetPlaceholder: "600",
    unit: "minutes",
  },
  {
    value: "session_count",
    label: "📋 Session count",
    description: "Complete N practice sessions",
    fields: ["target_value", "deadline"],
    targetLabel: "Number of sessions",
    targetPlaceholder: "20",
    unit: "sessions",
  },
  {
    value: "bpm_target",
    label: "🎵 BPM target",
    description: "Reach a target tempo on a piece",
    fields: ["target_value", "piece_id"],
    targetLabel: "Target BPM",
    targetPlaceholder: "120",
    unit: "BPM",
  },
  {
    value: "custom",
    label: "✏️ Custom",
    description: "Set any goal and track it manually",
    fields: ["target_value", "unit"],
    targetLabel: "Target value",
    targetPlaceholder: "100",
    unit: "",
  },
];

const TYPE_MAP = Object.fromEntries(GOAL_TYPES.map((t) => [t.value, t]));

function progressColor(p) {
  if (p >= 100) return "#22D3EE";
  if (p >= 66) return "#38BDF8";
  if (p >= 33) return "#0EA5E9";
  return "#1e3a4a";
}

function GoalCard({ goal, onEdit, onComplete, onDelete }) {
  const current = goal.computed_current ?? goal.current_value ?? 0;
  const target = goal.computed_target ?? goal.target_value ?? 1;
  const p = Math.min(100, Math.round((current / target) * 100));
  const typeInfo = TYPE_MAP[goal.type];
  const isDone = p >= 100;

  return (
    <div
      className={`card group transition-all ${isDone ? "border-green-200 bg-green-50/30" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{typeInfo?.label.split(" ")[0]}</span>
            <h3 className="text-sm font-medium text-stone-800">{goal.title}</h3>
            {isDone && (
              <span
                style={{
                  fontSize: 11,
                  background: "rgba(34,211,238,0.12)",
                  color: "#22D3EE",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontWeight: 500,
                }}
              >
                Complete!
              </span>
            )}
          </div>
          {goal.description && (
            <p className="text-xs text-stone-400 mt-0.5">{goal.description}</p>
          )}
        </div>
        <div className="flex gap-3 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="text-stone-400 hover:text-stone-700 text-sm touch-manipulation p-1"
          >
            ✏
          </button>
          {!isDone && (
            <button
              onClick={onComplete}
              className="text-stone-400 hover:text-green-600 text-sm touch-manipulation p-1"
            >
              ✓
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-stone-400 hover:text-red-500 text-sm touch-manipulation p-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 mb-2">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-stone-500 font-medium">
            {current} / {target} {goal.unit || typeInfo?.unit || ""}
          </span>
          <span className="font-medium" style={{ color: progressColor(p) }}>
            {p}%
          </span>
        </div>
        <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${p}%`, background: progressColor(p) }}
          />
        </div>
      </div>

      {goal.progress_label && (
        <p className="text-xs text-stone-400 mt-1">{goal.progress_label}</p>
      )}

      <div className="flex items-center gap-3 mt-2">
        {goal.deadline && (
          <span className="text-xs text-stone-300">
            Due {formatDate(goal.deadline)}
          </span>
        )}
        {goal.start_date && (
          <span className="text-xs text-stone-300">
            Started {formatDate(goal.start_date)}
          </span>
        )}
      </div>
    </div>
  );
}

function GoalModal({ goal, pieces, onClose, onSaved }) {
  const [selectedType, setSelectedType] = useState(goal?.type || null);
  const [form, setForm] = useState(
    goal
      ? {
          title: goal.title,
          description: goal.description || "",
          type: goal.type,
          target_value: goal.target_value || "",
          secondary_value: goal.secondary_value || "",
          unit: goal.unit || "",
          piece_id: goal.piece_id || "",
          deadline: goal.deadline || "",
          start_date: goal.start_date || "",
        }
      : {
          title: "",
          description: "",
          type: "",
          target_value: "",
          secondary_value: "",
          unit: "",
          piece_id: "",
          deadline: "",
          start_date: new Date().toISOString().split("T")[0],
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const typeInfo = selectedType ? TYPE_MAP[selectedType] : null;

  const selectType = (type) => {
    const t = TYPE_MAP[type];
    setSelectedType(type);
    setForm((f) => ({ ...f, type, unit: t?.unit || "" }));
  };

  const handleSave = async () => {
    if (!form.title) {
      setError("Title is required");
      return;
    }
    if (!form.type) {
      setError("Please select a goal type");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        target_value: form.target_value ? Number(form.target_value) : null,
        secondary_value: form.secondary_value
          ? Number(form.secondary_value)
          : null,
        piece_id: form.piece_id || null,
        deadline: form.deadline || null,
      };
      goal?.id
        ? await goalsApi.update(goal.id, payload)
        : await goalsApi.create(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save goal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[95vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-display text-xl">
            {goal ? "Edit goal" : "New goal"}
          </h2>
          <button onClick={onClose} className="text-stone-400 text-2xl p-1">
            ×
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Goal type picker */}
          {!goal && (
            <div>
              <label className="label">What kind of goal?</label>
              <div className="grid grid-cols-1 gap-2">
                {GOAL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => selectType(t.value)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all touch-manipulation ${
                      selectedType === t.value
                        ? "border-amber-400 bg-amber-50 text-amber-800"
                        : "border-stone-200 hover:border-stone-300 text-stone-700"
                    }`}
                  >
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      {t.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          {(selectedType || goal) && (
            <>
              <div>
                <label className="label">Goal title</label>
                <input
                  className="input"
                  placeholder={typeInfo?.description || "Describe your goal"}
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>

              {/* Type-specific fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    {typeInfo?.targetLabel || "Target"}
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder={typeInfo?.targetPlaceholder || "10"}
                    value={form.target_value}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, target_value: e.target.value }))
                    }
                  />
                </div>

                {typeInfo?.fields.includes("secondary_value") && (
                  <div>
                    <label className="label">
                      {typeInfo?.secondaryLabel || "For N days"}
                    </label>
                    <input
                      type="number"
                      className="input"
                      placeholder={typeInfo?.secondaryPlaceholder || "10"}
                      value={form.secondary_value}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          secondary_value: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}

                {typeInfo?.fields.includes("unit") && (
                  <div>
                    <label className="label">Unit</label>
                    <input
                      className="input"
                      placeholder="sessions, pages, etc."
                      value={form.unit}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, unit: e.target.value }))
                      }
                    />
                  </div>
                )}
              </div>

              {typeInfo?.fields.includes("piece_id") && pieces.length > 0 && (
                <div>
                  <label className="label">Which piece?</label>
                  <select
                    className="input"
                    value={form.piece_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, piece_id: e.target.value }))
                    }
                  >
                    <option value="">Select a piece...</option>
                    {pieces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {p.composer}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {typeInfo?.fields.includes("deadline") && (
                <div>
                  <label className="label">Deadline (optional)</label>
                  <input
                    type="date"
                    className="input"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, deadline: e.target.value }))
                    }
                  />
                </div>
              )}

              <div>
                <label className="label">Notes (optional)</label>
                <input
                  className="input"
                  placeholder="Any extra context..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div
          className="px-5 py-4 border-t border-stone-100 flex gap-3"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!selectedType && !goal)}
            className="btn-primary disabled:opacity-40 flex-1 text-center"
          >
            {saving ? "Saving..." : "Save goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [done, setDone] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => {
    Promise.all([
      goalsApi.list({ completed: false }),
      goalsApi.list({ completed: true }),
      piecesApi.list(),
    ])
      .then(([a, c, p]) => {
        setGoals(a.data.data || []);
        setDone(c.data.data || []);
        setPieces(p.data.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleComplete = async (id) => {
    await goalsApi.complete(id);
    load();
  };
  const handleDelete = async (id) => {
    if (!confirm("Delete this goal?")) return;
    await goalsApi.delete(id);
    load();
  };

  return (
    <div className="page-container space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-stone-900">Goals</h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Progress auto-calculates from your sessions
          </p>
        </div>
        <button onClick={() => setModal("add")} className="btn-primary">
          + New
        </button>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Loading...</p>
      ) : (
        <>
          {goals.length === 0 ? (
            <div className="card text-center py-10 space-y-3">
              <p className="text-3xl">🎯</p>
              <p className="text-stone-600 font-medium">No active goals</p>
              <p className="text-stone-400 text-sm">
                Set a streak, weekly target, BPM goal, and more
              </p>
              <button
                onClick={() => setModal("add")}
                className="btn-primary mx-auto"
              >
                Set your first goal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onEdit={() => setModal(g)}
                  onComplete={() => handleComplete(g.id)}
                  onDelete={() => handleDelete(g.id)}
                />
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-stone-400 mb-3">
                Completed ({done.length})
              </h2>
              <div className="space-y-2">
                {done.slice(0, 5).map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 py-2.5 px-4 bg-stone-50 rounded-xl border border-stone-100"
                  >
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-stone-400 line-through flex-1 truncate">
                      {g.title}
                    </span>
                    <span className="text-xs text-stone-300 flex-shrink-0">
                      {formatDate(g.completed_at?.split("T")[0])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <GoalModal
          goal={modal === "add" ? null : modal}
          pieces={pieces}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
