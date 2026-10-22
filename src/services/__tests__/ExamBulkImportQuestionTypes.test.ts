import { describe, expect, it } from 'vitest';
import { ExamBulkImportService, RawImportQuestion } from '../ExamBulkImportService';

const baseQuestion = {
  section: 'knowledge',
  level: 'N3',
  type: 'multiple_choice',
  question_text: '次の文の（　）に入る最も適切なものを選んでください。',
  explanation: 'Izoh',
};

describe('ExamBulkImportService — N3-N1 question type schemas', () => {
  it('validates and builds payload for sentence ordering questions', () => {
    const raw: RawImportQuestion[] = [
      {
        ...baseQuestion,
        id: 'order-1',
        question_type: 'sentence_ordering',
        fragments: ['友達と', '映画を', '見に', '日曜日に'],
        correct_order: [3, 0, 1, 2],
        star_position: 3,
        prefix: '私は',
        suffix: '行きます。',
      },
    ];

    const result = ExamBulkImportService.validateQuestions(raw, { expectedLevel: 'N3' });

    expect(result.isValid).toBe(true);
    expect(result.validCount).toBe(1);
    expect(result.items[0].validated).toMatchObject({
      question_type: 'sentence_ordering',
      options: ['友達と', '映画を', '見に', '日曜日に'],
      correct_index: 1,
      correct_answer: '映画を',
    });
    expect(result.items[0].validated?.question_payload).toMatchObject({
      type: 'sentence_ordering',
      fragments: ['友達と', '映画を', '見に', '日曜日に'],
      correct_order: [3, 0, 1, 2],
      star_position: 3,
      prefix: '私は',
      suffix: '行きます。',
    });
  });

  it('rejects sentence ordering with invalid fragment count or order', () => {
    const raw: RawImportQuestion[] = [
      {
        ...baseQuestion,
        id: 'order-bad-1',
        question_type: 'sentence_ordering',
        fragments: ['A', 'B', 'C'],
        correct_order: [0, 1, 2],
        star_position: 3,
      },
      {
        ...baseQuestion,
        id: 'order-bad-2',
        question_type: 'sentence_ordering',
        fragments: ['A', 'B', 'C', 'D'],
        correct_order: [0, 0, 1, 2],
        star_position: 3,
      },
    ];

    const result = ExamBulkImportService.validateQuestions(raw, { expectedLevel: 'N3' });

    expect(result.errorCount).toBe(2);
    expect(
      result.items.every((item) =>
        item.issues.some((issue) => issue.field === 'fragments' || issue.field === 'correct_order'),
      ),
    ).toBe(true);
  });

  it('normalizes legacy question_type aliases and persists a type payload', () => {
    const raw: RawImportQuestion[] = [
      {
        ...baseQuestion,
        id: 'vocab-1',
        question_type: 'vocabulary',
        options: ['派手', '地味', '清潔', '親切'],
        correct_answer: '派手',
      },
      {
        ...baseQuestion,
        id: 'kanji-1',
        question_type: '漢字',
        options: ['かくにん', 'かくにゅう', 'かくてい', 'かくほ'],
        correct_answer: 'かくにん',
      },
      {
        ...baseQuestion,
        id: 'grammar-1',
        question_type: 'fill_in_blank',
        options: ['を', 'が', 'に', 'で'],
        correct_answer: 'に',
      },
    ];

    const result = ExamBulkImportService.validateQuestions(raw, { expectedLevel: 'N3' });
    const types = result.items.map((item) => item.validated?.question_type);

    expect(types).toEqual(['vocabulary_meaning', 'kanji_reading', 'grammar_fill_blank']);
    expect(result.items[0].validated?.question_payload).toMatchObject({
      type: 'vocabulary_meaning',
      correct_index: 0,
      correct_answer: '派手',
    });
  });

  it('supports all reading and listening types with type-specific payloads', () => {
    const raw: RawImportQuestion[] = [
      {
        ...baseQuestion,
        id: 'r1',
        section: 'reading',
        question_type: 'reading_main_idea',
        passage: '科学技術の進歩は生活を便利にした。',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
      },
      {
        ...baseQuestion,
        id: 'r2',
        section: 'reading',
        question_type: 'reading_detail',
        passage: '科学技術の進歩は生活を便利にした。',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'B',
      },
      {
        ...baseQuestion,
        id: 'r3',
        section: 'reading',
        question_type: 'reading_inference',
        passage: '科学技術の進歩は生活を便利にした。',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'C',
      },
      {
        ...baseQuestion,
        id: 'l1',
        section: 'listening',
        question_type: 'listening_situation',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
      },
      {
        ...baseQuestion,
        id: 'l2',
        section: 'listening',
        question_type: 'listening_intention',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'B',
      },
      {
        ...baseQuestion,
        id: 'l3',
        section: 'listening',
        question_type: 'listening_summary',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'C',
      },
    ];

    const result = ExamBulkImportService.validateQuestions(raw, { expectedLevel: 'N3' });

    expect(result.validCount).toBe(6);
    expect(result.items.map((item) => item.validated?.question_type)).toEqual([
      'reading_main_idea',
      'reading_detail',
      'reading_inference',
      'listening_situation',
      'listening_intention',
      'listening_summary',
    ]);
    expect(result.detectedSections).toEqual(['reading', 'listening']);
  });

  it('infers the section from an explicit question type when section is omitted', () => {
    const raw: RawImportQuestion[] = [
      {
        ...baseQuestion,
        id: 'infer-1',
        section: undefined,
        section_type: undefined,
        section_name: undefined,
        question_type: 'listening_summary',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
      },
    ];

    const result = ExamBulkImportService.validateQuestions(raw, { expectedLevel: 'N3' });

    expect(result.isValid).toBe(true);
    expect(result.items[0].validated?.section_type).toBe('listening');
  });

  it('warns when a question type is placed in a mismatched section', () => {
    const raw: RawImportQuestion[] = [
      {
        ...baseQuestion,
        id: 'mismatch-1',
        section: 'reading',
        question_type: 'vocabulary_meaning',
        passage: '科学技術の進歩は生活を便利にした。',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
      },
    ];

    const result = ExamBulkImportService.validateQuestions(raw, { expectedLevel: 'N3' });

    expect(
      result.items[0].issues.some((issue) => issue.code === 'question_type_section_mismatch'),
    ).toBe(true);
  });

  it('parses the sample CSV and JSON templates with the extended fields', () => {
    const csv = ExamBulkImportService.generateSampleCsvTemplate();
    expect(csv).toContain('question_type');
    expect(csv).toContain('sentence_ordering');
    expect(csv).toContain('correct_order');

    const json = JSON.parse(ExamBulkImportService.generateSampleJsonTemplate());
    expect(json.some((question: any) => question.question_type === 'sentence_ordering')).toBe(true);
    expect(json.some((question: any) => question.question_type === 'reading_main_idea')).toBe(true);
  });
});
