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

  it('advances Spaced Repetition Intervals correctly: 1 kun, 3 kun, 7 kun, 14 kun', () => {
    const baseDate = new Date('2026-05-01T08:00:00Z');

    // Review 1: stage 1, interval 1 day
    const r1 = LessonKanjiService.recordReview('user-srs', lesson.id, '木', 'correct', baseDate);
    expect(r1.srsStage).toBe(1);
    expect(r1.intervalDays).toBe(1);
    expect(new Date(r1.nextReviewAt!).getTime()).toBe(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Review 2: stage 2, interval 3 days
    const r2 = LessonKanjiService.recordReview('user-srs', lesson.id, '木', 'correct', baseDate);
    expect(r2.srsStage).toBe(2);
    expect(r2.intervalDays).toBe(3);
    expect(new Date(r2.nextReviewAt!).getTime()).toBe(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Review 3: stage 3, interval 7 days
    const r3 = LessonKanjiService.recordReview('user-srs', lesson.id, '木', 'correct', baseDate);
    expect(r3.srsStage).toBe(3);
    expect(r3.intervalDays).toBe(7);
    expect(new Date(r3.nextReviewAt!).getTime()).toBe(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Review 4: stage 4, interval 14 days
    const r4 = LessonKanjiService.recordReview('user-srs', lesson.id, '木', 'correct', baseDate);
    expect(r4.srsStage).toBe(4);
    expect(r4.intervalDays).toBe(14);
    expect(r4.mastered).toBe(true);
    expect(new Date(r4.nextReviewAt!).getTime()).toBe(
      baseDate.getTime() + 14 * 24 * 60 * 60 * 1000,
    );

    // Review 5 (incorrect): resets interval to 1 day (stage 1)
    const r5 = LessonKanjiService.recordReview('user-srs', lesson.id, '木', 'incorrect', baseDate);
    expect(r5.srsStage).toBe(1);
    expect(r5.intervalDays).toBe(1);
    expect(new Date(r5.nextReviewAt!).getTime()).toBe(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000);
  });

  it('correctly filters "Bugun qayta ko‘rish kerak" (Due for Review today) kanji list', () => {
    const today = new Date('2026-05-10T12:00:00Z');

    // 1. Kanji reviewed on May 1 with 1 day interval -> DUE (overdue by 8 days)
    LessonKanjiService.recordReview(
      'user-due',
      lesson.id,
      '日',
      'correct',
      new Date('2026-05-01T12:00:00Z'),
    );

    // 2. Kanji reviewed on May 9 with 1 day interval -> DUE today
    LessonKanjiService.recordReview(
      'user-due',
      lesson.id,
      '月',
      'correct',
      new Date('2026-05-09T10:00:00Z'),
    );

    // 3. Kanji reviewed on May 9 with 7 day interval -> NOT DUE yet
    const notDue = LessonKanjiService.recordReview(
      'user-due',
      lesson.id,
      '火',
      'correct',
      new Date('2026-05-09T10:00:00Z'),
    );
    // force interval 7 days
    notDue.intervalDays = 7;
    notDue.nextReviewAt = new Date('2026-05-16T10:00:00Z').toISOString();
    localStorage.setItem(
      'study_planner_lesson_kanji_progress_user-due_ja-minna-l1_火',
      JSON.stringify(notDue),
    );

    const dueList = LessonKanjiService.getDueKanjis('user-due', today);
    expect(dueList.length).toBe(2);
    expect(dueList.map((d) => d.kanji)).toContain('日');
    expect(dueList.map((d) => d.kanji)).toContain('月');
    expect(dueList.map((d) => d.kanji)).not.toContain('火');
    expect(dueList[0].kanji).toBe('日'); // Most overdue first
  });

  it('records writing accuracy and stroke-order in kanji progress', () => {
    const baseDate = new Date('2026-05-01T08:00:00Z');

    const result = LessonKanjiService.recordWritingPractice(
      'user-write',
      lesson.id,
      '水',
      { writingAccuracy: 95, strokeOrderPassed: true },
      baseDate,
    );

    expect(result.kanji).toBe('水');
    expect(result.writingAccuracy).toBe(95);
    expect(result.strokeOrderPassed).toBe(true);
    expect(result.totalWrittenCount).toBe(1);
    expect(result.correctAttempts).toBe(1);

    // Second writing practice with 85% accuracy
    const second = LessonKanjiService.recordWritingPractice(
      'user-write',
      lesson.id,
      '水',
      { writingAccuracy: 85, strokeOrderPassed: true },
      baseDate,
    );

    expect(second.totalWrittenCount).toBe(2);
    expect(second.writingAccuracy).toBe(90); // (95 + 85) / 2
    expect(second.mastered).toBe(true); // 2 correct attempts
  });

  it('distinguishes Lesson Kanji Mastery vs General JLPT Kanji Mastery', async () => {
    // Review lesson kanji '日'
    LessonKanjiService.recordReview('user-comp', lesson.id, '日', 'correct');
    LessonKanjiService.recordReview('user-comp', lesson.id, '日', 'correct');

    const comparison = await LessonKanjiService.getMasteryComparison('user-comp', 'N5');

    expect(comparison.level).toBe('N5');
    expect(comparison.lessonKanji.total).toBeGreaterThan(0);
    expect(comparison.lessonKanji.mastered).toBe(1);
    expect(comparison.jlptKanji.total).toBeGreaterThanOrEqual(100);
    expect(comparison.jlptKanji.mastered).toBe(1);
    expect(comparison.lessonKanji.percentage).toBeGreaterThan(0);
    expect(comparison.distinctMasteredKanji).toContain('日');
  });

  it('extracts vocabulary compounds (熟語) for kanji reinforcement', () => {
    const compounds = LessonKanjiService.getKanjiCompounds('日');

    expect(compounds.length).toBeGreaterThanOrEqual(2);
    const words = compounds.map((c) => c.word);
    expect(words).toContain('日本'); // from database examples or lesson vocabulary
    expect(compounds.every((c) => c.reading && c.meaningUz)).toBe(true);
  });

  it('caps successful SRS at 14 days', () => {
    let result;
    for (let i = 0; i < 8; i++)
      result = LessonKanjiService.recordReview('cap', lesson.id, '日', 'correct');
    expect(result).toMatchObject({ srsStage: 4, intervalDays: 14 });
  });

  it('includes reviews scheduled later today but excludes tomorrow and other users', () => {
    const today = new Date(2026, 4, 10, 8);
    LessonKanjiService.recordReview('today', lesson.id, '日', 'correct', new Date(2026, 4, 9, 23));
    LessonKanjiService.recordReview('today', lesson.id, '月', 'correct', new Date(2026, 4, 10, 8));
    LessonKanjiService.recordReview('other', lesson.id, '木', 'correct', new Date(2026, 4, 9, 8));
    expect(LessonKanjiService.getDueKanjis('today', today).map((item) => item.kanji)).toEqual([
      '日',
    ]);
  });

  it('does not count general writing practice as lesson mastery or duplicate writing characters', async () => {
    for (const scope of ['jlpt-N5', 'jlpt-N4']) {
      LessonKanjiService.recordWritingPractice('scopes', scope, '日', {
        writingAccuracy: 100,
        strokeOrderPassed: true,
      });
      LessonKanjiService.recordWritingPractice('scopes', scope, '日', {
        writingAccuracy: 100,
        strokeOrderPassed: true,
      });
    }
    const summary = await LessonKanjiService.getMasteryComparison('scopes', 'N5');
    expect(summary.lessonKanji.mastered).toBe(0);
    expect(summary.jlptKanji.mastered).toBe(1);
    expect(summary.writingMasteredCount).toBe(1);
  });

  it('uses a cumulative writing average and retains the latest stroke-order result', () => {
    const write = (accuracy: number, order: boolean) =>
      LessonKanjiService.recordWritingPractice('average', lesson.id, '日', {
        writingAccuracy: accuracy,
        strokeOrderPassed: order,
      });
    write(100, true);
    write(80, true);
    expect(write(0, false)).toMatchObject({
      writingAccuracy: 60,
      strokeOrderPassed: false,
      totalWrittenCount: 3,
    });
    expect(() => write(NaN, false)).toThrow();
    expect(LessonKanjiService.getProgress('average', lesson.id, '日')?.attempts).toBe(3);
  });

  it('validates the entire import before writing any records', () => {
    const record = LessonKanjiService.recordReview('source', lesson.id, '日', 'correct');
    const result = LessonKanjiService.importProgress(
      'target',
      JSON.stringify({ version: '2.0', items: [record, { ...record, writingAccuracy: 101 }] }),
    );
    expect(result.success).toBe(false);
    expect(LessonKanjiService.getAllUserProgress('target')).toEqual([]);
  });

  it('exports, imports, and resets kanji progress safely', () => {
    // Set up initial progress
    LessonKanjiService.recordReview('user-backup', lesson.id, '日', 'correct');
    LessonKanjiService.recordReview('user-backup', lesson.id, '月', 'correct');

    // Export
    const exportedJson = LessonKanjiService.exportProgress('user-backup');
    expect(exportedJson).toContain('"version": "2.0"');
    expect(exportedJson).toContain('"kanji": "日"');
    expect(exportedJson).toContain('"kanji": "月"');

    // Reset progress
    const resetResult = LessonKanjiService.resetProgress('user-backup');
    expect(resetResult.resetCount).toBe(2);
    expect(LessonKanjiService.getAllUserProgress('user-backup')).toHaveLength(0);

    // Import from JSON
    const importResult = LessonKanjiService.importProgress('user-backup', exportedJson);
    expect(importResult.success).toBe(true);
    expect(importResult.importedCount).toBe(2);
    expect(LessonKanjiService.getAllUserProgress('user-backup')).toHaveLength(2);
  });
});
