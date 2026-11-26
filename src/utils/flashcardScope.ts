import type { Flashcard, Subject } from '../types';

type Deck = Pick<Subject, 'id' | 'isArchived'>;

function isAvailable(card: Flashcard & { isArchived?: boolean }): boolean {
  return !card.deletedAt && !card.isArchived;
}

/** Keep legacy unassigned cards in the first active deck, in both counts and study. */
export function getDeckFlashcards(
  cards: Flashcard[],
  subjects: Deck[],
  subjectId: string,
): Flashcard[] {
  const fallbackId = subjects.find((subject) => !subject.isArchived)?.id;
  return cards.filter(
    (card) =>
      isAvailable(card) &&
      (card.subjectId === subjectId || (!card.subjectId && subjectId === fallbackId)),
  );
}

export function getStudyFlashcards(
  cards: Flashcard[],
  subjects: Deck[],
  subjectId = 'all',
): Flashcard[] {
  const archivedIds = new Set(subjects.filter((s) => s.isArchived).map((s) => s.id));
  const available = cards.filter((card) => isAvailable(card) && !archivedIds.has(card.subjectId));
  return subjectId === 'all' ? available : getDeckFlashcards(available, subjects, subjectId);
}
