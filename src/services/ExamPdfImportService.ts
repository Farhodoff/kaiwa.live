import type { RawImportQuestion } from './ExamBulkImportService';

export type PdfSectionType = 'knowledge' | 'reading' | 'listening';

export interface PdfFileValidation {
  valid: boolean;
  error?: string;
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
}

export interface PdfParseResult {
  questions: RawImportQuestion[];
  detectedLevel: string | null;
  detectedSection: PdfSectionType | null;
  warnings: string[];
}

export type PdfTextExtractor = (data: ArrayBuffer) => Promise<PdfExtractionResult>;

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const LEVEL_RE = /\b(N[1-5])\b/;
const KANJI_LEVEL_RE = /レベル\s*[:：]?\s*(N[1-5])/i;

/**
 * Validates a user-selected PDF file before parsing.
 */
export function validatePdfFile(file: File): PdfFileValidation {
  const name = (file.name || '').toLowerCase();
  const isPdfName = name.endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf';

  if (!isPdfName && !isPdfMime) {
    return { valid: false, error: 'Faqat PDF formatidagi fayllar qabul qilinadi.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'PDF fayl bo‘sh.' };
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: `PDF fayl hajmi juda katta (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum 20 MB.`,
    };
  }
  return { valid: true };
}

/**
 * Splits PDF plain text into logical lines, dropping empty lines.
 */
function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter((l) => l.length > 0);
}

const QUESTION_START_RE = /^(\d{1,3})\s*[.、)．]\s*(.+)$/;
const OPTION_NUM_RE = /^(\d{1,2})\s*[)）]\s*(.+)$/;
const OPTION_LETTER_RE = /^([A-Da-d])\s*[.、)．:：]\s*(.+)$/;
const ANSWER_INLINE_RE = /(?:答え|正解|回答|answer|Answer|ANSWER)\s*[:：]?\s*([A-Da-d1-4])/;
const ANSWER_TAIL_RE = /[（(]\s*([A-Da-d1-4])\s*[）)]\s*$/;
const STANDALONE_ANSWER_RE = /^[（(]\s*([A-Da-d1-4])\s*[）)]\s*$/;
const ANSWER_KEY_LINE_RE = /(?:答え|正解|回答|answer|Answer|ANSWER|key)\s*[:：]/i;

const SECTION_PATTERNS: Array<{ type: PdfSectionType; re: RegExp }> = [
  { type: 'knowledge', re: /(知識|文法|語彙|単語|词汇)/ },
  { type: 'reading', re: /(読解|読み|文章|読解|阅读|Reading)/ },
  { type: 'listening', re: /(聴解|聞き取り|会話|听解|Listening)/ },
];

function detectSection(text: string): PdfSectionType | null {
  for (const { type, re } of SECTION_PATTERNS) {
    if (re.test(text)) return type;
  }
  return null;
}

function detectLevel(text: string): string | null {
  const kanji = text.match(KANJI_LEVEL_RE);
  if (kanji) return kanji[1].toUpperCase();
  const m = text.match(LEVEL_RE);
  return m ? m[1].toUpperCase() : null;
}

function normalizeAnswerToken(token: string): string {
  const t = token.trim();
  if (/^[1-4]$/.test(t)) return String.fromCharCode(65 + (Number(t) - 1));
  return t.toUpperCase();
}

/**
 * Parses answer-key lines such as "1-A 2-C 3-B" into a map of
 * question number -> answer letter.
 */
function parseAnswerKeyBlock(lines: string[]): Map<number, string> {
  const map = new Map<number, string>();
  const pairRe = /(\d{1,3})\s*[.、\-–:：]?\s*([A-Da-d])\b/g;
  for (const line of lines) {
    if (!ANSWER_KEY_LINE_RE.test(line)) continue;
    let m: RegExpExecArray | null;
    pairRe.lastIndex = 0;
    while ((m = pairRe.exec(line)) !== null) {
      const num = Number(m[1]);
      if (!map.has(num)) map.set(num, normalizeAnswerToken(m[2]));
    }
  }
  return map;
}

/**
 * Matches a standalone answer line such as "答え: A" or "Answer: B".
 */
const STANDALONE_ANSWER_LINE_RE = /^(?:答え|正解|回答|answer|key)\s*[:：]\s*([A-Da-d1-4])\s*$/i;

/**
 * Parses extracted PDF text into raw import questions.
 *
 * Supported layout (per question):
 *   1. Question text
 *      A) option one
 *      B) option two
 *      答え: A          (inline answer, "(A)" tail, or a trailing answer-key block)
 */
export function parsePdfText(text: string): PdfParseResult {
  const warnings: string[] = [];
  const lines = toLines(text || '');

  if (!lines.length) {
    return {
      questions: [],
      detectedLevel: null,
      detectedSection: null,
      warnings: ['PDF faylda o‘qiladigan matn topilmadi (skan qilingan PDF bo‘lishi mumkin).'],
    };
  }

  const detectedLevel = detectLevel(text);
  const detectedSection = detectSection(text);
  const answerKey = parseAnswerKeyBlock(lines);

  interface Block {
    number: number;
    text: string;
    options: string[];
    optionKeys: string[];
    answer: string | null;
    numericOptions: boolean | null;
  }

  const blocks: Block[] = [];
  let current: Block | null = null;

  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const line of lines) {
    // Standalone answer line for the current question ("答え: A").
    const standalone = line.match(STANDALONE_ANSWER_LINE_RE);
    if (standalone && current) {
      current.answer = normalizeAnswerToken(standalone[1]);
      continue;
    }

    // Answer-key-only lines are handled separately.
    if (ANSWER_KEY_LINE_RE.test(line) && !QUESTION_START_RE.test(line)) {
      continue;
    }

    // Numeric options must be checked before the question-start pattern,
    // because "1) option" also matches the question-start shape.
    // Numeric options are only accepted when they continue the sequence
    // 1,2,3,4 and the question does not already use lettered options.
    if (current && current.optionKeys.length < 4 && current.numericOptions !== false) {
      const numMatch = line.match(OPTION_NUM_RE);
      if (numMatch && Number(numMatch[1]) - 1 === current.options.length) {
        current.numericOptions = true;
        current.optionKeys.push(String.fromCharCode(65 + current.options.length));
        current.options.push(numMatch[2].trim());
        continue;
      }
    }

    const qMatch = line.match(QUESTION_START_RE);
    if (qMatch) {
      flush();
      const number = Number(qMatch[1]);
      let qText = qMatch[2].trim();
      let answer: string | null = null;

      const inline = qText.match(ANSWER_INLINE_RE);
      if (inline) {
        answer = normalizeAnswerToken(inline[1]);
        qText = qText.replace(ANSWER_INLINE_RE, '').trim();
      }
      const tail = qText.match(ANSWER_TAIL_RE);
      if (tail && !answer) {
        answer = normalizeAnswerToken(tail[1]);
        qText = qText.replace(ANSWER_TAIL_RE, '').trim();
      }

      current = {
        number,
        text: qText,
        options: [],
        optionKeys: [],
        answer,
        numericOptions: null,
      };
      continue;
    }

    if (!current) continue;

    // A standalone "(B)" line acts as the answer of the current question.
    const alone = line.match(STANDALONE_ANSWER_RE);
    if (alone) {
      current.answer = normalizeAnswerToken(alone[1]);
      continue;
    }

    const letterMatch = line.match(OPTION_LETTER_RE);
    if (letterMatch) {
      current.numericOptions = false;
      current.optionKeys.push(letterMatch[1].toUpperCase());
      current.options.push(letterMatch[2].trim());
      continue;
    }

    // Continuation line: append to the previous option or to the question text.
    if (current.options.length > 0) {
      current.options[current.options.length - 1] += ' ' + line;
    } else {
      current.text += ' ' + line;
    }
  }
  flush();

  const questions: RawImportQuestion[] = [];

  for (const block of blocks) {
    if (!block.options.length) {
      warnings.push(`Savol ${block.number}: variantlar topilmadi — bu savol import qilinmadi.`);
      continue;
    }

    const answer = block.answer ?? answerKey.get(block.number) ?? null;

    if (!answer) {
      warnings.push(
        `Savol ${block.number}: to‘g‘ri javob topilmadi — importdan oldin to‘ldirilishi kerak.`,
      );
    }

    const answerLetter = answer ? normalizeAnswerToken(answer) : '';
    const answerIndex = answerLetter ? block.optionKeys.indexOf(answerLetter) : -1;

    questions.push({
      id: `pdf-${block.number}`,
      question: block.text,
      question_text: block.text,
      type: 'multiple_choice',
      options: block.options,
      correctAnswer: answerLetter,
      correct_index: answerIndex >= 0 ? answerIndex : undefined,
      explanation: '',
      level: detectedLevel ?? '',
      section: detectedSection ?? '',
      section_name: detectedSection ?? '',
      section_type: detectedSection ?? '',
    });
  }

  if (blocks.length === 0) {
    warnings.push('PDF matnida savol formatini topib bo‘lmadi.');
  }

  return { questions, detectedLevel, detectedSection, warnings };
}

/**
 * Reads a File into an ArrayBuffer.
 * Falls back to FileReader for environments (older jsdom) without Blob.arrayBuffer.
 */
export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Faylni o‘qib bo‘lmadi.'));
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Full PDF import pipeline: validate file -> extract text -> parse questions.
 */
export async function parsePdfFile(
  file: File,
  extractor: PdfTextExtractor = extractPdfText,
): Promise<PdfParseResult & { pageCount: number }> {
  const validation = validatePdfFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'PDF faylni o‘qib bo‘lmadi.');
  }

  const buffer = await readFileAsArrayBuffer(file);
  const { text, pageCount } = await extractor(buffer);
  const parsed = parsePdfText(text);
  return { ...parsed, pageCount };
}

/**
 * Converts parsed PDF questions into the JSON payload accepted by
 * ExamBulkImportService.parseAndValidate (format: 'json').
 */
export function pdfQuestionsToJson(questions: RawImportQuestion[]): string {
  return JSON.stringify(questions, null, 2);
}

/**
 * Joins two text fragments that belong to the same visual line.
 * A space is inserted only between two ASCII alphanumerics so that
 * Japanese text and split tokens like "( A )" stay intact.
 */
function joinFragments(left: string, right: string): string {
  if (!left) return right;
  if (!right) return left;
  const last = left[left.length - 1];
  const first = right[0];
  const needsSpace = /[A-Za-z0-9]/.test(last) && /[A-Za-z0-9]/.test(first);
  return needsSpace ? `${left} ${right}` : `${left}${right}`;
}

interface TextItemLike {
  str: string;
  transform?: number[];
  hasEOL?: boolean;
}

/**
 * Rebuilds visual lines from pdf.js text items using their Y coordinates.
 * pdf.js returns text items in reading order but without line breaks, so this
 * step is required to keep questions/options on separate lines.
 */
export function reconstructLinesFromItems(items: TextItemLike[]): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let currentY: number | null = null;

  const pushLine = () => {
    const trimmed = currentLine.trim();
    if (trimmed) lines.push(trimmed);
    currentLine = '';
    currentY = null;
  };

  for (const item of items) {
    if (!item || typeof item.str !== 'string') continue;
    const y = Array.isArray(item.transform) ? item.transform[5] : undefined;

    if (typeof y === 'number' && typeof currentY === 'number' && Math.abs(y - currentY) > 3) {
      pushLine();
    }

    currentLine = joinFragments(currentLine, item.str);
    if (typeof y === 'number') currentY = y;

    if (item.hasEOL) pushLine();
  }
  pushLine();

  return lines;
}

export async function extractPdfText(data: ArrayBuffer): Promise<PdfExtractionResult> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerUrl = (await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url')).default;

  // Point pdf.js at the bundled worker (Vite emits it as a static asset).
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(data),
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;

  const pageCount = doc.numPages;
  const pages: string[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lines = reconstructLinesFromItems(content.items as unknown as TextItemLike[]);
    pages.push(lines.join('\n'));
    page.cleanup();
  }
  await doc.destroy();

  return { text: pages.join('\n\n'), pageCount };
}
