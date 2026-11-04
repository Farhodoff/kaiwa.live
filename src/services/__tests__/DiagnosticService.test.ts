import { describe, it, expect, beforeEach } from 'vitest';
import {
  DiagnosticService,
  ENGLISH_DIAGNOSTIC_BANK,
  JAPANESE_DIAGNOSTIC_BANK,
} from '../DiagnosticService';

describe('DiagnosticService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. should return instant A1 foundation for zero-level English user', () => {
    const res = DiagnosticService.getZeroLevelResult('u1', 'en');
    expect(res.language).toBe('en');
    expect(res.recommendedStartLevel).toBe('A1');
    expect(res.recommendedFirstLessonId).toBe('en-a1-u1-l1');
    expect(res.overallConfidence).toBeGreaterThanOrEqual(90);
  });

  it('2. should return instant N5 foundation for zero-level Japanese user', () => {
    const res = DiagnosticService.getZeroLevelResult('u1', 'ja');
    expect(res.language).toBe('ja');
    expect(res.recommendedStartLevel).toBe('N5');
    expect(res.recommendedFirstLessonId).toBe('ja-n5-u1-l1');
  });

  it('3. should evaluate English A1 level for low score answers', () => {
    const answers = [
      { questionId: 'diag-en-a1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-a1-v1', selectedOptionIndex: 0, isCorrect: false },
      { questionId: 'diag-en-a2-g1', selectedOptionIndex: 0, isCorrect: false },
    ];
    const res = DiagnosticService.evaluateDiagnosticAnswers('u1', 'en', 'quick', 'A1', answers);
    expect(res.recommendedStartLevel).toBe('A1');
  });

  it('4. should evaluate English A2 level for ~40% accuracy', () => {
    const answers = [
      { questionId: 'diag-en-a1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-a1-v1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-a2-g1', selectedOptionIndex: 0, isCorrect: false },
      { questionId: 'diag-en-b1-g1', selectedOptionIndex: 0, isCorrect: false },
      { questionId: 'diag-en-b2-g1', selectedOptionIndex: 0, isCorrect: false },
    ];
    const res = DiagnosticService.evaluateDiagnosticAnswers('u1', 'en', 'standard', 'A2', answers);
    expect(res.recommendedStartLevel).toBe('A2');
  });

  it('5. should evaluate English B1 level for intermediate accuracy', () => {
    const answers = [
      { questionId: 'diag-en-a1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-a2-g1', selectedOptionIndex: 2, isCorrect: true },
      { questionId: 'diag-en-b1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-b2-g1', selectedOptionIndex: 0, isCorrect: false },
      { questionId: 'diag-en-c1-g1', selectedOptionIndex: 0, isCorrect: false },
    ];
    const res = DiagnosticService.evaluateDiagnosticAnswers('u1', 'en', 'standard', 'B1', answers);
    expect(res.recommendedStartLevel).toBe('B1');
  });

  it('6. should evaluate English B2 level for high accuracy (70-84%)', () => {
    const answers = [
      { questionId: 'diag-en-a1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-a2-g1', selectedOptionIndex: 2, isCorrect: true },
      { questionId: 'diag-en-b1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-b2-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-c1-g1', selectedOptionIndex: 0, isCorrect: false },
    ];
    const res = DiagnosticService.evaluateDiagnosticAnswers('u1', 'en', 'standard', 'B2', answers);
    expect(res.recommendedStartLevel).toBe('B2');
  });

  it('7. should evaluate English C1 level for exceptional accuracy (>85%)', () => {
    const answers = ENGLISH_DIAGNOSTIC_BANK.map((q) => ({
      questionId: q.id,
      selectedOptionIndex: q.correctAnswerIndex,
      isCorrect: true,
    }));
    const res = DiagnosticService.evaluateDiagnosticAnswers('u1', 'en', 'deep', 'C1', answers);
    expect(res.recommendedStartLevel).toBe('C1');
  });

  it('8. should evaluate Japanese N5 level for low score answers', () => {
    const answers = [
      { questionId: 'diag-ja-n5-k1', selectedOptionIndex: 0, isCorrect: true },
      { questionId: 'diag-ja-n5-g1', selectedOptionIndex: 0, isCorrect: false },
    ];
    const res = DiagnosticService.evaluateDiagnosticAnswers('u1', 'ja', 'quick', 'N5', answers);
    expect(res.recommendedStartLevel).toBe('N5');
  });

  it('9. should evaluate Japanese N4 level for 60% accuracy', () => {
    const answers = [
      { questionId: 'diag-ja-n5-k1', selectedOptionIndex: 0, isCorrect: true },
      { questionId: 'diag-ja-n5-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-ja-n4-g1', selectedOptionIndex: 0, isCorrect: true },
      { questionId: 'diag-ja-n3-g1', selectedOptionIndex: 1, isCorrect: false },
      { questionId: 'diag-ja-n2-g1', selectedOptionIndex: 1, isCorrect: false },
    ];
    const res = DiagnosticService.evaluateDiagnosticAnswers('u1', 'ja', 'standard', 'N4', answers);
    expect(res.recommendedStartLevel).toBe('N4');
  });

  it('10. should evaluate Japanese N3 level for >=80% accuracy', () => {
    const answers = JAPANESE_DIAGNOSTIC_BANK.map((q) => ({
      questionId: q.id,
      selectedOptionIndex: q.correctAnswerIndex,
      isCorrect: true,
    }));
    const res = DiagnosticService.evaluateDiagnosticAnswers('u1', 'ja', 'deep', 'N3', answers);
    expect(res.recommendedStartLevel).toBe('N3');
  });

  it('11. should preserve distinction between claimed level and diagnostic level', () => {
    const answers = [
      { questionId: 'diag-en-a1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-b2-g1', selectedOptionIndex: 0, isCorrect: false },
    ];
    const res = DiagnosticService.evaluateDiagnosticAnswers('u1', 'en', 'quick', 'B2', answers);

    expect(res.claimedLevel).toBe('B2');
    expect(res.diagnosticLevel).toBe('B1'); // Evaluated based on 50% score
  });

  it('12. should identify weak listening skill when score is low', () => {
    const answers = [
      { questionId: 'diag-en-b1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-b1-l1', selectedOptionIndex: 0, isCorrect: false }, // Wrong listening
    ];
    const res = DiagnosticService.evaluateDiagnosticAnswers('u1', 'en', 'quick', 'B1', answers);

    expect(res.skills.listening?.status).toBe('weak');
    expect(res.weaknesses.some((w) => w.includes('LISTENING'))).toBe(true);
  });

  it('13. should calculate confidence based on question sample size', () => {
    const shortAnswers = [{ questionId: 'diag-en-a1-g1', selectedOptionIndex: 1, isCorrect: true }];
    const res = DiagnosticService.evaluateDiagnosticAnswers(
      'u1',
      'en',
      'quick',
      'A1',
      shortAnswers,
    );

    expect(res.overallConfidence).toBeGreaterThanOrEqual(50);
    expect(res.overallConfidence).toBeLessThanOrEqual(95);
  });

  it('14. should tailor question count to selected DiagnosticMode', () => {
    const quick = DiagnosticService.getQuestionsForSession('en', 'quick');
    const standard = DiagnosticService.getQuestionsForSession('en', 'standard');
    const deep = DiagnosticService.getQuestionsForSession('en', 'deep');

    expect(quick.length).toBe(6);
    expect(standard.length).toBe(10);
    expect(deep.length).toBeGreaterThanOrEqual(10);
  });

  it('15. should save and resume diagnostic session accurately', () => {
    const session = {
      userId: 'u_resume',
      language: 'en' as const,
      mode: 'standard' as const,
      claimedLevel: 'B2',
      currentQuestionIndex: 3,
      totalQuestions: 10,
      answeredQuestions: [
        {
          questionId: 'diag-en-a1-g1',
          selectedOptionIndex: 1,
          isCorrect: true,
          timeSpentSeconds: 5,
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    DiagnosticService.saveSession(session);
    const retrieved = DiagnosticService.getSavedSession('u_resume', 'en');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.currentQuestionIndex).toBe(3);
  });

  it('16. should clear diagnostic session upon completion', () => {
    DiagnosticService.saveSession({
      userId: 'u_clear',
      language: 'en',
      mode: 'quick',
      claimedLevel: 'A1',
      currentQuestionIndex: 1,
      totalQuestions: 5,
      answeredQuestions: [],
      lastUpdated: '',
    });

    DiagnosticService.clearSession('u_clear', 'en');
    expect(DiagnosticService.getSavedSession('u_clear', 'en')).toBeNull();
  });

  it('17. should guarantee Japanese diagnostic questions contain zero English items', () => {
    const jaQuestions = DiagnosticService.getQuestionsForSession('ja', 'deep');
    for (const q of jaQuestions) {
      expect(q.language).toBe('ja');
    }
  });

  it('18. should guarantee English diagnostic questions contain zero Japanese items', () => {
    const enQuestions = DiagnosticService.getQuestionsForSession('en', 'deep');
    for (const q of enQuestions) {
      expect(q.language).toBe('en');
    }
  });

  it('19. should persist and retrieve latest diagnostic result', () => {
    const result = DiagnosticService.getZeroLevelResult('u_res_persist', 'en');
    expect(result.recommendedStartLevel).toBe('A1');
    const retrieved = DiagnosticService.getLatestDiagnosticResult('u_res_persist', 'en');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.recommendedStartLevel).toBe('A1');
  });

  it('20. should provide valid recommendedFirstLessonId on all outcomes', () => {
    const resEn = DiagnosticService.getZeroLevelResult('u1', 'en');
    const resJa = DiagnosticService.getZeroLevelResult('u1', 'ja');

    expect(resEn.recommendedFirstLessonId).toBe('en-a1-u1-l1');
    expect(resJa.recommendedFirstLessonId).toBe('ja-n5-u1-l1');
  });
});
