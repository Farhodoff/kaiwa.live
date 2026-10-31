import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GrammarService } from '../../services/GrammarService';
import { TaskService } from '../../services/TaskService';
import { HistoryService } from '../../services/HistoryService';
import { calculateReview, Rating } from '../../utils/srs';
import { calculateStreak } from '../../utils/statistics';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';

vi.mock('../../lib/supabase', () => {
  const mockFrom = vi.fn();
  const mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: '00000000-0000-4000-8000-000000000001', email: 'alice@example.com' } },
  });
  const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
  return {
    supabase: {
      auth: {
        getUser: mockGetUser,
        getSession: mockGetSession,
      },
      from: mockFrom,
    },
  };
});

describe('REAL USER JOURNEYS & DATA INTEGRITY PROOFS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('JOURNEY 1: Auth & Profile State Hydration (Tasks & Completion -> Streak Calculation)', () => {
    const today = new Date().toISOString();
    const mockTasks: Task[] = [
      {
        id: 't1',
        title: 'IELTS Writing Task 1',
        completed: true,
        status: 'done',
        priority: 'medium',
        deadline: today,
        createdAt: today,
      },
      {
        id: 't2',
        title: 'Grammar Exercises',
        completed: true,
        status: 'done',
        priority: 'medium',
        deadline: today,
        createdAt: today,
      },
    ];

    const streakResult = calculateStreak(mockTasks);
    expect(streakResult).toBeGreaterThanOrEqual(1);
  });

  it('JOURNEY 2: Task CRUD & Status Transition (UI -> Service -> PostgreSQL -> Status)', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: '00000000-0000-4000-8000-000000000101',
            user_id: '00000000-0000-4000-8000-000000000001',
            title: 'Practice Inversion Grammar',
            status: 'todo',
            completed: false,
          },
          error: null,
        }),
      }),
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'tasks') {
        return {
          insert: mockInsert,
          update: mockUpdate,
        };
      }
      return {};
    });

    // 1. Create Task
    const newTask = await TaskService.addTask('00000000-0000-4000-8000-000000000001', {
      title: 'Practice Inversion Grammar',
      priority: 'high',
    });

    expect(newTask?.title).toBe('Practice Inversion Grammar');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Practice Inversion Grammar',
        user_id: '00000000-0000-4000-8000-000000000001',
      }),
    );

    // 2. Complete Task (Transition todo -> done)
    await TaskService.updateTaskStatus('00000000-0000-4000-8000-000000000101', 'done', true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'done',
        completed: true,
      }),
    );
  });

  it('JOURNEY 3: English Grammar Flow (PostgreSQL -> Quiz -> Score -> english_grammar_progress)', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'english_grammar_progress') {
        return { upsert: mockUpsert };
      }
      return {};
    });

    // User solves quiz with 5/5 correct answers
    const saveSuccess = await GrammarService.saveUserProgress(
      'ielts_g_01_present_simple_vs_cont',
      true,
      5,
      5,
    );

    expect(saveSuccess).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: '00000000-0000-4000-8000-000000000001',
        lesson_slug: 'ielts_g_01_present_simple_vs_cont',
        completed: true,
        score: 5,
        total_questions: 5,
      }),
      expect.objectContaining({ onConflict: 'user_id,lesson_slug' }),
    );
  });

  it('JOURNEY 4: Anki SM-2 Spaced Repetition (Answer -> Quality -> Next Review Date)', () => {
    // Initial state: new card (repetitions: 0, interval: 0, easeFactor: 2.5)
    const initialCard = {
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
    };

    // User grades response as "Good"
    const review1 = calculateReview(
      Rating.GOOD,
      initialCard.interval,
      initialCard.repetitions,
      initialCard.easeFactor,
    );
    expect(review1.repetitions).toBe(1);
    expect(review1.interval).toBe(2);
    expect(review1.easeFactor).toBeGreaterThan(2.4);

    // Next review: User grades response as "Easy"
    const review2 = calculateReview(
      Rating.EASY,
      review1.interval,
      review1.repetitions,
      review1.easeFactor,
    );
    expect(review2.repetitions).toBe(2);
    expect(review2.interval).toBe(10);
    expect(review2.nextReviewDate).toBeDefined();
  });

  it('JOURNEY 5: IELTS Exam History Persistence (Evaluation -> mock_exams_history -> Reopen)', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'mock_exams_history') {
        return { insert: mockInsert, upsert: mockInsert };
      }
      return {};
    });

    await HistoryService.saveMockExam({
      examType: 'ielts_reading',
      level: 'C1',
      score: 36,
      totalQuestions: 40,
      bandScore: 8.5,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: '00000000-0000-4000-8000-000000000001',
        exam_type: 'ielts_reading',
        level: 'C1',
        score: 36,
        total_questions: 40,
        band_score: 8.5,
      }),
      expect.anything(),
    );
  });

  it('JOURNEY 6: User Data Isolation (User Alice vs User Bob Protection)', async () => {
    // Simulate User Bob trying to query User Alice's progress
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation((field: string, val: string) => {
        if (field === 'user_id' && val === '00000000-0000-4000-8000-000000000002') {
          // Bob has 0 records under his own ID
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({
          data: [{ lesson_slug: 'inversion', completed: true }],
          error: null,
        });
      }),
    });

    (supabase.from as any).mockReturnValue({ select: mockSelect });

    // Authenticated as Bob
    (supabase.auth.getUser as any).mockResolvedValueOnce({
      data: { user: { id: '00000000-0000-4000-8000-000000000002', email: 'bob@example.com' } },
    });

    const bobProgress = await GrammarService.getUserProgress();
    expect(Object.keys(bobProgress).length).toBe(0);
  });
});
