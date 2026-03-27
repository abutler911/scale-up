import { useState } from "react";
import { sessionsApi, piecesApi } from "../../api/resources.js";
import {
  PRACTICE_TYPES,
  PRACTICE_LABELS,
  FEEL_EMOJI,
  formatDuration,
  formatDate,
  formatSeconds,
} from "../../utils/index.js";

export default function SessionDetailModal({
  session,
  pieces,
  onClose,
  onSaved,
  onDeleted,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    date: session.date || "",
    duration_minutes: session.duration_minutes || "",
    practice_types: session.practice_types || [],
    pieces_practiced: session.pieces_practiced || [],
    starting_bpm: session.starting_bpm || "",
    ending_bpm: session.ending_bpm || "",
    target_bpm: session.target_bpm || "",
    overall_feel: session.overall_feel || null,
    notes: session.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleType = (t) =>
    setForm((f) => ({
      ...f,
      practice_types: f.practice_types.includes(t)
        ? f.practice_types.filter((x) => x !== t)
        : [...f.practice_types, t],
    }));
  const togglePiece = (id) =>
    setForm((f) => ({
      ...f,
      pieces_practiced: f.pieces_practiced.includes(id)
        ? f.pieces_practiced.filter((x) => x !== id)
        : [...f.pieces_practiced, id],
    }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await sessionsApi.update(session.id, {
        ...form,
        duration_minutes: Number(form.duration_minutes),
        starting_bpm: form.starting_bpm ? Number(form.starting_bpm) : null,
        ending_bpm: form.ending_bpm ? Number(form.ending_bpm) : null,
        target_bpm: form.target_bpm ? Number(form.target_bpm) : null,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await sessionsApi.delete(session.id);
    onDeleted?.();
    onClose();
  };

  const activePieces = (pieces || []).filter((p) => p.status !== "shelved");

  // View mode
  const ViewMode = () => (
    <div className="px-5 py-5 space-y-5">
      {/* Date + Duration hero */}
      <div className="bg-stone-50 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">
            Date
          </p>
          <p className="text-lg font-medium text-stone-900">
            {formatDate(session.date)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">
            Duration
          </p>
          <p className="text-lg font-medium text-stone-900">
            {formatDuration(session.duration_minutes)}
          </p>
        </div>
        {session.overall_feel && (
          <div className="text-3xl">{FEEL_EMOJI[session.overall_feel]}</div>
        )}
      </div>

      {/* Practice types */}
      {session.practice_types?.length > 0 && (
        <div>
          <p className="label">Practice types</p>
          <div className="flex flex-wrap gap-2">
            {session.practice_types.map((t) => (
              <span key={t} className="chip chip-active pointer-events-none">
                {PRACTICE_LABELS[t] || t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pieces */}
      {session.pieces_practiced?.length > 0 && (
        <div>
          <p className="label">Pieces practiced</p>
          <div className="flex flex-wrap gap-2">
            {session.pieces_practiced.map((id) => {
              const piece = (pieces || []).find((p) => p.id === id);
              return piece ? (
                <span key={id} className="chip chip-active pointer-events-none">
                  {piece.title}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* BPM */}
      {(session.starting_bpm || session.ending_bpm || session.target_bpm) && (
        <div>
          <p className="label">BPM</p>
          <div className="flex gap-4">
            {session.starting_bpm && (
              <div className="stat-card flex-1 text-center">
                <p className="text-xs text-stone-400 mb-0.5">Start</p>
                <p className="text-xl font-medium">{session.starting_bpm}</p>
              </div>
            )}
            {session.ending_bpm && (
              <div className="stat-card flex-1 text-center">
                <p className="text-xs text-stone-400 mb-0.5">End</p>
                <p className="text-xl font-medium text-amber-500">
                  {session.ending_bpm}
                </p>
              </div>
            )}
            {session.target_bpm && (
              <div className="stat-card flex-1 text-center">
                <p className="text-xs text-stone-400 mb-0.5">Target</p>
                <p className="text-xl font-medium text-stone-400">
                  {session.target_bpm}
                </p>
              </div>
            )}
          </div>
          {session.starting_bpm && session.ending_bpm && (
            <p className="text-xs text-stone-400 mt-2 text-center">
              +{session.ending_bpm - session.starting_bpm} BPM this session
              {session.target_bpm &&
                ` · ${session.target_bpm - session.ending_bpm} BPM to go`}
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div>
          <p className="label">Notes</p>
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {session.notes}
            </p>
          </div>
        </div>
      )}

      {!session.notes &&
        !session.practice_types?.length &&
        !session.starting_bpm && (
          <p className="text-stone-400 text-sm text-center py-2">
            No additional details logged.
          </p>
        )}
    </div>
  );

  // Edit mode
  const EditMode = () => (
    <div className="px-5 py-5 space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Duration (min)</label>
          <input
            type="number"
            className="input"
            value={form.duration_minutes}
            onChange={(e) =>
              setForm((f) => ({ ...f, duration_minutes: e.target.value }))
            }
          />
        </div>
      </div>

      <div>
        <label className="label">Practice types</label>
        <div className="flex flex-wrap gap-2">
          {PRACTICE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              className={`chip ${form.practice_types.includes(t) ? "chip-active" : ""}`}
            >
              {PRACTICE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {activePieces.length > 0 && (
        <div>
          <label className="label">Pieces practiced</label>
          <div className="flex flex-wrap gap-2">
            {activePieces.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePiece(p.id)}
                className={`chip ${form.pieces_practiced.includes(p.id) ? "chip-active" : ""}`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Start BPM</label>
          <input
            type="number"
            className="input"
            placeholder="60"
            value={form.starting_bpm}
            onChange={(e) =>
              setForm((f) => ({ ...f, starting_bpm: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="label">End BPM</label>
          <input
            type="number"
            className="input"
            placeholder="72"
            value={form.ending_bpm}
            onChange={(e) =>
              setForm((f) => ({ ...f, ending_bpm: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="label">Target BPM</label>
          <input
            type="number"
            className="input"
            placeholder="80"
            value={form.target_bpm}
            onChange={(e) =>
              setForm((f) => ({ ...f, target_bpm: e.target.value }))
            }
          />
        </div>
      </div>

      <div>
        <label className="label">How'd it feel?</label>
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  overall_feel: f.overall_feel === n ? null : n,
                }))
              }
              className={`text-3xl transition-transform touch-manipulation active:scale-90 ${form.overall_feel === n ? "scale-125" : "opacity-50"}`}
            >
              {FEEL_EMOJI[n]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          className="input resize-none"
          rows={4}
          placeholder="What clicked? What to work on next time..."
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[95vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-display text-xl">
            {editing ? "Edit session" : "Session details"}
          </h2>
          <div className="flex items-center gap-3">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-amber-600 font-medium touch-manipulation"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-stone-400 text-2xl leading-none p-1 touch-manipulation"
            >
              ×
            </button>
          </div>
        </div>

        {editing ? <EditMode /> : <ViewMode />}

        {/* Footer */}
        <div
          className="px-5 py-4 border-t border-stone-100"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          {editing ? (
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 text-center disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              {confirmDelete ? (
                <>
                  <p className="text-xs text-stone-500 flex-1 self-center">
                    Delete this session?
                  </p>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="btn-ghost text-sm px-3"
                  >
                    No
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm text-stone-400 hover:text-red-500 transition-colors touch-manipulation py-2"
                  >
                    Delete session
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-primary flex-1 text-center"
                  >
                    Edit session
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
