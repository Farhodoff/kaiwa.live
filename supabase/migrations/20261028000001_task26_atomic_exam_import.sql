-- Migration: 20261028000001_task26_atomic_exam_import.sql
-- Description: Task 26 — Server-side atomic bulk import RPC for exams, sections and questions.
--
-- Guarantees:
-- 1. All inserts (exam, sections, questions, batch items, version snapshot) run in a single atomic transaction.
-- 2. Any section or question error causes an immediate exception and full rollback of created entities.
-- 3. On unhandled exception, the entire transaction is rolled back by PostgreSQL.

CREATE OR REPLACE FUNCTION public.import_full_exam_atomic(
    p_title TEXT,
    p_level TEXT,
    p_description TEXT,
    p_sections JSONB,
    p_actor JSONB DEFAULT '{}'::jsonb,
    p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exam_id UUID;
    v_batch_id UUID;
    v_section RECORD;
    v_section_id UUID;
    v_question RECORD;
    v_sec_order INT := 0;
    v_q_order INT := 0;
    v_total_inserted INT := 0;
    v_expected_count INT := 0;
    v_version_number INT := 1;
    v_created_q_ids UUID[] := '{}';
    v_actor_id UUID;
    v_actor_email TEXT;
    v_actor_name TEXT;
BEGIN
    -- 1. Authorization: user must be admin or reviewer
    IF NOT (public.is_admin() OR public.is_reviewer()) THEN
        RAISE EXCEPTION 'Import faqat admin yoki reviewer tomonidan amalga oshirilishi mumkin.';
    END IF;

    v_actor_id := NULLIF(p_actor->>'id', '')::UUID;
    v_actor_email := NULLIF(p_actor->>'email', '');
    v_actor_name := NULLIF(p_actor->>'name', '');

    -- 2. Count expected questions
    FOR v_section IN SELECT * FROM jsonb_array_elements(p_sections) LOOP
        v_expected_count := v_expected_count + jsonb_array_length(COALESCE(v_section.value->'questions', '[]'::jsonb));
    END LOOP;

    IF v_expected_count = 0 THEN
        RAISE EXCEPTION 'Saqlash uchun yaroqli savollar topilmadi.';
    END IF;

    -- 3. Create Draft Exam (always draft)
    INSERT INTO public.exams (
        title,
        type,
        description,
        status,
        is_published,
        source_name,
        source_url,
        author,
        license_type,
        copyright_confirmed,
        is_official_jlpt
    ) VALUES (
        p_title,
        'JLPT ' || p_level,
        COALESCE(p_description, 'Ommaviy import orqali yuklangan JLPT ' || p_level || ' mock imtihoni.'),
        'draft',
        false,
        NULLIF(p_meta->>'sourceName', ''),
        NULLIF(p_meta->>'sourceUrl', ''),
        NULLIF(p_meta->>'author', ''),
        COALESCE(NULLIF(p_meta->>'licenseType', ''), 'original'),
        COALESCE((p_meta->>'copyrightConfirmed')::BOOLEAN, false),
        COALESCE((p_meta->>'isOfficialJlpt')::BOOLEAN, false)
    )
    RETURNING id INTO v_exam_id;

    -- 4. Create pending batch
    INSERT INTO public.exam_import_batches (
        exam_id,
        mode,
        source_format,
        status,
        imported_by,
        imported_by_email,
        imported_by_name,
        metadata
    ) VALUES (
        v_exam_id,
        'full-exam',
        NULLIF(p_meta->>'sourceFormat', ''),
        'pending',
        v_actor_id,
        v_actor_email,
        v_actor_name,
        jsonb_build_object('created_exam', true, 'title', p_title)
    )
    RETURNING id INTO v_batch_id;

    -- 5. Process sections and questions
    FOR v_section IN SELECT * FROM jsonb_array_elements(p_sections) LOOP
        INSERT INTO public.exam_sections (
            exam_id,
            title,
            type,
            content,
            order_index
        ) VALUES (
            v_exam_id,
            COALESCE(v_section.value->>'title', 'Asosiy Bo''lim'),
            COALESCE(v_section.value->>'type', 'reading'),
            NULLIF(v_section.value->>'content', ''),
            v_sec_order
        )
        RETURNING id INTO v_section_id;

        v_sec_order := v_sec_order + 1;
        v_q_order := 0;

        FOR v_question IN SELECT * FROM jsonb_array_elements(COALESCE(v_section.value->'questions', '[]'::jsonb)) LOOP
            DECLARE
                v_inserted_q_id UUID;
            BEGIN
                INSERT INTO public.exam_questions (
                    section_id,
                    question_text,
                    type,
                    options,
                    correct_answer,
                    explanation,
                    order_index,
                    status,
                    source_name,
                    source_url,
                    author,
                    license_type,
                    copyright_confirmed,
                    is_official_jlpt,
                    question_type,
                    question_payload
                ) VALUES (
                    v_section_id,
                    v_question.value->>'question_text',
                    COALESCE(v_question.value->>'type', 'multiple_choice'),
                    COALESCE(v_question.value->'options', '[]'::jsonb),
                    v_question.value->>'correct_answer',
                    v_question.value->>'explanation',
                    v_q_order,
                    'draft',
                    NULLIF(v_question.value->>'source_name', ''),
                    NULLIF(v_question.value->>'source_url', ''),
                    NULLIF(v_question.value->>'author', ''),
                    COALESCE(v_question.value->>'license_type', 'original'),
                    COALESCE((v_question.value->>'copyright_confirmed')::BOOLEAN, false),
                    COALESCE((v_question.value->>'is_official_jlpt')::BOOLEAN, false),
                    v_question.value->>'question_type',
                    COALESCE(v_question.value->'question_payload', '{}'::jsonb)
                )
                RETURNING id INTO v_inserted_q_id;

                v_q_order := v_q_order + 1;
                v_total_inserted := v_total_inserted + 1;
                v_created_q_ids := array_append(v_created_q_ids, v_inserted_q_id);

                INSERT INTO public.exam_import_batch_items (
                    batch_id,
                    question_id,
                    section_id,
                    question_snapshot
                ) VALUES (
                    v_batch_id,
                    v_inserted_q_id,
                    v_section_id,
                    v_question.value
                );
            END;
        END LOOP;
    END LOOP;

    -- 6. Integrity check: all expected questions must have been inserted
    IF v_total_inserted <> v_expected_count THEN
        RAISE EXCEPTION 'Import to''liq amalga oshmadi: % ta savoldan faqat % tasi saqlandi.', v_expected_count, v_total_inserted;
    END IF;

    -- 7. Mandatory version snapshot
    INSERT INTO public.exam_content_versions (
        exam_id,
        batch_id,
        version_number,
        label,
        snapshot,
        is_current,
        created_by,
        created_by_email
    ) VALUES (
        v_exam_id,
        v_batch_id,
        1,
        'To''liq imtihon importi (' || v_total_inserted || ' savol)',
        jsonb_build_object('exam_id', v_exam_id, 'question_count', v_total_inserted),
        true,
        v_actor_id,
        v_actor_email
    );

    -- 8. Finalize batch
    UPDATE public.exam_import_batches
    SET
        status = 'applied',
        question_count = v_total_inserted,
        imported_question_ids = v_created_q_ids,
        completed_at = timezone('utc'::text, now())
    WHERE id = v_batch_id;

    RETURN jsonb_build_object(
        'success', true,
        'examId', v_exam_id,
        'totalInserted', v_total_inserted,
        'expectedCount', v_expected_count,
        'batchId', v_batch_id,
        'questionIds', v_created_q_ids
    );
END;
$$;
