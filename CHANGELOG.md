# Changelog

All notable changes to **Nihongo Talk** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-20

### 🚀 Added

- **10-Stage JLPT Curriculum & Learning Ecosystem:** Full pedagogical overhaul addressing all items tracked in `kamchilik.md`.
- **7-Skill Matrix Engine & Visual Radar (`SkillMatrixService.ts` & `JlptSkillMatrixView.tsx`):**
  - Measures mastery across Vocabulary, Grammar, Kanji, Reading (Dokkai), Listening (Choukai), Writing, and Speaking for N5–N1 levels.
  - Multi-format validation requiring $\ge 2$ distinct activity types and 85% accuracy benchmark.
- **Adaptive Difficulty Engine (`AdaptiveDifficultyEngine.ts`):**
  - Real-time diagnostic evaluation, learner profiling (Advance, Standard, Remediate), and automatic next-lesson recommendation with deterministic fallback.
- **Curriculum Lesson Practice Expansion (1,238 Exercises):**
  - Practice exercises increased from 281 to **1,238** across N5–N1 lessons.
  - Diverse question formats: context fill-in-the-blank, particle completion, sentence ordering (`★`), and bidirectional translation.
- **Official JLPT Mock Exam Simulator:**
  - Randomized dynamic 25-question variants pulled from comprehensive question pools.
  - No-repeat question filtering via local storage tracking.
  - Official 180-point scaled scoring and statistical **JLPT Pass Probability** indicator.
- **Complete Kanji Cycle & Confusing Kanji Comparator (`ConfusingKanjiComparator.tsx`):**
  - Stroke order step-by-step animations with stroke count and readings.
  - HTML5 Kanji canvas practice with Hanko/Sumi brush colors, ghost template, memory, and step-by-step drawing modes.
  - Interactive comparison of 10 key confusing kanji pairs across N5–N1 with discrimination quizzes.
- **Listening (Choukai) Enhancements:**
  - Exam script hidden until submission to emulate authentic test conditions.
  - Playback speed controls (0.8x, 1.0x, 1.2x, 1.5x), speaker gender badges, and gap-by-gap loop/shadowing mode.
  - 1-click mistake export to Anki SRS flashcards.
- **6-Dimensional Speaking Rubric (`SpeakingSection.tsx` & `SessionReportModal.tsx`):**
  - Evaluates pronunciation (pitch accent), fluency, grammar, vocabulary range, naturalness (nuance), and hesitation management.
- **Error Explanation & Distractor Analysis (`MistakeVaultService.ts` & `JlptMistakeNotebook.tsx`):**
  - Automatic broken grammar rule identification.
  - Detailed distractor breakdown explaining why incorrect choices are invalid and what trap they present.
  - Instant remedial drill generator.
- **Offline Resilience & Sync Status Bar (`OfflineSyncStatusBar.tsx`):**
  - Transparent banner showing offline status, local TTS fallback warnings, and un-synced mutation count.
  - 1-click manual sync flushing offline queues (flashcards, exams, speaking, gamification, lessons) to Supabase.

### 🛠 Fixed

- **Duplicate Kanji IDs:** Resolved duplicate identifiers `kanji_n1_scorn` and `kanji_n1_dark` in `jlptKanjiDatabase.json`.
- **Silent 85-Point Writing Evaluator:** Removed hardcoded 85-point fallback in `JlptWritingPage.tsx`; wired to real evaluation engine.
- **Missing Audio URLs:** Populated missing `audioUrl` entries across mock exams and listening datasets with valid studio audio paths.
- **Vocabulary Data Quality Pipeline (12,025 Words):**
  - Filled missing example sentences and Uzbek translations across N4, N2, and N1.
  - Deduplicated cross-level vocabulary overlaps in N3 and N2.
  - Generated phonetically accurate Romaji with particle separation for 666 N5 and 618 N3 words.
  - Enforced automated data integrity validation via `dataIntegritySchema.test.ts` (20/20 passing tests).
- **README & Marketing Claims:** Corrected overstatements to accurately reflect curated JLPT preparation tools.

---

## [1.1.0] - 2026-09-15

- Enhanced real-time speech analytics and voice roleplay scenarios.
- Integrated PWA Service Worker caching and offline sync queue coordinator.
- Added JLPT Hub page and gamified study rooms.
