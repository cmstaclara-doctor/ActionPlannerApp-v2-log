-- ActionPlanner App v2.0-log — 1 coach, cloud-synced
-- Run this SQL in Supabase SQL Editor

-- Coach settings (1 row per key)
CREATE TABLE coach_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Students
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gg_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal records (JSONB mirror of GoalRecord type)
CREATE TABLE goal_records (
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  record JSONB NOT NULL DEFAULT '{}',
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, goal_type)
);

-- Declarations
CREATE TABLE declarations (
  student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT ''
);

-- Indexes for performance
CREATE INDEX idx_goal_records_student_id ON goal_records(student_id);

-- Disable RLS (single coach, no auth needed)
ALTER TABLE coach_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE goal_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE declarations DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon role
GRANT ALL ON coach_settings TO anon;
GRANT ALL ON students TO anon;
GRANT ALL ON goal_records TO anon;
GRANT ALL ON declarations TO anon;
GRANT ALL ON SEQUENCE coach_settings_seq TO anon;
GRANT ALL ON SEQUENCE students_seq TO anon;
GRANT ALL ON SEQUENCE goal_records_seq TO anon;
GRANT ALL ON SEQUENCE declarations_seq TO anon;
