export interface FuriganaSegment {
  kanji: string;
  furigana: string;
}

/**
 * Converts bracketed furigana text like [日本語|にほんご] into HTML <ruby> tags.
 */
export function formatFuriganaToRuby(text: string): string {
  if (!text) return '';
  return text.replace(/\[([^|]+)\|([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
}
