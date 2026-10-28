import { describe, expect, it } from 'vitest';
import { JAPANESE_N4_LESSONS } from '../japaneseN4';
import n4_500_mon from '../../decks/n4_500_mon.json';

describe('JLPT N4 curriculum structure and exercise database', () => {
  it('contains 25 sequential lessons arranged as 5 units of 5 lessons', () => {
    expect(JAPANESE_N4_LESSONS).toHaveLength(25);

    JAPANESE_N4_LESSONS.forEach((lesson, index) => {
      const lessonNumber = index + 1;
      const unitNumber = Math.floor(index / 5) + 1;
      const lessonInUnit = (index % 5) + 1;

      expect(lesson.lessonNumber).toBe(lessonNumber);
      expect(lesson.id).toBe(`ja-n4-u${unitNumber}-l${lessonInUnit}`);
      expect(lesson.unitId).toBe(`ja-n4-u${unitNumber}`);
      expect(lesson.courseId).toBe('japanese-n4');
      expect(lesson.language).toBe('ja');
      expect(lesson.level).toBe('N4');
    });

    const unitCounts = JAPANESE_N4_LESSONS.reduce<Record<string, number>>((counts, lesson) => {
      counts[lesson.unitId] = (counts[lesson.unitId] ?? 0) + 1;
      return counts;
    }, {});

    expect(unitCounts).toEqual({
      'ja-n4-u1': 5,
      'ja-n4-u2': 5,
      'ja-n4-u3': 5,
      'ja-n4-u4': 5,
      'ja-n4-u5': 5,
    });
  });

  it('uses a complete learn, practice and test flow in every lesson with exactly 15 practice exercises and matching durations', () => {
    let totalPractice = 0;
    let totalTest = 0;

    for (const lesson of JAPANESE_N4_LESSONS) {
      expect(lesson.steps.map((step) => step.type)).toEqual(['learn', 'practice', 'test']);
      expect(lesson.steps[0].learnData).toBeDefined();

      const practiceStep = lesson.steps[1];
      const testStep = lesson.steps[2];

      expect(practiceStep.practiceData?.exercises).toHaveLength(15);
      expect(testStep.testData?.questions.length).toBeGreaterThanOrEqual(4);

      totalPractice += practiceStep.practiceData?.exercises.length ?? 0;
      totalTest += testStep.testData?.questions.length ?? 0;

      const stepDuration = lesson.steps.reduce((total, step) => total + step.estimatedMinutes, 0);
      expect(stepDuration).toBe(lesson.estimatedDurationMinutes);
    }

    expect(totalPractice).toBe(375);
    expect(totalTest).toBe(100);
  });

  it('contains unique lesson titles across all 25 lessons', () => {
    const titles = JAPANESE_N4_LESSONS.map((lesson) => lesson.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('has zero duplicate practice prompts across different lessons and exercises', () => {
    const prompts = JAPANESE_N4_LESSONS.flatMap((lesson) =>
      lesson.steps.flatMap((step) =>
        (step.practiceData?.exercises ?? []).map((exercise) => exercise.prompt.trim()),
      ),
    );

    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it('ensures all practice exercises have valid options, valid answer index and rich Uzbek explanations', () => {
    for (const lesson of JAPANESE_N4_LESSONS) {
      const practiceExercises =
        lesson.steps.find((s) => s.type === 'practice')?.practiceData?.exercises ?? [];

      for (const ex of practiceExercises) {
        expect(ex.id).toBeTruthy();
        expect(ex.prompt.trim().length).toBeGreaterThan(5);
        expect(ex.options).toBeDefined();
        expect(ex.options!.length).toBe(4);
        expect(typeof ex.correctAnswer).toBe('number');
        expect(ex.correctAnswer as number).toBeGreaterThanOrEqual(0);
        expect(ex.correctAnswer as number).toBeLessThan(4);
        expect(ex.explanation).toBeDefined();
        expect(ex.explanation!.trim().length).toBeGreaterThan(15);
      }
    }
  });

  it('ensures N4 500 Mon deck is expanded and has verified card structures', () => {
    expect(n4_500_mon.length).toBeGreaterThanOrEqual(80);

    for (const card of n4_500_mon) {
      expect(card.front).toBeTruthy();
      expect(card.back).toBeTruthy();
      expect(card.phonetic).toBeTruthy();
      expect(card.category).toMatch(/500 Mon N4:/);
      expect(card.level).toBe('N4');
    }
  });
});
