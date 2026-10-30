import type { Lesson, LessonKanji } from '../types/lesson';
import { getKanjiByLevel } from '../data/jlptKanjiDatabase';
import { ALL_JAPANESE_LESSONS } from '../data/curriculum/curriculumLessons';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { supabase } from '../lib/supabase';
import { isUuid, toDeterministicUUID } from '../utils/uuid';
import {
  OfflineSyncManager,
  kanjiProgressRow,
  type QueuedKanjiProgress,
} from './OfflineSyncManager';
import { KanjiPracticeService } from './KanjiPracticeService';

export type KanjiReviewResult = 'correct' | 'incorrect';

export const KANJI_SRS_INTERVALS = [1, 3, 7, 14] as const;

export interface LessonKanjiProgress {
  lessonId: string;
  kanji: string;
  attempts: number;
  correctAttempts: number;
  mastered: boolean;
  lastReviewedAt: string;
  // SRS properties
  srsStage?: number; // 0 (new), 1 (1d), 2 (3d), 3 (7d), 4 (14d)
  intervalDays?: number; // 1, 3, 7, 14
  nextReviewAt?: string; // ISO date string
  // Writing accuracy & stroke-order
  writingAccuracy?: number; // 0-100 percentage
  strokeOrderPassed?: boolean;
  totalWrittenCount?: number;
}

export interface LessonKanjiLevelSummary {
  level: Lesson['level'];
  totalKanji: number;
  reviewedKanji: number;
  masteredKanji: number;
}

export interface DueKanjiItem {
  lessonId: string;
  kanji: string;
  level?: Lesson['level'];
  meaningUz?: string;
  onyomi?: string;
  kunyomi?: string;
  strokeCount?: number;
  srsStage: number;
  intervalDays: number;
  nextReviewAt: string;
  lastReviewedAt: string;
  attempts: number;
  correctAttempts: number;
  mastered: boolean;
  writingAccuracy?: number;
  isOverdue: boolean;
  daysOverdue: number;
}

export interface KanjiMasteryComparison {
  level: Lesson['level'];
  lessonKanji: {
    total: number;
    reviewed: number;
    mastered: number;
    percentage: number;
  };
  jlptKanji: {
    total: number;
    reviewed: number;
    mastered: number;
    percentage: number;
  };
  writingMasteredCount: number;
  dueTodayCount: number;
  distinctMasteredKanji: string[];
}

export interface KanjiCompound {
  word: string;
  reading: string;
  meaningUz: string;
  source: 'database' | 'curriculum';
  lessonId?: string;
}

export interface KanjiProgressExportData {
  version: '2.0';
  exportedAt: string;
  userId: string;
  totalCount: number;
  items: LessonKanjiProgress[];
}

const PROGRESS_KEY_PREFIX = 'study_planner_lesson_kanji_progress_';
const KANJI_CHARACTER_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAFF]/g;

export function notifyKanjiProgress() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('kanji-progress-updated'));
}

function getProgressKey(userId: string, lessonId: string, kanji: string): string {
  return `${PROGRESS_KEY_PREFIX}${userId || 'guest'}_${lessonId}_${kanji}`;
}

function getVocabularyCharacters(lesson: Lesson): string[] {
  const characters = new Set<string>();
  for (const step of lesson.steps) {
    for (const vocabulary of step.learnData?.vocabulary || []) {
      const text = `${vocabulary.term} ${vocabulary.exampleSentence || ''}`;
      for (const character of text.match(KANJI_CHARACTER_PATTERN) || []) {
        characters.add(character);
      }
    }
  }
  return [...characters];
}

function belongsToLevel(lessonId: string, level: Lesson['level'], knownIds: Set<string>): boolean {
  if (knownIds.has(lessonId)) return true;
  const normalized = lessonId.toLowerCase();
  if (level === 'N5') return normalized.startsWith('ja-n5-') || normalized.startsWith('ja-minna-');
  if (level === 'N4') return normalized.startsWith('ja-n4-') || normalized.startsWith('ja-minna2-');
  return normalized.startsWith(`ja-${level.toLowerCase()}-`);
}

function toLessonKanji(kanji: ReturnType<typeof getKanjiByLevel>[number]): LessonKanji {
  return {
    kanji: kanji.kanji,
    onyomi: kanji.onyomi,
    kunyomi: kanji.kunyomi,
    meaningUz: kanji.meaningUz,
    strokeCount: kanji.strokeCount,
    examples: kanji.examples,
  };
}

export const LessonKanjiService = {
  /**
   * Returns explicit lesson kanji when supplied, otherwise derives kanji from lesson vocabulary.
   * Derivation is intentionally limited to the lesson vocabulary so unrelated JLPT characters
   * are not presented as lesson content.
   */
  getLessonKanji(lesson: Lesson): LessonKanji[] {
    if (lesson.kanji?.length) return lesson.kanji;
    if (lesson.language !== 'ja') return [];

    const kanjiByCharacter = new Map(
      getKanjiByLevel(lesson.level as 'N5' | 'N4' | 'N3' | 'N2' | 'N1').map((item) => [
        item.kanji,
        item,
      ]),
    );

    return getVocabularyCharacters(lesson)
      .map((character) => kanjiByCharacter.get(character))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map(toLessonKanji);
  },

  getProgress(userId: string, lessonId: string, kanji: string): LessonKanjiProgress | null {
    return safeLocalStorage.getJSON<LessonKanjiProgress | null>(
      getProgressKey(userId, lessonId, kanji),
      null,
    );
  },

  getAllUserProgress(userId: string): LessonKanjiProgress[] {
    const keys = safeLocalStorage.getAllKeys();
    const userPrefix = `${PROGRESS_KEY_PREFIX}${userId || 'guest'}_`;
    const results: LessonKanjiProgress[] = [];

    for (const key of keys) {
      if (!key.startsWith(userPrefix)) continue;
      const item = safeLocalStorage.getJSON<LessonKanjiProgress | null>(key, null);
      if (item && item.kanji && item.lessonId && item.attempts > 0) {
        results.push(item);
      }
    }
    return results;
  },

  recordReview(
    userId: string,
    lessonId: string,
    kanji: string,
    result: KanjiReviewResult,
    baseDate = new Date(),
  ): LessonKanjiProgress {
    const previous = this.getProgress(userId, lessonId, kanji);
    // The server reset timestamp may be slightly ahead of this device's clock.
    if (previous?.attempts === 0 && baseDate.getTime() <= Date.parse(previous.lastReviewedAt)) {
      baseDate = new Date(Date.parse(previous.lastReviewedAt) + 1);
    }
    const attempts = (previous?.attempts || 0) + 1;
    const correctAttempts = (previous?.correctAttempts || 0) + (result === 'correct' ? 1 : 0);

    let srsStage: number;
    let intervalDays: number;
    let nextReviewAt: string;
    let mastered: boolean;

    if (result === 'correct') {
      const prevStage = previous?.srsStage ?? (previous?.correctAttempts ? 1 : 0);
      srsStage = Math.min(4, Math.max(1, prevStage + 1));
      intervalDays = KANJI_SRS_INTERVALS[srsStage - 1];

      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + intervalDays);
      nextReviewAt = nextDate.toISOString();
      // Keep backward compatibility: 2 correct attempts marks mastered, or stage >= 4
      mastered = correctAttempts >= 2 || srsStage >= 4;
    } else {
      // Incorrect review: resets to 1 day interval (Stage 1)
      srsStage = 1;
      intervalDays = 1;
      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + intervalDays);
      nextReviewAt = nextDate.toISOString();
      mastered = previous?.mastered || false;
    }

    const progress: LessonKanjiProgress = {
      lessonId,
      kanji,
      attempts,
      correctAttempts,
      mastered,
      lastReviewedAt: baseDate.toISOString(),
      srsStage,
      intervalDays,
      nextReviewAt,
      writingAccuracy: previous?.writingAccuracy,
      strokeOrderPassed: previous?.strokeOrderPassed,
      totalWrittenCount: previous?.totalWrittenCount,
    };
    safeLocalStorage.setJSON(getProgressKey(userId, lessonId, kanji), progress);
    notifyKanjiProgress();
    return progress;
  },

  recordWritingPractice(
    userId: string,
    lessonId: string,
    kanji: string,
    result: { writingAccuracy: number; strokeOrderPassed: boolean },
    baseDate = new Date(),
  ): LessonKanjiProgress {
    const previous = this.getProgress(userId, lessonId, kanji);
    const passed = result.strokeOrderPassed && result.writingAccuracy >= 70;

    if (
      !Number.isFinite(result.writingAccuracy) ||
      result.writingAccuracy < 0 ||
      result.writingAccuracy > 100
    ) {
      throw new Error('Writing accuracy must be between 0 and 100');
    }
    const updated = this.recordReview(
      userId,
      lessonId,
      kanji,
      passed ? 'correct' : 'incorrect',
      baseDate,
    );
    const previousCount = previous?.totalWrittenCount || 0;
    const blendedAcc =
      ((previous?.writingAccuracy ?? 0) * previousCount + result.writingAccuracy) /
      (previousCount + 1);

    const fullProgress: LessonKanjiProgress = {
      ...updated,
      writingAccuracy: blendedAcc,
      strokeOrderPassed: result.strokeOrderPassed,
      totalWrittenCount: (previous?.totalWrittenCount || 0) + 1,
    };

    safeLocalStorage.setJSON(getProgressKey(userId, lessonId, kanji), fullProgress);
    notifyKanjiProgress();
    void this.syncProgress(userId, fullProgress);
    return fullProgress;
  },

  getDueKanjis(userId: string, targetDate = new Date()): DueKanjiItem[] {
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const targetTime = endOfDay.getTime();
    const all = this.getAllUserProgress(userId);
    const dueList: DueKanjiItem[] = [];

    for (const progress of all) {
      let nextReviewTime: number;
      if (progress.nextReviewAt) {
        nextReviewTime = new Date(progress.nextReviewAt).getTime();
      } else {
        const interval =
          (progress.intervalDays || (progress.mastered ? 14 : 1)) * 24 * 60 * 60 * 1000;
        nextReviewTime = new Date(progress.lastReviewedAt).getTime() + interval;
      }

      if (nextReviewTime <= targetTime) {
        const diffMs = targetTime - nextReviewTime;
        const daysOverdue = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
        const kanjiMeta = KanjiPracticeService.getKanjiByChar(progress.kanji);

        dueList.push({
          lessonId: progress.lessonId,
          kanji: progress.kanji,
          level: kanjiMeta?.level,
          meaningUz: kanjiMeta?.meaningUz,
          onyomi: kanjiMeta?.onyomi,
          kunyomi: kanjiMeta?.kunyomi,
          strokeCount: kanjiMeta?.strokeCount,
          srsStage: progress.srsStage ?? (progress.mastered ? 4 : 1),
          intervalDays: progress.intervalDays ?? (progress.mastered ? 14 : 1),
          nextReviewAt: progress.nextReviewAt || new Date(nextReviewTime).toISOString(),
          lastReviewedAt: progress.lastReviewedAt,
          attempts: progress.attempts,
          correctAttempts: progress.correctAttempts,
          mastered: progress.mastered,
          writingAccuracy: progress.writingAccuracy,
          isOverdue: daysOverdue > 0,
          daysOverdue,
        });
      }
    }

    return dueList.sort((a, b) => b.daysOverdue - a.daysOverdue || a.srsStage - b.srsStage);
  },

  async getMasteryComparison(
    userId: string,
    level: Lesson['level'],
  ): Promise<KanjiMasteryComparison> {
    const levelLessons = ALL_JAPANESE_LESSONS.filter(
      (lesson) => lesson.language === 'ja' && lesson.level === level,
    );
    const lessonIds = new Set(levelLessons.map((lesson) => lesson.id));
    const allLevelJlptKanjis = getKanjiByLevel(level as 'N5' | 'N4' | 'N3' | 'N2' | 'N1');
    const jlptCharSet = new Set(allLevelJlptKanjis.map((item) => item.kanji));

    const lessonKanjiCharSet = new Set<string>();
    for (const lesson of levelLessons) {
      for (const item of this.getLessonKanji(lesson)) {
        lessonKanjiCharSet.add(item.kanji);
      }
    }

    const userProgress = this.getAllUserProgress(userId);

    const lessonReviewed = new Set<string>();
    const lessonMastered = new Set<string>();
    const jlptReviewed = new Set<string>();
    const jlptMastered = new Set<string>();
    const writingMastered = new Set<string>();

    for (const prog of userProgress) {
      const isLevelLesson = belongsToLevel(prog.lessonId, level, lessonIds);
      const isJlptChar = jlptCharSet.has(prog.kanji);

      if (isLevelLesson || isJlptChar) {
        if (isLevelLesson && lessonKanjiCharSet.has(prog.kanji)) {
          lessonReviewed.add(prog.kanji);
          if (prog.mastered) lessonMastered.add(prog.kanji);
        }

        if (isJlptChar) {
          jlptReviewed.add(prog.kanji);
          if (prog.mastered) jlptMastered.add(prog.kanji);
        }

        if (prog.strokeOrderPassed && (prog.writingAccuracy ?? 0) >= 70) {
          writingMastered.add(prog.kanji);
        }
      }
    }

    const dueToday = this.getDueKanjis(userId).filter(
      (d) => d.level === level || belongsToLevel(d.lessonId, level, lessonIds),
    );

    const distinctMastered = new Set([...lessonMastered, ...jlptMastered]);

    return {
      level,
      lessonKanji: {
        total: lessonKanjiCharSet.size,
        reviewed: lessonReviewed.size,
        mastered: lessonMastered.size,
        percentage:
          lessonKanjiCharSet.size > 0
            ? Math.round((lessonMastered.size / lessonKanjiCharSet.size) * 100)
            : 0,
      },
      jlptKanji: {
        total: jlptCharSet.size,
        reviewed: jlptReviewed.size,
        mastered: jlptMastered.size,
        percentage:
          jlptCharSet.size > 0 ? Math.round((jlptMastered.size / jlptCharSet.size) * 100) : 0,
      },
      writingMasteredCount: writingMastered.size,
      dueTodayCount: dueToday.length,
      distinctMasteredKanji: [...distinctMastered],
    };
  },

  getKanjiCompounds(kanjiChar: string): KanjiCompound[] {
    const results: KanjiCompound[] = [];
    const seenWords = new Set<string>();

    // 1. Database examples
    const kanjiItem = KanjiPracticeService.getKanjiByChar(kanjiChar);
    if (kanjiItem?.examples) {
      for (const ex of kanjiItem.examples) {
        if (ex.word.includes(kanjiChar) && [...ex.word].length > 1 && !seenWords.has(ex.word)) {
          seenWords.add(ex.word);
          results.push({
            word: ex.word,
            reading: ex.reading || '',
            meaningUz: ex.meaning || '',
            source: 'database',
          });
        }
      }
    }

    // 2. Scan curriculum lessons for real context usage
    for (const lesson of ALL_JAPANESE_LESSONS) {
      for (const step of lesson.steps) {
        for (const vocab of step.learnData?.vocabulary || []) {
          if (
            vocab.term &&
            [...vocab.term].length > 1 &&
            vocab.term.includes(kanjiChar) &&
            !seenWords.has(vocab.term)
          ) {
            const mUz = vocab.meaning || '';
            const r = vocab.reading || '';
            if (mUz && r) {
              seenWords.add(vocab.term);
              results.push({
                word: vocab.term,
                reading: r,
                meaningUz: mUz,
                source: 'curriculum',
                lessonId: lesson.id,
              });
            }
          }
        }
      }
    }

    return results;
  },

  exportProgress(userId: string): string {
    const items = this.getAllUserProgress(userId);
    const payload: KanjiProgressExportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      userId: userId || 'guest',
      totalCount: items.length,
      items,
    };
    return JSON.stringify(payload, null, 2);
  },

  importProgress(
    userId: string,
    jsonString: string,
  ): { success: boolean; importedCount: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (
        !parsed ||
        parsed.version !== '2.0' ||
        !Array.isArray(parsed.items) ||
        parsed.items.length > 20000
      ) {
        return {
          success: false,
          importedCount: 0,
          error: 'Noto‘g‘ri format: items ro‘yxati topilmadi',
        };
      }
      const items: LessonKanjiProgress[] = parsed.items.map((value: unknown) => {
        if (!value || typeof value !== 'object') throw new Error('Progress yozuvi xato');
        const item = value as LessonKanjiProgress;
        if (
          typeof item.lessonId !== 'string' ||
          !item.lessonId ||
          item.lessonId.length > 200 ||
          typeof item.kanji !== 'string' ||
          !/^[\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAFF]$/.test(item.kanji) ||
          !Number.isSafeInteger(item.attempts) ||
          item.attempts < 0 ||
          !Number.isSafeInteger(item.correctAttempts) ||
          item.correctAttempts < 0 ||
          item.correctAttempts > item.attempts ||
          typeof item.mastered !== 'boolean' ||
          !Number.isFinite(Date.parse(item.lastReviewedAt)) ||
          (item.srsStage !== undefined &&
            (!Number.isInteger(item.srsStage) || item.srsStage < 0 || item.srsStage > 4)) ||
          (item.intervalDays !== undefined && ![0, 1, 3, 7, 14].includes(item.intervalDays)) ||
          (item.nextReviewAt !== undefined && !Number.isFinite(Date.parse(item.nextReviewAt))) ||
          (item.writingAccuracy !== undefined &&
            (!Number.isFinite(item.writingAccuracy) ||
              item.writingAccuracy < 0 ||
              item.writingAccuracy > 100)) ||
          (item.strokeOrderPassed !== undefined && typeof item.strokeOrderPassed !== 'boolean') ||
          (item.totalWrittenCount !== undefined &&
            (!Number.isSafeInteger(item.totalWrittenCount) || item.totalWrittenCount < 0))
        ) {
          throw new Error('Progress yozuvi xato');
        }
        return {
          lessonId: item.lessonId,
          kanji: item.kanji,
          attempts: item.attempts,
          correctAttempts: item.correctAttempts,
          mastered: item.mastered,
          lastReviewedAt: new Date().toISOString(),
          srsStage: item.srsStage,
          intervalDays: item.intervalDays,
          nextReviewAt: item.nextReviewAt,
          writingAccuracy: item.writingAccuracy,
          strokeOrderPassed: item.strokeOrderPassed,
          totalWrittenCount: item.totalWrittenCount,
        };
      });
      for (const item of items) {
        safeLocalStorage.setJSON(getProgressKey(userId, item.lessonId, item.kanji), item);
        void this.syncProgress(userId, item);
      }
      notifyKanjiProgress();
      return { success: true, importedCount: items.length };
    } catch (err: unknown) {
      return {
        success: false,
        importedCount: 0,
        error: err instanceof Error ? err.message : 'JSON formati xato',
      };
    }
  },

  resetProgress(
    userId: string,
    options?: { level?: Lesson['level']; lessonId?: string; kanji?: string },
  ): { resetCount: number } {
    const keys = safeLocalStorage.getAllKeys();
    const userPrefix = `${PROGRESS_KEY_PREFIX}${userId || 'guest'}_`;
    let resetCount = 0;

    for (const key of keys) {
      if (!key.startsWith(userPrefix)) continue;
      const progress = safeLocalStorage.getJSON<LessonKanjiProgress | null>(key, null);
      if (!progress) continue;

      if (options?.kanji && progress.kanji !== options.kanji) continue;
      if (options?.lessonId && progress.lessonId !== options.lessonId) continue;
      if (
        options?.level &&
        !belongsToLevel(progress.lessonId, options.level, new Set()) &&
        progress.lessonId !== `jlpt-${options.level}`
      )
        continue;

      safeLocalStorage.removeItem(key);
      resetCount++;
    }

    notifyKanjiProgress();
    return { resetCount };
  },

  async recordReviewAndSync(
    userId: string,
    lessonId: string,
    kanji: string,
    result: KanjiReviewResult,
  ): Promise<LessonKanjiProgress> {
    const progress = this.recordReview(userId, lessonId, kanji, result);
    await this.syncProgress(userId, progress);
    return progress;
  },

  async syncProgress(userId: string, progress: LessonKanjiProgress): Promise<void> {
    if (!isUuid(userId)) return;

    const payload: QueuedKanjiProgress = {
      id: toDeterministicUUID(`lesson_kanji_${userId}_${progress.lessonId}_${progress.kanji}`),
      userId,
      lessonId: progress.lessonId,
      kanji: progress.kanji,
      attempts: progress.attempts,
      correctAttempts: progress.correctAttempts,
      mastered: progress.mastered,
      lastReviewedAt: progress.lastReviewedAt,
      srsStage: Math.min(4, progress.srsStage ?? 0),
      intervalDays: progress.intervalDays === 30 ? 14 : progress.intervalDays,
      nextReviewAt: progress.nextReviewAt,
      writingAccuracy: progress.writingAccuracy,
      strokeOrderPassed: progress.strokeOrderPassed,
      totalWrittenCount: progress.totalWrittenCount,
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await OfflineSyncManager.enqueueKanjiProgress(payload);
      return;
    }

    try {
      const { error } = await supabase
        .from('lesson_kanji_progress')
        .upsert(kanjiProgressRow(payload), { onConflict: 'user_id,lesson_id,kanji' });
      if (error) await OfflineSyncManager.enqueueKanjiProgress(payload);
    } catch (error) {
      console.warn('[LessonKanjiService] Failed to sync kanji progress:', error);
      await OfflineSyncManager.enqueueKanjiProgress(payload);
    }
  },

  async syncAllProgressFromDatabase(userId: string): Promise<void> {
    await this.loadDatabaseProgress(userId);
  },

  async syncProgressFromDatabase(userId: string, lessonId: string): Promise<LessonKanjiProgress[]> {
    try {
      return await this.loadDatabaseProgress(userId, lessonId);
    } catch (error) {
      console.warn('[LessonKanjiService] Failed to load kanji progress:', error);
      return [];
    }
  },

  async loadDatabaseProgress(userId: string, lessonId?: string): Promise<LessonKanjiProgress[]> {
    if (!isUuid(userId)) return [];
    try {
      const results: LessonKanjiProgress[] = [];
      for (let offset = 0; ; offset += 500) {
        let query = supabase
          .from('lesson_kanji_progress')
          .select(
            'lesson_id,kanji,attempts,correct_attempts,mastered,last_reviewed_at,srs_stage,interval_days,next_review_at,writing_accuracy,stroke_order_passed,total_written_count',
          )
          .eq('user_id', userId)
          .order('id')
          .range(offset, offset + 499);
        if (lessonId) query = query.eq('lesson_id', lessonId);
        const { data, error } = await query;
        if (error) throw error;
        if (!Array.isArray(data)) throw new Error('Kanji progress response is invalid');
        results.push(
          ...data.map((row) => {
            const progress: LessonKanjiProgress = {
              lessonId: row.lesson_id,
              kanji: row.kanji,
              attempts: Number(row.attempts || 0),
              correctAttempts: Number(row.correct_attempts || 0),
              mastered: Boolean(row.mastered),
              lastReviewedAt: row.last_reviewed_at,
              srsStage: row.srs_stage ?? undefined,
              intervalDays: row.interval_days || undefined,
              nextReviewAt: row.next_review_at ?? undefined,
              writingAccuracy: row.writing_accuracy ?? undefined,
              strokeOrderPassed: row.stroke_order_passed ?? undefined,
              totalWrittenCount: row.total_written_count ?? 0,
            };
            const local = this.getProgress(userId, row.lesson_id, row.kanji);
            // A reset is a zero-attempt tombstone: never merge old counters back into it.
            const merged =
              local && Date.parse(local.lastReviewedAt) > Date.parse(progress.lastReviewedAt)
                ? local
                : progress;
            safeLocalStorage.setJSON(getProgressKey(userId, row.lesson_id, row.kanji), merged);
            return merged;
          }),
        );
        if (data.length < 500) break;
      }
      notifyKanjiProgress();
      return results;
    } catch (error) {
      throw new Error(
        'Kanji progressini sinxronlab bo‘lmadi. Internet va migratsiyani tekshiring.',
        { cause: error },
      );
    }
  },

  async resetProgressAndSync(userId: string): Promise<{ resetCount: number }> {
    if (!isUuid(userId)) return this.resetProgress(userId);
    if (typeof navigator !== 'undefined' && !navigator.onLine)
      throw new Error('Reset uchun internet kerak.');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || sessionData.session?.user.id !== userId)
      throw new Error('Hisob o‘zgargan. Sahifani yangilang.');
    // Load all pages first, including data created on other devices.
    await this.syncAllProgressFromDatabase(userId);
    const items = this.getAllUserProgress(userId);
    const { data: resetAt, error } = await supabase.rpc('reset_lesson_kanji_progress', {
      expected_user_id: userId,
    });
    if (error || typeof resetAt !== 'string')
      throw new Error('Progress o‘chirilmadi. Qayta urinib ko‘ring.');
    // The RPC cannot see unsynced local timestamps; advance beyond those as well.
    const markerAt = new Date(
      items.reduce(
        (latest, item) => Math.max(latest, Date.parse(item.lastReviewedAt) + 1),
        Date.parse(resetAt) + 1,
      ),
    ).toISOString();
    const tombstones = items.map((item): QueuedKanjiProgress => ({
      id: toDeterministicUUID(`lesson_kanji_${userId}_${item.lessonId}_${item.kanji}`),
      userId,
      lessonId: item.lessonId,
      kanji: item.kanji,
      attempts: 0,
      correctAttempts: 0,
      mastered: false,
      lastReviewedAt: markerAt,
    }));
    // Also retain reset markers for locally-created rows awaiting upload.
    for (const item of tombstones) {
      safeLocalStorage.setJSON(getProgressKey(userId, item.lessonId, item.kanji), item);
      await OfflineSyncManager.enqueueKanjiProgress(item);
    }
    if (tombstones.length) {
      const { error: markerError } = await supabase
        .from('lesson_kanji_progress')
        .upsert(tombstones.map(kanjiProgressRow), { onConflict: 'user_id,lesson_id,kanji' });
      if (markerError) {
        notifyKanjiProgress();
        throw new Error('Server progressi reset qilindi, lokal reset sinxronlash navbatida.');
      }
    }
    notifyKanjiProgress();
    return { resetCount: items.length };
  },

  async getLevelProgressSummary(
    userId: string,
    level: Lesson['level'],
  ): Promise<LessonKanjiLevelSummary> {
    if (isUuid(userId)) {
      try {
        await this.syncAllProgressFromDatabase(userId);
      } catch (error) {
        console.warn('[LessonKanjiService] Using cached kanji summary:', error);
      }
    }
    const levelLessons = ALL_JAPANESE_LESSONS.filter(
      (lesson) => lesson.language === 'ja' && lesson.level === level,
    );
    const lessonIds = new Set(levelLessons.map((lesson) => lesson.id));
    const levelKanji = new Set(
      getKanjiByLevel(level as 'N5' | 'N4' | 'N3' | 'N2' | 'N1').map((item) => item.kanji),
    );
    const reviewed = new Set<string>();
    const mastered = new Set<string>();

    for (const lesson of levelLessons) {
      for (const item of this.getLessonKanji(lesson)) {
        const progress = this.getProgress(userId, lesson.id, item.kanji);
        if (!progress || progress.attempts === 0) continue;
        reviewed.add(progress.kanji);
        if (progress.mastered) mastered.add(progress.kanji);
      }
    }

    for (const key of safeLocalStorage.getAllKeys()) {
      if (!key.startsWith(`${PROGRESS_KEY_PREFIX}${userId || 'guest'}_`)) continue;
      const progress = safeLocalStorage.getJSON<LessonKanjiProgress | null>(key, null);
      if (
        !progress ||
        progress.attempts === 0 ||
        !belongsToLevel(progress.lessonId, level, lessonIds)
      )
        continue;
      reviewed.add(progress.kanji);
      if (progress.mastered) mastered.add(progress.kanji);
    }

    return {
      level,
      totalKanji: levelKanji.size,
      reviewedKanji: reviewed.size,
      masteredKanji: mastered.size,
    };
  },

  getLessonProgress(
    userId: string,
    lessonId: string,
    kanjiList: LessonKanji[],
  ): LessonKanjiProgress[] {
    return kanjiList
      .map((item) => this.getProgress(userId, lessonId, item.kanji))
      .filter((item): item is LessonKanjiProgress => Boolean(item));
  },
};
