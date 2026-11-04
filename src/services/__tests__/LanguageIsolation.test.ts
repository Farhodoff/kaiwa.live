import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LearningTrackStorage } from '../../utils/storage/LearningTrackStorage';
import { LearningOrchestrator } from '../../services/LearningOrchestrator';
import { LearningSignalService } from '../../services/LearningSignalService';
import { DiagnosticService } from '../../services/DiagnosticService';
import { CurriculumLessonResolver } from '../CurriculumLessonResolver';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
      updateUser: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('Phase 15.1 — Language Isolation Hardening', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. English current level isolation', () => {
    LearningTrackStorage.setCurrentLevel('en', 'B2');
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('B2');
    expect(localStorage.getItem('study_planner_current_level_en')).toBe('B2');
  });

  it('2. Japanese current level isolation', () => {
    LearningTrackStorage.setCurrentLevel('ja', 'N3');
    expect(LearningTrackStorage.getCurrentLevel('ja')).toBe('N3');
    expect(localStorage.getItem('study_planner_current_level_ja')).toBe('N3');
  });

  it('3. English target level isolation', () => {
    LearningTrackStorage.setTargetLevel('en', 'C1');
    expect(LearningTrackStorage.getTargetLevel('en')).toBe('C1');
    expect(localStorage.getItem('study_planner_target_level_en')).toBe('C1');
  });

  it('4. Japanese target level isolation', () => {
    LearningTrackStorage.setTargetLevel('ja', 'N2');
    expect(LearningTrackStorage.getTargetLevel('ja')).toBe('N2');
    expect(localStorage.getItem('study_planner_target_level_ja')).toBe('N2');
  });

  it('5. English target goal isolation', () => {
    LearningTrackStorage.setTargetGoal('en', 'IELTS 7.5+');
    expect(LearningTrackStorage.getTargetGoal('en')).toBe('IELTS 7.5+');
    expect(localStorage.getItem('study_planner_target_goal_en')).toBe('IELTS 7.5+');
  });

  it('6. Japanese target goal isolation', () => {
    LearningTrackStorage.setTargetGoal('ja', 'JLPT N1 Pass');
    expect(LearningTrackStorage.getTargetGoal('ja')).toBe('JLPT N1 Pass');
    expect(localStorage.getItem('study_planner_target_goal_ja')).toBe('JLPT N1 Pass');
  });

  it('7. EN promotion does not affect JA', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    LearningTrackStorage.setCurrentLevel('ja', 'N5');
    LearningTrackStorage.setCurrentLevel('en', 'A2');
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A2');
    expect(LearningTrackStorage.getCurrentLevel('ja')).toBe('N5');
  });

  it('8. JA promotion does not affect EN', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A2');
    LearningTrackStorage.setCurrentLevel('ja', 'N5');
    LearningTrackStorage.setCurrentLevel('ja', 'N4');
    expect(LearningTrackStorage.getCurrentLevel('ja')).toBe('N4');
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A2');
  });

  it('9. EN diagnostic does not affect JA (Phase E: candidate only)', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A1');
    LearningTrackStorage.setCurrentLevel('ja', 'N5');
    DiagnosticService.saveDiagnosticResult({
      id: 'test-en-diag',
      userId: 'test-user',
      language: 'en',
      mode: 'standard',
      claimedLevel: 'A1',
      diagnosticLevel: 'B1',
      recommendedStartLevel: 'B1',
      overallConfidence: 80,
      overallScore: 80,
      skills: {},
      strengths: [],
      weaknesses: [],
      recommendedFirstLessonId: 'en-a1-u1-l1',
      completedAt: new Date().toISOString(),
    });
    // Phase E: diagnostic must NOT change currentLevel directly — only a candidate is created
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A1');
    expect(LearningTrackStorage.getCurrentLevel('ja')).toBe('N5');
    // A promotion candidate must be stored for EN with the recommended level
    const candidate = LearningTrackStorage.getPromotionCandidate('en');
    expect(candidate).not.toBeNull();
    expect(candidate?.candidateLevel).toBe('B1');
    // JA must have no candidate
    expect(LearningTrackStorage.getPromotionCandidate('ja')).toBeNull();
  });

  it('10. JA diagnostic does not affect EN (Phase E: candidate only)', () => {
    LearningTrackStorage.setCurrentLevel('en', 'B1');
    LearningTrackStorage.setCurrentLevel('ja', 'N5');
    DiagnosticService.saveDiagnosticResult({
      id: 'test-ja-diag',
      userId: 'test-user',
      language: 'ja',
      mode: 'standard',
      claimedLevel: 'N5',
      diagnosticLevel: 'N3',
      recommendedStartLevel: 'N3',
      overallConfidence: 75,
      overallScore: 75,
      skills: {},
      strengths: [],
      weaknesses: [],
      recommendedFirstLessonId: 'ja-n5-u1-l1',
      completedAt: new Date().toISOString(),
    });
    // Phase E: diagnostic must NOT change currentLevel directly — only a candidate is created
    expect(LearningTrackStorage.getCurrentLevel('ja')).toBe('N5');
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('B1');
    // A promotion candidate must be stored for JA with the recommended level
    const candidate = LearningTrackStorage.getPromotionCandidate('ja');
    expect(candidate).not.toBeNull();
    expect(candidate?.candidateLevel).toBe('N3');
    // EN must have no candidate
    expect(LearningTrackStorage.getPromotionCandidate('en')).toBeNull();
  });

  it('11. default EN = A1', () => {
    localStorage.clear();
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A1');
  });

  it('12. default JA = N5', () => {
    localStorage.clear();
    expect(LearningTrackStorage.getCurrentLevel('ja')).toBe('N5');
  });

  it('13. EN → JA track switch', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A2');
    LearningTrackStorage.setCurrentLevel('ja', 'N5');
    const target = LearningOrchestrator.getUserTarget('ja');
    expect(target.currentLevel).toBe('N5');
  });

  it('14. JA → EN track switch', () => {
    LearningTrackStorage.setCurrentLevel('en', 'A2');
    LearningTrackStorage.setCurrentLevel('ja', 'N5');
    const target = LearningOrchestrator.getUserTarget('en');
    expect(target.currentLevel).toBe('A2');
  });

  it('15. legacy English migration', () => {
    localStorage.setItem('study_planner_current_level', 'A2');
    localStorage.setItem('study_planner_target_level', 'B1');
    localStorage.setItem('study_planner_target_goal', 'IELTS 6.0');

    LearningTrackStorage.migrateSharedKeys('en');

    expect(localStorage.getItem('study_planner_current_level_en')).toBe('A2');
    expect(localStorage.getItem('study_planner_target_level_en')).toBe('B1');
    expect(localStorage.getItem('study_planner_target_goal_en')).toBe('IELTS 6.0');

    expect(localStorage.getItem('study_planner_current_level')).toBeNull();
    expect(localStorage.getItem('study_planner_target_level')).toBeNull();
    expect(localStorage.getItem('study_planner_target_goal')).toBeNull();
  });

  it('16. legacy Japanese migration', () => {
    localStorage.setItem('study_planner_current_level', 'N4');
    localStorage.setItem('study_planner_target_level', 'N3');
    localStorage.setItem('study_planner_target_goal', 'JLPT Prep');

    LearningTrackStorage.migrateSharedKeys('ja');

    expect(localStorage.getItem('study_planner_current_level_ja')).toBe('N4');
    expect(localStorage.getItem('study_planner_target_level_ja')).toBe('N3');
    expect(localStorage.getItem('study_planner_target_goal_ja')).toBe('JLPT Prep');

    expect(localStorage.getItem('study_planner_current_level')).toBeNull();
    expect(localStorage.getItem('study_planner_target_level')).toBeNull();
    expect(localStorage.getItem('study_planner_target_goal')).toBeNull();
  });

  it('17. existing isolated key must not be overwritten by legacy migration', () => {
    localStorage.setItem('study_planner_current_level_en', 'B2');
    localStorage.setItem('study_planner_current_level', 'A2');

    LearningTrackStorage.migrateSharedKeys('en');

    expect(localStorage.getItem('study_planner_current_level_en')).toBe('B2');
    expect(localStorage.getItem('study_planner_current_level')).toBeNull();
  });

  it('18. reload/persistence isolation (invalid cross-language levels rejected)', () => {
    LearningTrackStorage.setCurrentLevel('en', 'N3');
    expect(LearningTrackStorage.getCurrentLevel('en')).toBe('A1');

    LearningTrackStorage.setCurrentLevel('ja', 'B2');
    expect(LearningTrackStorage.getCurrentLevel('ja')).toBe('N5');
  });

  it('19. canAccessLesson prerequisite check returns missingPrerequisites', () => {
    localStorage.setItem('study_planner_current_level_en', 'A1');
    const result = LearningOrchestrator.canAccessLesson('en-a1-u1-l2', 'test-user', 'en');
    expect(result.allowed).toBe(false);
    expect(result.missingPrerequisites).toContain('en-a1-u1-l1');
  });

  it('20. dynamic curriculum resolver resolves new lessons and sets isAvailable to true', () => {
    const resolved = CurriculumLessonResolver.resolveLesson('en-b1-u1-l2');
    expect(resolved.isAvailable).toBe(true);
    expect(resolved.title).toBe('Present Perfect vs Past Simple');
    expect(resolved.skill).toBe('vocabulary');
  });

  it('21. recent learning activity is strictly language-isolated', () => {
    const uid = 'iso-recent-user';
    LearningSignalService.recordSignal({
      id: 'sig-en-1',
      type: 'incorrect_answer',
      language: 'en',
      lessonId: 'en-a1-u1-l1',
      userId: uid,
      timestamp: new Date().toISOString(),
      stepId: 's1',
      questionId: 'q1',
      prompt: 'p',
      userAnswer: 'a',
      expectedAnswer: 'b',
      attemptCount: 1,
    });
    LearningSignalService.recordSignal({
      id: 'sig-ja-1',
      type: 'incorrect_answer',
      language: 'ja',
      lessonId: 'ja-n5-u1-l1',
      userId: uid,
      timestamp: new Date().toISOString(),
      stepId: 's1',
      questionId: 'q1',
      prompt: 'p',
      userAnswer: 'a',
      expectedAnswer: 'b',
      attemptCount: 1,
    });

    const enActivity = LearningOrchestrator.getRecentLearningActivity(uid, 'en');
    const jaActivity = LearningOrchestrator.getRecentLearningActivity(uid, 'ja');

    expect(enActivity.recentLessonIds).toContain('en-a1-u1-l1');
    expect(enActivity.recentLessonIds).not.toContain('ja-n5-u1-l1');
    expect(jaActivity.recentLessonIds).toContain('ja-n5-u1-l1');
    expect(jaActivity.recentLessonIds).not.toContain('en-a1-u1-l1');
  });
});
