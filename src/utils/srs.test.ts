import { describe, expect, it } from 'vitest';
import {
  buildDailyStudyQueue,
  calculateReview,
  Rating,
  sortCardsBySRSPriority,
  getPreviewIntervalLabels,
  deduplicateCardsByFront,
} from './srs';

describe('SRS (Spaced Repetition System) Utils', () => {
  describe('calculateReview', () => {
    describe('New card (first review)', () => {
      it('should set interval to 2 days for GOOD rating', () => {
        const result = calculateReview(Rating.GOOD, 0, 0, 2.5);
        expect(result.interval).toBe(2);
        expect(result.repetitions).toBe(1);
        expect(result.easeFactor).toBeGreaterThan(0);
      });

      it('should set interval to 4 days for EASY rating', () => {
        const result = calculateReview(Rating.EASY, 0, 0, 2.5);
        expect(result.interval).toBe(4);
        expect(result.repetitions).toBe(1);
      });

      it('should reset to interval 1 for AGAIN rating', () => {
        const result = calculateReview(Rating.AGAIN, 0, 0, 2.5);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
      });

      it('should set interval to 1 day for HARD rating on first review', () => {
        const result = calculateReview(Rating.HARD, 0, 0, 2.5);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);
      });
    });

    describe('Second review (repetitions = 1)', () => {
      it('should set interval to 6 days for GOOD rating', () => {
        const result = calculateReview(Rating.GOOD, 1, 1, 2.5);
        expect(result.interval).toBe(6);
        expect(result.repetitions).toBe(2);
      });

      it('should set interval to 10 days for EASY rating', () => {
        const result = calculateReview(Rating.EASY, 1, 1, 2.5);
        expect(result.interval).toBe(10);
        expect(result.repetitions).toBe(2);
      });

      it('should reset on AGAIN rating', () => {
        const result = calculateReview(Rating.AGAIN, 1, 1, 2.5);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
      });
    });

    describe('Subsequent reviews (repetitions >= 2)', () => {
      it('should multiply interval by ease factor for GOOD rating', () => {
        const result = calculateReview(Rating.GOOD, 6, 2, 2.5);
        expect(result.interval).toBe(Math.round(6 * 2.5)); // 15
        expect(result.repetitions).toBe(3);
      });

      it('should increase interval for EASY rating', () => {
        const result = calculateReview(Rating.EASY, 6, 2, 2.5);
        expect(result.interval).toBeGreaterThan(6);
        expect(result.repetitions).toBe(3);
      });

      it('should reset progress on AGAIN rating', () => {
        const result = calculateReview(Rating.AGAIN, 15, 3, 2.5);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
      });
    });

    describe('Ease factor adjustments', () => {
      it('should increase ease factor for EASY rating', () => {
        const initialEF = 2.5;
        const result = calculateReview(Rating.EASY, 6, 2, initialEF);
        expect(result.easeFactor).toBeGreaterThan(initialEF);
      });

      it('should decrease ease factor for HARD rating', () => {
        const initialEF = 2.5;
        const result = calculateReview(Rating.HARD, 6, 2, initialEF);
        expect(result.easeFactor).toBeLessThanOrEqual(initialEF);
      });

      it('should maintain minimum ease factor of 1.3', () => {
        const result = calculateReview(Rating.AGAIN, 6, 2, 1.3);
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      });

      it('should decrease ease factor on AGAIN', () => {
        const initialEF = 2.5;
        const result = calculateReview(Rating.AGAIN, 6, 2, initialEF);
        expect(result.easeFactor).toBeLessThan(initialEF);
      });
    });

    describe('Next review date', () => {
      it('should return a valid ISO date string', () => {
        const result = calculateReview(Rating.GOOD, 0, 0, 2.5);
        expect(result.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(() => new Date(result.nextReviewDate)).not.toThrow();
      });

      it('should set next review date in the future', () => {
        const result = calculateReview(Rating.GOOD, 6, 2, 2.5);
        const nextDate = new Date(result.nextReviewDate);
        const now = new Date();
        expect(nextDate.getTime()).toBeGreaterThan(now.getTime());
      });

      it('should calculate correct interval for next review', () => {
        const result = calculateReview(Rating.GOOD, 0, 0, 2.5);
        const nextDate = new Date(result.nextReviewDate);
        const todayMidnightUTC = new Date(
          Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
        );
        const daysDiff = Math.round(
          (nextDate.getTime() - todayMidnightUTC.getTime()) / (1000 * 60 * 60 * 24),
        );
        expect(daysDiff).toBe(result.interval);
        expect(result.dueInDays).toBe(result.interval);
      });
    });

    describe('Edge cases', () => {
      it('should handle very high intervals', () => {
        const result = calculateReview(Rating.GOOD, 365, 10, 2.5);
        expect(result.interval).toBeGreaterThan(365);
        expect(result.repetitions).toBe(11);
      });

      it('should handle very low ease factor', () => {
        const result = calculateReview(Rating.GOOD, 6, 2, 1.3);
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      });

      it('should handle very high ease factor', () => {
        const result = calculateReview(Rating.EASY, 6, 2, 4.0);
        expect(result.interval).toBeGreaterThan(6);
      });

      it('should round ease factor to 2 decimal places', () => {
        const result = calculateReview(Rating.GOOD, 6, 2, 2.5);
        const decimalPlaces = (result.easeFactor.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });

    describe('All rating grades', () => {
      it('should handle AGAIN (0) rating', () => {
        const result = calculateReview(Rating.AGAIN, 6, 2, 2.5);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
      });

      it('should handle HARD (1) rating', () => {
        const result = calculateReview(Rating.HARD, 6, 2, 2.5);
        expect(result.interval).toBeGreaterThan(6);
        expect(result.repetitions).toBe(3);
      });

      it('should handle GOOD (2) rating', () => {
        const result = calculateReview(Rating.GOOD, 6, 2, 2.5);
        expect(result.interval).toBeGreaterThan(1);
        expect(result.repetitions).toBe(3);
      });

      it('should handle EASY (3) rating', () => {
        const result = calculateReview(Rating.EASY, 6, 2, 2.5);
        expect(result.interval).toBeGreaterThan(1);
        expect(result.repetitions).toBe(3);
      });
    });

    describe('sortCardsBySRSPriority', () => {
      it('should order overdue cards before due today and new cards', () => {
        const now = new Date('2026-09-02T12:00:00.000Z');
        const overdueCard = {
          id: 'c1',
          nextReviewDate: '2026-08-30T00:00:00.000Z',
          repetitions: 3,
        };
        const dueTodayCard = {
          id: 'c2',
          nextReviewDate: '2026-09-02T08:00:00.000Z',
          repetitions: 2,
        };
        const newCard = { id: 'c3', repetitions: 0 };
        const futureCard = { id: 'c4', nextReviewDate: '2026-09-10T00:00:00.000Z', repetitions: 4 };

        const mixed = [futureCard, newCard, dueTodayCard, overdueCard];
        const sorted = sortCardsBySRSPriority(mixed, now);

        expect(sorted[0].id).toBe('c1'); // Overdue is first
        expect(sorted[1].id).toBe('c2'); // Due today is second
        expect(sorted[2].id).toBe('c3'); // Brand-new is third
        expect(sorted[3].id).toBe('c4'); // Future is last
      });
    });

    describe('buildDailyStudyQueue', () => {
      const now = new Date('2026-09-02T12:00:00.000Z');

      it('includes overdue, due and limited new cards but excludes future reviews', () => {
        const cards = [
          { id: 'future', nextReviewDate: '2026-09-10T00:00:00.000Z', repetitions: 4 },
          { id: 'due', nextReviewDate: '2026-09-02T08:00:00.000Z', repetitions: 2 },
          { id: 'overdue', nextReviewDate: '2026-08-30T00:00:00.000Z', repetitions: 3 },
          ...Array.from({ length: 12 }, (_, index) => ({ id: `new-${index}`, repetitions: 0 })),
        ];

        const queue = buildDailyStudyQueue(cards, { now, maxNewCards: 10 });

        expect(queue).toHaveLength(12);
        expect(queue[0].id).toBe('overdue');
        expect(queue[1].id).toBe('due');
        expect(queue.some((card) => card.id === 'future')).toBe(false);
        expect(queue.filter((card) => card.id.startsWith('new-'))).toHaveLength(10);
      });

      it('returns an empty queue when every reviewed card is scheduled in the future', () => {
        const queue = buildDailyStudyQueue(
          [
            { id: 'future-1', nextReviewDate: '2026-09-10T00:00:00.000Z', repetitions: 2 },
            { id: 'future-2', nextReviewDate: '2026-10-10T00:00:00.000Z', repetitions: 5 },
          ],
          { now },
        );

        expect(queue).toEqual([]);
      });

      it('applies the total batch limit after SRS priority ordering', () => {
        const queue = buildDailyStudyQueue(
          [
            { id: 'new', repetitions: 0 },
            { id: 'due', nextReviewDate: '2026-09-02T08:00:00.000Z', repetitions: 2 },
            { id: 'overdue', nextReviewDate: '2026-08-30T00:00:00.000Z', repetitions: 3 },
          ],
          { now, maxTotalCards: 2 },
        );

        expect(queue.map((card) => card.id)).toEqual(['overdue', 'due']);
      });
    });

    describe('Intra-day repetitions and getPreviewIntervalLabels', () => {
      it('should schedule AGAIN rating 10 minutes in the future within the same day', () => {
        const base = new Date('2026-09-10T12:00:00.000Z');
        const result = calculateReview(Rating.AGAIN, 0, 0, 2.5, base);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
        expect(result.dueInDays).toBe(1);
        expect(result.nextReviewDate).toBe('2026-09-10T12:10:00.000Z');
        expect(result.dueDate).toBe('2026-09-11');
      });

      it('should schedule HARD rating for brand-new card 30 minutes in the future within the same day', () => {
        const base = new Date('2026-09-10T12:00:00.000Z');
        const result = calculateReview(Rating.HARD, 0, 0, 2.5, base);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);
        expect(result.dueInDays).toBe(1);
        expect(result.nextReviewDate).toBe('2026-09-10T12:30:00.000Z');
        expect(result.dueDate).toBe('2026-09-11');
      });

      it('should provide calibrated preview interval labels for new card (0 reps)', () => {
        const labelsUz = getPreviewIntervalLabels(0, 0, 2.5, false);
        expect(labelsUz[Rating.AGAIN]).toBe('10 daq');
        expect(labelsUz[Rating.HARD]).toBe('30 daq');
        expect(labelsUz[Rating.GOOD]).toBe('2 kun');
        expect(labelsUz[Rating.EASY]).toBe('4 kun');

        const labelsJa = getPreviewIntervalLabels(0, 0, 2.5, true);
        expect(labelsJa[Rating.AGAIN]).toBe('10分');
        expect(labelsJa[Rating.HARD]).toBe('30分');
        expect(labelsJa[Rating.GOOD]).toBe('2日');
        expect(labelsJa[Rating.EASY]).toBe('4日');
      });

      it('should provide mature preview interval labels when card is advanced (>= 2 reps)', () => {
        const labels = getPreviewIntervalLabels(6, 2, 2.5, false);
        expect(labels[Rating.AGAIN]).toBe('10 daq');
        expect(labels[Rating.HARD]).toBe('7 kun'); // Math.round(6 * 1.2) = 7
        expect(labels[Rating.GOOD]).toBe('15 kun'); // Math.round(6 * 2.5) = 15
        expect(labels[Rating.EASY]).toBe('20 kun'); // Math.round(6 * 2.5 * 1.3) = 20
      });
    });

    describe('deduplicateCardsByFront & SRS Cross-Level Protection', () => {
      it('should keep the most mature card when duplicate cards have identical front', () => {
        const cards = [
          { id: '1', front: '病院', repetitions: 0, interval: 0 },
          { id: '2', front: '病院 ', repetitions: 3, interval: 12 },
          { id: '3', front: '猫', repetitions: 1, interval: 2 },
        ];

        const deduped = deduplicateCardsByFront(cards);
        expect(deduped).toHaveLength(2);

        const byouin = deduped.find((c) => c.front.trim() === '病院');
        expect(byouin).toBeDefined();
        expect(byouin!.id).toBe('2');
        expect(byouin!.repetitions).toBe(3);
        expect(byouin!.interval).toBe(12);
      });

      it('should automatically deduplicate duplicate cards in buildDailyStudyQueue', () => {
        const now = new Date('2026-09-01T10:00:00Z');
        const cards = [
          {
            id: '1',
            front: '辞書',
            repetitions: 1,
            interval: 1,
            nextReviewDate: '2026-08-30T00:00:00Z',
          },
          {
            id: '2',
            front: '辞書',
            repetitions: 4,
            interval: 15,
            nextReviewDate: '2026-08-25T00:00:00Z',
          },
          { id: '3', front: '桜', repetitions: 0, interval: 0 },
          { id: '4', front: '桜', repetitions: 0, interval: 0 },
        ];

        const queue = buildDailyStudyQueue(cards, { now });
        expect(queue).toHaveLength(2);

        const fronts = queue.map((c) => c.front.trim());
        expect(new Set(fronts).size).toBe(2);
        expect(queue.find((c) => c.front === '辞書')?.id).toBe('2');
      });
    });
  });
});
