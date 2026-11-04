import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { JlptHubPage } from '../JlptHubPage';

vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    settings: { showFurigana: true, showRomaji: false },
    updateSettings: vi.fn(),
  }),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'uz',
  }),
}));

vi.mock('../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

vi.mock('../../components/jlpt/MinnaLessonsExplorer', () => ({
  default: () => <div data-testid="minna-lessons-explorer">Minna Lessons Explorer Content</div>,
}));

vi.mock('../../components/jlpt/JlptGrammarKanjiMaster', () => ({
  default: ({ initialTab }: { initialTab?: string }) => (
    <div data-testid="jlpt-grammar-kanji-master">
      JlptGrammarKanjiMaster Tab: {initialTab || 'default'}
    </div>
  ),
}));

vi.mock('../../components/jlpt/KanjiCanvasPractice', () => ({
  default: () => <div data-testid="kanji-canvas-practice">Kanji Canvas Practice</div>,
}));

vi.mock('../JlptReadingPage', () => ({
  JlptReadingPage: () => <div data-testid="jlpt-reading-page">Reading Page Content</div>,
}));

vi.mock('../JlptListeningMockPage', () => ({
  JlptListeningMockPage: () => <div data-testid="jlpt-listening-page">Listening Page Content</div>,
}));

vi.mock('../JlptWritingPage', () => ({
  JlptWritingPage: () => <div data-testid="jlpt-writing-page">Writing Page Content</div>,
}));

vi.mock('../JlptMockExamPage', () => ({
  JlptMockExamPage: () => <div data-testid="jlpt-mock-exam-page">Mock Exam Page Content</div>,
}));

vi.mock('../../components/jlpt/JlptMistakeNotebook', () => ({
  JlptMistakeNotebook: () => (
    <div data-testid="jlpt-mistake-notebook">Mistake Notebook Content</div>
  ),
  default: () => <div data-testid="jlpt-mistake-notebook">Mistake Notebook Content</div>,
}));

describe('JlptHubPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all tabs including Grammar and Writing tabs', () => {
    render(
      <MemoryRouter initialEntries={['/jlpt?tab=lessons']}>
        <Routes>
          <Route path="/jlpt" element={<JlptHubPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Darsliklar/i)).toBeInTheDocument();
    expect(screen.getByText(/Grammatika/i)).toBeInTheDocument();
    expect(screen.getByText(/Kanji/i)).toBeInTheDocument();
    expect(screen.getByText(/Lug‘at/i)).toBeInTheDocument();
    expect(screen.getByText(/O‘qish/i)).toBeInTheDocument();
    expect(screen.getByText(/Tinglash/i)).toBeInTheDocument();
    expect(screen.getByText(/Yozish/i)).toBeInTheDocument();
    expect(screen.getByText(/JLPT imtihoni/i)).toBeInTheDocument();
    expect(screen.getByText(/Xatolar daftari/i)).toBeInTheDocument();
  });

  it('renders Grammar master when tab is set to grammar', async () => {
    render(
      <MemoryRouter initialEntries={['/jlpt?tab=grammar']}>
        <Routes>
          <Route path="/jlpt" element={<JlptHubPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('jlpt-grammar-kanji-master')).toBeInTheDocument();
    expect(screen.getByText(/JlptGrammarKanjiMaster Tab: grammar/i)).toBeInTheDocument();
  });

  it('renders Writing page when tab is set to writing', async () => {
    render(
      <MemoryRouter initialEntries={['/jlpt?tab=writing']}>
        <Routes>
          <Route path="/jlpt" element={<JlptHubPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('jlpt-writing-page')).toBeInTheDocument();
  });

  it('renders Kanji canvas practice and kanji master when tab is set to kanji', async () => {
    render(
      <MemoryRouter initialEntries={['/jlpt?tab=kanji']}>
        <Routes>
          <Route path="/jlpt" element={<JlptHubPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('jlpt-grammar-kanji-master')).toBeInTheDocument();
    expect(screen.getByText(/JlptGrammarKanjiMaster Tab: kanji/i)).toBeInTheDocument();

    const toggleCanvasBtn = screen.getByText(/Ochish/i);
    fireEvent.click(toggleCanvasBtn);
    expect(await screen.findByTestId('kanji-canvas-practice')).toBeInTheDocument();
  });

  it('renders Mistake Notebook when tab is set to mistakes', async () => {
    render(
      <MemoryRouter initialEntries={['/jlpt?tab=mistakes']}>
        <Routes>
          <Route path="/jlpt" element={<JlptHubPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('jlpt-mistake-notebook')).toBeInTheDocument();
  });
});
