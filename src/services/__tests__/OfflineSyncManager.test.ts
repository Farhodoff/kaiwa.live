import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfflineSyncManager } from '../OfflineSyncManager';
import { FlashcardOfflineSync } from '../FlashcardOfflineSync';
import { supabase } from '../../lib/supabase';
import { toast } from '../../hooks/use-toast';

vi.mock('../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('OfflineSyncManager Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await OfflineSyncManager.clearAllQueues();
  });

  it('enqueues offline mock exams and calculates pending count', async () => {
    expect(await OfflineSyncManager.getPendingExamsCount()).toBe(0);

    await OfflineSyncManager.enqueueMockExam({
      id: 'exam-1',
      userId: 'user-1',
      examType: 'jlpt',
      level: 'N5',
      score: 85,
      totalQuestions: 100,
      createdAt: '2026-09-19T10:00:00Z',
    });

    expect(await OfflineSyncManager.getPendingExamsCount()).toBe(1);

    // Updating same exam replaces rather than duplicates
    await OfflineSyncManager.enqueueMockExam({
      id: 'exam-1',
      userId: 'user-1',
      examType: 'jlpt',
      level: 'N5',
      score: 90,
      totalQuestions: 100,
      createdAt: '2026-09-19T10:00:00Z',
    });

    expect(await OfflineSyncManager.getPendingExamsCount()).toBe(1);

    // New exam increments count
    await OfflineSyncManager.enqueueMockExam({
      id: 'exam-2',
      userId: 'user-1',
      examType: 'jlpt',
      level: 'N4',
      score: 110,
      totalQuestions: 120,
      createdAt: '2026-09-19T11:00:00Z',
    });

    expect(await OfflineSyncManager.getPendingExamsCount()).toBe(2);
  });

  it('enqueues speaking sessions and gamification profiles', async () => {
    expect(await OfflineSyncManager.getPendingSpeakingCount()).toBe(0);
    expect(await OfflineSyncManager.getPendingGamificationCount()).toBe(0);

    await OfflineSyncManager.enqueueSpeakingSession({
      id: 'spk-1',
      userId: 'user-1',
      topic: 'Ordering Ramen',
      fluencyScore: 8.5,
      grammarScore: 8.0,
      pronunciationScore: 9.0,
      vocabularyScore: 8.0,
      durationSeconds: 120,
      createdAt: '2026-09-19T10:00:00Z',
    });

    expect(await OfflineSyncManager.getPendingSpeakingCount()).toBe(1);

    await OfflineSyncManager.enqueueGamificationSync({
      userId: 'user-1',
      totalXp: 450,
      level: 3,
      currentStreak: 5,
      lastActivityDate: '2026-09-19',
      timestamp: Date.now(),
    });

    expect(await OfflineSyncManager.getPendingGamificationCount()).toBe(1);

    // Verify overall pending count aggregates cards, exams, speaking, and gamification
    await FlashcardOfflineSync.enqueueUpdate('card-1', { interval: 2 });
    const totalPending = await OfflineSyncManager.getOverallPendingCount();
    expect(totalPending).toBe(3); // 1 exam (from clear=0) + 1 spk + 1 game + 1 card = 3
  });

  it('syncs all pending queues to Supabase when online', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'mock_exams_history') return { upsert: mockUpsert } as any;
      if (table === 'speaking_coach_sessions') return { upsert: mockUpsert } as any;
      if (table === 'profiles') return { upsert: mockUpsert } as any;
      if (table === 'flashcards') return { update: mockUpdate } as any;
      if (table === 'lesson_progress') return { upsert: mockUpsert } as any;
      return { upsert: mockUpsert } as any;
    });

    await OfflineSyncManager.enqueueMockExam({
      id: 'exam-10',
      userId: 'user-1',
      examType: 'jlpt',
      score: 100,
      totalQuestions: 100,
      createdAt: '2026-09-19T12:00:00Z',
    });

    await OfflineSyncManager.enqueueSpeakingSession({
      id: 'spk-10',
      userId: 'user-1',
      fluencyScore: 9.0,
      grammarScore: 8.5,
      pronunciationScore: 8.5,
      vocabularyScore: 9.0,
      durationSeconds: 180,
      createdAt: '2026-09-19T12:00:00Z',
    });

    await OfflineSyncManager.enqueueGamificationSync({
      userId: 'user-1',
      totalXp: 800,
      level: 4,
      currentStreak: 7,
      lastActivityDate: '2026-09-19',
      timestamp: Date.now(),
    });

    await OfflineSyncManager.enqueueLessonProgress({
      id: 'lp-10',
      userId: 'user-1',
      lessonId: 'minna-lesson-1',
      language: 'ja',
      currentStepIndex: 3,
      isCompleted: true,
      score: 100,
      answers: {},
      completedAt: '2026-09-19T12:00:00Z',
      updatedAt: '2026-09-19T12:00:00Z',
    });

    await FlashcardOfflineSync.enqueueUpdate('c-10', { interval: 3 });

    const result = await OfflineSyncManager.syncAllPending();

    expect(result.syncedCards).toBe(1);
    expect(result.syncedExams).toBe(1);
    expect(result.syncedSpeaking).toBe(1);
    expect(result.syncedGamification).toBe(1);
    expect(result.syncedLessons).toBe(1);
    expect(result.totalSynced).toBe(5);
    expect(result.totalFailed).toBe(0);

    expect(await OfflineSyncManager.getOverallPendingCount()).toBe(0);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Sinxronlash muvaffaqiyatli'),
        description: expect.stringContaining('5 ta oflayn'),
      }),
    );
  });

  it('preserves failed items in their respective queues if Supabase rejects', async () => {
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'mock_exams_history') {
        return { upsert: vi.fn().mockResolvedValue({ error: new Error('DB Error') }) } as any;
      }
      return {
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any;
    });

    await OfflineSyncManager.enqueueMockExam({
      id: 'exam-fail',
      userId: 'user-1',
      examType: 'jlpt',
      score: 50,
      totalQuestions: 100,
      createdAt: '2026-09-19T12:00:00Z',
    });

    const result = await OfflineSyncManager.syncAllPending();

    expect(result.syncedExams).toBe(0);
    expect(result.totalFailed).toBe(1);
    expect(await OfflineSyncManager.getPendingExamsCount()).toBe(1);
  });

  it('provides comprehensive storage diagnostics', async () => {
    await OfflineSyncManager.enqueueMockExam({
      id: 'exam-diag',
      userId: 'user-1',
      examType: 'jlpt',
      score: 70,
      totalQuestions: 100,
      createdAt: '2026-09-19T12:00:00Z',
    });

    const diag = await OfflineSyncManager.getDiagnostics();
    expect(diag.pendingExams).toBe(1);
    expect(diag.totalPending).toBeGreaterThanOrEqual(1);
    expect(typeof diag.isOnline).toBe('boolean');
  });
});
