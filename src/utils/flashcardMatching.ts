/**
 * Utility to extract candidate meanings and accurately evaluate student answers in Flashcard Typing Mode.
 */

const normalizeApostrophes = (s: string): string => {
  return s.replace(/[\u0027\u2019\u0060\u02BB\u02BC\u2018\u02BD\u00B4]/g, "'");
};

/**
 * Extracts possible target meanings from a raw flashcard back string.
 */
export function extractMeaningsFromBack(rawBack: string): string[] {
  if (!rawBack || typeof rawBack !== 'string') return [];

  let text = normalizeApostrophes(rawBack.trim());

  // 1. If back contains "📌 Ma'nosi:" or "🇺🇿 Ma'nosi:" or "Ma'nosi:", extract the meaning segment
  const meaningMatch = text.match(
    /(?:📌\s*)?(?:🇺🇿\s*)?(?:ma'?nosi|ma'?no|meaning|definition):\s*([^\n]+)/i,
  );
  if (meaningMatch && meaningMatch[1]) {
    text = meaningMatch[1].trim();
  } else {
    // Fallback: take text before first double newline or example section
    const exampleIndex = text.search(/(?:\n\n|\n)?(?:💬\s*)?(?:misol|example):/i);
    if (exampleIndex !== -1) {
      text = text.substring(0, exampleIndex).trim();
    }
  }

  // 2. Remove common header prefixes if still present
  text = text.replace(/^(?:📌|💬|🇺🇿|📌\s*ma'nosi:|ma'nosi:)\s*/iu, '').trim();

  // 3. Split by commas, semicolons, slashes, or conjunctions ("yoki", "or")
  const parts = text.split(/[,;\n/]|(?:\s+yoki\s+)|\s+or\s+/iu);

  const candidates: string[] = [];

  for (const part of parts) {
    // Strip emoji, quotes, leading/trailing punctuation and markdown
    const cleaned = part
      .replace(/(?:🇺🇿|📌|💬|[*`"'])/gu, '')
      .replace(/^\s*[-–—:]\s*/, '')
      .replace(/\s*\([^)]*\)\s*/g, '') // remove parenthetical remarks e.g. "(formal)"
      .trim()
      .toLowerCase();

    if (cleaned.length > 0) {
      candidates.push(cleaned);
    }
  }

  // Also include the whole cleaned primary line as a fallback candidate
  const cleanFull = text
    .replace(/(?:🇺🇿|📌|💬|[*`"'])/gu, '')
    .replace(/\s*\([^)]*\)\s*/g, '')
    .trim()
    .toLowerCase();
  if (cleanFull && !candidates.includes(cleanFull)) {
    candidates.push(cleanFull);
  }

  return candidates;
}

/**
 * Checks if a student's typed answer matches the flashcard's back content.
 */
export function isFlashcardAnswerCorrect(typedAnswer: string, rawBack: string): boolean {
  if (!typedAnswer || typeof typedAnswer !== 'string') return false;
  if (!rawBack || typeof rawBack !== 'string') return false;

  const cleanTyped = normalizeApostrophes(typedAnswer)
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, '')
    .trim();

  if (!cleanTyped || cleanTyped.length === 0) return false;

  const candidates = extractMeaningsFromBack(rawBack);

  // 1. Exact or normalized match against any candidate meaning
  for (const cand of candidates) {
    const normCand = cand.replace(/[.,!?;:"'()]/g, '').trim();
    if (!normCand) continue;

    // Exact match
    if (cleanTyped === normCand) return true;

    // Substring / word-boundary match for multi-word phrases
    if (normCand.length >= 3 && cleanTyped.length >= 3) {
      if (normCand === cleanTyped) return true;

      // If candidate contains typed word as a distinct word
      const words = normCand.split(/\s+/);
      if (words.includes(cleanTyped)) return true;

      // If typed contains full candidate
      if (cleanTyped.includes(normCand)) return true;
    }
  }

  // 2. Backward compatibility fallback: check against rawBack normalized
  const cleanRawBack = normalizeApostrophes(rawBack)
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, '')
    .trim();
  if (cleanRawBack === cleanTyped) return true;

  const firstLine = cleanRawBack
    .split('\n')[0]
    .replace(/^(?:📌\s*)?(?:ma'nosi:)?\s*/iu, '')
    .trim();
  if (
    firstLine &&
    (firstLine === cleanTyped || firstLine.split(/[,;/]/).some((p) => p.trim() === cleanTyped))
  ) {
    return true;
  }

  return false;
}
