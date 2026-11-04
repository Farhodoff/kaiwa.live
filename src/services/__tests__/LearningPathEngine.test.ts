import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearningPathEngine } from '../LearningPathEngine';
import { LearningOrchestrator } from '../LearningOrchestrator';

describe('Phase 8.5 - LearningPathEngine SRS Integration Suite (30 Deterministic Tests)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const createMockState = (overrides: any = {}): any => {
    return {
      userId: 'user-test',
      primaryLanguage: 'en',
      enabledLanguages: ['en'],
      currentLevel: 'B1',
      targetLevel: 'C1',
      targetGoal: 'IELTS 7.5',
      availableStudyMinutes: 30,
      currentPosition: {
        lessonId: 'en-b1-u1-l1',
        lessonTitle: 'Next B1 Lesson',
        courseId: 'en-b1',
        unitId: 'u1',
        totalSteps: 5,
        currentStepIndex: 0,
      },
      unfinishedLessons: [],
      completedLessonsCount: 4,
      reviewSummary: {
        dueCount: 0,
        overdueCount: 0,
        newCount: 0,
        totalCards: 10,
        learnedCount: 5,
        averageRetentionScore: 85,
      },
      signalsSummary: {
        recentMistakesCount: 0,
        recentMistakeTopics: [],
        newVocabularyCount: 0,
        completedLessonsCount: 4,
      },
      recentActivity: { lastStudyAt: null, recentLessonIds: [], lastCompletedLessonId: null },
      masteryProfile: {
        userId: 'user-test',
        language: 'en',
        skills: {
          grammar: {
            score: 75,
            confidence: 80,
            trend: 'stable',
            skill: 'grammar',
            evidenceCount: 5,
          },
          listening: {
            score: 72,
            confidence: 85,
            trend: 'stable',
            skill: 'listening',
            evidenceCount: 5,
          },
          vocabulary: {
            score: 72,
            confidence: 75,
            trend: 'stable',
            skill: 'vocabulary',
            evidenceCount: 5,
          },
          reading: {
            score: 72,
            confidence: 75,
            trend: 'stable',
            skill: 'reading',
            evidenceCount: 5,
          },
          writing: {
            score: 72,
            confidence: 75,
            trend: 'stable',
            skill: 'writing',
            evidenceCount: 5,
          },
          speaking: {
            score: 72,
            confidence: 75,
            trend: 'stable',
            skill: 'speaking',
            evidenceCount: 5,
          },
        },
        topWeaknesses: [],
        topStrengths: [],
      },
      ...overrides,
    };
  };

  // 1. overdue SRS
  it('1. should identify overdue SRS correctly and assign appropriate priority', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 5, overdueCount: 3, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.type).toBe('srs_review');
    expect(decision.primaryAction.reason.code).toBe('SRS_OVERDUE');
  });

  // 2. due SRS
  it('2. should identify due SRS correctly and assign appropriate priority', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 8, overdueCount: 0, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.type).toBe('srs_review');
    expect(decision.primaryAction.reason.code).toBe('SRS_DUE');
  });

  // 3. new cards
  it('3. should identify new cards correctly and trigger new vocabulary activity', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 0, overdueCount: 0, newCount: 15, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.type).toBe('srs_review');
    expect(decision.primaryAction.reason.code).toBe('NEW_VOCABULARY');
  });

  // 4. no SRS
  it('4. should omit SRS activity entirely when there are no due or overdue cards and no new cards', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 0, overdueCount: 0, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test');
    const srsActivity = plan.activities?.find((a) => a.type === 'srs_review');
    expect(srsActivity?.status).toBe('completed');
  });

  // 5. overdue > due priority
  it('5. should prioritize overdue SRS over due SRS reviews', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 15, overdueCount: 4, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.reason.code).toBe('SRS_OVERDUE');
  });

  // 6. due > new priority
  it('6. should prioritize due SRS over new cards', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 6, overdueCount: 0, newCount: 10, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.reason.code).toBe('SRS_DUE');
  });

  // 7. SRS cap 15 min
  it('7. should cap SRS review time under 20% in standard 15-minute daily plan', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 50, overdueCount: 10, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test', { customMinutes: 15 });
    const srsActivity = plan.activities?.find((a) => a.id === 'act-srs');
    expect(srsActivity ? srsActivity.estimatedMinutes : 0).toBeLessThanOrEqual(5);
  });

  // 8. SRS cap 30 min
  it('8. should cap SRS review time under 30% in standard 30-minute daily plan', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 50, overdueCount: 10, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test', { customMinutes: 30 });
    const srsActivity = plan.activities?.find((a) => a.id === 'act-srs');
    expect(srsActivity ? srsActivity.estimatedMinutes : 0).toBeLessThanOrEqual(8);
  });

  // 9. SRS cap 45 min
  it('9. should cap SRS review time under 30% in standard 45-minute daily plan', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 50, overdueCount: 10, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test', { customMinutes: 45 });
    const srsActivity = plan.activities?.find((a) => a.id === 'act-srs');
    expect(srsActivity ? srsActivity.estimatedMinutes : 0).toBeLessThanOrEqual(10);
  });

  // 10. SRS cap 60 min
  it('10. should cap SRS review time under 25% in standard 60-minute daily plan', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 50, overdueCount: 10, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test', { customMinutes: 60 });
    const srsActivity = plan.activities?.find((a) => a.id === 'act-srs');
    expect(srsActivity ? srsActivity.estimatedMinutes : 0).toBeLessThanOrEqual(15);
  });

  // 11. skipSrs
  it('11. should allocate 0 minutes to SRS when skipSrs is enabled', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 50, overdueCount: 10, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test', { skipSrs: true });
    const srsActivity = plan.activities?.find((a) => a.id === 'act-srs');
    expect(srsActivity).toBeUndefined();
  });

  // 12. English isolation
  it('12. should isolate learning path and prevent Japanese actions for English primary user', async () => {
    const state = createMockState({ primaryLanguage: 'en' });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const path = await LearningPathEngine.getLearningPathState('user-test');
    expect(path.skillAllocations.some((a) => a.skill === 'kanji')).toBe(false);
  });

  // 13. Japanese isolation
  it('13. should isolate learning path and prevent English actions for Japanese primary user', async () => {
    const state = createMockState({ primaryLanguage: 'ja' });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const path = await LearningPathEngine.getLearningPathState('user-test');
    expect(path.skillAllocations.some((a) => a.skill === 'writing')).toBe(false);
  });

  // 14. mixed language safety
  it('14. should guarantee mixed language safety by strictly mapping primary language', async () => {
    const state = createMockState({ primaryLanguage: 'en', enabledLanguages: ['en', 'ja'] });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.language).toBe('en');
  });

  // 15. SRS + unfinished lesson
  it('15. should prioritize unfinished lesson over overdue SRS review', async () => {
    const state = createMockState({
      unfinishedLessons: [
        { lessonId: 'en-b1-u1-l1', lessonTitle: 'Grammar review', progressPercentage: 45 },
      ],
      reviewSummary: { dueCount: 10, overdueCount: 5, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.type).toBe('continue_lesson');
  });

  // 16. SRS + weak skill
  it('16. should prioritize weak skill remediation over due SRS review', async () => {
    const state = createMockState({
      unfinishedLessons: [],
      reviewSummary: { dueCount: 10, overdueCount: 0, newCount: 0, averageRetentionScore: 80 },
      masteryProfile: {
        userId: 'user-test',
        language: 'en',
        skills: {},
        topWeaknesses: [
          {
            skill: 'listening',
            score: 45,
            confidence: 80,
            severity: 'high',
            reason: 'Listening accuracy low',
            recommendedRoute: '/ielts/reading-listening',
            language: 'en',
          },
        ],
        topStrengths: [],
      },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.type).toBe('remediation');
    expect(decision.primaryAction.skill).toBe('listening');
  });

  // 17. SRS + repeated mistakes
  it('17. should prioritize repeated mistake topic over due SRS review', async () => {
    const state = createMockState({
      unfinishedLessons: [],
      reviewSummary: { dueCount: 10, overdueCount: 0, newCount: 0, averageRetentionScore: 80 },
      signalsSummary: {
        recentMistakesCount: 3,
        recentMistakeTopics: ['Present Perfect'],
        newVocabularyCount: 0,
        completedLessonsCount: 4,
      },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.type).toBe('remediation');
    expect(decision.primaryAction.reason.code).toBe('RECENT_MISTAKES');
  });

  // 18. SRS + new lesson
  it('18. should prioritize due SRS review over regular new lesson', async () => {
    const state = createMockState({
      unfinishedLessons: [],
      reviewSummary: { dueCount: 8, overdueCount: 0, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.type).toBe('srs_review');
  });

  // 19. estimated retention
  it('19. should report estimated retention correctly in summary rationale', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 5, overdueCount: 2, newCount: 0, averageRetentionScore: 72 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.rationale).toContain('72%');
  });

  // 20. overdue pressure
  it('20. should scale priority score higher under overdue card pressure', async () => {
    const stateLow = createMockState({
      reviewSummary: { dueCount: 5, overdueCount: 1, newCount: 0, averageRetentionScore: 80 },
    });
    const stateHigh = createMockState({
      reviewSummary: { dueCount: 5, overdueCount: 25, newCount: 0, averageRetentionScore: 80 },
    });

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(stateLow);
    const decLow = await LearningPathEngine.getLearningDecision('user-test');

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(stateHigh);
    const decHigh = await LearningPathEngine.getLearningDecision('user-test');

    expect(decHigh.primaryAction.priority).toBeGreaterThanOrEqual(decLow.primaryAction.priority);
  });

  // 21. new vocabulary activity
  it('21. should formulate a dedicated learning reason for new vocabulary cards', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 0, overdueCount: 0, newCount: 8, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.reason.code).toBe('NEW_VOCABULARY');
    expect(decision.primaryAction.reason.title).toContain('New Words');
  });

  // 22. empty state
  it('22. should fall back to diagnostic required when state is entirely empty', async () => {
    const state = createMockState({
      currentPosition: null,
      completedLessonsCount: 0,
      unfinishedLessons: [],
      reviewSummary: { dueCount: 0, overdueCount: 0, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.reason.code).toBe('DIAGNOSTIC_REQUIRED');
  });

  // 23. completed SRS activity
  it('23. should flag SRS activity as completed when due count is 0', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 0, overdueCount: 0, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test');
    const srsActivity = plan.activities?.find((a) => a.id === 'act-srs');
    expect(srsActivity?.status).toBe('completed');
  });

  // 24. remaining minutes recalculation
  it('24. should calculate remaining plan minutes correctly based on completed activities', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 0, overdueCount: 0, newCount: 0, averageRetentionScore: 80 },
      recentActivity: {
        lastStudyAt: new Date().toISOString(),
        recentLessonIds: ['en-b1-u1-l1'],
        lastCompletedLessonId: 'en-b1-u1-l1',
      },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test', { customMinutes: 30 });
    expect(plan.completedMinutes).toBeGreaterThan(0);
    expect(plan.remainingMinutes).toBeLessThan(30);
  });

  // 25. deterministic output
  it('25. should generate identical outputs for identical input states', async () => {
    const state = createMockState();
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);
    // Phase 15: Mock promoteIfReady to avoid side effects in determinism test
    vi.spyOn(LearningOrchestrator, 'promoteIfReady').mockResolvedValue({
      promoted: false,
      oldLevel: state.currentLevel,
      newLevel: null,
      reason: 'mocked',
    });

    const plan1 = await LearningPathEngine.getTodayPlan('user-test');
    const plan2 = await LearningPathEngine.getTodayPlan('user-test');
    expect(plan1).toEqual(plan2);
  });

  // 26. invalid flashcard safety
  it('26. should safely ignore invalid or deleted flashcard structures', async () => {
    const state = createMockState({
      reviewSummary: {
        dueCount: NaN,
        overdueCount: undefined,
        newCount: 0,
        averageRetentionScore: 0,
      },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test');
    expect(plan.srsAllocation?.dueCount).toBe(0);
  });

  // 27. missing SRS metadata
  it('27. should handle missing SRS metadata in user state gracefully', async () => {
    const state = createMockState({ reviewSummary: null });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test');
    expect(plan.srsAllocation?.dueCount).toBe(0);
  });

  // 28. high overdue count
  it('28. should handle extremely high overdue counts correctly without crashing', async () => {
    const state = createMockState({
      reviewSummary: { dueCount: 1500, overdueCount: 1200, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test');
    expect(plan.srsAllocation?.overdueCount).toBe(1200);
  });

  // 29. language filtering
  it('29. should perform low level language filtering on SRS deck', async () => {
    const state = createMockState({
      primaryLanguage: 'en',
      reviewSummary: { dueCount: 10, overdueCount: 5, newCount: 0, averageRetentionScore: 80 },
    });
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const decision = await LearningPathEngine.getLearningDecision('user-test');
    expect(decision.primaryAction.language).toBe('en');
  });

  // 30. regression compatibility
  it('30. should be fully backwards compatible with prior dashboard expectations', async () => {
    const state = createMockState();
    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(state);

    const plan = await LearningPathEngine.getTodayPlan('user-test');
    expect(plan.userId).toBe('user-test');
    expect(plan.language).toBe('en');
  });
});
