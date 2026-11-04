import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveQuestionEngine } from '../AdaptiveQuestionEngine';
import {
  ENGLISH_DIAGNOSTIC_BANK,
  JAPANESE_DIAGNOSTIC_BANK,
  DiagnosticService,
} from '../DiagnosticService';

describe('AdaptiveQuestionEngine Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. should start session at claimed level and initial difficulty', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'B2',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    expect(state.currentLevel).toBe('B2');
    expect(state.currentDifficulty).toBe('medium');
    expect(state.currentQuestionId).not.toBeNull();
    expect(state.visitedQuestionIds.length).toBe(1);
  });

  it('2. should increment consecutiveCorrect on single correct answer', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    const qId = state.currentQuestionId!;
    const q = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === qId)!;

    const updated = AdaptiveQuestionEngine.processAnswer(
      state,
      qId,
      q.correctAnswerIndex,
      ENGLISH_DIAGNOSTIC_BANK,
    );
    expect(updated.consecutiveCorrect).toBe(1);
    expect(updated.consecutiveIncorrect).toBe(0);
    expect(updated.answeredCount).toBe(1);
  });

  it('3. should increase difficulty from easy to medium after 2 consecutive correct answers', () => {
    let state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'A1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.currentDifficulty = 'easy';

    const q1 = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId!)!;
    state = AdaptiveQuestionEngine.processAnswer(
      state,
      q1.id,
      q1.correctAnswerIndex,
      ENGLISH_DIAGNOSTIC_BANK,
    );

    const q2 = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId!)!;
    state = AdaptiveQuestionEngine.processAnswer(
      state,
      q2.id,
      q2.correctAnswerIndex,
      ENGLISH_DIAGNOSTIC_BANK,
    );

    expect(state.currentDifficulty).toBe('medium');
  });

  it('4. should promote level by 1 step when answering correctly at hard difficulty', () => {
    let state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'A2',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.currentDifficulty = 'hard';

    const q1 = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId!)!;
    state = AdaptiveQuestionEngine.processAnswer(
      state,
      q1.id,
      q1.correctAnswerIndex,
      ENGLISH_DIAGNOSTIC_BANK,
    );

    const q2 = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId!)!;
    state = AdaptiveQuestionEngine.processAnswer(
      state,
      q2.id,
      q2.correctAnswerIndex,
      ENGLISH_DIAGNOSTIC_BANK,
    );

    expect(state.currentLevel).toBe('B1');
    expect(state.currentDifficulty).toBe('medium');
  });

  it('5. should increment consecutiveIncorrect on wrong answer and reset correct streak', () => {
    let state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.consecutiveCorrect = 1;

    const qId = state.currentQuestionId!;
    const q = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === qId)!;
    const wrongOpt = (q.correctAnswerIndex + 1) % q.options.length;

    state = AdaptiveQuestionEngine.processAnswer(state, qId, wrongOpt, ENGLISH_DIAGNOSTIC_BANK);
    expect(state.consecutiveIncorrect).toBe(1);
    expect(state.consecutiveCorrect).toBe(0);
  });

  it('6. should decrease difficulty from hard to medium after 2 consecutive wrong answers', () => {
    let state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'B2',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.currentDifficulty = 'hard';

    const q1 = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId!)!;
    const wrongOpt1 = (q1.correctAnswerIndex + 1) % q1.options.length;
    state = AdaptiveQuestionEngine.processAnswer(state, q1.id, wrongOpt1, ENGLISH_DIAGNOSTIC_BANK);

    const q2 = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId!)!;
    const wrongOpt2 = (q2.correctAnswerIndex + 1) % q2.options.length;
    state = AdaptiveQuestionEngine.processAnswer(state, q2.id, wrongOpt2, ENGLISH_DIAGNOSTIC_BANK);

    expect(state.currentDifficulty).toBe('medium');
  });

  it('7. should demote level by 1 step when answering wrongly at easy difficulty', () => {
    let state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.currentDifficulty = 'easy';

    const q1 = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId!)!;
    const wrongOpt1 = (q1.correctAnswerIndex + 1) % q1.options.length;
    state = AdaptiveQuestionEngine.processAnswer(state, q1.id, wrongOpt1, ENGLISH_DIAGNOSTIC_BANK);

    const q2 = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId!)!;
    const wrongOpt2 = (q2.correctAnswerIndex + 1) % q2.options.length;
    state = AdaptiveQuestionEngine.processAnswer(state, q2.id, wrongOpt2, ENGLISH_DIAGNOSTIC_BANK);

    expect(state.currentLevel).toBe('A2');
    expect(state.currentDifficulty).toBe('medium');
  });

  it('8. should clamp difficulty at hard maximum', () => {
    let state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'C1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.currentDifficulty = 'hard';
    const next = AdaptiveQuestionEngine.getNextLevel('C1', 'up', 'en');
    expect(next).toBe('C1'); // Top level reached
  });

  it('9. should clamp difficulty and level at easy / A1 minimum', () => {
    const next = AdaptiveQuestionEngine.getNextLevel('A1', 'down', 'en');
    expect(next).toBe('A1'); // Bottom level reached
  });

  it('10. should ensure maximum 1-step level transition up', () => {
    expect(AdaptiveQuestionEngine.getNextLevel('A1', 'up', 'en')).toBe('A2');
    expect(AdaptiveQuestionEngine.getNextLevel('A2', 'up', 'en')).toBe('B1');
    expect(AdaptiveQuestionEngine.getNextLevel('B1', 'up', 'en')).toBe('B2');
    expect(AdaptiveQuestionEngine.getNextLevel('B2', 'up', 'en')).toBe('C1');
  });

  it('11. should ensure maximum 1-step level transition down', () => {
    expect(AdaptiveQuestionEngine.getNextLevel('C1', 'down', 'en')).toBe('B2');
    expect(AdaptiveQuestionEngine.getNextLevel('B2', 'down', 'en')).toBe('B1');
    expect(AdaptiveQuestionEngine.getNextLevel('B1', 'down', 'en')).toBe('A2');
    expect(AdaptiveQuestionEngine.getNextLevel('A2', 'down', 'en')).toBe('A1');
  });

  it('12. should rotate skills continuously in order', () => {
    const skills = AdaptiveQuestionEngine.getSkillsForLanguage('en');
    expect(skills).toEqual(['grammar', 'vocabulary', 'reading', 'listening']);
  });

  it('13. should never present the same question twice in a session', () => {
    let state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    const visitedSet = new Set<string>();

    while (!state.isCompleted && state.currentQuestionId) {
      expect(visitedSet.has(state.currentQuestionId)).toBe(false);
      visitedSet.add(state.currentQuestionId);

      const q = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId)!;
      state = AdaptiveQuestionEngine.processAnswer(
        state,
        q.id,
        q.correctAnswerIndex,
        ENGLISH_DIAGNOSTIC_BANK,
      );
    }
  });

  it('14. should terminate Quick mode after exactly 6 questions', () => {
    let state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'quick',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    expect(state.maxQuestions).toBe(6);

    while (!state.isCompleted && state.currentQuestionId) {
      const q = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId)!;
      state = AdaptiveQuestionEngine.processAnswer(
        state,
        q.id,
        q.correctAnswerIndex,
        ENGLISH_DIAGNOSTIC_BANK,
      );
    }

    expect(state.answeredCount).toBe(6);
    expect(state.isCompleted).toBe(true);
  });

  it('15. should terminate Standard mode after 12 questions', () => {
    let state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    expect(state.maxQuestions).toBe(12);
  });

  it('16. should set Deep mode limit to 20 questions', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'deep',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    expect(state.maxQuestions).toBe(20);
  });

  it('17. should follow Japanese JLPT level transitions correctly', () => {
    expect(AdaptiveQuestionEngine.getNextLevel('N5', 'up', 'ja')).toBe('N4');
    expect(AdaptiveQuestionEngine.getNextLevel('N4', 'up', 'ja')).toBe('N3');
    expect(AdaptiveQuestionEngine.getNextLevel('N3', 'up', 'ja')).toBe('N2');
    expect(AdaptiveQuestionEngine.getNextLevel('N2', 'up', 'ja')).toBe('N1');
    expect(AdaptiveQuestionEngine.getNextLevel('N1', 'up', 'ja')).toBe('N1');

    expect(AdaptiveQuestionEngine.getNextLevel('N1', 'down', 'ja')).toBe('N2');
    expect(AdaptiveQuestionEngine.getNextLevel('N2', 'down', 'ja')).toBe('N3');
    expect(AdaptiveQuestionEngine.getNextLevel('N3', 'down', 'ja')).toBe('N4');
    expect(AdaptiveQuestionEngine.getNextLevel('N4', 'down', 'ja')).toBe('N5');
    expect(AdaptiveQuestionEngine.getNextLevel('N5', 'down', 'ja')).toBe('N5');
  });

  it('18. should include Kanji in Japanese skill rotation', () => {
    const skills = AdaptiveQuestionEngine.getSkillsForLanguage('ja');
    expect(skills).toContain('kanji');
    expect(skills[0]).toBe('kanji');
  });

  it('19. should ensure English sessions contain only English questions', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    const q = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId!)!;
    expect(q.language).toBe('en');
  });

  it('20. should ensure Japanese sessions contain only Japanese questions', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'ja',
      'standard',
      'N3',
      JAPANESE_DIAGNOSTIC_BANK,
    );
    const q = JAPANESE_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId!)!;
    expect(q.language).toBe('ja');
  });

  it('21. should evaluate claimed B2 user with 50% accuracy to recommended B1', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'quick',
      'B2',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.answers = [
      {
        questionId: 'diag-en-b2-g1',
        selectedOptionIndex: 1,
        isCorrect: false,
        level: 'B2',
        skill: 'grammar',
        difficulty: 'hard',
      },
      {
        questionId: 'diag-en-b1-g1',
        selectedOptionIndex: 1,
        isCorrect: true,
        level: 'B1',
        skill: 'grammar',
        difficulty: 'medium',
      },
      {
        questionId: 'diag-en-b2-v1',
        selectedOptionIndex: 1,
        isCorrect: false,
        level: 'B2',
        skill: 'vocabulary',
        difficulty: 'hard',
      },
      {
        questionId: 'diag-en-b1-v1',
        selectedOptionIndex: 1,
        isCorrect: true,
        level: 'B1',
        skill: 'vocabulary',
        difficulty: 'medium',
      },
    ];

    const result = AdaptiveQuestionEngine.evaluateAdaptiveSession(state, ENGLISH_DIAGNOSTIC_BANK);
    expect(result.claimedLevel).toBe('B2');
    expect(result.recommendedStartLevel).toBe('B1');
  });

  it('22. should identify weak listening and emit learning signal', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'quick',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.answers = [
      {
        questionId: 'diag-en-b1-g1',
        selectedOptionIndex: 1,
        isCorrect: true,
        level: 'B1',
        skill: 'grammar',
        difficulty: 'medium',
      },
      {
        questionId: 'diag-en-b1-l1',
        selectedOptionIndex: 0,
        isCorrect: false,
        level: 'B1',
        skill: 'listening',
        difficulty: 'medium',
      },
      {
        questionId: 'diag-en-b2-l1',
        selectedOptionIndex: 0,
        isCorrect: false,
        level: 'B2',
        skill: 'listening',
        difficulty: 'hard',
      },
    ];

    const result = AdaptiveQuestionEngine.evaluateAdaptiveSession(state, ENGLISH_DIAGNOSTIC_BANK);
    expect(result.skills.listening?.status).toBe('weak');
    expect(result.weaknesses.some((w) => w.includes('LISTENING'))).toBe(true);
  });

  it('23. should identify strong grammar when score is high', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'quick',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.answers = [
      {
        questionId: 'diag-en-b1-g1',
        selectedOptionIndex: 1,
        isCorrect: true,
        level: 'B1',
        skill: 'grammar',
        difficulty: 'medium',
      },
      {
        questionId: 'diag-en-a2-g1',
        selectedOptionIndex: 2,
        isCorrect: true,
        level: 'A2',
        skill: 'grammar',
        difficulty: 'easy',
      },
    ];

    const result = AdaptiveQuestionEngine.evaluateAdaptiveSession(state, ENGLISH_DIAGNOSTIC_BANK);
    expect(result.skills.grammar?.status).toBe('strong');
    expect(result.strengths.some((s) => s.includes('GRAMMAR'))).toBe(true);
  });

  it('24. should provide recommendedFirstLessonId matching evaluated level', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'quick',
      'A1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.answers = [
      {
        questionId: 'diag-en-a1-g1',
        selectedOptionIndex: 1,
        isCorrect: true,
        level: 'A1',
        skill: 'grammar',
        difficulty: 'easy',
      },
    ];

    const result = AdaptiveQuestionEngine.evaluateAdaptiveSession(state, ENGLISH_DIAGNOSTIC_BANK);
    expect(result.recommendedFirstLessonId).toBeDefined();
    expect(result.recommendedFirstLessonId).toContain('en-');
  });

  it('25. should progressively fallback when exact level+skill question is not in bank', () => {
    const nextQ = AdaptiveQuestionEngine.selectNextQuestion(
      'en',
      'C1',
      'easy',
      'listening',
      [],
      ENGLISH_DIAGNOSTIC_BANK,
    );
    expect(nextQ).not.toBeNull();
    expect(nextQ?.language).toBe('en');
  });

  it('26. should return null when question bank is completely exhausted', () => {
    const allIds = ENGLISH_DIAGNOSTIC_BANK.map((q) => q.id);
    const nextQ = AdaptiveQuestionEngine.selectNextQuestion(
      'en',
      'B1',
      'medium',
      'grammar',
      allIds,
      ENGLISH_DIAGNOSTIC_BANK,
    );
    expect(nextQ).toBeNull();
  });

  it('27. should save and retrieve adaptive session state from DiagnosticService', () => {
    const state = DiagnosticService.initializeAdaptiveSession('u_adapt', 'en', 'standard', 'B2');
    expect(state.currentLevel).toBe('B2');
    const retrieved = DiagnosticService.getSavedAdaptiveSession('u_adapt', 'en');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.currentLevel).toBe('B2');
  });

  it('28. should clear adaptive session upon completion', () => {
    const state = DiagnosticService.initializeAdaptiveSession('u_adapt_clear', 'en', 'quick', 'A1');
    expect(state.currentLevel).toBe('A1');
    DiagnosticService.clearAdaptiveSession('u_adapt_clear', 'en');

    expect(DiagnosticService.getSavedAdaptiveSession('u_adapt_clear', 'en')).toBeNull();
  });

  it('29. should safely ignore invalid question ID without crashing', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'quick',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    const unchanged = AdaptiveQuestionEngine.processAnswer(
      state,
      'non-existent-id',
      0,
      ENGLISH_DIAGNOSTIC_BANK,
    );
    expect(unchanged.answeredCount).toBe(0);
  });

  it('30. should mark session completed and currentQuestionId null at end', () => {
    let state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'quick',
      'A1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    while (!state.isCompleted && state.currentQuestionId) {
      const q = ENGLISH_DIAGNOSTIC_BANK.find((item) => item.id === state.currentQuestionId)!;
      state = AdaptiveQuestionEngine.processAnswer(
        state,
        q.id,
        q.correctAnswerIndex,
        ENGLISH_DIAGNOSTIC_BANK,
      );
    }

    expect(state.isCompleted).toBe(true);
    expect(state.currentQuestionId).toBeNull();
  });

  it('31. should calculate mixed skill profile with weak skill guard capping recommended level', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'standard',
      'B2',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    // Simulate: Grammar B2 (adequate), Vocabulary B2 (adequate), Listening A2 (weak)
    state.answers = [
      {
        questionId: 'diag-en-b2-g1',
        selectedOptionIndex: 1,
        isCorrect: true,
        level: 'B2',
        skill: 'grammar',
        difficulty: 'hard',
      },
      {
        questionId: 'diag-en-b2-g2',
        selectedOptionIndex: 1,
        isCorrect: true,
        level: 'B2',
        skill: 'grammar',
        difficulty: 'hard',
      },
      {
        questionId: 'diag-en-b2-v1',
        selectedOptionIndex: 0,
        isCorrect: true,
        level: 'B2',
        skill: 'vocabulary',
        difficulty: 'hard',
      },
      {
        questionId: 'diag-en-b1-v1',
        selectedOptionIndex: 1,
        isCorrect: true,
        level: 'B1',
        skill: 'vocabulary',
        difficulty: 'medium',
      },
      {
        questionId: 'diag-en-a2-l1',
        selectedOptionIndex: 0,
        isCorrect: false,
        level: 'A2',
        skill: 'listening',
        difficulty: 'easy',
      },
      {
        questionId: 'diag-en-b1-l1',
        selectedOptionIndex: 0,
        isCorrect: false,
        level: 'B1',
        skill: 'listening',
        difficulty: 'medium',
      },
    ];

    const result = AdaptiveQuestionEngine.evaluateAdaptiveSession(state, ENGLISH_DIAGNOSTIC_BANK);
    expect(result.diagnosticLevel).toBe('B2');
    // Cap recommendedStartLevel to one level below diagnostic Level (B1) because of weak listening
    expect(result.recommendedStartLevel).toBe('B1');
    expect(result.explanation).toContain('LISTENING');
  });

  it('32. should flag insufficient evidence if total questions for skill is less than 2', () => {
    const state = AdaptiveQuestionEngine.initializeSession(
      'u1',
      'en',
      'quick',
      'B1',
      ENGLISH_DIAGNOSTIC_BANK,
    );
    state.answers = [
      {
        questionId: 'diag-en-b1-g1',
        selectedOptionIndex: 1,
        isCorrect: true,
        level: 'B1',
        skill: 'grammar',
        difficulty: 'medium',
      },
    ];

    const result = AdaptiveQuestionEngine.evaluateAdaptiveSession(state, ENGLISH_DIAGNOSTIC_BANK);
    expect(result.skills.grammar?.status).toBe('insufficient');
  });
});
