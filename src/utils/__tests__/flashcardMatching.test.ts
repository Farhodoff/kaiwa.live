import { describe, it, expect } from 'vitest';
import { isFlashcardAnswerCorrect } from '../flashcardMatching';

describe('Flashcard Typing Mode Answer Matching Tests', () => {
  it('1. Correctly matches formatted card with emoji & example prefix', () => {
    const back = "📌 Ma'nosi: dasturlash\n\n💬 Misol: IT企業での開発経験があります。";
    expect(isFlashcardAnswerCorrect('dasturlash', back)).toBe(true);
    expect(isFlashcardAnswerCorrect('Dasturlash', back)).toBe(true);
    expect(isFlashcardAnswerCorrect('  dasturlash  ', back)).toBe(true);
  });

  it('2. Correctly matches plain / legacy unformatted card', () => {
    const back = 'dasturlash';
    expect(isFlashcardAnswerCorrect('dasturlash', back)).toBe(true);
    expect(isFlashcardAnswerCorrect('DASTURLASH', back)).toBe(true);
  });

  it('3. Matches multiple synonyms / comma-separated meanings', () => {
    const back = "📌 Ma'nosi: dasturlash, kodlash, loyihalash\n\n💬 Misol: ...";
    expect(isFlashcardAnswerCorrect('dasturlash', back)).toBe(true);
    expect(isFlashcardAnswerCorrect('kodlash', back)).toBe(true);
    expect(isFlashcardAnswerCorrect('loyihalash', back)).toBe(true);
  });

  it('4. Matches JLPT Kanji & Grammar formatted cards', () => {
    const grammarBack =
      "[N5 Grammar] ~te kudasai\nStruktura: V-te + kudasai\n\n🇺🇿 Ma'nosi: iltimos qiling, bajaring\n\nMisol:\nKite kudasai";
    expect(isFlashcardAnswerCorrect('iltimos qiling', grammarBack)).toBe(true);
    expect(isFlashcardAnswerCorrect('bajaring', grammarBack)).toBe(true);

    const kanjiBack =
      "Onyomi: カイ\nKunyomi: ひら・く\n\nMa'nosi: rivojlanish, taraqqiyot\n\nMisol: 開発 (かいはつ)";
    expect(isFlashcardAnswerCorrect('rivojlanish', kanjiBack)).toBe(true);
    expect(isFlashcardAnswerCorrect('taraqqiyot', kanjiBack)).toBe(true);
  });

  it('5. Handles slash, semicolon, or "yoki" separators', () => {
    const back1 = "📌 Ma'nosi: tez / chaqqon / chaqqonlik";
    expect(isFlashcardAnswerCorrect('tez', back1)).toBe(true);
    expect(isFlashcardAnswerCorrect('chaqqon', back1)).toBe(true);

    const back2 = "📌 Ma'nosi: o'qish yoki mutolaa qilish";
    expect(isFlashcardAnswerCorrect("o'qish", back2)).toBe(true);
  });

  it('6. Rejects clearly wrong answers and empty inputs', () => {
    const back = "📌 Ma'nosi: dasturlash\n\n💬 Misol: ...";
    expect(isFlashcardAnswerCorrect('olma', back)).toBe(false);
    expect(isFlashcardAnswerCorrect('kitob', back)).toBe(false);
    expect(isFlashcardAnswerCorrect('', back)).toBe(false);
    expect(isFlashcardAnswerCorrect('   ', back)).toBe(false);
  });

  it('7. Handles punctuation variations and apostrophes gracefully', () => {
    const back = "📌 Ma'nosi: oʻrganmoq, ta'lim olmoq";
    expect(isFlashcardAnswerCorrect("o'rganmoq", back)).toBe(true);
    expect(isFlashcardAnswerCorrect("ta'lim olmoq", back)).toBe(true);
  });
});
