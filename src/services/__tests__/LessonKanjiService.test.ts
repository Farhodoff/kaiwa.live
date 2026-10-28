import { beforeEach, describe, expect, it } from 'vitest';
import type { Lesson } from '../../types/lesson';
import { LessonKanjiService } from '../LessonKanjiService';

const lesson: Lesson = {
  id: 'ja-minna-l1',
  courseId: 'japanese-n5',
  unitId: 'ja-minna-u1',
  unitTitle: 'Unit 1',
  language: 'ja',
  level: 'N5',
  lessonNumber: 1,
  title: 'Tanishuv',
  description: 'Test lesson',
  estimatedDurationMinutes: 10,
  steps: [
    {
      id: 'ja-minna-l1-s1',
      title: 'Learn',
      type: 'learn',
      estimatedMinutes: 10,
      learnData: {
        title: 'Vocabulary',
        explanation: 'Test',
        vocabulary: [
          {
            term: '日本',
            reading: 'にほん',
            meaning: 'Yaponiya',
            exampleSentence: '日本人です。',
          },
        ],
      },
    },
  ],
};

describe('LessonKanjiService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('derives lesson kanji from Japanese vocabulary', () => {
    const kanji = LessonKanjiService.getLessonKanji(lesson);
    expect(kanji.map((item) => item.kanji)).toEqual(['日', '本', '人']);
    expect(kanji[0].meaningUz).toContain('Quyosh');
  });

  it('prefers explicit lesson kanji over derived vocabulary', () => {
    const explicit = {
      ...lesson,
      kanji: [{ kanji: '学', meaningUz: "O'qish" }],
    };
    expect(LessonKanjiService.getLessonKanji(explicit)).toEqual(explicit.kanji);
  });

  it('tracks two correct reviews as mastered', () => {
    const first = LessonKanjiService.recordReview('user-1', lesson.id, '日', 'correct');
    const second = LessonKanjiService.recordReview('user-1', lesson.id, '日', 'correct');

    expect(first.mastered).toBe(false);
    expect(second.mastered).toBe(true);
    expect(LessonKanjiService.getProgress('user-1', lesson.id, '日')).toEqual(second);
  });

  it('does not lose mastery after an incorrect review', () => {
    LessonKanjiService.recordReview('user-1', lesson.id, '日', 'correct');
    LessonKanjiService.recordReview('user-1', lesson.id, '日', 'correct');
    const progress = LessonKanjiService.recordReview('user-1', lesson.id, '日', 'incorrect');

    expect(progress.mastered).toBe(true);
    expect(progress.attempts).toBe(3);
    expect(progress.correctAttempts).toBe(2);
  });

  it('summarizes mastered lesson kanji for a JLPT level', async () => {
    LessonKanjiService.recordReview('user-1', lesson.id, '日', 'correct');
    LessonKanjiService.recordReview('user-1', lesson.id, '日', 'correct');

    const summary = await LessonKanjiService.getLevelProgressSummary('user-1', 'N5');

    expect(summary.totalKanji).toBeGreaterThan(0);
    expect(summary.reviewedKanji).toBe(1);
    expect(summary.masteredKanji).toBe(1);
  });
});
