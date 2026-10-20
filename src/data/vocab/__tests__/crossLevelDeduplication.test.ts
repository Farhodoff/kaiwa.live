import { describe, expect, it } from 'vitest';
import n5Vocab from '../jlptVocabN5.json';
import n4Vocab from '../jlptVocabN4.json';
import n3Vocab from '../jlptVocabN3.json';
import n2Vocab from '../jlptVocabN2.json';
import n1Vocab from '../jlptVocabN1.json';

import n5Deck from '../../decks/jlpt_n5.json';
import n4Deck from '../../decks/jlpt_n4.json';
import n3Deck from '../../decks/jlpt_n3.json';
import n2Deck from '../../decks/jlpt_n2.json';
import n1Deck from '../../decks/jlpt_n1.json';

describe('Cross-Level JLPT Vocabulary and Deck Deduplication', () => {
  it('guarantees zero duplicate (word, reading) pairs across N5, N4, N3, N2, N1 vocabulary datasets', () => {
    const vocabDatasets = [
      { level: 'N5', items: n5Vocab },
      { level: 'N4', items: n4Vocab },
      { level: 'N3', items: n3Vocab },
      { level: 'N2', items: n2Vocab },
      { level: 'N1', items: n1Vocab },
    ];

    const seenKeys = new Map<string, string>();
    const duplicates: { key: string; level1: string; level2: string }[] = [];

    for (const dataset of vocabDatasets) {
      for (const item of dataset.items) {
        const key = `${item.word.trim()}#${item.reading.trim()}`;
        if (seenKeys.has(key)) {
          duplicates.push({
            key,
            level1: seenKeys.get(key)!,
            level2: dataset.level,
          });
        } else {
          seenKeys.set(key, dataset.level);
        }
      }
    }

    expect(
      duplicates,
      `Expected zero cross-level duplicate words, but found ${duplicates.length}: ${JSON.stringify(duplicates.slice(0, 10))}`,
    ).toEqual([]);
    expect(seenKeys.size).toBe(9860);
  });

  it('guarantees zero duplicate front cards across all 5 JLPT master flashcard decks', () => {
    const decks = [
      { level: 'n5', cards: n5Deck },
      { level: 'n4', cards: n4Deck },
      { level: 'n3', cards: n3Deck },
      { level: 'n2', cards: n2Deck },
      { level: 'n1', cards: n1Deck },
    ];

    const seenFronts = new Map<string, string>();
    const duplicateCards: { front: string; deck1: string; deck2: string }[] = [];

    for (const deck of decks) {
      for (const card of deck.cards) {
        const front = card.front.trim();
        if (seenFronts.has(front)) {
          duplicateCards.push({
            front,
            deck1: seenFronts.get(front)!,
            deck2: deck.level,
          });
        } else {
          seenFronts.set(front, deck.level);
        }
      }
    }

    expect(
      duplicateCards,
      `Expected zero cross-level duplicate cards in master decks, but found ${duplicateCards.length}: ${JSON.stringify(duplicateCards.slice(0, 10))}`,
    ).toEqual([]);
    expect(seenFronts.size).toBe(9551);
  });
});
