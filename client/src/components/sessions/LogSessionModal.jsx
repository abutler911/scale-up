import { useState, useEffect, useRef } from "react";
import { sessionsApi, piecesApi } from "../../api/resources.js";
import {
  PRACTICE_TYPES,
  PRACTICE_LABELS,
  FEEL_EMOJI,
  todayStr,
  formatSeconds,
} from "../../utils/index.js";

const TIMER_KEY = "scaleup_timer_start";

export default function LogSessionModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    date: todayStr(),
    duration_minutes: "",
    practice_types: [],
    pieces_practiced: [],
    starting_bpm: "",
    ending_bpm: "",
    target_bpm: "",
    overall_feel: null,
    notes: "",
  });
  const [pieces, setPieces] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    piecesApi.list().then((r) => setPieces(r.data.data || []));

    // Restore timer if it was running before app went to background
    const savedStart = localStorage.getItem(TIMER_KEY);
    if (savedStart) {
      const elapsed = Math.floor((Date.now() - Number(savedStart)) / 1000);
      setTimerSeconds(elapsed);
      setTimerRunning(true);
      intervalRef.current = setInterval(() => {
        setTimerSeconds(Math.floor((Date.now() - Number(savedStart)) / 1000));
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, []);

  const startTimer = () => {
    const startTime = Date.now();
    localStorage.setItem(TIMER_KEY, startTime);
    setTimerRunning(true);
    intervalRef.current = setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    setTimerRunning(false);
    // Save elapsed seconds so we can resume correctly
    localStorage.setItem(TIMER_KEY + "_paused", timerSeconds);
    localStorage.removeItem(TIMER_KEY);
    setForm((f) => ({ ...f, duration_minutes: Math.ceil(timerSeconds / 60) }));
  };

  const resumeTimer = () => {
    const pausedSeconds = Number(
      localStorage.getItem(TIMER_KEY + "_paused") || 0,
    );
    const startTime = Date.now() - pausedSeconds * 1000;
    localStorage.setItem(TIMER_KEY, startTime);
    localStorage.removeItem(TIMER_KEY + "_paused");
    setTimerRunning(true);
    intervalRef.current = setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  const toggleTimer = () => {
    if (timerRunning) {
      pauseTimer();
    } else if (timerSeconds > 0) {
      resumeTimer();
    } else {
      startTimer();
    }
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerSeconds(0);
    localStorage.removeItem(TIMER_KEY);
    localStorage.removeItem(TIMER_KEY + "_paused");
    setForm((f) => ({ ...f, duration_minutes: "" }));
  };

  const handleClose = () => {
    // Don't clear timer on close — let it keep running in background
    clearInterval(intervalRef.current);
    onClose();
  };

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
    if (!form.duration_minutes) {
      setError("Duration is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await sessionsApi.create({
        ...form,
        duration_minutes: Number(form.duration_minutes),
        starting_bpm: form.starting_bpm ? Number(form.starting_bpm) : null,
        ending_bpm: form.ending_bpm ? Number(form.ending_bpm) : null,
        target_bpm: form.target_bpm ? Number(form.target_bpm) : null,
      });
      // Clear timer storage on successful save
      localStorage.removeItem(TIMER_KEY);
      localStorage.removeItem(TIMER_KEY + "_paused");
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  const activePieces = pieces.filter((p) => p.status !== "shelved");

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[95vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#252525] rounded-full" />
        </div>

        <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
          <h2 className="font-display text-xl">Log a session</h2>
          <button
            onClick={handleClose}
            className="text-[#555] text-2xl leading-none p-1 touch-manipulation"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Timer */}
          <div className="bg-[#141414] rounded-2xl p-4 text-center">
            <div
              className={`text-5xl font-mono font-medium tracking-tight mb-1 ${timerRunning ? "text-[#38BDF8]" : "text-[#f0f0f0]"}`}
            >
              {formatSeconds(timerSeconds)}
            </div>
            {timerRunning && (
              <p className="text-xs text-[#555] mb-3">
                Timer keeps running if you close this
              </p>
            )}
            {!timerRunning && timerSeconds === 0 && (
              <p className="text-xs text-[#555] mb-3">
                Start to track your session in real time
              </p>
            )}
            {!timerRunning && timerSeconds > 0 && (
              <p className="text-xs text-[#38BDF8] mb-3">
                Paused — {Math.ceil(timerSeconds / 60)} min logged
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={toggleTimer}
                className={`btn-primary px-6 ${timerRunning ? "bg-[#ef4444] hover:bg-[#dc2626]" : ""}`}
              >
                {timerRunning
                  ? "⏸ Pause"
                  : timerSeconds > 0
                    ? "▶ Resume"
                    : "▶ Start timer"}
              </button>
              {timerSeconds > 0 && !timerRunning && (
                <button onClick={resetTimer} className="btn-ghost px-4">
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input
                type="number"
                className="input"
                placeholder="45"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration_minutes: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Practice types */}
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

          {/* Pieces */}
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

          {/* BPM */}
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

          {/* Feel */}
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

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What clicked? What to work on next time..."
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>

          {error && <p className="text-[#f87171] text-sm">{error}</p>}
        </div>

        <div
          className="px-5 py-4 border-t border-[#222] flex gap-3 justify-end"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          <button onClick={handleClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50 flex-1 md:flex-none text-center"
          >
            {saving ? "Saving..." : "Save session"}
          </button>
        </div>
      </div>
    </div>
  );
}
