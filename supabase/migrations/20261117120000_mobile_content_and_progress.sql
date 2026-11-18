-- ============================================================================
-- kaiwa.mobile — PostgreSQL integration
-- Content tables (shared, read-only for the app) + per-user progress tables.
-- Seed data replaces the previous hardcoded mock arrays in the mobile app.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Content tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mobile_lessons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_ja TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'N5',
  minutes INTEGER NOT NULL DEFAULT 10,
  xp INTEGER NOT NULL DEFAULT 30,
  content JSONB NOT NULL DEFAULT '{}'::jsonb, -- {vocab:[], grammar:[], phrases:[]}
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mobile_quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_type TEXT NOT NULL DEFAULT 'lesson' CHECK (quiz_type IN ('lesson', 'mock')),
  lesson_id TEXT REFERENCES public.mobile_lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_ja TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mobile_flashcards (
  id TEXT PRIMARY KEY,
  front TEXT NOT NULL,
  front_ja TEXT,
  back TEXT NOT NULL,
  reading TEXT,
  example TEXT,
  level TEXT DEFAULT 'N3',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mobile_jlpt_sections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_ja TEXT NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 0,
  default_done INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6C5CE7',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.mobile_conversation_topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_ja TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'N5',
  icon TEXT NOT NULL DEFAULT 'chatbubbles',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.mobile_ai_replies (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id TEXT REFERENCES public.mobile_conversation_topics(id) ON DELETE CASCADE,
  ja TEXT NOT NULL,
  uz TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- 2. Per-user tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mobile_user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  xp_goal INTEGER NOT NULL DEFAULT 200,
  streak INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'N3',
  level_progress NUMERIC NOT NULL DEFAULT 0,
  words_learned INTEGER NOT NULL DEFAULT 0,
  daily_goal INTEGER NOT NULL DEFAULT 30,
  daily_goal_done INTEGER NOT NULL DEFAULT 0,
  conversations_done INTEGER NOT NULL DEFAULT 0,
  lessons_done INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  jlpt_done JSONB NOT NULL DEFAULT '{"vocab":0,"grammar":0,"reading":0,"listening":0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mobile_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.mobile_lessons(id) ON DELETE CASCADE,
  progress NUMERIC NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  score NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.mobile_card_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES public.mobile_flashcards(id) ON DELETE CASCADE,
  reviewed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  grade INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, card_id, reviewed_date)
);

CREATE TABLE IF NOT EXISTS public.mobile_daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  xp INTEGER NOT NULL DEFAULT 0,
  minutes INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, day)
);

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.mobile_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_jlpt_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_conversation_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_ai_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_card_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_daily_activity ENABLE ROW LEVEL SECURITY;

-- Content: read-only for signed-in users (web + mobile share it)
DROP POLICY IF EXISTS "mobile content read" ON public.mobile_lessons;
CREATE POLICY "mobile content read" ON public.mobile_lessons
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "mobile content read" ON public.mobile_quiz_questions;
CREATE POLICY "mobile content read" ON public.mobile_quiz_questions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "mobile content read" ON public.mobile_flashcards;
CREATE POLICY "mobile content read" ON public.mobile_flashcards
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "mobile content read" ON public.mobile_jlpt_sections;
CREATE POLICY "mobile content read" ON public.mobile_jlpt_sections
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "mobile content read" ON public.mobile_conversation_topics;
CREATE POLICY "mobile content read" ON public.mobile_conversation_topics
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "mobile content read" ON public.mobile_ai_replies;
CREATE POLICY "mobile content read" ON public.mobile_ai_replies
  FOR SELECT TO authenticated USING (true);

-- User tables: own rows only
DROP POLICY IF EXISTS "own progress" ON public.mobile_user_progress;
CREATE POLICY "own progress" ON public.mobile_user_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own lesson progress" ON public.mobile_lesson_progress;
CREATE POLICY "own lesson progress" ON public.mobile_lesson_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own card reviews" ON public.mobile_card_reviews;
CREATE POLICY "own card reviews" ON public.mobile_card_reviews
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own daily activity" ON public.mobile_daily_activity;
CREATE POLICY "own daily activity" ON public.mobile_daily_activity
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS mobile_quiz_questions_type_idx
  ON public.mobile_quiz_questions (quiz_type, sort_order);
CREATE INDEX IF NOT EXISTS mobile_card_reviews_user_date_idx
  ON public.mobile_card_reviews (user_id, reviewed_date);
CREATE INDEX IF NOT EXISTS mobile_daily_activity_user_day_idx
  ON public.mobile_daily_activity (user_id, day DESC);
CREATE INDEX IF NOT EXISTS mobile_lesson_progress_user_idx
  ON public.mobile_lesson_progress (user_id);

-- ---------------------------------------------------------------------------
-- 5. Seed: lessons (content previously hardcoded in content.ts / LessonDetail)
-- ---------------------------------------------------------------------------

INSERT INTO public.mobile_lessons (id, title, title_ja, level, minutes, xp, content, sort_order) VALUES
(
  'l12', 'At the café', 'カフェで', 'N3', 12, 40,
  '{
    "vocab": [
      {"ja":"コーヒー","romaji":"koohii","uz":"qahva"},
      {"ja":"お願いします","romaji":"onegai shimasu","uz":"Iltimos"},
      {"ja":"美味しい","romaji":"oishii","uz":"mazali"},
      {"ja":"お会計","romaji":"okaikei","uz":"hisob"},
      {"ja":"レシート","romaji":"reshiito","uz":"chek"}
    ],
    "grammar": [
      {"pattern":"〜をください","meaning":"…ni bering","example":"コーヒーをください。 — Qahva bering."},
      {"pattern":"〜ましょう","meaning":"…qilaylik","example":"飲みましょう。 — Ichamiz."},
      {"pattern":"〜たいです","meaning":"…moqchiman","example":"食べたいです — Yemoqchiman"}
    ],
    "phrases": [
      {"ja":"いらっしゃいませ！","uz":"Xush kelibsiz!"},
      {"ja":"何にしますか？","uz":"Nima olmoqchisiz?"},
      {"ja":"少々お待ちください","uz":"Biroz kuting"},
      {"ja":"お会計です","uz":"Hisobingiz"}
    ]
  }'::jsonb, 1
),
('l11', 'Daily routine', '毎日の生活', 'N3', 10, 35, '{}'::jsonb, 2),
('l10', 'Making plans', '予定を立てる', 'N3', 14, 45, '{}'::jsonb, 3),
('l9',  'At the station', '駅で', 'N4', 9, 30, '{}'::jsonb, 4),
('l8',  'Shopping for gifts', 'プレゼントを買う', 'N4', 11, 35, '{}'::jsonb, 5)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, title_ja = EXCLUDED.title_ja, level = EXCLUDED.level,
  minutes = EXCLUDED.minutes, xp = EXCLUDED.xp, content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- 6. Seed: quiz questions (LESSON_QUIZ + MOCK_TEST)
-- ---------------------------------------------------------------------------

INSERT INTO public.mobile_quiz_questions
  (id, quiz_type, lesson_id, question, options, correct_index, explanation, sort_order)
VALUES
('q1', 'lesson', 'l12', '「コーヒーを___。」 — Fill in the blank: "I drank coffee."', '["飲みます","飲みました","食べました","行きました"]'::jsonb, 1, '飲みます = drink (polite). Past polite = 飲みました.', 1),
('q2', 'lesson', 'l12', 'What does 「もう少し」 mean?', '["a little more","very much","not at all","right away"]'::jsonb, 0, 'もう少し = "a little more / a bit longer".', 2),
('q3', 'lesson', 'l12', 'Choose the polite request: "Please wait a moment."', '["待ってください","待ちました","待っています","待たないで"]'::jsonb, 0, '〜てください = please do ~.', 3),
('q4', 'lesson', 'l12', '「この料理は___です。」 — "This dish is delicious."', '["忙しい","おいしい","安い","近い"]'::jsonb, 1, 'おいしい = delicious/tasty.', 4),
('q5', 'lesson', 'l12', 'What is the kanji for "station"?', '["駅","店","学校","町"]'::jsonb, 0, '駅 (えき / eki) = station.', 5),
('m1', 'mock', NULL, 'Read: 「来週、京都へ___。」 — "Next week I will go to Kyoto."', '["行きます","行きました","行って","行く"]'::jsonb, 0, 'Future polite form: 行きます.', 1),
('m2', 'mock', NULL, 'Which word means "because" (casual)?', '["から","けど","ので","しか"]'::jsonb, 2, 'ので = because (neutral/polite). から = because (casual).', 2),
('m3', 'mock', NULL, '「___本ですか。」 — "Whose book is it?"', '["何","誰","どの","誰の"]'::jsonb, 3, '誰の = whose.', 3),
('m4', 'mock', NULL, 'Choose the correct counter for flat things (paper, tickets):', '["〜つ","〜枚","〜本","〜回"]'::jsonb, 1, '枚 (まい) counts flat objects.', 4),
('m5', 'mock', NULL, 'What is the te-form of 書く (to write)?', '["書いて","書きって","書きて","書きして"]'::jsonb, 0, '書く → 書いて (kaku → kaite).', 5)
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question, options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation,
  sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- 7. Seed: flashcards (FLASHCARDS)
-- ---------------------------------------------------------------------------

INSERT INTO public.mobile_flashcards (id, front, front_ja, back, reading, example, level, sort_order) VALUES
('f1', '待つ',   'まつ',     'to wait',          'まつ (matsu)',      'バスを待ちます。 — I wait for the bus.', 'N3', 1),
('f2', '経験',   'けいけん', 'experience',       'けいけん (keiken)', '良い経験でした。 — It was a good experience.', 'N3', 2),
('f3', '続ける', 'つづける', 'to continue',      'つづける (tsuzukeru)', '日本語を勉強し続けます。 — I keep studying Japanese.', 'N3', 3),
('f4', '気持ち', 'きもち',   'feeling / mood',   'きもち (kimochi)',  '気持ちは分かります。— I understand your feelings.', 'N3', 4),
('f5', '間に合う','まにあう', 'to be in time',    'まにあう (maniau)', '電車に間に合いました。— I made it to the train on time.', 'N3', 5),
('f6', '予約',   'よやく',   'reservation',      'よやく (yoyaku)',   'テーブルを予約しました。— I reserved a table.', 'N3', 6)
ON CONFLICT (id) DO UPDATE SET
  front = EXCLUDED.front, back = EXCLUDED.back, reading = EXCLUDED.reading,
  example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- 8. Seed: JLPT sections + conversation topics + scripted replies
-- ---------------------------------------------------------------------------

INSERT INTO public.mobile_jlpt_sections (id, title, title_ja, total_count, default_done, color, sort_order) VALUES
('vocab',     'Vocabulary', '語彙', 35, 24, '#6C5CE7', 1),
('grammar',   'Grammar',    '文法', 30, 18, '#38BDF8', 2),
('reading',   'Reading',    '読解', 20, 9,  '#F59E0B', 3),
('listening', 'Listening',  '聴解', 25, 11, '#22C55E', 4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, title_ja = EXCLUDED.title_ja,
  total_count = EXCLUDED.total_count, default_done = EXCLUDED.default_done,
  color = EXCLUDED.color, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mobile_conversation_topics (id, title, title_ja, level, icon, sort_order) VALUES
('cafe',     'At the café',   'カフェで',   'N3', 'cafe',      1),
('shopping', 'Shopping',      '買い物',     'N4', 'cart',      2),
('travel',   'Travel plans',  '旅行の計画', 'N3', 'airplane',  3),
('work',     'At work',       '仕事で',     'N2', 'briefcase', 4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, title_ja = EXCLUDED.title_ja,
  level = EXCLUDED.level, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

DELETE FROM public.mobile_ai_replies;
INSERT INTO public.mobile_ai_replies (topic_id, ja, uz, sort_order) VALUES
(NULL, 'いらっしゃいませ！今日は何にしますか？', 'Xush kelibsiz! Bugun nima olmoqchisiz?', 1),
(NULL, 'かしこまりました。少々お待ちください。', 'Tushunarli. Iltimos, biroz kuting.', 2),
(NULL, '他にご注文はありますか？', 'Boshqa buyurtmangiz bormi?', 3),
(NULL, 'ありがとうございます！またどうぞ。', 'Rahmat! Yana keling.', 4);
