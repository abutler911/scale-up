import { useEffect, useState } from "react";
import { goalsApi, piecesApi } from "../api/resources.js";
import { GOAL_TYPES, pct, formatDate } from "../utils/index.js";

function GoalModal({ goal, pieces, onClose, onSaved }) {
  const [form, setForm] = useState(
    goal || {
      title: "",
      description: "",
      type: "session_count",
      target_value: "",
      unit: "sessions",
      piece_id: "",
      deadline: "",
    },
  );
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (type) => {
    const t = GOAL_TYPES.find((x) => x.value === type);
    setForm((f) => ({ ...f, type, unit: t?.unit || "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      goal?.id
        ? await goalsApi.update(goal.id, form)
        : await goalsApi.create({
            ...form,
            target_value: Number(form.target_value),
          });
      onSaved();
      onClose();
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
        className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md shadow-xl overflow-y-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-display text-xl">
            {goal ? "Edit goal" : "New goal"}
          </h2>
          <button onClick={onClose} className="text-stone-400 text-xl p-1">
            ×
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Goal title *</label>
            <input
              className="input"
              placeholder="Practice 30 days in a row"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                {GOAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Target</label>
              <input
                type="number"
                className="input"
                placeholder="30"
                value={form.target_value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target_value: e.target.value }))
                }
              />
            </div>
          </div>
          {(form.type === "bpm_target" || form.type === "piece_status") && (
            <div>
              <label className="label">Linked piece</label>
              <select
                className="input"
                value={form.piece_id || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, piece_id: e.target.value || null }))
                }
              >
                <option value="">None</option>
                {pieces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Deadline (optional)</label>
            <input
              type="date"
              className="input"
              value={form.deadline || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, deadline: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-stone-100 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title}
            className="btn-primary disabled:opacity-50"
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
        <h1 className="font-display text-2xl text-stone-900">Goals</h1>
        <button onClick={() => setModal("add")} className="btn-primary">
          + New
        </button>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Loading...</p>
      ) : (
        <>
          {goals.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-stone-400 text-sm">No active goals yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => {
                const p = pct(g.current_value, g.target_value);
                return (
                  <div key={g.id} className="card group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-stone-800">
                          {g.title}
                        </h3>
                        {g.piece && (
                          <p className="text-xs text-stone-400 mt-0.5">
                            {g.piece.title}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3 flex-shrink-0">
                        <button
                          onClick={() => setModal(g)}
                          className="text-stone-300 hover:text-stone-600 text-sm touch-manipulation"
                        >
                          ✏
                        </button>
                        <button
                          onClick={() => handleComplete(g.id)}
                          className="text-stone-300 hover:text-green-600 text-sm touch-manipulation"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="text-stone-300 hover:text-red-500 text-sm touch-manipulation"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                        <span>
                          {g.current_value} / {g.target_value} {g.unit}
                        </span>
                        <span
                          className={`font-medium ${p >= 100 ? "text-green-600" : "text-amber-600"}`}
                        >
                          {p}%
                        </span>
                      </div>
                      <div className="progress-bar h-2">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${p}%`,
                            background: p >= 100 ? "#639922" : "#BA7517",
                          }}
                        />
                      </div>
                    </div>
                    {g.deadline && (
                      <p className="text-xs text-stone-300 mt-2">
                        Due {formatDate(g.deadline)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-stone-400 mb-3">
                Completed
              </h2>
              <div className="space-y-2">
                {done.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 py-2.5 px-4 bg-stone-50 rounded-xl border border-stone-100"
                  >
                    <span className="text-green-500 text-sm">✓</span>
                    <span className="text-sm text-stone-400 line-through flex-1">
                      {g.title}
                    </span>
                    <span className="text-xs text-stone-300">
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
