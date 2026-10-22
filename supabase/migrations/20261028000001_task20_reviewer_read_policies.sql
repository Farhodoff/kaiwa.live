-- Migration: 20261028000001_task20_reviewer_read_policies.sql
-- Description: Task 20 — reviewers must be able to read draft exam content in
-- the admin editor (import → review). Read-only; writes remain scoped to
-- unpublished content by 20261028000000_task20_exam_workflow_rollout.sql.

DROP POLICY IF EXISTS "exams_select_reviewer" ON public.exams;
CREATE POLICY "exams_select_reviewer"
ON public.exams FOR SELECT
TO authenticated
USING (public.is_reviewer());

DROP POLICY IF EXISTS "exam_sections_select_reviewer" ON public.exam_sections;
CREATE POLICY "exam_sections_select_reviewer"
ON public.exam_sections FOR SELECT
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = exam_sections.exam_id
          AND (e.is_published = false OR public.is_admin())
    )
);

DROP POLICY IF EXISTS "exam_questions_select_reviewer" ON public.exam_questions;
CREATE POLICY "exam_questions_select_reviewer"
ON public.exam_questions FOR SELECT
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exam_sections s
        JOIN public.exams e ON e.id = s.exam_id
        WHERE s.id = exam_questions.section_id
          AND (e.is_published = false OR public.is_admin())
    )
);
