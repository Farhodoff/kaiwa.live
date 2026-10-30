import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineSyncManager, type QueuedKanjiProgress } from '../OfflineSyncManager';

const mocks = vi.hoisted(() => ({
  storage: new Map<string, unknown>(),
  upsert: vi.fn(),
  from: vi.fn(),
}));
vi.mock('../../utils/storage/indexedDb', () => ({
  idbGet: vi.fn(async (key: string) => structuredClone(mocks.storage.get(key) ?? null)),
  idbSet: vi.fn(async (key: string, value: unknown) => {
    mocks.storage.set(key, structuredClone(value));
  }),
  idbDelete: vi.fn(async (key: string) => {
    mocks.storage.delete(key);
  }),
}));
vi.mock('../../lib/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('../FlashcardOfflineSync', () => ({
  FlashcardOfflineSync: { syncPending: vi.fn(async () => ({ synced: 0, failed: 0 })) },
}));
vi.mock('../../hooks/use-toast', () => ({ toast: vi.fn() }));

const queueKey = 'study_planner_offline_kanji_progress_queue';
const record = (id = 'kanji-1'): QueuedKanjiProgress => ({
  id,
  userId: '00000000-0000-4000-8000-000000000001',
  lessonId: 'jlpt-N5',
  kanji: id,
  attempts: 2,
  correctAttempts: 2,
  mastered: true,
  lastReviewedAt: '2026-10-30T08:00:00.000Z',
  srsStage: 2,
  intervalDays: 3,
  nextReviewAt: '2026-11-02T08:00:00.000Z',
  writingAccuracy: 91,
  strokeOrderPassed: true,
  totalWrittenCount: 2,
});
const queue = () => mocks.storage.get(queueKey) as QueuedKanjiProgress[];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.storage.clear();
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.from.mockReturnValue({ upsert: mocks.upsert });
});

describe('Kanji offline queue regression tests', () => {
  it('serializes concurrent enqueues without dropping independent Kanji records', async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        OfflineSyncManager.enqueueKanjiProgress(record(`kanji-${index}`)),
      ),
    );
    expect(await OfflineSyncManager.getPendingKanjiProgressCount()).toBe(25);
    expect(new Set(queue().map((item) => item.id)).size).toBe(25);
  });

  it('deduplicates by user, lesson and character even when legacy IDs differ', async () => {
    await OfflineSyncManager.enqueueKanjiProgress(record());
    await OfflineSyncManager.enqueueKanjiProgress({
      ...record(),
      id: 'replacement-id',
      attempts: 3,
    });
    expect(queue()).toEqual([expect.objectContaining({ id: 'replacement-id', attempts: 3 })]);
  });

  it('compares timestamps chronologically rather than lexically across time zones', async () => {
    await OfflineSyncManager.enqueueKanjiProgress(record());
    await OfflineSyncManager.enqueueKanjiProgress({
      ...record(),
      attempts: 1,
      lastReviewedAt: '2026-10-30T12:00:00+05:00',
    });
    expect(queue()).toEqual([
      expect.objectContaining({ attempts: 2, lastReviewedAt: '2026-10-30T08:00:00.000Z' }),
    ]);
  });

  it('retains a newer reset marker instead of replacing it with a stale review', async () => {
    await OfflineSyncManager.enqueueKanjiProgress(record());
    await OfflineSyncManager.enqueueKanjiProgress({
      ...record(),
      attempts: 0,
      correctAttempts: 0,
      mastered: false,
      lastReviewedAt: '2026-10-30T09:00:00.000Z',
      writingAccuracy: undefined,
      nextReviewAt: undefined,
      totalWrittenCount: 0,
      strokeOrderPassed: undefined,
    });
    await OfflineSyncManager.enqueueKanjiProgress(record());
    expect(queue()).toHaveLength(1);
    expect(queue()[0]).toMatchObject({ attempts: 0, mastered: false, totalWrittenCount: 0 });
  });

  it('flushes the complete SRS/writing payload and removes a successful record', async () => {
    await OfflineSyncManager.enqueueKanjiProgress(record());
    const result = await OfflineSyncManager.syncAllPending();
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith('lesson_kanji_progress');
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        user_id: record().userId,
        lesson_id: 'jlpt-N5',
        srs_stage: 2,
        interval_days: 3,
        next_review_at: record().nextReviewAt,
        writing_accuracy: 91,
        stroke_order_passed: true,
        total_written_count: 2,
      }),
      { onConflict: 'user_id,lesson_id,kanji' },
    );
    expect(result).toMatchObject({ syncedKanji: 1, totalFailed: 0 });
    expect(await OfflineSyncManager.getPendingKanjiProgressCount()).toBe(0);
  });

  it('preserves failed records for a later successful retry', async () => {
    mocks.upsert.mockResolvedValueOnce({ error: new Error('offline') });
    await OfflineSyncManager.enqueueKanjiProgress(record());
    expect(await OfflineSyncManager.syncAllPending()).toMatchObject({
      syncedKanji: 0,
      totalFailed: 1,
    });
    expect(queue()).toEqual([record()]);
    expect(await OfflineSyncManager.syncAllPending()).toMatchObject({
      syncedKanji: 1,
      totalFailed: 0,
    });
    expect(queue()).toEqual([]);
  });

  it('does not discard an enqueue that arrives while a snapshot is being uploaded', async () => {
    let release!: () => void;
    let notifyStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      notifyStarted = resolve;
    });
    mocks.upsert.mockImplementationOnce(() => {
      notifyStarted();
      return new Promise((resolve) => {
        release = () => resolve({ error: null });
      });
    });
    await OfflineSyncManager.enqueueKanjiProgress(record());
    const flush = OfflineSyncManager.syncAllPending();
    await started;
    const enqueue = OfflineSyncManager.enqueueKanjiProgress(record('arrived-during-flush'));
    release();
    await Promise.all([flush, enqueue]);
    expect(queue()).toEqual([record('arrived-during-flush')]);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });
});
