import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearningOrchestrator } from '../LearningOrchestrator';
import { LessonService } from '../LessonService';
import { LearningSignalService } from '../LearningSignalService';
import { Flashcard, Subject } from '../../types';

describe('LearningOrchestrator Foundation Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. should resolve default English user learning state', async () => {
    localStorage.setItem('study_planner_primary_language', 'en');
    localStorage.setItem('study_planner_target_level', 'B2');
    localStorage.setItem('study_planner_target_goal', 'IELTS 7.5+');

    const state = await LearningOrchestrator.getUserLearningState('test-user-1');

    expect(state.userId).toBe('test-user-1');
    expect(state.primaryLanguage).toBe('en');
    expect(state.targetLevel).toBe('B2');
    expect(state.targetGoal).toBe('IELTS 7.5+');
    expect(state.availableStudyMinutes).toBe(30);
    expect(state.currentPosition).not.toBeNull();
    expect(state.currentPosition?.courseId).toBeDefined();
  });

  it('2. should resolve Japanese user learning state with JLPT levels', async () => {
    localStorage.setItem('study_planner_primary_language', 'ja');
    localStorage.setItem('study_planner_target_level', 'N3');
    localStorage.setItem('study_planner_target_goal', 'JLPT N2 Pass');

    const state = await LearningOrchestrator.getUserLearningState('test-user-ja');

    expect(state.primaryLanguage).toBe('ja');
    expect(state.targetLevel).toBe('N3');
    expect(state.targetGoal).toBe('JLPT N2 Pass');
    expect(state.currentPosition?.lessonId).toContain('ja-');
  });

  it('3. should prioritize primary language even if secondary languages exist', async () => {
    localStorage.setItem('study_planner_primary_language', 'ja');
    localStorage.setItem('study_planner_enabled_languages', JSON.stringify(['ja', 'en']));

    const state = await LearningOrchestrator.getUserLearningState('test-user-multi');

    expect(state.primaryLanguage).toBe('ja');
    expect(state.enabledLanguages).toEqual(['ja', 'en']);
    expect(state.currentPosition?.lessonId).toContain('ja-');
  });

  it('4. should detect in-progress lesson position correctly', async () => {
    const userId = 'user_in_progress';
    const lessonId = 'ja-n3-u1-l1';

    await LessonService.saveLessonProgress(userId, {
      lessonId,
      userId,
      currentStepIndex: 2,
      completedStepIds: ['ja-n3-u1-l1-s1', 'ja-n3-u1-l1-s2'],
      isCompleted: false,
      quizScore: { score: 0, total: 4, percentage: 0 },
      lastAttemptedAt: new Date().toISOString(),
    });

    const position = LearningOrchestrator.getCurrentLearningPosition(userId, 'ja');

    expect(position).not.toBeNull();
    expect(position?.lessonId).toBe(lessonId);
    expect(position?.stepIndex).toBe(2);
    expect(position?.status).toBe('in_progress');
    expect(position?.percentage).toBeGreaterThan(0);
  });

  it('5. should identify unfinished lessons with step index', async () => {
    const userId = 'user_unfinished';
    await LessonService.saveLessonProgress(userId, {
      lessonId: 'ja-n3-u1-l1',
      userId,
      currentStepIndex: 1,
      completedStepIds: ['ja-n3-u1-l1-s1'],
      isCompleted: false,
      quizScore: { score: 0, total: 4, percentage: 0 },
      lastAttemptedAt: new Date().toISOString(),
    });

    const unfinished = LearningOrchestrator.getUnfinishedLessons(userId, 'ja');

    expect(unfinished.length).toBe(1);
    expect(unfinished[0].lessonId).toBe('ja-n3-u1-l1');
    expect(unfinished[0].lastStepIndex).toBe(1);
    expect(unfinished[0].progressPercentage).toBeGreaterThan(0);
  });

  it('6. should aggregate SRS due, overdue, and new cards accurately', () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const futureDate = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    const mockFlashcards: Flashcard[] = [
      {
        id: 'c1',
        subjectId: 's1',
        front: 'due word',
        back: 'tarjima',
        nextReviewDate: pastDate,
        interval: 1,
        repetitions: 2,
        easeFactor: 2.5,
      },
      {
        id: 'c2',
        subjectId: 's1',
        front: 'new word',
        back: 'tarjima',
        nextReviewDate: '',
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
      },
      {
        id: 'c3',
        subjectId: 's1',
        front: 'future word',
        back: 'tarjima',
        nextReviewDate: futureDate,
        interval: 5,
        repetitions: 3,
        easeFactor: 2.5,
      },
    ];

    const summary = LearningOrchestrator.getReviewSummary('test-user', mockFlashcards);

    expect(summary.totalCards).toBe(3);
    expect(summary.dueCount).toBe(1);
    expect(summary.newCount).toBe(1);
    expect(summary.learnedCount).toBe(2);
    expect(summary.averageRetentionScore).toBeGreaterThan(0);
  });

  it('7. should isolate Japanese SRS counts from unrelated user-created subjects', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const subjects: Subject[] = [
      { id: 'sub-ja', name: 'JLPT N2 Vocabulary', color: '#ef4444', schedule: [] },
      { id: 'sub-math', name: 'N2 Matematika', color: '#10b981', schedule: [] },
    ];
    const cards: Flashcard[] = [
      {
        id: 'ja-card',
        subjectId: 'sub-ja',
        front: '改善',
        back: 'Yaxshilanish',
        nextReviewDate: pastDate,
        interval: 1,
        repetitions: 2,
        easeFactor: 2.5,
      },
      {
        id: 'math-card',
        subjectId: 'sub-math',
        front: 'Formula：速度 = 距離 ÷ 時間',
        back: 'Tezlik formulasi',
        nextReviewDate: pastDate,
        interval: 1,
        repetitions: 2,
        easeFactor: 2.5,
      },
    ];

    const summary = LearningOrchestrator.getReviewSummary('test-user', cards, 'ja', subjects);

    expect(summary.totalCards).toBe(1);
    expect(summary.dueCount).toBe(1);
    expect(summary.learnedCount).toBe(1);
  });

  it('8. should handle empty/no-data user gracefully with clean defaults', async () => {
    const state = await LearningOrchestrator.getUserLearningState('unknown-guest-user');

    expect(state.userId).toBe('unknown-guest-user');
    expect(state.primaryLanguage).toBe('en');
    expect(state.availableStudyMinutes).toBe(30);
    expect(state.reviewSummary.totalCards).toBe(0);
    expect(state.signalsSummary.totalSignalsCount).toBe(0);
    expect(state.recentActivity.lastStudyAt).toBeNull();
  });

  it('8. should fallback missing profile values to foundation levels (Phase 15)', () => {
    const target = LearningOrchestrator.getUserTarget('en');
    expect(target.targetLevel).toBe('A1');
    expect(target.currentLevel).toBe('A1');
    expect(target.targetGoal).toBe('IELTS 7.0+');

    const targetJa = LearningOrchestrator.getUserTarget('ja');
    expect(targetJa.targetLevel).toBe('N5');
    expect(targetJa.currentLevel).toBe('N5');
    expect(targetJa.targetGoal).toBe('JLPT Imtihoni');
  });

  it('9. should handle missing lesson progress without crashing', () => {
    const progress = LessonService.getLessonProgress('random-user-id', 'non-existent-lesson');
    expect(progress).toBeNull();

    const position = LearningOrchestrator.getCurrentLearningPosition('random-user-id', 'en');
    expect(position).not.toBeNull();
    expect(position?.status).toBe('not_started');
  });

  it('10. should be resilient to invalid lesson IDs', () => {
    const lesson = LessonService.getLessonById('invalid-lesson-xyz');
    expect(lesson).toBeNull();
  });

  it('11. should resolve custom 15-minute daily study goal', async () => {
    localStorage.setItem(
      'study_planner_ai_settings',
      JSON.stringify({ dailyStudyGoalMinutes: 15 }),
    );

    const state = await LearningOrchestrator.getUserLearningState('user-15m');
    expect(state.availableStudyMinutes).toBe(15);
  });

  it('12. should resolve custom 60-minute daily study goal', async () => {
    localStorage.setItem(
      'study_planner_ai_settings',
      JSON.stringify({ dailyStudyGoalMinutes: 60 }),
    );

    const state = await LearningOrchestrator.getUserLearningState('user-60m');
    expect(state.availableStudyMinutes).toBe(60);
  });

  it('13. should aggregate learning signals summary for recent mistakes and new vocabulary', async () => {
    const userId = 'signals_test_user';

    await LearningSignalService.recordSignalsBatch([
      {
        id: 's1',
        type: 'incorrect_answer',
        language: 'en',
        lessonId: 'en-b2-u1-l1',
        userId,
        stepId: 's3',
        questionId: 'q1',
        prompt: 'Identify the correct inversion structure',
        userAnswer: 1,
        expectedAnswer: 0,
        attemptCount: 1,
        timestamp: new Date().toISOString(),
      },
      {
        id: 's2',
        type: 'new_vocabulary',
        language: 'en',
        lessonId: 'en-b2-u1-l1',
        userId,
        term: 'Perseverance',
        meaning: 'Matonat',
        timestamp: new Date().toISOString(),
      },
      {
        id: 's3',
        type: 'completed_lesson',
        language: 'en',
        lessonId: 'en-b2-u1-l1',
        userId,
        level: 'B2',
        score: 4,
        total: 4,
        percentage: 100,
        newCardsCreated: 1,
        mistakesCount: 1,
        timestamp: new Date().toISOString(),
      },
    ]);

    const summary = LearningOrchestrator.getLearningSignalsSummary(userId);
    const activity = LearningOrchestrator.getRecentLearningActivity(userId);

    expect(summary.totalSignalsCount).toBe(3);
    expect(summary.recentMistakesCount).toBe(1);
    expect(summary.newVocabCount).toBe(1);
    expect(summary.completedLessonsCount).toBe(1);
    expect(summary.recentMistakeTopics.length).toBeGreaterThan(0);
    expect(activity.lastCompletedLessonId).toBe('en-b2-u1-l1');
  });

  it('14. should deduplicate cards by front in getReviewSummary so duplicate cards across decks do not distort SRS metrics', () => {
    const userId = 'srs_dedup_user';
    const subjectId = 'sub-ja-1';

    localStorage.setItem(
      'study_planner_subjects_cache_' + userId,
      JSON.stringify([{ id: subjectId, name: 'JLPT N5 Words', language: 'ja' }]),
    );

    // Two cards for '病院': one studied (interval 10, reps 3), one unstudied duplicate (interval 0, reps 0)
    // Plus one card for '猫'
    const cards = [
      {
        id: 'c1',
        subjectId,
        front: '病院',
        back: 'Kasalxona',
        repetitions: 3,
        interval: 10,
        easeFactor: 2.5,
        nextReviewDate: new Date('2026-10-30T00:00:00Z').toISOString(),
      },
      {
        id: 'c2',
        subjectId,
        front: '病院',
        back: 'Kasalxona',
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewDate: new Date('2026-10-01T00:00:00Z').toISOString(),
      },
      {
        id: 'c3',
        subjectId,
        front: '猫',
        back: 'Mushuk',
        repetitions: 1,
        interval: 3,
        easeFactor: 2.5,
        nextReviewDate: new Date('2026-10-25T00:00:00Z').toISOString(),
      },
    ];

    localStorage.setItem('study_planner_flashcards_cache_' + userId, JSON.stringify(cards));

    const subjects = [
      { id: subjectId, name: 'JLPT N5 Words', language: 'ja' },
    ] as unknown as Subject[];
    const summary = LearningOrchestrator.getReviewSummary(userId, cards, 'ja', subjects);
    // totalCards should be 2 unique words (病院 and 猫), not 3!
    expect(summary.totalCards).toBe(2);
    expect(summary.learnedCount).toBe(2); // Both unique words have mature representation
    expect(summary.newCount).toBe(0);
  });
});
