export type JlptVocabLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface JlptVocabItem {
  id: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  word: string;
  reading: string;
  romaji: string;
  meaningUz: string;
  partOfSpeech?: string;
  examples: {
    ja: string;
    romaji: string;
    uz: string;
  }[];
}

const vocabCache: Partial<Record<JlptVocabLevel, JlptVocabItem[]>> = {};

const levelLoaders: Record<JlptVocabLevel, () => Promise<{ default: unknown }>> = {
  N5: () => import('./vocab/jlptVocabN5.json'),
  N4: () => import('./vocab/jlptVocabN4.json'),
  N3: () => import('./vocab/jlptVocabN3.json'),
  N2: () => import('./vocab/jlptVocabN2.json'),
  N1: () => import('./vocab/jlptVocabN1.json'),
};

/**
 * Asynchronously loads vocabulary dataset for a specific JLPT level strictly on-demand.
 * Loads directly via Vite chunked dynamic imports with instant in-memory caching.
 * Prevents heavy network waterfalls and eliminates mobile thread blocking.
 */
export async function loadVocabByLevel(level: JlptVocabLevel | string): Promise<JlptVocabItem[]> {
  const normalized = (level || 'N5').toUpperCase() as JlptVocabLevel;
  if (vocabCache[normalized]) return vocabCache[normalized]!;

  const loader = levelLoaders[normalized];
  if (!loader) return [];

  try {
    const mod = await loader();
    const rawData = (mod as { default?: unknown }).default || mod;
    const items = (Array.isArray(rawData) ? rawData : []) as JlptVocabItem[];
    vocabCache[normalized] = items;
    return items;
  } catch (err) {
    console.error(`[jlptVocabData] Failed to lazy-load vocab for ${normalized}:`, err);
    return [];
  }
}

/**
 * Loads vocabulary for all JLPT levels concurrently.
 */
export async function loadAllVocab(): Promise<JlptVocabItem[]> {
  const levels: JlptVocabLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const results = await Promise.all(levels.map((lvl) => loadVocabByLevel(lvl)));
  return results.flat();
}

/**
 * Backward-compatible stub
 */
export const JLPT_VOCAB_DATA: JlptVocabItem[] = [];
