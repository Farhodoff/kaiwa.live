import { callAI } from '../utils/ai/aiCore';
import type { JlptLevel, ValidExamSection, RawImportQuestion } from './ExamBulkImportService';
import {
  extractPdfText,
  readFileAsArrayBuffer,
  validatePdfFile,
  type PdfTextExtractor,
} from './ExamPdfImportService';

export interface ExtractedAiQuestion extends RawImportQuestion {
  id: string;
  question_text: string;
  passage?: string | null;
  options: string[];
  correct_answer: string;
  correct_index: number;
  explanation: string;
  level: JlptLevel;
  section_type: ValidExamSection;
  section_name: string;
  question_type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  is_published: false;
}

export interface AiExtractionResult {
  questions: ExtractedAiQuestion[];
  recommendedLevel: JlptLevel;
  recommendedSection: ValidExamSection;
  recommendedTitle?: string;
  summary: string;
  isDraft: true;
}

export interface AiExtractionOptions {
  text?: string;
  file?: File;
  customInstruction?: string;
  defaultLevel?: JlptLevel;
  defaultSection?: ValidExamSection;
  pdfExtractor?: PdfTextExtractor;
}

const VALID_LEVELS: Set<string> = new Set(['N1', 'N2', 'N3', 'N4', 'N5']);
const VALID_SECTIONS: Set<string> = new Set(['knowledge', 'reading', 'listening']);
const VALID_DIFFICULTIES: Set<string> = new Set(['easy', 'medium', 'hard']);

/**
 * Normalizes string to a valid JLPT level or falls back to default.
 */
export function normalizeAiLevel(level?: string | null, fallback: JlptLevel = 'N3'): JlptLevel {
  if (!level) return fallback;
  const upper = level.trim().toUpperCase();
  if (VALID_LEVELS.has(upper)) return upper as JlptLevel;
  return fallback;
}

/**
 * Normalizes string to a valid exam section.
 */
export function normalizeAiSection(
  section?: string | null,
  fallback: ValidExamSection = 'knowledge',
): ValidExamSection {
  if (!section) return fallback;
  const lower = section.trim().toLowerCase();
  if (VALID_SECTIONS.has(lower)) return lower as ValidExamSection;
  if (/reading|dokkai|o'qish|読解/i.test(lower)) return 'reading';
  if (/listening|choukai|eshitish|聴解/i.test(lower)) return 'listening';
  return fallback;
}

/**
 * Normalizes difficulty to 'easy' | 'medium' | 'hard'.
 */
export function normalizeAiDifficulty(diff?: string | null): 'easy' | 'medium' | 'hard' {
  if (!diff) return 'medium';
  const lower = diff.trim().toLowerCase();
  if (VALID_DIFFICULTIES.has(lower)) return lower as 'easy' | 'medium' | 'hard';
  if (/1|2|easy|oson|oddiy/i.test(lower)) return 'easy';
  if (/4|5|hard|qiyin|og'ir/i.test(lower)) return 'hard';
  return 'medium';
}

/**
 * Extracts raw plain text from File (PDF, TXT, CSV, JSON).
 */
export async function extractTextFromFile(
  file: File,
  pdfExtractor: PdfTextExtractor = extractPdfText,
): Promise<string> {
  if (!file) {
    throw new Error('Fayl tanlanmagan.');
  }

  const name = (file.name || '').toLowerCase();
  const isPdf = name.endsWith('.pdf') || file.type === 'application/pdf';

  if (isPdf) {
    const val = validatePdfFile(file);
    if (!val.valid) {
      throw new Error(val.error || 'Yaroqsiz PDF fayl.');
    }
    const buffer = await readFileAsArrayBuffer(file);
    const { text } = await pdfExtractor(buffer);
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error(
        'PDF fayldan matn o‘qib bo‘lmadi (skan qilingan yoki rasm shaklidagi PDF bo‘lishi mumkin).',
      );
    }
    return trimmed;
  }

  // Handle TXT, JSON, CSV or other text files
  if (typeof file.text === 'function') {
    const content = await file.text();
    return content.trim();
  }

  // Fallback for environments without Blob.prototype.text
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(new Error('Fayl matnini o‘qishda xatolik yuz berdi.'));
    reader.readAsText(file);
  });
}

/**
 * Cleans markdown code blocks (```json ... ```) from AI response text.
 */
export function cleanJsonFences(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
  }
  return cleaned.trim();
}

/**
 * Service to parse, recommend, and extract JLPT exam questions using AI.
 */
export const ExamAiExtractorService = {
  /**
   * Main AI question extraction method.
   */
  async extractQuestions(options: AiExtractionOptions): Promise<AiExtractionResult> {
    let sourceText = options.text?.trim() || '';

    if (options.file) {
      const fileText = await extractTextFromFile(options.file, options.pdfExtractor);
      sourceText = fileText;
    }

    if (!sourceText || sourceText.length < 15) {
      throw new Error(
        'Tahlil qilish uchun matn juda qisqa yoki bo‘sh. Iltimos, kamida bitta to‘liq savol matnini kiriting.',
      );
    }

    const defaultLevel = options.defaultLevel || 'N3';
    const defaultSection = options.defaultSection || 'knowledge';

    const systemPrompt = `You are an expert Japanese Language Proficiency Test (JLPT) examination parser, question curator, and level evaluator.
Your mission is to read raw, unstructured, or semi-structured exam texts (from PDFs, TXT, or pasted notes) and automatically extract all exam questions into a strictly compliant JSON schema.

RULES & EXTRACTION REQUIREMENTS:
1. Extract ALL questions found in the text.
2. For each question, extract:
   - "question_text": The clear question statement in Japanese (or English/Uzbek where applicable).
   - "passage": If there is a reading passage, reading text (dokkai text), or context dialogue, extract it in full; otherwise set to null.
   - "options": An array of at least 2 and usually 4 options (strings). Clean out bullet letters or numbers like "(1)", "A)", "1." so options contain only the option content.
   - "correct_answer": The exact text of the correct option (or letter A/B/C/D). If not explicitly stated in the source text, deduce the correct answer accurately.
   - "correct_index": 0-based integer index (0, 1, 2, 3) pointing to the correct option inside "options".
   - "explanation": A clear, helpful pedagogical explanation in Uzbek (or Japanese) explaining why this option is correct and why other options are incorrect.
3. RECOMMENDATIONS & CLASSIFICATION:
   - "level": Accurately classify the JLPT level ("N1", "N2", "N3", "N4", "N5") based on kanji, grammar patterns, vocabulary, and sentence structures. Default to "${defaultLevel}" if mixed or borderline.
   - "section_type": Classify into "knowledge" (Moji/Goi/Bunpou), "reading" (Dokkai), or "listening" (Choukai). Default to "${defaultSection}".
   - "question_type": Categorize as "multiple_choice", "reading_comprehension", "grammar", "vocabulary", or "listening".
   - "difficulty": Recommend difficulty as "easy", "medium", or "hard".
4. DRAFT & PUBLISH ENFORCEMENT:
   - All questions are strictly DRAFT and MUST NEVER be marked published. Set "is_published": false.
5. JSON STRUCTURE:
   Return ONLY a valid, parseable JSON object with the following schema:
   {
     "recommendedTitle": "<Suggested exam title in Uzbek or Japanese>",
     "recommendedLevel": "N1" | "N2" | "N3" | "N4" | "N5",
     "recommendedSection": "knowledge" | "reading" | "listening",
     "summary": "<Short 1-2 sentence overview in Uzbek of extracted questions>",
     "questions": [
       {
         "id": "ai-1",
         "question_text": "...",
         "passage": null,
         "options": ["...", "...", "...", "..."],
         "correct_answer": "...",
         "correct_index": 0,
         "explanation": "...",
         "level": "N3",
         "section_type": "knowledge",
         "section_name": "Gengo Chishiki",
         "question_type": "vocabulary",
         "difficulty": "medium",
         "is_published": false
       }
     ]
   }
DO NOT wrap with extra markdown explanations. Return raw JSON.`;

    const userPrompt = `Iltimos, quyidagi imtihon matnidan barcha savollarni ajratib, JSON formatida taqdim eting:

${options.customInstruction ? `Qo‘shimcha ko‘rsatma:\n${options.customInstruction}\n\n` : ''}IMTIHON MATNI:
${sourceText}`;

    let aiRawResponse: string;
    try {
      aiRawResponse = await callAI(userPrompt, systemPrompt, true, {
        skipCache: true, // Always fresh when extracting or retrying
      });
    } catch (err: any) {
      console.error('[ExamAiExtractorService] AI call error:', err);
      throw new Error(
        `AI xizmatiga ulanishda xatolik yuz berdi: ${err?.message || 'Tarmoq xatosi yoki so‘rov rad etildi'}. Iltimos, qayta urinib ko‘ring.`,
      );
    }

    if (!aiRawResponse || !aiRawResponse.trim()) {
      throw new Error('AI provayderi bo‘sh javob qaytardi. Iltimos, qayta urinib ko‘ring.');
    }

    let parsedPayload: any;
    try {
      const cleaned = cleanJsonFences(aiRawResponse);
      parsedPayload = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error(
        '[ExamAiExtractorService] JSON parse error on AI response:',
        parseErr,
        aiRawResponse,
      );
      throw new Error(
        'AI javobini JSON formatida o‘qib bo‘lmadi. Matn formati murakkab bo‘lishi mumkin, iltimos "Qayta ishlash" tugmasini bosing.',
      );
    }

    const rawQuestions = Array.isArray(parsedPayload?.questions)
      ? parsedPayload.questions
      : Array.isArray(parsedPayload)
        ? parsedPayload
        : [];

    if (rawQuestions.length === 0) {
      throw new Error(
        'AI kiritilgan matndan bitta ham savol ajrata olmadi. Iltimos, matn tarkibida savol va variantlar borligini tekshiring yoki qayta ishlang.',
      );
    }

    const recLevel = normalizeAiLevel(parsedPayload?.recommendedLevel, defaultLevel);
    const recSection = normalizeAiSection(parsedPayload?.recommendedSection, defaultSection);

    // Normalize and sanitize each extracted question
    const sanitizedQuestions: ExtractedAiQuestion[] = rawQuestions.map((q: any, idx: number) => {
      const questionText = String(q.question_text || q.question || '').trim();
      const rawOptions: any[] = Array.isArray(q.options)
        ? q.options
        : [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);

      const optionsList = rawOptions.map((opt) => String(opt || '').trim()).filter(Boolean);

      let correctIndex = typeof q.correct_index === 'number' ? q.correct_index : -1;
      let correctAnswer = String(q.correct_answer || q.correctAnswer || '').trim();

      // If correctIndex is out of bounds or not provided, try to match correctAnswer string or letter
      if (correctIndex < 0 || correctIndex >= optionsList.length) {
        if (/^[A-D]$/i.test(correctAnswer)) {
          const letterIdx = correctAnswer.toUpperCase().charCodeAt(0) - 65;
          if (letterIdx >= 0 && letterIdx < optionsList.length) {
            correctIndex = letterIdx;
          }
        } else if (/^[1-4]$/.test(correctAnswer)) {
          const numIdx = Number(correctAnswer) - 1;
          if (numIdx >= 0 && numIdx < optionsList.length) {
            correctIndex = numIdx;
          }
        } else if (correctAnswer) {
          const found = optionsList.findIndex((opt) =>
            opt.toLowerCase().includes(correctAnswer.toLowerCase()),
          );
          if (found >= 0) correctIndex = found;
        }
      }

      // Fallback: if still invalid, default to 0 and record warning
      if (correctIndex < 0 || correctIndex >= optionsList.length) {
        correctIndex = 0;
      }

      if (!correctAnswer && optionsList[correctIndex]) {
        correctAnswer = optionsList[correctIndex];
      }

      const qLevel = normalizeAiLevel(q.level, recLevel);
      const qSection = normalizeAiSection(q.section_type || q.section, recSection);
      const qDifficulty = normalizeAiDifficulty(q.difficulty);

      return {
        id: q.id ? String(q.id) : `ai-${idx + 1}`,
        question_text: questionText || `Savol #${idx + 1}`,
        passage: q.passage ? String(q.passage).trim() : null,
        options: optionsList.length >= 2 ? optionsList : ['Variant A', 'Variant B'],
        correct_answer: correctAnswer || optionsList[correctIndex] || '',
        correct_index: correctIndex,
        explanation: q.explanation ? String(q.explanation).trim() : 'AI tomonidan tahlil qilingan.',
        level: qLevel,
        section_type: qSection,
        section_name:
          q.section_name ||
          (qSection === 'knowledge'
            ? 'Gengo Chishiki'
            : qSection === 'reading'
              ? 'Dokkai'
              : 'Choukai'),
        question_type: String(q.question_type || 'multiple_choice'),
        difficulty: qDifficulty,
        is_published: false, // STRICTLY DRAFT
      };
    });

    return {
      questions: sanitizedQuestions,
      recommendedLevel: recLevel,
      recommendedSection: recSection,
      recommendedTitle:
        parsedPayload?.recommendedTitle ||
        `JLPT ${recLevel} Imtihon (AI ajratgan - ${new Date().toLocaleDateString()})`,
      summary:
        parsedPayload?.summary ||
        `AI jami ${sanitizedQuestions.length} ta savolni muvaffaqiyatli ajratdi. Barcha savollar Qoralama (Draft) holatida saqlanadi.`,
      isDraft: true,
    };
  },
};
