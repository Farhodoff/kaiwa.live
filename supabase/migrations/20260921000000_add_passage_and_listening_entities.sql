-- Migration: 20260921000000_add_passage_and_listening_entities.sql
-- Description: Add separate Reading Passage and Listening Audio entities for Admin exam editor.
--   - reading_passages: standalone entity; multiple exam_questions can link to one passage (passage_id).
--   - listening_audios: standalone entity storing MP3/WAV audio URL, transcript, Uzbek translation, speaker, duration.
-- Reuses the existing public `listening_audios` storage bucket (created in 20260920000000).

-- 1. Reading passages (separate entity)
CREATE TABLE IF NOT EXISTS public.reading_passages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.exam_sections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Listening audios (separate entity)
CREATE TABLE IF NOT EXISTS public.listening_audios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.exam_sections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    audio_url TEXT, -- path inside the public `listening_audios` storage bucket
    transcript TEXT,
    uz_translation TEXT,
    speaker TEXT,
    duration_seconds INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Link questions to a reading passage and/or a listening audio (nullable FKs).
--    One passage/audio can have many questions.
ALTER TABLE public.exam_questions
    ADD COLUMN IF NOT EXISTS passage_id UUID REFERENCES public.reading_passages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS listening_audio_id UUID REFERENCES public.listening_audios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_exam_questions_passage_id ON public.exam_questions (passage_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_listening_audio_id ON public.exam_questions (listening_audio_id);
CREATE INDEX IF NOT EXISTS idx_reading_passages_exam_id ON public.reading_passages (exam_id);
CREATE INDEX IF NOT EXISTS idx_listening_audios_exam_id ON public.listening_audios (exam_id);

-- 4. RLS
ALTER TABLE public.reading_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_audios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published reading passages" ON public.reading_passages;
CREATE POLICY "Anyone can view published reading passages"
ON public.reading_passages FOR SELECT
USING (EXISTS (SELECT 1 FROM public.exams WHERE id = reading_passages.exam_id AND (is_published = true OR auth.jwt() ->> 'role' = 'admin')));

DROP POLICY IF EXISTS "Admins can manage reading passages" ON public.reading_passages;
CREATE POLICY "Admins can manage reading passages"
ON public.reading_passages FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Anyone can view published listening audios" ON public.listening_audios;
CREATE POLICY "Anyone can view published listening audios"
ON public.listening_audios FOR SELECT
USING (EXISTS (SELECT 1 FROM public.exams WHERE id = listening_audios.exam_id AND (is_published = true OR auth.jwt() ->> 'role' = 'admin')));

DROP POLICY IF EXISTS "Admins can manage listening audios" ON public.listening_audios;
CREATE POLICY "Admins can manage listening audios"
ON public.listening_audios FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- 5. Permissions
GRANT SELECT ON public.reading_passages TO anon, authenticated;
GRANT ALL ON public.reading_passages TO authenticated, service_role;
GRANT SELECT ON public.listening_audios TO anon, authenticated;
GRANT ALL ON public.listening_audios TO authenticated, service_role;
