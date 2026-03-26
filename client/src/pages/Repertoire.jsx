import { useEffect, useState } from "react";
import { piecesApi } from "../api/resources.js";
import { PIECE_STATUSES, formatDate } from "../utils/index.js";

const KANBAN_COLS = PIECE_STATUSES.filter((s) => s.value !== "shelved");

const COL_STYLES = {
  learning: { border: "border-blue-300", text: "text-blue-600" },
  polishing: { border: "border-amber-300", text: "text-amber-600" },
  performance_ready: { border: "border-green-300", text: "text-green-600" },
  mastered: { border: "border-purple-300", text: "text-purple-600" },
};

function PieceModal({ piece, onClose, onSaved }) {
  const [form, setForm] = useState(
    piece || {
      title: "",
      composer: "",
      genre: "",
      difficulty: "",
      status: "learning",
      date_started: "",
      target_bpm: "",
      current_bpm: "",
      notes: "",
    },
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      piece?.id
        ? await piecesApi.update(piece.id, form)
        : await piecesApi.create(form);
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
        className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-display text-xl">
            {piece ? "Edit piece" : "Add piece"}
          </h2>
          <button onClick={onClose} className="text-stone-400 text-xl p-1">
            ×
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              placeholder="Clair de Lune"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Composer</label>
              <input
                className="input"
                placeholder="Debussy"
                value={form.composer || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, composer: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                {PIECE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Current BPM</label>
              <input
                type="number"
                className="input"
                placeholder="60"
                value={form.current_bpm || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, current_bpm: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Target BPM</label>
              <input
                type="number"
                className="input"
                placeholder="80"
                value={form.target_bpm || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target_bpm: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label className="label">Date started</label>
            <input
              type="date"
              className="input"
              value={form.date_started || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, date_started: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.notes || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
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
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Repertoire() {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () =>
    piecesApi
      .list()
      .then((r) => setPieces(r.data.data || []))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const byStatus = (status) => pieces.filter((p) => p.status === status);
  const handleDelete = async (id) => {
    if (!confirm("Delete this piece?")) return;
    await piecesApi.delete(id);
    load();
  };

  return (
    <div className="page-container space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-stone-900">Repertoire</h1>
        <button onClick={() => setModal("add")} className="btn-primary">
          + Add
        </button>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Loading...</p>
      ) : (
        /* Horizontal scroll on mobile, grid on desktop */
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div
            className="flex gap-3 md:grid md:grid-cols-4 md:gap-4"
            style={{ minWidth: "600px" }}
          >
            {KANBAN_COLS.map((col) => {
              const s = COL_STYLES[col.value];
              return (
                <div
                  key={col.value}
                  className="w-44 md:w-auto flex-shrink-0 md:flex-shrink"
                >
                  <div
                    className={`text-xs font-medium uppercase tracking-wider mb-3 pb-2 border-b-2 ${s.text} ${s.border}`}
                  >
                    {col.label}
                    <span className="ml-1.5 text-stone-300 font-normal normal-case tracking-normal">
                      {byStatus(col.value).length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {byStatus(col.value).map((p) => (
                      <div
                        key={p.id}
                        className="bg-white border border-stone-200 rounded-xl p-3 group active:scale-[0.98] transition-transform touch-manipulation"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-medium text-stone-800 leading-snug">
                            {p.title}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setModal(p)}
                              className="text-stone-400 hover:text-stone-700 text-xs p-0.5 touch-manipulation"
                            >
                              ✏
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-stone-400 hover:text-red-500 text-xs p-0.5 touch-manipulation"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        {p.composer && (
                          <p className="text-xs text-stone-400 mt-0.5">
                            {p.composer}
                          </p>
                        )}
                        {(p.current_bpm || p.target_bpm) && (
                          <div className="mt-2 text-xs text-stone-500 bg-stone-50 rounded-lg px-2 py-1 inline-block">
                            {p.current_bpm && <span>{p.current_bpm}</span>}
                            {p.current_bpm && p.target_bpm && (
                              <span className="text-stone-300 mx-1">/</span>
                            )}
                            {p.target_bpm && (
                              <span className="text-stone-400">
                                {p.target_bpm}
                              </span>
                            )}
                            <span className="text-stone-300 ml-0.5"> BPM</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {byStatus(col.value).length === 0 && (
                      <p className="text-xs text-stone-300 text-center py-4">
                        Empty
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pieces.filter((p) => p.status === "shelved").length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-stone-400 mb-3">Shelved</h3>
          <div className="flex flex-wrap gap-2">
            {pieces
              .filter((p) => p.status === "shelved")
              .map((p) => (
                <div
                  key={p.id}
                  className="text-xs text-stone-400 bg-stone-50 border border-stone-100 rounded-lg px-3 py-1.5"
                >
                  {p.title}
                  {p.composer && ` — ${p.composer}`}
                </div>
              ))}
          </div>
        </div>
      )}

      {modal && (
        <PieceModal
          piece={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
