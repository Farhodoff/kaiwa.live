-- Migration: 20261022000000_add_jlpt_question_type_payload.sql
-- Description: Adds the extended JLPT N3-N1 question type discriminator and a
-- JSONB payload for type-specific data (sentence-ordering fragments/order,
-- option snapshots and future per-type fields).

ALTER TABLE public.exam_questions
    ADD COLUMN IF NOT EXISTS question_type TEXT,
    ADD COLUMN IF NOT EXISTS question_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'exam_questions_question_type_check'
          AND conrelid = 'public.exam_questions'::regclass
    ) THEN
        ALTER TABLE public.exam_questions
            ADD CONSTRAINT exam_questions_question_type_check
            CHECK (
                question_type IS NULL OR question_type IN (
                    'vocabulary_meaning',
                    'kanji_reading',
                    'grammar_fill_blank',
                    'sentence_ordering',
                    'synonym_nuance',
                    'reading_main_idea',
                    'reading_detail',
                    'reading_inference',
                    'listening_situation',
                    'listening_intention',
                    'listening_summary'
                )
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_questions_question_type
    ON public.exam_questions (question_type)
    WHERE question_type IS NOT NULL;

COMMENT ON COLUMN public.exam_questions.question_type IS
    'Extended JLPT N3-N1 question type (vocabulary, kanji, grammar, ordering, reading, listening).';
COMMENT ON COLUMN public.exam_questions.question_payload IS
    'Type-specific question data, e.g. sentence-ordering fragments/correct_order/star_position.';
