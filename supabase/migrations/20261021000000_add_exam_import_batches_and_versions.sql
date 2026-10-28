-- Migration: 20261021000000_add_exam_import_batches_and_versions.sql
-- Description: Import batch audit trail, per-batch question registry, content version
-- snapshots and rollback support for the admin exam bulk import flow.

-- 1. Import batches (one row per bulk import operation)
CREATE TABLE IF NOT EXISTS public.exam_import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.exam_sections(id) ON DELETE SET NULL,
    mode TEXT NOT NULL DEFAULT 'section',
    source_format TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    question_count INTEGER NOT NULL DEFAULT 0,
    imported_question_ids UUID[] NOT NULL DEFAULT '{}',
    imported_by UUID,
    imported_by_email TEXT,
    imported_by_name TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    rollback_reason TEXT,
    rolled_back_at TIMESTAMPTZ,
    rolled_back_by UUID,
    rolled_back_by_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    CONSTRAINT exam_import_batches_status_check
        CHECK (status IN ('pending', 'applied', 'failed', 'rolled_back'))
);

CREATE INDEX IF NOT EXISTS idx_exam_import_batches_exam_id
    ON public.exam_import_batches (exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_import_batches_section_id
    ON public.exam_import_batches (section_id);
CREATE INDEX IF NOT EXISTS idx_exam_import_batches_created_at
    ON public.exam_import_batches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_import_batches_imported_by
    ON public.exam_import_batches (imported_by);

-- 2. Questions created by each batch. question_snapshot keeps the imported content
--    available even after the underlying question is removed by a rollback.
CREATE TABLE IF NOT EXISTS public.exam_import_batch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.exam_import_batches(id) ON DELETE CASCADE,
    question_id UUID,
    section_id UUID,
    question_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_exam_import_batch_items_batch_id
    ON public.exam_import_batch_items (batch_id);
CREATE INDEX IF NOT EXISTS idx_exam_import_batch_items_question_id
    ON public.exam_import_batch_items (question_id);

-- 3. Version snapshots. exam_id intentionally has no FK so the snapshot survives
--    a full-exam rollback (the exam can later be restored from the snapshot).
CREATE TABLE IF NOT EXISTS public.exam_content_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL,
    batch_id UUID REFERENCES public.exam_import_batches(id) ON DELETE SET NULL,
    version_number INTEGER NOT NULL,
    label TEXT,
    snapshot JSONB NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_by UUID,
    created_by_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT exam_content_versions_unique_number UNIQUE (exam_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_exam_content_versions_exam_id
    ON public.exam_content_versions (exam_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_exam_content_versions_batch_id
    ON public.exam_content_versions (batch_id);

-- 4. RLS: import history, rollback and version restore are admin-only operations.
ALTER TABLE public.exam_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_import_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_content_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage exam import batches" ON public.exam_import_batches;
CREATE POLICY "Admins can manage exam import batches"
ON public.exam_import_batches FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage exam import batch items" ON public.exam_import_batch_items;
CREATE POLICY "Admins can manage exam import batch items"
ON public.exam_import_batch_items FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage exam content versions" ON public.exam_content_versions;
CREATE POLICY "Admins can manage exam content versions"
ON public.exam_content_versions FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Permissions (RLS still restricts every operation to admins).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_import_batches TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_import_batch_items TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_content_versions TO authenticated, service_role;
