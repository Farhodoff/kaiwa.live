import { describe, it, expect } from 'vitest';
import { PRESET_DECKS } from '../presetDecks';

describe('PRESET_DECKS Integrity & Quality Tests', () => {
  it('validates that all preset decks have valid metadata and can load cards', async () => {
    expect(PRESET_DECKS.length).toBeGreaterThanOrEqual(9);

    for (const deck of PRESET_DECKS) {
      expect(deck.id).toBeDefined();
      expect(deck.title.length).toBeGreaterThan(5);
      expect(deck.description.length).toBeGreaterThan(10);
      expect(deck.cardCount).toBeGreaterThan(0);

      const cards = await deck.loadCards();
      expect(cards.length).toBe(deck.cardCount);
      expect(cards[0].front).toBeDefined();
      expect(cards[0].back).toBeDefined();
    }
  });

  it('includes N2 Collocations and N1 Yojijukugo specialized decks', async () => {
    const n2Deck = PRESET_DECKS.find((d) => d.id === 'deck_n2_collocations');
    expect(n2Deck).toBeDefined();
    expect(n2Deck!.level).toBe('JLPT N2');
    const n2Cards = await n2Deck!.loadCards();
    expect(n2Cards.length).toBe(55);

    const n1Deck = PRESET_DECKS.find((d) => d.id === 'deck_n1_yojijukugo');
    expect(n1Deck).toBeDefined();
    expect(n1Deck!.level).toBe('JLPT N1');
    const n1Cards = await n1Deck!.loadCards();
    expect(n1Cards.length).toBe(49);

    const n5Deck = PRESET_DECKS.find((d) => d.id === 'deck_n5_test_bank');
    expect(n5Deck).toBeDefined();
    expect(n5Deck!.level).toBe('JLPT N5');
    const n5Cards = await n5Deck!.loadCards();
    expect(n5Cards.length).toBe(33);

    const n3Deck = PRESET_DECKS.find((d) => d.id === 'deck_n3_confusing_grammar');
    expect(n3Deck).toBeDefined();
    expect(n3Deck!.level).toBe('JLPT N3');
    const n3Cards = await n3Deck!.loadCards();
    expect(n3Cards.length).toBe(45);

    const n3MonDeck = PRESET_DECKS.find((d) => d.id === 'deck_n3_500_mon');
    expect(n3MonDeck).toBeDefined();
    expect(n3MonDeck!.level).toBe('JLPT N3');
    const n3MonCards = await n3MonDeck!.loadCards();
    expect(n3MonCards.length).toBe(60);

    const n3ThematicDeck = PRESET_DECKS.find((d) => d.id === 'deck_n3_thematic_vocab');
    expect(n3ThematicDeck).toBeDefined();
    expect(n3ThematicDeck!.level).toBe('JLPT N3');
    const n3ThematicCards = await n3ThematicDeck!.loadCards();
    expect(n3ThematicCards.length).toBe(699);

    const n4KanjiDeck = PRESET_DECKS.find((d) => d.id === 'deck_kanji_master_n4');
    expect(n4KanjiDeck).toBeDefined();
    expect(n4KanjiDeck!.level).toBe('JLPT N4');
    const n4KanjiCards = await n4KanjiDeck!.loadCards();
    expect(n4KanjiCards.length).toBe(207);
    expect(n4KanjiCards[0].front).toBe('家');

    const n4MonDeck = PRESET_DECKS.find((d) => d.id === 'deck_n4_500_mon');
    expect(n4MonDeck).toBeDefined();
    expect(n4MonDeck!.level).toBe('JLPT N4');
    const n4MonCards = await n4MonDeck!.loadCards();
    expect(n4MonCards.length).toBe(84);

    const n1MonDeck = PRESET_DECKS.find((d) => d.id === 'deck_n1_500_mon');
    expect(n1MonDeck).toBeDefined();
    expect(n1MonDeck!.level).toBe('JLPT N1');
    const n1MonCards = await n1MonDeck!.loadCards();
    expect(n1MonCards.length).toBe(24);

    const n2MonDeck = PRESET_DECKS.find((d) => d.id === 'deck_n2_500_mon');
    expect(n2MonDeck).toBeDefined();
    expect(n2MonDeck!.level).toBe('JLPT N2');
    const n2MonCards = await n2MonDeck!.loadCards();
    expect(n2MonCards.length).toBe(24);
  });
});
