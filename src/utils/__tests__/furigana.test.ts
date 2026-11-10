import { describe, it, expect } from 'vitest';
import { formatFuriganaToRuby } from '../furigana';

describe('Furigana to HTML Ruby Parser', () => {
  it('converts bracketed kanji and kana to ruby tag', () => {
    expect(formatFuriganaToRuby('[日本語|にほんご]')).toBe('<ruby>日本語<rt>にほんご</rt></ruby>');
  });

  it('preserves plain text without brackets', () => {
    expect(formatFuriganaToRuby('こんにちは')).toBe('こんにちは');
    expect(formatFuriganaToRuby('')).toBe('');
  });
});
