-- Fixture only: included inside the regression runner's transaction.
-- Deliberately fail instead of reusing or replacing any existing application schema.
DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL
     OR EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    RAISE EXCEPTION 'SRS regression requires a fresh disposable database (no auth schema or public.tasks)';
  END IF;
END;
$$;

CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY);
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');

-- Task columns mirror 012_tasks_sessions / remote_schema + soft deletion.
-- Unused goal/subject references, services, policies and triggers are not needed here.
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  completed BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  goal_id UUID,
  subject_id UUID,
  tags JSONB DEFAULT '[]'::jsonb,
  estimated_duration INTEGER,
  actual_duration INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Seed before the migration to verify that legacy data remains unchanged.
INSERT INTO public.tasks (user_id, title, tags, completed, status, completed_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Legacy review title',
        '["srs", "legacy"]', true, 'done', '2026-10-28 12:00:00+00');
CREATE TEMP TABLE srs_legacy_snapshot AS
  SELECT id, to_jsonb(t) AS data FROM public.tasks t;
