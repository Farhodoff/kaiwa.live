import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskService } from '../TaskService';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getSession: vi.fn(),
  createEvent: vi.fn(),
}));
vi.mock('../../lib/supabase', () => ({
  supabase: { from: mocks.from, auth: { getSession: mocks.getSession } },
}));
vi.mock('../GoogleCalendarService', () => ({
  GoogleCalendarService: { createEvent: mocks.createEvent },
}));

const userId = '11111111-1111-4111-8111-111111111111';
const review = {
  title: 'Review',
  dueDate: '2026-10-29T10:00:00.000Z',
  priority: 'high' as const,
  srsLessonId: 'ja-n3-u1-l1',
  srsReviewDate: '2026-10-29',
};
const row = {
  id: '22222222-2222-4222-8222-222222222222',
  user_id: userId,
  title: 'Review',
  due_date: review.dueDate,
  priority: 'high',
  status: 'todo',
  completed: false,
  created_at: '2026-10-29T00:55:00.000Z',
  srs_lesson_id: review.srsLessonId,
  srs_review_date: review.srsReviewDate,
};
const duplicateError = {
  code: '23505',
  message: 'duplicate key value violates unique constraint "tasks_srs_review_unique"',
};

function mockInsertResult(result: { data: typeof row | null; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  mocks.from.mockReturnValue({ insert });
  return insert;
}

describe('TaskService SRS database idempotency', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    mocks.getSession.mockResolvedValue({ data: { session: null } });
  });

  it('inserts stable lesson/day metadata and returns the saved database task', async () => {
    const insert = mockInsertResult({ data: row, error: null });
    expect(await TaskService.addReviewTask(userId, review)).toMatchObject({
      id: row.id,
      userId,
      srsLessonId: review.srsLessonId,
      srsReviewDate: review.srsReviewDate,
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        srs_lesson_id: review.srsLessonId,
        srs_review_date: review.srsReviewDate,
      }),
    );
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('returns a no-op on the SRS index conflict without creating a calendar event', async () => {
    const insert = mockInsertResult({ data: null, error: duplicateError });
    mocks.getSession.mockResolvedValue({ data: { session: { provider_token: 'calendar-token' } } });
    expect(await TaskService.addReviewTask(userId, review)).toBeNull();
    expect(insert).toHaveBeenCalledTimes(1);
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it.each([
    { code: '23505', message: 'duplicate key violates tasks_pkey' },
    { code: '42501', message: 'new row violates row-level security' },
    { code: 'PGRST204', message: 'srs_lesson_id missing from schema cache' },
    { code: '23514', message: 'tasks_srs_review_pair_check' },
  ])('propagates $code errors rather than retrying without idempotency metadata', async (error) => {
    const insert = mockInsertResult({ data: null, error });
    await expect(TaskService.addReviewTask(userId, review)).rejects.toEqual(error);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(mocks.createEvent).not.toHaveBeenCalled();
    expect(localStorage.getItem(`study_planner_tasks_${userId}`)).toBeNull();
  });

  it('propagates a network rejection without fabricating a saved task', async () => {
    const offline = new TypeError('Failed to fetch');
    mocks.from.mockImplementation(() => {
      throw offline;
    });
    await expect(TaskService.addReviewTask(userId, review)).rejects.toThrow(offline);
  });

  it('keeps local-only guest task creation without a database request', async () => {
    expect(await TaskService.addReviewTask('guest', review)).toMatchObject({
      userId: 'guest',
      srsLessonId: review.srsLessonId,
      srsReviewDate: review.srsReviewDate,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('creates a calendar event only for the insert that wins a concurrent race', async () => {
    let inserted = false;
    const single = vi.fn().mockImplementation(async () => {
      if (inserted) return { data: null, error: duplicateError };
      inserted = true;
      return { data: row, error: null };
    });
    const insert = vi.fn().mockReturnValue({ select: () => ({ single }) });
    const updateQuery = { eq: vi.fn() };
    updateQuery.eq.mockReturnValueOnce(updateQuery).mockResolvedValueOnce({ error: null });
    const update = vi.fn().mockReturnValue(updateQuery);
    mocks.from.mockReturnValue({ insert, update });
    mocks.getSession.mockResolvedValue({ data: { session: { provider_token: 'calendar-token' } } });
    mocks.createEvent.mockResolvedValue('calendar-event-1');

    const results = await Promise.all([
      TaskService.addReviewTask(userId, review),
      TaskService.addReviewTask(userId, review),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(results).toContain(null);
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ google_event_id: 'calendar-event-1' });
    expect(updateQuery.eq).toHaveBeenCalledWith('id', row.id);
    expect(updateQuery.eq).toHaveBeenCalledWith('user_id', userId);
  });

  it('preserves SRS metadata when loading tasks after a page reload', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [row], error: null }),
    };
    mocks.from.mockReturnValue(query);
    expect(await TaskService.fetchTasks(userId)).toEqual([
      expect.objectContaining({
        srsLessonId: review.srsLessonId,
        srsReviewDate: review.srsReviewDate,
      }),
    ]);
  });
});
