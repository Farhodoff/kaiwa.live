/**
 * Regression tests: Diagnostic → Level → Next Lesson pipeline
 *
 * Verifies:
 * 1. Diagnostic result correctly determines the confirmed starting level candidate
 * 2. Diagnostic recommendation is not silently overwritten by stale localStorage state
 * 3. The confirmed level (after confirmPromotion) becomes the SOT for Learning Path
 * 4. Next lesson is selected from the correct language and correct level
 * 5. English diagnostic never produces Japanese lessons
 * 6. Japanese diagnostic never produces English lessons
 * 7. After diagnostic, recommendedFirstLessonId is honoured when accessible
 * 8. If recommendedFirstLessonId is unavailable/invalid, fallback to valid lesson
 * 9. Existing promotion logic is not broken
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiagnosticService } from '../DiagnosticService';
import { LearningTrackStorage } from '../../utils/storage/LearningTrackStorage';
import { LearningProgressionService } from '../LearningProgressionService';

// ─── minimal supabase mock ───────────────────────────────────────────────────
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────
function makeEnDiagResult(
  overrides: Partial<{
    recommendedStartLevel: string;
    recommendedFirstLessonId: string;
    diagnosticLevel: string;
    overallScore: number;
  }> = {},
) {
  return {
    id: `diag-en-${Date.now()}`,
    userId: 'guest',
    language: 'en' as const,
    mode: 'standard' as const,
    claimedLevel: 'A1',
    diagnosticLevel: overrides.diagnosticLevel ?? 'B1',
    recommendedStartLevel: overrides.recommendedStartLevel ?? 'B1',
    overallConfidence: 80,
    overallScore: overrides.overallScore ?? 75,
    skills: {},
    strengths: [],
    weaknesses: [],
    recommendedFirstLessonId: overrides.recommendedFirstLessonId ?? 'en-b1-u1-l1',
    completedAt: new Date().toISOString(),
  };
}

function makeJaDiagResult(
  overrides: Partial<{
    recommendedStartLevel: string;
    recommendedFirstLessonId: string;
  }> = {},
) {
  return {
    id: `diag-ja-${Date.now()}`,
    userId: 'guest',
    language: 'ja' as const,
    mode: 'standard' as const,
    claimedLevel: 'N5',
    diagnosticLevel: overrides.recommendedStartLevel ?? 'N4',
    recommendedStartLevel: overrides.recommendedStartLevel ?? 'N4',
    overallConfidence: 80,
    overallScore: 75,
    skills: {},
    strengths: [],
    weaknesses: [],
    recommendedFirstLessonId: overrides.recommendedFirstLessonId ?? 'ja-n4-u1-l1',
    completedAt: new Date().toISOString(),
  };
}

// ─── tests ───────────────────────────────────────────────────────────────────
describe('Diagnostic → Level → Next Lesson Pipeline', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set language explicitly so tests are deterministic
    localStorage.setItem('study_planner_primary_language', 'en');
  });

  // 1. Diagnostic creates a candidate, never directly sets currentLevel
  it('1. diagnostic creates candidate; currentLevel stays unchanged', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    DiagnosticService.saveDiagnosticResult(makeEnDiagResult({ recommendedStartLevel: 'B1' }));

    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A1');
    const candidate = LearningTrackStorage.getPromotionCandidate('en');
    expect(candidate).not.toBeNull();
    expect(candidate!.candidateLevel).toBe('B1');
    expect(candidate!.status).toBe('pending');
    expect(candidate!.requiredThreshold).toBe(0); // diagnostic marker
  });

  // 2. Diagnostic recommendation is not overwritten by stale localStorage state
  it('2. re-saving a newer diagnostic overwrites stale candidate', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    // First diagnostic
    DiagnosticService.saveDiagnosticResult(makeEnDiagResult({ recommendedStartLevel: 'A2' }));
    // Newer diagnostic (user retook it)
    DiagnosticService.saveDiagnosticResult(makeEnDiagResult({ recommendedStartLevel: 'B1' }));

    const candidate = LearningTrackStorage.getPromotionCandidate('en');
    expect(candidate!.candidateLevel).toBe('B1'); // latest wins
  });

  // 3. Confirmed level becomes the SOT for the learning path
  it('3. after confirmPromotion, currentLevel reflects the promoted level', async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    DiagnosticService.saveDiagnosticResult(makeEnDiagResult({ recommendedStartLevel: 'B1' }));

    const result = await LearningProgressionService.confirmPromotion('guest', 'en');
    expect(result.promoted).toBe(true);
    expect(result.newLevel).toBe('B1');
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('B1');
  });

  // 4. English diagnostic candidate references English level
  it('4. English diagnostic candidate only covers EN level', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    LearningTrackStorage.setCurrentLevel('ja', 'N5');
    DiagnosticService.saveDiagnosticResult(makeEnDiagResult({ recommendedStartLevel: 'B1' }));

    const enCandidate = LearningTrackStorage.getPromotionCandidate('en');
    const jaCandidate = LearningTrackStorage.getPromotionCandidate('ja');
    expect(enCandidate).not.toBeNull();
    expect(jaCandidate).toBeNull(); // no JA candidate created
  });

  // 5. English diagnostic must never produce a Japanese candidate
  it('5. English diagnostic creates no Japanese candidate', () => {
    DiagnosticService.saveDiagnosticResult(makeEnDiagResult());
    expect(LearningTrackStorage.getPromotionCandidate('ja')).toBeNull();
  });

  // 6. Japanese diagnostic must never produce an English candidate
  it('6. Japanese diagnostic creates no English candidate', () => {
    LearningTrackStorage.setCurrentLevel('ja', 'N5');
    DiagnosticService.saveDiagnosticResult(makeJaDiagResult());
    expect(LearningTrackStorage.getPromotionCandidate('en')).toBeNull();
  });

  // 7. recommendedFirstLessonId is honoured by getNextLessonDetail when accessible
  it('7. pending diagnostic candidate causes getNextLessonDetail to honour recommendedFirstLessonId (accessible)', async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    // At A1, en-a1-u1-l1 IS accessible in the roadmap
    DiagnosticService.saveDiagnosticResult(
      makeEnDiagResult({
        recommendedStartLevel: 'A1',
        recommendedFirstLessonId: 'en-a1-u1-l1',
        diagnosticLevel: 'A1',
      }),
    );

    const result = await LearningProgressionService.getNextLessonDetail('guest', 'en');
    expect(result.lesson).not.toBeNull();
    // Should not be a Japanese lesson
    expect(result.lesson!.id).toMatch(/^en-/);
    // Should be at the A1 level
    expect(result.lesson!.id).toContain('a1');
  });

  // 8. If recommendedFirstLessonId is invalid/unavailable, fall back to a valid accessible lesson
  it('8. invalid recommendedFirstLessonId falls back to a valid accessible lesson', async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    DiagnosticService.saveDiagnosticResult(
      makeEnDiagResult({
        recommendedStartLevel: 'A1',
        recommendedFirstLessonId: 'en-NONEXISTENT-lesson-xyz',
        diagnosticLevel: 'A1',
      }),
    );

    const result = await LearningProgressionService.getNextLessonDetail('guest', 'en');
    // Fallback must return a valid EN lesson, never null
    expect(result.lesson).not.toBeNull();
    expect(result.lesson!.id).toMatch(/^en-/);
    expect(result.bucket).not.toBe('none');
  });

  // 9. Cross-language: EN diagnostic never returns JA lesson
  it('9. EN diagnostic: getNextLessonDetail returns EN lesson', async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    DiagnosticService.saveDiagnosticResult(
      makeEnDiagResult({
        recommendedStartLevel: 'A1',
        recommendedFirstLessonId: 'en-a1-u1-l1',
        diagnosticLevel: 'A1',
      }),
    );
    localStorage.setItem('study_planner_primary_language', 'en');

    const result = await LearningProgressionService.getNextLessonDetail('guest', 'en');
    expect(result.lesson).not.toBeNull();
    expect(result.lesson!.id).not.toMatch(/^ja-/);
  });

  // 10. Cross-language: JA diagnostic never returns EN lesson
  it('10. JA diagnostic: getNextLessonDetail returns JA lesson', async () => {
    LearningTrackStorage.setCurrentLevel('ja', 'N5');
    localStorage.setItem('study_planner_primary_language', 'ja');
    DiagnosticService.saveDiagnosticResult(
      makeJaDiagResult({
        recommendedStartLevel: 'N5',
        recommendedFirstLessonId: 'ja-n5-u1-l1',
      }),
    );

    const result = await LearningProgressionService.getNextLessonDetail('guest', 'ja');
    expect(result.lesson).not.toBeNull();
    expect(result.lesson!.id).not.toMatch(/^en-/);
  });

  // 11. After confirmPromotion, no pending candidate exists
  it('11. confirmPromotion clears the pending candidate', async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    DiagnosticService.saveDiagnosticResult(makeEnDiagResult({ recommendedStartLevel: 'A2' }));

    await LearningProgressionService.confirmPromotion('guest', 'en');
    const candidate = LearningTrackStorage.getPromotionCandidate('en');
    // Candidate should be confirmed (not pending anymore)
    expect(candidate?.status).not.toBe('pending');
  });

  // 12. dismissPromotion leaves currentLevel unchanged
  it('12. dismissPromotion leaves currentLevel unchanged', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    DiagnosticService.saveDiagnosticResult(makeEnDiagResult({ recommendedStartLevel: 'B1' }));

    LearningProgressionService.dismissPromotion('en');
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A1');
    expect(LearningTrackStorage.getPromotionCandidate('en')!.status).toBe('dismissed');
  });

  // 13. Zero-level result for EN sets A1 candidate or no candidate (A1 is already current)
  it('13. zero-level EN result recommends A1, no candidate created if already A1', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    const result = DiagnosticService.getZeroLevelResult('guest', 'en');
    DiagnosticService.saveDiagnosticResult(result);
    // recommendedStartLevel = A1 = currentLevel, so no candidate should be created
    const candidate = LearningTrackStorage.getPromotionCandidate('en');
    expect(candidate).toBeNull();
  });

  // 14. Zero-level result for JA sets N5 candidate or no candidate if already N5
  it('14. zero-level JA result recommends N5, no candidate created if already N5', () => {
    LearningTrackStorage.setCurrentLevel('ja', 'N5');
    const result = DiagnosticService.getZeroLevelResult('guest', 'ja');
    DiagnosticService.saveDiagnosticResult(result);
    const candidate = LearningTrackStorage.getPromotionCandidate('ja');
    expect(candidate).toBeNull();
  });
});
