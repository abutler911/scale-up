-- ScaleUp! Supabase Schema
-- Run this in the Supabase SQL editor to set up your database

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL,
  practice_types TEXT[] NOT NULL DEFAULT '{}',
  pieces_practiced UUID[] NOT NULL DEFAULT '{}',
  starting_bpm INTEGER,
  ending_bpm INTEGER,
  target_bpm INTEGER,
  overall_feel INTEGER CHECK (overall_feel BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pieces (Repertoire)
CREATE TABLE IF NOT EXISTS pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  composer TEXT,
  arranger TEXT,
  genre TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 10),
  status TEXT NOT NULL DEFAULT 'learning'
    CHECK (status IN ('learning','polishing','performance_ready','mastered','shelved')),
  date_started DATE,
  date_mastered DATE,
  target_bpm INTEGER,
  current_bpm INTEGER,
  notes TEXT,
  sheet_music_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL
    CHECK (type IN ('session_count','total_minutes','streak_days','piece_status','bpm_target','custom')),
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  unit TEXT,
  piece_id UUID REFERENCES pieces(id) ON DELETE SET NULL,
  deadline DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploads
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('sheet_music','recording','notes','image','other')),
  mime_type TEXT,
  size_bytes INTEGER,
  piece_id UUID REFERENCES pieces(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_pieces_status ON pieces(status);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(completed);
CREATE INDEX IF NOT EXISTS idx_uploads_piece ON uploads(piece_id);
CREATE INDEX IF NOT EXISTS idx_uploads_session ON uploads(session_id);

-- Storage bucket (run this separately in Supabase dashboard > Storage, or via API)
-- Bucket name: piano-uploads
-- Public: false (private bucket, files served via signed URLs)
