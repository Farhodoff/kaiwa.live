import { describe, expect, it } from 'vitest';
import { JAPANESE_N1_LESSONS } from '../japaneseN1';
import fs from 'fs';
import path from 'path';

describe('JLPT N1 curriculum structure', () => {
  it('contains 30 sequential lessons arranged as 6 units of 5 lessons', () => {
    expect(JAPANESE_N1_LESSONS).toHaveLength(30);

    JAPANESE_N1_LESSONS.forEach((lesson, index) => {
      const lessonNumber = index + 1;
      const unitNumber = Math.floor(index / 5) + 1;
      const lessonInUnit = (index % 5) + 1;

      expect(lesson.lessonNumber).toBe(lessonNumber);
      expect(lesson.id).toBe(`ja-n1-u${unitNumber}-l${lessonInUnit}`);
      expect(lesson.unitId).toBe(`ja-n1-u${unitNumber}`);
      expect(lesson.courseId).toMatch(/^(japanese-n1|jlpt-n1)$/);
      expect(lesson.language).toBe('ja');
      expect(lesson.level).toBe('N1');
    });

    const unitCounts = JAPANESE_N1_LESSONS.reduce<Record<string, number>>((counts, lesson) => {
      counts[lesson.unitId] = (counts[lesson.unitId] ?? 0) + 1;
      return counts;
    }, {});

    expect(unitCounts).toEqual({
      'ja-n1-u1': 5,
      'ja-n1-u2': 5,
      'ja-n1-u3': 5,
      'ja-n1-u4': 5,
      'ja-n1-u5': 5,
      'ja-n1-u6': 5,
    });
  });

  it('uses a complete learn, practice and test flow in every lesson with at least 2 practice exercises', () => {
    for (const lesson of JAPANESE_N1_LESSONS) {
      expect(lesson.steps.map((step) => step.type)).toEqual(['learn', 'practice', 'test']);
      expect(lesson.steps[0].learnData).toBeDefined();
      expect(lesson.steps[1].practiceData?.exercises.length).toBeGreaterThanOrEqual(2);
      expect(lesson.steps[2].testData?.questions.length).toBeGreaterThanOrEqual(4);

      const stepDuration = lesson.steps.reduce((total, step) => total + step.estimatedMinutes, 0);
      expect(stepDuration).toBe(lesson.estimatedDurationMinutes);
    }
  });

  it('contains unique lesson titles and appropriate capstone titles', () => {
    const titles = JAPANESE_N1_LESSONS.map((lesson) => lesson.title);
    expect(new Set(titles).size).toBe(titles.length);

    expect(JAPANESE_N1_LESSONS[8].title).toMatch(/Mock Exam|Sinov imtihoni/i);
    expect(JAPANESE_N1_LESSONS[9].title).toMatch(/Pinnacle Capstone|Oliy cho'qqi/i);
    expect(JAPANESE_N1_LESSONS[23].title).toMatch(/Mock Exam|Sinov imtihoni/i);
    expect(JAPANESE_N1_LESSONS[29].title).toMatch(/Final Review|Yakuniy takrorlash/i);
  });

  it('uses authentic N1 audio assets in listening lessons that exist on disk', () => {
    const listeningLessons = JAPANESE_N1_LESSONS.filter((lesson) =>
      lesson.title.match(/Listening|Choukai|聴解|Tinglab tushunish/i),
    );

    expect(listeningLessons).toHaveLength(2);

    for (const lesson of listeningLessons) {
      const exercises = lesson.steps.flatMap((step) => step.practiceData?.exercises ?? []);
      const questions = lesson.steps.flatMap((step) => step.testData?.questions ?? []);
      const audioItems = [...exercises, ...questions].filter((item) => item.audioUrl);

      expect(audioItems.length).toBeGreaterThanOrEqual(4);
      for (const item of audioItems) {
        expect(item.audioUrl).toMatch(/^\/audio\/choukai\/n1\/.+\.mp3$/);
        const diskPath = path.resolve('public', item.audioUrl!.replace(/^\//, ''));
        expect(fs.existsSync(diskPath)).toBe(true);
      }
    }
  });

  it('does not reuse identical practice prompts across different lessons', () => {
    const prompts = JAPANESE_N1_LESSONS.flatMap((lesson) =>
      lesson.steps.flatMap((step) =>
        (step.practiceData?.exercises ?? []).map((exercise) => exercise.prompt),
      ),
    );

    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it('does not expose generated placeholder exercises to N1 learners', () => {
    const placeholder =
      /文脈に合わない|文脈と無関係|本文にない情報|文法的に不自然|意味が異なる|文法の誤った|反対の内容|文法形式だけ/;

    for (const lesson of JAPANESE_N1_LESSONS) {
      const exercises = lesson.steps.flatMap((step) => step.practiceData?.exercises ?? []);
      expect(exercises.length).toBeGreaterThanOrEqual(8);
      expect(
        exercises
          .flatMap((exercise) => exercise.options ?? [])
          .some((option) => placeholder.test(option)),
      ).toBe(false);
    }
  });

  it('contains zero N5 distractors and maintains realistic answer diversity in test questions', () => {
    const forbiddenPhrases = [
      '散歩[さんぽ]',
      '食事[しょくじ]',
      '運転[うんてん]',
      "Umuman aloqasi bo'lmagan so'z",
      '日本語を 毎日 勉強します',
    ];

    for (const lesson of JAPANESE_N1_LESSONS) {
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
      expect(questions.length).toBeGreaterThanOrEqual(4);

      for (const q of questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(4);
        expect(q.correctAnswerIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswerIndex).toBeLessThan(q.options.length);
        expect(q.explanation?.trim().length).toBeGreaterThan(10);
      }

      // Ensure no lesson has a completely monotonous answer key (e.g. all 0s)
      const answerIndices = questions.map((q) => q.correctAnswerIndex);
      const uniqueIndices = new Set(answerIndices);
      expect(uniqueIndices.size).toBeGreaterThan(1);
    }
  });
});
