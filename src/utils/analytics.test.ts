import { describe, expect, it } from 'vitest';
import { calculateMasteryScore, getSubjectAnalytics } from './analytics';
import { Flashcard } from '../types';
import { Subject } from '../types';

describe('Analytics Utils', () => {
  describe('calculateMasteryScore', () => {
    it('should return 0 for empty array', () => {
      const result = calculateMasteryScore([]);
      expect(result).toBe(0);
    });

    it('should return 0 for cards never reviewed', () => {
      const cards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 0,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = calculateMasteryScore(cards);
      expect(result).toBe(0);
    });

    it('should score struggling cards (interval <= 1) as 10%', () => {
      const cards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 1,
          repetitions: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = calculateMasteryScore(cards);
      expect(result).toBe(10);
    });

    it('should score cards with interval 2-3 days as 20%', () => {
      const cards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 2,
          repetitions: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = calculateMasteryScore(cards);
      expect(result).toBe(20);
    });

    it('should score cards with interval 3-6 days as 40%', () => {
      const cards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 5,
          repetitions: 2,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = calculateMasteryScore(cards);
      expect(result).toBe(40);
    });

    it('should score cards with interval 7-13 days as 60%', () => {
      const cards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 10,
          repetitions: 3,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = calculateMasteryScore(cards);
      expect(result).toBe(60);
    });

    it('should score cards with interval 14-20 days as 85%', () => {
      const cards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 15,
          repetitions: 4,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = calculateMasteryScore(cards);
      expect(result).toBe(85);
    });

    it('should score mastered cards (interval >= 21) as 100%', () => {
      const cards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 30,
          repetitions: 5,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = calculateMasteryScore(cards);
      expect(result).toBe(100);
    });

    it('should calculate average score for multiple cards', () => {
      const cards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 1,
          repetitions: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        }, // 10%
        {
          id: '2',
          subjectId: 'sub1',
          front: 'Q2',
          back: 'A2',
          interval: 30,
          repetitions: 5,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        }, // 100%
      ];
      const result = calculateMasteryScore(cards);
      expect(result).toBe(55); // (10 + 100) / 2 = 55
    });

    it('should round the final score', () => {
      const cards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 2,
          repetitions: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        }, // 20
        {
          id: '2',
          subjectId: 'sub1',
          front: 'Q2',
          back: 'A2',
          interval: 5,
          repetitions: 2,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        }, // 40
        {
          id: '3',
          subjectId: 'sub1',
          front: 'Q3',
          back: 'A3',
          interval: 10,
          repetitions: 3,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        }, // 60
      ];
      const result = calculateMasteryScore(cards);
      expect(result).toBe(40); // (20 + 40 + 60) / 3 = 40
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('getSubjectAnalytics', () => {
    const subjects: Subject[] = [
      {
        id: 'sub1',
        name: 'Mathematics',
        color: '#3b82f6',
        schedule: ['Mon 10:00'],
      },
      {
        id: 'sub2',
        name: 'Physics',
        color: '#10b981',
        schedule: ['Tue 14:00'],
      },
    ];

    it('should return empty array for no subjects', () => {
      const result = getSubjectAnalytics([], []);
      expect(result).toEqual([]);
    });

    it('should calculate analytics for subjects with no cards', () => {
      const result = getSubjectAnalytics(subjects, []);
      expect(result).toHaveLength(2);
      expect(result[0].totalCards).toBe(0);
      expect(result[0].masteredCards).toBe(0);
      expect(result[0].strugglingCards).toBe(0);
      expect(result[0].masteryScore).toBe(0);
    });

    it('should count total cards per subject', () => {
      const flashcards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 10,
          repetitions: 3,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
        {
          id: '2',
          subjectId: 'sub1',
          front: 'Q2',
          back: 'A2',
          interval: 20,
          repetitions: 4,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = getSubjectAnalytics(subjects, flashcards);
      const mathSubject = result.find((s) => s.subjectId === 'sub1');
      expect(mathSubject?.totalCards).toBe(2);
    });

    it('should count mastered cards (interval >= 21)', () => {
      const flashcards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 30,
          repetitions: 5,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
        {
          id: '2',
          subjectId: 'sub1',
          front: 'Q2',
          back: 'A2',
          interval: 10,
          repetitions: 3,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = getSubjectAnalytics(subjects, flashcards);
      const mathSubject = result.find((s) => s.subjectId === 'sub1');
      expect(mathSubject?.masteredCards).toBe(1);
    });

    it('should count struggling cards (interval <= 1 and repetitions > 0)', () => {
      const flashcards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 1,
          repetitions: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
        {
          id: '2',
          subjectId: 'sub1',
          front: 'Q2',
          back: 'A2',
          interval: 0,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = getSubjectAnalytics(subjects, flashcards);
      const mathSubject = result.find((s) => s.subjectId === 'sub1');
      expect(mathSubject?.strugglingCards).toBe(1); // Only the one with repetitions > 0
    });

    it('should calculate mastery score for each subject', () => {
      const flashcards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 30,
          repetitions: 5,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const result = getSubjectAnalytics(subjects, flashcards);
      const mathSubject = result.find((s) => s.subjectId === 'sub1');
      expect(mathSubject?.masteryScore).toBe(100);
    });

    it('should sort subjects by mastery score (ascending)', () => {
      const flashcards: Flashcard[] = [
        {
          id: '1',
          subjectId: 'sub1',
          front: 'Q1',
          back: 'A1',
          interval: 30,
          repetitions: 5,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        }, // 100%
        {
          id: '2',
          subjectId: 'sub2',
          front: 'Q2',
          back: 'A2',
          interval: 1,
          repetitions: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        }, // 10%
      ];
      const result = getSubjectAnalytics(subjects, flashcards);
      expect(result[0].subjectId).toBe('sub2'); // Weakest first
      expect(result[1].subjectId).toBe('sub1');
    });

    it('should include subject name in analytics', () => {
      const result = getSubjectAnalytics(subjects, []);
      expect(result[0].subjectName).toBe('Mathematics');
      expect(result[1].subjectName).toBe('Physics');
    });
  });
});
