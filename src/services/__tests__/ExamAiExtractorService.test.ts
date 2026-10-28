import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ExamAiExtractorService,
  normalizeAiLevel,
  normalizeAiSection,
  normalizeAiDifficulty,
  cleanJsonFences,
  extractTextFromFile,
} from '../ExamAiExtractorService';
import * as aiCore from '../../utils/ai/aiCore';

vi.mock('../../utils/ai/aiCore', () => ({
  callAI: vi.fn(),
}));

describe('ExamAiExtractorService Unit Tests (Task 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Normalization Helpers', () => {
    it('normalizes valid and invalid JLPT levels', () => {
      expect(normalizeAiLevel('n1')).toBe('N1');
      expect(normalizeAiLevel('N5')).toBe('N5');
      expect(normalizeAiLevel('invalid', 'N2')).toBe('N2');
      expect(normalizeAiLevel(undefined, 'N4')).toBe('N4');
    });

    it('normalizes exam sections', () => {
      expect(normalizeAiSection('knowledge')).toBe('knowledge');
      expect(normalizeAiSection('Dokkai')).toBe('reading');
      expect(normalizeAiSection('Choukai')).toBe('listening');
      expect(normalizeAiSection('unknown', 'reading')).toBe('reading');
    });

    it('normalizes difficulty levels', () => {
      expect(normalizeAiDifficulty('easy')).toBe('easy');
      expect(normalizeAiDifficulty('1')).toBe('easy');
      expect(normalizeAiDifficulty('medium')).toBe('medium');
      expect(normalizeAiDifficulty('hard')).toBe('hard');
      expect(normalizeAiDifficulty('5')).toBe('hard');
      expect(normalizeAiDifficulty(null)).toBe('medium');
    });

    it('cleans json markdown fences', () => {
      expect(cleanJsonFences('```json\n{"a": 1}\n```')).toBe('{"a": 1}');
      expect(cleanJsonFences('```\n{"a": 2}\n```')).toBe('{"a": 2}');
      expect(cleanJsonFences('{"a": 3}')).toBe('{"a": 3}');
    });
  });

  describe('2. Text Extraction from Files', () => {
    it('throws error when file is missing', async () => {
      await expect(extractTextFromFile(null as any)).rejects.toThrow('Fayl tanlanmagan.');
    });

    it('reads plain text from a TXT file', async () => {
      const txtFile = new File(['1. 日本語の勉強は楽しい。\nA) はい\nB) いいえ'], 'exam.txt', {
        type: 'text/plain',
      });
      const text = await extractTextFromFile(txtFile);
      expect(text).toContain('日本語の勉強は楽しい');
    });

    it('extracts text from a PDF file using extractor', async () => {
      const pdfFile = new File(['dummy-pdf-content'], 'exam.pdf', { type: 'application/pdf' });
      const mockExtractor = vi.fn().mockResolvedValue({
        text: '1. これは本です。\nA) ほん\nB) ぼん\n正解: A',
        pageCount: 1,
      });

      const text = await extractTextFromFile(pdfFile, mockExtractor);
      expect(mockExtractor).toHaveBeenCalled();
      expect(text).toContain('これは本です');
    });

    it('throws error when PDF has no readable text (scanned PDF)', async () => {
      const pdfFile = new File(['dummy-pdf-content'], 'scanned.pdf', { type: 'application/pdf' });
      const emptyExtractor = vi.fn().mockResolvedValue({
        text: '   \n  ',
        pageCount: 1,
      });

      await expect(extractTextFromFile(pdfFile, emptyExtractor)).rejects.toThrow(
        /skan qilingan yoki rasm shaklidagi PDF/,
      );
    });
  });

  describe('3. AI Question Extraction Pipeline', () => {
    it('throws error when input text is too short or empty', async () => {
      await expect(ExamAiExtractorService.extractQuestions({ text: 'qisqa matn' })).rejects.toThrow(
        /matn juda qisqa yoki bo‘sh/,
      );
    });

    it('successfully extracts questions and enforces draft status', async () => {
      const mockAiPayload = {
        recommendedTitle: 'JLPT N3 Sinov Imtihoni',
        recommendedLevel: 'N3',
        recommendedSection: 'knowledge',
        summary: '2 ta savol muvaffaqiyatli ajratildi.',
        questions: [
          {
            id: 'q-1',
            question_text: '彼女は＿＿服を着ている。',
            passage: null,
            options: ['派手な', '地味な', '親切な', '清潔な'],
            correct_answer: '派手な',
            correct_index: 0,
            explanation: 'Gap mazmuniga ko‘ra 派手な to‘g‘ri keladi.',
            level: 'N3',
            section_type: 'knowledge',
            question_type: 'vocabulary',
            difficulty: 'medium',
          },
          {
            id: 'q-2',
            question_text: '筆者の主張として最も適切なものはどれか。',
            passage: '科学技術の進歩は人々の生活を大きく変えた。',
            options: ['技術は重要だ', '昔の方が良かった', '人間は変わらない', 'どれでもない'],
            correct_answer: '技術は重要だ',
            correct_index: 0,
            explanation: 'Muallif texnologiyaning muhimligini ta’kidlagan.',
            level: 'N3',
            section_type: 'reading',
            question_type: 'reading_comprehension',
            difficulty: 'hard',
          },
        ],
      };

      vi.spyOn(aiCore, 'callAI').mockResolvedValue(JSON.stringify(mockAiPayload));

      const result = await ExamAiExtractorService.extractQuestions({
        text: '1. 彼女は＿＿服を着ている。\n1) 派手な 2) 地味な 3) 親切な 4) 清潔な\n正解: 1',
        defaultLevel: 'N3',
      });

      expect(result.recommendedLevel).toBe('N3');
      expect(result.recommendedSection).toBe('knowledge');
      expect(result.isDraft).toBe(true);
      expect(result.questions).toHaveLength(2);

      // Verify all questions have is_published: false (Strictly Draft)
      result.questions.forEach((q) => {
        expect(q.is_published).toBe(false);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(typeof q.correct_index).toBe('number');
        expect(q.explanation).toBeTruthy();
      });

      // Verify second question has reading passage
      expect(result.questions[1].passage).toContain('科学技術');
      expect(result.questions[1].difficulty).toBe('hard');
    });

    it('throws clear user-facing error on network or AI call rejection', async () => {
      vi.spyOn(aiCore, 'callAI').mockRejectedValue(new Error('Rate limit exceeded 429'));

      await expect(
        ExamAiExtractorService.extractQuestions({
          text: 'Savol matni yetarlicha uzun bo‘lishi uchun qo‘shimcha simvollar yozilmoqda.',
        }),
      ).rejects.toThrow(/AI xizmatiga ulanishda xatolik yuz berdi: Rate limit exceeded 429/);
    });

    it('throws clear user-facing error when AI response is not valid JSON', async () => {
      vi.spyOn(aiCore, 'callAI').mockResolvedValue('Buzilgan yoki noto‘g‘ri formatdagi javob');

      await expect(
        ExamAiExtractorService.extractQuestions({
          text: 'Savol matni yetarlicha uzun bo‘lishi uchun qo‘shimcha simvollar yozilmoqda.',
        }),
      ).rejects.toThrow(/AI javobini JSON formatida o‘qib bo‘lmadi/);
    });

    it('throws clear error when AI returns zero questions', async () => {
      vi.spyOn(aiCore, 'callAI').mockResolvedValue(
        JSON.stringify({
          recommendedLevel: 'N3',
          questions: [],
        }),
      );

      await expect(
        ExamAiExtractorService.extractQuestions({
          text: 'Savol matni yetarlicha uzun bo‘lishi uchun qo‘shimcha simvollar yozilmoqda.',
        }),
      ).rejects.toThrow(/AI kiritilgan matndan bitta ham savol ajrata olmadi/);
    });

    it('passes custom instruction for retry and prompt tweaking', async () => {
      const callAISpy = vi.spyOn(aiCore, 'callAI').mockResolvedValue(
        JSON.stringify({
          recommendedLevel: 'N2',
          questions: [
            {
              question_text: 'N2 darajasidagi savol matni',
              options: ['A', 'B'],
              correct_index: 0,
            },
          ],
        }),
      );

      await ExamAiExtractorService.extractQuestions({
        text: '1. N2 savol matni variantlar bilan',
        customInstruction: 'Faqat N2 savollarini ajrat va variantlarni tekshir',
      });

      expect(callAISpy).toHaveBeenCalledWith(
        expect.stringContaining('Faqat N2 savollarini ajrat va variantlarni tekshir'),
        expect.any(String),
        true,
        expect.objectContaining({ skipCache: true }),
      );
    });
  });
});
