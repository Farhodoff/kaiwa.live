-- JSON curriculum remains the published canonical source. These tables hold
-- review work only. Applying an approved revision requires a source-controlled
-- publication step and never changes a statically bundled lesson at runtime.

CREATE TABLE IF NOT EXISTS public.curriculum_quality_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL UNIQUE,
  level text NOT NULL CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  lesson_id text NOT NULL,
  exercise_id text NOT NULL,
  source_file text NOT NULL,
  source_hash text NOT NULL,
  prompt text NOT NULL DEFAULT '',
  issue_code text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'triaged', 'assigned', 'in_progress', 'ready_for_review', 'expert_approved', 'published', 'rejected', 'reopened', 'quarantined')),
  owner_id uuid REFERENCES auth.users(id),
  owner_name text,
  original_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curriculum_quality_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.curriculum_quality_issues(id) ON DELETE CASCADE,
  proposed_content jsonb NOT NULL,
  validation_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolution_notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready_for_review', 'expert_approved', 'rejected', 'published'))
);

CREATE TABLE IF NOT EXISTS public.curriculum_quality_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_id uuid NOT NULL REFERENCES public.curriculum_quality_issues(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  previous_status text,
  new_status text NOT NULL,
  reason text,
  content_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS curriculum_quality_issues_queue_idx ON public.curriculum_quality_issues (active, status, level, severity, updated_at DESC);
CREATE INDEX IF NOT EXISTS curriculum_quality_events_issue_idx ON public.curriculum_quality_events (issue_id, created_at DESC);

ALTER TABLE public.curriculum_quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_quality_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_quality_events ENABLE ROW LEVEL SECURITY;

-- Clients can read the queue only if they have an authenticated reviewer/admin role.
CREATE POLICY "curriculum quality issues reviewer select" ON public.curriculum_quality_issues FOR SELECT TO authenticated USING (public.is_reviewer());
CREATE POLICY "curriculum quality revisions reviewer select" ON public.curriculum_quality_revisions FOR SELECT TO authenticated USING (public.is_reviewer());
CREATE POLICY "curriculum quality events reviewer select" ON public.curriculum_quality_events FOR SELECT TO authenticated USING (public.is_reviewer());
-- No client table mutations. RPCs below own transitions and the audit trail.

CREATE OR REPLACE FUNCTION public.sync_curriculum_quality_issues(p_issues jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item jsonb; synced integer := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin permission required'; END IF;
  IF jsonb_typeof(p_issues) <> 'array' THEN RAISE EXCEPTION 'issues must be an array'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_issues) LOOP
    INSERT INTO public.curriculum_quality_issues (
      external_id, level, lesson_id, exercise_id, source_file, source_hash, prompt, issue_code, severity, original_content, created_by, active
    ) VALUES (
      item->>'external_id', item->>'level', item->>'lesson_id', item->>'exercise_id', item->>'source_file', item->>'source_hash', COALESCE(item->>'prompt', ''), item->>'issue_code', item->>'severity', COALESCE(item->'original_content', '{}'::jsonb), auth.uid(), true
    ) ON CONFLICT (external_id) DO UPDATE SET
      source_hash = EXCLUDED.source_hash, prompt = EXCLUDED.prompt, original_content = EXCLUDED.original_content, active = true, updated_at = now();
    synced := synced + 1;
  END LOOP;
  UPDATE public.curriculum_quality_issues SET active = false, updated_at = now()
    WHERE active AND source_file LIKE 'src/data/curriculum/levels/%'
      AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_issues) item WHERE item->>'external_id' = curriculum_quality_issues.external_id);
  RETURN synced;
END; $$;

CREATE OR REPLACE FUNCTION public.transition_curriculum_quality_issue(
  p_issue_id uuid, p_status text, p_reason text DEFAULT NULL, p_owner_id uuid DEFAULT NULL, p_owner_name text DEFAULT NULL, p_content_version text DEFAULT NULL
) RETURNS public.curriculum_quality_issues LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE issue public.curriculum_quality_issues; old_status text; requires_reason boolean;
BEGIN
  SELECT * INTO issue FROM public.curriculum_quality_issues WHERE id = p_issue_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Issue not found'; END IF;
  IF NOT (public.is_admin() OR public.is_reviewer()) THEN RAISE EXCEPTION 'Reviewer permission required'; END IF;
  old_status := issue.status;
  IF p_status NOT IN ('detected','triaged','assigned','in_progress','ready_for_review','expert_approved','published','rejected','reopened','quarantined') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  requires_reason := p_status IN ('rejected','reopened','quarantined');
  IF requires_reason AND coalesce(trim(p_reason), '') = '' THEN RAISE EXCEPTION 'A reason is required'; END IF;
  IF p_status IN ('expert_approved','published') AND NOT public.is_admin() THEN RAISE EXCEPTION 'Admin Japanese expert approval required'; END IF;
  IF p_status = 'expert_approved' AND issue.created_by = auth.uid() THEN RAISE EXCEPTION 'Authors cannot self-approve revisions'; END IF;
  IF p_status = 'published' AND old_status <> 'expert_approved' THEN RAISE EXCEPTION 'Only expert-approved issues can be published'; END IF;
  IF p_status = 'published' AND coalesce(trim(p_content_version), '') = '' THEN RAISE EXCEPTION 'A source-controlled content version is required to publish'; END IF;
  UPDATE public.curriculum_quality_issues SET status=p_status, owner_id=COALESCE(p_owner_id, owner_id), owner_name=COALESCE(p_owner_name, owner_name), updated_at=now() WHERE id=p_issue_id RETURNING * INTO issue;
  INSERT INTO public.curriculum_quality_events(issue_id, actor_id, previous_status, new_status, reason, content_version) VALUES (p_issue_id, auth.uid(), old_status, p_status, p_reason, p_content_version);
  RETURN issue;
END; $$;

CREATE OR REPLACE FUNCTION public.create_curriculum_quality_revision(p_issue_id uuid, p_proposed_content jsonb, p_validation_result jsonb DEFAULT '{}'::jsonb, p_notes text DEFAULT NULL)
RETURNS public.curriculum_quality_revisions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE revision public.curriculum_quality_revisions;
BEGIN
  IF NOT (public.is_admin() OR public.is_reviewer()) THEN RAISE EXCEPTION 'Reviewer permission required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.curriculum_quality_issues WHERE id=p_issue_id AND active) THEN RAISE EXCEPTION 'Active issue not found'; END IF;
  INSERT INTO public.curriculum_quality_revisions(issue_id, proposed_content, validation_result, resolution_notes, created_by) VALUES (p_issue_id, p_proposed_content, p_validation_result, p_notes, auth.uid()) RETURNING * INTO revision;
  RETURN revision;
END; $$;

REVOKE ALL ON FUNCTION public.sync_curriculum_quality_issues(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transition_curriculum_quality_issue(uuid, text, text, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_curriculum_quality_revision(uuid, jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_curriculum_quality_issues(jsonb), public.transition_curriculum_quality_issue(uuid, text, text, uuid, text, text), public.create_curriculum_quality_revision(uuid, jsonb, jsonb, text) TO authenticated;
