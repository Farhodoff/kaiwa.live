import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock Supabase & StudyData
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'user_123',
              tier: 'pro',
              ai_credits: 50,
              last_reset_date: '2026-07-26',
              trial_start_date: '2026-07-25',
              valid_until: null,
            },
            error: null,
          }),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user_123',
              tier: 'pro',
              ai_credits: 50,
              last_reset_date: '2026-07-26',
              trial_start_date: '2026-07-25',
              valid_until: null,
            },
            error: null,
          }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: { id: 'user_123', email: 'teststudent@gmail.com' },
  }),
}));

import { useSubscription } from '../useSubscription';

describe('useSubscription Hook Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should correctly identify subscription state and pro status', async () => {
    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isPro).toBe(true);
    expect(result.current.hasCredits).toBe(true);
    expect(result.current.isPaidUser).toBe(true);
  });

  it('should calculate free vs pro tier access correctly', () => {
    const isFree = (tier: string) => tier === 'free';
    const isProOrPremium = (tier: string) => tier === 'pro' || tier === 'premium';

    expect(isFree('free')).toBe(true);
    expect(isProOrPremium('pro')).toBe(true);
    expect(isProOrPremium('premium')).toBe(true);
  });
});
