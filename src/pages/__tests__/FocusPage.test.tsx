import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FocusPage from '../FocusPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    addSession: vi.fn(),
    awardXP: vi.fn(),
    tasks: [],
    updateTaskStatus: vi.fn(),
    user: { id: 'test-user-1' },
    primaryLanguage: 'ja',
  }),
}));

const mockStartTimer = vi.fn();
vi.mock('../../context/FocusTimerContext', () => ({
  useFocusTimerContext: () => ({
    focusState: {
      timeLeft: 1500,
      isActive: false,
      mode: 'focus',
      selectedTaskId: null,
      selectedSubjectId: null,
    },
    startTimer: mockStartTimer,
    pauseTimer: vi.fn(),
    resetTimer: vi.fn(),
    switchMode: vi.fn(),
    setCustomTime: vi.fn(),
    setFocusTask: vi.fn(),
  }),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'uz',
  }),
}));

vi.mock('../../services/PersonalLearningPlanService', () => ({
  PersonalLearningPlanService: {
    recordPlanTaskProgress: vi.fn(),
  },
}));

vi.mock('../../services/LearningSignalService', () => ({
  LearningSignalService: {
    recordActivity: vi.fn(),
  },
}));

describe('FocusPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders focus controls and durations properly', () => {
    render(
      <MemoryRouter initialEntries={['/focus']}>
        <Routes>
          <Route path="/focus" element={<FocusPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Fokus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Qisqa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Uzun' })).toBeInTheDocument();
  });

  it('renders Live Study Room banner and navigates to /room/library when clicked', () => {
    render(
      <MemoryRouter initialEntries={['/focus']}>
        <Routes>
          <Route path="/focus" element={<FocusPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Jonli O'quv Xonasi \(Study Room\)/i)).toBeInTheDocument();
    const joinBtn = screen.getByText('Kirish');
    expect(joinBtn).toBeInTheDocument();

    fireEvent.click(joinBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/room/library');
  });

  it('starts timer immediately when Boshlash is clicked without asking for mood', () => {
    render(
      <MemoryRouter initialEntries={['/focus']}>
        <Routes>
          <Route path="/focus" element={<FocusPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const startBtn = screen.getByRole('button', { name: /Boshlash/i });
    expect(startBtn).toBeInTheDocument();

    fireEvent.click(startBtn);

    // Timer starts immediately without any mood check-in
    expect(mockStartTimer).toHaveBeenCalled();
    expect(screen.queryByText(/his qilyapsiz/i)).not.toBeInTheDocument();
  });
});
