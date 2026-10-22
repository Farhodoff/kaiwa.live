import { describe, expect, it } from 'vitest';
import {
  JLPT_QUESTION_TYPES,
  buildJlptQuestionPayload,
  getDefaultQuestionTypeForSection,
  getJlptQuestionTypeDefinition,
  getQuestionTypesForSection,
  isValidSentenceOrdering,
  normalizeJlptQuestionType,
  normalizeQuestionSection,
  parseNumberList,
  parseSentenceOrderingData,
  parseStringList,
} from '../jlptQuestionType';

describe('jlptQuestionType', () => {
  it('supports all 11 extended N3-N1 question types', () => {
    expect(JLPT_QUESTION_TYPES).toHaveLength(11);
    expect(JLPT_QUESTION_TYPES).toEqual([
      'vocabulary_meaning',
      'kanji_reading',
      'grammar_fill_blank',
      'sentence_ordering',
      'synonym_nuance',
      'reading_main_idea',
      'reading_detail',
      'reading_inference',
      'listening_situation',
      'listening_intention',
      'listening_summary',
    ]);
  });

  it('normalizes raw aliases into canonical question types', () => {
    expect(normalizeJlptQuestionType('vocabulary')).toBe('vocabulary_meaning');
    expect(normalizeJlptQuestionType('漢字')).toBe('kanji_reading');
    expect(normalizeJlptQuestionType('fill_in_blank')).toBe('grammar_fill_blank');
    expect(normalizeJlptQuestionType('sentence order')).toBe('sentence_ordering');
    expect(normalizeJlptQuestionType('synonym')).toBe('synonym_nuance');
    expect(normalizeJlptQuestionType('main_idea')).toBe('reading_main_idea');
    expect(normalizeJlptQuestionType('reading_detail')).toBe('reading_detail');
    expect(normalizeJlptQuestionType('inference')).toBe('reading_inference');
    expect(normalizeJlptQuestionType('listening situation')).toBe('listening_situation');
    expect(normalizeJlptQuestionType('speaker_intention')).toBe('listening_intention');
    expect(normalizeJlptQuestionType('summary')).toBe('listening_summary');
  });

  it('falls back to a section-appropriate type', () => {
    expect(getDefaultQuestionTypeForSection('knowledge')).toBe('vocabulary_meaning');
    expect(getDefaultQuestionTypeForSection('Reading')).toBe('reading_main_idea');
    expect(getDefaultQuestionTypeForSection('Listening')).toBe('listening_situation');
    expect(normalizeQuestionSection('Dokkai')).toBe('reading');
    expect(normalizeQuestionSection('Choukai')).toBe('listening');
  });

  it('groups question types by exam section', () => {
    expect(getQuestionTypesForSection('knowledge')).toHaveLength(5);
    expect(getQuestionTypesForSection('reading')).toHaveLength(3);
    expect(getQuestionTypesForSection('listening')).toHaveLength(3);
    expect(getJlptQuestionTypeDefinition('listening_summary').requiresAudio).toBe(true);
    expect(getJlptQuestionTypeDefinition('reading_inference').requiresPassage).toBe(true);
  });

  it('parses fragments and ordering values from CSV-friendly formats', () => {
    expect(parseStringList('友達と|映画を|見に|日曜日に')).toEqual([
      '友達と',
      '映画を',
      '見に',
      '日曜日に',
    ]);
    expect(parseStringList('["A", "B", "C", "D"]')).toEqual(['A', 'B', 'C', 'D']);
    expect(parseNumberList('4|1|2|3')).toEqual([4, 1, 2, 3]);

    const ordering = parseSentenceOrderingData({
      fragments: 'A|B|C|D',
      correctOrder: '2|4|1|3',
      starPosition: 3,
      prefix: '私は',
      suffix: '行きます。',
    });
    expect(ordering.correctOrder).toEqual([1, 3, 0, 2]);
    expect(isValidSentenceOrdering(ordering)).toBe(true);
  });

  it('rejects incomplete sentence ordering schemas', () => {
    expect(
      isValidSentenceOrdering({
        fragments: ['A', 'B', 'C'],
        correctOrder: [0, 1, 2],
        starPosition: 3,
      }),
    ).toBe(false);
    expect(
      isValidSentenceOrdering({
        fragments: ['A', 'B', 'C', 'D'],
        correctOrder: [0, 0, 1, 2],
        starPosition: 3,
      }),
    ).toBe(false);
    expect(
      isValidSentenceOrdering({
        fragments: ['A', 'B', 'C', 'D'],
        correctOrder: [0, 1, 2, 3],
        starPosition: 5,
      }),
    ).toBe(false);
  });

  it('builds type-specific payloads', () => {
    const choicePayload = buildJlptQuestionPayload({
      type: 'reading_inference',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'B',
      correctIndex: 1,
    });
    expect(choicePayload).toMatchObject({
      type: 'reading_inference',
      correct_index: 1,
      correct_answer: 'B',
    });

    const orderingPayload = buildJlptQuestionPayload({
      type: 'sentence_ordering',
      fragments: ['A', 'B', 'C', 'D'],
      correctOrder: [1, 3, 0, 2],
      starPosition: 2,
    });
    expect(orderingPayload).toMatchObject({
      type: 'sentence_ordering',
      fragments: ['A', 'B', 'C', 'D'],
      correct_order: [1, 3, 0, 2],
      star_position: 2,
    });
  });
});
