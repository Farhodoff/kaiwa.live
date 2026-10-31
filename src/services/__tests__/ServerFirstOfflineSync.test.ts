import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfflineSyncManager } from '../OfflineSyncManager';
import { HistoryService } from '../HistoryService';
import { supabase } from '../../lib/supabase';

describe('Server-First Architecture & Resilient Offline Sync', () => {
  const testUserId = 'a0000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    vi.clearAllMocks();
    await OfflineSyncManager.clearAllQueues();

    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: testUserId } },
      error: null,
    } as any);
  });

  describe('Server-First vs Local Queue', () => {
    it('writes directly to server when online and does NOT enqueue to local queue', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(supabase, 'from').mockReturnValue({
        upsert: mockUpsert,
      } as any);

      // Simulate online
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      const session = await HistoryService.saveSpeakingSession({
        language: 'ja',
        persona: 'Daily Conversation',
        fluencyScore: 8.0,
        pronunciationScore: 9.0,
        durationSeconds: 120,
        transcript: 'Konnichiwa',
        feedback: 'Good',
      });

      expect(session).toBeDefined();
      expect(session.id).toBeDefined(); // Client-generated UUID
      expect(mockUpsert).toHaveBeenCalledTimes(1);

      // Local queue should remain empty!
      const pendingCount = await OfflineSyncManager.getPendingSpeakingCount();
      expect(pendingCount).toBe(0);
    });

    it('falls back to local queue when offline', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(supabase, 'from').mockReturnValue({
        upsert: mockUpsert,
      } as any);

      // Simulate offline
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      const session = await HistoryService.saveSpeakingSession({
        language: 'ja',
        persona: 'Job Interview',
        fluencyScore: 7.5,
        pronunciationScore: 7.5,
        durationSeconds: 150,
        transcript: 'Hajimemashite',
        feedback: 'Nice',
      });

      expect(session).toBeDefined();
      expect(mockUpsert).not.toHaveBeenCalled();

      // Enqueued to local queue
      const pendingCount = await OfflineSyncManager.getPendingSpeakingCount();
      expect(pendingCount).toBe(1);
    });

    it('falls back to local queue when server returns an error', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({
        error: { message: '503 Service Unavailable', code: '503' },
      });
      vi.spyOn(supabase, 'from').mockReturnValue({
        upsert: mockUpsert,
      } as any);

      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      const session = await HistoryService.saveSpeakingSession({
        language: 'ja',
        persona: 'Restaurant',
        fluencyScore: 8.0,
        pronunciationScore: 8.0,
        durationSeconds: 90,
        transcript: 'Ramen kudasai',
        feedback: 'Excellent',
      });

      expect(session).toBeDefined();
      expect(mockUpsert).toHaveBeenCalledTimes(1);

      // Enqueued to local queue because server failed
      const pendingCount = await OfflineSyncManager.getPendingSpeakingCount();
      expect(pendingCount).toBe(1);
    });
  });

  describe('UUID Idempotency & Upsert', () => {
    it('uses onConflict "id" so syncing duplicate sessions does not create duplicates', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(supabase, 'from').mockReturnValue({
        upsert: mockUpsert,
      } as any);

      const fixedValidUuid = 'e7b99335-5157-4ea2-8ac9-8f2e2fc0d463';
      await OfflineSyncManager.enqueueSpeakingSession({
        id: fixedValidUuid,
        userId: testUserId,
        topic: 'Travel',
        fluencyScore: 9.0,
        grammarScore: 9.0,
        pronunciationScore: 9.0,
        vocabularyScore: 9.0,
        durationSeconds: 60,
        createdAt: '2026-10-31T20:00:00Z',
      });

      const res = await OfflineSyncManager.syncAllPending(true);
      expect(res.syncedSpeaking).toBe(1);
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: fixedValidUuid }), {
        onConflict: 'id',
      });
    });
  });

  describe('Exponential Backoff Schedule', () => {
    it('increments retry count and sets future nextRetryTime on sync failure', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({
        error: { message: 'Network Timeout' },
      });
      vi.spyOn(supabase, 'from').mockReturnValue({
        upsert: mockUpsert,
      } as any);

      await OfflineSyncManager.enqueueSpeakingSession({
        id: 'backoff-session-1',
        userId: testUserId,
        topic: 'Grammar practice',
        fluencyScore: 8.0,
        grammarScore: 8.0,
        pronunciationScore: 8.0,
        vocabularyScore: 8.0,
        durationSeconds: 100,
        createdAt: new Date().toISOString(),
      });

      // First sync attempt fails
      const res1 = await OfflineSyncManager.syncAllPending(false);
      expect(res1.totalFailed).toBe(1);

      // Second sync attempt immediately after should SKIP because nextRetryTime is in the future
      const res2 = await OfflineSyncManager.syncAllPending(false);
      expect(res2.totalSynced).toBe(0);
      expect(res2.totalFailed).toBe(0); // Not attempted because backoff is active

      // Force manual sync should bypass backoff schedule
      const res3 = await OfflineSyncManager.syncAllPending(true);
      expect(res3.totalFailed).toBe(1); // Attempted and failed
    });
  });

  describe('Study Sessions Queue', () => {
    it('enqueues and syncs study sessions with upsert', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'study_sessions') return { upsert: mockUpsert } as any;
        return { upsert: vi.fn().mockResolvedValue({ error: null }) } as any;
      });

      const validSessionId = 'c8b99335-5157-4ea2-8ac9-8f2e2fc0d111';
      await OfflineSyncManager.enqueueStudySession({
        id: validSessionId,
        userId: testUserId,
        subjectId: 'sub-1',
        startTime: '2026-10-31T20:00:00Z',
        duration: 45,
        notes: 'Studied Kanji N2',
        completed: true,
        createdAt: new Date().toISOString(),
      });

      expect(await OfflineSyncManager.getPendingStudySessionsCount()).toBe(1);

      const res = await OfflineSyncManager.syncAllPending(true);
      expect(res.syncedStudySessions).toBe(1);
      expect(await OfflineSyncManager.getPendingStudySessionsCount()).toBe(0);
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: validSessionId }), {
        onConflict: 'id',
      });
    });
  });
});
