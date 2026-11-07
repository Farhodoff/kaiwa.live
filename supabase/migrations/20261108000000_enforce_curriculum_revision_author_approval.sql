-- Approval must be independent of the administrator who synchronized an issue.
-- A reviewer/admin who authored a proposed revision cannot expert-approve that issue.

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
  IF p_status = 'expert_approved' AND EXISTS (
    SELECT 1 FROM public.curriculum_quality_revisions revision
    WHERE revision.issue_id = p_issue_id AND revision.created_by = auth.uid()
  ) THEN RAISE EXCEPTION 'Revision authors cannot self-approve'; END IF;
  IF p_status = 'published' AND old_status <> 'expert_approved' THEN RAISE EXCEPTION 'Only expert-approved issues can be published'; END IF;
  IF p_status = 'published' AND coalesce(trim(p_content_version), '') = '' THEN RAISE EXCEPTION 'A source-controlled content version is required to publish'; END IF;
  UPDATE public.curriculum_quality_issues SET status=p_status, owner_id=COALESCE(p_owner_id, owner_id), owner_name=COALESCE(p_owner_name, owner_name), updated_at=now() WHERE id=p_issue_id RETURNING * INTO issue;
  INSERT INTO public.curriculum_quality_events(issue_id, actor_id, previous_status, new_status, reason, content_version) VALUES (p_issue_id, auth.uid(), old_status, p_status, p_reason, p_content_version);
  RETURN issue;
END; $$;

REVOKE ALL ON FUNCTION public.transition_curriculum_quality_issue(uuid, text, text, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_curriculum_quality_issue(uuid, text, text, uuid, text, text) TO authenticated;
