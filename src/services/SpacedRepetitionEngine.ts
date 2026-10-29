import { Flashcard, Task } from '../types';
import { SupportedLanguage } from '../types/lesson';
import { LessonService } from './LessonService';
import { TaskService } from './TaskService';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { Rating, Grade, calculateReview } from '../utils/srs';
import { format } from 'date-fns';

export interface LessonReviewItem {
  lessonId: string;
  userId: string;
  lessonTitle: string;
  level: string;
  language: SupportedLanguage;
  lastStudiedAt: string; // ISO string
  nextReviewDate: string; // ISO string
  dueDate: string; // YYYY-MM-DD
  interval: number; // in days
  repetitions: number;
  easeFactor: number;
  quizScorePercentage: number;
  retentionProbability: number; // 0..100
  status: 'overdue' | 'due_today' | 'upcoming';
}

export interface FlashcardReviewForecastItem {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  dueCount: number;
  isToday: boolean;
}

export interface SrsQueueSummary {
  overdueCount: number;
  dueTodayCount: number;
  newCount: number;
  totalDueCount: number;
  averageRetentionRate: number; // 0..100
}

const LESSON_REVIEWS_STORAGE_PREFIX = 'study_planner_lesson_srs_reviews_';

export class SpacedRepetitionEngine {
  private static taskSyncs = new Map<string, Promise<Task[]>>();

  // ==========================================
  // 1. FLASHCARD SPACED REPETITION (SM-2 / MF2M)
  // ==========================================

  /**
   * Calculate next review interval, ease factor, and due date for a flashcard using SM-2 / MF2M.
   */
  static calculateFlashcardReview(
    card: {
      interval?: number;
      repetitions?: number;
      easeFactor?: number;
    },
    grade: Grade,
    baseDate: string | Date = new Date(),
  ) {
    const priorInterval = Math.max(0, card.interval || 0);
    const priorRepetitions = Math.max(0, card.repetitions || 0);
    const priorEaseFactor = Math.max(1.3, card.easeFactor || 2.5);

    return calculateReview(grade, priorInterval, priorRepetitions, priorEaseFactor, baseDate);
  }

  /**
   * Determine review queue summary for a given flashcards collection.
   */
  static getFlashcardQueueSummary(cards: Flashcard[], now: Date = new Date()): SrsQueueSummary {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const nowTime = now.getTime();

    let overdueCount = 0;
    let dueTodayCount = 0;
    let newCount = 0;

    for (const card of cards) {
      if (card.deletedAt) continue;

      const reps = card.repetitions ?? 0;
      if (reps === 0) {
        newCount++;
        continue;
      }

      const reviewDate = card.nextReviewDate;
      if (!reviewDate) {
        dueTodayCount++;
        continue;
      }

      const reviewTime = new Date(reviewDate).getTime();
      if (reviewTime < startOfToday) {
        overdueCount++;
      } else if (reviewTime <= nowTime) {
        dueTodayCount++;
      }
    }

    const averageRetentionRate = this.calculateEstimatedRetention(cards, now);

    return {
      overdueCount,
      dueTodayCount,
      newCount,
      totalDueCount: overdueCount + dueTodayCount,
      averageRetentionRate,
    };
  }

  /**
   * Forecast how many flashcards will be due for review over the next N days.
   */
  static getFlashcardReviewForecast(
    cards: Flashcard[],
    daysAhead: number = 7,
    now: Date = new Date(),
  ): FlashcardReviewForecastItem[] {
    const forecast: FlashcardReviewForecastItem[] = [];
    const safeDays = Math.max(1, Math.min(30, daysAhead));

    const dayCounts = new Map<string, number>();

    // Initialize map for all forecasted days
    for (let i = 0; i < safeDays; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      dayCounts.set(dateStr, 0);
    }

    // Tally cards by their due date
    for (const card of cards) {
      if (card.deletedAt) continue;
      if (!card.nextReviewDate && (card.repetitions || 0) === 0) continue;

      let dueDateStr = '';
      if (card.nextReviewDate) {
        dueDateStr = card.nextReviewDate.slice(0, 10);
      } else {
        dueDateStr = format(now, 'yyyy-MM-dd');
      }

      // If overdue, accumulate into today's bucket
      const todayStr = format(now, 'yyyy-MM-dd');
      if (dueDateStr < todayStr) {
        dueDateStr = todayStr;
      }

      if (dayCounts.has(dueDateStr)) {
        dayCounts.set(dueDateStr, (dayCounts.get(dueDateStr) || 0) + 1);
      }
    }

    // Format output
    dayCounts.forEach((count, dateStr) => {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const isToday = dateStr === format(now, 'yyyy-MM-dd');
      const dayLabel = format(d, 'EEE'); // Mon, Tue, etc.

      forecast.push({
        date: dateStr,
        dayLabel,
        dueCount: count,
        isToday,
      });
    });

    return forecast;
  }

  /**
   * Estimate recall retention probability across cards using the Ebbinghaus forgetting curve:
   * R = e^(-t / S), where S = interval (stability in days) and t = elapsed days.
   */
  static calculateEstimatedRetention(cards: Flashcard[], now: Date = new Date()): number {
    const reviewedCards = cards.filter((c) => !c.deletedAt && (c.repetitions || 0) > 0);
    if (reviewedCards.length === 0) return 100;

    const nowTime = now.getTime();
    let totalRetention = 0;

    for (const card of reviewedCards) {
      const interval = Math.max(1, card.interval || 1);
      let elapsedDays = 0;

      if (card.nextReviewDate) {
        const nextReviewTime = new Date(card.nextReviewDate).getTime();
        const scheduledCreatedTime = nextReviewTime - interval * 24 * 60 * 60 * 1000;
        elapsedDays = Math.max(0, (nowTime - scheduledCreatedTime) / (24 * 60 * 60 * 1000));
      }

      // Stability with ease factor weighting
      const stability = interval * (card.easeFactor ? card.easeFactor / 2.5 : 1.0);
      // Forgetting curve: R = exp(-elapsed / stability)
      const retention = Math.exp(-elapsedDays / Math.max(0.5, stability));
      totalRetention += Math.max(0.1, Math.min(1.0, retention));
    }

    return Math.round((totalRetention / reviewedCards.length) * 100);
  }

  // ==========================================
  // 2. AUTOMATIC LESSON SPACED REPETITION SCHEDULING
  // ==========================================

  /**
   * Automatically schedule spaced repetition review for a lesson encountered by the user.
   * Converts quiz performance or completion into an SM-2 / MF2M review interval.
   */
  static scheduleLessonReview(
    userId: string,
    lessonId: string,
    options: {
      grade?: Grade;
      quizScorePercentage?: number;
      completedAt?: string;
      priorRecord?: LessonReviewItem;
      baseDate?: string | Date;
    } = {},
  ): LessonReviewItem {
    const activeUserId = userId || 'guest';
    const now = options.baseDate ? new Date(options.baseDate) : new Date();
    const completedAt = options.completedAt || now.toISOString();
    const score = Math.max(0, Math.min(100, options.quizScorePercentage ?? 80));

    // Map quiz score to SM-2 Grade if not explicitly provided
    let grade: Grade = options.grade !== undefined ? options.grade : Rating.GOOD;
    if (options.grade === undefined) {
      if (score >= 90) {
        grade = Rating.EASY;
      } else if (score >= 75) {
        grade = Rating.GOOD;
      } else if (score >= 50) {
        grade = Rating.HARD;
      } else {
        grade = Rating.AGAIN;
      }
    }

    // Load existing record if not provided
    const prior = options.priorRecord || this.getLessonReviewItem(activeUserId, lessonId);
    const priorInterval = prior?.interval || 0;
    const priorRepetitions = prior?.repetitions || 0;
    const priorEaseFactor = prior?.easeFactor || 2.5;

    // Run SM-2 review calculation
    const result = calculateReview(grade, priorInterval, priorRepetitions, priorEaseFactor, now);

    // Look up lesson metadata
    const lesson = LessonService.getLessonById(lessonId);
    const lessonTitle = lesson?.title || `Dars ${lessonId}`;
    const level = lesson?.level || 'N4';
    const language: SupportedLanguage = lesson?.language || 'ja';

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const nextReviewTime = new Date(result.nextReviewDate).getTime();

    let status: LessonReviewItem['status'] = 'upcoming';
    if (nextReviewTime < startOfToday) {
      status = 'overdue';
    } else if (result.dueDate === format(now, 'yyyy-MM-dd')) {
      status = 'due_today';
    }

    const reviewItem: LessonReviewItem = {
      lessonId,
      userId: activeUserId,
      lessonTitle,
      level,
      language,
      lastStudiedAt: completedAt,
      nextReviewDate: result.nextReviewDate,
      dueDate: result.dueDate,
      interval: result.interval,
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      quizScorePercentage: score,
      retentionProbability: Math.min(
        100,
        Math.max(30, Math.round(score * (result.easeFactor / 2.5))),
      ),
      status,
    };

    // Save to local storage
    this.saveLessonReviewItem(activeUserId, reviewItem);

    return reviewItem;
  }

  /**
   * Retrieve all lesson review items scheduled for the user.
   */
  static getLessonReviews(userId: string = 'guest'): LessonReviewItem[] {
    const activeUserId = userId || 'guest';
    const key = `${LESSON_REVIEWS_STORAGE_PREFIX}${activeUserId}`;
    const list = safeLocalStorage.getJSON<LessonReviewItem[]>(key, []);
    if (!Array.isArray(list)) return [];

    // Recalculate status dynamically based on current time
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayStr = format(now, 'yyyy-MM-dd');

    return list.map((item) => {
      const reviewTime = new Date(item.nextReviewDate).getTime();
      let status: LessonReviewItem['status'] = 'upcoming';
      if (reviewTime < startOfToday) {
        status = 'overdue';
      } else if (item.dueDate === todayStr || reviewTime <= now.getTime()) {
        status = 'due_today';
      }
      return { ...item, status };
    });
  }

  /**
   * Retrieve single lesson review item if scheduled.
   */
  static getLessonReviewItem(userId: string, lessonId: string): LessonReviewItem | null {
    const list = this.getLessonReviews(userId);
    return list.find((item) => item.lessonId === lessonId) || null;
  }

  /**
   * Retrieve all lessons due for review today or overdue.
   */
  static getDueLessonReviews(userId: string = 'guest', now: Date = new Date()): LessonReviewItem[] {
    const list = this.getLessonReviews(userId);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayStr = format(now, 'yyyy-MM-dd');

    return list
      .filter((item) => {
        const reviewTime = new Date(item.nextReviewDate).getTime();
        return (
          reviewTime < startOfToday || item.dueDate === todayStr || reviewTime <= now.getTime()
        );
      })
      .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());
  }

  /**
   * Build a scheduled timetable of lesson reviews for the next N days.
   */
  static getLessonReviewSchedule(
    userId: string = 'guest',
    daysAhead: number = 14,
    now: Date = new Date(),
  ): { date: string; dayLabel: string; isToday: boolean; lessons: LessonReviewItem[] }[] {
    const list = this.getLessonReviews(userId);
    const safeDays = Math.max(1, Math.min(60, daysAhead));
    const todayStr = format(now, 'yyyy-MM-dd');

    const scheduleMap = new Map<string, LessonReviewItem[]>();

    for (let i = 0; i < safeDays; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      scheduleMap.set(format(targetDate, 'yyyy-MM-dd'), []);
    }

    for (const item of list) {
      let targetDateStr = item.dueDate;
      // Overdue items roll forward to today for scheduling
      if (targetDateStr < todayStr) {
        targetDateStr = todayStr;
      }

      if (scheduleMap.has(targetDateStr)) {
        scheduleMap.get(targetDateStr)?.push(item);
      }
    }

    const schedule: {
      date: string;
      dayLabel: string;
      isToday: boolean;
      lessons: LessonReviewItem[];
    }[] = [];

    scheduleMap.forEach((lessons, date) => {
      const parts = date.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      schedule.push({
        date,
        dayLabel: format(d, 'EEE, d-MMM'),
        isToday: date === todayStr,
        lessons,
      });
    });

    return schedule;
  }

  /**
   * Record a completed lesson review session and advance its SRS interval.
   */
  static recordLessonReview(
    userId: string,
    lessonId: string,
    grade: Grade,
    quizScorePercentage?: number,
  ): LessonReviewItem {
    const activeUserId = userId || 'guest';
    const prior = this.getLessonReviewItem(activeUserId, lessonId);

    return this.scheduleLessonReview(activeUserId, lessonId, {
      grade,
      quizScorePercentage,
      priorRecord: prior || undefined,
      baseDate: new Date(),
    });
  }

  /**
   * Automatically generate or sync tasks into the user's planner for due lesson reviews.
   */
  static async generateReviewTasks(
    userId: string = 'guest',
    existingTasks?: Task[],
  ): Promise<Task[]> {
    const pending = this.taskSyncs.get(userId);
    if (pending) {
      await pending;
      return [];
    }

    const sync = this.syncReviewTasks(userId, existingTasks);
    this.taskSyncs.set(userId, sync);
    try {
      return await sync;
    } finally {
      this.taskSyncs.delete(userId);
    }
  }

  private static async syncReviewTasks(userId: string, existingTasks?: Task[]): Promise<Task[]> {
    const dueReviews = this.getDueLessonReviews(userId);
    if (dueReviews.length === 0) return [];

    const cacheKey = `study_planner_tasks_${userId}`;
    const cachedTasks = safeLocalStorage.getJSON<Task[]>(cacheKey, []);
    const knownTasks = new Map(
      [...cachedTasks, ...(existingTasks ?? (await TaskService.fetchTasks(userId)))]
        .filter((task) => !task.userId || task.userId === userId)
        .map((task) => [task.id, task]),
    );
    const createdTasks: Task[] = [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    for (const review of dueReviews) {
      const title = `🔄 Takrorlash: ${review.lessonTitle} (${review.level})`;
      const legacyTitle = `🔄 Takrorlash: ${review.lessonTitle}`;
      const alreadyHasTask = [...knownTasks.values()].some(
        (t) =>
          !t.deletedAt &&
          (t.title === title || t.title === legacyTitle) &&
          (t.dueDate || t.deadline)?.startsWith(todayStr),
      );

      if (!alreadyHasTask) {
        try {
          const newTask = await TaskService.addTask(userId, {
            title,
            dueDate: `${todayStr}T10:00:00.000Z`,
            priority: review.status === 'overdue' ? 'high' : 'medium',
            status: 'todo',
            completed: false,
          });
          if (newTask) {
            const task = { ...newTask, userId };
            createdTasks.push(task);
            knownTasks.set(task.id, task);
            // TaskService can return a local fallback; retain it across syncs and page reloads.
            safeLocalStorage.setJSON(cacheKey, [...knownTasks.values()]);
          }
        } catch (e) {
          console.warn('[SpacedRepetitionEngine] Task creation warning:', e);
        }
      }
    }

    return createdTasks;
  }

  private static saveLessonReviewItem(userId: string, item: LessonReviewItem): void {
    const activeUserId = userId || 'guest';
    const key = `${LESSON_REVIEWS_STORAGE_PREFIX}${activeUserId}`;
    const list = this.getLessonReviews(activeUserId);

    const idx = list.findIndex((r) => r.lessonId === item.lessonId);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }

    safeLocalStorage.setJSON(key, list);
  }

  /**
   * Reset lesson reviews cache (for testing or profile resets).
   */
  static clearLessonReviews(userId: string = 'guest'): void {
    const activeUserId = userId || 'guest';
    const key = `${LESSON_REVIEWS_STORAGE_PREFIX}${activeUserId}`;
    safeLocalStorage.removeItem(key);
  }
}
