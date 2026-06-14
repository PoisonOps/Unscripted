-- ─── Unscripted — Supabase Setup ────────────────────────────────────────────
-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE

-- ─── Sessions table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  temp_session_id  TEXT,
  category         TEXT NOT NULL,
  company          TEXT,
  role             TEXT,
  round_type       TEXT,
  personality      TEXT DEFAULT 'balanced',
  interview_mode   TEXT DEFAULT 'full_mock',
  transcript       JSONB DEFAULT '[]',
  scores           JSONB,
  duration_seconds INTEGER DEFAULT 0,
  question_count   INTEGER DEFAULT 0,
  context_summary  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_temp_id ON sessions(temp_session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created  ON sessions(created_at DESC);

-- ─── Feedback table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  overall     INTEGER CHECK (overall BETWEEN 1 AND 5),
  relevance   TEXT,
  followup    TEXT,
  difficulty  TEXT,
  free_text   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);

-- ─── Events table (analytics) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event      TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_event ON events(event);
CREATE INDEX IF NOT EXISTS idx_events_user  ON events(user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE events   ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DROP POLICY IF EXISTS "sessions_select_own"   ON sessions;
DROP POLICY IF EXISTS "sessions_anon_insert"  ON sessions;
DROP POLICY IF EXISTS "sessions_anon_update"  ON sessions;
DROP POLICY IF EXISTS "sessions_user_update"  ON sessions;
DROP POLICY IF EXISTS "feedback_insert"       ON feedback;
DROP POLICY IF EXISTS "feedback_own_select"   ON feedback;
DROP POLICY IF EXISTS "events_insert"         ON events;

-- Sessions: users can read their own sessions
CREATE POLICY "sessions_select_own" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Sessions: anyone can insert (anonymous sessions before signup)
CREATE POLICY "sessions_anon_insert" ON sessions
  FOR INSERT WITH CHECK (true);

-- Sessions: anon can update by temp_session_id (for linking)
CREATE POLICY "sessions_anon_update" ON sessions
  FOR UPDATE USING (temp_session_id IS NOT NULL);

-- Sessions: logged-in users can update their own
CREATE POLICY "sessions_user_update" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Feedback: anyone can insert
CREATE POLICY "feedback_insert" ON feedback
  FOR INSERT WITH CHECK (true);

-- Feedback: users can read feedback on their own sessions
CREATE POLICY "feedback_own_select" ON feedback
  FOR SELECT USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- Events: insert only (analytics)
CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (true);

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- After running this, verify with:
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- You should see: sessions, feedback, events
