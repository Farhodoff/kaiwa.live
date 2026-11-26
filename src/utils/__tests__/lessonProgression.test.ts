import { describe, expect, it } from 'vitest';
import type { Lesson, UserLessonProgress } from '../../types/lesson';
import {
  completedLessonSteps,
  unlockedLessonStep,
  recordLessonStep,
  lessonAggregateScore,
  verifiedLessonCompletion,
  lessonStepTotal,
} from '../lessonProgression';
import { loadCurriculumLevel } from '../../data/curriculum/curriculumLessons';
import { practiceAnswerCorrect } from '../practiceAnswer';

const fixture: Lesson = {
  id: 'lesson',
  courseId: 'c',
  unitId: 'u',
  unitTitle: 'Unit',
  language: 'ja',
  level: 'N5',
  lessonNumber: 1,
  title: 'Lesson',
  description: '',
  estimatedDurationMinutes: 10,
  steps: [
    { id: 'learn', type: 'learn', title: 'Learn', estimatedMinutes: 1 },
    {
      id: 'practice',
      type: 'practice',
      title: 'Practice',
      estimatedMinutes: 1,
      practiceData: {
        instructions: '',
        exercises: Array.from({ length: 5 }, (_, i) => ({
          id: `p${i}`,
          type: 'multiple-choice' as const,
          prompt: '',
          options: ['a', 'b'],
          correctAnswer: 0,
        })),
      },
    },
    {
      id: 'test',
      type: 'test',
      title: 'Test',
      estimatedMinutes: 1,
      testData: {
        instructions: '',
        passingScorePercentage: 75,
        questions: Array.from({ length: 4 }, (_, i) => ({
          id: `q${i}`,
          question: '',
          options: ['a', 'b'],
          correctAnswerIndex: 0,
          explanation: '',
        })),
      },
    },
    {
      id: 'listening',
      type: 'test',
      title: 'Listening',
      estimatedMinutes: 1,
      testData: {
        instructions: '',
        passingScorePercentage: 75,
        questions: Array.from({ length: 2 }, (_, i) => ({
          id: `l${i}`,
          question: '',
          options: ['a', 'b'],
          correctAnswerIndex: 0,
          explanation: '',
        })),
      },
    },
  ],
};
const initial = (lesson = fixture): UserLessonProgress => ({
  lessonId: lesson.id,
  userId: 'guest',
  currentStepIndex: 0,
  completedStepIds: [],
  isCompleted: false,
  lastAttemptedAt: new Date().toISOString(),
});

describe('Sequential lesson progression', () => {
  it('ignores fabricated current indices, completed IDs and final quiz percentages', () => {
    const progress = {
      ...initial(),
      currentStepIndex: 99,
      completedStepIds: ['learn', 'practice', 'test'],
      quizScore: { score: 100, total: 100, percentage: 100 },
    };
    expect(unlockedLessonStep(fixture, progress)).toBe(0);
    expect(completedLessonSteps(fixture, progress)).toEqual([]);
    expect(() => recordLessonStep(fixture, progress, 3, 2, 2)).toThrow('oldingi');
  });
  it('requires practice and every test to pass, and weighs all answers in the total', () => {
    let p = recordLessonStep(fixture, initial(), 0);
    p = recordLessonStep(fixture, p, 1, 2, 5);
    expect(unlockedLessonStep(fixture, p)).toBe(1);
    expect(() => recordLessonStep(fixture, p, 2, 4, 4)).toThrow();
    p = recordLessonStep(fixture, p, 1, 4, 5);
    p = recordLessonStep(fixture, p, 2, 3, 4);
    expect(verifiedLessonCompletion(fixture, p)).toBe(false);
    p = recordLessonStep(fixture, p, 3, 2, 2);
    expect(verifiedLessonCompletion(fixture, p)).toBe(true);
    expect(lessonAggregateScore(fixture, p)).toEqual({ score: 9, total: 11, percentage: 82 });
    expect(unlockedLessonStep(fixture, JSON.parse(JSON.stringify(p)))).toBe(3);
  });
  it('does not accept a rounded-up percentage or a wrong question count', () => {
    const step = {
      ...fixture.steps[2],
      testData: {
        ...fixture.steps[2].testData!,
        questions: Array.from({ length: 200 }, (_, i) => ({
          ...fixture.steps[2].testData!.questions[0],
          id: `q${i}`,
        })),
      },
    };
    const lesson = { ...fixture, steps: [step] };
    const p = recordLessonStep(lesson, initial(lesson), 0, 149, 200);
    expect(p.stepResults?.test.percentage).toBe(75);
    expect(verifiedLessonCompletion(lesson, p)).toBe(false);
    expect(() => recordLessonStep(lesson, initial(lesson), 0, 1, 1)).toThrow('soniga');
  });
  it('grades N1 fill-in-blank option answers by their text rather than comparing an index to a word', () => {
    expect(
      practiceAnswerCorrect(
        {
          id: 'fill',
          type: 'fill-in-blank',
          prompt: '',
          options: ['委ねて', '孕んで'],
          correctAnswer: '孕んで',
        },
        1,
      ),
    ).toBe(true);
    expect(
      practiceAnswerCorrect(
        {
          id: 'fill',
          type: 'fill-in-blank',
          prompt: '',
          options: ['委ねて', '孕んで'],
          correctAnswer: '孕んで',
        },
        0,
      ),
    ).toBe(false);
  });
  it.each(['N5', 'N4', 'N3', 'N2', 'N1'])(
    'audits every %s lesson for nonempty, completable sequential stages',
    async (level) => {
      const lessons = await loadCurriculumLevel(level);
      expect(lessons.length).toBeGreaterThan(0);
      for (const lesson of lessons) {
        let p = initial(lesson);
        expect(
          lesson.steps.some((s) => s.type === 'test'),
          lesson.id,
        ).toBe(true);
        lesson.steps.forEach((step, index) => {
          const count = lessonStepTotal(step);
          if (step.type !== 'learn') expect(count, `${lesson.id}/${step.id}`).toBeGreaterThan(0);
          p = recordLessonStep(lesson, p, index, count, count);
        });
        expect(verifiedLessonCompletion(lesson, p), lesson.id).toBe(true);
      }
    },
  );
});
