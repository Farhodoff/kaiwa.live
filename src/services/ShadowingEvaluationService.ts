/**
 * ShadowingEvaluationService
 *
 * Evaluates student pronunciation and shadowing accuracy against target Japanese sentences.
 * Supports:
 * - Handling text with furigana annotations (e.g. 日本語[にほんご]).
 * - Dual matching: compares user speech against both kanji-form and phonetic hiragana-form.
 * - Normalized Levenshtein distance and character bigram overlap.
 * - Detailed character-level diff highlighting for visual feedback.
 * - Culturally attuned, motivating feedback in Uzbek.
 */

export interface CharacterDiff {
  char: string;
  status: 'matched' | 'missed' | 'extra';
}

export interface ShadowingEvaluationResult {
  score: number; // 0 - 100
  rating: 'excellent' | 'good' | 'fair' | 'needs_practice';
  feedbackUz: string;
  badgeUz: string;
  targetNormalized: string;
  spokenNormalized: string;
  diff: CharacterDiff[];
  rawTarget: string;
  rawSpoken: string;
}

export class ShadowingEvaluationService {
  /**
   * Converts Katakana characters to Hiragana for phonetic normalization.
   */
  static katakanaToHiragana(text: string): string {
    return text.replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  }

  /**
   * Strips furigana annotations to leave surface Kanji text.
   * e.g. "日本語[にほんご]を勉強[べんきょう]する" -> "日本語を勉強する"
   */
  static stripFurigana(text: string): string {
    return text
      .replace(
        /([一-龯々〆ヵヶA-Za-z0-9]+)(?:\[([^\]]+)\]|\(([\u3040-\u309f\u30a0-\u30ff]+)\)|（([\u3040-\u309f\u30a0-\u30ff]+)）)/g,
        '$1',
      )
      .trim();
  }

  /**
   * Replaces Kanji with its Furigana reading to produce purely phonetic Hiragana.
   * e.g. "日本語[にほんご]を勉強[べんきょう]する" -> "にほんごをべんきょうする"
   */
  static extractPhoneticReading(text: string): string {
    const raw = text.replace(
      /([一-龯々〆ヵヶA-Za-z0-9]+)(?:\[([^\]]+)\]|\(([\u3040-\u309f\u30a0-\u30ff]+)\)|（([\u3040-\u309f\u30a0-\u30ff]+)）)/g,
      (_match, _kanji, bracket, paren1, paren2) => bracket || paren1 || paren2,
    );
    return this.katakanaToHiragana(raw);
  }

  /**
   * Normalizes text for comparison by removing whitespace, punctuation, and converting Katakana to Hiragana.
   */
  static normalizeText(text: string): string {
    if (!text) return '';
    return this.katakanaToHiragana(text)
      .toLowerCase()
      .replace(/[\s\t\r\n。、！？!?,.\-_〜~・「」『』（）()[\]【】]/g, '');
  }

  /**
   * Computes classic Levenshtein distance between two strings.
   */
  static levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + cost, // substitution
        );
      }
    }

    return dp[m][n];
  }

  /**
   * Character Bigram (Dice's Coefficient) for Japanese string similarity.
   */
  static bigramSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1.0;
    if (s1.length < 2 || s2.length < 2) {
      return s1 === s2 ? 1.0 : 0.0;
    }

    const getBigrams = (str: string) => {
      const bigrams = new Map<string, number>();
      for (let i = 0; i < str.length - 1; i++) {
        const bg = str.slice(i, i + 2);
        bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
      }
      return bigrams;
    };

    const b1 = getBigrams(s1);
    const b2 = getBigrams(s2);
    let intersection = 0;

    for (const [bg, count1] of b1.entries()) {
      if (b2.has(bg)) {
        intersection += Math.min(count1, b2.get(bg)!);
      }
    }

    const totalBigrams = s1.length - 1 + (s2.length - 1);
    return totalBigrams > 0 ? (2 * intersection) / totalBigrams : 0;
  }

  /**
   * Produces a visual character-by-character alignment diff.
   */
  static computeCharacterDiff(target: string, spoken: string): CharacterDiff[] {
    const diff: CharacterDiff[] = [];
    const tChars = Array.from(target);
    const sChars = Array.from(spoken);

    let tIdx = 0;
    let sIdx = 0;

    while (tIdx < tChars.length && sIdx < sChars.length) {
      if (tChars[tIdx] === sChars[sIdx]) {
        diff.push({ char: tChars[tIdx], status: 'matched' });
        tIdx++;
        sIdx++;
      } else {
        // Lookahead to see if next character matches (insertion vs deletion)
        const nextInSpoken = sChars.indexOf(tChars[tIdx], sIdx);
        const nextInTarget = tChars.indexOf(sChars[sIdx], tIdx);

        if (
          nextInSpoken !== -1 &&
          (nextInTarget === -1 || nextInSpoken - sIdx < nextInTarget - tIdx)
        ) {
          // Extra characters spoken
          while (sIdx < nextInSpoken) {
            diff.push({ char: sChars[sIdx], status: 'extra' });
            sIdx++;
          }
        } else {
          // Target character missed
          diff.push({ char: tChars[tIdx], status: 'missed' });
          tIdx++;
        }
      }
    }

    // Trailing missed target characters
    while (tIdx < tChars.length) {
      diff.push({ char: tChars[tIdx], status: 'missed' });
      tIdx++;
    }

    // Trailing extra spoken characters
    while (sIdx < sChars.length) {
      diff.push({ char: sChars[sIdx], status: 'extra' });
      sIdx++;
    }

    return diff;
  }

  /**
   * Main evaluation method: compares target text with spoken text.
   */
  static evaluate(targetText: string, spokenText: string): ShadowingEvaluationResult {
    const rawTarget = (targetText || '').trim();
    const rawSpoken = (spokenText || '').trim();

    if (!rawSpoken) {
      return {
        score: 0,
        rating: 'needs_practice',
        feedbackUz: 'Ovoz aniqlanmadi. Mikrofonni yoqib, gapni aniq va baland ovozda qaytaring.',
        badgeUz: '🎤 Ovoz aniqlanmadi',
        targetNormalized: this.normalizeText(this.stripFurigana(rawTarget)),
        spokenNormalized: '',
        diff: Array.from(this.stripFurigana(rawTarget)).map((char) => ({
          char,
          status: 'missed',
        })),
        rawTarget,
        rawSpoken,
      };
    }

    // 1. Prepare target candidates: Kanji surface and Phonetic reading
    const kanjiSurface = this.stripFurigana(rawTarget);
    const phoneticReading = this.extractPhoneticReading(rawTarget);

    const normKanji = this.normalizeText(kanjiSurface);
    const normPhonetic = this.normalizeText(phoneticReading);
    const normSpoken = this.normalizeText(rawSpoken);

    // 2. Evaluate similarity against Kanji form
    const levKanji = this.calculateSimilarityScore(normKanji, normSpoken);
    // 3. Evaluate similarity against Phonetic reading form
    const levPhonetic = this.calculateSimilarityScore(normPhonetic, normSpoken);

    // Pick the best match (Kanji recognition vs Kana recognition from Web Speech/Azure)
    const bestScore = Math.max(levKanji, levPhonetic);
    const bestTargetNorm = levKanji >= levPhonetic ? normKanji : normPhonetic;
    const bestTargetDisplay = levKanji >= levPhonetic ? kanjiSurface : phoneticReading;

    const diff = this.computeCharacterDiff(bestTargetDisplay, rawSpoken);

    let rating: ShadowingEvaluationResult['rating'] = 'needs_practice';
    let badgeUz = '🔄 Qaytadan mashq qiling';
    let feedbackUz =
      'Audioni diqqat bilan tinglang va harflarni dona-dona, shoshilmasdan aytishga harakat qiling.';

    if (bestScore >= 90) {
      rating = 'excellent';
      badgeUz = '🌟 Mukammal talaffuz!';
      feedbackUz =
        'Ofarin! Talaffuzingiz nihoyatda aniq va yapon tili sohiblaridek ravon yangramoqda.';
    } else if (bestScore >= 75) {
      rating = 'good';
      badgeUz = '👍 Juda yaxshi!';
      feedbackUz =
        "Juda yaxshi natija! Gap deyarli to'liq va to'g'ri qaytarildi. Ayrim intonatsiyalar ustida yana bir bor ishlab ko'rishingiz mumkin.";
    } else if (bestScore >= 50) {
      rating = 'fair';
      badgeUz = '💪 Yaxshi urinish';
      feedbackUz =
        "Yaxshi harakat! Ayrim so'z yoki tovushlar tushib qoldi. Audioni sekinroq tezlikda qayta eshitib, qaytadan urinib ko'ring.";
    }

    return {
      score: bestScore,
      rating,
      feedbackUz,
      badgeUz,
      targetNormalized: bestTargetNorm,
      spokenNormalized: normSpoken,
      diff,
      rawTarget,
      rawSpoken,
    };
  }

  private static calculateSimilarityScore(target: string, spoken: string): number {
    if (!target && !spoken) return 100;
    if (!target || !spoken) return 0;
    if (target === spoken) return 100;

    const maxLen = Math.max(target.length, spoken.length);
    const dist = this.levenshteinDistance(target, spoken);
    const levScore = Math.max(0, 1 - dist / maxLen);
    const bgScore = this.bigramSimilarity(target, spoken);

    // Balanced score (70% character edit accuracy, 30% sequence bigram overlap)
    const blended = levScore * 0.7 + bgScore * 0.3;
    return Math.min(100, Math.max(0, Math.round(blended * 100)));
  }
}
