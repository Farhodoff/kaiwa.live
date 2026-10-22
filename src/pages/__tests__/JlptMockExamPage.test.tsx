import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JlptMockExamPage } from '../JlptMockExamPage';
import { ExamService } from '../../services/ExamService';

const timingMockState = vi.hoisted(() => ({
  config: {} as Record<string, unknown>,
}));

const toastMock = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/use-toast', () => ({
  toast: toastMock,
}));

vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: { id: 'test-user-id', email: 'admin@example.com' },
    awardXP: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'uz' }),
}));

vi.mock('../../services/JlptTimingConfigService', () => ({
  JlptTimingConfigService: {
    getCachedConfig: () => timingMockState.config,
    loadConfig: async () => timingMockState.config,
    getLevelConfig: async () => null,
  },
}));

vi.mock('../../utils/ai/examEvaluator', () => ({
  evaluateMockExamSession: vi.fn().mockResolvedValue({
    percentage: 75,
    passed: true,
    actionable_recommendation: 'Davom eting.',
    jlptScoreReport: {},
    diagnosticAnalysis: {
      pillars: {
        grammar: { accuracyPercentage: 70 },
        kanji_vocab: { accuracyPercentage: 80 },
      },
    },
  }),
}));

vi.mock('../../services/HistoryService', () => ({
  HistoryService: { saveMockExam: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../services/MasteryEngine', () => ({
  MasteryEngine: { recordEvidence: vi.fn() },
}));

vi.mock('../../services/DailyQuestService', () => ({
  DailyQuestService: { recordMockScore: vi.fn() },
}));

vi.mock('../../services/MistakeVaultService', () => ({
  MistakeVaultService: { recordBatch: vi.fn() },
}));

vi.mock('../../components/jlpt/JlptExamResultCard', () => ({
  JlptExamResultCard: () => <div>JLPT Result Card Mock</div>,
}));

const examTitle = (level: string) => `JLPT ${level} Rasmiy Mock Test (2026)`;

const buildExamData = (level: string) => {
  const questions = [
    {
      id: 1,
      section: 'knowledge',
      questionText: `${level} knowledge savoli`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 1,
      explanationUzbek: 'Izoh',
    },
    {
      id: 2,
      section: 'reading',
      questionText: `${level} reading savoli`,
      passageText: `${level} reading matni`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanationUzbek: 'Izoh',
    },
    {
      id: 3,
      section: 'listening',
      questionText: `${level} listening savoli`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 2,
      explanationUzbek: 'Izoh',
    },
  ];

  if (level === 'N5') return { ...baseExam(level), questions: [questions[0]] };
  return { ...baseExam(level), questions };
};

const baseExam = (level: string) => ({
  id: `mock-${level.toLowerCase()}`,
  title: examTitle(level),
  level,
  timeLimitSeconds: 3000,
  isFromDb: true,
  isOfficialJlpt: level === 'N2' || level === 'N1',
});

vi.mock('../../services/ExamService', () => ({
  ExamService: {
    getPublishedJlptExams: vi.fn().mockImplementation(async (level: string) => [
      {
        id: `mock-${level.toLowerCase()}`,
        title: examTitle(level),
        description: 'Baza orqali yuklangan sinov.',
        type: `JLPT ${level}`,
        level,
        isPublished: true,
        isOfficialJlpt: level === 'N2' || level === 'N1',
        createdAt: '2026-09-01T00:00:00Z',
      },
    ]),
    getExamWithQuestions: vi
      .fn()
      .mockImplementation(async (_id: string, level: string) => buildExamData(level)),
    recordAnsweredQuestions: vi.fn(),
    getNoRepeatPeriodDays: vi.fn().mockReturnValue(30),
    setNoRepeatPeriodDays: vi.fn(),
  },
}));

const renderPage = (level: string) =>
  render(
    <MemoryRouter initialEntries={[`/jlpt?tab=mock&level=${level}`]}>
      <JlptMockExamPage />
    </MemoryRouter>,
  );

const startExam = async (level: string) => {
  await waitFor(() => {
    expect(screen.getByText(examTitle(level))).toBeInTheDocument();
  });
  fireEvent.click(screen.getByText('Mock Imtihonni Boshlash 🚀'));
  await waitFor(() => {
    expect(screen.getByText(`${level} knowledge savoli`)).toBeInTheDocument();
  });
};

describe('JlptMockExamPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    timingMockState.config = {};
    localStorage.clear();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders level selectors and loads published exams from ExamService', async () => {
    renderPage('N5');

    expect(screen.getByText('JLPT Full Simulation Exam')).toBeInTheDocument();
    expect(screen.getByText('N5')).toBeInTheDocument();
    expect(screen.getByText('N1')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(examTitle('N5'))).toBeInTheDocument();
      expect(screen.getByText('Amaliyot Mock')).toBeInTheDocument();
    });
  });

  it('shows a clear warning when the random generator cannot fill the exam', async () => {
    const warning =
      "N5 uchun 25 ta savol kerak edi, ammo faqat 2 ta mavjud (knowledge: 1/13, reading: 1/6, listening: 0/6). Iltimos, savollar bazasini to'ldiring.";
    vi.mocked(ExamService.getExamWithQuestions).mockResolvedValueOnce({
      ...buildExamData('N5'),
      generationWarnings: [warning],
    } as any);

    renderPage('N5');
    await waitFor(() => expect(screen.getByText(examTitle('N5'))).toBeInTheDocument());
    fireEvent.click(screen.getByText('Mock Imtihonni Boshlash 🚀'));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '⚠️ Savollar yetarli emas',
          description: expect.stringContaining('25 ta savol kerak edi'),
          variant: 'destructive',
        }),
      );
    });
  });

  it('lets users configure the no-repeat period for the random generator', async () => {
    vi.mocked(ExamService.getPublishedJlptExams).mockResolvedValueOnce([
      {
        id: 'builtin_n5_random',
        title: 'JLPT N5 Random',
        description: 'Tasodifiy variant',
        type: 'JLPT N5',
        level: 'N5',
        isPublished: true,
        createdAt: '2026-09-01T00:00:00Z',
      },
    ]);

    renderPage('N5');
    const periodSelect = await screen.findByTestId('jlpt-no-repeat-period');
    expect(periodSelect).toHaveValue('30');

    fireEvent.change(periodSelect, { target: { value: '7' } });
    expect(ExamService.setNoRepeatPeriodDays).toHaveBeenCalledWith(7);
  });

  it('renders official and practice mode selectors separately', async () => {
    renderPage('N5');

    expect(screen.getByText("Rasmiy Bo'limli Taymer")).toBeInTheDocument();
    expect(screen.getByText('Erkin Mashq Rejimi')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(examTitle('N5'))).toBeInTheDocument());
  });

  it('models N2 Language Knowledge + Reading as one official block and seals it together', async () => {
    renderPage('N2');
    await startExam('N2');

    expect(screen.getByText(/1 \/ 2-BO.LIM/i)).toBeInTheDocument();
    expect(screen.getByText(/Gengo Chishiki & Dokkai/)).toBeInTheDocument();
    expect(screen.getAllByText(/Choukai/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('読解'));
    expect(screen.getByText('N2 reading savoli')).toBeInTheDocument();

    fireEvent.click(screen.getByText('聴解'));
    expect(screen.getByText('N2 reading savoli')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/1-blokni muhrlash/i));
    expect(screen.getByText(/Blokni Muhrlash va Keyingisiga O'tish/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Ha, Muhrlab O'tish/i));

    await waitFor(() => {
      expect(screen.getByText(/2 \/ 2-BO.LIM/i)).toBeInTheDocument();
      expect(screen.getByText('N2 listening savoli')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('読解'));
    expect(screen.getByText('N2 listening savoli')).toBeInTheDocument();
    expect(screen.getByText(/muhrlangan/i)).toBeInTheDocument();
  });

  it('keeps practice mode free and uses one shared timer', async () => {
    renderPage('N2');
    await waitFor(() => expect(screen.getByText(examTitle('N2'))).toBeInTheDocument());

    fireEvent.click(screen.getByText('Erkin Mashq Rejimi'));
    fireEvent.click(screen.getByText('Mock Imtihonni Boshlash 🚀'));

    await waitFor(() => {
      expect(screen.getByText('N2 knowledge savoli')).toBeInTheDocument();
      expect(screen.getByText('(Umumiy)')).toBeInTheDocument();
    });
    expect(screen.queryByText(/BO.LIM/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('読解'));
    expect(screen.getByText('N2 reading savoli')).toBeInTheDocument();

    fireEvent.click(screen.getByText('言語知識'));
    expect(screen.getByText('N2 knowledge savoli')).toBeInTheDocument();
    expect(screen.queryByText(/Muhrlangan/i)).not.toBeInTheDocument();
  });

  it('shows which timing model was used on the result screen', async () => {
    renderPage('N5');
    await waitFor(() => expect(screen.getByText(examTitle('N5'))).toBeInTheDocument());

    fireEvent.click(screen.getByText('Erkin Mashq Rejimi'));
    fireEvent.click(screen.getByText('Mock Imtihonni Boshlash 🚀'));
    await waitFor(() => expect(screen.getByText('N5 knowledge savoli')).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Imtihonni Yakunlash/i));

    await waitFor(() => {
      expect(screen.getByTestId('jlpt-timing-model-summary')).toBeInTheDocument();
      expect(screen.getByText(/Practice \(erkin taymer, N5\)/)).toBeInTheDocument();
      expect(screen.getByText(/Yagona umumiy taymer/i)).toBeInTheDocument();
    });
  });

  it('ticks the official block timer and advances automatically when it expires', async () => {
    timingMockState.config = {
      N2: [
        { block: 'language_reading', officialMinutes: 1, simulationMinutes: 1 },
        { block: 'listening', officialMinutes: 1, simulationMinutes: 1 },
      ],
    };
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderPage('N2');
    await startExam('N2');

    expect(screen.getAllByText('01:00').length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() => expect(screen.getAllByText('00:59').length).toBeGreaterThan(0));

    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });
    await waitFor(() => {
      expect(screen.getByText(/2 \/ 2-BO.LIM/i)).toBeInTheDocument();
      expect(screen.getByText('N2 listening savoli')).toBeInTheDocument();
      expect(screen.getAllByText('01:00').length).toBeGreaterThan(0);
    });
  });
});
