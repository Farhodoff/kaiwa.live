import { describe, expect, it } from 'vitest';
import type { PresetCard, PresetDeck } from '../../data/presetDecks';
import { splitPresetCardsIntoParts } from '../PresetDeckService';

const deck: PresetDeck = {
  id: 'deck_minna_test',
  title: 'Minna test',
  description: 'Test deck',
  language: 'ja',
  level: 'JLPT N5',
  badgeColor: '',
  icon: '📘',
  cardCount: 4,
  loadCards: async () => [],
};

describe('PresetDeckService lesson grouping', () => {
  it('groups book vocabulary by lesson category instead of arbitrary 100-card chunks', () => {
    const cards: PresetCard[] = [
      { front: '私', back: 'men', category: 'Minna no Nihongo 1-dars' },
      { front: '学生', back: 'talaba', category: 'Minna no Nihongo 1-dars' },
      { front: 'これ', back: 'bu', category: 'Minna no Nihongo 2-dars' },
      { front: 'それ', back: 'u', category: 'Minna no Nihongo 2-dars' },
    ];

    const parts = splitPresetCardsIntoParts(deck, cards);

    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatchObject({
      partNumber: 1,
      title: 'Minna no Nihongo 1-dars (2 ta karta)',
      cardCount: 2,
    });
    expect(parts[1].cards.map((card) => card.front)).toEqual(['これ', 'それ']);
  });

  it('keeps fixed-size chunks when a deck has no lesson categories', () => {
    const cards = Array.from({ length: 205 }, (_, index) => ({
      front: `So‘z ${index}`,
      back: `Meaning ${index}`,
    }));

    const parts = splitPresetCardsIntoParts(deck, cards, 100);

    expect(parts.map((part) => part.cardCount)).toEqual([100, 100, 5]);
    expect(parts[2].title).toBe('JLPT N5 — 3-Qism (5 ta karta)');
  });
});
