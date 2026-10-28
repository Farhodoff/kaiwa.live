-- Persist lesson-level kanji review progress for authenticated users.
CREATE TABLE IF NOT EXISTS public.lesson_kanji_progress (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    kanji TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    correct_attempts INTEGER NOT NULL DEFAULT 0 CHECK (correct_attempts >= 0),
    mastered BOOLEAN NOT NULL DEFAULT false,
    last_reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT lesson_kanji_progress_unique_review UNIQUE (user_id, lesson_id, kanji),
    CONSTRAINT lesson_kanji_progress_correct_attempts_valid CHECK (correct_attempts <= attempts)
);

ALTER TABLE public.lesson_kanji_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own lesson kanji progress" ON public.lesson_kanji_progress;
CREATE POLICY "Users can view own lesson kanji progress"
    ON public.lesson_kanji_progress FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own lesson kanji progress" ON public.lesson_kanji_progress;
CREATE POLICY "Users can insert own lesson kanji progress"
    ON public.lesson_kanji_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lesson kanji progress" ON public.lesson_kanji_progress;
CREATE POLICY "Users can update own lesson kanji progress"
    ON public.lesson_kanji_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own lesson kanji progress" ON public.lesson_kanji_progress;
CREATE POLICY "Users can delete own lesson kanji progress"
    ON public.lesson_kanji_progress FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS lesson_kanji_progress_user_lesson_idx
    ON public.lesson_kanji_progress(user_id, lesson_id);
