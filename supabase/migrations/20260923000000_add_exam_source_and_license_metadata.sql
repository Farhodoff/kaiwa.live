-- Migration: 20260923000000_add_exam_source_and_license_metadata.sql
-- Description: Add Source name, source URL, author, license type, copyright confirmation and official JLPT flags.

-- 1. Add fields to public.exams
ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS source_name TEXT,
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS author TEXT,
    ADD COLUMN IF NOT EXISTS license_type TEXT NOT NULL DEFAULT 'original',
    ADD COLUMN IF NOT EXISTS copyright_confirmed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_official_jlpt BOOLEAN NOT NULL DEFAULT false;

-- 2. Add fields to public.exam_questions
ALTER TABLE public.exam_questions
    ADD COLUMN IF NOT EXISTS source_name TEXT,
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS author TEXT,
    ADD COLUMN IF NOT EXISTS license_type TEXT NOT NULL DEFAULT 'original',
    ADD COLUMN IF NOT EXISTS copyright_confirmed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_official_jlpt BOOLEAN NOT NULL DEFAULT false;

-- 3. Add fields to public.reading_passages
ALTER TABLE public.reading_passages
    ADD COLUMN IF NOT EXISTS source_name TEXT,
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS author TEXT,
    ADD COLUMN IF NOT EXISTS license_type TEXT NOT NULL DEFAULT 'original',
    ADD COLUMN IF NOT EXISTS copyright_confirmed BOOLEAN NOT NULL DEFAULT false;

-- 4. Add fields to public.listening_audios
ALTER TABLE public.listening_audios
    ADD COLUMN IF NOT EXISTS source_name TEXT,
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS author TEXT,
    ADD COLUMN IF NOT EXISTS license_type TEXT NOT NULL DEFAULT 'original',
    ADD COLUMN IF NOT EXISTS copyright_confirmed BOOLEAN NOT NULL DEFAULT false;

-- 5. Indexes for fast filtering and audits
CREATE INDEX IF NOT EXISTS idx_exams_license_type ON public.exams (license_type);
CREATE INDEX IF NOT EXISTS idx_exams_is_official ON public.exams (is_official_jlpt);
CREATE INDEX IF NOT EXISTS idx_exam_questions_license_type ON public.exam_questions (license_type);
