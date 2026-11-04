import { describe, expect, it } from 'vitest';
import { JAPANESE_N3_LESSONS } from '../japaneseN3';
import fs from 'fs';
import path from 'path';

describe('JLPT N3 curriculum structure', () => {
  it('contains 30 sequential lessons arranged as 6 units of 5 lessons', () => {
    expect(JAPANESE_N3_LESSONS).toHaveLength(30);

    JAPANESE_N3_LESSONS.forEach((lesson, index) => {
      const lessonNumber = index + 1;
      const unitNumber = Math.floor(index / 5) + 1;
      const lessonInUnit = (index % 5) + 1;

      expect(lesson.lessonNumber).toBe(lessonNumber);
      expect(lesson.id).toBe(`ja-n3-u${unitNumber}-l${lessonInUnit}`);
      expect(lesson.unitId).toBe(`ja-n3-u${unitNumber}`);
      expect(lesson.courseId).toBe('japanese-n3');
      expect(lesson.language).toBe('ja');
      expect(lesson.level).toBe('N3');
    });

    const unitCounts = JAPANESE_N3_LESSONS.reduce<Record<string, number>>((counts, lesson) => {
      counts[lesson.unitId] = (counts[lesson.unitId] ?? 0) + 1;
      return counts;
    }, {});

    expect(unitCounts).toEqual({
      'ja-n3-u1': 5,
      'ja-n3-u2': 5,
      'ja-n3-u3': 5,
      'ja-n3-u4': 5,
      'ja-n3-u5': 5,
      'ja-n3-u6': 5,
    });
  });

  it('uses a complete learn, practice and test flow in every lesson with at least 2 practice exercises and 10 questions', () => {
    for (const lesson of JAPANESE_N3_LESSONS) {
      expect(lesson.steps.map((step) => step.type)).toEqual(['learn', 'practice', 'test']);
      expect(lesson.steps[0].learnData).toBeDefined();
      expect(lesson.steps[1].practiceData?.exercises.length).toBeGreaterThanOrEqual(2);
      expect(lesson.steps[2].testData?.questions.length).toBe(10);

      const stepDuration = lesson.steps.reduce((total, step) => total + step.estimatedMinutes, 0);
      expect(stepDuration).toBe(lesson.estimatedDurationMinutes);
    }
  });

  it('contains unique lesson titles across all 30 lessons', () => {
    const titles = JAPANESE_N3_LESSONS.map((lesson) => lesson.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('checks that referenced N3 listening audio files exist on disk', () => {
    const listeningLessons = JAPANESE_N3_LESSONS.filter((lesson) =>
      lesson.title.match(/Listening|Choukai|聴解/i),
    );

    expect(listeningLessons).toHaveLength(2);

    for (const lesson of listeningLessons) {
      const exercises = lesson.steps.flatMap((step) => step.practiceData?.exercises ?? []);
      const questions = lesson.steps.flatMap((step) => step.testData?.questions ?? []);
      const audioItems = [...exercises, ...questions].filter((item) => item.audioUrl);

      expect(audioItems.length).toBeGreaterThanOrEqual(5);
      for (const item of audioItems) {
        expect(item.audioUrl).toMatch(/^\/audio\/choukai\/n3\/.+\.mp3$/);
        const diskPath = path.resolve('public', item.audioUrl!.replace(/^\//, ''));
        expect(fs.existsSync(diskPath)).toBe(true);
      }
    }
  });

  it.each([
    ['ja-n3-u1-l2-practice-06', '4: 会社'],
    ['ja-n3-u1-l3-practice-06', '1: 歌'],
    ['ja-n3-u2-l2-practice-06', '1: 帰宅後'],
    ['ja-n3-u3-l1-practice-06', '2: 出張'],
    ['ja-n3-u3-l2-practice-06', '2: 喜'],
    ['ja-n3-u3-l3-practice-06', '4: 大'],
    ['ja-n3-u4-l1-practice-06', '1: 優'],
    ['ja-n3-u4-l4-practice-06', '3: 伝'],
    ['ja-n3-u4-l5-practice-06', '2: 手'],
  ])('scores the third blank correctly for %s', (id, expected) => {
    const exercise = JAPANESE_N3_LESSONS.flatMap((lesson) => lesson.steps)
      .flatMap((step) => step.practiceData?.exercises ?? [])
      .find((item) => item.id === id);
    expect(exercise).toBeDefined();
    expect(exercise!.options![exercise!.correctAnswer as number]).toContain(expected);
  });

  it('does not reuse identical practice prompts across different lessons', () => {
    const prompts = JAPANESE_N3_LESSONS.flatMap((lesson) =>
      lesson.steps.flatMap((step) =>
        (step.practiceData?.exercises ?? []).map((exercise) => exercise.prompt),
      ),
    );

    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it('contains zero N5 distractors and maintains realistic answer diversity in test questions', () => {
    const forbiddenPhrases = [
      '散歩[さんぽ]',
      '食事[しょくじ]',
      '運転[うんてん]',
      "Umuman aloqasi bo'lmagan so'z",
      '日本語を 毎日 勉強します',
    ];

    for (const lesson of JAPANESE_N3_LESSONS) {
      // Check practice exercises for forbidden N5 distractors
      const practiceExercises =
        lesson.steps.find((s) => s.type === 'practice')?.practiceData?.exercises ?? [];
      for (const ex of practiceExercises) {
        for (const opt of ex.options ?? []) {
          for (const phrase of forbiddenPhrases) {
            expect(opt).not.toBe(phrase);
          }
        }
      }

      // Check test step
      const testStep = lesson.steps.find((s) => s.type === 'test');
      expect(testStep?.testData?.questions).toBeDefined();

      const questions = testStep!.testData!.questions;
      expect(questions).toHaveLength(10);

      for (const q of questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(4);
        expect(q.correctAnswerIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswerIndex).toBeLessThan(q.options.length);
        expect(q.explanation?.trim().length).toBeGreaterThan(10);
      }

      // Ensure no lesson has a completely monotonous answer key (e.g. all 0s)
      const answerIndices = questions.map((q) => q.correctAnswerIndex);
      const uniqueIndices = new Set(answerIndices);
      expect(uniqueIndices.size).toBeGreaterThanOrEqual(3);
    }
  });
});
