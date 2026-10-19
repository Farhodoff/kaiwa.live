import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpacedRepetitionEngine } from '../SpacedRepetitionEngine';
import { LessonService } from '../LessonService';
import { TaskService } from '../TaskService';
import { Rating } from '../../utils/srs';
import { Flashcard, Task } from '../../types';

describe('SpacedRepetitionEngine (SM-2 / MF2M)', () => {
  const testUserId = 'test-srs-user-123';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    SpacedRepetitionEngine.clearLessonReviews(testUserId);
  });

  describe('1. Flashcard SRS SM-2 / MF2M Calculation', () => {
    it('calculates first review for brand new cards based on grade', () => {
      const baseDate = new Date('2026-10-19T10:00:00.000Z');

      // Rating.EASY (3) -> initial interval 4 days
      const easyResult = SpacedRepetitionEngine.calculateFlashcardReview(
        { interval: 0, repetitions: 0, easeFactor: 2.5 },
        Rating.EASY,
        baseDate,
      );
      expect(easyResult.interval).toBe(4);
      expect(easyResult.repetitions).toBe(1);
      expect(easyResult.dueDate).toBe('2026-10-23');

      // Rating.GOOD (2) -> initial interval 2 days
      const goodResult = SpacedRepetitionEngine.calculateFlashcardReview(
        { interval: 0, repetitions: 0, easeFactor: 2.5 },
        Rating.GOOD,
        baseDate,
      );
      expect(goodResult.interval).toBe(2);
      expect(goodResult.repetitions).toBe(1);
      expect(goodResult.dueDate).toBe('2026-10-21');

      // Rating.HARD (1) -> initial interval 1 day
      const hardResult = SpacedRepetitionEngine.calculateFlashcardReview(
        { interval: 0, repetitions: 0, easeFactor: 2.5 },
        Rating.HARD,
        baseDate,
      );
      expect(hardResult.interval).toBe(1);
      expect(hardResult.repetitions).toBe(1);
      expect(hardResult.dueDate).toBe('2026-10-20');

      // Rating.AGAIN (0) -> reset interval 1 day, 0 repetitions
      const againResult = SpacedRepetitionEngine.calculateFlashcardReview(
        { interval: 0, repetitions: 0, easeFactor: 2.5 },
        Rating.AGAIN,
        baseDate,
      );
      expect(againResult.interval).toBe(1);
      expect(againResult.repetitions).toBe(0);
      expect(againResult.dueDate).toBe('2026-10-20');
    });

    it('scales interval and adjusts ease factor on successive reviews', () => {
      const baseDate = new Date('2026-10-19T10:00:00.000Z');

      const rep2Result = SpacedRepetitionEngine.calculateFlashcardReview(
        { interval: 2, repetitions: 1, easeFactor: 2.5 },
        Rating.GOOD,
        baseDate,
      );
      expect(rep2Result.repetitions).toBe(2);
      expect(rep2Result.interval).toBe(6);

      const rep3Result = SpacedRepetitionEngine.calculateFlashcardReview(
        { interval: 6, repetitions: 2, easeFactor: rep2Result.easeFactor },
        Rating.GOOD,
        baseDate,
      );
      expect(rep3Result.repetitions).toBe(3);
      expect(rep3Result.interval).toBeGreaterThanOrEqual(14);
    });

    it('enforces ease factor lower bound at 1.3', () => {
      const baseDate = new Date('2026-10-19T10:00:00.000Z');
      let currentEF = 1.3;

      for (let i = 0; i < 5; i++) {
        const result = SpacedRepetitionEngine.calculateFlashcardReview(
          { interval: 1, repetitions: 1, easeFactor: currentEF },
          Rating.AGAIN,
          baseDate,
        );
        currentEF = result.easeFactor;
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      }
      expect(currentEF).toBe(1.3);
    });
  });

  describe('2. Flashcard Queue Summary & Retention Estimation', () => {
    it('summarizes overdue, due today, and new flashcards accurately', () => {
      const mockCards: Flashcard[] = [
        {
          id: 'card-1',
          subjectId: 'sub-1',
          front: 'Neko',
          back: 'Cat',
          repetitions: 0, // new
        } as Flashcard,
        {
          id: 'card-2',
          subjectId: 'sub-1',
          front: 'Inu',
          back: 'Dog',
          repetitions: 1,
          nextReviewDate: '2026-10-10T00:00:00.000Z', // overdue
        } as Flashcard,
        {
          id: 'card-3',
          subjectId: 'sub-1',
          front: 'Tori',
          back: 'Bird',
          repetitions: 2,
          nextReviewDate: '2026-10-19T05:00:00.000Z', // due today
        } as Flashcard,
        {
          id: 'card-4',
          subjectId: 'sub-1',
          front: 'Sakana',
          back: 'Fish',
          repetitions: 2,
          nextReviewDate: '2026-10-28T00:00:00.000Z', // future
        } as Flashcard,
      ];

      const now = new Date('2026-10-19T12:00:00.000Z');
      const summary = SpacedRepetitionEngine.getFlashcardQueueSummary(mockCards, now);

      expect(summary.newCount).toBe(1);
      expect(summary.overdueCount).toBe(1);
      expect(summary.dueTodayCount).toBe(1);
      expect(summary.totalDueCount).toBe(2);
      expect(summary.averageRetentionRate).toBeGreaterThan(0);
      expect(summary.averageRetentionRate).toBeLessThanOrEqual(100);
    });

    it('returns 100% retention rate if no cards have been studied yet', () => {
      const brandNewCards: Flashcard[] = [
        { id: 'c1', subjectId: 's1', front: 'A', back: 'B', repetitions: 0 } as Flashcard,
      ];
      const rate = SpacedRepetitionEngine.calculateEstimatedRetention(brandNewCards);
      expect(rate).toBe(100);
    });
  });

  describe('3. Flashcard 7-Day Review Forecast', () => {
    it('builds daily breakdown rolling overdue cards into today', () => {
      const now = new Date('2026-10-19T12:00:00.000Z');
      const mockCards: Flashcard[] = [
        {
          id: 'card-overdue',
          subjectId: 'sub-1',
          front: 'A',
          back: 'B',
          repetitions: 1,
          nextReviewDate: '2026-10-15T00:00:00.000Z', // overdue -> rolls into today
        } as Flashcard,
        {
          id: 'card-today',
          subjectId: 'sub-1',
          front: 'C',
          back: 'D',
          repetitions: 1,
          nextReviewDate: '2026-10-19T00:00:00.000Z', // today
        } as Flashcard,
        {
          id: 'card-tomorrow',
          subjectId: 'sub-1',
          front: 'E',
          back: 'F',
          repetitions: 1,
          nextReviewDate: '2026-10-20T00:00:00.000Z', // tomorrow
        } as Flashcard,
      ];

      const forecast = SpacedRepetitionEngine.getFlashcardReviewForecast(mockCards, 7, now);
      expect(forecast.length).toBe(7);

      const todayItem = forecast.find((f) => f.isToday);
      expect(todayItem).toBeDefined();
      expect(todayItem?.dueCount).toBe(2); // 1 overdue + 1 today

      const tomorrowItem = forecast.find((f) => f.date === '2026-10-20');
      expect(tomorrowItem?.dueCount).toBe(1);
    });
  });

  describe('4. Automated Lesson Review Scheduling', () => {
    it('schedules review with EASY interval (4 days) for test score >= 90%', () => {
      const baseDate = new Date('2026-10-19T10:00:00.000Z');
      const review = SpacedRepetitionEngine.scheduleLessonReview(testUserId, 'ja-n3-u1-l1', {
        quizScorePercentage: 95,
        baseDate,
      });

      expect(review.lessonId).toBe('ja-n3-u1-l1');
      expect(review.interval).toBe(4);
      expect(review.repetitions).toBe(1);
      expect(review.quizScorePercentage).toBe(95);
      expect(review.dueDate).toBe('2026-10-23');
      expect(review.status).toBe('upcoming');
    });

    it('schedules review with GOOD interval (2 days) for test score 75-89%', () => {
      const baseDate = new Date('2026-10-19T10:00:00.000Z');
      const review = SpacedRepetitionEngine.scheduleLessonReview(testUserId, 'ja-n3-u1-l1', {
        quizScorePercentage: 80,
        baseDate,
      });

      expect(review.interval).toBe(2);
      expect(review.repetitions).toBe(1);
      expect(review.dueDate).toBe('2026-10-21');
    });

    it('schedules review with HARD interval (1 day) for test score 50-74%', () => {
      const baseDate = new Date('2026-10-19T10:00:00.000Z');
      const review = SpacedRepetitionEngine.scheduleLessonReview(testUserId, 'ja-n3-u1-l1', {
        quizScorePercentage: 60,
        baseDate,
      });

      expect(review.interval).toBe(1);
      expect(review.repetitions).toBe(1);
      expect(review.dueDate).toBe('2026-10-20');
    });

    it('schedules review with AGAIN interval (1 day, 0 reps) for test score < 50%', () => {
      const baseDate = new Date('2026-10-19T10:00:00.000Z');
      const review = SpacedRepetitionEngine.scheduleLessonReview(testUserId, 'ja-n3-u1-l1', {
        quizScorePercentage: 40,
        baseDate,
      });

      expect(review.interval).toBe(1);
      expect(review.repetitions).toBe(0);
      expect(review.dueDate).toBe('2026-10-20');
    });

    it('persists and retrieves scheduled reviews across calls', () => {
      SpacedRepetitionEngine.scheduleLessonReview(testUserId, 'ja-n3-u1-l1', {
        quizScorePercentage: 85,
      });

      const list = SpacedRepetitionEngine.getLessonReviews(testUserId);
      expect(list.length).toBe(1);
      expect(list[0].lessonId).toBe('ja-n3-u1-l1');

      const single = SpacedRepetitionEngine.getLessonReviewItem(testUserId, 'ja-n3-u1-l1');
      expect(single).not.toBeNull();
      expect(single?.lessonTitle).toContain('Passive Voice');
    });

    it('records review session and advances SM-2 interval', () => {
      const first = SpacedRepetitionEngine.scheduleLessonReview(testUserId, 'ja-n3-u1-l1', {
        quizScorePercentage: 80,
        baseDate: new Date('2026-10-19T00:00:00.000Z'),
      });
      expect(first.repetitions).toBe(1);
      expect(first.interval).toBe(2);

      const advanced = SpacedRepetitionEngine.recordLessonReview(
        testUserId,
        'ja-n3-u1-l1',
        Rating.GOOD,
        90,
      );
      expect(advanced.repetitions).toBe(2);
      expect(advanced.interval).toBe(6);
    });
  });

  describe('5. Lesson Review Timetable & Due Filtering', () => {
    it('detects due and overdue lessons accurately', () => {
      const pastDate = new Date('2026-10-10T00:00:00.000Z');
      SpacedRepetitionEngine.scheduleLessonReview(testUserId, 'ja-n3-u1-l1', {
        quizScorePercentage: 80,
        baseDate: pastDate,
      });

      const now = new Date('2026-10-19T12:00:00.000Z');
      const dueList = SpacedRepetitionEngine.getDueLessonReviews(testUserId, now);
      expect(dueList.length).toBe(1);
      expect(dueList[0].status).toBe('overdue');
    });

    it('generates multi-day timetable grouping lessons by date', () => {
      const now = new Date('2026-10-19T12:00:00.000Z');
      SpacedRepetitionEngine.scheduleLessonReview(testUserId, 'ja-n3-u1-l1', {
        quizScorePercentage: 80, // interval = 2 -> due 2026-10-21
        baseDate: now,
      });

      const schedule = SpacedRepetitionEngine.getLessonReviewSchedule(testUserId, 5, now);
      expect(schedule.length).toBe(5);

      const targetDay = schedule.find((s) => s.date === '2026-10-21');
      expect(targetDay).toBeDefined();
      expect(targetDay?.lessons.length).toBe(1);
      expect(targetDay?.lessons[0].lessonId).toBe('ja-n3-u1-l1');
    });
  });

  describe('6. Task Synchronization (generateReviewTasks)', () => {
    it('creates tasks for due lesson reviews and skips duplicates', async () => {
      const addTaskSpy = vi.spyOn(TaskService, 'addTask').mockResolvedValue({
        id: 'task-new-1',
        title: 'Takrorlash: Lesson',
        userId: testUserId,
        dueDate: '2026-10-19T10:00:00.000Z',
        completed: false,
        status: 'todo',
        priority: 'high',
      } as Task);

      // Schedule a lesson due in the past (overdue)
      SpacedRepetitionEngine.scheduleLessonReview(testUserId, 'ja-n3-u1-l1', {
        quizScorePercentage: 70,
        baseDate: new Date('2026-10-10T00:00:00.000Z'),
      });

      const created = await SpacedRepetitionEngine.generateReviewTasks(testUserId, []);
      expect(created.length).toBe(1);
      expect(addTaskSpy).toHaveBeenCalledTimes(1);

      // Calling again with existing tasks prevents duplicates
      const existing: Task[] = [
        {
          id: 'existing-1',
          title: `🔄 Takrorlash: Passive Voice (受身形): Direct & Suffering Passive (迷惑の受身)`,
          dueDate: `${new Date().toISOString().slice(0, 10)}T10:00:00.000Z`,
          completed: false,
          status: 'todo',
          priority: 'high',
        } as Task,
      ];
      addTaskSpy.mockClear();

      const createdSecond = await SpacedRepetitionEngine.generateReviewTasks(testUserId, existing);
      expect(createdSecond.length).toBe(0);
      expect(addTaskSpy).not.toHaveBeenCalled();
    });
  });

  describe('7. LessonService Automatic Integration', () => {
    it('automatically schedules lesson review when completeLesson is called', async () => {
      const progress = await LessonService.completeLesson(testUserId, 'ja-n3-u1-l1', {
        score: 9,
        total: 10,
        percentage: 90,
      });

      expect(progress.isCompleted).toBe(true);

      const review = SpacedRepetitionEngine.getLessonReviewItem(testUserId, 'ja-n3-u1-l1');
      expect(review).not.toBeNull();
      expect(review?.interval).toBe(4); // score 90% -> EASY -> 4 days
      expect(review?.repetitions).toBe(1);
      expect(review?.quizScorePercentage).toBe(90);
    });

    it('ensures schedule is created when saveLessonProgress is called with isCompleted: true', async () => {
      await LessonService.saveLessonProgress(testUserId, {
        lessonId: 'ja-n3-u1-l1',
        userId: testUserId,
        currentStepIndex: 2,
        completedStepIds: ['s1', 's2', 's3'],
        isCompleted: true,
        quizScore: { score: 8, total: 10, percentage: 80 },
        lastAttemptedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });

      const review = SpacedRepetitionEngine.getLessonReviewItem(testUserId, 'ja-n3-u1-l1');
      expect(review).not.toBeNull();
      expect(review?.quizScorePercentage).toBe(80);
      expect(review?.interval).toBe(2); // score 80% -> GOOD -> 2 days
    });
  });
});
