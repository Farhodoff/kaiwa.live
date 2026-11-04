import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiagnosticService } from '../DiagnosticService';
import { LessonService } from '../LessonService';
import { ErrorVaultService } from '../ErrorVaultService';
import { supabase } from '../../lib/supabase';
import { toDeterministicUUID } from '../../utils/uuid';
import { DiagnosticResult, AdaptiveDiagnosticState } from '../../types/diagnostic';
import { UserLessonProgress } from '../../types/lesson';

// Fluent mock
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockUpsert = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockMaybeSingle = vi.fn();

const chainableMock = {
  select: mockSelect,
  eq: mockEq,
  upsert: mockUpsert,
  insert: mockInsert,
  delete: mockDelete,
  order: mockOrder,
  limit: mockLimit,
  maybeSingle: mockMaybeSingle,
};

mockSelect.mockReturnValue(chainableMock);
mockEq.mockReturnValue(chainableMock);
mockUpsert.mockReturnValue(chainableMock);
mockInsert.mockReturnValue(chainableMock);
mockDelete.mockReturnValue(chainableMock);
mockOrder.mockReturnValue(chainableMock);
mockLimit.mockReturnValue(chainableMock);
mockMaybeSingle.mockReturnValue(chainableMock);

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'test-user-db-1' } }, error: null }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
      from: vi.fn(() => chainableMock),
    },
  };
});

const testUserId = 'test-user-db-1';

describe('Full Storage Database Persistence Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockSelect.mockReturnValue(chainableMock);
    mockEq.mockReturnValue(chainableMock);
    mockUpsert.mockReturnValue(chainableMock);
    mockInsert.mockReturnValue(chainableMock);
    mockDelete.mockReturnValue(chainableMock);
    mockOrder.mockReturnValue(chainableMock);
    mockLimit.mockReturnValue(chainableMock);
    mockMaybeSingle.mockReturnValue(chainableMock);
  });

  describe('1. Diagnostic Database Persistence', () => {
    it('should persist diagnostic result to diagnostic_results table in Supabase', async () => {
      mockUpsert.mockResolvedValue({ error: null });

      const result: DiagnosticResult = {
        id: 'diag-res-123',
        userId: testUserId,
        language: 'en',
        mode: 'standard',
        claimedLevel: 'B2',
        diagnosticLevel: 'B2',
        recommendedStartLevel: 'B2',
        overallScore: 82,
        overallConfidence: 75,
        weaknesses: ['inversion'],
        strengths: ['vocabulary'],
        skills: {
          grammar: {
            skill: 'grammar',
            score: 80,
            confidence: 80,
            estimatedLevel: 'B2',
            totalQuestions: 5,
            correctCount: 4,
            status: 'adequate',
            levelEvidence: [],
            reason: '',
          },
          vocabulary: {
            skill: 'vocabulary',
            score: 85,
            confidence: 85,
            estimatedLevel: 'B2',
            totalQuestions: 5,
            correctCount: 4,
            status: 'adequate',
            levelEvidence: [],
            reason: '',
          },
        },
        recommendedFirstLessonId: 'en-b2-1',
        completedAt: new Date().toISOString(),
      };

      DiagnosticService.saveDiagnosticResult(result);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(supabase.from).toHaveBeenCalledWith('diagnostic_results');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: toDeterministicUUID('diag-res-123'),
          user_id: testUserId,
          language: 'en',
          estimated_level: 'B2',
          score: 82,
        }),
      );
    });

    it('should persist adaptive session to diagnostic_sessions table and delete on clear', async () => {
      mockUpsert.mockResolvedValue({ error: null });
      mockEq.mockResolvedValue({ error: null });

      const adaptiveState: AdaptiveDiagnosticState = {
        userId: testUserId,
        language: 'en',
        mode: 'quick',
        claimedLevel: 'B1',
        currentLevel: 'B1',
        currentDifficulty: 'medium',
        currentSkillFocus: 'grammar',
        consecutiveCorrect: 2,
        consecutiveIncorrect: 0,
        answeredCount: 3,
        maxQuestions: 10,
        currentQuestionId: 'q1',
        visitedQuestionIds: ['q1'],
        answers: [],
        isCompleted: false,
        lastUpdated: new Date().toISOString(),
      };

      DiagnosticService.saveAdaptiveSession(adaptiveState);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(supabase.from).toHaveBeenCalledWith('diagnostic_sessions');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: toDeterministicUUID(`adaptive_session_${testUserId}_en`),
          user_id: testUserId,
          language: 'en',
          status: 'in_progress',
        }),
      );

      // Clear session
      DiagnosticService.clearAdaptiveSession(testUserId, 'en');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should sync diagnostic result from Supabase DB to local cache', async () => {
      const dbRow = {
        id: toDeterministicUUID('diag-res-from-db'),
        user_id: testUserId,
        language: 'en',
        estimated_level: 'C1',
        score: 90,
        confidence: 85,
        weaknesses: ['idioms'],
        strengths: ['grammar'],
        breakdown: {},
        created_at: new Date().toISOString(),
      };

      mockMaybeSingle.mockResolvedValue({ data: dbRow, error: null });

      await DiagnosticService.syncDiagnosticFromDB(testUserId, 'en');

      const latest = DiagnosticService.getLatestDiagnosticResult(testUserId, 'en');
      expect(latest).toBeTruthy();
      expect(latest?.diagnosticLevel).toBe('C1');
      expect(latest?.overallScore).toBe(90);
    });
  });

  describe('2. Lesson Progress Database Persistence', () => {
    it('should persist lesson progress to lesson_progress table in Supabase', async () => {
      mockUpsert.mockResolvedValue({ error: null });

      const progress: UserLessonProgress = {
        lessonId: 'en-b2-grammar-1',
        userId: testUserId,
        currentStepIndex: 2,
        completedStepIds: ['step-1', 'step-2'],
        isCompleted: true,
        quizScore: { score: 5, total: 5, percentage: 100 },
        lastAttemptedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      await LessonService.saveLessonProgress(testUserId, progress);

      expect(supabase.from).toHaveBeenCalledWith('lesson_progress');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: toDeterministicUUID(`lesson_prog_${testUserId}_en-b2-grammar-1`),
          user_id: testUserId,
          lesson_id: 'en-b2-grammar-1',
          is_completed: true,
        }),
      );
    });

    it('should sync lesson progress from Supabase DB to local cache', async () => {
      const dbData = [
        {
          id: toDeterministicUUID(`lesson_prog_${testUserId}_en-a1-1`),
          user_id: testUserId,
          lesson_id: 'en-a1-1',
          language: 'en',
          current_step_index: 3,
          is_completed: true,
          score: 100,
          answers: { completedStepIds: ['s1', 's2', 's3'] },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockEq.mockImplementation((key) => {
        if (key === 'language') {
          return Promise.resolve({ data: dbData, error: null });
        }
        return chainableMock;
      });

      await LessonService.syncLessonProgressFromDB(testUserId, 'en');

      const cached = LessonService.getLessonProgress(testUserId, 'en-a1-1');
      expect(cached).toBeTruthy();
      expect(cached?.isCompleted).toBe(true);
      expect(cached?.currentStepIndex).toBe(3);
    });
  });

  describe('3. Error Vault Database Persistence', () => {
    it('should persist logged verbal errors to speaking_errors table', async () => {
      mockUpsert.mockResolvedValue({ error: null });

      ErrorVaultService.logErrors([
        {
          verbatim: 'I goes to school',
          correction: 'I go to school',
          explanation: 'First person subject takes base form of verb',
          category: 'grammar',
          language: 'en',
        },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(supabase.from).toHaveBeenCalledWith('speaking_errors');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: testUserId,
            language: 'en',
            verbatim: 'I goes to school',
            correction: 'I go to school',
          }),
        ]),
      );
    });
  });
});
