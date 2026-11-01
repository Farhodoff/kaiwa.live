export interface JlptPresetCard {
  id: string;
  front: string; // Kanji / Phrase
  back: string; // Uzbek translation + Grammar explanation
  romaji?: string;
  furigana?: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  type: 'kanji' | 'vocab' | 'grammar';
  example?: string;
}

export interface JlptPresetDeck {
  id: string;
  title: string;
  description: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  icon: string;
  cards: JlptPresetCard[];
}

export type JlptDeckLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

const deckCache: Partial<Record<JlptDeckLevel, JlptPresetDeck[]>> = {};

const levelLoaders: Record<JlptDeckLevel, () => Promise<{ default: unknown }>> = {
  N5: () => import('./decks/n5PresetDecks.json'),
  N4: () => import('./decks/n4PresetDecks.json'),
  N3: () => import('./decks/n3PresetDecks.json'),
  N2: () => import('./decks/n2PresetDecks.json'),
  N1: () => import('./decks/n1PresetDecks.json'),
};

/**
 * Asynchronously loads preset decks for a specific JLPT level on demand.
 * This prevents bundling multi-megabyte JSON decks into the main bundle or loading unused levels.
 */
export async function loadPresetDecksByLevel(
  level: JlptDeckLevel | string,
): Promise<JlptPresetDeck[]> {
  const normalized = (level || '').toUpperCase() as JlptDeckLevel;
  if (deckCache[normalized]) {
    return deckCache[normalized]!;
  }
  const loader = levelLoaders[normalized];
  if (!loader) return [];

  const mod = await loader();
  const rawData = (mod as { default?: unknown }).default || mod;
  const decks = (Array.isArray(rawData) ? rawData : []) as JlptPresetDeck[];
  deckCache[normalized] = decks;
  return decks;
}

/**
 * Asynchronously loads preset decks across all JLPT levels (N5-N1).
 */
export async function loadAllJlptPresetDecks(): Promise<JlptPresetDeck[]> {
  const levels: JlptDeckLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const results = await Promise.all(levels.map((lvl) => loadPresetDecksByLevel(lvl)));
  return results.flat();
}

/**
 * Synchronous getter: returns already cached decks for the level, or empty array if not loaded yet.
 * Prefer `loadPresetDecksByLevel` for async on-demand loading.
 */
export function getPresetDecksByLevel(level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'): JlptPresetDeck[] {
  return deckCache[level] || [];
}

/**
 * Backward compatibility: empty array proxy that warns if accessed synchronously before loading.
 */
export const JLPT_PRESET_DECKS: JlptPresetDeck[] = [];
