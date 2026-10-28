-- Migration: 20260922000000_add_exam_content_workflow_status.sql
-- Description: Add Draft -> Review -> Approved -> Published -> Archived workflow for Exams and Questions.

-- 1. Add status and audit fields to public.exams
ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS rejection_comment TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Backfill existing published / draft exams to maintain consistency
UPDATE public.exams SET status = 'published' WHERE is_published = true AND status = 'draft';
UPDATE public.exams SET is_published = false WHERE status != 'published';

-- 2. Add status and rejection fields to public.exam_questions
ALTER TABLE public.exam_questions
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS rejection_comment TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Backfill existing questions of published exams to 'approved'
UPDATE public.exam_questions
SET status = 'approved'
WHERE EXISTS (
    SELECT 1 FROM public.exam_sections
    JOIN public.exams ON exam_sections.exam_id = exams.id
    WHERE exam_sections.id = exam_questions.section_id
      AND exams.is_published = true
);

-- 3. Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams (status);
CREATE INDEX IF NOT EXISTS idx_exam_questions_status ON public.exam_questions (status);
