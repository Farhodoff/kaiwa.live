import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlashcardService, getLocalFlashcardCache } from '../FlashcardService';
import {
  calculateReview,
  Rating,
  getPreviewIntervalLabels,
  sortCardsBySRSPriority,
  isDue,
  isOverdue,
  isNew,
} from '../../utils/srs';
import { cleanCardFront } from '../../components/decks/FlashcardStudySession';
import { toDeterministicUUID, isUuid } from '../../utils/uuid';
import { Flashcard } from '../../types';

describe('SRS Flashcards & Spaced Repetition Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('1. Deterministic UUID & User ID Resolution', () => {
    it('produces valid consistent UUID for Telegram and non-UUID user strings', () => {
      const tgUserId = 'tg-user-998877';
      const uuid1 = toDeterministicUUID(tgUserId);
      const uuid2 = toDeterministicUUID(tgUserId);

      expect(isUuid(uuid1)).toBe(true);
      expect(uuid1).toBe(uuid2);
      expect(uuid1).not.toBe(toDeterministicUUID('tg-user-112233'));
    });

    it('falls back to local cache safely for guest and local_user', async () => {
      const guestCards = await FlashcardService.fetchFlashcards('guest');
      expect(Array.isArray(guestCards)).toBe(true);

      const localCards = await FlashcardService.fetchFlashcards('local_user');
      expect(Array.isArray(localCards)).toBe(true);
    });

    it('saves card for guest into local cache with valid fallback attributes', async () => {
      const newCard = await FlashcardService.addFlashcard('guest', {
        front: '桜',
        back: 'Sakura / Olcha guli',
      });

      expect(newCard).not.toBeNull();
      expect(newCard?.front).toBe('桜');
      expect(newCard?.easeFactor).toBe(2.5);
      expect(newCard?.repetitions).toBe(0);

      const cache = getLocalFlashcardCache('guest');
      expect(cache.some((c) => c.front === '桜')).toBe(true);
    });
  });

  describe('3. SM-2 Spaced Repetition Algorithm & Calculations', () => {
    const baseDate = '2026-09-30T00:00:00.000Z';

    it('Rating.AGAIN resets interval to 1 day and schedules 10-minute intra-day review', () => {
      const result = calculateReview(Rating.AGAIN, 10, 5, 2.5, baseDate);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
      expect(result.easeFactor).toBeLessThan(2.5);
      // Intra-day review date should be within the same day (+10 mins)
      const baseMs = new Date(baseDate).getTime();
      const reviewMs = new Date(result.nextReviewDate).getTime();
      expect(reviewMs - baseMs).toBe(10 * 60 * 1000);
    });

    it('Rating.HARD schedules 30-minute intra-day review for new cards with interval 1', () => {
      const result = calculateReview(Rating.HARD, 0, 0, 2.5, baseDate);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
      const baseMs = new Date(baseDate).getTime();
      const reviewMs = new Date(result.nextReviewDate).getTime();
      expect(reviewMs - baseMs).toBe(30 * 60 * 1000);
    });

    it('Rating.GOOD expands interval progressively (2 days -> 6 days)', () => {
      const firstReview = calculateReview(Rating.GOOD, 0, 0, 2.5, baseDate);
      expect(firstReview.interval).toBe(2);
      expect(firstReview.repetitions).toBe(1);

      const secondReview = calculateReview(Rating.GOOD, firstReview.interval, 1, 2.5, baseDate);
      expect(secondReview.interval).toBe(6);
      expect(secondReview.repetitions).toBe(2);
    });

    it('Rating.EASY expands interval with bonus multiplier (4 days -> 10 days)', () => {
      const firstReview = calculateReview(Rating.EASY, 0, 0, 2.5, baseDate);
      expect(firstReview.interval).toBe(4);
      expect(firstReview.repetitions).toBe(1);

      const secondReview = calculateReview(Rating.EASY, firstReview.interval, 1, 2.5, baseDate);
      expect(secondReview.interval).toBe(10);
      expect(secondReview.repetitions).toBe(2);
      expect(secondReview.easeFactor).toBeGreaterThan(2.5);
    });

    it('getPreviewIntervalLabels returns localized user-friendly button strings', () => {
      const uzLabels = getPreviewIntervalLabels(0, 0, 2.5, false, baseDate);
      expect(uzLabels[Rating.AGAIN]).toBe('10 daq');
      expect(uzLabels[Rating.HARD]).toBe('30 daq');
      expect(uzLabels[Rating.GOOD]).toBe('2 kun');
      expect(uzLabels[Rating.EASY]).toBe('4 kun');

      const jaLabels = getPreviewIntervalLabels(0, 0, 2.5, true, baseDate);
      expect(jaLabels[Rating.AGAIN]).toBe('10分');
      expect(jaLabels[Rating.HARD]).toBe('30分');
      expect(jaLabels[Rating.GOOD]).toBe('2日');
      expect(jaLabels[Rating.EASY]).toBe('4日');
    });
  });

  describe('4. Card Priority Sorting & Due Status', () => {
    const today = new Date('2026-09-30T12:00:00.000Z');

    it('identifies overdue, due, and new cards accurately', () => {
      const overdueCard = {
        id: '1',
        nextReviewDate: '2026-09-25T00:00:00.000Z',
        repetitions: 3,
      } as Flashcard;
      const dueCard = {
        id: '2',
        nextReviewDate: '2026-09-30T08:00:00.000Z',
        repetitions: 2,
      } as Flashcard;
      const futureCard = {
        id: '3',
        nextReviewDate: '2026-10-05T00:00:00.000Z',
        repetitions: 1,
      } as Flashcard;
      const newCard = {
        id: '4',
        repetitions: 0,
      } as Flashcard;

      expect(isOverdue(overdueCard, today)).toBe(true);
      expect(isDue(overdueCard, today)).toBe(true);

      expect(isOverdue(dueCard, today)).toBe(false);
      expect(isDue(dueCard, today)).toBe(true);

      expect(isDue(futureCard, today)).toBe(false);
      expect(isNew(newCard)).toBe(true);
    });

    it('sortCardsBySRSPriority places overdue cards first', () => {
      const cards: Flashcard[] = [
        { id: 'future', nextReviewDate: '2026-10-10T00:00:00.000Z', repetitions: 2 } as Flashcard,
        { id: 'brand-new', repetitions: 0 } as Flashcard,
        {
          id: 'overdue-1',
          nextReviewDate: '2026-09-20T00:00:00.000Z',
          repetitions: 3,
        } as Flashcard,
        {
          id: 'overdue-2',
          nextReviewDate: '2026-09-15T00:00:00.000Z',
          repetitions: 3,
        } as Flashcard,
      ];

      const sorted = sortCardsBySRSPriority(cards, today);
      // Most overdue (oldest date: 2026-09-15) must come first
      expect(sorted[0].id).toBe('overdue-2');
      expect(sorted[1].id).toBe('overdue-1');
      expect(sorted[sorted.length - 1].id).toBe('future');
    });
  });

  describe('5. Clean Japanese OCR Artifacts in Flashcards', () => {
    it('cleans merged furigana and duplicates in cleanCardFront', () => {
      expect(cleanCardFront('みず水')).toBe('水');
      expect(cleanCardFront('たまご卵')).toBe('卵');
      expect(cleanCardFront('さかな魚')).toBe('魚');
      expect(cleanCardFront('転勤てんきん')).toBe('転勤');
      expect(cleanCardFront('大おお阪さか城じょう')).toBe('大阪城');
      expect(cleanCardFront('富士山')).toBe('富士山');
      expect(cleanCardFront('')).toBe('');
    });
  });
});
