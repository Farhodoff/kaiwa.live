-- Run ONLY against a fresh disposable PostgreSQL database: psql -X -v ON_ERROR_STOP=1 -f this_file.sql
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    RAISE EXCEPTION 'This test requires a fresh disposable database';
  END IF;
END $$;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
END $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;
\ir ../migrations/20261028000002_create_lesson_kanji_progress.sql
\ir ../migrations/20261030030348_kanji_srs_writing_progress.sql

INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
INSERT INTO public.lesson_kanji_progress
(id, user_id, lesson_id, kanji, attempts, correct_attempts, mastered, last_reviewed_at, updated_at, srs_stage, interval_days, next_review_at, writing_accuracy, stroke_order_passed, total_written_count)
VALUES
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','jlpt-N5','日',2,2,true,'2026-10-01','2026-10-01',2,3,'2026-10-04',92,true,2),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','jlpt-N5','月',2,2,true,'2026-10-01','2026-10-01',2,3,'2026-10-04',88,true,2);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.lesson_kanji_progress) <> 1 THEN RAISE EXCEPTION 'RLS leaked another user'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.lesson_kanji_progress WHERE writing_accuracy = 92 AND stroke_order_passed AND srs_stage = 2) THEN RAISE EXCEPTION 'Writing/SRS metadata was lost'; END IF;
  BEGIN
    UPDATE public.lesson_kanji_progress SET writing_accuracy = 101;
    RAISE EXCEPTION 'Invalid writing accuracy accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE public.lesson_kanji_progress SET interval_days = 30;
    RAISE EXCEPTION 'Unexpected SRS interval accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE public.lesson_kanji_progress SET user_id = '00000000-0000-0000-0000-000000000002';
    RAISE EXCEPTION 'Ownership reassignment accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN
    PERFORM public.reset_lesson_kanji_progress('00000000-0000-0000-0000-000000000002');
    RAISE EXCEPTION 'Account mismatch accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT public.reset_lesson_kanji_progress('00000000-0000-0000-0000-000000000001');
-- A delayed offline upsert must not undo the reset marker.
INSERT INTO public.lesson_kanji_progress
(id,user_id,lesson_id,kanji,attempts,correct_attempts,mastered,last_reviewed_at,updated_at)
VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','jlpt-N5','日',2,2,true,'2026-10-01','2026-10-01')
ON CONFLICT (user_id,lesson_id,kanji) DO UPDATE SET attempts=excluded.attempts,mastered=excluded.mastered,updated_at=excluded.updated_at;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.lesson_kanji_progress WHERE attempts <> 0 OR mastered OR writing_accuracy IS NOT NULL OR next_review_at IS NOT NULL OR total_written_count <> 0) THEN RAISE EXCEPTION 'Reset resurrected or retained results'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.lesson_kanji_progress WHERE user_id='00000000-0000-0000-0000-000000000002' AND attempts=2 AND writing_accuracy=88) THEN RAISE EXCEPTION 'Reset affected another user'; END IF;
  IF has_function_privilege('anon','public.reset_lesson_kanji_progress(uuid)','execute') THEN RAISE EXCEPTION 'Anonymous reset allowed'; END IF;
END $$;
SELECT 'Kanji SRS/writing metadata, constraints, RLS, reset and stale-upsert checks passed' AS result;
