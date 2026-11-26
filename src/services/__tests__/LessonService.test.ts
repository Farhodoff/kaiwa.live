import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LessonService } from '../LessonService';
import {
  lessonStepTotal,
  recordLessonStep,
  lessonAggregateScore,
} from '../../utils/lessonProgression';
import type { UserLessonProgress } from '../../types/lesson';

describe('LessonService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('retrieves valid lesson by ID', () => {
    const jaLesson = LessonService.getLessonById('ja-n3-u1-l1');
    expect(jaLesson).toBeDefined();
    expect(jaLesson?.language).toBe('ja');
    expect(jaLesson?.level).toBe('N3');
    expect(jaLesson?.steps.length).toBe(3);

    const enLesson = LessonService.getLessonById('en-b2-u1-l1');
    expect(enLesson).toBeDefined();
    expect(enLesson?.language).toBe('en');
    expect(enLesson?.level).toBe('B2');
  });

  it('returns null for non-existent lesson ID', () => {
    const invalidLesson = LessonService.getLessonById('non-existent-id-999');
    expect(invalidLesson).toBeNull();
  });

  it('filters lessons by language track correctly', () => {
    const jaLessons = LessonService.getLessonsForLanguage('ja');
    expect(jaLessons.length).toBeGreaterThan(0);
    jaLessons.forEach((l) => expect(l.language).toBe('ja'));

    const enLessons = LessonService.getLessonsForLanguage('en');
    expect(enLessons.length).toBe(0);
  });

  it('retrieves default starting lesson for language and level', () => {
    const defaultJa = LessonService.getDefaultLessonForLanguage('ja', 'N3');
    expect(defaultJa?.id).toBe('ja-n3-u1-l1');

    const defaultEn = LessonService.getDefaultLessonForLanguage('en', 'B2');
    expect(defaultEn?.id).toBe('en-b2-u1-l1');
  });

  it('validates lesson step types and structured payload integrity', () => {
    const lesson = LessonService.getLessonById('ja-n3-u1-l1')!;
    expect(lesson.steps[0].type).toBe('learn');
    expect(lesson.steps[0].learnData?.explanation).toBeTruthy();
    // Real curriculum embeds vocabulary in the learn step (grammar may be inline in explanation)
    expect(lesson.steps[0].learnData?.vocabulary?.length).toBeGreaterThan(0);

    expect(lesson.steps[1].type).toBe('practice');
    expect(lesson.steps[1].practiceData?.exercises.length).toBeGreaterThan(0);

    expect(lesson.steps[2].type).toBe('test');
    expect(lesson.steps[2].testData?.questions.length).toBeGreaterThan(0);
    expect(lesson.steps[2].testData?.passingScorePercentage).toBe(75);
  });

  it('persists and retrieves user lesson progress', async () => {
    const userId = 'test-user-123';
    const progress = {
      lessonId: 'ja-n3-u1-l1',
      userId,
      currentStepIndex: 1,
      completedStepIds: ['ja-n3-u1-l1-s1'],
      isCompleted: false,
      lastAttemptedAt: new Date().toISOString(),
    };

    await LessonService.saveLessonProgress(userId, progress);

    const loaded = LessonService.getLessonProgress(userId, 'ja-n3-u1-l1');
    expect(loaded).toBeDefined();
    expect(loaded?.currentStepIndex).toBe(1);
    expect(loaded?.completedStepIds).toContain('ja-n3-u1-l1-s1');
    expect(loaded?.isCompleted).toBe(false);
  });

  it('marks lesson as completed with quiz score', async () => {
    const userId = 'test-user-456';
    const quizScore = { score: 4, total: 4, percentage: 100 };

    const lesson = await LessonService.loadLessonById('ja-n3-u1-l1');
    let progress: UserLessonProgress = {
      lessonId: lesson!.id,
      userId,
      currentStepIndex: 0,
      completedStepIds: [],
      isCompleted: false,
      lastAttemptedAt: new Date().toISOString(),
    };
    lesson!.steps.forEach((step, index) => {
      const total = lessonStepTotal(step);
      progress = recordLessonStep(lesson!, progress, index, total, total);
    });
    await LessonService.saveLessonProgress(userId, progress);
    const result = await LessonService.completeLesson(userId, 'ja-n3-u1-l1', quizScore);
    expect(result.isCompleted).toBe(true);
    expect(result.quizScore).toEqual(lessonAggregateScore(lesson!, progress));
    expect(result.completedAt).toBeDefined();

    const stored = LessonService.getLessonProgress(userId, 'ja-n3-u1-l1');
    expect(stored?.isCompleted).toBe(true);
    expect(stored?.quizScore?.percentage).toBe(100);
  });
  it('rejects a completion call without successful step results', async () => {
    await expect(
      LessonService.completeLesson('guest', 'ja-n3-u1-l1', {
        score: 99,
        total: 99,
        percentage: 100,
      }),
    ).rejects.toThrow('barcha bosqichlarini');
    expect(LessonService.getLessonProgress('guest', 'ja-n3-u1-l1')).toBeNull();
  });
});
