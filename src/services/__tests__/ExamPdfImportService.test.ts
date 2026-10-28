import { describe, expect, it } from 'vitest';
import {
  parsePdfFile,
  parsePdfText,
  pdfQuestionsToJson,
  reconstructLinesFromItems,
  validatePdfFile,
} from '../ExamPdfImportService';

const makePdfFile = (name: string, size = 1024, type = 'application/pdf') => {
  const file = new File([new Uint8Array(size)], name, { type });
  return file;
};

describe('ExamPdfImportService', () => {
  describe('validatePdfFile', () => {
    it('accepts a valid PDF file', () => {
      const result = validatePdfFile(makePdfFile('exam.pdf'));
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects non-PDF extensions and MIME types', () => {
      const result = validatePdfFile(makePdfFile('exam.csv', 100, 'text/csv'));
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('rejects an empty file', () => {
      const result = validatePdfFile(makePdfFile('empty.pdf', 0));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('bo‘sh');
    });

    it('rejects files larger than 20 MB', () => {
      const big = makePdfFile('big.pdf', 20 * 1024 * 1024 + 1);
      const result = validatePdfFile(big);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('20 MB');
    });
  });

  describe('parsePdfText', () => {
    it('parses numbered questions with lettered options and inline answers', () => {
      const text = [
        'JLPT N3 知識 テスト',
        '1. 彼女はいつも（　）な服を着ている。',
        'A) 派手',
        'B) 地味',
        'C) 清潔',
        'D) 親切',
        '答え: A',
        '2. 会議の時間を（　）してください。',
        'A) 確認',
        'B) 約束',
        'C) 準備',
        'D) 相談',
        '答え: C',
      ].join('\n');

      const result = parsePdfText(text);

      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].question_text).toBe('彼女はいつも（　）な服を着ている。');
      expect(result.questions[0].options).toEqual(['派手', '地味', '清潔', '親切']);
      expect(result.questions[0].correctAnswer).toBe('A');
      expect(result.questions[1].correctAnswer).toBe('C');
      expect(result.detectedLevel).toBe('N3');
      expect(result.detectedSection).toBe('knowledge');
    });

    it('parses numeric options (1-4) and maps them to letters', () => {
      const text = ['1. 質問のテキスト', '1) いち', '2) に', '3) さん', '4) し', '答え: 3'].join(
        '\n',
      );

      const result = parsePdfText(text);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].options).toEqual(['いち', 'に', 'さん', 'し']);
      expect(result.questions[0].correctAnswer).toBe('C');
      expect(result.questions[0].correct_index).toBe(2);
    });

    it('parses a trailing answer-key block', () => {
      const text = [
        '1. 最初の質問',
        'A) あ',
        'B) い',
        'C) う',
        'D) え',
        '2. 二番目の質問',
        'A) か',
        'B) き',
        'C) く',
        'D) け',
        '答え: 1-B 2-D',
      ].join('\n');

      const result = parsePdfText(text);

      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].correctAnswer).toBe('B');
      expect(result.questions[1].correctAnswer).toBe('D');
    });

    it('parses a trailing parenthesised answer', () => {
      const text = ['1. 括弧の答え', 'A) あ', 'B) い', 'C) う', 'D) え', '(B)'].join('\n');

      const result = parsePdfText(text);

      expect(result.questions[0].correctAnswer).toBe('B');
      expect(result.questions[0].question_text).toBe('括弧の答え');
    });

    it('warns and skips questions without options', () => {
      const text = ['1. 選択肢のない質問', '2. 次の質問', 'A) あ', 'B) い'].join('\n');

      const result = parsePdfText(text);

      expect(result.questions).toHaveLength(1);
      expect(result.warnings.some((w) => w.includes('variantlar topilmadi'))).toBe(true);
    });

    it('warns when the correct answer is missing', () => {
      const text = ['1. 答えのない質問', 'A) あ', 'B) い'].join('\n');

      const result = parsePdfText(text);

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].correctAnswer).toBe('');
      expect(result.warnings.some((w) => w.includes('javob topilmadi'))).toBe(true);
    });

    it('returns a warning for empty (scanned) PDFs', () => {
      const result = parsePdfText('');

      expect(result.questions).toHaveLength(0);
      expect(result.warnings[0]).toContain('o‘qiladigan matn topilmadi');
    });

    it('reports when no question format is found', () => {
      const result = parsePdfText('ただのテキストです。質問はありません。');

      expect(result.questions).toHaveLength(0);
      expect(result.warnings.some((w) => w.includes('savol formatini topib'))).toBe(true);
    });
  });

  describe('reconstructLinesFromItems', () => {
    it('groups items by their Y coordinate', () => {
      const items = [
        { str: '1. Question', transform: [1, 0, 0, 1, 10, 700] },
        { str: 'A) option', transform: [1, 0, 0, 1, 10, 680] },
        { str: 'B) option', transform: [1, 0, 0, 1, 10, 660] },
      ];

      expect(reconstructLinesFromItems(items)).toEqual(['1. Question', 'A) option', 'B) option']);
    });

    it('joins fragments that share the same line', () => {
      const items = [
        { str: 'N3', transform: [1, 0, 0, 1, 10, 700] },
        { str: '知識', transform: [1, 0, 0, 1, 30, 700] },
      ];

      expect(reconstructLinesFromItems(items)).toEqual(['N3知識']);
    });
  });

  describe('parsePdfFile', () => {
    it('rejects invalid files before extraction', async () => {
      const file = makePdfFile('exam.txt', 100, 'text/plain');

      await expect(parsePdfFile(file)).rejects.toThrow();
    });

    it('uses the injected extractor and returns parsed questions', async () => {
      const file = makePdfFile('exam.pdf');
      const extractor = async () => ({
        text: ['1. テスト質問', 'A) あ', 'B) い', '答え: B'].join('\n'),
        pageCount: 3,
      });

      const result = await parsePdfFile(file, extractor);

      expect(result.pageCount).toBe(3);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].correctAnswer).toBe('B');
    });

    it('returns no questions and a warning for scanned PDFs', async () => {
      const file = makePdfFile('scan.pdf');
      const extractor = async () => ({ text: '', pageCount: 1 });

      const result = await parsePdfFile(file, extractor);

      expect(result.questions).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('pdfQuestionsToJson', () => {
    it('produces a JSON array that the bulk import service can parse', () => {
      const json = pdfQuestionsToJson([
        {
          id: 'pdf-1',
          question_text: 'テスト',
          options: ['あ', 'い'],
          correctAnswer: 'A',
        },
      ]);

      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].question_text).toBe('テスト');
    });
  });
});
