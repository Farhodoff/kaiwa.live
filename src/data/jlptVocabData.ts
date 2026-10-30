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

/**
 * Asynchronously loads vocabulary dataset for a specific JLPT level on-demand.
 * Loads the level dataset from the static asset and bundled source.
 * Enables granular code-splitting so users download only the level they are actively studying.
 */
export async function loadVocabByLevel(level: JlptVocabLevel): Promise<JlptVocabItem[]> {
  if (vocabCache[level]) return vocabCache[level]!;

  // Prefer the static asset so large levels stay code-split.
  try {
    const res = await fetch(`/data/vocab/jlptVocab${level}.json`);
    if (res.ok) {
      const items = (await res.json()) as JlptVocabItem[];
      if (Array.isArray(items) && items.length > 0) {
        vocabCache[level] = items;
        return items;
      }
    }
  } catch {
    // Use the bundled dataset in non-browser/test environments.
  }

  let items: JlptVocabItem[];
  switch (level) {
    case 'N5':
      items = ((await import('./vocab/jlptVocabN5.json')).default || []) as JlptVocabItem[];
      break;
    case 'N4':
      items = ((await import('./vocab/jlptVocabN4.json')).default || []) as JlptVocabItem[];
      break;
    case 'N3':
      items = ((await import('./vocab/jlptVocabN3.json')).default || []) as JlptVocabItem[];
      break;
    case 'N2':
      items = ((await import('./vocab/jlptVocabN2.json')).default || []) as JlptVocabItem[];
      break;
    case 'N1':
      items = ((await import('./vocab/jlptVocabN1.json')).default || []) as JlptVocabItem[];
      break;
    default:
      items = [];
  }

  vocabCache[level] = items;
  return items;
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
