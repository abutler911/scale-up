import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

// Auto-calculate progress for a goal based on real session data
async function calculateProgress(goal, sessions) {
  const now = new Date();
  const startDate = goal.start_date
    ? new Date(goal.start_date)
    : new Date(goal.created_at);

  // Helper: unique practice days in a date range
  const practiceDays = (from, to) => {
    const fromStr = from.toISOString().split("T")[0];
    const toStr = to.toISOString().split("T")[0];
    const days = sessions
      .filter((s) => s.date >= fromStr && s.date <= toStr)
      .map((s) => s.date);
    return [...new Set(days)];
  };

  // Helper: streak from most recent day backwards
  const calcStreak = () => {
    const uniqueDates = [...new Set(sessions.map((s) => s.date))]
      .sort()
      .reverse();
    const today = now.toISOString().split("T")[0];
    const yesterday = new Date(now - 86400000).toISOString().split("T")[0];
    if (
      !uniqueDates[0] ||
      (uniqueDates[0] !== today && uniqueDates[0] !== yesterday)
    )
      return 0;
    let streak = 0;
    let check = new Date(uniqueDates[0]);
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(check);
      expected.setDate(expected.getDate() - i);
      if (uniqueDates.includes(expected.toISOString().split("T")[0])) streak++;
      else break;
    }
    return streak;
  };

  switch (goal.type) {
    case "streak_days":
      return { current: calcStreak(), target: goal.target_value };

    case "days_per_week": {
      // Current week Mon–Sun
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek + 1);
      weekStart.setHours(0, 0, 0, 0);
      const days = practiceDays(weekStart, now);
      return { current: days.length, target: goal.target_value };
    }

    case "minutes_per_day": {
      // How many days in the window have hit the daily target
      const windowDays = goal.secondary_value || 7;
      const windowStart = new Date(startDate);
      const daysBetween = Math.ceil((now - windowStart) / 86400000);
      let qualifyingDays = 0;
      for (let i = 0; i < Math.min(daysBetween, windowDays); i++) {
        const d = new Date(windowStart);
        d.setDate(d.getDate() + i);
        const dStr = d.toISOString().split("T")[0];
        const dayMins = sessions
          .filter((s) => s.date === dStr)
          .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        if (dayMins >= goal.target_value) qualifyingDays++;
      }
      return {
        current: qualifyingDays,
        target: windowDays,
        label: `${goal.target_value}+ min/day for ${windowDays} days`,
      };
    }

    case "total_minutes": {
      const endDate = goal.deadline ? new Date(goal.deadline) : now;
      const total = sessions
        .filter(
          (s) =>
            s.date >= startDate.toISOString().split("T")[0] &&
            s.date <= endDate.toISOString().split("T")[0],
        )
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      return { current: total, target: goal.target_value };
    }

    case "session_count": {
      const endDate = goal.deadline ? new Date(goal.deadline) : now;
      const count = sessions.filter(
        (s) =>
          s.date >= startDate.toISOString().split("T")[0] &&
          s.date <= endDate.toISOString().split("T")[0],
      ).length;
      return { current: count, target: goal.target_value };
    }

    case "bpm_target":
      // current_value is manually updated on the piece
      return { current: goal.current_value || 0, target: goal.target_value };

    case "piece_status":
      return { current: goal.current_value || 0, target: 1 };

    default:
      return { current: goal.current_value || 0, target: goal.target_value };
  }
}

// GET /api/goals — with auto-calculated progress
router.get("/", async (req, res) => {
  const { completed } = req.query;

  let query = supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });
  if (completed !== undefined)
    query = query.eq("completed", completed === "true");

  const [{ data: goals, error }, { data: sessions, error: se }] =
    await Promise.all([
      query,
      supabase
        .from("sessions")
        .select("date, duration_minutes, practice_types"),
    ]);

  if (error || se)
    return res.status(500).json({ error: (error || se).message });

  // Enrich each goal with computed progress
  const enriched = await Promise.all(
    goals.map(async (g) => {
      const progress = await calculateProgress(g, sessions);
      return {
        ...g,
        computed_current: progress.current,
        computed_target: progress.target,
        progress_label: progress.label,
      };
    }),
  );

  res.json({ data: enriched });
});

// POST /api/goals
router.post("/", async (req, res) => {
  const {
    title,
    description,
    type,
    target_value,
    secondary_value,
    unit,
    piece_id,
    deadline,
    period,
    start_date,
  } = req.body;
  if (!title || !type)
    return res.status(400).json({ error: "title and type required" });

  const { data, error } = await supabase
    .from("goals")
    .insert([
      {
        title,
        description,
        type,
        target_value: target_value ? Number(target_value) : null,
        secondary_value: secondary_value ? Number(secondary_value) : null,
        current_value: 0,
        unit,
        piece_id: piece_id || null,
        deadline: deadline || null,
        period: period || "total",
        start_date: start_date || new Date().toISOString().split("T")[0],
      },
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/goals/:id
router.put("/:id", async (req, res) => {
  const allowed = [
    "title",
    "description",
    "type",
    "target_value",
    "secondary_value",
    "current_value",
    "unit",
    "piece_id",
    "deadline",
    "completed",
    "period",
    "start_date",
  ];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k)),
  );

  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/goals/:id/complete
router.post("/:id/complete", async (req, res) => {
  const { data, error } = await supabase
    .from("goals")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/goals/:id
router.delete("/:id", async (req, res) => {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
