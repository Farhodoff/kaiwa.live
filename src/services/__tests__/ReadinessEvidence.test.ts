import { describe, it, expect, beforeEach } from 'vitest';
import { LearningPathEngine } from '../LearningPathEngine';
import { WeaknessEngine } from '../WeaknessEngine';

/**
 * PHASE 8.10 — REAL READINESS & EVIDENCE ENGINE
 * Tests diagnostic integration, JLPT skill model, SRS evidence,
 * promotion blockers, and readiness scoring.
 */
describe('Phase 8.10 — Readiness & Evidence Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const createJaState = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    userId: 'test-user',
    primaryLanguage: 'ja',
    enabledLanguages: ['ja'],
    currentLevel: 'N4',
    targetLevel: 'N3',
    targetGoal: 'JLPT Imtihoni',
    availableStudyMinutes: 30,
    completedLessonsCount: 2,
    unfinishedLessons: [],
    recentActivity: {},
    signalsSummary: { recentMistakesCount: 0, recentMistakeTopics: [] },
    reviewSummary: { dueCount: 0, overdueCount: 0 },
    masteryProfile: {
      skills: {
        vocabulary: { score: 80 },
        kanji: { score: 78 },
        grammar: { score: 82 },
        reading: { score: 75 },
        listening: { score: 72 },
        speaking: { score: 74 },
      },
    },
    diagnosticBaseline: true,
    ...overrides,
  });

  const createEnState = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    userId: 'test-user',
    primaryLanguage: 'en',
    enabledLanguages: ['en'],
    currentLevel: 'A1',
    targetLevel: 'B2',
    targetGoal: 'General English',
    availableStudyMinutes: 30,
    completedLessonsCount: 2,
    unfinishedLessons: [],
    recentActivity: {},
    signalsSummary: { recentMistakesCount: 0, recentMistakeTopics: [] },
    reviewSummary: { dueCount: 0, overdueCount: 0 },
    masteryProfile: {
      skills: {
        grammar: { score: 85 },
        vocabulary: { score: 80 },
        reading: { score: 75 },
        listening: { score: 72 },
      },
    },
    diagnosticBaseline: true,
    ...overrides,
  });

  // ── 1. English regression ──
  it('1. should not change English progression behavior (regression)', () => {
    const state = createEnState({ currentLevel: 'A1', completedLessonsCount: 3 });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.nextLevel).toBe('A2');
  });

  // ── 2. Japanese regression ──
  it('2. should not change Japanese progression readiness (regression)', () => {
    const state = createJaState({ currentLevel: 'N4' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.nextLevel).toBe('N3');
  });

  // ── 3. Missing diagnostic ──
  it('3. should block promotion when diagnostic is missing and no lessons completed', () => {
    const state = createJaState({
      currentLevel: 'N4',
      completedLessonsCount: 0,
      diagnosticBaseline: false,
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain(
      'Japanese diagnostic assessment is required before promotion.',
    );
    expect(prog.recommendedAction).toBe('Take the Japanese diagnostic assessment');
  });

  // ── 4. Low diagnostic confidence ──
  it('4. should block promotion with score-based message when diagnostic confidence < 50', () => {
    localStorage.setItem(
      'study_planner_diag_result_test-user_ja',
      JSON.stringify({
        userId: 'test-user',
        language: 'ja',
        overallConfidence: 42,
      }),
    );
    const state = createJaState({ currentLevel: 'N4' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain(
      'Japanese diagnostic confidence is 42%, minimum is 50%.',
    );
    expect(prog.recommendedAction).toBe('Retake/review Japanese diagnostic');
  });

  // ── 5. High diagnostic confidence ──
  it('5. should allow promotion when diagnostic confidence is >= 50', () => {
    localStorage.setItem(
      'study_planner_diag_result_test-user_ja',
      JSON.stringify({
        userId: 'test-user',
        language: 'ja',
        overallConfidence: 75,
      }),
    );
    const state = createJaState({ currentLevel: 'N4' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.nextLevel).toBe('N3');
  });

  // ── 6. Kanji blocker ──
  it('6. should block with Kanji mastery score in blocker message', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 48 },
          grammar: { score: 82 },
          reading: { score: 75 },
          listening: { score: 72 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain('KANJI mastery is below 60% (48% < 60%).');
    expect(prog.missingEvidence).toContain('KANJI Mastery');
    expect(prog.weakestSkill).toBe('kanji');
  });

  // ── 7. Grammar blocker ──
  it('7. should block with Grammar mastery score in blocker message', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 78 },
          grammar: { score: 55 },
          reading: { score: 75 },
          listening: { score: 72 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain('GRAMMAR mastery is below 60% (55% < 60%).');
  });

  // ── 8. Reading blocker ──
  it('8. should block promotion when Reading is below 60%', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 78 },
          grammar: { score: 82 },
          reading: { score: 45 },
          listening: { score: 72 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain('READING mastery is below 60% (45% < 60%).');
  });

  // ── 9. Listening blocker ──
  it('9. should block promotion when Listening is below 60%', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 78 },
          grammar: { score: 82 },
          reading: { score: 75 },
          listening: { score: 50 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain('LISTENING mastery is below 60% (50% < 60%).');
  });

  // ── 10. Vocabulary blocker ──
  it('10. should block promotion when Vocabulary is below 60%', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 52 },
          kanji: { score: 78 },
          grammar: { score: 82 },
          reading: { score: 75 },
          listening: { score: 72 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain('VOCABULARY mastery is below 60% (52% < 60%).');
  });

  // ── 11. Speaking does NOT block JLPT ──
  it('11. should NOT block JLPT promotion due to Speaking skill (not a JLPT exam section)', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 78 },
          grammar: { score: 82 },
          reading: { score: 75 },
          listening: { score: 72 },
          speaking: { score: 70 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.advancementBlockers?.some((b) => b.includes('SPEAKING'))).toBe(false);
  });

  // ── 12. Kanji SRS → mastery (cold start) ──
  it('12. should derive Kanji mastery from SRS retention as cold-start evidence', () => {
    const profile = WeaknessEngine.getUserMasteryProfile('srs-kanji-user', 'ja', {
      srsRetention: 85,
    });
    expect(profile.skills.kanji.score).toBe(85);
    expect(profile.skills.kanji.evidenceCount).toBe(1);
    expect(profile.skills.kanji.status).toBe('mastered'); // SRS 85 ≥ 85 threshold → mastered
  });

  // ── 13. Vocabulary SRS → mastery (cold start) ──
  it('13. should derive Vocabulary mastery from SRS retention as cold-start evidence', () => {
    const profile = WeaknessEngine.getUserMasteryProfile('srs-vocab-user', 'ja', {
      srsRetention: 90,
    });
    expect(profile.skills.vocabulary.score).toBe(90);
    expect(profile.skills.vocabulary.evidenceCount).toBe(1);
    expect(profile.skills.vocabulary.status).toBe('mastered'); // SRS 90 ≥ 85 threshold → mastered
  });

  // ── 14. Recent mistakes blocker ──
  it('14. should block with mistake count in blocker message', () => {
    const state = createJaState({
      currentLevel: 'N4',
      signalsSummary: { recentMistakesCount: 3, recentMistakeTopics: ['Te-form'] },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true); // 3 < 5 threshold

    const state2 = createJaState({
      currentLevel: 'N4',
      signalsSummary: { recentMistakesCount: 7, recentMistakeTopics: ['Keigo'] },
    });
    const prog2 = LearningPathEngine.evalProgression(state2, false);
    expect(prog2.isReadyForPromotion).toBe(false);
    expect(prog2.advancementBlockers).toContain('7 recent repeated mistakes detected.');
    expect(prog2.recommendedAction).toBe('Review recent Japanese mistakes');
  });

  // ── 15. SRS overdue blocker ──
  it('15. should block promotion when SRS cards are overdue', () => {
    const state = createJaState({
      currentLevel: 'N4',
      reviewSummary: { dueCount: 12, overdueCount: 3 },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain('3 SRS cards overdue for review.');
    expect(prog.missingEvidence).toContain('SRS Review');
    expect(prog.recommendedAction).toBe('SRS review');
  });

  // ── 16. Ready state ──
  it('16. should produce correct ready state with all evidence satisfied', () => {
    const state = createJaState({ currentLevel: 'N4' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.canAdvance).toBe(true);
    expect(prog.ready).toBe(true);
    expect(prog.nextLevel).toBe('N3');
    expect(prog.recommendedAction).toBe('Continue to N3');
    expect(prog.explanation).toContain('tayyor');
  });

  // ── 17. Not-ready state ──
  it('17. should produce not-ready state with blockers and explanation', () => {
    const state = createJaState({
      currentLevel: 'N4',
      completedLessonsCount: 0,
      diagnosticBaseline: false,
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.canAdvance).toBe(false);
    expect(prog.advancementBlockers?.length).toBeGreaterThan(0);
    expect(prog.explanation).toContain("to'siqlar");
  });

  // ── 18. N1 terminal state ──
  it('18. should mark N1 as terminal with maintenance action', () => {
    const state = createJaState({ currentLevel: 'N1', targetLevel: 'N1' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.nextLevel).toBeNull();
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.recommendedAction).toBe('Maintain and deepen advanced Japanese skills');
  });

  // ── 19. Language isolation ──
  it('19a. should never expose JLPT levels to English users', () => {
    const state = createEnState({ currentLevel: 'A1' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.nextLevel).toBe('A2');
    expect(['N5', 'N4', 'N3', 'N2', 'N1']).not.toContain(prog.nextLevel);
    expect(prog.advancementBlockers?.every((b) => !b.includes('KANJI'))).toBe(true);
  });

  it('19b. should never expose CEFR/IELTS levels to Japanese users', () => {
    const state = createJaState({ currentLevel: 'N4' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.nextLevel).toBe('N3');
    expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS Foundation']).not.toContain(prog.nextLevel);
  });

  it('19c. should isolate English diagnostic from Japanese promotion', () => {
    localStorage.setItem(
      'study_planner_diag_result_test-user_en',
      JSON.stringify({
        userId: 'test-user',
        language: 'en',
        overallConfidence: 20,
      }),
    );
    const state = createJaState({ currentLevel: 'N4' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
  });

  // ── 20. Deterministic readiness score ──
  it('20. should produce deterministic readiness score from evidence', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 70 },
          kanji: { score: 70 },
          grammar: { score: 70 },
          reading: { score: 70 },
          listening: { score: 70 },
          speaking: { score: 70 },
        },
      },
      completedLessonsCount: 2,
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    // avg=70, diagWeight=1 (no diagnostic stored, latestDiag=null → 1), lessons=2, ready bonus=10
    // readiness = 70*0.6*1 + 2*5 + 10 = 42 + 10 + 10 = 62
    expect(prog.readinessScore).toBe(62);
    expect(prog.readinessScore).toBeGreaterThanOrEqual(0);
    expect(prog.readinessScore).toBeLessThanOrEqual(100);

    // Determinism
    const prog2 = LearningPathEngine.evalProgression(state, false);
    expect(prog.readinessScore).toBe(prog2.readinessScore);
  });

  // ── 21. Diagnostic confidence reduces readiness weight ──
  it('21. should reduce readiness score when diagnostic confidence is low', () => {
    localStorage.setItem(
      'study_planner_diag_result_test-user_ja',
      JSON.stringify({
        userId: 'test-user',
        language: 'ja',
        overallConfidence: 60,
      }),
    );
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 80 },
          grammar: { score: 80 },
          reading: { score: 80 },
          listening: { score: 80 },
          speaking: { score: 80 },
        },
      },
      completedLessonsCount: 2,
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    // diagWeight = min(1, 60/100) = 0.6
    // readiness = 80*0.6*0.6 + 10 + 10 = 28.8 + 10 + 10 = 48.8 → 49
    expect(prog.readinessScore).toBe(49);
  });

  // ── 22. SRS cold start feeds end-to-end progression ──
  it('22. should let SRS-derived Kanji mastery participate in promotion evaluation', () => {
    const profile = WeaknessEngine.getUserMasteryProfile('e2e-srs-ja', 'ja', { srsRetention: 85 });
    const state = createJaState({
      userId: 'e2e-srs-ja',
      masteryProfile: profile,
      completedLessonsCount: 2,
      diagnosticBaseline: true,
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    // kanji 85 ≥ 60 → no KANJI blocker; vocab 85 ≥ 60 → no VOCAB blocker
    expect(
      prog.advancementBlockers?.some((b) => b.includes('KANJI') || b.includes('VOCABULARY')),
    ).toBe(false);
  });

  // ── 23. Evidence-skill isolation: missing skills don't block ──
  it('23. should not block promotion for skills with no evidence in JLPT core', () => {
    const state = createJaState({
      currentLevel: 'N5',
      masteryProfile: { skills: { kanji: { score: 75 }, grammar: { score: 75 } } },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.advancementBlockers?.every((b) => !b.includes('VOCABULARY'))).toBe(true);
    expect(prog.advancementBlockers?.every((b) => !b.includes('READING'))).toBe(true);
    expect(prog.advancementBlockers?.every((b) => !b.includes('LISTENING'))).toBe(true);
    expect(prog.advancementBlockers?.every((b) => !b.includes('SPEAKING'))).toBe(true);
  });

  // ── 24. Zero-level skips SRS and skill blockers ──
  it('24. should not apply SRS or skill blockers at ZERO level', () => {
    const state = createJaState({
      currentLevel: 'ZERO',
      completedLessonsCount: 1,
      masteryProfile: {
        skills: { vocabulary: { score: 42 }, kanji: { score: 41 }, grammar: { score: 43 } },
      },
      reviewSummary: { dueCount: 5, overdueCount: 8 },
    });
    const prog = LearningPathEngine.evalProgression(state, true);
    expect(prog.nextLevel).toBe('N5');
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.advancementBlockers?.some((b) => b.includes('KANJI') || b.includes('SRS'))).toBe(
      false,
    );
  });

  // ── 25. English SRS overdue does not use JLPT messages ──
  it('25. should use generic SRS blocker message for English users', () => {
    const state = createEnState({
      currentLevel: 'A1',
      reviewSummary: { dueCount: 5, overdueCount: 2 },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain('2 SRS cards overdue for review.');
  });
});
