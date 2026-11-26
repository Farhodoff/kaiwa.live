import type { MockExamItem } from '../services/HistoryService';

/** History contains both raw quiz counts and 180-point mock results. Never rescale them. */
export function practiceResult(item: MockExamItem): { label: string; basis: string | null } {
  if (typeof item.bandScore === 'number' && item.score <= item.totalQuestions) {
    return {
      label: `${item.score}/${item.totalQuestions}`,
      basis: `answers:${item.totalQuestions}`,
    };
  }
  if (item.score > item.totalQuestions && item.score <= 180) {
    return { label: `${item.score}/180`, basis: 'mock:180' };
  }
  // Older records do not identify the score format. Keep the saved value without
  // inventing a denominator or comparing it with a differently scored attempt.
  return { label: String(item.score), basis: null };
}
