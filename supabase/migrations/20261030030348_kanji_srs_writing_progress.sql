BEGIN;

ALTER TABLE public.lesson_kanji_progress
  ADD COLUMN srs_stage smallint NOT NULL DEFAULT 0 CHECK (srs_stage BETWEEN 0 AND 4),
  ADD COLUMN interval_days smallint NOT NULL DEFAULT 0 CHECK (interval_days IN (0, 1, 3, 7, 14)),
  ADD COLUMN next_review_at timestamptz,
  ADD COLUMN writing_accuracy double precision CHECK (writing_accuracy BETWEEN 0 AND 100),
  ADD COLUMN stroke_order_passed boolean,
  ADD COLUMN total_written_count integer NOT NULL DEFAULT 0 CHECK (total_written_count >= 0);

UPDATE public.lesson_kanji_progress
SET srs_stage = CASE WHEN mastered THEN 4 ELSE 1 END,
    interval_days = CASE WHEN mastered THEN 14 ELSE 1 END,
    next_review_at = last_reviewed_at + CASE WHEN mastered THEN interval '14 days' ELSE interval '1 day' END
WHERE attempts > 0;

-- Reset markers retain the unique row so delayed offline upserts cannot resurrect old results.
CREATE FUNCTION public.guard_kanji_progress_timestamp() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.updated_at < OLD.updated_at THEN RETURN NULL; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_kanji_progress_timestamp() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_kanji_progress_timestamp
BEFORE UPDATE ON public.lesson_kanji_progress
FOR EACH ROW EXECUTE FUNCTION public.guard_kanji_progress_timestamp();

CREATE FUNCTION public.reset_lesson_kanji_progress(expected_user_id uuid) RETURNS timestamptz
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  reset_at timestamptz := clock_timestamp();
  owner_id uuid := auth.uid();
BEGIN
  IF owner_id IS NULL OR owner_id IS DISTINCT FROM expected_user_id THEN
    RAISE EXCEPTION 'Authentication/account mismatch' USING ERRCODE = '42501';
  END IF;
  -- Advance past existing timestamps, including clients with slightly ahead clocks.
  SELECT greatest(reset_at, coalesce(max(updated_at) + interval '1 millisecond', reset_at))
    INTO reset_at FROM public.lesson_kanji_progress WHERE user_id = owner_id;
  UPDATE public.lesson_kanji_progress
  SET attempts = 0, correct_attempts = 0, mastered = false,
      srs_stage = 0, interval_days = 0, next_review_at = NULL,
      writing_accuracy = NULL, stroke_order_passed = NULL, total_written_count = 0,
      last_reviewed_at = reset_at, updated_at = reset_at
  WHERE user_id = owner_id;
  RETURN reset_at;
END;
$$;
REVOKE ALL ON FUNCTION public.reset_lesson_kanji_progress(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_lesson_kanji_progress(uuid) TO authenticated;
-- Existing owner-only RLS policies continue to protect both functions and all new columns.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_kanji_progress TO authenticated;

COMMIT;
