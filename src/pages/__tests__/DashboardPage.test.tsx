import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DashboardPage from '../DashboardPage';
import { LearningPathEngine } from '../../services/LearningPathEngine';

const data = vi.hoisted(() => ({
  loading: false,
  subjects: [] as { id: string; isArchived?: boolean }[],
  flashcards: [] as { id: string; subjectId: string; nextReviewDate: string; deletedAt?: string }[],
  targetLevel: 'N3',
  targetGoal: 'JLPT',
  user: { id: 'student-a' },
  setPrimaryFocus: vi.fn(),
}));
vi.mock('../../context/StudyPlannerContext', () => ({ useStudyData: () => data }));
vi.mock('../../context/LanguageContext', () => ({ useLanguage: () => ({ language: 'uz' }) }));
vi.mock('../../services/LearningPathEngine', () => ({
  LearningPathEngine: { getLearningPathState: vi.fn() },
}));

const action = {
  nextAction: {
    title: 'N3 grammatika darsi',
    route: '/lesson/ja-n3-u1-l1',
    description: 'Grammatikani mustahkamlang.',
  },
};
const show = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

describe('JLPT Today page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    data.flashcards = [];
    data.subjects = [];
    data.loading = false;
    vi.mocked(LearningPathEngine.getLearningPathState).mockResolvedValue(action as any);
  });
  it('starts the recommended lesson and shows a clear daily routine', async () => {
    show();
    expect(await screen.findByText('N3 grammatika darsi')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Boshlash' })).toHaveAttribute(
      'href',
      '/lesson/ja-n3-u1-l1',
    );
    expect(screen.getByRole('heading', { name: 'Bugungi reja' })).toBeInTheDocument();
    expect(screen.queryByText(/\/180|tayyorgarligi:.*%/)).not.toBeInTheDocument();
  });
  it('prioritizes due reviews and excludes deleted and archived decks', async () => {
    data.subjects = [{ id: 'archived', isArchived: true }];
    data.flashcards = [
      { id: 'due', subjectId: 'active', nextReviewDate: '2020-01-01' },
      { id: 'deleted', subjectId: 'active', nextReviewDate: '2020-01-01', deletedAt: '2020-01-02' },
      { id: 'archived', subjectId: 'archived', nextReviewDate: '2020-01-01' },
      { id: 'future', subjectId: 'active', nextReviewDate: '2099-01-01' },
    ];
    show();
    expect(await screen.findByText('1 ta kartani takrorlang')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Takrorlashni boshlash' })).toHaveAttribute(
      'href',
      '/flashcards?study=all',
    );
  });
  it('keeps the primary JLPT lesson action when an extra speaking activity is recommended', async () => {
    vi.mocked(LearningPathEngine.getLearningPathState).mockResolvedValue({
      nextAction: { title: 'AI suhbat', route: '/speaking-coach' },
    } as any);
    show();
    await waitFor(() =>
      expect(screen.queryByText('Shaxsiy tavsiya yuklanmoqda…')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'Boshlash' })).toHaveAttribute(
      'href',
      '/jlpt?tab=lessons&level=N3',
    );
  });
  it('does not recommend an empty card session when there are no active cards', async () => {
    vi.mocked(LearningPathEngine.getLearningPathState).mockResolvedValue({
      nextAction: { title: 'VOCABULARY remediation', route: '/study-mode' },
    } as any);
    show();
    await waitFor(() =>
      expect(screen.queryByText('Shaxsiy tavsiya yuklanmoqda…')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'Boshlash' })).toHaveAttribute(
      'href',
      '/jlpt?tab=lessons&level=N3',
    );
  });
  it('keeps lessons usable during recommendation failure and retries', async () => {
    vi.mocked(LearningPathEngine.getLearningPathState)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(action as any);
    show();
    fireEvent.click(await screen.findByRole('button', { name: 'Qayta urinish' }));
    expect(await screen.findByText('N3 grammatika darsi')).toBeInTheDocument();
    expect(LearningPathEngine.getLearningPathState).toHaveBeenCalledTimes(2);
  });
  it('keeps detailed results on the results page instead of repeating them on Today', async () => {
    show();
    await screen.findByText('N3 grammatika darsi');
    expect(screen.getByRole('heading', { name: 'Bugun' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Natijalarim/ })).toHaveAttribute('href', '/progress');
    expect(screen.queryByRole('heading', { name: 'Mashqlardagi natijalaringiz' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'O‘quv rejam' })).toBeNull();
  });
  it('does not load recommendations before study data is ready', () => {
    data.loading = true;
    show();
    expect(screen.getByRole('status', { name: 'Yuklanmoqda' })).toBeInTheDocument();
    expect(LearningPathEngine.getLearningPathState).not.toHaveBeenCalled();
  });
  it('does not start an empty session suggested through the canonical review URL', async () => {
    vi.mocked(LearningPathEngine.getLearningPathState).mockResolvedValue({
      nextAction: { title: 'Review', route: '/flashcards?study=all' },
    } as any);
    show();
    await waitFor(() =>
      expect(screen.queryByText('Shaxsiy tavsiya yuklanmoqda…')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'Boshlash' })).toHaveAttribute(
      'href',
      '/jlpt?tab=lessons&level=N3',
    );
  });
  it('stores an optional exam date per student and restores it', async () => {
    const view = show();
    fireEvent.click(screen.getByText('Maqsadni o‘zgartirish'));
    fireEvent.change(screen.getByLabelText('Imtihon sanasi (ixtiyoriy)'), {
      target: { value: '2027-07-04' },
    });
    expect(localStorage.getItem('kaiwa_exam_date:student-a')).toBe('2027-07-04');
    view.unmount();
    show();
    fireEvent.click(screen.getByText('Maqsadni o‘zgartirish'));
    expect(screen.getByLabelText('Imtihon sanasi (ixtiyoriy)')).toHaveValue('2027-07-04');
    await screen.findByText('N3 grammatika darsi');
  });
});
