import { supabase } from '../lib/supabase';
import { sanitizeErrorMessage } from '../components/ErrorBoundary';
import { ExamImportHistoryService, type ImportActor } from './ExamImportHistoryService';
import { ExamWorkflowService } from './ExamWorkflowService';
import {
  type ExamLicenseType,
  normalizeLicenseType,
  validateJlptOfficialStatus,
} from '../types/examMetadata';
import {
  type JlptQuestionType,
  buildJlptQuestionPayload,
  getJlptQuestionTypeDefinition,
  isValidSentenceOrdering,
  normalizeJlptQuestionType,
  parseSentenceOrderingData,
} from '../types/jlptQuestionType';

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type ValidExamSection = 'knowledge' | 'reading' | 'listening';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface ImportContext {
  actor?: ImportActor;
  sourceFormat?: string | null;
  batchId?: string;
}

export interface RawImportQuestion {
  id?: string | number;
  question?: string;
  question_text?: string;
  type?: 'multiple_choice' | 'true_false' | 'short_answer' | string;
  options?: string[] | string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correctAnswer?: string | number;
  correct_answer?: string;
  correct_index?: number | string;
  explanation?: string | null;
  translation?: string | null;
  translation_text?: string | null;
  explanation_translation?: string | null;
  passage?: string | null;
  reading_passage?: string | null;
  text?: string | null;
  content?: string | null;
  level?: string;
  section?: string;
  section_name?: string;
  section_type?: 'reading' | 'listening' | 'knowledge' | string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  question_type?: string;
  fragments?: string[] | string;
  correct_order?: number[] | string;
  correctOrder?: number[] | string;
  star_position?: number | string;
  starPosition?: number | string;
  prefix?: string | null;
  suffix?: string | null;
  question_payload?: Record<string, any> | string | null;
  is_published?: boolean;
  source?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  url?: string | null;
  author?: string | null;
  license?: string | null;
  license_type?: string | null;
  copyright_confirmed?: boolean | string | null;
  is_official?: boolean | string | null;
  is_official_jlpt?: boolean | string | null;
}

export interface ValidatedQuestion {
  id?: string | number;
  question_text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  correct_index: number;
  explanation: string | null;
  translation?: string | null;
  passage?: string | null;
  level: JlptLevel | null;
  section_name: string;
  section_type: string;
  difficulty?: QuestionDifficulty;
  question_type: JlptQuestionType;
  question_payload: Record<string, any>;
  source_name?: string | null;
  source_url?: string | null;
  author?: string | null;
  license_type?: ExamLicenseType;
  copyright_confirmed?: boolean;
  is_official_jlpt?: boolean;
}

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code?: string;
}

export interface QuestionValidationItem {
  row: number;
  raw: RawImportQuestion;
  validated: ValidatedQuestion | null;
  status: 'valid' | 'warning' | 'error';
  issues: ValidationIssue[];
  isDuplicate: boolean;
  isSimilar?: boolean;
  isPassageDuplicate?: boolean;
  similarToRow?: number | null;
}

export interface BulkAuditSummary {
  errors: QuestionValidationItem[];
  warnings: QuestionValidationItem[];
  successful: QuestionValidationItem[];
  duplicates: QuestionValidationItem[];
  counts: {
    total: number;
    errors: number;
    warnings: number;
    successful: number;
    duplicates: number;
    similar: number;
    passageDuplicates: number;
  };
}

export interface BulkValidationResult {
  isValid: boolean;
  totalCount: number;
  validCount: number;
  successfulCount: number;
  errorCount: number;
  warningCount: number;
  duplicateCount: number;
  similarCount: number;
  passageDuplicateCount: number;
  items: QuestionValidationItem[];
  audit: BulkAuditSummary;
  detectedSections: string[];
}

export interface FullExamImportPayload {
  title: string;
  type: string;
  description?: string;
  level?: JlptLevel;
  sourceName?: string;
  sourceUrl?: string;
  author?: string;
  licenseType?: ExamLicenseType;
  copyrightConfirmed?: boolean;
  isOfficialJlpt?: boolean;
  sections: Array<{
    title: string;
    type: string;
    questions: ValidatedQuestion[];
  }>;
}

export class ExamBulkImportService {
  /**
   * Robust RFC 4180 compliant CSV parser that supports quotes, commas, newlines, and UTF-8 Japanese characters.
   */
  static parseCsv(csvText: string): Record<string, string>[] {
    if (!csvText || !csvText.trim()) return [];

    // Strip BOM if present
    const cleanText = csvText.replace(/^\uFEFF/, '').trim();

    // Auto-detect delimiter: comma or semicolon
    const firstLine = cleanText.split(/\r?\n/)[0] || '';
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    if (rows.length < 2) return [];

    const headers = rows[0].map((h) => h.toLowerCase().trim().replace(/\s+/g, '_'));
    const result: Record<string, string>[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] !== undefined ? row[idx] : '';
      });
      result.push(obj);
    }

    return result;
  }

  /**
   * Safely parses JSON string as questions array or full exam object.
   */
  static parseJson(jsonText: string): any {
    if (!jsonText || !jsonText.trim()) return [];
    try {
      return JSON.parse(jsonText.trim());
    } catch (e: any) {
      throw new Error(`JSON sintaksis xatosi: ${sanitizeErrorMessage(e?.message || '')}`);
    }
  }

  /**
   * Normalizes raw question objects from either CSV or JSON into unified structures.
   */
  static extractQuestionsFromData(data: any): RawImportQuestion[] {
    if (!data) return [];

    // Case 1: Array of questions
    if (Array.isArray(data)) {
      return data;
    }

    // Case 2: Full Exam object with sections
    if (typeof data === 'object' && Array.isArray(data.sections)) {
      const list: RawImportQuestion[] = [];
      for (const sec of data.sections) {
        const secTitle = sec.title || sec.name || "Asosiy Bo'lim";
        const secType = sec.type || 'reading';
        if (Array.isArray(sec.questions)) {
          for (const q of sec.questions) {
            list.push({
              ...q,
              section_name: q.section_name || secTitle,
              section_type: q.section_type || secType,
              level: q.level || data.level,
            });
          }
        }
      }
      return list;
    }

    // Case 3: Object with a "questions" property
    if (typeof data === 'object' && Array.isArray(data.questions)) {
      return data.questions;
    }

    return [];
  }

  /**
   * Validates raw items against schema:
   * 1. Required fields: question_text, options, correct_answer/index.
   * 2. Correct answer index & bounds validation (resolves 0-based, 1-based, or A/B/C/D letter indices).
   * 3. Level validation against expected JLPT level.
   * 4. Deduplication: detects duplicate IDs, exact duplicates, near-duplicates (fuzzy
   *    similarity), and already imported passages inside the batch or database.
   * 5. Content quality audit: Japanese text presence, translation and explanation
   *    completeness, level/difficulty compatibility.
   */
  static validateQuestions(
    rawQuestions: RawImportQuestion[],
    options: {
      expectedLevel?: string;
      existingQuestionTexts?: string[];
      existingQuestionIds?: Array<string | number>;
      existingPassages?: string[];
      defaultSectionName?: string;
      checkIntraBatchDuplicates?: boolean;
      checkIntraBatchPassageDuplicates?: boolean;
      similarityThreshold?: number;
    } = {},
  ): BulkValidationResult {
    const items: QuestionValidationItem[] = [];
    const seenTextsInBatch = new Set<string>();
    const seenIdsInBatch = new Set<string>();
    const seenPassagesInBatch = new Map<string, number>();
    const batchQuestions: Array<{ row: number; normalized: string }> = [];
    const existingTexts = new Set(
      (options.existingQuestionTexts || []).map((t) => this.normalizeText(t)).filter(Boolean),
    );
    const existingIds = new Set(
      (options.existingQuestionIds || [])
        .map((id) => String(id).trim())
        .filter((id) => id.length > 0),
    );
    const existingPassages = new Set(
      (options.existingPassages || []).map((p) => this.normalizeText(p)).filter(Boolean),
    );
    const similarityThreshold =
      options.similarityThreshold === undefined ? 0.8 : options.similarityThreshold;
    const checkIntraBatch = options.checkIntraBatchDuplicates !== false;
    const checkIntraBatchPassages = options.checkIntraBatchPassageDuplicates === true;

    const detectedSections = new Set<string>();
    const validLevels = new Set(['N5', 'N4', 'N3', 'N2', 'N1']);
    const expectedNormalizedLevel = options.expectedLevel
      ? options.expectedLevel.toUpperCase().replace(/[^N1-5]/g, '')
      : null;

    rawQuestions.forEach((raw, idx) => {
      const rowNumber = idx + 1;
      const issues: ValidationIssue[] = [];

      // 0. Duplicate ID Check
      if (raw.id !== undefined && raw.id !== null && String(raw.id).trim() !== '') {
        const idStr = String(raw.id).trim();
        if (seenIdsInBatch.has(idStr) || existingIds.has(idStr)) {
          issues.push({
            row: rowNumber,
            field: 'id',
            message: existingIds.has(idStr)
              ? `Duplicate ID aniqlandi: "${idStr}" identifikatori tizim bazasida allaqachon mavjud.`
              : `Duplicate ID aniqlandi: "${idStr}" identifikatori fayl ichida bir necha bor ishlatilgan.`,
            severity: 'error',
            code: 'duplicate_id',
          });
        } else {
          seenIdsInBatch.add(idStr);
        }
      }

      // 1. Question Text validation (Talab 1 & Talab 5: bo'sh savol)
      const rawQ = raw.question_text !== undefined ? raw.question_text : raw.question;
      const questionText = (rawQ !== undefined && rawQ !== null ? String(rawQ) : '').trim();

      if (!questionText) {
        issues.push({
          row: rowNumber,
          field: 'question_text',
          message: "Savol matni (question_text) kiritilishi shart yoki bo'sh qoldirilgan.",
          severity: 'error',
        });
      } else if (questionText.length < 3) {
        issues.push({
          row: rowNumber,
          field: 'question_text',
          message: "Savol matni juda qisqa (kamida 3 ta belgi bo'lishi shart).",
          severity: 'error',
          code: 'question_too_short',
        });
      } else if (!this.containsJapanese(questionText)) {
        issues.push({
          row: rowNumber,
          field: 'question_text',
          message:
            'Content quality: savol matnida yapon yozuvi (hiragana, katakana yoki kanji) topilmadi.',
          severity: 'warning',
          code: 'japanese_text_missing',
        });
      }

      const rawPayload =
        raw.question_payload && typeof raw.question_payload === 'object'
          ? raw.question_payload
          : {};

      // 2. Options Extraction & Validation (Talab 1 & Talab 5: bo'sh variant)
      let optionsList: string[] = [];
      let hasEmptyOption = false;

      if (Array.isArray(raw.options)) {
        if (raw.options.some((o) => o === null || o === undefined || String(o).trim() === '')) {
          hasEmptyOption = true;
        }
        optionsList = raw.options
          .map((o) => (o !== undefined && o !== null ? String(o).trim() : ''))
          .filter(Boolean);
      } else if (typeof raw.options === 'string') {
        try {
          const parsed = JSON.parse(raw.options);
          if (Array.isArray(parsed)) {
            if (parsed.some((o) => o === null || o === undefined || String(o).trim() === '')) {
              hasEmptyOption = true;
            }
            optionsList = parsed
              .map((o) => (o !== undefined && o !== null ? String(o).trim() : ''))
              .filter(Boolean);
          }
        } catch {
          const parts = raw.options.split('|');
          if (parts.some((o) => o.trim() === '')) {
            hasEmptyOption = true;
          }
          optionsList = parts.map((o) => o.trim()).filter(Boolean);
        }
      } else {
        // Individual columns: option_a, option_b, option_c, option_d
        const rawOpts = [raw.option_a, raw.option_b, raw.option_c, raw.option_d];
        const definedOpts = rawOpts.filter((o) => o !== undefined && o !== null);
        if (definedOpts.length > 0 && definedOpts.some((o) => String(o).trim() === '')) {
          hasEmptyOption = true;
        }
        optionsList = definedOpts.map((o) => String(o).trim()).filter((o) => o.length > 0);
      }

      if (optionsList.length === 0 && Array.isArray(rawPayload.options)) {
        optionsList = rawPayload.options
          .map((option: unknown) => String(option).trim())
          .filter(Boolean);
      }

      if (hasEmptyOption) {
        issues.push({
          row: rowNumber,
          field: 'options',
          message: "Bo'sh variant aniqlandi: barcha variantlar to'ldirilgan bo'lishi shart.",
          severity: 'error',
        });
      }

      const baseSectionHint =
        raw.section_type || raw.section || raw.section_name || options.defaultSectionName || null;
      const questionType = normalizeJlptQuestionType(
        raw.question_type ||
          (raw.fragments || raw.correct_order || raw.correctOrder ? 'sentence_ordering' : raw.type),
        baseSectionHint,
      );
      const questionTypeDef = getJlptQuestionTypeDefinition(questionType);
      const isSentenceOrdering = questionType === 'sentence_ordering';

      const orderingData = isSentenceOrdering
        ? parseSentenceOrderingData({
            fragments: raw.fragments,
            options: optionsList,
            correctOrder:
              raw.correct_order ?? raw.correctOrder ?? raw.correctAnswer ?? raw.correct_answer,
            starPosition: raw.star_position ?? raw.starPosition,
            prefix: raw.prefix,
            suffix: raw.suffix,
          })
        : null;

      if (orderingData && orderingData.fragments.length > 0) {
        optionsList = orderingData.fragments;
      }

      const qType: 'multiple_choice' | 'true_false' | 'short_answer' =
        raw.type === 'true_false' || raw.type === 'short_answer' ? raw.type : 'multiple_choice';

      if (isSentenceOrdering) {
        if (!orderingData || orderingData.fragments.length !== 4) {
          issues.push({
            row: rowNumber,
            field: 'fragments',
            message: `Gap tartibi savolida aynan 4 ta fragment bo'lishi shart (hozir ${orderingData?.fragments.length || 0} ta).`,
            severity: 'error',
            code: 'sentence_fragments_invalid',
          });
        }
        if (!orderingData || !isValidSentenceOrdering(orderingData)) {
          issues.push({
            row: rowNumber,
            field: 'correct_order',
            message:
              "Gap tartibi uchun correct_order [0..3] permutatsiyasi va star_position (1-4) to'g'ri ko'rsatilishi shart.",
            severity: 'error',
            code: 'sentence_order_invalid',
          });
        }
      } else {
        if (qType === 'multiple_choice') {
          if (optionsList.length < 2) {
            issues.push({
              row: rowNumber,
              field: 'options',
              message: `Variantlar soni yetarli emas (kamida 2 ta to'ldirilgan variant bo'lishi shart, hozir ${optionsList.length} ta).`,
              severity: 'error',
            });
          } else {
            // Check for duplicate options in the same question
            const uniqueOpts = new Set(optionsList.map((o) => o.toLowerCase()));
            if (uniqueOpts.size < optionsList.length) {
              issues.push({
                row: rowNumber,
                field: 'options',
                message: 'Variantlar orasida bir xil takroriy variantlar mavjud.',
                severity: 'warning',
              });
            }
          }
        }
      }

      // 3. Correct Answer and Index Resolution (Talab 1 & Talab 4)
      let resolvedIndex = -1;
      let resolvedAnswer = '';

      const rawIndex = raw.correct_index !== undefined ? String(raw.correct_index).trim() : '';
      const rawAnswerField =
        raw.correctAnswer !== undefined ? raw.correctAnswer : raw.correct_answer;
      const rawAnswer =
        rawAnswerField !== undefined && rawAnswerField !== null
          ? String(rawAnswerField).trim()
          : '';

      if (isSentenceOrdering) {
        if (orderingData && isValidSentenceOrdering(orderingData)) {
          resolvedIndex = orderingData.correctOrder[orderingData.starPosition - 1];
          resolvedAnswer = orderingData.fragments[resolvedIndex] || '';
        }
      } else if (!rawAnswer && rawIndex === '') {
        issues.push({
          row: rowNumber,
          field: 'correctAnswer',
          message: "To'g'ri javob (correctAnswer) yoki uning indeksi ko'rsatilmagan.",
          severity: 'error',
        });
      } else {
        const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };

        if (rawIndex !== '') {
          if (letterMap[rawIndex.toLowerCase()] !== undefined) {
            resolvedIndex = letterMap[rawIndex.toLowerCase()];
            if (resolvedIndex < 0 || resolvedIndex >= optionsList.length) {
              issues.push({
                row: rowNumber,
                field: 'correctAnswer',
                message: `Ko'rsatilgan javob indeksi (${rawIndex}) mavjud option indeksiga mos kelmadi. Variantlar soni: ${optionsList.length}.`,
                severity: 'error',
              });
            }
          } else if (!isNaN(Number(rawIndex))) {
            const num = Number(rawIndex);
            if (num >= 0 && num < optionsList.length) {
              resolvedIndex = num;
            } else if (num >= 1 && num <= optionsList.length) {
              resolvedIndex = num - 1;
            } else {
              issues.push({
                row: rowNumber,
                field: 'correctAnswer',
                message: `Ko'rsatilgan javob indeksi (${rawIndex}) mavjud option indeksiga mos kelmadi (Variantlar soni: ${optionsList.length}).`,
                severity: 'error',
              });
            }
          } else {
            issues.push({
              row: rowNumber,
              field: 'correctAnswer',
              message: `Javob indeksi noto'g'ri ko'rsatilgan: "${rawIndex}".`,
              severity: 'error',
            });
          }
        }

        if (rawAnswer !== '') {
          if (
            letterMap[rawAnswer.toLowerCase()] !== undefined &&
            optionsList.length > letterMap[rawAnswer.toLowerCase()]
          ) {
            resolvedIndex = letterMap[rawAnswer.toLowerCase()];
            resolvedAnswer = optionsList[resolvedIndex];
          } else if (!isNaN(Number(rawAnswer)) && resolvedIndex === -1) {
            const num = Number(rawAnswer);
            if (num >= 0 && num < optionsList.length) {
              resolvedIndex = num;
              resolvedAnswer = optionsList[num];
            } else if (num >= 1 && num <= optionsList.length) {
              resolvedIndex = num - 1;
              resolvedAnswer = optionsList[resolvedIndex];
            } else {
              issues.push({
                row: rowNumber,
                field: 'correctAnswer',
                message: `correctAnswer indeksi (${rawAnswer}) mavjud option indeksiga mos kelmadi.`,
                severity: 'error',
              });
            }
          } else {
            const matchIdx = optionsList.findIndex(
              (o) => o.toLowerCase() === rawAnswer.toLowerCase(),
            );
            if (matchIdx !== -1) {
              resolvedIndex = matchIdx;
              resolvedAnswer = optionsList[matchIdx];
            } else if (resolvedIndex !== -1 && resolvedIndex < optionsList.length) {
              resolvedAnswer = optionsList[resolvedIndex];
            } else {
              issues.push({
                row: rowNumber,
                field: 'correctAnswer',
                message: `correctAnswer ("${rawAnswer}") mavjud optionlar orasida topilmadi.`,
                severity: 'error',
              });
            }
          }
        } else if (resolvedIndex !== -1 && resolvedIndex < optionsList.length) {
          resolvedAnswer = optionsList[resolvedIndex];
        }

        // Consistency check if both index and answer are specified
        if (rawIndex && rawAnswer && resolvedIndex !== -1 && resolvedIndex < optionsList.length) {
          const optionText = optionsList[resolvedIndex].toLowerCase();
          const answerText = rawAnswer.toLowerCase();
          if (
            letterMap[answerText] === undefined &&
            isNaN(Number(rawAnswer)) &&
            optionText !== answerText
          ) {
            issues.push({
              row: rowNumber,
              field: 'correctAnswer',
              message: `Javob matni ("${rawAnswer}") va ko'rsatilgan indeks (${rawIndex} -> "${optionsList[resolvedIndex]}") o'zaro mos emas.`,
              severity: 'warning',
            });
          }
        }
      }

      // 4. Level Validation (Talab 2: faqat N5, N4, N3, N2 yoki N1 bo'lishi)
      let questionLevel: JlptLevel | null = null;
      const rawLevel =
        raw.level !== undefined && raw.level !== null && String(raw.level).trim() !== ''
          ? String(raw.level).trim()
          : options.expectedLevel
            ? String(options.expectedLevel).trim()
            : '';

      if (!rawLevel) {
        issues.push({
          row: rowNumber,
          field: 'level',
          message: 'Majburiy maydon: level (N1-N5) kiritilishi shart.',
          severity: 'error',
        });
      } else {
        const cleanLevel = rawLevel.toUpperCase().replace(/\s+/g, '');
        if (!validLevels.has(cleanLevel)) {
          issues.push({
            row: rowNumber,
            field: 'level',
            message: `level faqat N5, N4, N3, N2 yoki N1 bo'lishi shart. Kiritilgan: "${rawLevel}"`,
            severity: 'error',
          });
        } else {
          questionLevel = cleanLevel as JlptLevel;
          if (expectedNormalizedLevel && questionLevel !== expectedNormalizedLevel) {
            issues.push({
              row: rowNumber,
              field: 'level',
              message: `Savol darajasi (${questionLevel}) imtihon darajasiga (${expectedNormalizedLevel}) mos kelmadi.`,
              severity: 'warning',
            });
          }
        }
      }

      // 4b. Difficulty validation & level/difficulty compatibility audit.
      const rawDifficulty =
        raw.difficulty !== undefined && raw.difficulty !== null
          ? String(raw.difficulty).trim().toLowerCase()
          : '';
      let questionDifficulty: QuestionDifficulty = 'medium';

      if (rawDifficulty) {
        if (rawDifficulty !== 'easy' && rawDifficulty !== 'medium' && rawDifficulty !== 'hard') {
          issues.push({
            row: rowNumber,
            field: 'difficulty',
            message: `difficulty faqat easy, medium yoki hard bo'lishi shart. Kiritilgan: "${raw.difficulty}"`,
            severity: 'warning',
            code: 'invalid_difficulty',
          });
        } else {
          questionDifficulty = rawDifficulty;
        }
      }

      if (questionLevel && rawDifficulty) {
        const allowedDifficulty = this.getAllowedDifficultyForLevel(questionLevel);
        if (!allowedDifficulty.includes(questionDifficulty)) {
          issues.push({
            row: rowNumber,
            field: 'difficulty',
            message: `Daraja va qiyinlik mos emas: ${questionLevel} darajasi uchun "${questionDifficulty}" emas, ${allowedDifficulty.join(
              ' yoki ',
            )} tavsiya etiladi.`,
            severity: 'warning',
            code: 'level_difficulty_mismatch',
          });
        }
      }

      // 5. Section Validation (Talab 3: faqat knowledge, reading yoki listening bo'lishi)
      const rawSec =
        raw.section || raw.section_name || raw.section_type || options.defaultSectionName;
      const secStr = rawSec !== undefined && rawSec !== null ? String(rawSec).trim() : '';
      let normalizedSectionType: ValidExamSection | null = null;

      if (!secStr) {
        if (raw.question_type) {
          normalizedSectionType = questionTypeDef.section;
          detectedSections.add(normalizedSectionType);
        } else {
          issues.push({
            row: rowNumber,
            field: 'section',
            message:
              'Majburiy maydon: section (knowledge, reading yoki listening) kiritilishi shart.',
            severity: 'error',
          });
        }
      } else {
        const secLower = secStr.toLowerCase().replace(/[-_]/g, ' ');
        if (
          secLower === 'knowledge' ||
          secLower.includes('gengo') ||
          secLower.includes('vocab') ||
          secLower.includes('grammar') ||
          secLower.includes('chishiki')
        ) {
          normalizedSectionType = 'knowledge';
        } else if (secLower === 'reading' || secLower.includes('dokkai')) {
          normalizedSectionType = 'reading';
        } else if (secLower === 'listening' || secLower.includes('choukai')) {
          normalizedSectionType = 'listening';
        }

        if (!normalizedSectionType) {
          issues.push({
            row: rowNumber,
            field: 'section',
            message: `section faqat knowledge, reading yoki listening bo'lishi shart. Kiritilgan: "${secStr}"`,
            severity: 'error',
          });
        } else {
          detectedSections.add(normalizedSectionType);
          if (normalizedSectionType !== questionTypeDef.section) {
            issues.push({
              row: rowNumber,
              field: 'question_type',
              message: `${questionTypeDef.labelUz} (${questionTypeDef.labelJa}) odatda "${questionTypeDef.section}" bo'limiga tegishli, lekin savol "${normalizedSectionType}" bo'limiga qo'shilmoqda.`,
              severity: 'warning',
              code: 'question_type_section_mismatch',
            });
          }
        }
      }

      // 6. Deduplication & near-duplicate detection (savol matni bo'yicha)
      let isDuplicate = false;
      let isSimilar = false;
      let isPassageDuplicate = false;
      let similarToRow: number | null = null;

      const rawPassage =
        [raw.passage, raw.reading_passage, raw.text, raw.content]
          .map((v) => (v !== undefined && v !== null ? String(v).trim() : ''))
          .find((v) => v.length > 0) || null;

      const normalizedQ = this.normalizeText(questionText);
      if (normalizedQ) {
        if (checkIntraBatch && seenTextsInBatch.has(normalizedQ)) {
          isDuplicate = true;
          issues.push({
            row: rowNumber,
            field: 'question_text',
            message: 'Takroriy savol: fayl ichida aynan shu savol avvalroq uchragan.',
            severity: 'warning',
            code: 'duplicate_question',
          });
        } else if (existingTexts.has(normalizedQ)) {
          isDuplicate = true;
          issues.push({
            row: rowNumber,
            field: 'question_text',
            message: 'Takroriy savol: ushbu savol tizim bazasida allaqachon mavjud.',
            severity: 'warning',
            code: 'duplicate_question',
          });
        } else {
          // Fuzzy near-duplicate detection inside the same file.
          if (checkIntraBatch && normalizedQ.length >= 4) {
            const similar = batchQuestions.find(
              (prev) =>
                this.calculateSimilarity(prev.normalized, normalizedQ) >= similarityThreshold,
            );
            if (similar) {
              isDuplicate = true;
              isSimilar = true;
              similarToRow = similar.row;
              issues.push({
                row: rowNumber,
                field: 'question_text',
                message: `Juda o'xshash savol: ${similar.row}-qatordagi savolga ${(
                  this.calculateSimilarity(similar.normalized, normalizedQ) * 100
                ).toFixed(0)}% o'xshashlik aniqlandi.`,
                severity: 'warning',
                code: 'similar_question',
              });
            }
          }

          // Fuzzy near-duplicate detection against existing database questions.
          if (!isSimilar && normalizedQ.length >= 4) {
            const similarExisting = Array.from(existingTexts).find(
              (prev) =>
                prev.length >= 4 &&
                this.calculateSimilarity(prev, normalizedQ) >= similarityThreshold,
            );
            if (similarExisting) {
              isDuplicate = true;
              isSimilar = true;
              issues.push({
                row: rowNumber,
                field: 'question_text',
                message:
                  "Juda o'xshash savol: tizim bazasida shunga o'xshash savol allaqachon mavjud.",
                severity: 'warning',
                code: 'similar_question',
              });
            }
          }
        }

        seenTextsInBatch.add(normalizedQ);
        batchQuestions.push({ row: rowNumber, normalized: normalizedQ });
      }

      // 6b. Passage re-import detection.
      const normalizedPassage = rawPassage ? this.normalizeText(rawPassage) : '';
      if (normalizedPassage) {
        if (existingPassages.has(normalizedPassage)) {
          isPassageDuplicate = true;
          issues.push({
            row: rowNumber,
            field: 'passage',
            message:
              'Takroriy passage: ushbu passage tizim bazasida allaqachon mavjud, qayta import qilinmoqda.',
            severity: 'warning',
            code: 'duplicate_passage',
          });
        }

        const previousPassageRow = seenPassagesInBatch.get(normalizedPassage);
        if (checkIntraBatchPassages && previousPassageRow !== undefined) {
          isPassageDuplicate = true;
          issues.push({
            row: rowNumber,
            field: 'passage',
            message: `Takroriy passage: fayl ichida ${previousPassageRow}-qatorda ham xuddi shu passage ishlatilgan.`,
            severity: 'warning',
            code: 'duplicate_passage',
          });
        }
        if (previousPassageRow === undefined) {
          seenPassagesInBatch.set(normalizedPassage, rowNumber);
        }
      }

      // 6c. Translation & explanation completeness audit.
      const translation =
        [raw.translation, raw.translation_text, raw.explanation_translation]
          .map((v) => (v !== undefined && v !== null ? String(v).trim() : ''))
          .find((v) => v.length > 0) || '';
      const explanation =
        raw.explanation !== undefined && raw.explanation !== null
          ? String(raw.explanation).trim()
          : '';

      if (!translation) {
        issues.push({
          row: rowNumber,
          field: 'translation',
          message: 'Content quality: tarjima (translation) kiritilmagan.',
          severity: 'warning',
          code: 'translation_missing',
        });
      }

      if (!explanation) {
        issues.push({
          row: rowNumber,
          field: 'explanation',
          message: 'Content quality: izoh (explanation) kiritilmagan.',
          severity: 'warning',
          code: 'explanation_missing',
        });
      }

      // 7. Source & License Metadata validation (Task 7)
      const rawSourceName =
        (raw.source_name !== undefined && raw.source_name !== null
          ? String(raw.source_name).trim()
          : raw.source !== undefined && raw.source !== null
            ? String(raw.source).trim()
            : '') || null;

      const rawSourceUrl =
        (raw.source_url !== undefined && raw.source_url !== null
          ? String(raw.source_url).trim()
          : raw.url !== undefined && raw.url !== null
            ? String(raw.url).trim()
            : '') || null;

      const rawAuthor =
        (raw.author !== undefined && raw.author !== null ? String(raw.author).trim() : '') || null;

      const rawLicense = normalizeLicenseType(raw.license_type || raw.license);

      const isCopyrightConfirmed = Boolean(
        raw.copyright_confirmed === true ||
        raw.copyright_confirmed === 'true' ||
        raw.copyright_confirmed === '1' ||
        raw.copyright_confirmed === 'yes',
      );

      const isOfficial = Boolean(
        raw.is_official_jlpt === true ||
        raw.is_official_jlpt === 'true' ||
        raw.is_official === true ||
        raw.is_official === 'true' ||
        raw.is_official === '1',
      );

      if (rawLicense === 'restricted') {
        issues.push({
          row: rowNumber,
          field: 'license_type',
          message:
            "Diqqat: Ushbu savolda 'Restricted' litsenziyasi ko'rsatilgan. Nashr qilishdan oldin ruxsatnoma olingan bo'lishi shart.",
          severity: 'warning',
        });
      }

      if (isOfficial) {
        const officialCheck = validateJlptOfficialStatus({
          isOfficialJlpt: true,
          sourceName: rawSourceName || undefined,
        });
        if (!officialCheck.isValid && officialCheck.error) {
          issues.push({
            row: rowNumber,
            field: 'is_official_jlpt',
            message: officialCheck.error,
            severity: 'warning',
          });
        }
      }

      const hasErrors = issues.some((i) => i.severity === 'error');

      const validated: ValidatedQuestion | null = hasErrors
        ? null
        : {
            id: raw.id,
            question_text: questionText,
            type: qType,
            options: optionsList,
            correct_answer: resolvedAnswer,
            correct_index: resolvedIndex,
            explanation: explanation || null,
            translation: translation || null,
            passage: rawPassage,
            level: questionLevel,
            section_name: normalizedSectionType || secStr || 'knowledge',
            section_type: normalizedSectionType || 'knowledge',
            difficulty: questionDifficulty,
            question_type: questionType,
            question_payload: buildJlptQuestionPayload({
              ...(rawPayload as any),
              type: questionType,
              options: optionsList,
              correctAnswer: resolvedAnswer,
              correctIndex: resolvedIndex,
              fragments: orderingData?.fragments,
              correctOrder: orderingData?.correctOrder,
              starPosition: orderingData?.starPosition,
              prefix: orderingData?.prefix,
              suffix: orderingData?.suffix,
            }),
            source_name: rawSourceName,
            source_url: rawSourceUrl,
            author: rawAuthor,
            license_type: rawLicense,
            copyright_confirmed: isCopyrightConfirmed,
            is_official_jlpt: isOfficial,
          };

      // Ogohlantirish: reading bo'limida passagesiz savol
      if (validated && validated.section_type === 'reading' && !validated.passage) {
        issues.push({
          row: rowNumber,
          field: 'passage',
          message: 'Reading savolida passage (matn) kiritilmagan — previewda matnsiz chiqadi.',
          severity: 'warning',
        });
      }

      const hasErrorsFinal = issues.some((i) => i.severity === 'error');
      const hasWarningsFinal = issues.some((i) => i.severity === 'warning');
      const finalStatus: 'valid' | 'warning' | 'error' = hasErrorsFinal
        ? 'error'
        : hasWarningsFinal
          ? 'warning'
          : 'valid';

      items.push({
        row: rowNumber,
        raw,
        validated,
        status: finalStatus,
        issues,
        isDuplicate,
        isSimilar,
        isPassageDuplicate,
        similarToRow,
      });
    });

    const errorItems = items.filter((i) => i.status === 'error');
    const warningItems = items.filter((i) => i.status === 'warning');
    const successfulItems = items.filter((i) => i.status === 'valid');
    const duplicateItems = items.filter((i) => i.isDuplicate);

    const errorCount = errorItems.length;
    const warningCount = warningItems.length;
    const duplicateCount = duplicateItems.length;
    const similarCount = items.filter((i) => i.isSimilar).length;
    const passageDuplicateCount = items.filter((i) => i.isPassageDuplicate).length;
    const validCount = items.filter((i) => i.validated !== null).length;
    const successfulCount = successfulItems.length;

    return {
      isValid: errorCount === 0 && validCount > 0,
      totalCount: items.length,
      validCount,
      successfulCount,
      errorCount,
      warningCount,
      duplicateCount,
      similarCount,
      passageDuplicateCount,
      items,
      audit: {
        errors: errorItems,
        warnings: warningItems,
        successful: successfulItems,
        duplicates: duplicateItems,
        counts: {
          total: items.length,
          errors: errorCount,
          warnings: warningCount,
          successful: successfulCount,
          duplicates: duplicateCount,
          similar: similarCount,
          passageDuplicates: passageDuplicateCount,
        },
      },
      detectedSections: Array.from(detectedSections),
    };
  }

  /**
   * High-level entry point to parse CSV or JSON and run comprehensive validation.
   */
  static parseAndValidate(
    rawText: string,
    format: 'auto' | 'json' | 'csv' = 'auto',
    options: {
      defaultLevel?: string;
      existingQuestions?: Array<{
        id?: string | number;
        question_text?: string;
        passage?: string | null;
      }>;
      existingQuestionIds?: Array<string | number>;
      existingPassages?: string[];
      checkIntraBatchDuplicates?: boolean;
      checkIntraBatchPassageDuplicates?: boolean;
      similarityThreshold?: number;
    } = {},
  ): BulkValidationResult {
    const trimmed = rawText.trim();
    if (!trimmed) {
      return {
        isValid: false,
        totalCount: 0,
        validCount: 0,
        successfulCount: 0,
        errorCount: 0,
        warningCount: 0,
        duplicateCount: 0,
        similarCount: 0,
        passageDuplicateCount: 0,
        items: [],
        audit: {
          errors: [],
          warnings: [],
          successful: [],
          duplicates: [],
          counts: {
            total: 0,
            errors: 0,
            warnings: 0,
            successful: 0,
            duplicates: 0,
            similar: 0,
            passageDuplicates: 0,
          },
        },
        detectedSections: [],
      };
    }

    let rawItems: RawImportQuestion[] = [];
    const isJson =
      format === 'json' ||
      (format === 'auto' && (trimmed.startsWith('[') || trimmed.startsWith('{')));

    if (isJson) {
      try {
        rawItems = this.parseJson(trimmed);
      } catch (err: any) {
        const syntaxItem: QuestionValidationItem = {
          row: 1,
          raw: { question_text: '' },
          validated: null,
          status: 'error',
          issues: [
            {
              row: 1,
              field: 'json_syntax',
              message: err?.message || "JSON formati noto'g'ri.",
              severity: 'error',
              code: 'json_syntax',
            },
          ],
          isDuplicate: false,
        };
        return {
          isValid: false,
          totalCount: 1,
          validCount: 0,
          successfulCount: 0,
          errorCount: 1,
          warningCount: 0,
          duplicateCount: 0,
          similarCount: 0,
          passageDuplicateCount: 0,
          items: [syntaxItem],
          audit: {
            errors: [syntaxItem],
            warnings: [],
            successful: [],
            duplicates: [],
            counts: {
              total: 1,
              errors: 1,
              warnings: 0,
              successful: 0,
              duplicates: 0,
              similar: 0,
              passageDuplicates: 0,
            },
          },
          detectedSections: [],
        };
      }
    } else {
      try {
        const records = this.parseCsv(trimmed);
        rawItems = records.map((r) => ({
          id: r.id || r['ID'] || r['Id'],
          question: r.question,
          question_text: r.question_text || r.question || r['Savol'] || r['Question'] || '',
          type: r.type || 'multiple_choice',
          options: r.options || undefined,
          option_a: r.option_a || r['Variant A'] || r['A'] || '',
          option_b: r.option_b || r['Variant B'] || r['B'] || '',
          option_c: r.option_c || r['Variant C'] || r['C'] || '',
          option_d: r.option_d || r['Variant D'] || r['D'] || '',
          correctAnswer:
            r.correctAnswer ||
            r['correctAnswer'] ||
            r.correctanswer ||
            r.correct_answer ||
            r["To'g'ri javob"] ||
            r['Correct'] ||
            '',
          correct_answer:
            r.correct_answer ||
            r.correctanswer ||
            r.correctAnswer ||
            r["To'g'ri javob"] ||
            r['Correct'] ||
            '',
          correct_index: r.correct_index,
          explanation: r.explanation || r['Izoh'] || '',
          translation:
            r.translation || r.translation_text || r['Tarjima'] || r['Translation'] || '',
          difficulty: r.difficulty || r['Qiyinlik'] || r['Difficulty'] || '',
          passage:
            r.passage ||
            r['passage'] ||
            r.reading_passage ||
            r['Passage'] ||
            r['Matn'] ||
            r.text ||
            r.content ||
            '',
          reading_passage: r.reading_passage || r.passage || '',
          text: r.text || r.passage || '',
          content: r.content || r.passage || '',
          level: r.level || r['Daraja'] || '',
          section: r.section || r['Section'] || r.section_name || r["Bo'lim"] || '',
          section_name: r.section_name || r.section || r["Bo'lim"] || '',
          section_type: r.section_type || '',
          source: r.source || r.source_name || r['Manba'] || r['Source'] || '',
          source_name: r.source_name || r.source || r['Manba'] || r['Source'] || '',
          source_url: r.source_url || r.url || r['URL'] || r['Havola'] || '',
          author: r.author || r['Muallif'] || r['Author'] || '',
          license: r.license || r.license_type || r['Litsenziya'] || r['License'] || '',
          license_type: r.license_type || r.license || r['Litsenziya'] || r['License'] || '',
          copyright_confirmed: r.copyright_confirmed || r['Copyright'] || r['Mualliflik'] || '',
          is_official: r.is_official || r.is_official_jlpt || r['Rasmiy'] || '',
          is_official_jlpt: r.is_official_jlpt || r.is_official || r['Rasmiy'] || '',
        }));
      } catch (err: any) {
        const syntaxItem: QuestionValidationItem = {
          row: 1,
          raw: { question_text: '' },
          validated: null,
          status: 'error',
          issues: [
            {
              row: 1,
              field: 'csv_syntax',
              message: err?.message || "CSV formati noto'g'ri.",
              severity: 'error',
              code: 'csv_syntax',
            },
          ],
          isDuplicate: false,
        };
        return {
          isValid: false,
          totalCount: 1,
          validCount: 0,
          successfulCount: 0,
          errorCount: 1,
          warningCount: 0,
          duplicateCount: 0,
          similarCount: 0,
          passageDuplicateCount: 0,
          items: [syntaxItem],
          audit: {
            errors: [syntaxItem],
            warnings: [],
            successful: [],
            duplicates: [],
            counts: {
              total: 1,
              errors: 1,
              warnings: 0,
              successful: 0,
              duplicates: 0,
              similar: 0,
              passageDuplicates: 0,
            },
          },
          detectedSections: [],
        };
      }
    }

    const existingQuestions = options.existingQuestions || [];
    const existingTexts = existingQuestions.map((q) => q.question_text || '').filter(Boolean);
    const existingIds = [
      ...(options.existingQuestionIds || []),
      ...existingQuestions
        .map((q) => q.id)
        .filter((id): id is string | number => id !== undefined && id !== null),
    ];
    const existingPassages = [
      ...(options.existingPassages || []),
      ...existingQuestions.map((q) => q.passage || '').filter(Boolean),
    ];

    return this.validateQuestions(rawItems, {
      expectedLevel: options.defaultLevel,
      existingQuestionTexts: existingTexts,
      existingQuestionIds: existingIds,
      existingPassages,
      checkIntraBatchDuplicates: options.checkIntraBatchDuplicates,
      checkIntraBatchPassageDuplicates: options.checkIntraBatchPassageDuplicates,
      similarityThreshold: options.similarityThreshold,
    });
  }

  /**
   * Normalizes strings for deduplication checks.
   */
  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\s\u3000]+/g, ' ')
      .replace(/[、。！？!?,.]/g, '')
      .trim();
  }

  /**
   * Returns true when the text contains Japanese script (hiragana, katakana or kanji).
   */
  static containsJapanese(text: string): boolean {
    return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(text);
  }

  /**
   * Recommended difficulty tiers for every JLPT level.
   */
  static getAllowedDifficultyForLevel(level: JlptLevel): QuestionDifficulty[] {
    switch (level) {
      case 'N5':
        return ['easy'];
      case 'N4':
        return ['easy', 'medium'];
      case 'N3':
        return ['medium'];
      case 'N2':
        return ['medium', 'hard'];
      case 'N1':
      default:
        return ['hard'];
    }
  }

  /**
   * Calculates a 0..1 similarity score using character bigrams (works for
   * Japanese text without spaces) combined with word-level Jaccard similarity.
   */
  static calculateSimilarity(left: string, right: string): number {
    const a = this.normalizeText(left).replace(/\s+/g, '');
    const b = this.normalizeText(right).replace(/\s+/g, '');

    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;

    const bigrams = (value: string): Map<string, number> => {
      const map = new Map<string, number>();
      for (let i = 0; i < value.length - 1; i++) {
        const gram = value.slice(i, i + 2);
        map.set(gram, (map.get(gram) || 0) + 1);
      }
      return map;
    };

    const gramsA = bigrams(a);
    const gramsB = bigrams(b);
    let intersection = 0;
    for (const [gram, countA] of gramsA.entries()) {
      const countB = gramsB.get(gram) || 0;
      intersection += Math.min(countA, countB);
    }
    const dice = (2 * intersection) / (Math.max(a.length - 1, 1) + Math.max(b.length - 1, 1));

    const wordsA = new Set(a.split(/\s+/).filter(Boolean));
    const wordsB = new Set(b.split(/\s+/).filter(Boolean));
    let wordIntersection = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) wordIntersection++;
    }
    const union = wordsA.size + wordsB.size - wordIntersection;
    const jaccard = union > 0 ? wordIntersection / union : 0;

    return Math.max(dice, jaccard);
  }

  /**
   * Generates a sample CSV template for admins to download.
   */
  static generateSampleCsvTemplate(): string {
    return `id,section,question_type,question,passage,option_a,option_b,option_c,option_d,correctAnswer,explanation,translation,level,difficulty,fragments,correct_order,star_position
q1,knowledge,vocabulary_meaning,彼女はいつも（　）な服を着ている。,,派手,地味,清潔,親切,派手,"派手 (hade) - yorqin, dabdabali libos ma'nosida ishlatiladi.","U har doim yorqin kiyim kiyadi.",N3,medium,,,
q2,knowledge,kanji_reading,会議の時間を（　）してください。,,確認,約束,準備,相談,確認,"確認 (kakunin) - tasdiqlash, tekshirib ko'rish.","Uchrashuv vaqtini tasdiqlang.",N3,medium,,,
q3,reading,reading_main_idea,筆者が一番言いたいことは何か。,"科学技術の進歩は生活を便利にした。しかし同時に倫理観の見直しも求められている。",健康が第一だ,時間を大切にする,友達を増やす,勉強を続ける,健康が第一だ,Matnning 3-xatboshisida salomatlik asosiy boylik ekani aytilgan.,"Muallifning asosiy fikri salomatlik haqida.",N3,medium,,,
q4,listening,listening_situation,男の人はこの後まず何をしますか。,,資料をコピーする,部長に電話する,会議室を予約する,お茶を入れる,資料をコピーする,Avval nusxa olish kerakligi ta'kidlandi.,"Erkak avval hujjatlardan nusxa oladi.",N3,medium,,,
q5,knowledge,sentence_ordering,★に入る語句を選んでください。,,友達と,映画を,見に,日曜日に,,Gap tartibini aniqlang.,"Yakshanba kuni do'stlar bilan kinoga boraman.",N3,medium,友達と|映画を|見に|日曜日に,4|1|2|3,3`;
  }

  static generateCsvTemplate(): string {
    return this.generateSampleCsvTemplate();
  }

  /**
   * Generates a sample JSON template for admins to download.
   */
  static generateSampleJsonTemplate(): string {
    const sample = [
      {
        id: 'q1',
        section: 'knowledge',
        question: '彼女はいつも（　）な服を着ている。',
        type: 'multiple_choice',
        options: ['派手', '地味', '清潔', '親切'],
        correctAnswer: '派手',
        explanation: "派手 (hade) - yorqin, ko'zga tashlanadigan libos.",
        translation: 'U har doim yorqin kiyim kiyadi.',
        level: 'N3',
        difficulty: 'medium',
      },
      {
        id: 'q2',
        section: 'knowledge',
        question_type: 'sentence_ordering',
        question: '★に入る語句を選んでください。',
        type: 'multiple_choice',
        fragments: ['友達と', '映画を', '見に', '日曜日に'],
        correct_order: [3, 0, 1, 2],
        star_position: 3,
        correctAnswer: '映画を',
        explanation: "To'g'ri tartib: 日曜日に → 友達と → 映画を★ → 見に。",
        translation: 'Yakshanba kuni do‘stlar bilan kinoga boraman.',
        level: 'N3',
        difficulty: 'medium',
      },
      {
        id: 'q3',
        section: 'reading',
        question_type: 'reading_main_idea',
        question: '筆者が最も主張したいことはどれか。',
        passage: '科学技術の進歩は生活を便利にした。しかし同時に倫理観の見直しも求められている。',
        type: 'multiple_choice',
        options: [
          '健康管理が最も重要である',
          '仕事の効率を高めるべきだ',
          '趣味を持つことが大切だ',
          '早起きを習慣にする',
        ],
        correctAnswer: 0,
        explanation: "Muallif xulosa qismida salomatlik eng asosiy ekanini ta'kidlagan.",
        translation: 'Muallifning asosiy fikri salomatlik haqida.',
        level: 'N3',
        difficulty: 'medium',
      },
    ];
    return JSON.stringify(sample, null, 2);
  }

  static generateJsonTemplate(): string {
    return this.generateSampleJsonTemplate();
  }

  /**
   * Triggers client-side download of template file.
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Tahrirlangan savollar ro'yxatini qayta validatsiyadan o'tkazadi.
   * Preview ekranida inline tahrirdan so'ng chaqiriladi.
   */
  static revalidateEditedItems(
    items: QuestionValidationItem[],
    options: {
      expectedLevel?: string;
      existingQuestions?: Array<{
        id?: string | number;
        question_text?: string;
        passage?: string | null;
      }>;
      existingPassages?: string[];
      defaultSectionName?: string;
    } = {},
  ): BulkValidationResult {
    const rawItems: RawImportQuestion[] = items.map((item) => {
      const v = item.validated;
      const raw = item.raw;
      if (!v) return raw;
      return {
        ...raw,
        id: v.id ?? raw.id,
        question: v.question_text,
        question_text: v.question_text,
        type: v.type,
        options: [...v.options],
        correctAnswer: v.correct_answer,
        correct_answer: v.correct_answer,
        correct_index: v.correct_index,
        explanation: v.explanation || '',
        translation: v.translation || '',
        passage: v.passage || '',
        level: v.level || raw.level || options.expectedLevel || '',
        difficulty: v.difficulty || raw.difficulty || '',
        section: v.section_type,
        section_name: v.section_name,
        section_type: v.section_type,
      };
    });
    const existingQuestions = options.existingQuestions || [];
    const existingTexts = existingQuestions.map((q) => q.question_text || '').filter(Boolean);
    const existingIds = existingQuestions
      .map((q) => q.id)
      .filter((id): id is string | number => id !== undefined && id !== null);
    const existingPassages = [
      ...(options.existingPassages || []),
      ...existingQuestions.map((q) => q.passage || '').filter(Boolean),
    ];
    return this.validateQuestions(rawItems, {
      expectedLevel: options.expectedLevel,
      existingQuestionTexts: existingTexts,
      existingQuestionIds: existingIds,
      existingPassages,
      defaultSectionName: options.defaultSectionName,
      checkIntraBatchDuplicates: false,
    });
  }

  /**
   * Validates raw input and imports to section only if 100% valid with 0 errors.
   * If any error exists, database operations are completely prevented (Talab 7).
   */
  static async validateAndImportToSection(
    sectionId: string,
    rawContent: string,
    format: 'auto' | 'json' | 'csv' = 'auto',
    options: {
      defaultLevel?: string;
      existingQuestions?: Array<{ question_text?: string }>;
      actor?: ImportActor;
      sourceFormat?: string | null;
    } = {},
  ): Promise<{ insertedCount: number; batchId?: string }> {
    const result = this.parseAndValidate(rawContent, format, options);
    if (!result.isValid || result.errorCount > 0) {
      throw new Error(
        `Faylda ${result.errorCount} ta validatsiya xatoligi mavjud. Noto'g'ri fayl ma'lumotlar bazasiga saqlanmaydi.`,
      );
    }
    const validQuestions = result.items
      .filter((i) => i.validated !== null)
      .map((i) => i.validated!);

    return this.importQuestionsToSection(sectionId, validQuestions, {
      actor: options.actor,
      sourceFormat: options.sourceFormat || format,
    });
  }

  private static async getSectionExamId(sectionId: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('exam_sections')
        .select('exam_id')
        .eq('id', sectionId)
        .single();
      return data?.exam_id || null;
    } catch {
      return null;
    }
  }

  /**
   * Task 17 + Task 19 — draft-only import guard.
   *
   * Bulk import must never publish content. If the parent exam is not already
   * a draft it is demoted using only legal workflow edges (Task 19):
   *   review    -> draft
   *   archived  -> draft
   *   published -> archived -> draft
   * Anything else (e.g. `approved`) is rejected — the caller must archive /
   * review the exam first. Every hop is audited by ExamWorkflowService.
   */
  private static async enforceDraftExamState(
    examId: string | null | undefined,
    actor?: ImportActor,
  ): Promise<void> {
    if (!examId) return;

    const { data, error } = await supabase
      .from('exams')
      .select('id, status')
      .eq('id', examId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Imtihon holatini tekshirishda xatolik: ${sanitizeErrorMessage(error.message)}`,
      );
    }
    if (!data) return;

    const status = ((data as any).status || 'draft') as string;
    if (status === 'draft') return;

    const email = actor?.email || undefined;
    const role = actor?.role || null;

    if (status === 'review') {
      await ExamWorkflowService.transitionExamStatus(
        examId,
        'draft',
        email,
        'Import: kontent o‘zgartirildi, qayta review talab qilinadi.',
        role,
      );
      return;
    }

    if (status === 'archived') {
      await ExamWorkflowService.transitionExamStatus(examId, 'draft', email, undefined, role);
      return;
    }

    if (status === 'published') {
      await ExamWorkflowService.transitionExamStatus(examId, 'archived', email, undefined, role);
      await ExamWorkflowService.transitionExamStatus(examId, 'draft', email, undefined, role);
      return;
    }

    throw new Error(
      `"${status}" holatidagi imtihonga import qilish taqiqlangan. ` +
        'Imtihonni avval arxivlang (published → archived → draft) yoki draft holatiga qaytaring.',
    );
  }

  /**
   * Low-level insert shared by section, full-exam and existing-exam imports.
   * It does not create audit batches, so callers can group several sections
   * under one batch. Questions are always created as `draft`.
   */
  private static async insertQuestionsToSection(
    sectionId: string,
    questions: ValidatedQuestion[],
  ): Promise<{
    insertedCount: number;
    questionIds: string[];
    insertedRows: Array<Record<string, any>>;
  }> {
    // Get current order index
    const { data: existing } = await supabase
      .from('exam_questions')
      .select('order_index')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: false })
      .limit(1);

    const baseOrder = existing && existing.length > 0 ? (existing[0].order_index || 0) + 1 : 0;

    const rows = questions.map((q, idx) => ({
      section_id: sectionId,
      question_text: q.question_text,
      type: q.type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      order_index: baseOrder + idx,
      // Task 17: imported questions are always drafts — publishing happens
      // only through the review workflow.
      status: 'draft' as const,
      source_name: q.source_name || null,
      source_url: q.source_url || null,
      author: q.author || null,
      license_type: q.license_type || 'original',
      copyright_confirmed: q.copyright_confirmed || false,
      is_official_jlpt: q.is_official_jlpt || false,
      question_type: q.question_type,
      question_payload: q.question_payload || {},
    }));

    const { data, error } = await supabase.from('exam_questions').insert(rows).select('*');
    if (error) {
      throw new Error(`Savollarni saqlashda xatolik: ${sanitizeErrorMessage(error.message)}`);
    }

    const insertedRows = (data || []) as Array<Record<string, any>>;
    return {
      insertedCount: insertedRows.length || rows.length,
      questionIds: insertedRows.map((row) => String(row.id)).filter(Boolean),
      insertedRows: insertedRows.length ? insertedRows : rows,
    };
  }

  /**
   * Executes database transaction to save validated questions into a specific
   * section. A dedicated import batch is created and a version snapshot is
   * recorded for every successful operation.
   *
   * Task 17: the import is always draft-only — the parent exam is demoted to
   * `draft` and the new questions are stored with `status = 'draft'`.
   */
  static async importQuestionsToSection(
    sectionId: string,
    questions: ValidatedQuestion[],
    context: ImportContext = {},
  ): Promise<{ insertedCount: number; batchId?: string; questionIds?: string[] }> {
    if (!questions || !questions.length) {
      throw new Error(
        "Saqlash uchun yaroqli savollar topilmadi. Noto'g'ri ma'lumot bazaga saqlanmaydi.",
      );
    }

    const actor = context.actor || (await ExamImportHistoryService.getCurrentActor());
    const batchId =
      context.batchId ||
      (await ExamImportHistoryService.createImportBatch({
        sectionId,
        mode: 'section',
        sourceFormat: context.sourceFormat || null,
        actor,
      }));

    try {
      const examId = await this.getSectionExamId(sectionId);
      await this.enforceDraftExamState(examId, actor);

      const res = await this.insertQuestionsToSection(sectionId, questions);

      await ExamImportHistoryService.appendBatchItems(
        batchId,
        res.insertedRows.map((row) => ({
          questionId: row.id ? String(row.id) : null,
          sectionId,
          snapshot: row,
        })),
      );

      await ExamImportHistoryService.finalizeBatch(batchId, {
        examId,
        sectionId,
        questionIds: res.questionIds,
        metadata: { source_format: context.sourceFormat || null },
      });

      if (examId) {
        try {
          await ExamImportHistoryService.createVersionSnapshot(examId, {
            batchId,
            label: `Section import (${res.insertedCount} savol)`,
            actor,
          });
        } catch (snapshotErr) {
          console.warn('Import version snapshot failed:', snapshotErr);
        }
      }

      return {
        insertedCount: res.insertedCount,
        batchId,
        questionIds: res.questionIds,
      };
    } catch (err: any) {
      await ExamImportHistoryService.failBatch(
        batchId,
        sanitizeErrorMessage(err?.message || 'Import xatoligi'),
        { section_id: sectionId },
      );
      throw err;
    }
  }

  /**
   * Creates a full new exam along with auto-generated sections and saves all questions.
   * Task 17: the created exam is ALWAYS a draft (status = 'draft',
   * is_published = false). Publishing is only possible through the
   * review -> approved -> published workflow.
   */
  static async importFullExamWithSections(
    payload: {
      title: string;
      level: JlptLevel;
      description?: string;
      questions: ValidatedQuestion[];
      sourceName?: string;
      sourceUrl?: string;
      author?: string;
      licenseType?: ExamLicenseType;
      copyrightConfirmed?: boolean;
      isOfficialJlpt?: boolean;
    },
    context: ImportContext = {},
  ): Promise<{
    examId: string;
    totalInserted: number;
    batchId?: string;
    questionIds?: string[];
  }> {
    const fullType = `JLPT ${payload.level}`;
    const actor = context.actor || (await ExamImportHistoryService.getCurrentActor());
    const batchId =
      context.batchId ||
      (await ExamImportHistoryService.createImportBatch({
        mode: 'full-exam',
        sourceFormat: context.sourceFormat || null,
        actor,
        metadata: { created_exam: true, title: payload.title },
      }));

    let examId = '';
    let totalInserted = 0;
    const questionIds: string[] = [];
    const batchItems: Array<{
      questionId: string | null;
      sectionId: string | null;
      snapshot: Record<string, any>;
    }> = [];

    try {
      // 1. Create Exam — always a draft (Task 17: import never publishes)
      const { data: examData, error: examErr } = await supabase
        .from('exams')
        .insert({
          title: payload.title,
          type: fullType,
          description:
            payload.description || `Ommaviy import orqali yuklangan ${fullType} mock imtihoni.`,
          status: 'draft',
          is_published: false,
          source_name: payload.sourceName || null,
          source_url: payload.sourceUrl || null,
          author: payload.author || null,
          license_type: payload.licenseType || 'original',
          copyright_confirmed: payload.copyrightConfirmed ?? false,
          is_official_jlpt: payload.isOfficialJlpt ?? false,
        })
        .select()
        .single();

      if (examErr || !examData) {
        throw new Error(
          `Imtihon yaratishda xatolik: ${sanitizeErrorMessage(examErr?.message || '')}`,
        );
      }

      examId = examData.id;

      // 2. Group questions by section_name
      const sectionMap = new Map<string, ValidatedQuestion[]>();
      for (const q of payload.questions) {
        const sName = q.section_name || "Asosiy Bo'lim";
        if (!sectionMap.has(sName)) {
          sectionMap.set(sName, []);
        }
        sectionMap.get(sName)!.push(q);
      }

      let secOrder = 0;

      // 3. Create Sections and insert questions
      for (const [secTitle, secQuestions] of sectionMap.entries()) {
        const secType = secQuestions[0]?.section_type || 'reading';
        // Har bir bo'lim uchun bir xil passage bo'lsa — uni section content sifatida saqlaymiz
        const passages = secQuestions.map((q) => q.passage).filter(Boolean) as string[];
        const uniquePassages = Array.from(new Set(passages));
        const sharedPassage = uniquePassages.length === 1 ? uniquePassages[0] : null;

        const { data: secData, error: secErr } = await supabase
          .from('exam_sections')
          .insert({
            exam_id: examId,
            title: secTitle,
            type: secType,
            content: sharedPassage,
            order_index: secOrder++,
          })
          .select()
          .single();

        if (secErr || !secData) {
          console.error(`Error creating section ${secTitle}:`, secErr);
          continue;
        }

        const res = await this.insertQuestionsToSection(secData.id, secQuestions);
        totalInserted += res.insertedCount;
        questionIds.push(...res.questionIds);
        res.insertedRows.forEach((row) => {
          batchItems.push({
            questionId: row.id ? String(row.id) : null,
            sectionId: secData.id,
            snapshot: row,
          });
        });
      }

      await ExamImportHistoryService.appendBatchItems(batchId, batchItems);
      await ExamImportHistoryService.finalizeBatch(batchId, {
        examId,
        questionIds,
        metadata: { created_exam: true, title: payload.title },
      });

      try {
        await ExamImportHistoryService.createVersionSnapshot(examId, {
          batchId,
          label: `To'liq imtihon importi (${totalInserted} savol)`,
          actor,
        });
      } catch (snapshotErr) {
        console.warn('Import version snapshot failed:', snapshotErr);
      }

      return { examId, totalInserted, batchId, questionIds };
    } catch (err: any) {
      await ExamImportHistoryService.failBatch(
        batchId,
        sanitizeErrorMessage(err?.message || 'Import xatoligi'),
        {
          created_exam: Boolean(examId),
          exam_id: examId || null,
          question_ids: questionIds,
        },
      );
      throw err;
    }
  }

  /**
   * Imports questions into an existing exam, matching existing sections or creating new ones.
   *
   * Task 17: draft-only. The exam is demoted back to `draft`
   * (is_published = false) because its content changed and it has to go
   * through the review workflow again before it can be published.
   */
  static async importQuestionsToExistingExam(
    examId: string,
    questions: ValidatedQuestion[],
    context: ImportContext = {},
  ): Promise<{
    examId: string;
    totalInserted: number;
    batchId?: string;
    questionIds?: string[];
  }> {
    const actor = context.actor || (await ExamImportHistoryService.getCurrentActor());
    const batchId =
      context.batchId ||
      (await ExamImportHistoryService.createImportBatch({
        examId,
        mode: 'existing-exam',
        sourceFormat: context.sourceFormat || null,
        actor,
        metadata: { created_exam: false },
      }));

    let totalInserted = 0;
    const questionIds: string[] = [];
    const batchItems: Array<{
      questionId: string | null;
      sectionId: string | null;
      snapshot: Record<string, any>;
    }> = [];

    try {
      // Task 17 + 19: legally demote the exam to draft — import never publishes.
      await this.enforceDraftExamState(examId, actor);

      // 1. Fetch existing sections of this exam
      const { data: existingSections, error: secFetchErr } = await supabase
        .from('exam_sections')
        .select('id, title, type, order_index')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (secFetchErr) {
        throw new Error(
          `Mavjud bo'limlarni olishda xatolik: ${sanitizeErrorMessage(secFetchErr.message)}`,
        );
      }

      const sectionTitleToId = new Map<string, string>();
      (existingSections || []).forEach((s) => {
        sectionTitleToId.set(s.title.trim().toLowerCase(), s.id);
      });

      let nextOrder = (existingSections || []).length;

      // 2. Group incoming questions by section_name
      const sectionMap = new Map<string, ValidatedQuestion[]>();
      for (const q of questions) {
        const sName = q.section_name?.trim() || "Asosiy Bo'lim";
        if (!sectionMap.has(sName)) {
          sectionMap.set(sName, []);
        }
        sectionMap.get(sName)!.push(q);
      }

      for (const [secTitle, secQuestions] of sectionMap.entries()) {
        let targetSectionId = sectionTitleToId.get(secTitle.toLowerCase());

        if (!targetSectionId) {
          // Create new section
          const secType = secQuestions[0]?.section_type || 'reading';
          const passages = secQuestions.map((q) => q.passage).filter(Boolean) as string[];
          const uniquePassages = Array.from(new Set(passages));
          const sharedPassage = uniquePassages.length === 1 ? uniquePassages[0] : null;
          const { data: newSec, error: newSecErr } = await supabase
            .from('exam_sections')
            .insert({
              exam_id: examId,
              title: secTitle,
              type: secType,
              content: sharedPassage,
              order_index: nextOrder++,
            })
            .select()
            .single();

          if (newSecErr || !newSec || !newSec.id) {
            console.error(`Error creating section ${secTitle}:`, newSecErr);
            continue;
          }

          const createdId: string = newSec.id;
          targetSectionId = createdId;
          sectionTitleToId.set(secTitle.toLowerCase(), createdId);
        }

        if (!targetSectionId) continue;

        const res = await this.insertQuestionsToSection(targetSectionId, secQuestions);
        totalInserted += res.insertedCount;
        questionIds.push(...res.questionIds);
        res.insertedRows.forEach((row) => {
          batchItems.push({
            questionId: row.id ? String(row.id) : null,
            sectionId: targetSectionId,
            snapshot: row,
          });
        });
      }

      await ExamImportHistoryService.appendBatchItems(batchId, batchItems);
      await ExamImportHistoryService.finalizeBatch(batchId, {
        examId,
        questionIds,
        metadata: { created_exam: false },
      });

      try {
        await ExamImportHistoryService.createVersionSnapshot(examId, {
          batchId,
          label: `Mavjud imtihonga import (${totalInserted} savol)`,
          actor,
        });
      } catch (snapshotErr) {
        console.warn('Import version snapshot failed:', snapshotErr);
      }

      return { examId, totalInserted, batchId, questionIds };
    } catch (err: any) {
      await ExamImportHistoryService.failBatch(
        batchId,
        sanitizeErrorMessage(err?.message || 'Import xatoligi'),
        { created_exam: false, exam_id: examId, question_ids: questionIds },
      );
      throw err;
    }
  }
}
