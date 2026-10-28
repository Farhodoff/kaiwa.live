import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { JlptQuestionPreview } from '../JlptQuestionPreview';
import type { JlptQuestionType } from '../../../types/jlptQuestionType';

const choice = {
  question_text: '次の文の（　）に入る最も適切なものを選んでください。',
  options: ['A', 'B', 'C', 'D'],
  correct_answer: 'B',
  explanation: 'Izoh',
};

const typeCases: Array<[JlptQuestionType, string, string]> = [
  ['vocabulary_meaning', "So‘z ma'nosi", 'knowledge'],
  ['kanji_reading', 'Kanji o‘qilishi', 'knowledge'],
  ['grammar_fill_blank', 'Grammatika bo‘sh joy', 'knowledge'],
  ['sentence_ordering', 'Gap tartibi', 'knowledge'],
  ['synonym_nuance', 'Sinonim va nuance', 'knowledge'],
  ['reading_main_idea', 'Matn asosiy fikri', 'reading'],
  ['reading_detail', 'Matn detali', 'reading'],
  ['reading_inference', 'Matndan xulosa', 'reading'],
  ['listening_situation', 'Vaziyatni tushunish', 'listening'],
  ['listening_intention', 'So‘zlovchi niyati', 'listening'],
  ['listening_summary', 'Audio xulosasi', 'listening'],
];

describe('JlptQuestionPreview', () => {
  it.each(typeCases)('renders a distinct schema preview for %s', (type, label, section) => {
    const isOrdering = type === 'sentence_ordering';
    render(
      <JlptQuestionPreview
        sectionType={section}
        question={{
          ...choice,
          question_type: type,
          options: isOrdering ? undefined : choice.options,
          passage: section === 'reading' ? '科学技術の進歩は生活を便利にした。' : null,
          question_payload: isOrdering
            ? {
                type,
                fragments: ['友達と', '映画を', '見に', '日曜日に'],
                correct_order: [3, 0, 1, 2],
                star_position: 3,
              }
            : { type, options: choice.options, correct_index: 1, correct_answer: 'B' },
        }}
      />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
    if (isOrdering) {
      expect(screen.getByText('映画を')).toBeInTheDocument();
      expect(screen.getByText(/★ 3-o‘rin/)).toBeInTheDocument();
    } else {
      expect(screen.getAllByText('B').length).toBeGreaterThan(0);
    }
  });

  it('shows answer feedback and explanation when requested', () => {
    render(
      <JlptQuestionPreview
        showAnswer
        selectedIndex={0}
        question={{
          ...choice,
          question_type: 'reading_inference',
          passage: '科学技術の進歩は生活を便利にした。',
          question_payload: { type: 'reading_inference', correct_index: 1, correct_answer: 'B' },
        }}
      />,
    );

    expect(screen.getByText(/【問題本文 \/ Reading Passage】/i)).toBeInTheDocument();
    expect(screen.getByText('✓ TO‘G‘RI')).toBeInTheDocument();
    expect(screen.getByText(/Izoh va Qoida/)).toBeInTheDocument();
  });

  it('calls onSelect when an option is clicked', () => {
    const onSelect = vi.fn();
    render(
      <JlptQuestionPreview
        onSelect={onSelect}
        question={{
          ...choice,
          question_type: 'vocabulary_meaning',
          question_payload: { type: 'vocabulary_meaning', correct_index: 1 },
        }}
      />,
    );

    fireEvent.click(screen.getAllByText('C')[0]);
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('shows audio state for listening types', () => {
    render(
      <JlptQuestionPreview
        question={{
          ...choice,
          question_type: 'listening_summary',
          listening_audio_id: 'audio-1',
          question_payload: { type: 'listening_summary', correct_index: 1 },
        }}
      />,
    );

    expect(screen.getByText(/Audio biriktirilgan/i)).toBeInTheDocument();
  });
});
