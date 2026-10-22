-- Migration: 20261028000000_task20_exam_workflow_rollout.sql
-- Description: Task 20 — production rollout of the exam import workflow.
--
--   * Reviewer RLS: reviewers may create/edit DRAFT exam content and import
--     history, but can never read/modify published content, publish, roll back
--     or restore versions (admins only).
--   * Fixes the legacy passage/audio policies that relied on
--     auth.jwt() ->> 'role' = 'admin' (JWT role is 'authenticated').
--   * Keeps published content immutable for reviewers.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Exams — reviewers may create/update drafts only
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "exams_insert_reviewer" ON public.exams;
CREATE POLICY "exams_insert_reviewer"
ON public.exams FOR INSERT
TO authenticated
WITH CHECK (public.is_reviewer() AND is_published = false);

DROP POLICY IF EXISTS "exams_update_reviewer" ON public.exams;
CREATE POLICY "exams_update_reviewer"
ON public.exams FOR UPDATE
TO authenticated
USING (public.is_reviewer() AND is_published = false)
WITH CHECK (public.is_reviewer() AND is_published = false);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Sections — reviewer writes only inside a draft exam
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "exam_sections_insert_reviewer" ON public.exam_sections;
CREATE POLICY "exam_sections_insert_reviewer"
ON public.exam_sections FOR INSERT
TO authenticated
WITH CHECK (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = exam_sections.exam_id AND e.is_published = false
    )
);

DROP POLICY IF EXISTS "exam_sections_update_reviewer" ON public.exam_sections;
CREATE POLICY "exam_sections_update_reviewer"
ON public.exam_sections FOR UPDATE
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = exam_sections.exam_id AND e.is_published = false
    )
)
WITH CHECK (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = exam_sections.exam_id AND e.is_published = false
    )
);

DROP POLICY IF EXISTS "exam_sections_delete_reviewer" ON public.exam_sections;
CREATE POLICY "exam_sections_delete_reviewer"
ON public.exam_sections FOR DELETE
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = exam_sections.exam_id AND e.is_published = false
    )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Questions — reviewer writes only inside a draft exam
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "exam_questions_insert_reviewer" ON public.exam_questions;
CREATE POLICY "exam_questions_insert_reviewer"
ON public.exam_questions FOR INSERT
TO authenticated
WITH CHECK (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exam_sections s
        JOIN public.exams e ON e.id = s.exam_id
        WHERE s.id = exam_questions.section_id AND e.is_published = false
    )
);

DROP POLICY IF EXISTS "exam_questions_update_reviewer" ON public.exam_questions;
CREATE POLICY "exam_questions_update_reviewer"
ON public.exam_questions FOR UPDATE
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exam_sections s
        JOIN public.exams e ON e.id = s.exam_id
        WHERE s.id = exam_questions.section_id AND e.is_published = false
    )
)
WITH CHECK (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exam_sections s
        JOIN public.exams e ON e.id = s.exam_id
        WHERE s.id = exam_questions.section_id AND e.is_published = false
    )
);

DROP POLICY IF EXISTS "exam_questions_delete_reviewer" ON public.exam_questions;
CREATE POLICY "exam_questions_delete_reviewer"
ON public.exam_questions FOR DELETE
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exam_sections s
        JOIN public.exams e ON e.id = s.exam_id
        WHERE s.id = exam_questions.section_id AND e.is_published = false
    )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Reading passages — replace the broken JWT-role policies
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view published reading passages" ON public.reading_passages;
DROP POLICY IF EXISTS "Admins can manage reading passages" ON public.reading_passages;

CREATE POLICY "exams reading passages select"
ON public.reading_passages FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = reading_passages.exam_id
          AND (e.is_published = true OR public.is_admin() OR public.is_reviewer())
    )
);

CREATE POLICY "Admins can manage reading passages"
ON public.reading_passages FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reading_passages_insert_reviewer" ON public.reading_passages;
CREATE POLICY "reading_passages_insert_reviewer"
ON public.reading_passages FOR INSERT
TO authenticated
WITH CHECK (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = reading_passages.exam_id AND e.is_published = false
    )
);

DROP POLICY IF EXISTS "reading_passages_update_reviewer" ON public.reading_passages;
CREATE POLICY "reading_passages_update_reviewer"
ON public.reading_passages FOR UPDATE
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = reading_passages.exam_id AND e.is_published = false
    )
)
WITH CHECK (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = reading_passages.exam_id AND e.is_published = false
    )
);

DROP POLICY IF EXISTS "reading_passages_delete_reviewer" ON public.reading_passages;
CREATE POLICY "reading_passages_delete_reviewer"
ON public.reading_passages FOR DELETE
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = reading_passages.exam_id AND e.is_published = false
    )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Listening audios — replace the broken JWT-role policies
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view published listening audios" ON public.listening_audios;
DROP POLICY IF EXISTS "Admins can manage listening audios" ON public.listening_audios;

CREATE POLICY "exams listening audios select"
ON public.listening_audios FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = listening_audios.exam_id
          AND (e.is_published = true OR public.is_admin() OR public.is_reviewer())
    )
);

CREATE POLICY "Admins can manage listening audios"
ON public.listening_audios FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "listening_audios_insert_reviewer" ON public.listening_audios;
CREATE POLICY "listening_audios_insert_reviewer"
ON public.listening_audios FOR INSERT
TO authenticated
WITH CHECK (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = listening_audios.exam_id AND e.is_published = false
    )
);

DROP POLICY IF EXISTS "listening_audios_update_reviewer" ON public.listening_audios;
CREATE POLICY "listening_audios_update_reviewer"
ON public.listening_audios FOR UPDATE
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = listening_audios.exam_id AND e.is_published = false
    )
)
WITH CHECK (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = listening_audios.exam_id AND e.is_published = false
    )
);

DROP POLICY IF EXISTS "listening_audios_delete_reviewer" ON public.listening_audios;
CREATE POLICY "listening_audios_delete_reviewer"
ON public.listening_audios FOR DELETE
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exams e
        WHERE e.id = listening_audios.exam_id AND e.is_published = false
    )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Import history — reviewers may record their own imports only
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "exam_import_batches_insert_reviewer" ON public.exam_import_batches;
CREATE POLICY "exam_import_batches_insert_reviewer"
ON public.exam_import_batches FOR INSERT
TO authenticated
WITH CHECK (public.is_reviewer() AND imported_by = auth.uid());

DROP POLICY IF EXISTS "exam_import_batches_select_reviewer" ON public.exam_import_batches;
CREATE POLICY "exam_import_batches_select_reviewer"
ON public.exam_import_batches FOR SELECT
TO authenticated
USING (public.is_reviewer());

DROP POLICY IF EXISTS "exam_import_batches_update_reviewer" ON public.exam_import_batches;
CREATE POLICY "exam_import_batches_update_reviewer"
ON public.exam_import_batches FOR UPDATE
TO authenticated
USING (
    public.is_reviewer()
    AND imported_by = auth.uid()
    AND status <> 'rolled_back'
)
WITH CHECK (
    public.is_reviewer()
    AND imported_by = auth.uid()
    AND status IN ('pending', 'applied', 'failed')
);

DROP POLICY IF EXISTS "exam_import_batch_items_reviewer" ON public.exam_import_batch_items;
CREATE POLICY "exam_import_batch_items_reviewer"
ON public.exam_import_batch_items FOR INSERT
TO authenticated
WITH CHECK (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exam_import_batches b
        WHERE b.id = exam_import_batch_items.batch_id
          AND b.imported_by = auth.uid()
    )
);

DROP POLICY IF EXISTS "exam_import_batch_items_select_reviewer" ON public.exam_import_batch_items;
CREATE POLICY "exam_import_batch_items_select_reviewer"
ON public.exam_import_batch_items FOR SELECT
TO authenticated
USING (
    public.is_reviewer()
    AND EXISTS (
        SELECT 1 FROM public.exam_import_batches b
        WHERE b.id = exam_import_batch_items.batch_id
          AND b.imported_by = auth.uid()
    )
);

DROP POLICY IF EXISTS "exam_content_versions_insert_reviewer" ON public.exam_content_versions;
CREATE POLICY "exam_content_versions_insert_reviewer"
ON public.exam_content_versions FOR INSERT
TO authenticated
WITH CHECK (public.is_reviewer() AND created_by = auth.uid());

DROP POLICY IF EXISTS "exam_content_versions_select_reviewer" ON public.exam_content_versions;
CREATE POLICY "exam_content_versions_select_reviewer"
ON public.exam_content_versions FOR SELECT
TO authenticated
USING (public.is_reviewer());

DROP POLICY IF EXISTS "exam_content_versions_update_reviewer" ON public.exam_content_versions;
CREATE POLICY "exam_content_versions_update_reviewer"
ON public.exam_content_versions FOR UPDATE
TO authenticated
USING (public.is_reviewer() AND created_by = auth.uid())
WITH CHECK (public.is_reviewer() AND created_by = auth.uid());

COMMENT ON POLICY "exams_update_reviewer" ON public.exams IS
    'Task 20: reviewers may edit drafts only; publishing is admin-only and is also enforced by the Task 19 trigger.';
COMMENT ON POLICY "exam_questions_update_reviewer" ON public.exam_questions IS
    'Task 20: reviewers may edit questions only while the parent exam is unpublished.';
