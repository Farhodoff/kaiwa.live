-- Migration: 20261027000000_task19_workflow_transition_enforcement.sql
-- Description: Task 19 — strict workflow transitions at the database level.
--
--   Exam transitions (only these are legal):
--     draft -> review
--     review -> draft | approved
--     approved -> published
--     published -> archived
--     archived -> draft
--
--   Question transitions (only these are legal):
--     draft -> review
--     review -> approved | rejected
--     rejected -> draft
--     approved -> terminal (published via the exam publish step)
--
-- The application mirrors this matrix in src/utils/examWorkflowTransitions.ts.
-- These triggers make it impossible to bypass the matrix with a direct
-- PostgREST / SQL UPDATE: illegal pairs, missing roles and inconsistent
-- is_published flags all raise. The audit log is append-only.

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Reviewer role helper (admin-aware)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_reviewer()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _uid UUID := auth.uid();
    _role TEXT;
    _email TEXT;
BEGIN
    IF auth.role() = 'service_role' OR current_user = 'service_role' THEN
        RETURN TRUE;
    END IF;

    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;

    IF _uid IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT LOWER(TRIM(COALESCE(role, ''))), LOWER(TRIM(COALESCE(email, '')))
    INTO _role, _email
    FROM public.profiles
    WHERE id = _uid;

    RETURN _role IN ('reviewer', 'admin', 'superadmin')
        OR _email IN ('fsoyilov@gmail.com', 'admin@nihongo-talk.jp');
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_reviewer() TO anon, authenticated, service_role;

-- Human-readable list of legal next states (used in error messages).
CREATE OR REPLACE FUNCTION public.exam_allowed_next_statuses(_status TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE _status
        WHEN 'draft' THEN 'review'
        WHEN 'review' THEN 'draft, approved'
        WHEN 'approved' THEN 'published'
        WHEN 'published' THEN 'archived'
        WHEN 'archived' THEN 'draft'
        ELSE 'yo''q (noma''lum holat)'
    END;
$$;

GRANT EXECUTE ON FUNCTION public.exam_allowed_next_statuses(TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.question_allowed_next_statuses(_status TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE _status
        WHEN 'draft' THEN 'review'
        WHEN 'review' THEN 'approved, rejected'
        WHEN 'rejected' THEN 'draft'
        WHEN 'approved' THEN 'yo''q (exam publish orqali boshqariladi)'
        ELSE 'yo''q (noma''lum holat)'
    END;
$$;

GRANT EXECUTE ON FUNCTION public.question_allowed_next_statuses(TEXT) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Exam transition trigger
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_exam_workflow_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _allowed BOOLEAN;
    _admin_only BOOLEAN;
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        IF NEW.is_published AND NEW.status <> 'published' THEN
            RAISE EXCEPTION 'is_published = true faqat status = ''published'' bo''lganda ruxsat etiladi.'
                USING ERRCODE = 'check_violation';
        END IF;
        IF NEW.status = 'published' AND NEW.is_published IS DISTINCT FROM TRUE THEN
            RAISE EXCEPTION 'status = ''published'' uchun is_published = true bo''lishi shart.'
                USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
    END IF;

    _allowed := (OLD.status, NEW.status) IN (
        ('draft', 'review'),
        ('review', 'draft'),
        ('review', 'approved'),
        ('approved', 'published'),
        ('published', 'archived'),
        ('archived', 'draft')
    );

    IF NOT _allowed THEN
        RAISE EXCEPTION 'Noto''g''ri exam status o''tishi: "%" → "%". Ruxsat etilgan o''tishlar: %',
            OLD.status, NEW.status, public.exam_allowed_next_statuses(OLD.status)
            USING ERRCODE = 'check_violation';
    END IF;

    _admin_only := (OLD.status, NEW.status) IN (
        ('approved', 'published'),
        ('published', 'archived'),
        ('archived', 'draft')
    );

    IF _admin_only AND NOT public.is_admin() THEN
        RAISE EXCEPTION '"%" → "%" o''tishi faqat admin uchun ruxsat etilgan.',
            OLD.status, NEW.status
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NOT _admin_only AND NOT (public.is_admin() OR public.is_reviewer()) THEN
        RAISE EXCEPTION '"%" → "%" o''tishi uchun reviewer yoki admin roli talab qilinadi.',
            OLD.status, NEW.status
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NEW.is_published AND NEW.status <> 'published' THEN
        RAISE EXCEPTION 'is_published = true faqat status = ''published'' bo''lganda ruxsat etiladi.'
            USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.status = 'published' AND NEW.is_published IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'status = ''published'' uchun is_published = true bo''lishi shart.'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exams_workflow_transition ON public.exams;
CREATE TRIGGER trg_exams_workflow_transition
    BEFORE UPDATE ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_exam_workflow_transition();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Question transition trigger
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_question_workflow_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _allowed BOOLEAN;
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    _allowed := (OLD.status, NEW.status) IN (
        ('draft', 'review'),
        ('review', 'approved'),
        ('review', 'rejected'),
        ('rejected', 'draft')
    );

    IF NOT _allowed THEN
        RAISE EXCEPTION 'Noto''g''ri savol status o''tishi: "%" → "%". Ruxsat etilgan o''tishlar: %',
            OLD.status, NEW.status, public.question_allowed_next_statuses(OLD.status)
            USING ERRCODE = 'check_violation';
    END IF;

    IF NOT (public.is_admin() OR public.is_reviewer()) THEN
        RAISE EXCEPTION '"%" → "%" o''tishi uchun reviewer yoki admin roli talab qilinadi.',
            OLD.status, NEW.status
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exam_questions_workflow_transition ON public.exam_questions;
CREATE TRIGGER trg_exam_questions_workflow_transition
    BEFORE UPDATE ON public.exam_questions
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_question_workflow_transition();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Append-only transition audit log
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_workflow_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('exam', 'question')),
    entity_id UUID NOT NULL,
    exam_id UUID,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_id UUID,
    actor_email TEXT,
    actor_role TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_workflow_events_entity
    ON public.exam_workflow_events (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_workflow_events_exam
    ON public.exam_workflow_events (exam_id, created_at DESC);

ALTER TABLE public.exam_workflow_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read exam workflow events" ON public.exam_workflow_events;
CREATE POLICY "Admins can read exam workflow events"
    ON public.exam_workflow_events FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Reviewers/admins may append their own transition events. The actor email
-- must match the JWT email so events cannot be attributed to somebody else.
DROP POLICY IF EXISTS "Reviewers can append exam workflow events" ON public.exam_workflow_events;
CREATE POLICY "Reviewers can append exam workflow events"
    ON public.exam_workflow_events FOR INSERT
    TO authenticated
    WITH CHECK (
        (public.is_admin() OR public.is_reviewer())
        AND (
            actor_email IS NULL
            OR LOWER(actor_email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
        )
    );

-- No UPDATE / DELETE policies on purpose: the audit log is append-only.

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Keep the concurrency guarantees explicit
-- ─────────────────────────────────────────────────────────────────────────────
COMMENT ON FUNCTION public.enforce_exam_workflow_transition() IS
    'Task 19: blocks illegal exam status transitions, enforces actor role and is_published consistency on every direct UPDATE.';
COMMENT ON FUNCTION public.enforce_question_workflow_transition() IS
    'Task 19: blocks illegal question status transitions and enforces reviewer/admin role on every direct UPDATE.';
COMMENT ON TABLE public.exam_workflow_events IS
    'Task 19: append-only audit trail of every exam/question workflow transition.';
