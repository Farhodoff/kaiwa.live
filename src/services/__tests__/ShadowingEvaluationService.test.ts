import { describe, expect, it } from 'vitest';
import { ShadowingEvaluationService } from '../ShadowingEvaluationService';

describe('ShadowingEvaluationService', () => {
  it('strips furigana annotations cleanly', () => {
    const raw = '日本語[にほんご]を勉強[べんきょう]する';
    expect(ShadowingEvaluationService.stripFurigana(raw)).toBe('日本語を勉強する');
  });

  it('extracts pure phonetic hiragana reading from furigana brackets', () => {
    const raw = '日本語[にほんご]を勉強[べんきょう]する';
    expect(ShadowingEvaluationService.extractPhoneticReading(raw)).toBe('にほんごをべんきょうする');
  });

  it('converts katakana to hiragana accurately', () => {
    expect(ShadowingEvaluationService.katakanaToHiragana('コーヒー')).toBe('こーひー');
    expect(ShadowingEvaluationService.katakanaToHiragana('アメリカ人')).toBe('あめりか人');
  });

  it('normalizes punctuation, whitespace, and case', () => {
    expect(ShadowingEvaluationService.normalizeText('こんにちは、元気ですか！？')).toBe(
      'こんにちは元気ですか',
    );
    expect(ShadowingEvaluationService.normalizeText(' わたし は　がくせいです。 ')).toBe(
      'わたしはがくせいです',
    );
  });

  it('scores exact matches as 100 with excellent rating', () => {
    const result = ShadowingEvaluationService.evaluate(
      '明日[あした]、東京[とうきょう]へ行[い]きます。',
      '明日、東京へ行きます。',
    );
    expect(result.score).toBe(100);
    expect(result.rating).toBe('excellent');
    expect(result.badgeUz).toContain('Mukammal');
  });

  it('correctly matches phonetic hiragana spoken input against kanji text with furigana', () => {
    // Student speaks hiragana "あしたとうきょうへいきます"
    const result = ShadowingEvaluationService.evaluate(
      '明日[あした]、東京[とうきょう]へ行[い]きます。',
      'あしたとうきょうへいきます',
    );
    expect(result.score).toBe(100);
    expect(result.rating).toBe('excellent');
  });

  it('handles minor deviations with good score and constructive feedback', () => {
    const result = ShadowingEvaluationService.evaluate(
      'どうぞよろしくおねがいします',
      'どうぞよろしくおねがい',
    );
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.score).toBeLessThan(90);
    expect(result.rating).toBe('good');
  });

  it('flags poor or missing speech gracefully', () => {
    const emptyResult = ShadowingEvaluationService.evaluate('こんにちは', '');
    expect(emptyResult.score).toBe(0);
    expect(emptyResult.rating).toBe('needs_practice');

    const mismatchedResult = ShadowingEvaluationService.evaluate(
      'こんにちは',
      'まったくちがうことば',
    );
    expect(mismatchedResult.score).toBeLessThan(50);
    expect(mismatchedResult.rating).toBe('needs_practice');
  });

  it('computes character diff properly', () => {
    const diff = ShadowingEvaluationService.computeCharacterDiff('abc', 'ac');
    expect(diff.some((d) => d.char === 'b' && d.status === 'missed')).toBe(true);
    expect(diff.some((d) => d.char === 'a' && d.status === 'matched')).toBe(true);
    expect(diff.some((d) => d.char === 'c' && d.status === 'matched')).toBe(true);
  });
});
