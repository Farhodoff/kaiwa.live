import { describe, it, expect } from 'vitest';
import { calculateNextReview, SrsState } from '../srsInterval';

describe('SuperMemo SM-2 Interval Calculation', () => {
  it('resets interval and repetitions on failed recall (quality < 3)', () => {
    const state: SrsState = { repetitions: 4, intervalDays: 14, easeFactor: 2.5 };
    const next = calculateNextReview(state, 2);
    expect(next.repetitions).toBe(0);
    expect(next.intervalDays).toBe(1);
  });

  it('progresses repetition intervals on good recall (quality 5)', () => {
    let state: SrsState = { repetitions: 0, intervalDays: 1, easeFactor: 2.5 };
    state = calculateNextReview(state, 5);
    expect(state.intervalDays).toBe(1);
    expect(state.repetitions).toBe(1);

    state = calculateNextReview(state, 5);
    expect(state.intervalDays).toBe(6);
    expect(state.repetitions).toBe(2);
  });
});
