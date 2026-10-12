import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LessonPlayerPage } from '../LessonPlayerPage';
import { LearningSignalService } from '../../services/LearningSignalService';
import { LessonService } from '../../services/LessonService';

vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: { id: 'test-user-123' },
    primaryLanguage: 'ja',
    awardXP: vi.fn(),
    settings: {},
  }),
}));

vi.mock('../../services/LearningOrchestrator', () => ({
  LearningOrchestrator: {
    canAccessLesson: () => ({ allowed: true, reason: 'Access granted' }),
    promoteIfReady: vi.fn(),
    getPrimaryLanguage: () => 'en',
    getUserTarget: () => ({ targetLevel: 'N3', targetGoal: '', currentLevel: 'N3' }),
  },
}));

vi.mock('../../utils/audioTts', () => ({
  speakText: vi.fn(),
  speakJapaneseText: vi.fn(),
}));

describe('LessonPlayerPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(LessonService, 'saveLessonProgress').mockResolvedValue(undefined);
    vi.spyOn(LessonService, 'completeLesson').mockResolvedValue(undefined as any);
  });

  it('renders Japanese lesson properly with title, level, and Learn step', () => {
    render(
      <MemoryRouter initialEntries={['/lesson/ja-n3-u1-l1']}>
        <Routes>
          <Route path="/lesson/:lessonId" element={<LessonPlayerPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/Passive Voice/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/JLPT N3/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Passive Voice Formation/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/褒/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/叱/).length).toBeGreaterThan(0);
  });

  it('renders English B2 lesson properly with academic vocabulary and Inversion grammar', () => {
    render(
      <MemoryRouter initialEntries={['/lesson/en-b2-u1-l1']}>
        <Routes>
          <Route path="/lesson/:lessonId" element={<LessonPlayerPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/Negative Inversion/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/English B2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Seldom/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Perseverance/i).length).toBeGreaterThan(0);
  });

  it('navigates from Learn to Practice step and enables seamless answer selection and review', async () => {
    render(
      <MemoryRouter initialEntries={['/lesson/ja-n3-u1-l1']}>
        <Routes>
          <Route path="/lesson/:lessonId" element={<LessonPlayerPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Click next step button
    const nextBtn = screen.getByRole('button', { name: /Keyingi Qadamga O'tish/i });
    fireEvent.click(nextBtn);

    // Now in Practice step (real curriculum content)
    expect(screen.getByText(/To'g'ri majhul nisbat shaklini tanlang/i)).toBeInTheDocument();

    // Select the first option for Exercise 1
    const optionA = screen.getByText(/誰/);
    fireEvent.click(optionA);

    // Advance to Exercise 2 via Davom etish button
    const continueBtn = screen.getByRole('button', { name: /Davom etish/i });
    fireEvent.click(continueBtn);

    // Select option for Exercise 2
    const optButtons = screen.getAllByRole('button').filter((b) => b.textContent?.includes('A'));
    expect(optButtons.length).toBeGreaterThan(0);
    fireEvent.click(optButtons[0]);

    // Click Natijalarni Ko'rish
    const finishBtn = screen.getByRole('button', { name: /Natijalarni Ko'rish/i });
    fireEvent.click(finishBtn);

    expect(screen.getByText(/Mashqlar Tahlili va To'g'ri Javoblar/i)).toBeInTheDocument();
  });

  it('displays error UI when invalid lessonId is provided', () => {
    render(
      <MemoryRouter initialEntries={['/lesson/invalid-id-xyz']}>
        <Routes>
          <Route path="/lesson/:lessonId" element={<LessonPlayerPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Dars Topilmadi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bosh Sahifaga Qaytish/i })).toBeInTheDocument();
  });

  it('processes lesson completion and displays SRS summary badge', async () => {
    const srsSpy = vi.spyOn(LearningSignalService, 'processLessonCompletion').mockResolvedValue({
      newCardsCount: 4,
      mistakesCount: 1,
    });

    render(
      <MemoryRouter initialEntries={['/lesson/ja-n3-u1-l1']}>
        <Routes>
          <Route path="/lesson/:lessonId" element={<LessonPlayerPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Advance to step 2
    fireEvent.click(screen.getByRole('button', { name: /Keyingi Qadamga O'tish/i }));
    // Advance to step 3
    fireEvent.click(screen.getByRole('button', { name: /Keyingi Qadamga O'tish/i }));

    // Finish lesson
    fireEvent.click(screen.getByRole('button', { name: /Darsni Yakunlash/i }));

    await waitFor(
      () => {
        expect(srsSpy).toHaveBeenCalled();
      },
      { timeout: 4000 },
    );
    expect(
      await screen.findByText(/Dars Yakunlandi! 🎉/i, {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/4 ta yangi so'z Fleshkartalarga qo'shildi/i, {}, { timeout: 4000 }),
    ).toBeInTheDocument();
  });

  it('navigates directly to Mondai listening step via ?step=mondai query parameter', async () => {
    render(
      <MemoryRouter initialEntries={['/lesson/ja-minna-l1?step=mondai']}>
        <Routes>
          <Route path="/lesson/:lessonId" element={<LessonPlayerPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Header should indicate Mondai listening step
    // (step title also appears in the footer jump-select options)
    const mondaiMatches = await screen.findAllByText(/Mondai Tinglash Testi/i);
    expect(mondaiMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/4 \/ 4/)).toBeInTheDocument();
    // Footer jump-select reflects the current step
    const jumpSelect = screen.getByRole('combobox', { name: /Qadamga sakrash/i });
    expect(jumpSelect).toHaveValue('3');
  });
});
