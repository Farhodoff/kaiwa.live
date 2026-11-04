import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearningProgressionService } from '../LearningProgressionService';
import { DiagnosticService } from '../DiagnosticService';
import { LearningTrackStorage } from '../../utils/storage/LearningTrackStorage';
import { LearningOrchestrator } from '../LearningOrchestrator';

describe('LearningProgressionService - Phase E Progression & Candidate Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("1. diagnostic current levelni o'zgartirmaydi", () => {
    // Set current level initially to A1
    LearningTrackStorage.setCurrentLevel('en', 'A1');

    const answers = [
      { questionId: 'diag-en-a1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-a2-g1', selectedOptionIndex: 2, isCorrect: true },
      { questionId: 'diag-en-b1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-b2-g1', selectedOptionIndex: 1, isCorrect: true },
    ];

    // This would recommend B2/C1, but shouldn't change the confirmed level directly
    DiagnosticService.evaluateDiagnosticAnswers('test-user', 'en', 'standard', 'A1', answers);

    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A1');
  });

  it('2. diagnostic recommendation saqlanadi', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');

    const answers = [
      { questionId: 'diag-en-a1-g1', selectedOptionIndex: 1, isCorrect: true },
      { questionId: 'diag-en-a2-g1', selectedOptionIndex: 2, isCorrect: true },
    ];

    const result = DiagnosticService.evaluateDiagnosticAnswers(
      'test-user',
      'en',
      'standard',
      'A1',
      answers,
    );
    const retrieved = DiagnosticService.getLatestDiagnosticResult('test-user', 'en');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.recommendedStartLevel).toBe(result.recommendedStartLevel);

    // Assert that a promotion candidate has been created instead of direct level modification
    const candidate = LearningTrackStorage.getPromotionCandidate('en');
    expect(candidate).not.toBeNull();
    expect(candidate?.candidateLevel).toBe(result.recommendedStartLevel);
    expect(candidate?.status).toBe('pending');
  });

  it('3. evidence threshold candidate yaratadi', async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');

    // Mock a state that satisfies progression criteria (canAdvance = true)
    const mockState = {
      userId: 'test-user',
      primaryLanguage: 'en' as const,
      currentLevel: 'A1',
      completedLessonsCount: 15,
      signalsSummary: { recentMistakesCount: 0 },
      reviewSummary: { overdueCount: 0 },
      masteryProfile: {
        skills: {
          grammar: { score: 85, confidence: 95 },
          vocabulary: { score: 85, confidence: 95 },
          reading: { score: 85, confidence: 95 },
          listening: { score: 85, confidence: 95 },
        },
      },
    };

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(mockState as any);

    const candidate = await LearningProgressionService.evaluatePromotion('test-user', 'en');
    expect(candidate).not.toBeNull();
    expect(candidate?.candidateLevel).toBe('A2');
    expect(candidate?.status).toBe('pending');
  });

  it('4. threshold yetmasa candidate yaratilmaydi', async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');

    // Mock a state that does NOT satisfy progression criteria (low mastery)
    const mockState = {
      userId: 'test-user',
      primaryLanguage: 'en' as const,
      currentLevel: 'A1',
      completedLessonsCount: 1,
      signalsSummary: { recentMistakesCount: 0 },
      reviewSummary: { overdueCount: 0 },
      masteryProfile: {
        skills: {
          grammar: { score: 40, confidence: 95 },
          vocabulary: { score: 40, confidence: 95 },
        },
      },
    };

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(mockState as any);

    const candidate = await LearningProgressionService.evaluatePromotion('test-user', 'en');
    expect(candidate).toBeNull();
  });

  it("5. candidate current levelni o'zgartirmaydi", async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');

    const mockState = {
      userId: 'test-user',
      primaryLanguage: 'en' as const,
      currentLevel: 'A1',
      completedLessonsCount: 15,
      signalsSummary: { recentMistakesCount: 0 },
      reviewSummary: { overdueCount: 0 },
      masteryProfile: {
        skills: {
          grammar: { score: 85, confidence: 95 },
          vocabulary: { score: 85, confidence: 95 },
          reading: { score: 85, confidence: 95 },
          listening: { score: 85, confidence: 95 },
        },
      },
    };

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(mockState as any);

    await LearningProgressionService.evaluatePromotion('test-user', 'en');

    // Verified level remains A1
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A1');
  });

  it("6. confirm candidate current levelni o'zgartiradi", async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');

    const mockState = {
      userId: 'test-user',
      primaryLanguage: 'en' as const,
      currentLevel: 'A1',
      completedLessonsCount: 15,
      signalsSummary: { recentMistakesCount: 0 },
      reviewSummary: { overdueCount: 0 },
      masteryProfile: {
        skills: {
          grammar: { score: 85, confidence: 95 },
          vocabulary: { score: 85, confidence: 95 },
          reading: { score: 85, confidence: 95 },
          listening: { score: 85, confidence: 95 },
        },
      },
    };

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(mockState as any);

    await LearningProgressionService.evaluatePromotion('test-user', 'en');

    const result = await LearningProgressionService.confirmPromotion('test-user', 'en');
    expect(result.promoted).toBe(true);
    expect(result.newLevel).toBe('A2');

    // Verified level updated in Storage
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A2');
  });

  it("7. dismiss candidate current levelni o'zgartirmaydi", async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');

    const mockState = {
      userId: 'test-user',
      primaryLanguage: 'en' as const,
      currentLevel: 'A1',
      completedLessonsCount: 15,
      signalsSummary: { recentMistakesCount: 0 },
      reviewSummary: { overdueCount: 0 },
      masteryProfile: {
        skills: {
          grammar: { score: 85, confidence: 95 },
          vocabulary: { score: 85, confidence: 95 },
          reading: { score: 85, confidence: 95 },
          listening: { score: 85, confidence: 95 },
        },
      },
    };

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(mockState as any);

    await LearningProgressionService.evaluatePromotion('test-user', 'en');

    // Dismiss
    LearningProgressionService.dismissPromotion('en');

    const candidate = LearningTrackStorage.getPromotionCandidate('en');
    expect(candidate?.status).toBe('dismissed');
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A1');
  });

  it("8. EN promotion JA state'ni o'zgartirmaydi", async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    LearningTrackStorage.setCurrentLevel('ja', 'N5');

    const mockState = {
      userId: 'test-user',
      primaryLanguage: 'en' as const,
      currentLevel: 'A1',
      completedLessonsCount: 15,
      signalsSummary: { recentMistakesCount: 0 },
      reviewSummary: { overdueCount: 0 },
      masteryProfile: {
        skills: {
          grammar: { score: 85, confidence: 95 },
          vocabulary: { score: 85, confidence: 95 },
          reading: { score: 85, confidence: 95 },
          listening: { score: 85, confidence: 95 },
        },
      },
    };

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(mockState as any);

    // Evaluate and confirm EN
    await LearningProgressionService.evaluatePromotion('test-user', 'en');
    await LearningProgressionService.confirmPromotion('test-user', 'en');

    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A2');
    expect(LearningTrackStorage.getCurrentLevel('ja')).toBe('N5');
    expect(LearningTrackStorage.getPromotionCandidate('ja')).toBeNull();
  });

  it("9. JA promotion EN state'ni o'zgartirmaydi", async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    LearningTrackStorage.setCurrentLevel('ja', 'N5');

    const mockState = {
      userId: 'test-user',
      primaryLanguage: 'ja' as const,
      currentLevel: 'N5',
      completedLessonsCount: 15,
      signalsSummary: { recentMistakesCount: 0 },
      reviewSummary: { overdueCount: 0 },
      masteryProfile: {
        skills: {
          grammar: { score: 85, confidence: 95 },
          vocabulary: { score: 85, confidence: 95 },
          reading: { score: 85, confidence: 95 },
          listening: { score: 85, confidence: 95 },
          kanji: { score: 85, confidence: 95 },
        },
      },
    };

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(mockState as any);

    // Evaluate and confirm JA
    await LearningProgressionService.evaluatePromotion('test-user', 'ja');
    await LearningProgressionService.confirmPromotion('test-user', 'ja');

    expect(LearningTrackStorage.getCurrentLevel('ja')).toBe('N4');
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A1');
    expect(LearningTrackStorage.getPromotionCandidate('en')).toBeNull();
  });

  it('10. candidate higher-level lesson access bermaydi', async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');

    const mockState = {
      userId: 'test-user',
      primaryLanguage: 'en' as const,
      currentLevel: 'A1',
      completedLessonsCount: 15,
      signalsSummary: { recentMistakesCount: 0 },
      reviewSummary: { overdueCount: 0 },
      masteryProfile: {
        skills: {
          grammar: { score: 85, confidence: 95 },
          vocabulary: { score: 85, confidence: 95 },
          reading: { score: 85, confidence: 95 },
          listening: { score: 85, confidence: 95 },
        },
      },
    };

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(mockState as any);

    // Created A2 candidate
    await LearningProgressionService.evaluatePromotion('test-user', 'en');

    // Assert cannot access an A2 lesson yet because candidate is not confirmed
    const access = LearningProgressionService.canAccessLesson('en-a2-u1-l1', 'test-user', 'en');
    expect(access.allowed).toBe(false);
    expect(access.reason).toContain('requires level A2');
  });

  it('11. repeated evaluation duplicate candidate yaratmaydi', async () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');

    const mockState = {
      userId: 'test-user',
      primaryLanguage: 'en' as const,
      currentLevel: 'A1',
      completedLessonsCount: 15,
      signalsSummary: { recentMistakesCount: 0 },
      reviewSummary: { overdueCount: 0 },
      masteryProfile: {
        skills: {
          grammar: { score: 85, confidence: 95 },
          vocabulary: { score: 85, confidence: 95 },
          reading: { score: 85, confidence: 95 },
          listening: { score: 85, confidence: 95 },
        },
      },
    };

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(mockState as any);

    const cand1 = await LearningProgressionService.evaluatePromotion('test-user', 'en');
    const time1 = cand1?.createdAt;

    // Second evaluation immediately after
    const cand2 = await LearningProgressionService.evaluatePromotion('test-user', 'en');

    expect(cand2?.createdAt).toBe(time1); // Shouldn't recreate or change createdAt
  });

  it('12. lower-level downgrade avtomatik emas', async () => {
    LearningTrackStorage.setCurrentLevel('en', 'B1');

    // Even if user state indicates poor performance or mistakes,
    // no downgrade candidate or automatic level change is made.
    const mockState = {
      userId: 'test-user',
      primaryLanguage: 'en' as const,
      currentLevel: 'B1',
      completedLessonsCount: 20,
      signalsSummary: { recentMistakesCount: 10 },
      reviewSummary: { overdueCount: 5 },
      masteryProfile: {
        skills: {
          grammar: { score: 30, confidence: 95 },
          vocabulary: { score: 30, confidence: 95 },
        },
      },
    };

    vi.spyOn(LearningOrchestrator, 'getUserLearningState').mockResolvedValue(mockState as any);

    const candidate = await LearningProgressionService.evaluatePromotion('test-user', 'en');
    expect(candidate).toBeNull(); // No higher level candidate

    // Still at B1
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('B1');
  });

  it('13. legacy users uchun storage migration buzilmaydi', () => {
    // Mock older shared key in localStorage
    localStorage.setItem('study_planner_current_level', 'B1');

    // Migration should map it correctly to study_planner_current_level_en
    const level = LearningTrackStorage.getCurrentLevel('en');

    expect(level).toBe('B1');
    expect(localStorage.getItem('study_planner_current_level_en')).toBe('B1');
    expect(localStorage.getItem('study_planner_current_level')).toBeNull(); // Cleaned up
  });
});
