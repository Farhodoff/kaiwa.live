export interface DailyKanji {
  kanji: string;
  level: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  strokes: number;
  examples: Array<{ word: string; reading: string; meaning: string }>;
  proverb?: string;
}

export interface DailyVocab {
  word: string;
  reading: string;
  level: string;
  partOfSpeech: string;
  meaning: string;
  exampleSentence: string;
  exampleSentenceJa?: string;
  exampleRomaji: string;
  exampleUzbek: string;
}

export const DAILY_KANJI_LIST: DailyKanji[];
export const DAILY_VOCAB_LIST: DailyVocab[];

export function getDailyKanji(dateStr?: string): DailyKanji;
export function getDailyVocab(dateStr?: string): DailyVocab;
export function formatDailyKanjiMessage(k: DailyKanji, appUrl?: string): string;
export function formatDailyVocabMessage(v: DailyVocab, appUrl?: string): string;
export function searchDailyContent(query?: string): { kanji: DailyKanji[]; vocab: DailyVocab[] };
