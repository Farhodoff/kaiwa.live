import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGamification } from '../useGamification';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'test-user-gamify', email: 'gamer@example.com' } },
          error: null,
        }),
      ),
    },
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

describe('useGamification Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with given initial state', () => {
    const { result } = renderHook(() =>
      useGamification({
        totalXp: 250,
        level: 1,
        currentStreak: 3,
        lastActivityDate: '2026-08-19',
      }),
    );

    expect(result.current.gameState.totalXp).toBe(250);
    expect(result.current.gameState.level).toBe(1);
    expect(result.current.gameState.currentStreak).toBe(3);
  });

  it('awards XP, calculates accurate level according to getLevelInfo, and updates streak', async () => {
    const { result } = renderHook(() =>
      useGamification({
        totalXp: 450,
        level: 1,
        currentStreak: 2,
        lastActivityDate: '2026-08-19',
      }),
    );

    await act(async () => {
      await result.current.awardXP(100); // 450 + 100 = 550 XP -> Level 2
    });

    expect(result.current.gameState.totalXp).toBe(550);
    expect(result.current.gameState.level).toBe(2);
    expect(result.current.gameState.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it('returns appropriate title/rank based on level', () => {
    const { result } = renderHook(() =>
      useGamification({
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        lastActivityDate: null,
      }),
    );

    expect(result.current.getRank(1)).toBe("Boshlang'ich Talaba");
    expect(result.current.getRank(2)).toBe('Shogird');
    expect(result.current.getRank(5)).toBe('Ekspert');
    expect(result.current.getRank(8)).toBe('Professor');
  });

  it('resets XP and sets level back to 1 and streak to 0', async () => {
    const { result } = renderHook(() =>
      useGamification({
        totalXp: 12000,
        level: 7,
        currentStreak: 15,
        lastActivityDate: '2026-08-20',
      }),
    );

    await act(async () => {
      await result.current.resetXP();
    });

    expect(result.current.gameState.totalXp).toBe(0);
    expect(result.current.gameState.level).toBe(1);
    expect(result.current.gameState.currentStreak).toBe(0);
  });
});
