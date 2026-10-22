-- Migration: 20261025000000_task17_draft_only_import_invariants.sql
-- Description: Task 17 — strict draft-only model for exam content.
--   Bulk import may only create draft content. Publishing is possible only
--   through the review workflow (ExamWorkflowService.transitionExamStatus),
--   which flips status and is_published together.

-- 1. Default workflow states (imports always land in draft)
ALTER TABLE public.exams
    ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE public.exam_questions
    ALTER COLUMN status SET DEFAULT 'draft';

-- 2. An exam can only be visible to students when its workflow status is
--    'published'. Any other combination is rejected by the database.
ALTER TABLE public.exams
    DROP CONSTRAINT IF EXISTS exams_published_status_consistency;

ALTER TABLE public.exams
    ADD CONSTRAINT exams_published_status_consistency
    CHECK (is_published = false OR status = 'published') NOT VALID;

-- 3. Questions may only use the known workflow states.
ALTER TABLE public.exam_questions
    DROP CONSTRAINT IF EXISTS exam_questions_status_values;

ALTER TABLE public.exam_questions
    ADD CONSTRAINT exam_questions_status_values
    CHECK (status IN ('draft', 'review', 'approved', 'rejected')) NOT VALID;

-- 4. Help the query planner for the draft/review dashboards.
CREATE INDEX IF NOT EXISTS idx_exams_draft_only
    ON public.exams (status)
    WHERE is_published = false;

-- Note: the CHECK constraints are added NOT VALID on purpose — legacy rows are
-- not re-validated here, but every new insert/update is enforced.
