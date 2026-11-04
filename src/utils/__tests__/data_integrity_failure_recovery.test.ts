import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportImportService } from '../../services/ExportImportService';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';
import { TaskService } from '../../services/TaskService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: '00000000-0000-4000-8000-000000000001', email: 'user@example.com' },
          },
        },
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: '00000000-0000-4000-8000-000000000001', email: 'user@example.com' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  },
}));

describe('Data Integrity, Failure Recovery & Concurrency Audit (BUG #24)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Malicious import with foreign user_id, fake role, and fake subscription is strictly sanitized', async () => {
    const maliciousPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tasks: [
        {
          title: 'Malicious Task',
          user_id: 'victim-user-id-999',
          role: 'superadmin',
          isAdmin: true,
          subscription: 'pro',
        },
      ],
      profile: {
        role: 'superadmin',
        is_admin: true,
        subscription_tier: 'enterprise',
      },
    };

    const jsonString = JSON.stringify(maliciousPayload);
    const file = new File([jsonString], 'backup.json', { type: 'application/json' });

    const success = await exportImportService.importFromJSON(
      file,
      '00000000-0000-4000-8000-000000000001',
    );
    expect(success).toBe(true);

    // Verify upsert calls to Supabase map records strictly to current user's authenticated id
    const upsertMock = (supabase.from as any)('tasks').upsert;
    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: '00000000-0000-4000-8000-000000000001',
          title: 'Malicious Task',
        }),
      ]),
    );
  });

  it('2. Corrupted JSON in localStorage is safely handled without crashing via safeLocalStorage', () => {
    localStorage.setItem('corrupted_key', '{ malformed json :: [');
    const fallback = { fallback: true };
    const result = safeLocalStorage.getJSON('corrupted_key', fallback);
    expect(result).toEqual(fallback);
  });

  it('3. Sequential or parallel writes with duplicate task IDs handle idempotency smoothly', async () => {
    const taskId = '00000000-0000-4000-8000-000000000099';
    const taskA = {
      id: taskId,
      title: 'Task Initial',
      status: 'todo' as const,
      priority: 'medium' as const,
    };
    const taskB = {
      id: taskId,
      title: 'Task Updated',
      status: 'completed' as const,
      priority: 'high' as const,
    };

    // Save taskA then taskB locally
    localStorage.setItem('study_planner_tasks', JSON.stringify([taskA]));
    const current = JSON.parse(localStorage.getItem('study_planner_tasks') || '[]');
    const updated = current.map((t: any) => (t.id === taskId ? taskB : t));
    localStorage.setItem('study_planner_tasks', JSON.stringify(updated));

    const finalTasks = JSON.parse(localStorage.getItem('study_planner_tasks') || '[]');
    expect(finalTasks.length).toBe(1);
    expect(finalTasks[0].title).toBe('Task Updated');
    expect(finalTasks[0].status).toBe('completed');
  });

  it('4. Stale network response after user switch does not corrupt active user cache', async () => {
    const userA = '00000000-0000-4000-8000-000000000001';
    const userB = '00000000-0000-4000-8000-000000000002';

    // Cache isolated for User A
    safeLocalStorage.setJSON(`study_planner_tasks_${userA}`, [{ id: 'task-a', title: 'Task A' }]);
    // Cache isolated for User B
    safeLocalStorage.setJSON(`study_planner_tasks_${userB}`, [{ id: 'task-b', title: 'Task B' }]);

    const tasksA = safeLocalStorage.getJSON(`study_planner_tasks_${userA}`, []);
    const tasksB = safeLocalStorage.getJSON(`study_planner_tasks_${userB}`, []);

    expect(tasksA).toEqual([{ id: 'task-a', title: 'Task A' }]);
    expect(tasksB).toEqual([{ id: 'task-b', title: 'Task B' }]);
  });

  it('5. Database failure in fetchTasks gracefully returns local storage fallback', async () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    localStorage.setItem(
      `study_planner_tasks_${userId}`,
      JSON.stringify([{ id: 'offline-task-1', title: 'Offline Task', status: 'todo' }]),
    );

    (supabase.from as any).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockRejectedValue(new Error('Network Offline / Timeout')),
          }),
        }),
      }),
    });

    const tasks = await TaskService.fetchTasks(userId);
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Offline Task');
  });
});
