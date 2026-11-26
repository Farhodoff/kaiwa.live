import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { JlptGrammarKanjiMaster } from '../JlptGrammarKanjiMaster';
vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({ subjects: [], targetLevel: 'N1' }),
}));
vi.mock('../../../context/LanguageContext', () => ({ useLanguage: () => ({ language: 'uz' }) }));
vi.mock('../../../hooks/useTelegramWebApp', () => ({
  useTelegramWebApp: () => ({ haptics: { selection: vi.fn(), impact: vi.fn() } }),
}));
vi.mock('../../../hooks/useJlptMastery', () => ({
  useJlptMastery: () => ({
    getItemStatus: () => 'unlearned',
    setItemStatus: vi.fn(),
    getStatsForLevel: () => ({ total: 0, mastered: 0, learned: 0, percentage: 0 }),
  }),
}));
vi.mock('../../../services/CustomContentService', () => ({
  CustomContentService: {
    mergeGrammar: (items: unknown[]) => items,
    mergeKanji: (items: unknown[]) => items,
    mergeVocab: (items: unknown[]) => items,
    mergeQuizQuestions: (items: unknown[]) => items,
  },
}));
vi.mock('../../../data/jlptGrammarKanji', () => ({ JLPT_GRAMMAR_DATA: [] }));
vi.mock('../../../data/jlptKanjiDatabase', () => ({ JLPT_KANJI_DATABASE: [] }));
vi.mock('../../../data/jlptVocabData', () => ({ loadVocabByLevel: async () => [] }));
vi.mock('../../../data/jlpt/grammar_data', () => ({ JLPT_GRAMMAR_QUESTIONS: [] }));
function Location() {
  return <span data-testid="query">{useLocation().search}</span>;
}
describe('Focused topic content', () => {
  it('does not show the shared master banner, unrelated tabs or a second level selector', async () => {
    render(
      <MemoryRouter>
        <JlptGrammarKanjiMaster section="goi" initialTab="goi" initialLevel="N1" />
      </MemoryRouter>,
    );
    expect(screen.queryByText('JLPT Grammar, Kanji & Goi Master')).not.toBeInTheDocument();
    expect(screen.queryByText('Baza hajmi')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Grammatika|Test Banki|N5/ }),
    ).not.toBeInTheDocument();
    expect(await screen.findByRole('textbox', { name: 'Qidirish' })).toBeInTheDocument();
  });
  it('keeps grammar practice in the grammar page and represents its mode in the URL', async () => {
    render(
      <MemoryRouter initialEntries={['/jlpt/grammar?level=N1']}>
        <JlptGrammarKanjiMaster section="grammar" initialTab="grammar" initialLevel="N1" />
        <Location />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Mashq qilish' }));
    expect(screen.getByTestId('query')).toHaveTextContent('mode=quiz');
    fireEvent.click(screen.getByRole('button', { name: 'Ro‘yxat' }));
    expect(screen.getByTestId('query')).not.toHaveTextContent('mode=quiz');
    await screen.findByRole('textbox', { name: 'Qidirish' });
  });
});
