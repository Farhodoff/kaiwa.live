import { Flashcard } from '../types';
import { Subject } from '../types';

/**
 * Calculates a mastery score (0-100) for a given set of flashcards.
 * Uses SRS interval as the primary proxy for retention.
 */
export const calculateMasteryScore = (cards: Flashcard[]): number => {
  if (cards.length === 0) return 0;

  let totalScore = 0;

  cards.forEach((card) => {
    // New cards or never reviewed
    if (!card.repetitions || card.repetitions === 0) {
      totalScore += 0;
      return;
    }

    // Interval based scoring
    const interval = card.interval || 0;

    if (interval >= 21) {
      totalScore += 100;
    } else if (interval >= 14) {
      totalScore += 85;
    } else if (interval >= 7) {
      totalScore += 60;
    } else if (interval >= 3) {
      totalScore += 40;
    } else if (interval > 1) {
      totalScore += 20;
    } else {
      totalScore += 10;
    }
  });

  return Math.round(totalScore / cards.length);
};

export interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  totalCards: number;
  masteredCards: number; // Interval >= 21
  strugglingCards: number; // Interval <= 1 && Repetitions > 0
  masteryScore: number; // 0-100
}

export const getSubjectAnalytics = (
  subjects: Subject[],
  flashcards: Flashcard[],
): SubjectAnalytics[] => {
  return subjects
    .map((subject) => {
      const subjectCards = flashcards.filter((c) => c.subjectId === subject.id);
      const masteryScore = calculateMasteryScore(subjectCards);

      const masteredCards = subjectCards.filter((c) => (c.interval || 0) >= 21).length;
      const strugglingCards = subjectCards.filter(
        (c) => (c.interval || 0) <= 1 && (c.repetitions || 0) > 0,
      ).length;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalCards: subjectCards.length,
        masteredCards,
        strugglingCards,
        masteryScore,
      };
    })
    .sort((a, b) => a.masteryScore - b.masteryScore); // Ascending: Weakest first
};

// Re-export realAnalytics for unified imports
export { calculateRealMetrics } from './realAnalytics';
export type { RealPerformanceMetrics } from './realAnalytics';

// Re-export real-time analytics & AI feedback services
export { RealTimeAnalyticsService } from '../services/RealTimeAnalyticsService';
export type {
  RealTimeMetricsSnapshot,
  RealTimeActivityEvent,
} from '../services/RealTimeAnalyticsService';
export { PersonalizedAiFeedbackService } from '../services/PersonalizedAiFeedbackService';
export type { PersonalizedAiFeedback } from '../services/PersonalizedAiFeedbackService';
export { ApiLoggingService } from '../services/ApiLoggingService';
export type {
  ApiLogEntry,
  ApiMetricsSummary,
  SystemMetricsSummary,
} from '../services/ApiLoggingService';
