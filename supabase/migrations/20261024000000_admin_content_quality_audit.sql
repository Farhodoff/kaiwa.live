-- Migration: 20261024000000_admin_content_quality_audit.sql
-- Description: Allow admins to read aggregate answer outcomes for the
-- N3-N1 content quality audit dashboard and index the lookup.

ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all exam answers" ON public.exam_answers;
CREATE POLICY "Admins can view all exam answers"
ON public.exam_answers FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_exam_answers_question_correct
  ON public.exam_answers (question_id, is_correct);

-- The dashboard also needs to read linked reading passages and listening audio
-- records even when an admin is authorized by profile role rather than JWT role.
DROP POLICY IF EXISTS "Admins can view all reading passages" ON public.reading_passages;
CREATE POLICY "Admins can view all reading passages"
ON public.reading_passages FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all listening audios" ON public.listening_audios;
CREATE POLICY "Admins can view all listening audios"
ON public.listening_audios FOR SELECT
TO authenticated
USING (public.is_admin());
