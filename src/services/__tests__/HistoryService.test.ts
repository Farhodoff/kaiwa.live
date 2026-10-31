import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryService } from '../HistoryService';
import { supabase } from '../../lib/supabase';
import { toDeterministicUUID } from '../../utils/uuid';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('HistoryService', () => {
  let originalRandomUUID: any;

  beforeEach(() => {
    HistoryService.clearMissingTablesCache();
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    originalRandomUUID = crypto.randomUUID;
  });

  describe('saveWritingAttempt & getWritingHistory', () => {
    it('saves writing attempt to Supabase when authenticated and updates localStorage', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await HistoryService.saveWritingAttempt({
        taskType: 'task2',
        prompt: 'Test prompt',
        essay: 'Test essay',
        score: 7.0,
        criteriaBreakdown: { tr: 7, cc: 7, lr: 7, gra: 7 },
        feedback: 'Good',
      });

      expect(result.id).toBeDefined();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: toDeterministicUUID('user-123'),
          score: 7.0,
        }),
      );

      const local = JSON.parse(localStorage.getItem('study_planner_ielts_writing_history') || '[]');
      expect(local).toHaveLength(1);
      expect(local[0].prompt).toBe('Test prompt');
    });

    it('handles Supabase insert error gracefully when saving writing attempt', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } });
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await HistoryService.saveWritingAttempt({
        taskType: 'task1',
        prompt: 'Task 1 prompt',
        essay: 'Essay text',
        score: 6.5,
        criteriaBreakdown: { tr: 6.5, cc: 6.5, lr: 6.5, gra: 6.5 },
        feedback: 'Fair',
      });

      expect(result.id).toBeDefined();
      const local = JSON.parse(localStorage.getItem('study_planner_ielts_writing_history') || '[]');
      expect(local).toHaveLength(1);
    });

    it('handles exception during Supabase save with local fallback', async () => {
      vi.mocked(supabase.auth.getUser).mockRejectedValue({
        status: 404,
        message: 'Table not found',
      });

      const result = await HistoryService.saveWritingAttempt({
        taskType: 'task2',
        prompt: 'Prompt',
        essay: 'Essay',
        score: 8.0,
        criteriaBreakdown: { tr: 8, cc: 8, lr: 8, gra: 8 },
        feedback: 'Great',
      });

      expect(result.score).toBe(8.0);
    });

    it('uses Math.random fallback when crypto.randomUUID is not available', async () => {
      // @ts-ignore
      delete crypto.randomUUID;
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await HistoryService.saveWritingAttempt({
        taskType: 'task1',
        prompt: 'Prompt',
        essay: 'Essay',
        score: 6.0,
        criteriaBreakdown: { tr: 6, cc: 6, lr: 6, gra: 6 },
        feedback: 'Pass',
      });

      expect(result.id).toBeDefined();
      crypto.randomUUID = originalRandomUUID;
    });

    it('fetches writing history from Supabase when user is logged in', async () => {
      const dataResult = {
        data: [
          {
            id: 'item-1',
            user_id: 'user-123',
            task_type: 'task2',
            prompt: 'Remote prompt',
            essay: 'Remote essay',
            score: 7.5,
            criteria: { tr: 7.5, cc: 7.5, lr: 7.5, gra: 7.5 },
            feedback: 'Remote feedback',
            created_at: '2026-07-26T00:00:00.000Z',
          },
        ],
        error: null,
      };
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(dataResult),
            then: (resolve: any) => Promise.resolve(dataResult).then(resolve),
          }),
        }),
      });
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const history = await HistoryService.getWritingHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('item-1');
      expect(history[0].prompt).toBe('Remote prompt');
    });

    it('falls back to item.user_id when item.id is missing in Supabase data', async () => {
      const dataResult = {
        data: [
          {
            user_id: 'user-123',
            task_type: 'task1',
            prompt: 'Prompt',
            essay: 'Essay',
            score: 7.0,
            criteria: { tr: 7, cc: 7, lr: 7, gra: 7 },
            feedback: 'FB',
            created_at: '2026-07-26',
          },
        ],
        error: null,
      };
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(dataResult),
            then: (resolve: any) => Promise.resolve(dataResult).then(resolve),
          }),
        }),
      });
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const history = await HistoryService.getWritingHistory();
      expect(history[0].id).toBe('user-123');
    });

    it('falls back to localStorage when Supabase returns error or unauthenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      localStorage.setItem(
        'study_planner_ielts_writing_history',
        JSON.stringify([
          {
            id: 'local-1',
            taskType: 'task1',
            prompt: 'Local prompt',
            essay: 'Local essay',
            score: 6.0,
            criteriaBreakdown: { tr: 6, cc: 6, lr: 6, gra: 6 },
            feedback: 'Local fb',
            createdAt: '2026-07-26',
          },
        ]),
      );

      const history = await HistoryService.getWritingHistory();
      expect(history).toHaveLength(1);
      expect(history[0].prompt).toBe('Local prompt');
    });
  });

  describe('saveSpeakingSession & getSpeakingHistory', () => {
    it('saves speaking session to Supabase & localStorage and retrieves it', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert, insert: mockUpsert } as any);

      const saved = await HistoryService.saveSpeakingSession({
        language: 'ja',
        persona: 'Sensei',
        durationSeconds: 120,
        fluencyScore: 8.0,
        pronunciationScore: 8.5,
        transcript: 'Konnichiwa',
        feedback: 'Nihongo ga jouzu',
      });

      expect(saved.id).toBeDefined();
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('handles Supabase insert error and offline exception catch for speaking session', async () => {
      const mockUpsert = vi
        .fn()
        .mockResolvedValue({ error: { status: 404, message: 'DB Error 404' } });
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert, insert: mockUpsert } as any);

      const result = await HistoryService.saveSpeakingSession({
        language: 'en',
        persona: 'Native',
        durationSeconds: 60,
        fluencyScore: 7.0,
        pronunciationScore: 7.0,
        transcript: 'Hello',
        feedback: 'Good',
      });
      expect(result.id).toBeDefined();
    });

    it('fetches speaking history from Supabase and falls back to localStorage on exception', async () => {
      const dataResult = {
        data: [
          {
            id: 'sp-1',
            language: 'ja',
            persona: 'Friend',
            duration_seconds: 90,
            fluency_score: 9.0,
            pronunciation_score: 8.5,
            transcript: 'Ohayou',
            feedback: 'Sugoi',
            created_at: '2026-07-26',
          },
        ],
        error: null,
      };
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(dataResult),
            then: (resolve: any) => Promise.resolve(dataResult).then(resolve),
          }),
        }),
      });
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const history = await HistoryService.getSpeakingHistory();
      expect(history).toHaveLength(1);
      expect(history[0].language).toBe('ja');

      // Test catch block
      vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Failure'));
      const localHist = await HistoryService.getSpeakingHistory();
      expect(localHist).toBeDefined();
    });
  });

  describe('saveMockExam & getMockExamsHistory', () => {
    it('saves mock exam with level & bandScore and retrieves history', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert, insert: mockUpsert } as any);

      const result = await HistoryService.saveMockExam({
        examType: 'ielts_reading',
        level: 'Band 7',
        score: 30,
        totalQuestions: 40,
        bandScore: 7.0,
      });

      expect(result.id).toBeDefined();
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'Band 7',
          band_score: 7.0,
        }),
        { onConflict: 'id' },
      );
    });

    it('saves mock exam with undefined optional fields setting nulls in Supabase insert', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert, insert: mockUpsert } as any);

      await HistoryService.saveMockExam({
        examType: 'jlpt',
        score: 120,
        totalQuestions: 180,
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          level: null,
          band_score: null,
        }),
        { onConflict: 'id' },
      );
    });

    it('fetches mock exams history from Supabase and falls back to empty array when localStorage empty', async () => {
      const dataResult = {
        data: [
          {
            id: 'mock-1',
            exam_type: 'jlpt',
            level: 'N1',
            score: 150,
            total_questions: 180,
            band_score: null,
            created_at: '2026-07-26',
          },
        ],
        error: null,
      };
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(dataResult),
            then: (resolve: any) => Promise.resolve(dataResult).then(resolve),
          }),
        }),
      });
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const history = await HistoryService.getMockExamsHistory();
      expect(history[0].examType).toBe('jlpt');

      // Fallback check
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      const emptyHistory = await HistoryService.getMockExamsHistory();
      expect(emptyHistory).toEqual([]);
    });
  });
});
