import { describe, expect, it } from 'vitest';
import type { Flashcard } from '../../types';
import { getDeckFlashcards, getStudyFlashcards } from '../flashcardScope';
import { isDue } from '../srs';

const now = new Date('2026-11-24T12:00:00Z');
const subjects = [{ id: 'archived', isArchived: true }, { id: 'ww' }, { id: 'second' }];
const card = (id: string, subjectId: string, extra = {}): Flashcard => ({
  id,
  subjectId,
  front: id,
  back: 'meaning',
  interval: 0,
  repetitions: 0,
  easeFactor: 2.5,
  nextReviewDate: '2026-11-23T12:00:00Z',
  ...extra,
});

describe('flashcard inventory and study scope', () => {
  it('counts and opens the same 50 unassigned cards in the first active deck', () => {
    const cards = Array.from({ length: 50 }, (_, i) => card(String(i), ''));
    const inventory = getDeckFlashcards(cards, subjects, 'ww');
    expect(inventory).toHaveLength(50);
    expect(getStudyFlashcards(cards, subjects, 'ww')).toEqual(inventory);
    expect(getStudyFlashcards(cards, subjects).filter((c) => isDue(c, now))).toHaveLength(50);
    expect(getDeckFlashcards(cards, subjects, 'second')).toEqual([]);
    expect(getDeckFlashcards(cards, subjects, 'archived')).toEqual([]);
  });

  it('excludes deleted cards, archived cards and archived decks from global review', () => {
    const cards = [
      card('active', 'ww'),
      card('deleted', 'ww', { deletedAt: now.toISOString() }),
      card('hidden', 'ww', { isArchived: true }),
      card('archive', 'archived'),
    ];
    expect(getStudyFlashcards(cards, subjects).map((c) => c.id)).toEqual(['active']);
    expect(getStudyFlashcards(cards, subjects, 'archived')).toEqual([]);
    expect(getDeckFlashcards(cards, subjects, 'archived').map((c) => c.id)).toEqual(['archive']);
  });

  it('includes due cards from every active deck in global review', () => {
    const cards = [card('first', 'ww'), card('second', 'second'), card('legacy', '')];
    expect(getStudyFlashcards(cards, subjects)).toEqual(cards);
    expect(getStudyFlashcards(cards, subjects, 'second').map((c) => c.id)).toEqual(['second']);
  });

  it('keeps unassigned cards accessible without any decks', () => {
    const cards = [card('legacy', '')];
    expect(getStudyFlashcards(cards, [])).toEqual(cards);
  });
});
