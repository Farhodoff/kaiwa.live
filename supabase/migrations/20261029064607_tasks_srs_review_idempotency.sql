-- Legacy/manual tasks remain unkeyed; no backfill or task updates.
ALTER TABLE public.tasks
  ADD COLUMN srs_lesson_id TEXT,
  ADD COLUMN srs_review_date DATE,
  ADD CONSTRAINT tasks_srs_review_pair_check CHECK (
    (srs_lesson_id IS NULL AND srs_review_date IS NULL)
    OR (
      srs_lesson_id IS NOT NULL
      AND srs_review_date IS NOT NULL
      AND length(btrim(srs_lesson_id)) > 0
    )
  );

-- Completion does not release the key; only soft deletion does.
CREATE UNIQUE INDEX tasks_srs_review_unique
  ON public.tasks (user_id, srs_lesson_id, srs_review_date)
  WHERE deleted_at IS NULL AND srs_lesson_id IS NOT NULL;
