import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearningSignalService } from '../LearningSignalService';
import { FlashcardService } from '../FlashcardService';
import { MasteryEngine } from '../MasteryEngine';
import { WeaknessEngine } from '../WeaknessEngine';
import { SAMPLE_LESSONS } from '../../data/curriculum/sampleCurriculum';
import { Flashcard } from '../../types';

describe('LearningSignalService', () => {
  const testUserId = 'test_user_signals_456';
  const jaLesson = SAMPLE_LESSONS.find((l) => l.id === 'ja-n3-u1-l1') || SAMPLE_LESSONS[0];
  const enLesson = SAMPLE_LESSONS.find((l) => l.id === 'en-b2-u1-l1') || SAMPLE_LESSONS[1];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('records and retrieves learning signals from storage', async () => {
    await LearningSignalService.recordSignal({
      id: 'sig_1',
      type: 'grammar_pattern',
      language: 'ja',
      lessonId: jaLesson.id,
      userId: testUserId,
      pattern: '〜ことにする',
      meaning: 'Qaror qabul qilish',
      level: 'N3',
      timestamp: new Date().toISOString(),
    });

    const signals = LearningSignalService.getSignalsForUser(testUserId);
    expect(signals.length).toBe(1);
    expect(signals[0].type).toBe('grammar_pattern');
    expect(signals[0].lessonId).toBe(jaLesson.id);
  });

  it('automatically ingests new vocabulary into SRS on Japanese lesson completion', async () => {
    const fetchSpy = vi.spyOn(FlashcardService, 'fetchFlashcards').mockResolvedValue([]);
    const addBatchSpy = vi
      .spyOn(FlashcardService, 'addFlashcardsBatch')
      .mockImplementation(async (_u, cards) => {
        return cards.map((c, i) => ({
          id: `card_${i}`,
          subjectId: '',
          front: c.front || '',
          back: c.back || '',
          nextReviewDate: c.nextReviewDate || new Date().toISOString(),
          easeFactor: c.easeFactor || 2.5,
          interval: c.interval || 0,
          repetitions: c.repetitions || 0,
        }));
      });

    const result = await LearningSignalService.processLessonCompletion(
      testUserId,
      jaLesson,
      { score: 4, total: 4, percentage: 100 },
      [],
    );

    expect(fetchSpy).toHaveBeenCalled();
    expect(addBatchSpy).toHaveBeenCalled();
    expect(result.newCardsCount).toBe(4); // 4 vocab items in ja-n3-u1-l1: 旅行, 切符, 交通, 乗り換える
    expect(result.mistakesCount).toBe(0);

    // Verify emitted signals
    const signals = LearningSignalService.getSignalsForUser(testUserId);
    const vocabSignals = signals.filter((s) => s.type === 'new_vocabulary');
    const grammarSignals = signals.filter((s) => s.type === 'grammar_pattern');
    const completionSignals = signals.filter((s) => s.type === 'completed_lesson');

    expect(vocabSignals.length).toBe(4);
    expect(grammarSignals.length).toBe(1);
    expect(grammarSignals[0].pattern).toContain('ことにする');
    expect(completionSignals.length).toBe(1);
    expect(completionSignals[0].score).toBe(4);
  });

  it('protects against duplicate card creation when lesson is repeated', async () => {
    // Pre-existing flashcard for "旅行"
    const existingCards: Flashcard[] = [
      {
        id: 'existing_card_1',
        subjectId: '',
        front: '旅行 (りょこう)',
        back: 'Sayohat, safar',
        nextReviewDate: new Date().toISOString(),
        easeFactor: 2.7,
        interval: 6,
        repetitions: 3,
      },
    ];

    vi.spyOn(FlashcardService, 'fetchFlashcards').mockResolvedValue(existingCards);
    const addBatchSpy = vi
      .spyOn(FlashcardService, 'addFlashcardsBatch')
      .mockImplementation(async (_u, cards) => {
        return cards.map((c, i) => ({
          id: `new_card_${i}`,
          subjectId: '',
          front: c.front || '',
          back: c.back || '',
          nextReviewDate: c.nextReviewDate || new Date().toISOString(),
          easeFactor: c.easeFactor || 2.5,
          interval: c.interval || 0,
          repetitions: c.repetitions || 0,
        }));
      });

    const result = await LearningSignalService.processLessonCompletion(
      testUserId,
      jaLesson,
      { score: 4, total: 4, percentage: 100 },
      [],
    );

    // Out of 4 words, 1 already exists, so only 3 should be created
    expect(result.newCardsCount).toBe(3);
    const insertedCards = addBatchSpy.mock.calls[0][1];
    expect(insertedCards.some((c) => c.front?.includes('旅行'))).toBe(false);
  });

  it('correctly ingests English academic vocabulary into SRS for English lessons', async () => {
    vi.spyOn(FlashcardService, 'fetchFlashcards').mockResolvedValue([]);
    const addBatchSpy = vi
      .spyOn(FlashcardService, 'addFlashcardsBatch')
      .mockImplementation(async (_u, cards) => {
        return cards.map((c, i) => ({
          id: `card_${i}`,
          subjectId: '',
          front: c.front || '',
          back: c.back || '',
          nextReviewDate: c.nextReviewDate || new Date().toISOString(),
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
        }));
      });

    const result = await LearningSignalService.processLessonCompletion(
      testUserId,
      enLesson,
      { score: 4, total: 4, percentage: 100 },
      [],
    );

    expect(result.newCardsCount).toBe(4); // Perseverance, Meticulous, Comprehend, Synthesize
    const insertedCards = addBatchSpy.mock.calls[0][1];
    expect(insertedCards[0].front).toContain('Perseverance');
    expect(insertedCards[0].easeFactor).toBe(2.5);
    expect(insertedCards[0].interval).toBe(0);
  });

  it('records incorrect answer signals and detects repeated errors', async () => {
    vi.spyOn(FlashcardService, 'fetchFlashcards').mockResolvedValue([]);
    vi.spyOn(FlashcardService, 'addFlashcardsBatch').mockResolvedValue([]);

    const mistakes = [
      {
        id: 'err_1',
        type: 'incorrect_answer' as const,
        language: 'ja' as const,
        lessonId: jaLesson.id,
        userId: testUserId,
        stepId: 'ja-n3-u1-l1-s2',
        questionId: 'q_inversion_1',
        prompt: "Transport vositasini almashtirish fe'li?",
        userAnswer: '見送り',
        expectedAnswer: '乗り換える',
        explanation: "O'tish/almashtirish = 乗り換える",
        attemptCount: 1,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'err_2',
        type: 'incorrect_answer' as const,
        language: 'ja' as const,
        lessonId: jaLesson.id,
        userId: testUserId,
        stepId: 'ja-n3-u1-l1-s3',
        questionId: 'q_inversion_1', // Same question ID -> triggers repeated_error
        prompt: "Transport vositasini almashtirish fe'li?",
        userAnswer: '出発',
        expectedAnswer: '乗り換える',
        explanation: "O'tish/almashtirish = 乗り換える",
        attemptCount: 2,
        timestamp: new Date().toISOString(),
      },
    ];

    const result = await LearningSignalService.processLessonCompletion(
      testUserId,
      jaLesson,
      { score: 2, total: 4, percentage: 50 },
      mistakes,
    );

    expect(result.mistakesCount).toBe(2);

    const signals = LearningSignalService.getSignalsForUser(testUserId);
    const incorrectSignals = signals.filter((s) => s.type === 'incorrect_answer');
    const repeatedSignals = signals.filter((s) => s.type === 'repeated_error');

    expect(incorrectSignals.length).toBe(2);
    expect(repeatedSignals.length).toBe(1);
    expect(repeatedSignals[0].questionId).toBe('q_inversion_1');
    expect(repeatedSignals[0].errorCount).toBe(2);
  });

  it('records lesson result as canonical mastery evidence and updates weaknesses', async () => {
    vi.spyOn(FlashcardService, 'fetchFlashcards').mockResolvedValue([]);
    vi.spyOn(FlashcardService, 'addFlashcardsBatch').mockResolvedValue([]);

    await LearningSignalService.processLessonCompletion(
      testUserId,
      enLesson,
      { score: 1, total: 4, percentage: 25 },
      [],
    );

    const evidence = MasteryEngine.getUserEvidence(testUserId, enLesson.language);
    const performanceEvidence = evidence.filter(
      (e) => e.lessonId === enLesson.id && e.category === 'performance',
    );
    const completionEvidence = evidence.filter(
      (e) => e.lessonId === enLesson.id && e.category === 'completion',
    );

    expect(performanceEvidence.length).toBeGreaterThan(0);
    expect(completionEvidence.length).toBeGreaterThan(0);
    expect(
      performanceEvidence.every((e) => e.userId === testUserId && e.language === enLesson.language),
    ).toBe(true);

    const profile = WeaknessEngine.getUserMasteryProfile(testUserId, enLesson.language);
    expect(profile.topWeaknesses.length).toBeGreaterThan(0);
    expect(profile.topWeaknesses.every((w) => w.language === enLesson.language)).toBe(true);
  });

  it('does not duplicate mastery evidence when the same lesson completion is processed twice', async () => {
    vi.spyOn(FlashcardService, 'fetchFlashcards').mockResolvedValue([]);
    vi.spyOn(FlashcardService, 'addFlashcardsBatch').mockResolvedValue([]);

    await LearningSignalService.processLessonCompletion(
      testUserId,
      jaLesson,
      { score: 4, total: 4, percentage: 100 },
      [],
    );
    const firstEvidenceCount = MasteryEngine.getUserEvidence(testUserId, jaLesson.language).length;
    const firstSignalCount = LearningSignalService.getSignalsForUser(testUserId).length;

    await LearningSignalService.processLessonCompletion(
      testUserId,
      jaLesson,
      { score: 2, total: 4, percentage: 50 },
      [],
    );
    const secondEvidence = MasteryEngine.getUserEvidence(testUserId, jaLesson.language);
    const secondSignals = LearningSignalService.getSignalsForUser(testUserId);

    expect(secondEvidence.length).toBe(firstEvidenceCount);
    expect(secondSignals.length).toBe(firstSignalCount);
    expect(
      secondEvidence
        .filter((e) => e.id?.startsWith('lesson_result_ev_'))
        .every((e) => e.score === 50),
    ).toBe(true);
  });

  it('rejects cross-user or cross-language mastery evidence from lesson pipeline inputs', async () => {
    vi.spyOn(FlashcardService, 'fetchFlashcards').mockResolvedValue([]);
    vi.spyOn(FlashcardService, 'addFlashcardsBatch').mockResolvedValue([]);

    await LearningSignalService.processLessonCompletion(
      testUserId,
      jaLesson,
      { score: 2, total: 4, percentage: 50 },
      [
        {
          id: 'foreign_error',
          type: 'incorrect_answer',
          language: 'en',
          lessonId: 'foreign_lesson',
          userId: 'other_user',
          stepId: 'foreign_step',
          questionId: 'foreign_question',
          prompt: 'Wrong grammar answer',
          userAnswer: 'x',
          expectedAnswer: 'y',
          attemptCount: 1,
          timestamp: new Date().toISOString(),
        },
      ],
    );

    const signals = LearningSignalService.getSignalsForUser(testUserId);
    const normalizedError = signals.find((s) => s.id === 'foreign_error');
    expect(normalizedError?.userId).toBe(testUserId);
    expect(normalizedError?.language).toBe(jaLesson.language);
    expect(normalizedError?.lessonId).toBe(jaLesson.id);
    expect(MasteryEngine.getUserEvidence('other_user', 'en')).toHaveLength(0);
  });

  it('caps stored signals in localStorage to avoid storage exhaustion', async () => {
    const largeBatch = Array.from({ length: 350 }).map((_, i) => ({
      id: `sig_${i}`,
      type: 'new_vocabulary' as const,
      language: 'ja' as const,
      lessonId: jaLesson.id,
      userId: testUserId,
      term: `term_${i}`,
      meaning: `meaning_${i}`,
      timestamp: new Date().toISOString(),
    }));

    await LearningSignalService.recordSignalsBatch(largeBatch);
    const saved = LearningSignalService.getSignalsForUser(testUserId);
    expect(saved.length).toBe(300); // Capped at 300
  });
});
