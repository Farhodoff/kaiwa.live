import { describe, expect, it } from 'vitest';
import { JAPANESE_N1_LESSONS } from '../japaneseN1';
import { JAPANESE_N2_LESSONS } from '../japaneseN2';
import { JAPANESE_N3_LESSONS } from '../japaneseN3';

const advanced = [...JAPANESE_N1_LESSONS, ...JAPANESE_N2_LESSONS, ...JAPANESE_N3_LESSONS];

describe('expanded JLPT learning flow', () => {
  it('provides advanced levels with categorized practice, valid tests, durations and unique IDs/prompts', () => {
    const allIds = new Set<string>();
    const allPrompts = new Set<string>();
    for (const lesson of advanced) {
      expect(lesson.steps.map((step) => step.type)).toEqual(['learn', 'practice', 'test']);
      const practice = lesson.steps.find((step) => step.type === 'practice')!;
      const exercises = practice.practiceData!.exercises;
      expect(exercises.length).toBeGreaterThanOrEqual(10);
      for (const category of ['grammar-drill', 'vocabulary-drill', 'sentence-building']) {
        expect(exercises.some((exercise) => exercise.category === category)).toBe(true);
      }
      expect(
        exercises.some((exercise) =>
          ['reading-application', 'listening-application'].includes(exercise.category ?? ''),
        ),
      ).toBe(true);
      for (const exercise of exercises) {
        expect(exercise.id).toBeTruthy();
        expect(allIds.has(exercise.id)).toBe(false);
        allIds.add(exercise.id);
        expect(exercise.prompt.trim()).not.toBe('');
        expect(allPrompts.has(exercise.prompt)).toBe(false);
        allPrompts.add(exercise.prompt);
        expect(exercise.explanation?.trim()).toBeTruthy();
        expect(exercise.options?.length).toBeGreaterThanOrEqual(2);
        if (typeof exercise.correctAnswer === 'number') {
          expect(exercise.correctAnswer).toBeGreaterThanOrEqual(0);
          expect(exercise.correctAnswer).toBeLessThan(exercise.options!.length);
        } else {
          expect(exercise.options).toContain(exercise.correctAnswer);
        }
      }
      const test = lesson.steps.find((step) => step.type === 'test')!;
      expect(test.testData!.questions.length).toBeGreaterThanOrEqual(10);
      for (const question of test.testData!.questions) {
        expect(allIds.has(question.id)).toBe(false);
        allIds.add(question.id);
        expect(question.question.trim()).toBeTruthy();
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.correctAnswerIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswerIndex).toBeLessThan(question.options.length);
        expect(question.explanation.trim()).toBeTruthy();
      }
      expect(lesson.estimatedDurationMinutes).toBe(
        lesson.steps.reduce((sum, step) => sum + step.estimatedMinutes, 0),
      );
    }
  });
});
