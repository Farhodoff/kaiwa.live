-- ============================================================================
-- Allow anonymous (guest) users to read shared educational content on mobile
-- ============================================================================

DROP POLICY IF EXISTS "mobile content read" ON public.mobile_lessons;
CREATE POLICY "mobile content read" ON public.mobile_lessons
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "mobile content read" ON public.mobile_quiz_questions;
CREATE POLICY "mobile content read" ON public.mobile_quiz_questions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "mobile content read" ON public.mobile_flashcards;
CREATE POLICY "mobile content read" ON public.mobile_flashcards
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "mobile content read" ON public.mobile_jlpt_sections;
CREATE POLICY "mobile content read" ON public.mobile_jlpt_sections
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "mobile content read" ON public.mobile_conversation_topics;
CREATE POLICY "mobile content read" ON public.mobile_conversation_topics
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "mobile content read" ON public.mobile_ai_replies;
CREATE POLICY "mobile content read" ON public.mobile_ai_replies
  FOR SELECT TO anon, authenticated USING (true);
