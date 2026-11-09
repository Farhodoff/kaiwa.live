import { describe, it, expect, beforeAll } from 'vitest';
import { KanjiPracticeService } from '../KanjiPracticeService';

describe('KanjiPracticeService Unit Tests', () => {
  beforeAll(async () => {
    await KanjiPracticeService.preloadStrokes();
  }, 35000);
  it('returns all 2056 kanjis from database with 100% stroke data availability', () => {
    const all = KanjiPracticeService.getAllKanjis();
    expect(all.length).toBe(2061);

    // Verify stroke coverage
    let missingStrokes = 0;
    all.forEach((k) => {
      const strokes = KanjiPracticeService.getStrokeData(k.kanji);
      if (!strokes || strokes.paths.length === 0) {
        missingStrokes++;
      }
    });
    expect(missingStrokes).toBe(0);
  });

  it('filters kanjis correctly by JLPT level', () => {
    const n5 = KanjiPracticeService.getKanjisByLevel('N5');
    const n4 = KanjiPracticeService.getKanjisByLevel('N4');
    const n3 = KanjiPracticeService.getKanjisByLevel('N3');
    const n2 = KanjiPracticeService.getKanjisByLevel('N2');
    const n1 = KanjiPracticeService.getKanjisByLevel('N1');

    expect(n5.length).toBe(106);
    expect(n4.length).toBe(268);
    expect(n3.length).toBe(340);
    expect(n2.length).toBe(470);
    expect(n1.length).toBe(877);

    expect(n5.every((k) => k.level === 'N5')).toBe(true);
    expect(n4.every((k) => k.level === 'N4')).toBe(true);
    expect(n3.every((k) => k.level === 'N3')).toBe(true);
    expect(n2.every((k) => k.level === 'N2')).toBe(true);
    expect(n1.every((k) => k.level === 'N1')).toBe(true);
  });

  it('searches kanjis by character, onyomi/kunyomi reading, and Uzbek meaning', () => {
    const searchByChar = KanjiPracticeService.searchKanjis('日');
    expect(searchByChar.length).toBeGreaterThan(0);
    expect(searchByChar[0].kanji).toBe('日');

    const searchByUz = KanjiPracticeService.searchKanjis('quyosh');
    expect(searchByUz.length).toBeGreaterThan(0);
    expect(searchByUz.some((k) => k.kanji === '日')).toBe(true);

    const searchByOnyomi = KanjiPracticeService.searchKanjis('nichi');
    expect(searchByOnyomi.length).toBeGreaterThan(0);
  });

  it('verifies all curated quick kanjis exist and have valid stroke paths and coordinates', () => {
    const levels = ['ALL', 'HIRAGANA', 'KATAKANA', 'N5', 'N4', 'N3', 'N2', 'N1'] as const;
    levels.forEach((lvl) => {
      const quickList = KanjiPracticeService.getQuickKanjis(lvl);
      expect(quickList.length).toBeGreaterThan(0);

      quickList.forEach((char) => {
        const kanjiItem = KanjiPracticeService.getKanjiByChar(char);
        expect(kanjiItem).toBeDefined();

        const strokeData = KanjiPracticeService.getStrokeData(char);
        expect(strokeData).not.toBeNull();
        expect(strokeData!.paths.length).toBeGreaterThan(0);
        expect(strokeData!.numbers.length).toBeGreaterThan(0);
      });
    });
  });

  it('supports Hiragana and Katakana alphabet practice with authentic strokes', () => {
    const hiraganaItems = KanjiPracticeService.getKanjisByLevel('HIRAGANA');
    expect(hiraganaItems.length).toBe(46);
    expect(hiraganaItems[0].kanji).toBe('あ');
    expect(hiraganaItems[0].meaningUz).toContain('Misol:');

    const katakanaItems = KanjiPracticeService.getKanjisByLevel('KATAKANA');
    expect(katakanaItems.length).toBeGreaterThanOrEqual(15);
    expect(katakanaItems[0].kanji).toBe('ア');

    // Check stroke paths for 'あ'
    const aStrokes = KanjiPracticeService.getStrokeData('あ');
    expect(aStrokes).not.toBeNull();
    expect(aStrokes!.paths.length).toBe(3);
    expect(aStrokes!.numbers.length).toBe(3);

    // Check stroke paths for 'ア'
    const aKataStrokes = KanjiPracticeService.getStrokeData('ア');
    expect(aKataStrokes).not.toBeNull();
    expect(aKataStrokes!.paths.length).toBe(2);
    expect(aKataStrokes!.numbers.length).toBe(2);
  });
});
