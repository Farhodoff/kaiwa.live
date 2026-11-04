import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTasks } from '../useTasks';
import { TaskService } from '../../services/TaskService';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test_user_id' } } }),
    },
  },
}));

vi.mock('../../services/TaskService', () => ({
  TaskService: {
    addTask: vi.fn(),
    updateTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
    restoreTask: vi.fn(),
    fetchTasks: vi.fn(),
    addTasksBatch: vi.fn(),
  },
}));

describe('useTasks offline localStorage sync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('writes to study_planner_tasks in localStorage when setTasks is called', () => {
    const { result } = renderHook(() => useTasks());
    const initialTasks = [
      {
        id: '1',
        title: 'Task 1',
        completed: false,
        status: 'todo',
        priority: 'medium',
        createdAt: new Date().toISOString(),
      },
    ];

    act(() => {
      result.current.setTasks(initialTasks as any);
    });

    const stored = localStorage.getItem('study_planner_tasks');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(initialTasks);
  });

  it('syncs localStorage on addTask, updateTask, toggleTask, and deleteTask', async () => {
    vi.mocked(TaskService.addTask).mockResolvedValue({
      id: 'real-id-1',
      userId: 'test_user_id',
      title: 'New Offline Task',
      completed: false,
      status: 'todo',
      priority: 'medium',
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    } as any);

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.addTask({ title: 'New Offline Task' });
    });

    const storedAfterAdd = JSON.parse(localStorage.getItem('study_planner_tasks') || '[]');
    expect(storedAfterAdd.some((t: any) => t.title === 'New Offline Task')).toBe(true);

    await act(async () => {
      await result.current.updateTask('real-id-1', { title: 'Updated Offline Task' });
    });

    const storedAfterUpdate = JSON.parse(localStorage.getItem('study_planner_tasks') || '[]');
    expect(storedAfterUpdate.find((t: any) => t.id === 'real-id-1')?.title).toBe(
      'Updated Offline Task',
    );

    await act(async () => {
      await result.current.deleteTask('real-id-1');
    });

    const storedAfterDelete = JSON.parse(localStorage.getItem('study_planner_tasks') || '[]');
    expect(storedAfterDelete.find((t: any) => t.id === 'real-id-1')).toBeUndefined();
  });
});
