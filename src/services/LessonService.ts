import { Lesson, UserLessonProgress, SupportedLanguage } from '../types/lesson';
import { SAMPLE_LESSONS } from '../data/curriculum/sampleCurriculum';
import {
  getCurriculumLessonById,
  getCurriculumLessonsByLanguage,
  loadCurriculumLessonById,
} from '../data/curriculum/curriculumLessons';
import { supabase } from '../lib/supabase';
import { toDeterministicUUID } from '../utils/uuid';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { OfflineSyncManager, type QueuedLessonProgress } from './OfflineSyncManager';
import { LessonKanjiService } from './LessonKanjiService';
import { SpacedRepetitionEngine } from './SpacedRepetitionEngine';
import {
  completedLessonSteps,
  unlockedLessonStep,
  lessonAggregateScore,
  verifiedLessonCompletion,
} from '../utils/lessonProgression';

const PROGRESS_STORAGE_PREFIX = 'study_planner_lesson_progress_';

async function boundedProgressWrite(request: any) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await (typeof request.abortSignal === 'function'
      ? request.abortSignal(controller.signal)
      : request);
  } finally {
    clearTimeout(timeout);
  }
}

export const LessonService = {
  /**
   * Retrieve a lesson by ID (synchronous from memory/metadata).
   */
  getLessonById(lessonId: string): Lesson | null {
    return (
      getCurriculumLessonById(lessonId) || SAMPLE_LESSONS.find((l) => l.id === lessonId) || null
    );
  },

  /**
   * Retrieve kanji associated with a lesson for lesson-level practice.
   */
  getLessonKanji(lessonId: string) {
    const lesson = this.getLessonById(lessonId);
    return lesson ? LessonKanjiService.getLessonKanji(lesson) : [];
  },

  /**
   * Asynchronously loads full lesson data including steps on demand.
   * If already loaded into memory, resolves immediately.
   */
  async loadLessonById(lessonId: string): Promise<Lesson | null> {
    const existing = this.getLessonById(lessonId);
    if (existing && existing.steps && existing.steps.length > 0) {
      return existing;
    }
    const loaded = await loadCurriculumLessonById(lessonId);
    if (loaded && loaded.steps && loaded.steps.length > 0) {
      return loaded;
    }
    return existing || SAMPLE_LESSONS.find((l) => l.id === lessonId) || null;
  },

  /**
   * Retrieve all lessons for a specific language track.
   */
  getLessonsForLanguage(language: SupportedLanguage): Lesson[] {
    // Phase 19: real curriculum is the source of truth (not sample data).
    return getCurriculumLessonsByLanguage(language);
  },

  /**
   * Get default starting lesson for a user's primary language and level.
   */
  getDefaultLessonForLanguage(language: SupportedLanguage, level?: string): Lesson | null {
    const langLessons = this.getLessonsForLanguage(language);
    if (level) {
      const levelMatch = langLessons.find((l) => l.level.toLowerCase() === level.toLowerCase());
      if (levelMatch) return levelMatch;
    }
    if (langLessons[0]) return langLessons[0];
    if (level) {
      const sampleMatch = SAMPLE_LESSONS.find(
        (l) => l.language === language && l.level.toLowerCase() === level.toLowerCase(),
      );
      if (sampleMatch) return sampleMatch;
    }
    return SAMPLE_LESSONS.find((l) => l.language === language) || null;
  },

  /**
   * Get next sequential lesson in the course if available.
   */
  getNextLesson(currentLessonId: string): Lesson | null {
    const current = this.getLessonById(currentLessonId);
    if (!current) return null;

    const langLessons = this.getLessonsForLanguage(current.language);
    const currentIndex = langLessons.findIndex((l) => l.id === currentLessonId);
    if (currentIndex >= 0 && currentIndex < langLessons.length - 1) {
      return langLessons[currentIndex + 1];
    }
    return null;
  },

  /**
   * Get user progress for a given lesson (from localStorage with user metadata fallback).
   */
  getLessonProgress(userId: string, lessonId: string): UserLessonProgress | null {
    const storageKey = `${PROGRESS_STORAGE_PREFIX}${userId || 'guest'}_${lessonId}`;
    return safeLocalStorage.getJSON<UserLessonProgress | null>(storageKey, null);
  },

  /**
   * Save user progress locally and sync with Supabase database (and auth metadata fallback).
   */
  async saveLessonProgress(userId: string, progress: UserLessonProgress): Promise<void> {
    const activeUserId = userId || 'guest';
    progress = { ...progress, userId: activeUserId, lastAttemptedAt: new Date().toISOString() };
    const storageKey = `${PROGRESS_STORAGE_PREFIX}${activeUserId}_${progress.lessonId}`;
    const lessonForValidation = this.getLessonById(progress.lessonId);
    if (progress.progressionVersion === 1 && lessonForValidation?.steps.length) {
      progress = {
        ...progress,
        completedStepIds: completedLessonSteps(lessonForValidation, progress),
        currentStepIndex: Math.max(
          0,
          Math.min(progress.currentStepIndex, unlockedLessonStep(lessonForValidation, progress)),
        ),
        quizScore: lessonAggregateScore(lessonForValidation, progress),
        isCompleted:
          progress.isCompleted && verifiedLessonCompletion(lessonForValidation, progress),
      };
    }
    if (!safeLocalStorage.setJSON(storageKey, progress))
      throw new Error('Dars natijasini qurilmada saqlab bo‘lmadi.');

    // Auto-schedule spaced repetition review if completed and not already scheduled
    if (progress.isCompleted) {
      try {
        const existingReview = SpacedRepetitionEngine.getLessonReviewItem(
          activeUserId,
          progress.lessonId,
        );
        if (!existingReview) {
          SpacedRepetitionEngine.scheduleLessonReview(activeUserId, progress.lessonId, {
            quizScorePercentage: progress.quizScore?.percentage ?? 80,
            completedAt: progress.completedAt,
          });
        }
      } catch (e) {
        console.warn('[LessonService] Auto-scheduling spaced repetition failed:', e);
      }
    }

    if (!activeUserId || activeUserId === 'guest') return;

    // 1. Asynchronous write to Supabase lesson_progress table with offline fallback queue
    if (supabase?.from) {
      const lesson = this.getLessonById(progress.lessonId);
      const language = lesson?.language || 'en';
      const uuid = toDeterministicUUID(`lesson_prog_${activeUserId}_${progress.lessonId}`);

      const queuedPayload: QueuedLessonProgress = {
        id: uuid,
        userId: activeUserId,
        lessonId: progress.lessonId,
        language,
        currentStepIndex: progress.currentStepIndex || 0,
        isCompleted: progress.isCompleted || false,
        score: progress.quizScore?.score ?? 0,
        answers: {
          quizScore: progress.quizScore,
          completedStepIds: progress.completedStepIds,
          stepResults: progress.stepResults,
          mistakes: progress.mistakes,
          progressionVersion: progress.progressionVersion,
        },
        completedAt: progress.completedAt || null,
        updatedAt: new Date().toISOString(),
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await OfflineSyncManager.enqueueLessonProgress(queuedPayload);
      } else {
        try {
          const { error } = await boundedProgressWrite(
            supabase.from('lesson_progress').upsert({
              id: uuid,
              user_id: activeUserId,
              lesson_id: progress.lessonId,
              language,
              current_step_index: progress.currentStepIndex || 0,
              is_completed: progress.isCompleted || false,
              score: progress.quizScore?.score ?? 0,
              answers: {
                quizScore: progress.quizScore,
                completedStepIds: progress.completedStepIds,
                stepResults: progress.stepResults,
                mistakes: progress.mistakes,
                progressionVersion: progress.progressionVersion,
              },
              completed_at: progress.completedAt || null,
              updated_at: new Date().toISOString(),
            }),
          );
          if (error) {
            await OfflineSyncManager.enqueueLessonProgress(queuedPayload);
          }
        } catch (err) {
          console.warn('[LessonService] DB write error, enqueued offline:', err);
          await OfflineSyncManager.enqueueLessonProgress(queuedPayload);
        }
      }
    }

    // Step evidence is persisted in the DB/offline queue; avoid an extra auth round trip per step.
    if (progress.progressionVersion === 1) return;

    // 2. Backward compatibility fallback in user_metadata
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const currentMetaProgress = (user.user_metadata?.lesson_progress || {}) as Record<
          string,
          UserLessonProgress
        >;
        const updatedMeta = {
          ...currentMetaProgress,
          [progress.lessonId]: progress,
        };
        await supabase.auth.updateUser({
          data: { lesson_progress: updatedMeta },
        });
      }
    } catch (err) {
      console.warn('[LessonService] Background sync to Supabase metadata failed:', err);
    }
  },

  /**
   * Mark lesson as completed with final quiz score and timestamp.
   */
  async completeLesson(
    userId: string,
    lessonId: string,
    _quizScore: { score: number; total: number; percentage: number },
  ): Promise<UserLessonProgress> {
    const lesson = await this.loadLessonById(lessonId);
    const existing = this.getLessonProgress(userId, lessonId);
    if (!lesson || !verifiedLessonCompletion(lesson, existing))
      throw new Error('Darsning barcha bosqichlarini muvaffaqiyatli yakunlang.');
    const allStepIds = lesson.steps.map((step) => step.id);
    const normalizedScore = lessonAggregateScore(lesson, existing!);

    const completedProgress: UserLessonProgress = {
      ...existing!,
      lessonId,
      userId: userId || 'guest',
      currentStepIndex: Math.max(0, allStepIds.length - 1),
      completedStepIds: allStepIds,
      isCompleted: true,
      quizScore: normalizedScore,
      lastAttemptedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    await this.saveLessonProgress(userId, completedProgress);

    return completedProgress;
  },

  /**
   * Synchronize all lesson progresses for a user from Supabase DB to local cache.
   */
  async syncLessonProgressFromDB(userId: string, language?: SupportedLanguage): Promise<void> {
    if (!supabase?.from || !userId || userId === 'guest') return;

    try {
      let query = supabase.from('lesson_progress').select('*').eq('user_id', userId);

      if (language) {
        query = query.eq('language', language);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const storageKey = `${PROGRESS_STORAGE_PREFIX}${userId}_${row.lesson_id}`;
          const answersData = (row.answers || {}) as any;
          const mappedProgress: UserLessonProgress = {
            lessonId: row.lesson_id,
            userId: row.user_id,
            currentStepIndex: row.current_step_index || 0,
            completedStepIds: answersData.completedStepIds || [],
            stepResults: answersData.stepResults,
            mistakes: answersData.mistakes,
            progressionVersion: answersData.progressionVersion,
            isCompleted: row.is_completed || false,
            quizScore: answersData.quizScore || {
              score: Number(row.score || 0),
              total: 1,
              percentage: Number(row.score || 0),
            },
            completedAt: row.completed_at || undefined,
            lastAttemptedAt: row.updated_at || undefined,
          };
          const local = safeLocalStorage.getJSON<UserLessonProgress | null>(storageKey, null);
          if (
            local &&
            new Date(local.lastAttemptedAt).getTime() >
              new Date(mappedProgress.lastAttemptedAt).getTime()
          )
            continue;
          safeLocalStorage.setJSON(storageKey, mappedProgress);
        }
      }
    } catch (e) {
      console.warn('[LessonService] DB sync error:', e);
    }
  },
};
