import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/sessions.js";
import pieceRoutes from "./routes/pieces.js";
import goalRoutes from "./routes/goals.js";
import statsRoutes from "./routes/stats.js";
import uploadRoutes from "./routes/uploads.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_ORIGIN_ALT,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", app: "ScaleUp!", ts: new Date().toISOString() }),
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/pieces", pieceRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/uploads", uploadRoutes);

// 404
app.use((req, res) =>
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }),
);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🎹 ScaleUp! server running on port ${PORT}`);
});
