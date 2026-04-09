-- ActionPlanner multiuser schema
-- Run this SQL in Supabase SQL Editor to set up tables

-- Create coaches table
CREATE TABLE public.coaches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE public.students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  coach_id TEXT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE public.goals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  templateId TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::JSONB,
  pearStatement TEXT NOT NULL,
  declaration TEXT NOT NULL DEFAULT '',
  declarationMeaning TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_students_coach_id ON students(coach_id);
CREATE INDEX idx_goals_student_id ON goals(student_id);
CREATE INDEX idx_goals_templateId ON goals(templateId);

-- RLS (Row Level Security) - Anon can read/write all
-- Since this is no-login, disable RLS or set permissive policies
ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon role
GRANT ALL ON public.coaches TO anon;
GRANT ALL ON public.students TO anon;
GRANT ALL ON public.goals TO anon;

GRANT ALL ON SEQUENCE coaches_id_seq TO anon;
GRANT ALL ON SEQUENCE students_id_seq TO anon;
GRANT ALL ON SEQUENCE goals_id_seq TO anon;
