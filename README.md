# 🎹 ScaleUp!
**piano.andrewfbutler.com** — Piano practice tracker

Stack: React + Vite (Netlify) · Express (Render) · Supabase (PostgreSQL)

---

## Quick Start

```bash
# Clone and install both sides
cd server && npm install
cd ../client && npm install
```

---

## 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `schema.sql` from the repo root
3. Go to **Storage** → Create bucket named `piano-uploads` (private)
4. Copy your **Project URL** and **service_role key** (Settings → API)

---

## 2. Server Setup

```bash
cd server
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJh...
JWT_SECRET=some-long-random-string
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

Generate your PIN hash:
```bash
node -e "const b=require('bcryptjs'); b.hash('YOUR_PIN', 12).then(h => { console.log('PIN_HASH=' + h); process.exit() })"
```
Add `PIN_HASH=...` to your `.env`.

```bash
npm run dev   # starts on :3001
```

---

## 3. Client Setup

```bash
cd client
cp .env.example .env
# .env is just: VITE_API_URL=http://localhost:3001 for local dev
# (Vite proxy handles /api → :3001 in dev, so .env not needed locally)
npm run dev   # starts on :5173
```

Open [http://localhost:5173](http://localhost:5173) and enter your PIN.

---

## Deployment

### Render (Backend)
1. Connect GitHub repo
2. New Web Service → root dir: `server/`
3. Build command: `npm install`
4. Start command: `node src/index.js`
5. Add all env vars from `.env.example` (plus PIN_HASH, with prod CLIENT_ORIGIN)

### Netlify (Frontend)
1. Connect GitHub repo
2. Base dir: `client/`
3. Build command: `npm run build`
4. Publish dir: `dist/`
5. Add env var: `VITE_API_URL=https://your-app.onrender.com`
6. Custom domain: `piano.andrewfbutler.com`
   - In Netlify: Domains → Add custom domain
   - In your Netlify DNS (since andrewfbutler.com is on Netlify): Add CNAME `piano` → your Netlify app URL

---

## Project Structure

```
scaleup/
├── schema.sql              # Run in Supabase SQL editor
├── server/
│   ├── src/
│   │   ├── index.js        # Express entry point
│   │   ├── db/supabase.js  # Supabase client
│   │   ├── middleware/auth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── sessions.js
│   │       ├── pieces.js
│   │       ├── goals.js
│   │       ├── stats.js
│   │       └── uploads.js
│   └── .env.example
└── client/
    ├── src/
    │   ├── App.jsx
    │   ├── api/            # Axios + resource modules
    │   ├── context/        # AuthContext
    │   ├── pages/          # Dashboard, Sessions, Repertoire, Goals, Stats
    │   ├── components/     # LogSessionModal, AppShell
    │   └── utils/          # formatDuration, constants, helpers
    └── netlify.toml
```

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login with PIN → JWT |
| GET | `/api/sessions` | List sessions |
| POST | `/api/sessions` | Log a session |
| GET | `/api/sessions/today` | Today's sessions |
| GET | `/api/pieces` | Repertoire list |
| POST | `/api/pieces` | Add piece |
| GET | `/api/goals` | Goals list |
| POST | `/api/goals/:id/complete` | Mark complete |
| GET | `/api/stats/summary` | Overview stats |
| GET | `/api/stats/streak` | Current + best streak |
| GET | `/api/stats/heatmap` | Day-by-day minutes |
| GET | `/api/stats/by-type` | Minutes per practice type |
| GET | `/api/stats/by-piece` | Minutes per piece |
| GET | `/api/stats/weekly` | Last 12 weeks |
| POST | `/api/uploads` | Upload file to Supabase Storage |

All routes except `/api/auth/login` require `Authorization: Bearer <token>`.
