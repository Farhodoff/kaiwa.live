import { Subject, Flashcard } from '../types';
import {
  loadPresetDecksByLevel,
  loadAllJlptPresetDecks,
  JlptDeckLevel,
} from '../data/jlptPresetDecks';

export const ensureJlptSubjectAndDecks = async (
  _currentLevel: string,
  targetLevel: string,
  subjects: Subject[],
  addSubject: (s: Partial<Subject>) => Promise<Subject | null>,
  addFlashcard: (f: Partial<Flashcard>) => void,
): Promise<string | null> => {
  const subjectName = '🎌 JLPT Japanese Master';
  let targetSubject = subjects.find((s) => s.name.toLowerCase() === subjectName.toLowerCase());
  let subjectId = targetSubject?.id;

  if (!subjectId) {
    const created = await addSubject({
      name: subjectName,
      color: '#rose-500',
      icon: 'Sparkles',
      isArchived: false,
    });
    subjectId = created?.id;
  }

  if (!subjectId) return null;

  // Filter relevant JLPT decks based on targetLevel, falling back to all
  let decks = await loadPresetDecksByLevel(targetLevel as JlptDeckLevel);
  if (!decks || decks.length === 0) {
    decks = await loadAllJlptPresetDecks();
  }

  decks.forEach((deck) => {
    deck.cards.forEach((c) => {
      addFlashcard({
        subjectId: subjectId!,
        front: `${c.front} [${c.level}]`,
        back: `${c.back} ${c.romaji ? `(${c.romaji})` : ''} ${c.example ? `\nMisol: "${c.example}"` : ''}`,
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
      });
    });
  });

  return subjectId;
};
