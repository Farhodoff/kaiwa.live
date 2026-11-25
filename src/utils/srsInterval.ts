export interface SrsState {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
}

/**
 * SuperMemo SM-2 Spaced Repetition calculation algorithm.
 * quality: 0 (total blackout) to 5 (perfect response)
 */
export function calculateNextReview(state: SrsState, quality: number): SrsState {
  let { repetitions, intervalDays, easeFactor } = state;

  if (quality >= 3) {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions++;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  // Calculate new ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  return { repetitions, intervalDays, easeFactor: Number(easeFactor.toFixed(2)) };
}
