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
    awardXP: vi.fn().mockResolvedValue(undefined),
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

vi.mock('../../services/ActivityLoggingService', () => ({
  ActivityLoggingService: {
    logActivity: vi.fn().mockResolvedValue({ id: 'test-activity-id' }),
    calculateSpeakingXP: vi.fn().mockReturnValue({ xp: 15 }),
    calculateFlashcardMilestoneXP: vi.fn().mockReturnValue({ milestoneXp: 0 }),
  },
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock('../../components/lesson/LessonAudioPlayer', () => ({
  LessonAudioPlayer: ({ audioTitle }: { audioTitle?: string }) => (
    <div data-testid="lesson-audio-player">{audioTitle || 'Audio Player'}</div>
  ),
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
    const optButtons1 = screen.getAllByRole('button').filter((b) => b.textContent?.includes('A'));
    expect(optButtons1.length).toBeGreaterThan(0);
    fireEvent.click(optButtons1[0]);

    // Advance through exercises until reaching the final finish button
    for (let i = 0; i < 25; i++) {
      const continueBtn = screen.queryByRole('button', { name: /Davom etish/i });
      if (!continueBtn) break;
      fireEvent.click(continueBtn);
      const optButtons = screen.getAllByRole('button').filter((b) => b.textContent?.includes('A'));
      if (optButtons.length > 0) {
        fireEvent.click(optButtons[0]);
      }
    }

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

    await waitFor(() => {
      expect(srsSpy).toHaveBeenCalled();
    });
    expect(await screen.findByText(/Dars Yakunlandi! 🎉/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/4 ta yangi so'z Fleshkartalarga qo'shildi/i),
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
