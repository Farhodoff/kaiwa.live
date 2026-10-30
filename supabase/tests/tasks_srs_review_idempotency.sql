\set ON_ERROR_STOP on
-- Run only against a fresh disposable local database. All DDL/data rolls back.
BEGIN;
\ir tasks_srs_review_setup.sql
\ir ../migrations/20261029064607_tasks_srs_review_idempotency.sql

DO $$
DECLARE
  user_one CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
  user_two CONSTANT UUID := '00000000-0000-0000-0000-000000000002';
  review_day CONSTANT DATE := DATE '2026-10-29';
  original_id UUID;
  replacement_id UUID;
  original_row JSONB;
  violated_constraint TEXT;
  invalid_pair RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM srs_legacy_snapshot s
    LEFT JOIN public.tasks t ON t.id = s.id
    WHERE t.id IS NULL
       OR (to_jsonb(t) - 'srs_lesson_id' - 'srs_review_date') IS DISTINCT FROM s.data
       OR t.srs_lesson_id IS NOT NULL OR t.srs_review_date IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Migration modified a legacy task';
  END IF;

  INSERT INTO public.tasks (user_id, title, srs_lesson_id, srs_review_date)
  VALUES (user_one, 'Review lesson A', 'lesson-a', review_day)
  RETURNING id INTO original_id;

  BEGIN
    INSERT INTO public.tasks (user_id, title, srs_lesson_id, srs_review_date)
    VALUES (user_one, 'Retry with another title', 'lesson-a', review_day);
    RAISE EXCEPTION 'Duplicate active review was accepted';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
    IF violated_constraint IS DISTINCT FROM 'tasks_srs_review_unique' THEN
      RAISE EXCEPTION 'Unexpected unique constraint: %', violated_constraint;
    END IF;
  END;

  UPDATE public.tasks SET completed = true, status = 'done',
    completed_at = TIMESTAMPTZ '2026-10-29 12:00:00+00'
  WHERE id = original_id;
  SELECT to_jsonb(t) INTO original_row FROM public.tasks t WHERE id = original_id;

  BEGIN
    INSERT INTO public.tasks (user_id, title, srs_lesson_id, srs_review_date)
    VALUES (user_one, 'Retry after completion', 'lesson-a', review_day);
    RAISE EXCEPTION 'Completed active review did not block duplicate';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
    IF violated_constraint IS DISTINCT FROM 'tasks_srs_review_unique' THEN
      RAISE EXCEPTION 'Unexpected unique constraint: %', violated_constraint;
    END IF;
  END;

  IF (SELECT count(*) FROM public.tasks
      WHERE user_id = user_one AND srs_lesson_id = 'lesson-a'
        AND srs_review_date = review_day AND deleted_at IS NULL) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.tasks t
                    WHERE id = original_id AND to_jsonb(t) = original_row) THEN
    RAISE EXCEPTION 'Retry changed or replaced the completed record';
  END IF;

  INSERT INTO public.tasks (user_id, title, srs_lesson_id, srs_review_date) VALUES
    (user_one, 'Another day', 'lesson-a', review_day + 1),
    (user_one, 'Another lesson', 'lesson-b', review_day),
    (user_two, 'Another user', 'lesson-a', review_day);

  -- Same title/day as a keyed review and duplicate manual titles are unrestricted.
  INSERT INTO public.tasks (user_id, title, due_date) VALUES
    (user_one, 'Review lesson A', review_day),
    (user_one, 'Review lesson A', review_day);
  IF (SELECT count(*) FROM public.tasks
      WHERE user_id = user_one AND title = 'Review lesson A'
        AND srs_lesson_id IS NULL AND srs_review_date IS NULL) <> 2 THEN
    RAISE EXCEPTION 'Manual duplicate tasks were not preserved';
  END IF;

  UPDATE public.tasks SET deleted_at = now() WHERE id = original_id;
  INSERT INTO public.tasks (user_id, title, srs_lesson_id, srs_review_date)
  VALUES (user_one, 'Replacement review', 'lesson-a', review_day)
  RETURNING id INTO replacement_id;
  -- Multiple deleted rows may also share the key.
  INSERT INTO public.tasks (user_id, title, srs_lesson_id, srs_review_date, deleted_at)
  VALUES (user_one, 'Deleted historical review', 'lesson-a', review_day, now());

  IF replacement_id = original_id
     OR NOT EXISTS (SELECT 1 FROM public.tasks WHERE id = original_id
                    AND deleted_at IS NOT NULL AND completed AND status = 'done')
     OR (SELECT count(*) FROM public.tasks
         WHERE user_id = user_one AND srs_lesson_id = 'lesson-a'
           AND srs_review_date = review_day AND deleted_at IS NULL) <> 1 THEN
    RAISE EXCEPTION 'Soft deletion did not free the key while preserving history';
  END IF;

  BEGIN
    UPDATE public.tasks SET deleted_at = NULL WHERE id = original_id;
    RAISE EXCEPTION 'Restoring a duplicate active review was accepted';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
    IF violated_constraint IS DISTINCT FROM 'tasks_srs_review_unique' THEN
      RAISE EXCEPTION 'Unexpected unique constraint: %', violated_constraint;
    END IF;
  END;

  FOR invalid_pair IN
    SELECT * FROM (VALUES
      ('lesson-c'::TEXT, NULL::DATE),
      (NULL::TEXT, review_day),
      (''::TEXT, review_day),
      ('   '::TEXT, review_day),
      (''::TEXT, NULL::DATE)
    ) AS pairs(lesson_id, review_date)
  LOOP
    BEGIN
      INSERT INTO public.tasks (user_id, title, srs_lesson_id, srs_review_date)
      VALUES (user_one, 'Invalid metadata', invalid_pair.lesson_id, invalid_pair.review_date);
      RAISE EXCEPTION 'Invalid metadata pair was accepted: %', invalid_pair;
    EXCEPTION WHEN check_violation THEN
      GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
      IF violated_constraint IS DISTINCT FROM 'tasks_srs_review_pair_check' THEN
        RAISE EXCEPTION 'Unexpected check constraint: %', violated_constraint;
      END IF;
    END;
  END LOOP;

  BEGIN
    UPDATE public.tasks SET srs_review_date = NULL WHERE id = replacement_id;
    RAISE EXCEPTION 'UPDATE accepted an incomplete metadata pair';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
    IF violated_constraint IS DISTINCT FROM 'tasks_srs_review_pair_check' THEN
      RAISE EXCEPTION 'Unexpected check constraint: %', violated_constraint;
    END IF;
  END;

  RAISE NOTICE 'PASS: SRS uniqueness, completion preservation, key independence, manual/legacy tasks, soft deletion, restore conflict, pair validation';
END;
$$;

ROLLBACK;
