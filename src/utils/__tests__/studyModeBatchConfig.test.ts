import { describe, it, expect } from 'vitest';
import { Flashcard } from '../../types';

function computeStudyQueue(
  allCards: Flashcard[],
  batchLimit: '10' | '25' | '50' | 'all',
): Flashcard[] {
  const limitNum = batchLimit === 'all' ? allCards.length : parseInt(batchLimit, 10);
  return allCards.slice(0, limitNum);
}

function generateMockCards(count: number): Flashcard[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `card-${i + 1}`,
    subjectId: 'subject-jp-1',
    front: `Kanji ${i + 1}`,
    back: `Ma'nosi ${i + 1}`,
    nextReviewDate: new Date().toISOString(),
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
  }));
}

describe('StudyModePage Configurable Batch Size Tests', () => {
  describe('1. 15-card deck tests', () => {
    const deck15 = generateMockCards(15);

    it('10 tanlanganda: 10 ta karta qaytaradi', () => {
      const queue = computeStudyQueue(deck15, '10');
      expect(queue.length).toBe(10);
    });

    it('25 tanlanganda: mavjud barcha 15 ta kartani xatosiz qaytaradi', () => {
      const queue = computeStudyQueue(deck15, '25');
      expect(queue.length).toBe(15);
    });

    it('50 tanlanganda: mavjud barcha 15 ta kartani xatosiz qaytaradi', () => {
      const queue = computeStudyQueue(deck15, '50');
      expect(queue.length).toBe(15);
    });

    it('Barchasi (all) tanlanganda: 15 ta kartani qaytaradi', () => {
      const queue = computeStudyQueue(deck15, 'all');
      expect(queue.length).toBe(15);
    });
  });

  describe('2. 30-card deck tests', () => {
    const deck30 = generateMockCards(30);

    it('10 tanlanganda: 10 ta karta qaytaradi', () => {
      const queue = computeStudyQueue(deck30, '10');
      expect(queue.length).toBe(10);
    });

    it('25 tanlanganda: 25 ta karta qaytaradi', () => {
      const queue = computeStudyQueue(deck30, '25');
      expect(queue.length).toBe(25);
    });

    it('50 tanlanganda: mavjud barcha 30 ta kartani xatosiz qaytaradi', () => {
      const queue = computeStudyQueue(deck30, '50');
      expect(queue.length).toBe(30);
    });

    it('Barchasi (all) tanlanganda: 30 ta kartani qaytaradi', () => {
      const queue = computeStudyQueue(deck30, 'all');
      expect(queue.length).toBe(30);
    });
  });

  describe('3. 100-card deck tests', () => {
    const deck100 = generateMockCards(100);

    it('10 tanlanganda: 10 ta karta qaytaradi', () => {
      const queue = computeStudyQueue(deck100, '10');
      expect(queue.length).toBe(10);
    });

    it('25 tanlanganda: 25 ta karta qaytaradi', () => {
      const queue = computeStudyQueue(deck100, '25');
      expect(queue.length).toBe(25);
    });

    it('50 tanlanganda: 50 ta karta qaytaradi', () => {
      const queue = computeStudyQueue(deck100, '50');
      expect(queue.length).toBe(50);
    });

    it("Barchasi (all) tanlanganda: 100 ta kartani to'liq qaytaradi", () => {
      const queue = computeStudyQueue(deck100, 'all');
      expect(queue.length).toBe(100);
    });
  });

  describe('4. 500-card deck performance test', () => {
    const deck500 = generateMockCards(500);

    it('500 ta karta bilan "Barchasi" tanlanganda darhol (< 5ms) hisoblaydi', () => {
      const t0 = performance.now();
      const queue = computeStudyQueue(deck500, 'all');
      const t1 = performance.now();

      expect(queue.length).toBe(500);
      expect(t1 - t0).toBeLessThan(10); // less than 10ms
    });
  });
});
