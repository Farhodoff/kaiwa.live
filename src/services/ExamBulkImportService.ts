import { supabase } from '../lib/supabase';
import { sanitizeErrorMessage } from '../components/ErrorBoundary';

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type ValidExamSection = 'knowledge' | 'reading' | 'listening';

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
  explanation?: string;
  passage?: string;
  reading_passage?: string;
  text?: string;
  content?: string;
  level?: string;
  section?: string;
  section_name?: string;
  section_type?: 'reading' | 'listening' | 'knowledge' | string;
}

export interface ValidatedQuestion {
  id?: string | number;
  question_text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  correct_index: number;
  explanation: string | null;
  passage?: string | null;
  level: JlptLevel | null;
  section_name: string;
  section_type: string;
}

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface QuestionValidationItem {
  row: number;
  raw: RawImportQuestion;
  validated: ValidatedQuestion | null;
  status: 'valid' | 'warning' | 'error';
  issues: ValidationIssue[];
  isDuplicate: boolean;
}

export interface BulkValidationResult {
  isValid: boolean;
  totalCount: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
  duplicateCount: number;
  items: QuestionValidationItem[];
  detectedSections: string[];
}

export interface FullExamImportPayload {
  title: string;
  type: string;
  description?: string;
  level?: JlptLevel;
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
   * 4. Deduplication: detects duplicates inside the batch and against existing questions.
   */
  static validateQuestions(
    rawQuestions: RawImportQuestion[],
    options: {
      expectedLevel?: string;
      existingQuestionTexts?: string[];
      defaultSectionName?: string;
      checkIntraBatchDuplicates?: boolean;
    } = {},
  ): BulkValidationResult {
    const items: QuestionValidationItem[] = [];
    const seenTextsInBatch = new Set<string>();
    const seenIdsInBatch = new Set<string>();
    const existingTexts = new Set(
      (options.existingQuestionTexts || []).map((t) => this.normalizeText(t)),
    );

    const detectedSections = new Set<string>();
    const validLevels = new Set(['N5', 'N4', 'N3', 'N2', 'N1']);
    const expectedNormalizedLevel = options.expectedLevel
      ? options.expectedLevel.toUpperCase().replace(/[^N1-5]/g, '')
      : null;

    rawQuestions.forEach((raw, idx) => {
      const rowNumber = idx + 1;
      const issues: ValidationIssue[] = [];

      // 0. Duplicate ID Check (Talab 5)
      if (raw.id !== undefined && raw.id !== null && String(raw.id).trim() !== '') {
        const idStr = String(raw.id).trim();
        if (seenIdsInBatch.has(idStr)) {
          issues.push({
            row: rowNumber,
            field: 'id',
            message: `Duplicate ID aniqlandi: "${idStr}" identifikatori fayl ichida bir necha bor ishlatilgan.`,
            severity: 'error',
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
        });
      }

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

      if (hasEmptyOption) {
        issues.push({
          row: rowNumber,
          field: 'options',
          message: "Bo'sh variant aniqlandi: barcha variantlar to'ldirilgan bo'lishi shart.",
          severity: 'error',
        });
      }

      const qType: 'multiple_choice' | 'true_false' | 'short_answer' =
        raw.type === 'true_false' || raw.type === 'short_answer' ? raw.type : 'multiple_choice';

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

      if (!rawAnswer && rawIndex === '') {
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

      // 5. Section Validation (Talab 3: faqat knowledge, reading yoki listening bo'lishi)
      const rawSec =
        raw.section || raw.section_name || raw.section_type || options.defaultSectionName;
      const secStr = rawSec !== undefined && rawSec !== null ? String(rawSec).trim() : '';
      let normalizedSectionType: ValidExamSection | null = null;

      if (!secStr) {
        issues.push({
          row: rowNumber,
          field: 'section',
          message:
            'Majburiy maydon: section (knowledge, reading yoki listening) kiritilishi shart.',
          severity: 'error',
        });
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
        }
      }

      // 6. Deduplication Check (savol matni bo'yicha)
      let isDuplicate = false;
      const normalizedQ = this.normalizeText(questionText);
      if (normalizedQ) {
        const checkIntra = options.checkIntraBatchDuplicates !== false;
        if (checkIntra && seenTextsInBatch.has(normalizedQ)) {
          isDuplicate = true;
          issues.push({
            row: rowNumber,
            field: 'question_text',
            message: 'Takroriy savol: fayl ichida aynan shu savol avvalroq uchragan.',
            severity: 'warning',
          });
        } else if (existingTexts.has(normalizedQ)) {
          isDuplicate = true;
          issues.push({
            row: rowNumber,
            field: 'question_text',
            message: 'Takroriy savol: ushbu savol tizim bazasida allaqachon mavjud.',
            severity: 'warning',
          });
        }
        seenTextsInBatch.add(normalizedQ);
      }

      const hasErrors = issues.some((i) => i.severity === 'error');
      const hasWarnings = issues.some((i) => i.severity === 'warning');
      const status: 'valid' | 'warning' | 'error' = hasErrors
        ? 'error'
        : hasWarnings
          ? 'warning'
          : 'valid';

      const validated: ValidatedQuestion | null = hasErrors
        ? null
        : {
            id: raw.id,
            question_text: questionText,
            type: qType,
            options: optionsList,
            correct_answer: resolvedAnswer,
            correct_index: resolvedIndex,
            explanation: raw.explanation?.trim() || null,
            passage:
              [raw.passage, raw.reading_passage, raw.text, raw.content]
                .map((v) => (v !== undefined && v !== null ? String(v).trim() : ''))
                .find((v) => v.length > 0) || null,
            level: questionLevel,
            section_name: normalizedSectionType || secStr || 'knowledge',
            section_type: normalizedSectionType || 'knowledge',
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

      items.push({
        row: rowNumber,
        raw,
        validated,
        status,
        issues,
        isDuplicate,
      });
    });

    const errorCount = items.filter((i) => i.status === 'error').length;
    const warningCount = items.filter((i) => i.status === 'warning').length;
    const duplicateCount = items.filter((i) => i.isDuplicate).length;
    const validCount = items.filter((i) => i.validated !== null).length;

    return {
      isValid: errorCount === 0 && validCount > 0,
      totalCount: items.length,
      validCount,
      errorCount,
      warningCount,
      duplicateCount,
      items,
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
      existingQuestions?: Array<{ question_text?: string }>;
      checkIntraBatchDuplicates?: boolean;
    } = {},
  ): BulkValidationResult {
    const trimmed = rawText.trim();
    if (!trimmed) {
      return {
        isValid: false,
        totalCount: 0,
        validCount: 0,
        errorCount: 0,
        warningCount: 0,
        duplicateCount: 0,
        items: [],
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
        return {
          isValid: false,
          totalCount: 1,
          validCount: 0,
          errorCount: 1,
          warningCount: 0,
          duplicateCount: 0,
          items: [
            {
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
                },
              ],
              isDuplicate: false,
            },
          ],
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
            r.correct_answer ||
            r["To'g'ri javob"] ||
            r['Correct'] ||
            '',
          correct_answer:
            r.correct_answer || r.correctAnswer || r["To'g'ri javob"] || r['Correct'] || '',
          correct_index: r.correct_index,
          explanation: r.explanation || r['Izoh'] || '',
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
        }));
      } catch (err: any) {
        return {
          isValid: false,
          totalCount: 1,
          validCount: 0,
          errorCount: 1,
          warningCount: 0,
          duplicateCount: 0,
          items: [
            {
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
                },
              ],
              isDuplicate: false,
            },
          ],
          detectedSections: [],
        };
      }
    }

    const existingTexts = (options.existingQuestions || [])
      .map((q) => q.question_text || '')
      .filter(Boolean);

    return this.validateQuestions(rawItems, {
      expectedLevel: options.defaultLevel,
      existingQuestionTexts: existingTexts,
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
   * Generates a sample CSV template for admins to download.
   */
  static generateSampleCsvTemplate(): string {
    return `id,section,question,passage,option_a,option_b,option_c,option_d,correctAnswer,explanation,level
q1,knowledge,彼女はいつも（　）な服を着ている。,,派手,地味,清潔,親切,派手,"派手 (hade) - yorqin, dabdabali libos ma'nosida ishlatiladi.",N3
q2,knowledge,会議の時間を（　）してください。,,確認,約束,準備,相談,確認,"確認 (kakunin) - tasdiqlash, tekshirib ko'rish.",N3
q3,reading,筆者が一番言いたいことは何か。,"科学技術の進歩は生活を便利にした。しかし同時に倫理観の見直しも求められている。",健康が第一だ,時間を大切にする,友達を増やす,勉強を続ける,健康が第一だ,Matnning 3-xatboshisida salomatlik asosiy boylik ekani aytilgan.,N3
q4,listening,男の人はこの後まず何をしますか。,,資料をコピーする,部長に電話する,会議室を予約する,お茶を入れる,資料をコピーする,Avval nusxa olish kerakligi ta'kidlandi.,N3`;
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
        level: 'N3',
      },
      {
        id: 'q2',
        section: 'reading',
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
        level: 'N3',
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
      existingQuestions?: Array<{ question_text?: string }>;
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
        passage: v.passage || '',
        level: v.level || raw.level || options.expectedLevel || '',
        section: v.section_type,
        section_name: v.section_name,
        section_type: v.section_type,
      };
    });
    const existingTexts = (options.existingQuestions || [])
      .map((q) => q.question_text || '')
      .filter(Boolean);
    return this.validateQuestions(rawItems, {
      expectedLevel: options.expectedLevel,
      existingQuestionTexts: existingTexts,
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
    } = {},
  ): Promise<{ insertedCount: number }> {
    const result = this.parseAndValidate(rawContent, format, options);
    if (!result.isValid || result.errorCount > 0) {
      throw new Error(
        `Faylda ${result.errorCount} ta validatsiya xatoligi mavjud. Noto'g'ri fayl ma'lumotlar bazasiga saqlanmaydi.`,
      );
    }
    const validQuestions = result.items
      .filter((i) => i.validated !== null)
      .map((i) => i.validated!);

    return this.importQuestionsToSection(sectionId, validQuestions);
  }

  /**
   * Executes database transaction to save validated questions into a specific section.
   */
  static async importQuestionsToSection(
    sectionId: string,
    questions: ValidatedQuestion[],
    isPublished?: boolean,
  ): Promise<{ insertedCount: number }> {
    if (!questions || !questions.length) {
      throw new Error(
        "Saqlash uchun yaroqli savollar topilmadi. Noto'g'ri ma'lumot bazaga saqlanmaydi.",
      );
    }

    // Optional: update parent exam's published status if requested
    if (isPublished !== undefined) {
      try {
        const { data: sec } = await supabase
          .from('exam_sections')
          .select('exam_id')
          .eq('id', sectionId)
          .single();
        if (sec?.exam_id) {
          await supabase.from('exams').update({ is_published: isPublished }).eq('id', sec.exam_id);
        }
      } catch (pubErr) {
        console.warn('Failed to update exam publication status:', pubErr);
      }
    }

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
    }));

    const { error } = await supabase.from('exam_questions').insert(rows);
    if (error) {
      throw new Error(`Savollarni saqlashda xatolik: ${sanitizeErrorMessage(error.message)}`);
    }

    return { insertedCount: rows.length };
  }

  /**
   * Creates a full new exam along with auto-generated sections and saves all questions.
   * `isPublished=false` bo'lsa draft sifatida saqlanadi (publishdan oldingi preview bosqichi).
   */
  static async importFullExamWithSections(payload: {
    title: string;
    level: JlptLevel;
    description?: string;
    questions: ValidatedQuestion[];
    isPublished?: boolean;
  }): Promise<{ examId: string; totalInserted: number }> {
    const fullType = `JLPT ${payload.level}`;

    // 1. Create Exam (draft yoki published)
    const { data: examData, error: examErr } = await supabase
      .from('exams')
      .insert({
        title: payload.title,
        type: fullType,
        description:
          payload.description || `Ommaviy import orqali yuklangan ${fullType} mock imtihoni.`,
        is_published: payload.isPublished ?? false,
      })
      .select()
      .single();

    if (examErr || !examData) {
      throw new Error(
        `Imtihon yaratishda xatolik: ${sanitizeErrorMessage(examErr?.message || '')}`,
      );
    }

    const examId = examData.id;

    // 2. Group questions by section_name
    const sectionMap = new Map<string, ValidatedQuestion[]>();
    for (const q of payload.questions) {
      const sName = q.section_name || "Asosiy Bo'lim";
      if (!sectionMap.has(sName)) {
        sectionMap.set(sName, []);
      }
      sectionMap.get(sName)!.push(q);
    }

    let totalInserted = 0;
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

      const res = await this.importQuestionsToSection(secData.id, secQuestions);
      totalInserted += res.insertedCount;
    }

    return { examId, totalInserted };
  }

  /**
   * Imports questions into an existing exam, matching existing sections or creating new ones.
   */
  static async importQuestionsToExistingExam(
    examId: string,
    questions: ValidatedQuestion[],
    isPublished?: boolean,
  ): Promise<{ examId: string; totalInserted: number }> {
    if (isPublished !== undefined) {
      try {
        await supabase.from('exams').update({ is_published: isPublished }).eq('id', examId);
      } catch (pubErr) {
        console.warn('Failed to update existing exam publication status:', pubErr);
      }
    }

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

    let totalInserted = 0;

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

      const res = await this.importQuestionsToSection(targetSectionId, secQuestions);
      totalInserted += res.insertedCount;
    }

    return { examId, totalInserted };
  }
}
