import { describe, it, expect, beforeEach } from 'vitest';
import { LearningPathEngine } from '../LearningPathEngine';

/**
 * PHASE 8.9 — JAPANESE PROGRESSION TRACK
 * 25+ deterministic, language-isolated ZERO → N5 → N4 → N3 → N2 → N1 tests.
 */
describe('Phase 8.9 — Japanese Progression Track', () => {
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

  // ── 1. ZERO → N5 baseline ──
  it('1. should promote ZERO user to N5 with minimal foundation evidence', () => {
    const state = createJaState({
      currentLevel: 'ZERO',
      completedLessonsCount: 1,
      masteryProfile: {
        skills: { vocabulary: { score: 45 }, kanji: { score: 45 }, grammar: { score: 45 } },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, true);
    expect(prog.nextLevel).toBe('N5');
    expect(prog.isReadyForPromotion).toBe(true);
  });

  // ── 2. N5 → N4 READY ──
  it('2. should promote N5 user to N4 when all evidence is sufficient', () => {
    const state = createJaState({ currentLevel: 'N5' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.nextLevel).toBe('N4');
  });

  // ── 3. N5 → N4 BLOCKED ──
  it('3. should block N5 to N4 when lessons are insufficient', () => {
    const state = createJaState({
      currentLevel: 'N5',
      completedLessonsCount: 0,
      diagnosticBaseline: false,
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers?.some((b) => b.includes('Completed Lessons'))).toBe(true);
  });

  // ── 4. N4 → N3 READY ──
  it('4. should promote N4 user to N3 when all evidence is sufficient', () => {
    const state = createJaState({ currentLevel: 'N4' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.nextLevel).toBe('N3');
  });

  // ── 5. N4 → N3 BLOCKED ──
  it('5. should block N4 to N3 when overall mastery is below threshold', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 55 },
          kanji: { score: 55 },
          grammar: { score: 55 },
          reading: { score: 55 },
          listening: { score: 55 },
          speaking: { score: 55 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers?.some((b) => b.includes('Overall Mastery'))).toBe(true);
  });

  // ── 6. N3 → N2 READY ──
  it('6. should promote N3 user to N2 when all evidence is sufficient', () => {
    const state = createJaState({ currentLevel: 'N3' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.nextLevel).toBe('N2');
  });

  // ── 7. N3 → N2 BLOCKED ──
  it('7. should block N3 to N2 when a skill is critically low', () => {
    const state = createJaState({
      currentLevel: 'N3',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 78 },
          grammar: { score: 82 },
          reading: { score: 75 },
          listening: { score: 45 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers?.some((b) => b.includes('LISTENING'))).toBe(true);
  });

  // ── 8. N2 → N1 READY ──
  it('8. should promote N2 user to N1 when all evidence is sufficient', () => {
    const state = createJaState({ currentLevel: 'N2' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.nextLevel).toBe('N1');
  });

  // ── 9. N2 → N1 BLOCKED ──
  it('9. should block N2 to N1 when repeated mistakes exceed threshold', () => {
    const state = createJaState({
      currentLevel: 'N2',
      signalsSummary: { recentMistakesCount: 6, recentMistakeTopics: ['Keigo'] },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers?.some((b) => b.includes('recent repeated mistakes'))).toBe(
      true,
    );
  });

  // ── 10. N1 terminal state ──
  it('10. should mark N1 as terminal with no next level', () => {
    const state = createJaState({ currentLevel: 'N1', targetLevel: 'N1' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.nextLevel).toBeNull();
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.recommendedAction).toBe('Maintain and deepen advanced Japanese skills');
  });

  // ── 11. Diagnostic missing ──
  it('11. should block promotion when Japanese diagnostic is missing', () => {
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
    expect(prog.missingEvidence).toContain('Diagnostic Baseline');
  });

  // ── 12. Diagnostic confidence < 50 ──
  it('12. should block promotion when Japanese diagnostic confidence is below 50', () => {
    localStorage.setItem(
      'study_planner_diag_result_test-user_ja',
      JSON.stringify({
        userId: 'test-user',
        language: 'ja',
        overallConfidence: 45,
      }),
    );
    const state = createJaState({ currentLevel: 'N4' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain(
      'Japanese diagnostic confidence is 45%, minimum is 50%.',
    );
  });

  // ── 13. Diagnostic confidence >= 50 ──
  it('13. should allow promotion when Japanese diagnostic confidence is 50 or above', () => {
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

  // ── 14. Kanji < 60 blocker ──
  it('14. should block promotion when Kanji mastery is below 60%', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 45 },
          grammar: { score: 82 },
          reading: { score: 75 },
          listening: { score: 72 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers?.some((b) => b.includes('KANJI'))).toBe(true);
    expect(prog.advancementBlockers?.some((b) => b.includes('below 60%'))).toBe(true);
  });

  // ── 15. Grammar < 60 blocker ──
  it('15. should block promotion when Grammar mastery is below 60%', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 78 },
          grammar: { score: 50 },
          reading: { score: 75 },
          listening: { score: 72 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers?.some((b) => b.includes('GRAMMAR'))).toBe(true);
  });

  // ── 16. Reading < 60 blocker ──
  it('16. should block promotion when Reading mastery is below 60%', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 78 },
          grammar: { score: 82 },
          reading: { score: 40 },
          listening: { score: 72 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers?.some((b) => b.includes('READING'))).toBe(true);
  });

  // ── 17. Listening < 60 blocker ──
  it('17. should block promotion when Listening mastery is below 60%', () => {
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
    expect(prog.advancementBlockers?.some((b) => b.includes('LISTENING'))).toBe(true);
  });

  // ── 18. Evidence yo'q skill promotionni block QILMASLIGI ──
  it('18. should NOT block promotion for skills with no evidence', () => {
    // Only kanji and grammar have evidence — others are absent from masteryProfile
    const state = createJaState({
      currentLevel: 'N5',
      masteryProfile: {
        skills: {
          kanji: { score: 75 },
          grammar: { score: 75 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    // Evidence-missing skills should NOT produce blockers
    expect(prog.advancementBlockers?.every((b) => !b.includes('VOCABULARY'))).toBe(true);
    expect(prog.advancementBlockers?.every((b) => !b.includes('READING'))).toBe(true);
    expect(prog.advancementBlockers?.every((b) => !b.includes('LISTENING'))).toBe(true);
    expect(prog.advancementBlockers?.every((b) => !b.includes('SPEAKING'))).toBe(true);
  });

  // ── 19. Recent mistakes blocker ──
  it('19. should block promotion when recent repeated mistakes >= 5', () => {
    const state = createJaState({
      currentLevel: 'N4',
      signalsSummary: { recentMistakesCount: 7, recentMistakeTopics: ['Te-form'] },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers?.some((b) => b.includes('recent repeated mistakes'))).toBe(
      true,
    );
    expect(prog.recommendedAction).toBe('Review recent Japanese mistakes');
  });

  // ── 20. Overall mastery < 70 ──
  it('20. should block promotion when overall mastery is below 70%', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 65 },
          kanji: { score: 60 },
          grammar: { score: 65 },
          reading: { score: 60 },
          listening: { score: 60 },
          speaking: { score: 60 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers?.some((b) => b.includes('Overall Mastery'))).toBe(true);
  });

  // ── 21. Completed lessons < required ──
  it('21. should block promotion when completed lessons are below threshold', () => {
    const state = createJaState({ currentLevel: 'N4', completedLessonsCount: 1 });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(false);
    expect(prog.advancementBlockers).toContain('Completed Lessons (1/2) is below threshold.');
  });

  // ── 22. Weakest skill detection ──
  it('22. should detect the weakest skill from Japanese evidence', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 42 },
          grammar: { score: 82 },
          reading: { score: 75 },
          listening: { score: 72 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.weakestSkill).toBe('kanji');
  });

  // ── 23. Recommended action ──
  it('23. should recommend improving weak skill when blocked by skill mastery', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 45 },
          grammar: { score: 82 },
          reading: { score: 75 },
          listening: { score: 72 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.recommendedAction).toBe('Improve kanji before promotion');
  });

  // ── 24. Japanese/English isolation ──
  it('24a. should never expose JLPT levels to English users', () => {
    const state = createEnState({ currentLevel: 'A1' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.nextLevel).toBe('A2');
    const jlptLevels = ['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1'];
    expect(jlptLevels).not.toContain(prog.nextLevel);
    // No KANJI blocker for English users
    expect(prog.advancementBlockers?.every((b) => !b.includes('KANJI'))).toBe(true);
  });

  it('24b. should never expose CEFR/IELTS levels to Japanese users', () => {
    const state = createJaState({ currentLevel: 'N4' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.nextLevel).toBe('N3');
    const cefrLevels = [
      'A1',
      'A2',
      'B1',
      'B2',
      'C1',
      'C2',
      'IELTS Foundation',
      'IELTS 5.5',
      'IELTS 6.0',
    ];
    expect(cefrLevels).not.toContain(prog.nextLevel);
  });

  // ── 25. English regression ──
  it('25. should not change English progression behavior', () => {
    const state = createEnState({ currentLevel: 'A1', completedLessonsCount: 3 });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.isReadyForPromotion).toBe(true);
    expect(prog.nextLevel).toBe('A2');
    expect(prog.recommendedAction).toBe('Start A2 curriculum.');
  });

  // ── Additional deterministic tests ──

  it('26. should isolate English diagnostic results from Japanese promotion', () => {
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
    // Low-confidence ENGLISH diagnostic must NOT block JAPANESE promotion
    expect(prog.isReadyForPromotion).toBe(true);
  });

  it('27. should compute readiness score deterministically', () => {
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
    // avgMastery=80, diagWeight=1, readiness = 80*0.6*1 + 2*5 + 10 = 68
    expect(prog.readinessScore).toBe(68);
    expect(prog.readinessScore).toBeGreaterThanOrEqual(0);
    expect(prog.readinessScore).toBeLessThanOrEqual(100);
  });

  it('28. should produce identical outputs for identical Japanese inputs (determinism)', () => {
    const state = createJaState({ currentLevel: 'N4' });
    const first = LearningPathEngine.evalProgression(state, false);
    const second = LearningPathEngine.evalProgression(state, false);
    expect(first).toEqual(second);
  });

  it('29. should recommend taking diagnostic when diagnostic is missing', () => {
    const state = createJaState({
      currentLevel: 'N4',
      completedLessonsCount: 0,
      diagnosticBaseline: false,
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.recommendedAction).toBe('Take the Japanese diagnostic assessment');
  });

  it('30. should recommend continue to next level when ready', () => {
    const state = createJaState({ currentLevel: 'N4' });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.recommendedAction).toBe('Continue to N3');
  });

  it('31. should not apply skill blockers at ZERO level', () => {
    const state = createJaState({
      currentLevel: 'ZERO',
      completedLessonsCount: 1,
      masteryProfile: {
        skills: { vocabulary: { score: 42 }, kanji: { score: 41 }, grammar: { score: 43 } },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, true);
    expect(prog.nextLevel).toBe('N5');
    expect(prog.isReadyForPromotion).toBe(true);
    expect(
      prog.advancementBlockers?.some(
        (b) => b.includes('KANJI') || b.includes('GRAMMAR') || b.includes('VOCABULARY'),
      ),
    ).toBe(false);
  });

  it('32. should format blocker message with score and threshold', () => {
    const state = createJaState({
      currentLevel: 'N4',
      masteryProfile: {
        skills: {
          vocabulary: { score: 80 },
          kanji: { score: 38 },
          grammar: { score: 82 },
          reading: { score: 75 },
          listening: { score: 72 },
          speaking: { score: 74 },
        },
      },
    });
    const prog = LearningPathEngine.evalProgression(state, false);
    expect(prog.advancementBlockers).toContain('KANJI mastery is below 60% (38% < 60%).');
  });

  it('33. should handle complete level progression chain deterministically', () => {
    const levels = ['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1'];
    for (let i = 0; i < levels.length - 1; i++) {
      const state = createJaState({
        currentLevel: levels[i],
        completedLessonsCount: levels[i] === 'ZERO' ? 1 : 2,
      });
      const prog = LearningPathEngine.evalProgression(state, levels[i] === 'ZERO');
      if (i < levels.length - 1) {
        expect(prog.nextLevel).toBe(levels[i + 1]);
      }
    }
    // N1 has no next level
    const n1State = createJaState({ currentLevel: 'N1', targetLevel: 'N1' });
    const n1Prog = LearningPathEngine.evalProgression(n1State, false);
    expect(n1Prog.nextLevel).toBeNull();
  });
});
