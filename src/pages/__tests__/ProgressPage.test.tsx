import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ProgressPage from '../ProgressPage';
import { HistoryService } from '../../services/HistoryService';

const data = vi.hoisted(() => ({
  user: { id: 'student-a' },
  sessions: [],
  flashcards: [],
  targetLevel: 'N3',
}));
vi.mock('../../context/StudyPlannerContext', () => ({ useStudyData: () => data }));
vi.mock('../../context/LanguageContext', () => ({ useLanguage: () => ({ language: 'uz' }) }));
vi.mock('../../services/HistoryService', () => ({
  HistoryService: { getMockExamsHistory: vi.fn() },
}));
const show = (path = '/progress') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ProgressPage />
    </MemoryRouter>,
  );

describe('JLPT results', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(HistoryService.getMockExamsHistory).mockResolvedValue([]);
  });
  it('shows an honest empty assessment and an exam action', async () => {
    show();
    expect(
      await screen.findByText('Hali sinov natijasi yo‘q. Birinchi test bilan boshlang.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Hali baholanmagan. Mashqni boshlang.')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Sinov imtihonini ochish →' })).toHaveAttribute(
      'href',
      '/exams?level=N3',
    );
  });
  it('shows stored exam scores without rescaling by question count and filters other levels', async () => {
    vi.mocked(HistoryService.getMockExamsHistory).mockResolvedValue([
      {
        id: 'other-level',
        examType: 'jlpt',
        level: 'N5',
        score: 180,
        totalQuestions: 25,
        createdAt: '2026-11-24',
      },
      {
        id: 'older',
        examType: 'jlpt',
        level: 'N3',
        score: 90,
        totalQuestions: 25,
        createdAt: '2026-11-20',
      },
      {
        id: 'newer',
        examType: 'jlpt',
        level: 'N3',
        score: 120,
        totalQuestions: 25,
        createdAt: '2026-11-23',
      },
    ]);
    show();
    expect(await screen.findByText('120/180')).toBeInTheDocument();
    expect(screen.getByText('+30 ball oldingi sinovga nisbatan')).toBeInTheDocument();
    expect(screen.queryByText('180/180')).not.toBeInTheDocument();
  });
  it('opens history from a direct URL', async () => {
    show('/progress?tab=history');
    expect(screen.getByRole('link', { name: 'Imtihonlar tarixi' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await waitFor(() => expect(HistoryService.getMockExamsHistory).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'JLPT sinovlari' })).toBeInTheDocument();
  });
  it('shows a failed history request with a working retry instead of claiming no results', async () => {
    vi.mocked(HistoryService.getMockExamsHistory).mockRejectedValueOnce(new Error('offline'));
    show('/progress?tab=history');
    expect(await screen.findByRole('alert')).toHaveTextContent('Imtihonlar tarixi yuklanmadi.');
    expect(
      screen.queryByText('Natijalar testni tugatganingizdan keyin shu yerda ko‘rinadi.'),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tarixni qayta yuklash' }));
    expect(
      await screen.findByText('Natijalar testni tugatganingizdan keyin shu yerda ko‘rinadi.'),
    ).toBeInTheDocument();
  });
});
