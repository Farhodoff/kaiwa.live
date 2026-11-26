import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { JlptHubPage } from '../JlptHubPage';
import JlptVocabularyPage from '../JlptVocabularyPage';
import JlptGrammarPage from '../JlptGrammarPage';
import JlptKanjiPage from '../JlptKanjiPage';
vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    settings: { showFurigana: true, showRomaji: false },
    updateSettings: vi.fn(),
    targetLevel: 'N5',
  }),
}));
vi.mock('../../context/LanguageContext', () => ({ useLanguage: () => ({ language: 'uz' }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: vi.fn() }));
vi.mock('../../components/jlpt/MinnaLessonsExplorer', () => ({
  default: () => <div>Darsliklar ro‘yxati</div>,
}));
vi.mock('../../components/jlpt/JlptGrammarKanjiMaster', () => ({
  default: ({ section, initialLevel }: { section?: string; initialLevel?: string }) => (
    <div data-testid="topic-content">
      {section} {initialLevel}
    </div>
  ),
}));
vi.mock('../../components/jlpt/KanjiCanvasPractice', () => ({
  default: () => <div>Kanji canvas</div>,
}));
function Location() {
  const location = useLocation();
  return (
    <span data-testid="location">
      {location.pathname}
      {location.search}
    </span>
  );
}
function show(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/jlpt" element={<JlptHubPage />} />
        <Route path="/jlpt/vocabulary" element={<JlptVocabularyPage />} />
        <Route path="/jlpt/grammar" element={<JlptGrammarPage />} />
        <Route path="/jlpt/kanji" element={<JlptKanjiPage />} />
        <Route path="/exams" element={<div>Imtihonlar</div>} />
        <Route path="/flashcards" element={<div>Takrorlash</div>} />
        <Route path="/progress" element={<div>Natijalar</div>} />
      </Routes>
      <Location />
    </MemoryRouter>,
  );
}
describe('Separate JLPT study pages', () => {
  it('removes the essay page while keeping the selected lesson level', async () => {
    show('/jlpt?tab=writing&level=N2');
    expect(await screen.findByText('Darsliklar ro‘yxati')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('tab=lessons');
    expect(screen.getByTestId('location')).toHaveTextContent('level=N2');
    expect(screen.queryByRole('link', { name: 'Yozish' })).toBeNull();
  });

  it('keeps kanji handwriting available', async () => {
    show('/jlpt/kanji?level=N5');
    await screen.findByTestId('topic-content');
    fireEvent.click(screen.getByText('Yozish mashqi'));
    expect(await screen.findByText('Kanji canvas')).toBeInTheDocument();
  });

  it('links each topic to its own page and retains the selected level', () => {
    show('/jlpt?level=N1');
    const nav = within(screen.getByRole('navigation', { name: 'O‘quv yo‘nalishlari' }));
    expect(nav.getAllByRole('link')).toHaveLength(6);
    expect(nav.getByRole('link', { name: 'Lug‘at' })).toHaveAttribute(
      'href',
      '/jlpt/vocabulary?level=N1',
    );
    expect(nav.getByRole('link', { name: 'Kanji' })).toHaveAttribute(
      'href',
      '/jlpt/kanji?level=N1',
    );
    expect(nav.getByRole('link', { name: 'Grammatika' })).toHaveAttribute(
      'href',
      '/jlpt/grammar?level=N1',
    );
  });
  it.each([
    ['vocabulary', 'Lug‘at', 'goi'],
    ['grammar', 'Grammatika', 'grammar'],
    ['kanji', 'Kanji', 'kanji'],
  ])('opens %s directly with its own title and focused content', async (path, title, section) => {
    show(`/jlpt/${path}?level=N1`);
    expect(screen.getByRole('heading', { name: title, level: 1 })).toBeInTheDocument();
    expect(await screen.findByTestId('topic-content')).toHaveTextContent(`${section} N1`);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
  it('switches topics without losing the level, and changing level updates the content', async () => {
    show('/jlpt/vocabulary?level=N1');
    const nav = within(screen.getByRole('navigation', { name: 'O‘quv yo‘nalishlari' }));
    fireEvent.click(nav.getByRole('link', { name: 'Grammatika' }));
    expect(await screen.findByTestId('topic-content')).toHaveTextContent('grammar N1');
    fireEvent.click(
      within(screen.getByRole('group', { name: 'JLPT darajasi' })).getByRole('button', {
        name: 'N3',
      }),
    );
    expect(screen.getByTestId('topic-content')).toHaveTextContent('grammar N3');
  });
  it.each([
    ['goi', '/jlpt/vocabulary'],
    ['kanji', '/jlpt/kanji'],
    ['grammar', '/jlpt/grammar'],
    ['mock', '/exams'],
    ['mistakes', '/flashcards'],
    ['insights', '/progress'],
  ])('redirects old %s URLs while preserving level and language', async (tab, destination) => {
    show(`/jlpt?tab=${tab}&level=N1&lang=uz`);
    expect(screen.getByTestId('location')).toHaveTextContent(destination);
    expect(screen.getByTestId('location')).toHaveTextContent('level=N1');
    expect(screen.getByTestId('location')).toHaveTextContent('lang=uz');
    if (['goi', 'kanji', 'grammar'].includes(tab)) await screen.findByTestId('topic-content');
  });
});
