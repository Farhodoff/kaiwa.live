import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGoals } from '../useGoals';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: '00000000-0000-4000-8000-000000000001' } } },
      }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

describe('useGoals hook reliability and DB mapping (BUG #24-A)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. addGoal correctly sends deadline column (not target_date) to Supabase goals table', async () => {
    const { result } = renderHook(() => useGoals());

    await act(async () => {
      await result.current.addGoal({
        title: 'Pass JLPT N2',
        description: 'Grammar and Reading',
        deadline: '2026-12-01T00:00:00.000Z',
        progress: 25,
        color: '#6366f1',
        priority: 'high',
      });
    });

    expect(result.current.goals.length).toBe(1);
    expect(result.current.goals[0].title).toBe('Pass JLPT N2');

    const insertMock = (supabase.from as any)('goals').insert;
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pass JLPT N2',
        deadline: '2026-12-01T00:00:00.000Z',
        user_id: '00000000-0000-4000-8000-000000000001',
      }),
    );
  });

  it('2. updateGoal sends sanitized dbUpdates with deadline column to Supabase', async () => {
    const { result } = renderHook(() => useGoals());
    let createdGoal: any;

    await act(async () => {
      createdGoal = await result.current.addGoal({
        title: 'Pass IELTS 7.5',
        deadline: '2026-11-01T00:00:00.000Z',
      });
    });

    await act(async () => {
      await result.current.updateGoal(createdGoal.id, {
        progress: 60,
        deadline: '2026-12-15T00:00:00.000Z',
      });
    });

    const updateMock = (supabase.from as any)('goals').update;
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 60,
        deadline: '2026-12-15T00:00:00.000Z',
      }),
    );
  });

  it('3. deleteGoal deletes from local state and triggers Supabase delete', async () => {
    const { result } = renderHook(() => useGoals());
    let createdGoal: any;

    await act(async () => {
      createdGoal = await result.current.addGoal({
        title: 'Temporary Goal',
      });
    });

    expect(result.current.goals.length).toBe(1);

    await act(async () => {
      await result.current.deleteGoal(createdGoal.id);
    });

    expect(result.current.goals.length).toBe(0);
    const deleteMock = (supabase.from as any)('goals').delete;
    expect(deleteMock).toHaveBeenCalled();
  });
});
