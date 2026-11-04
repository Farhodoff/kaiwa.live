import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearningSignalService } from '../LearningSignalService';
import { MasteryEngine } from '../MasteryEngine';
import { WeaknessEngine } from '../WeaknessEngine';
import { LearningPathEngine } from '../LearningPathEngine';
import { LearningOrchestrator } from '../LearningOrchestrator';
import { DiagnosticService } from '../DiagnosticService';
import { LessonService } from '../LessonService';
import {
  FlashcardService,
  getLocalFlashcardCache,
  setLocalFlashcardCache,
} from '../FlashcardService';
import { Lesson } from '../../types/lesson';
import { Flashcard } from '../../types';

// Mock Supabase to prevent unhandled background rejections / teardown console logs
vi.mock('../../lib/supabase', () => {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: '00000000-0000-4000-8000-000000000001' } },
          error: null,
        }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
      from: vi.fn(() => chainable),
    },
  };
});

describe('Phase 8.11 — Real-Time Closed Loop Learning', () => {
  const testUserId = '00000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(FlashcardService, 'addFlashcardsBatch').mockImplementation(async (userId, cards) => {
      const current = getLocalFlashcardCache(userId);
      const created: Flashcard[] = cards.map((c) => ({
        id: c.id || `card_${Math.random().toString(36).substring(2, 9)}`,
        subjectId: c.subjectId || 'default-subject',
        front: c.front || '',
        back: c.back || '',
        nextReviewDate: c.nextReviewDate || new Date().toISOString(),
        interval: c.interval ?? 1,
        easeFactor: c.easeFactor ?? 2.5,
        repetitions: c.repetitions ?? 0,
        ...(c.deletedAt ? { deletedAt: c.deletedAt } : {}),
      }));
      setLocalFlashcardCache(userId, [...current, ...created]);
      return created;
    });
    vi.spyOn(FlashcardService, 'fetchFlashcards').mockImplementation(async (userId) => {
      return getLocalFlashcardCache(userId);
    });
  });

  const mockLessonJa: Lesson = {
    id: 'ja-n5-u1-l1',
    courseId: 'jlpt-n5',
    unitId: 'unit-1',
    unitTitle: 'Greetings & Basics',
    lessonNumber: 1,
    title: 'Hiragana & Basic Greetings',
    description: 'Basic hiragana and expressions',
    language: 'ja',
    level: 'N5',
    estimatedDurationMinutes: 15,
    steps: [
      {
        id: 'step-1',
        type: 'learn',
        title: 'Greetings Vocab',
        estimatedMinutes: 5,
        learnData: {
          title: 'Greetings & Basic Phrases',
          explanation: 'Learn essential Japanese greetings.',
          vocabulary: [
            { term: 'こんにちは', reading: 'konnichiwa', meaning: 'Hello / Good afternoon' },
            { term: 'ありがとう', reading: 'arigatou', meaning: 'Thank you' },
          ],
          grammarRules: [
            {
              pattern: '〜は〜です',
              meaning: 'A is B (polite topic marker)',
              examples: [{ sentence: '私は学生です。', translation: 'Men talabaman.' }],
            },
          ],
        },
      },
    ],
  };

  const mockLessonEn: Lesson = {
    id: 'en-a1-u1-l1',
    courseId: 'cefr-a1',
    unitId: 'unit-1',
    unitTitle: 'Welcome & Introductions',
    lessonNumber: 1,
    title: 'Present Simple To Be',
    description: 'Learn Present Simple with To Be',
    language: 'en',
    level: 'A1',
    estimatedDurationMinutes: 15,
    steps: [
      {
        id: 'step-1',
        type: 'learn',
        title: 'Grammar & Vocab',
        estimatedMinutes: 5,
        learnData: {
          title: 'Present Simple Basics',
          explanation: 'Learn basic sentences with To Be.',
          vocabulary: [
            { term: 'Doctor', meaning: 'Shifokor' },
            { term: 'Teacher', meaning: "O'qituvchi" },
          ],
          grammarRules: [
            {
              pattern: 'Subject + To Be + Noun',
              meaning: 'Basic statement',
              examples: [{ sentence: 'I am a teacher.', translation: "Men o'qituvchiman." }],
            },
          ],
        },
      },
    ],
  };

  // 1. Lesson → signal
  it('1. Lesson completion generates structured learning signals', async () => {
    const res = await LearningSignalService.processLessonCompletion(
      testUserId,
      mockLessonJa,
      { score: 10, total: 10, percentage: 100 },
      [],
    );

    expect(res.newCardsCount).toBeGreaterThanOrEqual(2);
    expect(res.mistakesCount).toBe(0);

    const signals = LearningSignalService.getSignalsForUser(testUserId);
    expect(signals.length).toBeGreaterThanOrEqual(3); // vocab + grammar + completion

    const completedSig = signals.find((s) => s.type === 'completed_lesson');
    expect(completedSig).toBeDefined();
    expect(completedSig?.language).toBe('ja');
    expect(completedSig?.lessonId).toBe('ja-n5-u1-l1');
  });

  // 2. Lesson → mastery
  it('2. Lesson completion directly feeds mastery evidence into MasteryEngine', async () => {
    await LearningSignalService.processLessonCompletion(
      testUserId,
      mockLessonEn,
      { score: 9, total: 10, percentage: 90 },
      [],
    );

    const evidence = MasteryEngine.getUserEvidence(testUserId, 'en');
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence.some((e) => e.skill === 'grammar' && e.score === 90)).toBe(true);

    const profile = MasteryEngine.calculateMasteryProfile(testUserId, 'en');
    expect(profile.skills.grammar.score).toBeGreaterThanOrEqual(80);
  });

  // 3. Lesson → next action
  it('3. Completing a lesson advances curriculum state and updates NextBestAction', async () => {
    // Complete lesson 1
    await LessonService.completeLesson(testUserId, 'en-a1-u1-l1', {
      score: 10,
      total: 10,
      percentage: 100,
    });
    await LearningSignalService.processLessonCompletion(
      testUserId,
      mockLessonEn,
      { score: 10, total: 10, percentage: 100 },
      [],
    );

    const nextAction = await LearningPathEngine.getNextBestAction(testUserId, {
      forceLanguage: 'en',
    });
    expect(nextAction).toBeDefined();
    // Since lesson 1 is complete, nextAction should suggest next curriculum lesson or practice
    expect(nextAction.type).not.toBe('continue_lesson');
  });

  // 4. Quiz correct → mastery
  it('4. Correct quiz answer records positive evidence (100%) and boosts mastery', async () => {
    await LearningSignalService.recordQuizAnswer(testUserId, 'en', {
      id: 'quiz-correct-1',
      questionId: 'q-verb-1',
      prompt: 'Choose correct past tense of go',
      isCorrect: true,
      userAnswer: 'went',
      expectedAnswer: 'went',
      skill: 'grammar',
    });

    const evidence = MasteryEngine.getUserEvidence(testUserId, 'en');
    const record = evidence.find((e) => e.id === 'ev_quiz_quiz-correct-1');
    expect(record).toBeDefined();
    expect(record?.score).toBe(100);
    expect(record?.skill).toBe('grammar');
  });

  // 5. Quiz incorrect → weakness
  it('5. Incorrect quiz answer records mistake signal (0%) and registers potential weakness', async () => {
    // Initial state with low score
    await LearningSignalService.recordQuizAnswer(testUserId, 'en', {
      id: 'quiz-mistake-1',
      questionId: 'q-inversion-1',
      prompt: 'Inversion structures',
      isCorrect: false,
      userAnswer: 'wrong',
      expectedAnswer: 'correct',
      skill: 'grammar',
    });

    const signals = LearningSignalService.getSignalsForUser(testUserId);
    const incorrectSig = signals.find(
      (s) => s.type === 'incorrect_answer' && s.questionId === 'q-inversion-1',
    );
    expect(incorrectSig).toBeDefined();

    const profile = WeaknessEngine.getUserMasteryProfile(testUserId, 'en');
    expect(profile.skills.grammar.score).toBeLessThan(60);
    expect(profile.topWeaknesses.some((w) => w.skill === 'grammar')).toBe(true);
  });

  // 6. Repeated mistakes → remediation
  it('6. Multiple repeated mistakes trigger remediation priority in NextBestAction', async () => {
    for (let i = 1; i <= 3; i++) {
      await LearningSignalService.recordQuizAnswer(testUserId, 'en', {
        id: `quiz-repeated-${i}`,
        questionId: 'q-inversion-1',
        prompt: 'Grammar: Inversion rule after Seldom',
        isCorrect: false,
        userAnswer: 'Seldom I have',
        expectedAnswer: 'Seldom have I',
        skill: 'grammar',
      });
    }

    const path = await LearningPathEngine.getLearningPathState(testUserId, { forceLanguage: 'en' });
    expect(path.signalsSummary?.recentMistakesCount).toBeGreaterThanOrEqual(2);
    expect(path.nextAction.reason.code).toMatch(/RECENT_MISTAKES|WEAK_SKILL/);
  });

  // 7. SRS Again → mastery/weakness
  it('7. SRS "Again" rating records 0% mastery and triggers mistake signal', async () => {
    MasteryEngine.recordEvidence(testUserId, 'ja', {
      id: 'srs-again-1',
      skill: 'vocabulary',
      score: 0,
      timestamp: new Date().toISOString(),
      details: 'Flashcard review: 猫',
    });

    await LearningSignalService.recordSignal({
      id: 'sig-srs-again-1',
      type: 'incorrect_answer',
      language: 'ja',
      lessonId: 'srs_review',
      userId: testUserId,
      timestamp: new Date().toISOString(),
      stepId: 'srs',
      questionId: 'card-123',
      prompt: '猫 (Neko)',
      userAnswer: 'again',
      expectedAnswer: 'Cat',
      attemptCount: 1,
      skill: 'vocabulary',
    });

    const profile = WeaknessEngine.getUserMasteryProfile(testUserId, 'ja');
    expect(profile.skills.vocabulary.score).toBeLessThan(50);
    expect(profile.topWeaknesses.some((w) => w.skill === 'vocabulary')).toBe(true);
  });

  // 8. SRS Good → mastery
  it('8. SRS "Good" rating records 80% mastery evidence and updates retention', () => {
    MasteryEngine.recordEvidence(testUserId, 'ja', {
      id: 'srs-good-1',
      skill: 'vocabulary',
      score: 80,
      timestamp: new Date().toISOString(),
      details: 'Flashcard review: 犬',
    });

    const profile = MasteryEngine.calculateMasteryProfile(testUserId, 'ja');
    expect(profile.skills.vocabulary.score).toBeGreaterThanOrEqual(70);
  });

  // 9. Kanji SRS → kanji mastery
  it('9. Kanji flashcard review isolates evidence into the Kanji mastery skill', () => {
    MasteryEngine.recordEvidence(testUserId, 'ja', {
      id: 'srs-kanji-1',
      skill: 'kanji',
      score: 100,
      timestamp: new Date().toISOString(),
      details: 'Flashcard review: 日 (Nichi/Hi)',
    });

    const profile = MasteryEngine.calculateMasteryProfile(testUserId, 'ja');
    expect(profile.skills.kanji.score).toBe(100);
    expect(profile.skills.kanji.evidenceCount).toBe(1);
    expect(profile.skills.vocabulary.evidenceCount).toBe(0);
  });

  // 10. Vocabulary SRS → vocabulary mastery
  it('10. Vocabulary flashcard review isolates evidence into the Vocabulary mastery skill', () => {
    MasteryEngine.recordEvidence(testUserId, 'en', {
      id: 'srs-vocab-1',
      skill: 'vocabulary',
      score: 100,
      timestamp: new Date().toISOString(),
      details: 'Flashcard review: Accomplish',
    });

    const profile = MasteryEngine.calculateMasteryProfile(testUserId, 'en');
    expect(profile.skills.vocabulary.score).toBe(100);
    expect(profile.skills.grammar.evidenceCount).toBe(0);
  });

  // 11. English isolation
  it('11. English learning activities strictly do not leak into Japanese state', async () => {
    await LearningSignalService.recordQuizAnswer(testUserId, 'en', {
      id: 'en-mistake-iso',
      questionId: 'q-en-1',
      prompt: 'English Grammar Preposition',
      isCorrect: false,
      userAnswer: 'in',
      expectedAnswer: 'at',
      skill: 'grammar',
    });

    const enSignals = LearningOrchestrator.getLearningSignalsSummary(testUserId, 'en');
    const jaSignals = LearningOrchestrator.getLearningSignalsSummary(testUserId, 'ja');

    expect(enSignals.recentMistakesCount).toBe(1);
    expect(jaSignals.recentMistakesCount).toBe(0);

    const jaProfile = MasteryEngine.calculateMasteryProfile(testUserId, 'ja');
    expect(jaProfile.skills.grammar.evidenceCount).toBe(0);
  });

  // 12. Japanese isolation
  it('12. Japanese learning activities strictly do not leak into English state', async () => {
    await LearningSignalService.recordQuizAnswer(testUserId, 'ja', {
      id: 'ja-mistake-iso',
      questionId: 'q-ja-1',
      prompt: 'Japanese particle wa vs ga',
      isCorrect: false,
      userAnswer: 'ga',
      expectedAnswer: 'wa',
      skill: 'grammar',
    });

    const enSignals = LearningOrchestrator.getLearningSignalsSummary(testUserId, 'en');
    const jaSignals = LearningOrchestrator.getLearningSignalsSummary(testUserId, 'ja');

    expect(jaSignals.recentMistakesCount).toBe(1);
    expect(enSignals.recentMistakesCount).toBe(0);

    const enProfile = MasteryEngine.calculateMasteryProfile(testUserId, 'en');
    expect(enProfile.skills.grammar.evidenceCount).toBe(0);
  });

  // 13. Diagnostic → progression
  it('13. Completed diagnostic establishes baseline, records evidence, and unblocks progression', async () => {
    DiagnosticService.saveDiagnosticResult({
      id: 'diag-test-1',
      userId: testUserId,
      language: 'en',
      mode: 'standard',
      claimedLevel: 'B1',
      diagnosticLevel: 'B2',
      recommendedStartLevel: 'B2',
      overallConfidence: 85,
      overallScore: 80,
      skills: {
        vocabulary: {
          skill: 'vocabulary',
          score: 85,
          confidence: 80,
          estimatedLevel: 'B2',
          totalQuestions: 4,
          correctCount: 3,
          status: 'strong',
          levelEvidence: [],
          reason: '',
        },
        grammar: {
          skill: 'grammar',
          score: 80,
          confidence: 80,
          estimatedLevel: 'B2',
          totalQuestions: 4,
          correctCount: 3,
          status: 'strong',
          levelEvidence: [],
          reason: '',
        },
        reading: {
          skill: 'reading',
          score: 75,
          confidence: 80,
          estimatedLevel: 'B2',
          totalQuestions: 4,
          correctCount: 3,
          status: 'strong',
          levelEvidence: [],
          reason: '',
        },
        listening: {
          skill: 'listening',
          score: 80,
          confidence: 80,
          estimatedLevel: 'B2',
          totalQuestions: 4,
          correctCount: 3,
          status: 'strong',
          levelEvidence: [],
          reason: '',
        },
      },
      strengths: ['VOCABULARY (85%)'],
      weaknesses: [],
      recommendedFirstLessonId: 'en-b2-u1-l1',
      completedAt: new Date().toISOString(),
    });

    const evidence = MasteryEngine.getUserEvidence(testUserId, 'en');
    expect(evidence.length).toBe(4);
    expect(evidence.some((e) => e.skill === 'vocabulary' && e.score === 85)).toBe(true);

    const progression = await LearningPathEngine.getProgressionState(testUserId, {
      forceLanguage: 'en',
    });
    expect(progression.missingEvidence).not.toContain('Diagnostic Baseline');
  });

  // 14. Diagnostic language isolation
  it('14. Japanese diagnostic does not satisfy English diagnostic requirement', async () => {
    DiagnosticService.saveDiagnosticResult({
      id: 'diag-ja-iso-1',
      userId: testUserId,
      language: 'ja',
      mode: 'standard',
      claimedLevel: 'N4',
      diagnosticLevel: 'N4',
      recommendedStartLevel: 'N4',
      overallConfidence: 80,
      overallScore: 75,
      skills: {
        vocabulary: {
          skill: 'vocabulary',
          score: 80,
          confidence: 80,
          estimatedLevel: 'N4',
          totalQuestions: 4,
          correctCount: 3,
          status: 'strong',
          levelEvidence: [],
          reason: '',
        },
      },
      strengths: [],
      weaknesses: [],
      recommendedFirstLessonId: 'ja-n4-u1-l1',
      completedAt: new Date().toISOString(),
    });

    // Check English progression: English diagnostic should still be missing
    const enProgression = await LearningPathEngine.getProgressionState(testUserId, {
      forceLanguage: 'en',
    });
    expect(enProgression.missingEvidence).toContain('Diagnostic Baseline');

    // Check Japanese progression: Japanese diagnostic baseline is present
    const jaProgression = await LearningPathEngine.getProgressionState(testUserId, {
      forceLanguage: 'ja',
    });
    expect(jaProgression.missingEvidence).not.toContain('Diagnostic Baseline');
  });

  // 15. Mastery improvement → weakness reduction
  it('15. Improvement in skill mastery dynamically reduces and clears weakness', () => {
    // Step 1: Record initial poor score
    MasteryEngine.recordEvidence(testUserId, 'en', {
      id: 'ev-poor-1',
      skill: 'grammar',
      score: 40,
      timestamp: new Date().toISOString(),
    });

    let profile = WeaknessEngine.getUserMasteryProfile(testUserId, 'en');
    expect(profile.topWeaknesses.some((w) => w.skill === 'grammar')).toBe(true);

    // Step 2: Practice and achieve multiple strong scores
    for (let i = 2; i <= 6; i++) {
      MasteryEngine.recordEvidence(testUserId, 'en', {
        id: `ev-strong-${i}`,
        skill: 'grammar',
        score: 95,
        timestamp: new Date().toISOString(),
      });
    }

    profile = WeaknessEngine.getUserMasteryProfile(testUserId, 'en');
    expect(profile.skills.grammar.score).toBeGreaterThanOrEqual(80);
    expect(profile.topWeaknesses.some((w) => w.skill === 'grammar')).toBe(false);
  });

  // 16. Overdue SRS → next action
  it('16. Overdue flashcards trigger P2 SRS_OVERDUE recommendation', async () => {
    const pastDate = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
    const mockCards: Flashcard[] = [
      {
        id: 'card-overdue-1',
        subjectId: '',
        front: 'hello',
        back: 'salom',
        nextReviewDate: pastDate,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      },
    ];
    setLocalFlashcardCache(testUserId, mockCards);

    const nextAction = await LearningPathEngine.getNextBestAction(testUserId, {
      forceLanguage: 'en',
    });
    expect(nextAction.type).toBe('srs_review');
    expect(nextAction.reason.code).toBe('SRS_OVERDUE');
    expect(nextAction.priority).toBe(92);
  });

  // 17. Completed SRS → recalculation
  it('17. Completed SRS clears overdue state and allows progression to next action', async () => {
    // Step 1: Set overdue card
    const pastDate = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
    const futureDate = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
    const mockCards: Flashcard[] = [
      {
        id: 'card-1',
        subjectId: '',
        front: 'apple',
        back: 'olma',
        nextReviewDate: pastDate,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      },
    ];
    setLocalFlashcardCache(testUserId, mockCards);

    let path = await LearningPathEngine.getLearningPathState(testUserId, { forceLanguage: 'en' });
    expect(path.srsSummary?.overdueCount).toBe(1);
    expect(path.nextAction.reason.code).toBe('SRS_OVERDUE');

    // Step 2: User completes review -> nextReviewDate moved to future
    mockCards[0].nextReviewDate = futureDate;
    mockCards[0].repetitions = 2;
    setLocalFlashcardCache(testUserId, mockCards);

    path = await LearningPathEngine.getLearningPathState(testUserId, { forceLanguage: 'en' });
    expect(path.srsSummary?.overdueCount).toBe(0);
    expect(path.nextAction.reason.code).not.toBe('SRS_OVERDUE');
  });

  // 18. Duplicate event
  it('18. Duplicate signal with same ID is accepted once and ignored on replay', async () => {
    const signalId = 'event-dup-test-18';
    const signal = {
      id: signalId,
      type: 'incorrect_answer' as const,
      language: 'en' as const,
      lessonId: 'en-a1-u1-l1',
      userId: testUserId,
      timestamp: new Date().toISOString(),
      stepId: 'step-1',
      questionId: 'q-100',
      prompt: 'Test Question',
      userAnswer: 'A',
      expectedAnswer: 'B',
      attemptCount: 1,
    };

    // First call
    await LearningSignalService.recordSignal(signal);
    const signals1 = LearningSignalService.getSignalsForUser(testUserId);
    expect(signals1.filter((s) => s.id === signalId).length).toBe(1);

    // Replay same signal
    await LearningSignalService.recordSignal(signal);
    const signals2 = LearningSignalService.getSignalsForUser(testUserId);
    expect(signals2.filter((s) => s.id === signalId).length).toBe(1);
  });

  // 19. Duplicate event does not double-count
  it('19. Duplicate evidence records do not double-count in MasteryEngine', () => {
    const evId = 'ev-idempotency-19';
    MasteryEngine.recordEvidence(testUserId, 'en', {
      id: evId,
      skill: 'grammar',
      score: 80,
      timestamp: new Date().toISOString(),
    });

    const initialEvidence = MasteryEngine.getUserEvidence(testUserId, 'en');
    const initialCount = initialEvidence.filter((e) => e.id === evId).length;
    expect(initialCount).toBe(1);

    // Replay identical record
    MasteryEngine.recordEvidence(testUserId, 'en', {
      id: evId,
      skill: 'grammar',
      score: 80,
      timestamp: new Date().toISOString(),
    });

    const afterEvidence = MasteryEngine.getUserEvidence(testUserId, 'en');
    const afterCount = afterEvidence.filter((e) => e.id === evId).length;
    expect(afterCount).toBe(1);
  });

  // 20. State recalculation
  it('20. getLearningPathState calculates live state synchronously from fresh storage', async () => {
    const state1 = await LearningPathEngine.getLearningPathState(testUserId, {
      forceLanguage: 'en',
    });
    expect(state1.masteryProfile?.skills.reading.score).toBe(0);

    // Add reading evidence
    MasteryEngine.recordEvidence(testUserId, 'en', {
      id: 'ev-reading-live-20',
      skill: 'reading',
      score: 85,
      timestamp: new Date().toISOString(),
    });

    const state2 = await LearningPathEngine.getLearningPathState(testUserId, {
      forceLanguage: 'en',
    });
    expect(state2.masteryProfile?.skills.reading.score).toBe(85);
  });

  // 21. Readiness recalculation
  it('21. Readiness score recalculates dynamically when new evidence arrives', async () => {
    const prog1 = await LearningPathEngine.getProgressionState(testUserId, { forceLanguage: 'en' });
    const initialReadiness = prog1.readinessScore;

    // Record high mastery across core skills
    ['vocabulary', 'grammar', 'reading', 'listening'].forEach((sk, idx) => {
      MasteryEngine.recordEvidence(testUserId, 'en', {
        id: `ev-readiness-${idx}`,
        skill: sk as any,
        score: 90,
        timestamp: new Date().toISOString(),
      });
    });

    const prog2 = await LearningPathEngine.getProgressionState(testUserId, { forceLanguage: 'en' });
    expect(prog2.readinessScore).toBeGreaterThan(initialReadiness ?? 0);
  });

  // 22. NextBestAction recalculation
  it('22. NextBestAction transitions predictably along priority cascade', async () => {
    // Priority Cascade:
    // 1. If overdue SRS -> P2 (92)
    // 2. If weak skill -> P3 (88)
    // 3. If standard new lesson -> P6 (70)

    // Case A: Weak skill present
    MasteryEngine.recordEvidence(testUserId, 'en', {
      id: 'ev-weak-22',
      skill: 'grammar',
      score: 40,
      timestamp: new Date().toISOString(),
    });

    const actionWeak = await LearningPathEngine.getNextBestAction(testUserId, {
      forceLanguage: 'en',
    });
    expect(actionWeak.type).toBe('remediation');
    expect(actionWeak.priority).toBe(88);

    // Case B: Overdue SRS added (higher priority 92)
    const pastDate = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
    setLocalFlashcardCache(testUserId, [
      {
        id: 'c1',
        subjectId: '',
        front: 't',
        back: 'm',
        nextReviewDate: pastDate,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      },
    ]);

    const actionOverdue = await LearningPathEngine.getNextBestAction(testUserId, {
      forceLanguage: 'en',
    });
    expect(actionOverdue.type).toBe('srs_review');
    expect(actionOverdue.priority).toBe(92);
  });

  // 23. Zero-level safety
  it('23. Complete beginners (zero completed lessons at starting level) receive Zero Level foundation', async () => {
    localStorage.setItem('study_planner_current_level', 'N5');
    const path = await LearningPathEngine.getLearningPathState(testUserId, { forceLanguage: 'ja' });
    expect(path.isZeroLevel).toBe(true);
    expect(path.nextAction.lessonId).toBe('ja-n5-u1-l1');
    expect(path.nextAction.isZeroFoundation).toBe(true);
  });

  // 24. No fake route
  it('24. All generated NextBestAction candidates and remediation routes point to valid app routes', async () => {
    const path = await LearningPathEngine.getLearningPathState(testUserId, { forceLanguage: 'en' });
    expect(path.nextAction.route).toBeDefined();
    expect(path.nextAction.route.startsWith('/')).toBe(true);
    expect(path.nextAction.route).not.toContain('undefined');
    expect(path.nextAction.route).not.toContain('placeholder');

    // Check remediation routes
    const remediation = await LearningPathEngine.getRemediationPlan(testUserId, {
      forceLanguage: 'en',
    });
    for (const item of remediation) {
      expect(item.suggestedRoute.startsWith('/')).toBe(true);
    }
  });

  // 25. Deterministic processing
  it('25. Identical user state and options yield strictly deterministic results', async () => {
    const stateA = await LearningPathEngine.getLearningPathState(testUserId, {
      forceLanguage: 'en',
    });
    const stateB = await LearningPathEngine.getLearningPathState(testUserId, {
      forceLanguage: 'en',
    });

    expect(stateA.nextAction.title).toBe(stateB.nextAction.title);
    expect(stateA.nextAction.priority).toBe(stateB.nextAction.priority);
    expect(stateA.progression.readinessScore).toBe(stateB.progression.readinessScore);
    expect((stateA.todayPlan.activities || []).length).toBe(
      (stateB.todayPlan.activities || []).length,
    );
  });
});
