import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LessonKanjiService } from '../LessonKanjiService';
import { kanjiProgressRow } from '../OfflineSyncManager';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  upsert: vi.fn(),
  rpc: vi.fn(),
  enqueue: vi.fn(),
  getSession: vi.fn(),
  rows: [] as Record<string, unknown>[],
  loadError: null as unknown,
}));
vi.mock('../../lib/supabase', () => ({
  supabase: { from: mocks.from, rpc: mocks.rpc, auth: { getSession: mocks.getSession } },
}));
vi.mock('../OfflineSyncManager', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../OfflineSyncManager')>()),
  OfflineSyncManager: { enqueueKanjiProgress: mocks.enqueue },
}));
const userId = '00000000-0000-4000-8000-000000000001';
const resetAt = '2026-10-30T12:00:00.000Z';
const remote = {
  lesson_id: 'jlpt-N5',
  kanji: '日',
  attempts: 3,
  correct_attempts: 2,
  mastered: true,
  last_reviewed_at: '2026-10-01T12:00:00.000Z',
  srs_stage: 2,
  interval_days: 3,
  next_review_at: '2026-10-04T12:00:00.000Z',
  writing_accuracy: 85,
  stroke_order_passed: true,
  total_written_count: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.rows = [];
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: userId } } }, error: null });
  mocks.loadError = null;
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ data: resetAt, error: null });
  mocks.enqueue.mockResolvedValue(undefined);
  mocks.from.mockImplementation(() => {
    let start = 0,
      end = 499;
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn((a: number, b: number) => {
        start = a;
        end = b;
        return query;
      }),
      upsert: mocks.upsert,
      then: (resolve: (result: unknown) => unknown) =>
        Promise.resolve({ data: mocks.rows.slice(start, end + 1), error: mocks.loadError }).then(
          resolve,
        ),
    };
    return query;
  });
});

describe('Kanji progress persistence', () => {
  it('persists all SRS and writing fields and queues the same data on error', async () => {
    const progress = LessonKanjiService.recordWritingPractice(userId, 'jlpt-N5', '日', {
      writingAccuracy: 90,
      strokeOrderPassed: true,
    });
    await LessonKanjiService.syncProgress(userId, progress);
    expect(mocks.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        srs_stage: 1,
        interval_days: 1,
        writing_accuracy: 90,
        stroke_order_passed: true,
        total_written_count: 1,
        next_review_at: progress.nextReviewAt,
      }),
      { onConflict: 'user_id,lesson_id,kanji' },
    );
    mocks.upsert.mockResolvedValue({ error: new Error('offline') });
    await LessonKanjiService.syncProgress(userId, progress);
    const queued = mocks.enqueue.mock.lastCall![0];
    expect(kanjiProgressRow(queued)).toMatchObject({
      writing_accuracy: 90,
      total_written_count: 1,
      next_review_at: progress.nextReviewAt,
    });
  });
  it('restores metadata on a fresh device and paginates beyond 1000 rows', async () => {
    mocks.rows = Array.from({ length: 1001 }, (_, i) => ({ ...remote, lesson_id: `lesson-${i}` }));
    await LessonKanjiService.syncAllProgressFromDatabase(userId);
    expect(LessonKanjiService.getAllUserProgress(userId)).toHaveLength(1001);
    expect(LessonKanjiService.getProgress(userId, 'lesson-1000', '日')).toMatchObject({
      srsStage: 2,
      intervalDays: 3,
      writingAccuracy: 85,
      strokeOrderPassed: true,
      totalWrittenCount: 2,
    });
    expect(mocks.from).toHaveBeenCalledTimes(3);
  });
  it('replaces old counters with newer remote reset markers', async () => {
    LessonKanjiService.recordReview(userId, 'jlpt-N5', '日', 'correct', new Date('2026-10-01'));
    mocks.rows = [
      {
        ...remote,
        attempts: 0,
        correct_attempts: 0,
        mastered: false,
        last_reviewed_at: resetAt,
        next_review_at: null,
        writing_accuracy: null,
        stroke_order_passed: null,
        total_written_count: 0,
      },
    ];
    await LessonKanjiService.syncAllProgressFromDatabase(userId);
    expect(LessonKanjiService.getAllUserProgress(userId)).toEqual([]);
  });
  it('retains newer local results when a stale server response arrives', async () => {
    const local = LessonKanjiService.recordReview(
      userId,
      'jlpt-N5',
      '日',
      'incorrect',
      new Date('2026-10-20'),
    );
    mocks.rows = [remote];
    await LessonKanjiService.syncAllProgressFromDatabase(userId);
    expect(LessonKanjiService.getProgress(userId, 'jlpt-N5', '日')).toEqual(local);
  });
  it('resets server and local progress, preserving a queued reset marker', async () => {
    mocks.rows = [remote];
    expect(await LessonKanjiService.resetProgressAndSync(userId)).toEqual({ resetCount: 1 });
    expect(mocks.rpc).toHaveBeenCalledWith('reset_lesson_kanji_progress', {
      expected_user_id: userId,
    });
    expect(LessonKanjiService.getAllUserProgress(userId)).toEqual([]);
    expect(mocks.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        attempts: 0,
        mastered: false,
        lastReviewedAt: new Date(Date.parse(resetAt) + 1).toISOString(),
      }),
    );
    expect(mocks.upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ attempts: 0, writing_accuracy: null })],
      expect.anything(),
    );
  });
  it('advances reset markers beyond ahead-of-clock unsynced local results', async () => {
    const local = LessonKanjiService.recordReview(
      userId,
      'jlpt-N5',
      '日',
      'correct',
      new Date('2027-01-01'),
    );
    await LessonKanjiService.resetProgressAndSync(userId);
    const queued = mocks.enqueue.mock.lastCall![0];
    expect(Date.parse(queued.lastReviewedAt)).toBeGreaterThan(Date.parse(local.lastReviewedAt));
    expect(queued.attempts).toBe(0);
  });

  it('does not clear local data or report success when the server reset fails', async () => {
    mocks.rows = [remote];
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('permission denied') });
    await expect(LessonKanjiService.resetProgressAndSync(userId)).rejects.toThrow(
      'Progress o‘chirilmadi',
    );
    expect(LessonKanjiService.getAllUserProgress(userId)).toHaveLength(1);
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
  it('rejects reset if the selected account no longer matches the session', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'another-user' } } },
      error: null,
    });
    await expect(LessonKanjiService.resetProgressAndSync(userId)).rejects.toThrow(
      'Hisob o‘zgargan',
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('surfaces schema/network failures rather than presenting them as empty remote progress', async () => {
    mocks.loadError = new Error('missing migration');
    await expect(LessonKanjiService.syncAllProgressFromDatabase(userId)).rejects.toThrow(
      'sinxronlab bo‘lmadi',
    );
  });
});
