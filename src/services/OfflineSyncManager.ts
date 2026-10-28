/**
 * OfflineSyncManager.ts
 * Unified multi-domain offline queue coordinator and resilience engine.
 * Automatically synchronizes flashcards, mock exam history, speaking sessions,
 * and gamification profiles between IndexedDB/localStorage and Supabase
 * upon network restoration.
 */

import { idbGet, idbSet, idbDelete } from '../utils/storage/indexedDb';
import { supabase } from '../lib/supabase';
import { FlashcardOfflineSync } from './FlashcardOfflineSync';
import { toast } from '../hooks/use-toast';
import { toDeterministicUUID, isUuid } from '../utils/uuid';

export interface QueuedMockExam {
  id: string;
  userId?: string | null;
  examType: string;
  level?: string | null;
  score: number;
  totalQuestions: number;
  bandScore?: number | null;
  createdAt: string;
}

export interface QueuedSpeakingSession {
  id: string;
  userId?: string | null;
  topic?: string;
  mode?: string;
  fluencyScore: number;
  grammarScore: number;
  pronunciationScore: number;
  vocabularyScore: number;
  durationSeconds: number;
  createdAt: string;
}

export interface QueuedGamificationProfile {
  userId: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  lastActivityDate: string;
  timestamp: number;
}

export interface QueuedLessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  language: string;
  currentStepIndex: number;
  isCompleted: boolean;
  score: number;
  answers: Record<string, any>;
  completedAt?: string | null;
  updatedAt: string;
}

export interface QueuedKanjiProgress {
  id: string;
  userId: string;
  lessonId: string;
  kanji: string;
  attempts: number;
  correctAttempts: number;
  mastered: boolean;
  lastReviewedAt: string;
}

export interface StorageDiagnostics {
  isOnline: boolean;
  pendingFlashcards: number;
  pendingExams: number;
  pendingSpeaking: number;
  pendingGamification: number;
  pendingLessonProgress: number;
  pendingKanjiProgress: number;
  totalPending: number;
  cachedFlashcardsCount: number;
  lastSyncTimestamp: number | null;
}

const EXAMS_QUEUE_KEY = 'study_planner_offline_exams_queue';
const SPEAKING_QUEUE_KEY = 'study_planner_offline_speaking_queue';
const GAMIFICATION_QUEUE_KEY = 'study_planner_offline_gamification_queue';
const LESSON_PROGRESS_QUEUE_KEY = 'study_planner_offline_lesson_progress_queue';
const KANJI_PROGRESS_QUEUE_KEY = 'study_planner_offline_kanji_progress_queue';
const LAST_SYNC_KEY = 'study_planner_last_offline_sync_time';

let isSyncingAll = false;
let isListenerInitialized = false;

export const OfflineSyncManager = {
  // ─── Queuing Operations ─────────────────────────────────────────

  /**
   * Enqueues an offline mock exam submission.
   */
  async enqueueMockExam(exam: QueuedMockExam): Promise<void> {
    try {
      const queue = (await idbGet<QueuedMockExam[]>(EXAMS_QUEUE_KEY)) || [];
      const existingIdx = queue.findIndex((e) => e.id === exam.id);
      if (existingIdx >= 0) {
        queue[existingIdx] = exam;
      } else {
        queue.push(exam);
      }
      await idbSet(EXAMS_QUEUE_KEY, queue);
    } catch (e) {
      console.warn('[OfflineSyncManager] Failed to enqueue mock exam:', e);
    }
  },

  /**
   * Enqueues an offline speaking coach session.
   */
  async enqueueSpeakingSession(session: QueuedSpeakingSession): Promise<void> {
    try {
      const queue = (await idbGet<QueuedSpeakingSession[]>(SPEAKING_QUEUE_KEY)) || [];
      const existingIdx = queue.findIndex((s) => s.id === session.id);
      if (existingIdx >= 0) {
        queue[existingIdx] = session;
      } else {
        queue.push(session);
      }
      await idbSet(SPEAKING_QUEUE_KEY, queue);
    } catch (e) {
      console.warn('[OfflineSyncManager] Failed to enqueue speaking session:', e);
    }
  },

  /**
   * Enqueues an offline gamification XP/streak profile update.
   */
  async enqueueGamificationSync(profile: QueuedGamificationProfile): Promise<void> {
    try {
      const queue = (await idbGet<QueuedGamificationProfile[]>(GAMIFICATION_QUEUE_KEY)) || [];
      const existingIdx = queue.findIndex((p) => p.userId === profile.userId);
      if (existingIdx >= 0) {
        queue[existingIdx] = profile;
      } else {
        queue.push(profile);
      }
      await idbSet(GAMIFICATION_QUEUE_KEY, queue);
    } catch (e) {
      console.warn('[OfflineSyncManager] Failed to enqueue gamification update:', e);
    }
  },

  /**
   * Enqueues an offline lesson progress update.
   */
  async enqueueLessonProgress(progress: QueuedLessonProgress): Promise<void> {
    try {
      const queue = (await idbGet<QueuedLessonProgress[]>(LESSON_PROGRESS_QUEUE_KEY)) || [];
      const existingIdx = queue.findIndex(
        (p) =>
          p.id === progress.id ||
          (p.userId === progress.userId && p.lessonId === progress.lessonId),
      );
      if (existingIdx >= 0) {
        queue[existingIdx] = progress;
      } else {
        queue.push(progress);
      }
      await idbSet(LESSON_PROGRESS_QUEUE_KEY, queue);
    } catch (e) {
      console.warn('[OfflineSyncManager] Failed to enqueue lesson progress:', e);
    }
  },

  async enqueueKanjiProgress(progress: QueuedKanjiProgress): Promise<void> {
    try {
      const queue = (await idbGet<QueuedKanjiProgress[]>(KANJI_PROGRESS_QUEUE_KEY)) || [];
      const existingIdx = queue.findIndex(
        (item) =>
          item.id === progress.id ||
          (item.userId === progress.userId &&
            item.lessonId === progress.lessonId &&
            item.kanji === progress.kanji),
      );
      if (existingIdx >= 0) queue[existingIdx] = progress;
      else queue.push(progress);
      await idbSet(KANJI_PROGRESS_QUEUE_KEY, queue);
    } catch (e) {
      console.warn('[OfflineSyncManager] Failed to enqueue kanji progress:', e);
    }
  },

  // ─── Queue Counters ─────────────────────────────────────────────

  async getPendingExamsCount(): Promise<number> {
    try {
      const queue = await idbGet<QueuedMockExam[]>(EXAMS_QUEUE_KEY);
      return queue ? queue.length : 0;
    } catch {
      return 0;
    }
  },

  async getPendingSpeakingCount(): Promise<number> {
    try {
      const queue = await idbGet<QueuedSpeakingSession[]>(SPEAKING_QUEUE_KEY);
      return queue ? queue.length : 0;
    } catch {
      return 0;
    }
  },

  async getPendingGamificationCount(): Promise<number> {
    try {
      const queue = await idbGet<QueuedGamificationProfile[]>(GAMIFICATION_QUEUE_KEY);
      return queue ? queue.length : 0;
    } catch {
      return 0;
    }
  },

  async getPendingLessonProgressCount(): Promise<number> {
    try {
      const queue = await idbGet<QueuedLessonProgress[]>(LESSON_PROGRESS_QUEUE_KEY);
      return queue ? queue.length : 0;
    } catch {
      return 0;
    }
  },

  async getPendingKanjiProgressCount(): Promise<number> {
    try {
      const queue = await idbGet<QueuedKanjiProgress[]>(KANJI_PROGRESS_QUEUE_KEY);
      return queue ? queue.length : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Returns total count of pending mutations across all domains.
   */
  async getOverallPendingCount(): Promise<number> {
    const [flashcards, exams, speaking, gamification, lessons, kanji] = await Promise.all([
      FlashcardOfflineSync.getPendingCount(),
      this.getPendingExamsCount(),
      this.getPendingSpeakingCount(),
      this.getPendingGamificationCount(),
      this.getPendingLessonProgressCount(),
      this.getPendingKanjiProgressCount(),
    ]);

    return flashcards + exams + speaking + gamification + lessons + kanji;
  },

  // ─── Queue Flush / Sync ─────────────────────────────────────────

  /**
   * Synchronizes all queued changes across all domains to Supabase.
   */
  async syncAllPending(): Promise<{
    syncedCards: number;
    syncedExams: number;
    syncedSpeaking: number;
    syncedGamification: number;
    syncedLessons: number;
    syncedKanji: number;
    totalSynced: number;
    totalFailed: number;
  }> {
    if (isSyncingAll) {
      return {
        syncedCards: 0,
        syncedExams: 0,
        syncedSpeaking: 0,
        syncedGamification: 0,
        syncedLessons: 0,
        syncedKanji: 0,
        totalSynced: 0,
        totalFailed: 0,
      };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        syncedCards: 0,
        syncedExams: 0,
        syncedSpeaking: 0,
        syncedGamification: 0,
        syncedLessons: 0,
        syncedKanji: 0,
        totalSynced: 0,
        totalFailed: 0,
      };
    }

    isSyncingAll = true;
    let syncedCards = 0;
    let syncedExams = 0;
    let syncedSpeaking = 0;
    let syncedGamification = 0;
    let syncedKanji = 0;
    let totalFailed = 0;

    try {
      // 1. Sync Flashcards
      const cardResult = await FlashcardOfflineSync.syncPending();
      syncedCards = cardResult.synced;
      totalFailed += cardResult.failed;

      // 2. Sync Mock Exams
      const examQueue = (await idbGet<QueuedMockExam[]>(EXAMS_QUEUE_KEY)) || [];
      if (examQueue.length > 0) {
        const remainingExams: QueuedMockExam[] = [];
        for (const exam of examQueue) {
          try {
            if (exam.userId) {
              const { error } = await supabase.from('mock_exams_history').insert({
                user_id: exam.userId,
                exam_type: exam.examType,
                level: exam.level || null,
                score: exam.score,
                total_questions: exam.totalQuestions,
                band_score: exam.bandScore || null,
                created_at: exam.createdAt,
              });
              if (error) {
                remainingExams.push(exam);
                totalFailed++;
              } else {
                syncedExams++;
              }
            } else {
              syncedExams++;
            }
          } catch {
            remainingExams.push(exam);
            totalFailed++;
          }
        }
        await idbSet(EXAMS_QUEUE_KEY, remainingExams);
      }

      // 3. Sync Speaking Sessions
      const speakingQueue = (await idbGet<QueuedSpeakingSession[]>(SPEAKING_QUEUE_KEY)) || [];
      if (speakingQueue.length > 0) {
        const remainingSpeaking: QueuedSpeakingSession[] = [];
        for (const session of speakingQueue) {
          try {
            if (session.userId) {
              const { error } = await supabase.from('speaking_coach_sessions').insert({
                user_id: session.userId,
                topic: session.topic || 'General Practice',
                mode: session.mode || 'scenario',
                fluency_score: session.fluencyScore,
                grammar_score: session.grammarScore,
                pronunciation_score: session.pronunciationScore,
                vocabulary_score: session.vocabularyScore,
                duration_seconds: session.durationSeconds,
                created_at: session.createdAt,
              });
              if (error) {
                remainingSpeaking.push(session);
                totalFailed++;
              } else {
                syncedSpeaking++;
              }
            } else {
              syncedSpeaking++;
            }
          } catch {
            remainingSpeaking.push(session);
            totalFailed++;
          }
        }
        await idbSet(SPEAKING_QUEUE_KEY, remainingSpeaking);
      }

      // 4. Sync Gamification Profiles
      const gamificationQueue =
        (await idbGet<QueuedGamificationProfile[]>(GAMIFICATION_QUEUE_KEY)) || [];
      if (gamificationQueue.length > 0) {
        const remainingGamification: QueuedGamificationProfile[] = [];
        for (const item of gamificationQueue) {
          try {
            const dbUserId = isUuid(item.userId) ? item.userId : toDeterministicUUID(item.userId);
            const { error } = await supabase.from('profiles').upsert({
              id: dbUserId,
              total_xp: item.totalXp,
              level: item.level,
              current_streak: item.currentStreak,
              last_activity_date: item.lastActivityDate,
              updated_at: new Date().toISOString(),
            });
            if (error) {
              remainingGamification.push(item);
              totalFailed++;
            } else {
              syncedGamification++;
            }
          } catch {
            remainingGamification.push(item);
            totalFailed++;
          }
        }
        await idbSet(GAMIFICATION_QUEUE_KEY, remainingGamification);
      }

      // 5. Sync Lesson Progress
      let syncedLessons = 0;
      const lessonQueue = (await idbGet<QueuedLessonProgress[]>(LESSON_PROGRESS_QUEUE_KEY)) || [];
      if (lessonQueue.length > 0) {
        const remainingLessons: QueuedLessonProgress[] = [];
        for (const lp of lessonQueue) {
          try {
            if (lp.userId && lp.userId !== 'guest') {
              const { error } = await supabase.from('lesson_progress').upsert({
                id: lp.id,
                user_id: lp.userId,
                lesson_id: lp.lessonId,
                language: lp.language,
                current_step_index: lp.currentStepIndex,
                is_completed: lp.isCompleted,
                score: lp.score,
                answers: lp.answers,
                completed_at: lp.completedAt,
                updated_at: lp.updatedAt,
              });
              if (error) {
                remainingLessons.push(lp);
                totalFailed++;
              } else {
                syncedLessons++;
              }
            } else {
              syncedLessons++;
            }
          } catch {
            remainingLessons.push(lp);
            totalFailed++;
          }
        }
        await idbSet(LESSON_PROGRESS_QUEUE_KEY, remainingLessons);
      }

      // 6. Sync lesson kanji review progress
      const kanjiQueue = (await idbGet<QueuedKanjiProgress[]>(KANJI_PROGRESS_QUEUE_KEY)) || [];
      if (kanjiQueue.length > 0) {
        const remainingKanji: QueuedKanjiProgress[] = [];
        for (const item of kanjiQueue) {
          try {
            if (item.userId && item.userId !== 'guest') {
              const { error } = await supabase.from('lesson_kanji_progress').upsert(
                {
                  id: item.id,
                  user_id: item.userId,
                  lesson_id: item.lessonId,
                  kanji: item.kanji,
                  attempts: item.attempts,
                  correct_attempts: item.correctAttempts,
                  mastered: item.mastered,
                  last_reviewed_at: item.lastReviewedAt,
                  updated_at: item.lastReviewedAt,
                },
                { onConflict: 'user_id,lesson_id,kanji' },
              );
              if (error) {
                remainingKanji.push(item);
                totalFailed++;
              } else {
                syncedKanji++;
              }
            } else {
              syncedKanji++;
            }
          } catch {
            remainingKanji.push(item);
            totalFailed++;
          }
        }
        await idbSet(KANJI_PROGRESS_QUEUE_KEY, remainingKanji);
      }

      const totalSynced =
        syncedCards +
        syncedExams +
        syncedSpeaking +
        syncedGamification +
        syncedLessons +
        syncedKanji;

      if (totalSynced > 0) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
          }
          toast({
            title: '✅ Sinxronlash muvaffaqiyatli',
            description: `${totalSynced} ta oflayn o'zgarish bazaga saqlandi.`,
          });
        } catch {}
      }

      return {
        syncedCards,
        syncedExams,
        syncedSpeaking,
        syncedGamification,
        syncedLessons,
        syncedKanji,
        totalSynced,
        totalFailed,
      };
    } finally {
      isSyncingAll = false;
    }
  },

  // ─── Diagnostics & Status ───────────────────────────────────────

  async getDiagnostics(userId?: string): Promise<StorageDiagnostics> {
    const [
      pendingCards,
      pendingExams,
      pendingSpeaking,
      pendingGamification,
      pendingLessonProgress,
      pendingKanjiProgress,
    ] = await Promise.all([
      FlashcardOfflineSync.getPendingCount(),
      this.getPendingExamsCount(),
      this.getPendingSpeakingCount(),
      this.getPendingGamificationCount(),
      this.getPendingLessonProgressCount(),
      this.getPendingKanjiProgressCount(),
    ]);

    let cachedFlashcardsCount = 0;
    if (userId) {
      const cachedDeck = await FlashcardOfflineSync.getCachedDeck(userId);
      if (cachedDeck?.cards) {
        cachedFlashcardsCount = cachedDeck.cards.length;
      }
    }

    let lastSyncTimestamp: number | null = null;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(LAST_SYNC_KEY);
        if (raw) lastSyncTimestamp = parseInt(raw, 10);
      }
    } catch {}

    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingFlashcards: pendingCards,
      pendingExams,
      pendingSpeaking,
      pendingGamification,
      pendingLessonProgress,
      pendingKanjiProgress,
      totalPending:
        pendingCards +
        pendingExams +
        pendingSpeaking +
        pendingGamification +
        pendingLessonProgress +
        pendingKanjiProgress,
      cachedFlashcardsCount,
      lastSyncTimestamp,
    };
  },

  // ─── Clean / Reset ──────────────────────────────────────────────

  async clearAllQueues(): Promise<void> {
    await Promise.all([
      FlashcardOfflineSync.clearQueue(),
      idbDelete(EXAMS_QUEUE_KEY),
      idbDelete(SPEAKING_QUEUE_KEY),
      idbDelete(GAMIFICATION_QUEUE_KEY),
      idbDelete(LESSON_PROGRESS_QUEUE_KEY),
      idbDelete(KANJI_PROGRESS_QUEUE_KEY),
    ]);
  },

  // ─── Auto-Sync Listeners ────────────────────────────────────────

  initAutoSync(): void {
    if (isListenerInitialized || typeof window === 'undefined') return;
    isListenerInitialized = true;

    // Attach Flashcard auto-sync
    FlashcardOfflineSync.initAutoSync();

    window.addEventListener('online', () => {
      OfflineSyncManager.syncAllPending();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        OfflineSyncManager.syncAllPending();
      }
    });

    // Trigger sync if already online on startup
    if (navigator.onLine) {
      OfflineSyncManager.syncAllPending();
    }
  },
};

export default OfflineSyncManager;
