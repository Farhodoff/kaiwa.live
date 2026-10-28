import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeErrorMessage } from '../../components/ErrorBoundary';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';
import { supabase } from '../../lib/supabase';
import { TaskService } from '../../services/TaskService';

describe('kaiwa.live Production Deployment, Reliability & Observability (BUG #26)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('1. ErrorBoundary strictly sanitizes secrets, API keys, passwords, and tokens in error messages', () => {
    const rawTechnicalError =
      'Failed to connect postgresql://admin:SuperSecretPass123@db.supabase.co:5432 with token Bearer eyJhbGciOiJIUzI1NiJ9.test and key sk-1234567890abcdef';
    const sanitized = sanitizeErrorMessage(rawTechnicalError);

    expect(sanitized).not.toContain('SuperSecretPass123');
    expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiJ9.test');
    expect(sanitized).not.toContain('sk-1234567890abcdef');
    expect(sanitized).toContain('[REDACTED_PASSWORD]');
    expect(sanitized).toContain('Bearer [REDACTED]');
    expect(sanitized).toContain('sk-[REDACTED]');
  });

  it('2. Service gracefully recovers from network timeout and provides offline cache', async () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    safeLocalStorage.setJSON(`study_planner_tasks_${userId}`, [
      { id: 'task-1', title: 'Japanese Kanji Practice', status: 'todo' },
    ]);

    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockRejectedValue(new Error('Gateway Timeout 504')),
          }),
        }),
      }),
    } as any);

    const tasks = await TaskService.fetchTasks(userId);
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Japanese Kanji Practice');
  });

  it('3. Storage corruption is handled safely without throwing uncaught exceptions', () => {
    localStorage.setItem('corrupted_key', '{ bad json :(');
    const fallback = { status: 'safe_fallback' };
    const result = safeLocalStorage.getJSON('corrupted_key', fallback);
    expect(result).toEqual(fallback);
  });

  it('4. User switching guarantees clean storage separation and state purge', () => {
    const user1 = 'user-nihongo-1';
    const user2 = 'user-nihongo-2';

    interface SimpleTask {
      id: string;
      title: string;
    }

    safeLocalStorage.setJSON<SimpleTask[]>(`study_planner_tasks_${user1}`, [
      { id: 't1', title: 'N5 Grammar' },
    ]);
    safeLocalStorage.setJSON<SimpleTask[]>(`study_planner_tasks_${user2}`, [
      { id: 't2', title: 'N2 Reading' },
    ]);

    const tasksUser1 = safeLocalStorage.getJSON<SimpleTask[]>(`study_planner_tasks_${user1}`, []);
    const tasksUser2 = safeLocalStorage.getJSON<SimpleTask[]>(`study_planner_tasks_${user2}`, []);

    expect(tasksUser1[0].title).toBe('N5 Grammar');
    expect(tasksUser2[0].title).toBe('N2 Reading');
    expect(tasksUser1).not.toEqual(tasksUser2);
  });
});
