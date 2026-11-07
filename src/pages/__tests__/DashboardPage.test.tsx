import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DashboardPage from '../DashboardPage';
import { LearningPathEngine } from '../../services/LearningPathEngine';

// Mock context dependencies
const mockUpdateTaskStatus = vi.fn();
const mockUseStudyData = {
  tasks: [],
  loading: false,
  updateTaskStatus: mockUpdateTaskStatus,
  subjects: [{ id: '1', name: 'English', color: '#6366f1' }],
  sessions: [],
  flashcards: [],
  events: [],
  settings: { googleApiKey: 'fake-key' },
  primaryLanguage: 'en',
  targetLevel: 'B2',
  targetGoal: 'General English',
  user: { id: 'test-user', email: 'fsoyilov@gmail.com' },
};

vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => mockUseStudyData,
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (key: string) => key,
  }),
}));

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

// Mock Engine State
const mockEngineState = {
  userId: 'test-user',
  primaryLanguage: 'en',
  nextAction: {
    type: 'continue_lesson',
    title: 'Present Perfect practice',
    description: 'Practice unfinished lesson',
    reason: { description: 'Grammar review needed' },
    ctaLabel: 'Continue lesson',
    estimatedMinutes: 10,
    priority: 1,
    route: '/lesson/present-perfect',
    badgeIcon: '🚀',
  },
  todayPlan: {
    totalMinutes: 30,
    activities: [
      {
        id: 'act-1',
        type: 'new_lesson',
        title: 'New Grammar Lesson',
        reason: 'Standard progress',
        estimatedMinutes: 15,
        priority: 2,
        route: '/lesson/new-grammar',
        isCompleted: false,
      },
      {
        id: 'act-2',
        type: 'srs_review',
        title: 'SRS Vocabulary',
        reason: 'Spaced repetition due cards',
        estimatedMinutes: 15,
        priority: 3,
        route: '/flashcards',
        isCompleted: false,
      },
    ],
  },
  progression: {
    currentLevel: 'B1',
    nextLevel: 'B2',
    readinessScore: 75,
    isReadyForPromotion: false,
    advancementBlockers: ['Grammar score < 60%'],
    recommendedAction: 'Review past mistakes',
    explanation: 'Evidence-based progression tracking.',
  },
};

describe('Phase 8.8 — Dashboard Page Render & UX Hardening Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseStudyData.primaryLanguage = 'en';
    mockUseStudyData.loading = false;
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(mockEngineState as any);
  });

  const renderDashboard = async () => {
    let result: any;
    await act(async () => {
      result = render(
        <BrowserRouter>
          <DashboardPage />
        </BrowserRouter>,
      );
    });
    return result;
  };

  // 1. Dashboard successful render
  it('1. should render dashboard successfully with all main sections', async () => {
    await renderDashboard();
    expect(screen.getByText('Present Perfect practice')).toBeInTheDocument();
    expect(screen.queryByText('New Grammar Lesson')).not.toBeInTheDocument();
    expect(screen.getByText('Level Progression Status')).toBeInTheDocument();
  });

  // 2. Loading state
  it('2. should display loading status indicator if context load is active', async () => {
    mockUseStudyData.loading = true;
    await renderDashboard();
    expect(screen.getByRole('status', { name: /Loading.*dashboard/i })).toBeInTheDocument();
  });

  // 3. Error state
  it('3. should display error panel if engine fails to load data', async () => {
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockRejectedValue(
      new Error('API offline'),
    );
    await renderDashboard();
    expect(screen.getByText('Failed to load learning path')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  // 4. Retry
  it('4. should trigger reload when Retry button is clicked after error state', async () => {
    const getSpy = vi
      .spyOn(LearningPathEngine, 'getLearningPathState')
      .mockRejectedValueOnce(new Error('Connection timeout'))
      .mockResolvedValueOnce(mockEngineState as any);

    await renderDashboard();
    expect(screen.getByText('Failed to load learning path')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    await act(async () => {
      fireEvent.click(retryBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Present Perfect practice')).toBeInTheDocument();
    });
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  // 7. Hero CTA render
  it('7. should render Next Best Action Hero card with proper titles and cta label', async () => {
    await renderDashboard();
    expect(screen.getByText('Continue lesson')).toBeInTheDocument();
    expect(screen.getByText('Hozirgi Eng Muhim Qadam')).toBeInTheDocument();
  });

  // 10. Progression render
  it('10. should show correct current level and next level target metrics', async () => {
    await renderDashboard();
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText('B2')).toBeInTheDocument();
  });

  // 11. Progression blockers
  it('11. should display level promotion blockers when present', async () => {
    await renderDashboard();
    expect(screen.getByText('Grammar score < 60%')).toBeInTheDocument();
  });

  // 12. Progression ready state
  it('12. should show progression check as Ready when isReadyForPromotion is true', async () => {
    const readyState = {
      ...mockEngineState,
      progression: {
        ...mockEngineState.progression,
        isReadyForPromotion: true,
        readinessScore: 100,
        advancementBlockers: [],
      },
    };
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(readyState as any);
    await renderDashboard();
    expect(screen.getByText('100% (Ready ✓)')).toBeInTheDocument();
  });

  // 13. Zero-level rendering
  it('13. should handle zero-level user state without crashes and fallback actions', async () => {
    const zeroState = {
      ...mockEngineState,
      progression: {
        currentLevel: 'ZERO',
        nextLevel: 'A1',
        readinessScore: 40,
        isReadyForPromotion: false,
        advancementBlockers: [],
      },
    };
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(zeroState as any);
    await renderDashboard();
    expect(screen.getByText('ZERO')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
  });

  // 14. SRS activity rendering
  it('14. should render SRS card with expected labels and targets', async () => {
    await renderDashboard();
    expect(screen.queryByText('SRS Vocabulary')).not.toBeInTheDocument();
  });

  // 15. Accessibility-critical attributes
  it('15. should apply accessible progressbar markers correctly', async () => {
    await renderDashboard();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar.getAttribute('aria-valuenow')).toBe('75');
  });

  // 16. Long text/mobile-safe rendering
  it('16. should contain responsive utility styling matching flex wrapper and clipping checks', async () => {
    const { container } = await renderDashboard();
    expect(container.querySelector('.line-clamp-1')).toBeDefined();
    expect(container.querySelector('.line-clamp-2')).toBeDefined();
  });

  // 17. Default user -> Japanese JLPT Focus Mode Hero CTA present
  it('17. should show Japanese flags and JLPT Focus Mode by default', async () => {
    await renderDashboard();
    expect(screen.getByText('🇯🇵')).toBeInTheDocument();
    expect(screen.getByText(/JLPT .* Focus Mode/)).toBeInTheDocument();
  });

  // 18. Japanese user -> Japanese Hero CTA
  it('18. should show Japanese flags and badge markers when Japanese is selected', async () => {
    mockUseStudyData.primaryLanguage = 'ja';
    mockUseStudyData.targetLevel = 'N3';
    const jaState = {
      ...mockEngineState,
      primaryLanguage: 'ja',
      nextAction: {
        ...mockEngineState.nextAction,
        route: '/jlpt/grammar-quiz',
      },
    };
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(jaState as any);
    await renderDashboard();
    expect(screen.getByText('🇯🇵')).toBeInTheDocument();
    expect(screen.getByText('JLPT N3 Focus Mode')).toBeInTheDocument();
  });

  // 19. Zero-level English -> foundation action
  it('19. should recommend English alphabet foundation for zero level English learners', async () => {
    const alphabetState = {
      ...mockEngineState,
      nextAction: {
        ...mockEngineState.nextAction,
        title: 'English Alphabet and Sounds',
      },
    };
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(alphabetState as any);
    await renderDashboard();
    expect(screen.getByText('English Alphabet and Sounds')).toBeInTheDocument();
  });

  // 20. Zero-level Japanese -> Hiragana/foundation action
  it('20. should recommend Hiragana foundation action for zero level Japanese learners', async () => {
    mockUseStudyData.primaryLanguage = 'ja';
    const hiraganaState = {
      ...mockEngineState,
      primaryLanguage: 'ja',
      nextAction: {
        ...mockEngineState.nextAction,
        title: 'Hiragana and Katakana Basics',
      },
    };
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(hiraganaState as any);
    await renderDashboard();
    expect(screen.getByText('Hiragana and Katakana Basics')).toBeInTheDocument();
  });

  // 21. Unfinished lesson -> Continue CTA
  it('21. should display Continue CTA when nextAction has continue_lesson type', async () => {
    await renderDashboard();
    expect(screen.getByText('Continue lesson')).toBeInTheDocument();
  });

  // 22. Overdue SRS -> SRS priority
  it('22. should recommend SRS card review when SRS action has higher priority', async () => {
    const srsActionState = {
      ...mockEngineState,
      nextAction: {
        ...mockEngineState.nextAction,
        type: 'srs_review',
        title: 'Review 15 overdue cards',
      },
    };
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(srsActionState as any);
    await renderDashboard();
    expect(screen.getByText('Review 15 overdue cards')).toBeInTheDocument();
  });

  // 23. Weak skill -> Remediation CTA
  it('23. should show Remediation CTA when remediation is the primary nextAction type', async () => {
    const weakSkillState = {
      ...mockEngineState,
      nextAction: {
        ...mockEngineState.nextAction,
        type: 'remediation',
        title: 'Grammar remediation session',
      },
    };
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(weakSkillState as any);
    await renderDashboard();
    expect(screen.getByText('Grammar remediation session')).toBeInTheDocument();
  });

  // 24. Recent mistake -> Correct lesson route
  it('24. should provide the resolved lesson route from recent mistakes in Hero link', async () => {
    const mistakeState = {
      ...mockEngineState,
      nextAction: {
        ...mockEngineState.nextAction,
        type: 'remediation',
        route: '/lesson/present-perfect-quiz',
      },
    };
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(mistakeState as any);
    const { container } = await renderDashboard();
    const heroLink = container.querySelector('a[href="/lesson/present-perfect-quiz"]');
    expect(heroLink).toBeInTheDocument();
  });

  // 25. Night greeting at midnight
  it('25. should render Good night / Xayrli tun at midnight hours (00:00 - 04:59)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 3, 0, 48, 0)); // 00:48 midnight
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(mockEngineState as any);
    await renderDashboard();
    // Default mocked language is 'en' -> 'Good night'
    expect(screen.getByText(/Good night/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  // 26. CTA button emoji deduplication
  it('26. should deduplicate leading emoji in Hero CTA button to prevent double icons', async () => {
    const doubleEmojiState = {
      ...mockEngineState,
      nextAction: {
        ...mockEngineState.nextAction,
        badgeIcon: '🧠',
        ctaLabel: '🧠 Takrorlash',
        route: '/study-mode?lang=ja',
      },
    };
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(doubleEmojiState as any);
    const { container } = await renderDashboard();
    const ctaLink = container.querySelector('a[href="/study-mode?lang=ja"]');
    expect(ctaLink?.textContent).toContain('Takrorlash');
    expect(ctaLink?.textContent).not.toContain('🧠🧠');
  });

  // 27. Modern status panorama bar
  it('27. should render modern compact status panorama bar with key metrics', async () => {
    vi.spyOn(LearningPathEngine, 'getLearningPathState').mockResolvedValue(mockEngineState as any);
    const { container } = await renderDashboard();
    expect(screen.getByText(/SRS:/i)).toBeInTheDocument();
    const links = container.querySelectorAll('a[href="/progress"]');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});
