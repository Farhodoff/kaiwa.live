import { describe, expect, it } from 'vitest';
import { JAPANESE_N5_LESSONS } from '../japaneseN5';
import n5_test_bank from '../../decks/n5_test_bank.json';
import fs from 'fs';
import path from 'path';

describe('JLPT N5 curriculum structure and exercise database', () => {
  it('contains 25 sequential lessons arranged as 5 units of 5 lessons', () => {
    expect(JAPANESE_N5_LESSONS).toHaveLength(25);

    JAPANESE_N5_LESSONS.forEach((lesson, index) => {
      const lessonNumber = index + 1;
      const unitNumber = Math.floor(index / 5) + 1;
      const lessonInUnit = (index % 5) + 1;

      expect(lesson.lessonNumber).toBe(lessonNumber);
      expect(lesson.id).toBe(`ja-n5-u${unitNumber}-l${lessonInUnit}`);
      expect(lesson.unitId).toBe(`ja-n5-u${unitNumber}`);
      expect(lesson.courseId).toBe('japanese-n5');
      expect(lesson.language).toBe('ja');
      expect(lesson.level).toBe('N5');
    });

    const unitCounts = JAPANESE_N5_LESSONS.reduce<Record<string, number>>((counts, lesson) => {
      counts[lesson.unitId] = (counts[lesson.unitId] ?? 0) + 1;
      return counts;
    }, {});

    expect(unitCounts).toEqual({
      'ja-n5-u1': 5,
      'ja-n5-u2': 5,
      'ja-n5-u3': 5,
      'ja-n5-u4': 5,
      'ja-n5-u5': 5,
    });
  });

  it('uses a complete learn, practice and test flow in every lesson with exactly 15 practice exercises and matching durations', () => {
    let totalPractice = 0;
    let totalTest = 0;

    for (const lesson of JAPANESE_N5_LESSONS) {
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
    const titles = JAPANESE_N5_LESSONS.map((lesson) => lesson.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('has zero duplicate practice prompts across all 375 exercises', () => {
    const prompts = JAPANESE_N5_LESSONS.flatMap((lesson) =>
      lesson.steps.flatMap((step) =>
        (step.practiceData?.exercises ?? []).map((exercise) => exercise.prompt.trim()),
      ),
    );

    expect(prompts).toHaveLength(375);
    expect(new Set(prompts).size).toBe(375);
  });

  it('ensures all practice exercises have valid options, valid answer index and rich Uzbek explanations', () => {
    for (const lesson of JAPANESE_N5_LESSONS) {
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

  it('integrates authentic N5 audio assets in listening lesson ja-n5-u3-l5 that exist on disk', () => {
    const listeningLesson = JAPANESE_N5_LESSONS.find((l) => l.id === 'ja-n5-u3-l5');
    expect(listeningLesson).toBeDefined();

    const exercises = listeningLesson!.steps.flatMap((step) => step.practiceData?.exercises ?? []);
    const questions = listeningLesson!.steps.flatMap((step) => step.testData?.questions ?? []);

    const audioExercises = exercises.filter((ex) => ex.audioUrl);
    expect(audioExercises).toHaveLength(5);

    const audioQuestions = questions.filter((q) => q.audioUrl);
    expect(audioQuestions).toHaveLength(4);

    for (const item of [...audioExercises, ...audioQuestions]) {
      expect(item.audioUrl).toMatch(/^\/audio\/choukai\/n5\/.+\.mp3$/);
      const diskPath = path.resolve('public', item.audioUrl!.replace(/^\//, ''));
      expect(fs.existsSync(diskPath)).toBe(true);
    }
  });

  it('ensures N5 Test Bank deck is expanded to 70 questions with verified card structures', () => {
    expect(n5_test_bank).toHaveLength(70);

    for (const card of n5_test_bank) {
      expect(card.front).toBeTruthy();
      expect(card.back).toBeTruthy();
      expect(card.phonetic).toBeDefined();
      expect(card.example).toBeDefined();
      expect(card.category).toBeDefined();
      expect(card.level).toBe('N5');
    }
  });
});
