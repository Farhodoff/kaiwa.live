import type { Lesson, LessonKanji } from '../types/lesson';
import { getKanjiByLevel } from '../data/jlptKanjiDatabase';
import { ALL_JAPANESE_LESSONS } from '../data/curriculum/curriculumLessons';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { supabase } from '../lib/supabase';
import { isUuid, toDeterministicUUID } from '../utils/uuid';

export type KanjiReviewResult = 'correct' | 'incorrect';

export interface LessonKanjiProgress {
  lessonId: string;
  kanji: string;
  attempts: number;
  correctAttempts: number;
  mastered: boolean;
  lastReviewedAt: string;
}

export interface LessonKanjiLevelSummary {
  level: Lesson['level'];
  totalKanji: number;
  reviewedKanji: number;
  masteredKanji: number;
}

const PROGRESS_KEY_PREFIX = 'study_planner_lesson_kanji_progress_';
const KANJI_CHARACTER_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAFF]/g;

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
  if (level === 'N5') return normalized.startsWith('ja-n5-');
  if (level === 'N4') return normalized.startsWith('ja-n4-');
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

  recordReview(
    userId: string,
    lessonId: string,
    kanji: string,
    result: KanjiReviewResult,
  ): LessonKanjiProgress {
    const previous = this.getProgress(userId, lessonId, kanji);
    const progress: LessonKanjiProgress = {
      lessonId,
      kanji,
      attempts: (previous?.attempts || 0) + 1,
      correctAttempts: (previous?.correctAttempts || 0) + (result === 'correct' ? 1 : 0),
      mastered:
        result === 'correct'
          ? (previous?.correctAttempts || 0) + 1 >= 2
          : previous?.mastered || false,
      lastReviewedAt: new Date().toISOString(),
    };
    safeLocalStorage.setJSON(getProgressKey(userId, lessonId, kanji), progress);
    return progress;
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

    const payload = {
      id: toDeterministicUUID(`lesson_kanji_${userId}_${progress.lessonId}_${progress.kanji}`),
      userId,
      lessonId: progress.lessonId,
      kanji: progress.kanji,
      attempts: progress.attempts,
      correctAttempts: progress.correctAttempts,
      mastered: progress.mastered,
      lastReviewedAt: progress.lastReviewedAt,
    };

    const { error } = await supabase.from('lesson_kanji_progress').upsert(
      {
        id: payload.id,
        user_id: payload.userId,
        lesson_id: payload.lessonId,
        kanji: payload.kanji,
        attempts: payload.attempts,
        correct_attempts: payload.correctAttempts,
        mastered: payload.mastered,
        last_reviewed_at: payload.lastReviewedAt,
        updated_at: payload.lastReviewedAt,
      },
      { onConflict: 'user_id,lesson_id,kanji' },
    );
    if (error) {
      console.error('[LessonKanjiService] Failed to sync kanji progress:', error);
      throw error;
    }
  },

  async syncProgressFromDatabase(userId: string, lessonId: string): Promise<LessonKanjiProgress[]> {
    if (!isUuid(userId)) return [];
    try {
      const { data, error } = await supabase
        .from('lesson_kanji_progress')
        .select('lesson_id, kanji, attempts, correct_attempts, mastered, last_reviewed_at')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId);
      if (error || !Array.isArray(data)) return [];

      return data.map((row) => {
        const progress: LessonKanjiProgress = {
          lessonId: row.lesson_id,
          kanji: row.kanji,
          attempts: Number(row.attempts || 0),
          correctAttempts: Number(row.correct_attempts || 0),
          mastered: Boolean(row.mastered),
          lastReviewedAt: row.last_reviewed_at,
        };
        const local = this.getProgress(userId, lessonId, row.kanji);
        const merged: LessonKanjiProgress = local
          ? {
              ...progress,
              attempts: Math.max(local.attempts, progress.attempts),
              correctAttempts: Math.max(local.correctAttempts, progress.correctAttempts),
              mastered: local.mastered || progress.mastered,
              lastReviewedAt:
                local.lastReviewedAt > progress.lastReviewedAt
                  ? local.lastReviewedAt
                  : progress.lastReviewedAt,
            }
          : progress;
        safeLocalStorage.setJSON(getProgressKey(userId, lessonId, row.kanji), merged);
        return merged;
      });
    } catch (error) {
      console.warn('[LessonKanjiService] Failed to load kanji progress:', error);
      return [];
    }
  },

  async getLevelProgressSummary(
    userId: string,
    level: Lesson['level'],
  ): Promise<LessonKanjiLevelSummary> {
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
        if (!progress) continue;
        reviewed.add(progress.kanji);
        if (progress.mastered) mastered.add(progress.kanji);
      }
    }

    for (const key of safeLocalStorage.getAllKeys()) {
      if (!key.startsWith(PROGRESS_KEY_PREFIX) || !key.includes(`${userId}_`)) continue;
      const progress = safeLocalStorage.getJSON<LessonKanjiProgress | null>(key, null);
      if (!progress || !belongsToLevel(progress.lessonId, level, lessonIds)) continue;
      reviewed.add(progress.kanji);
      if (progress.mastered) mastered.add(progress.kanji);
    }

    if (isUuid(userId)) {
      try {
        const { data, error } = await supabase
          .from('lesson_kanji_progress')
          .select('lesson_id, kanji, mastered')
          .eq('user_id', userId)
          .in('lesson_id', [...lessonIds]);
        if (!error && Array.isArray(data)) {
          for (const row of data) {
            if (!belongsToLevel(row.lesson_id, level, lessonIds) || !levelKanji.has(row.kanji))
              continue;
            reviewed.add(row.kanji);
            if (row.mastered) mastered.add(row.kanji);
          }
        }
      } catch (error) {
        console.warn('[LessonKanjiService] Failed to load level kanji summary:', error);
      }
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
