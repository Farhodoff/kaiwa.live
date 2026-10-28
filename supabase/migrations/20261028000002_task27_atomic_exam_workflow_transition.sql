-- Migration: 20261028000002_task27_atomic_exam_workflow_transition.sql
-- Description: Task 27 — Atomic database transaction for exam status update and audit logging.
--
-- Guarantees:
-- 1. Status update and audit log event are executed in a single atomic transaction.
-- 2. If the audit log fails, the status update is automatically rolled back by PostgreSQL.
-- 3. Actor ID, email and role are extracted from server-side JWT / session (auth.uid(), auth.jwt()),
--    preventing client parameter spoofing.

CREATE OR REPLACE FUNCTION public.transition_exam_status_atomic(
    p_exam_id UUID,
    p_target_status TEXT,
    p_rejection_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_from_status TEXT;
    v_current_is_published BOOLEAN;
    v_actor_id UUID := auth.uid();
    v_actor_email TEXT := COALESCE(auth.jwt() ->> 'email', '');
    v_actor_role TEXT := 'user';
    v_is_admin BOOLEAN := public.is_admin();
    v_is_reviewer BOOLEAN := public.is_reviewer();
    v_allowed BOOLEAN;
    v_admin_only BOOLEAN;
BEGIN
    -- 1. Determine server-side role from JWT / profiles table
    IF v_is_admin THEN
        v_actor_role := 'admin';
    ELSIF v_is_reviewer THEN
        v_actor_role := 'reviewer';
    ELSIF v_actor_id IS NOT NULL THEN
        SELECT LOWER(TRIM(COALESCE(role, 'user'))) INTO v_actor_role
        FROM public.profiles
        WHERE id = v_actor_id;
    END IF;

    -- 2. Lock exam row and fetch current status
    SELECT status, is_published INTO v_from_status, v_current_is_published
    FROM public.exams
    WHERE id = p_exam_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Imtihon topilmadi.';
    END IF;

    -- 3. Verify workflow transition matrix
    v_allowed := (v_from_status, p_target_status) IN (
        ('draft', 'review'),
        ('review', 'draft'),
        ('review', 'approved'),
        ('approved', 'published'),
        ('published', 'archived'),
        ('archived', 'draft')
    );

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Noto''g''ri exam status o''tishi: "%" → "%".', v_from_status, p_target_status;
    END IF;

    -- 4. Server-side role authorization check
    v_admin_only := (v_from_status, p_target_status) IN (
        ('approved', 'published'),
        ('published', 'archived'),
        ('archived', 'draft')
    );

    IF v_admin_only AND NOT v_is_admin THEN
        RAISE EXCEPTION '"%" → "%" o''tishi faqat admin uchun ruxsat etilgan.', v_from_status, p_target_status;
    END IF;

    IF NOT v_admin_only AND NOT (v_is_admin OR v_is_reviewer) THEN
        RAISE EXCEPTION '"%" → "%" o''tishi uchun reviewer yoki admin roli talab qilinadi.', v_from_status, p_target_status;
    END IF;

    -- 5. Atomic Update
    UPDATE public.exams
    SET
        status = p_target_status,
        is_published = (p_target_status = 'published'),
        archived_at = CASE WHEN p_target_status = 'archived' THEN NOW() ELSE archived_at END,
        reviewed_by = NULLIF(v_actor_email, ''),
        reviewed_at = NOW(),
        rejection_comment = CASE
            WHEN p_target_status IN ('published', 'approved') THEN NULL
            WHEN p_target_status = 'draft' AND p_rejection_comment IS NOT NULL THEN TRIM(p_rejection_comment)
            ELSE rejection_comment
        END
    WHERE id = p_exam_id;

    -- 6. Atomic Audit Log in the SAME transaction
    INSERT INTO public.exam_workflow_events (
        entity_type,
        entity_id,
        exam_id,
        from_status,
        to_status,
        actor_id,
        actor_email,
        actor_role,
        comment
    ) VALUES (
        'exam',
        p_exam_id,
        p_exam_id,
        v_from_status,
        p_target_status,
        v_actor_id,
        NULLIF(v_actor_email, ''),
        v_actor_role,
        NULLIF(TRIM(p_rejection_comment), '')
    );

    RETURN jsonb_build_object(
        'success', true,
        'fromStatus', v_from_status,
        'toStatus', p_target_status,
        'actorEmail', v_actor_email,
        'actorRole', v_actor_role
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_exam_status_atomic(UUID, TEXT, TEXT) TO authenticated, service_role;
