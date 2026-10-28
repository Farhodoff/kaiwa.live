import { describe, expect, it } from 'vitest';
import { JAPANESE_N5_LESSONS } from '../japaneseN5';
import n5_test_bank from '../../decks/n5_test_bank.json';
import fs from 'fs';
import path from 'path';

describe('JLPT N5 curriculum structure and exercise database', () => {
  it('contains 25 sequential lessons for JLPT N5 (Minna no Nihongo 1-25)', () => {
    expect(JAPANESE_N5_LESSONS).toHaveLength(25);

    JAPANESE_N5_LESSONS.forEach((lesson, index) => {
      const lessonNumber = index + 1;

      expect(lesson.lessonNumber).toBe(lessonNumber);
      expect(lesson.id).toBe(`ja-minna-l${lessonNumber}`);
      expect(lesson.courseId).toBe('japanese-n5');
      expect(lesson.language).toBe('ja');
      expect(lesson.level).toBe('N5');
    });
  });

  it('uses a complete learn, practice and test flow in every lesson with matching durations', () => {
    let totalPractice = 0;
    let totalTest = 0;

    for (const lesson of JAPANESE_N5_LESSONS) {
      expect(lesson.steps.map((step) => step.type)).toEqual(['learn', 'practice', 'test', 'test']);
      expect(lesson.steps[0].learnData).toBeDefined();

      const practiceStep = lesson.steps[1];
      const testStep = lesson.steps[2];
      const listeningStep = lesson.steps[3];

      expect(practiceStep.practiceData?.exercises.length).toBeGreaterThanOrEqual(10);
      expect(testStep.testData?.questions.length).toBeGreaterThanOrEqual(4);
      expect(listeningStep.testData?.questions.length).toBeGreaterThanOrEqual(1);

      totalPractice += practiceStep.practiceData?.exercises.length ?? 0;
      totalTest += testStep.testData?.questions.length ?? 0;

      const stepDuration = lesson.steps.reduce((total, step) => total + step.estimatedMinutes, 0);
      expect(stepDuration).toBe(lesson.estimatedDurationMinutes);
    }

    expect(totalPractice).toBe(280);
    expect(totalTest).toBeGreaterThanOrEqual(100);
  });

  it('contains unique lesson titles across all 25 lessons', () => {
    const titles = JAPANESE_N5_LESSONS.map((lesson) => lesson.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('has zero duplicate practice prompts across all exercises', () => {
    const prompts = JAPANESE_N5_LESSONS.flatMap((lesson) =>
      lesson.steps.flatMap((step) =>
        (step.practiceData?.exercises ?? []).map((exercise) => exercise.prompt.trim()),
      ),
    );

    expect(prompts).toHaveLength(280);
    expect(new Set(prompts).size).toBe(280);
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
        expect(ex.explanation!.trim().length).toBeGreaterThanOrEqual(15);
      }
    }
  });

  it('integrates authentic N5 Mondai listening audio assets that exist on disk', () => {
    let totalAudioQuestions = 0;

    for (const lesson of JAPANESE_N5_LESSONS) {
      const listeningStep = lesson.steps[3];
      expect(listeningStep).toBeDefined();
      expect(listeningStep.type).toBe('test');

      const questions = listeningStep.testData?.questions ?? [];
      const audioQuestions = questions.filter((q) => q.audioUrl);
      expect(audioQuestions.length).toBeGreaterThan(0);

      for (const item of audioQuestions) {
        expect(item.audioUrl).toMatch(/^\/audio\/minna\/.+\.mp3$/);
        const diskPath = path.resolve('public', item.audioUrl!.replace(/^\//, ''));
        expect(fs.existsSync(diskPath)).toBe(true);
        totalAudioQuestions++;
      }
    }

    expect(totalAudioQuestions).toBe(103);
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
