import kanjiDataRaw from '../data/kanji/jlptKanjiDatabase.json';
import type { JlptKanjiItem } from '../data/jlptGrammarKanji';
import { DatasetStorageService } from './DatasetStorageService';
import { HIRAGANA_CHARACTERS, KATAKANA_CHARACTERS, KanaCharacter } from '../data/kanaStrokesData';

export interface KanjiStrokeNumber {
  x: number;
  y: number;
  num: number;
}

export interface KanjiStrokeData {
  paths: string[];
  numbers: KanjiStrokeNumber[];
}

export type JlptLevelFilter = 'ALL' | 'HIRAGANA' | 'KATAKANA' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// Curated quick kanji recommendations verified from jlptKanjiDatabase & kanjiStrokes
export const CURATED_QUICK_KANJIS: Record<JlptLevelFilter, string[]> = {
  ALL: [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
    '山',
    '川',
    '人',
    '会',
    '社',
    '学',
    '校',
    '本',
    '年',
    '新',
    '高',
    '大',
    '小',
  ],
  HIRAGANA: [
    'あ',
    'い',
    'う',
    'え',
    'お',
    'か',
    'き',
    'く',
    'け',
    'こ',
    'さ',
    'し',
    'す',
    'せ',
    'そ',
    'た',
    'ち',
    'つ',
    'て',
    'と',
    'な',
    'に',
    'ぬ',
    'ね',
    'の',
    'は',
    'ひ',
    'ふ',
    'へ',
    'ほ',
    'ま',
    'み',
    'む',
    'め',
    'も',
    'や',
    'ゆ',
    'よ',
    'ら',
    'り',
    'る',
    'れ',
    'ろ',
    'わ',
    'を',
    'ん',
  ],
  KATAKANA: [
    'ア',
    'イ',
    'ウ',
    'エ',
    'オ',
    'カ',
    'サ',
    'タ',
    'ナ',
    'ハ',
    'マ',
    'ヤ',
    'ラ',
    'ワ',
    'ン',
  ],
  N5: [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
    '山',
    '川',
    '人',
    '口',
    '車',
    '女',
    '男',
    '子',
    '学',
    '校',
    '先',
    '生',
    '本',
    '年',
    '時',
    '分',
    '大',
    '小',
  ],
  N4: [
    '会',
    '社',
    '新',
    '古',
    '高',
    '安',
    '多',
    '少',
    '長',
    '不',
    '世',
    '主',
    '乗',
    '事',
    '京',
    '仕',
    '代',
    '以',
    '低',
    '住',
    '体',
    '作',
    '使',
    '便',
    '借',
  ],
  N3: [
    '経',
    '済',
    '論',
    '議',
    '選',
    '挙',
    '提',
    '案',
    '関',
    '係',
    '税',
    '権',
    '義',
    '務',
    '総',
    '領',
    '査',
    '政',
  ],
  N2: [
    '概',
    '略',
    '障',
    '害',
    '拡',
    '縮',
    '抑',
    '促',
    '勧',
    '恐',
    '慎',
    '緩',
    '激',
    '陥',
    '融',
    '換',
    '替',
    '棄',
    '避',
    '阻',
  ],
  N1: [
    '匿',
    '茫',
    '漠',
    '弊',
    '歪',
    '嘲',
    '弄',
    '蔑',
    '傲',
    '慢',
    '躊',
    '躇',
    '曖',
    '昧',
    '恣',
    '苛',
    '忌',
    '憚',
    '捏',
    '斬',
  ],
};

const kanjiList: JlptKanjiItem[] = kanjiDataRaw as JlptKanjiItem[];

const kanaToKanjiItem = (k: KanaCharacter): JlptKanjiItem => ({
  id: `kana-${k.type}-${k.romaji}`,
  kanji: k.char,
  onyomi: k.type === 'katakana' ? k.romaji.toUpperCase() : '-',
  kunyomi: k.type === 'hiragana' ? k.romaji : '-',
  meaningUz: `${k.meaningUz}. Misol: ${k.sampleWord} (${k.sampleWordUz})`,
  strokeCount: k.strokeCount,
  level: (k.type === 'hiragana' ? 'HIRAGANA' : 'KATAKANA') as any,
  examples: [
    {
      word: k.sampleWord,
      reading: k.sampleWord,
      meaning: k.sampleWordUz,
    },
  ],
});

const hiraganaList: JlptKanjiItem[] = HIRAGANA_CHARACTERS.map(kanaToKanjiItem);
const katakanaList: JlptKanjiItem[] = KATAKANA_CHARACTERS.map(kanaToKanjiItem);

const allKanaMap = new Map<string, KanaCharacter>();
[...HIRAGANA_CHARACTERS, ...KATAKANA_CHARACTERS].forEach((k) => allKanaMap.set(k.char, k));

let cachedStrokeMap: Record<string, KanjiStrokeData> | null = null;
let strokePromise: Promise<Record<string, KanjiStrokeData>> | null = null;

export async function loadKanjiStrokes(): Promise<Record<string, KanjiStrokeData>> {
  if (cachedStrokeMap) return cachedStrokeMap;
  if (!strokePromise) {
    strokePromise = DatasetStorageService.loadDataset<Record<string, KanjiStrokeData>>({
      datasetKey: 'kanji_strokes_v1',
      localPath: '/data/kanjiStrokes.json',
      supabaseBucket: 'datasets',
      supabasePath: 'kanjiStrokes.json',
      fallbackLoader: async () => {
        if (!import.meta.env.PROD) {
          const mod = await import('../data/kanjiStrokes.json');
          return mod.default as unknown as Record<string, KanjiStrokeData>;
        }
        // In production, kanjiStrokes is strictly served from CDN / static asset (/data/kanjiStrokes.json)
        const res = await fetch('/data/kanjiStrokes.json');
        return (await res.json()) as Record<string, KanjiStrokeData>;
      },
    }).then((data) => {
      cachedStrokeMap = data;
      return data;
    });
  }
  return strokePromise;
}

export class KanjiPracticeService {
  /**
   * Returns all available kanjis in the database
   */
  static getAllKanjis(): JlptKanjiItem[] {
    return kanjiList;
  }

  /**
   * Filter kanjis by JLPT level or Kana alphabet
   */
  static getKanjisByLevel(level: JlptLevelFilter): JlptKanjiItem[] {
    if (level === 'ALL') return kanjiList;
    if (level === 'HIRAGANA') return hiraganaList;
    if (level === 'KATAKANA') return katakanaList;
    return kanjiList.filter((k) => k.level === level);
  }

  /**
   * Search kanjis or kana by character, reading (onyomi/kunyomi), or Uzbek meaning
   */
  static searchKanjis(query: string, level: JlptLevelFilter = 'ALL'): JlptKanjiItem[] {
    const list = this.getKanjisByLevel(level);
    if (!query || !query.trim()) return list;

    const q = query.trim().toLowerCase();
    return list.filter((k) => {
      const matchKanji = k.kanji.toLowerCase().includes(q);
      const matchMeaning = (k.meaningUz || '').toLowerCase().includes(q);
      const matchOnyomi = (k.onyomi || '').toLowerCase().includes(q);
      const matchKunyomi = (k.kunyomi || '').toLowerCase().includes(q);
      return matchKanji || matchMeaning || matchOnyomi || matchKunyomi;
    });
  }

  /**
   * Retrieve a specific kanji or kana by character
   */
  static getKanjiByChar(char: string): JlptKanjiItem | undefined {
    const kana = allKanaMap.get(char);
    if (kana) return kanaToKanjiItem(kana);
    return kanjiList.find((k) => k.kanji === char);
  }

  /**
   * Preload authentic KanjiVG strokes dictionary into memory
   */
  static async preloadStrokes(): Promise<Record<string, KanjiStrokeData>> {
    return loadKanjiStrokes();
  }

  /**
   * Retrieve authentic KanjiVG SVG stroke paths and numbering coordinates asynchronously (lazy-loaded)
   */
  static async getStrokeDataAsync(kanji: string): Promise<KanjiStrokeData | null> {
    const kana = allKanaMap.get(kanji);
    if (kana) {
      return { paths: kana.paths, numbers: kana.numbers };
    }
    const strokes = await loadKanjiStrokes();
    return strokes[kanji] || null;
  }

  /**
   * Retrieve authentic KanjiVG SVG stroke paths from memory cache if already loaded
   */
  static getStrokeData(kanji: string): KanjiStrokeData | null {
    const kana = allKanaMap.get(kanji);
    if (kana) {
      return { paths: kana.paths, numbers: kana.numbers };
    }
    if (!cachedStrokeMap) {
      void loadKanjiStrokes();
      return null;
    }
    return cachedStrokeMap[kanji] || null;
  }

  /**
   * Get curated quick kanji list
   */
  static getQuickKanjis(level: JlptLevelFilter): string[] {
    return CURATED_QUICK_KANJIS[level] || CURATED_QUICK_KANJIS.ALL;
  }
}
