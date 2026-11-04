import { describe, it, expect } from 'vitest';
import { MINNA_MONDAI_LISTENING_DATA } from '../minnaMondaiListeningData';
import { MINNA_N4_LESSONS } from '../minnaN4Lessons';
import { MINNA_N4_QUIZ_DATABASE } from '../minnaN4QuizDatabase';

describe('Minna no Nihongo 26-50 (N4) Mondai Listening Dataset', () => {
  it('contains Mondai listening sets for all 25 lessons (Lessons 26 to 50)', () => {
    for (let l = 26; l <= 50; l++) {
      const lessonMondai = MINNA_MONDAI_LISTENING_DATA[l];
      expect(lessonMondai, `Lesson ${l} missing in MINNA_MONDAI_LISTENING_DATA`).toBeDefined();
      expect(lessonMondai.lessonNumber).toBe(l);
      expect(lessonMondai.questions.length).toBeGreaterThanOrEqual(7);
    }
  });

  it('verifies legacy listening records have track references, options, answers, and explanations', () => {
    for (let l = 26; l <= 50; l++) {
      const { questions } = MINNA_MONDAI_LISTENING_DATA[l];
      questions.forEach((q, idx) => {
        expect(q.id, `Lesson ${l} question ${idx} has no id`).toBeTruthy();
        expect(q.question, `Lesson ${l} question ${idx} has no prompt`).toBeTruthy();
        expect(q.audioUrl, `Lesson ${l} question ${idx} missing audioUrl`).toBeTruthy();
        expect(q.audioUrl?.startsWith('/audio/choukai/n4/shinkanzen_chokai_n4_')).toBe(true);
        expect(q.audioUrl?.endsWith('.mp3')).toBe(true);
        expect(
          q.options.length,
          `Lesson ${l} question ${idx} has < 2 options`,
        ).toBeGreaterThanOrEqual(2);
        expect(q.correctAnswerIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswerIndex).toBeLessThan(q.options.length);
        expect(q.explanation, `Lesson ${l} question ${idx} missing explanation`).toBeTruthy();
      });
    }
  });

  it('confirms every N4 lesson has a question-specific listening script', () => {
    expect(MINNA_N4_LESSONS.length).toBe(25);
    MINNA_N4_LESSONS.forEach((lesson, index) => {
      const lessonNumber = index + 26;
      expect(lesson.steps.length).toBe(4);
      const step4 = lesson.steps[3];
      expect(step4.id).toBe(`ja-minna-l${lessonNumber}-s4`);
      expect(step4.type).toBe('test');
      expect(step4.title).toContain('Mondai Tinglash Testi');
      expect(step4.testData?.questions.length).toBeGreaterThanOrEqual(7);
      for (const question of step4.testData?.questions ?? []) {
        expect(question.audioScript).toBeTruthy();
        expect(question.audioUrl).toBeUndefined();
        expect(question.question).not.toContain(question.audioScript);
      }
    });
  });

  it('confirms MINNA_N4_QUIZ_DATABASE contains mondaiListening for all 25 lessons (26-50)', () => {
    for (let l = 26; l <= 50; l++) {
      const quizSet = MINNA_N4_QUIZ_DATABASE[l];
      expect(quizSet, `Quiz set for lesson ${l} not found`).toBeDefined();
      expect(quizSet.mondaiListening).toBeDefined();
      expect(quizSet.mondaiListening?.length).toBeGreaterThanOrEqual(7);
    }
  });
});
