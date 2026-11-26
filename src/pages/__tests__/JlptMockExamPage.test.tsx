import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JlptMockExamPage } from '../JlptMockExamPage';
import { TimedSkillAssessmentService } from '../../services/TimedSkillAssessmentService';
import { ExamService } from '../../services/ExamService';
import { readExamDraft, examDraftKey } from '../../utils/examSession';
import { HistoryService } from '../../services/HistoryService';
import { evaluateMockExamSession } from '../../utils/ai/examEvaluator';

const timingMockState = vi.hoisted(() => ({
  config: {} as Record<string, unknown>,
  userId: 'test-user-id',
}));

const toastMock = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/use-toast', () => ({
  toast: toastMock,
}));

vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: { id: timingMockState.userId, email: 'admin@example.com' },
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
    expect(screen.getByRole('option', { name: 'Sinov (2026)' })).toBeInTheDocument();
  });
  fireEvent.click(screen.getByText('Boshlash'));
  await waitFor(() => {
    expect(screen.getByText(`${level} knowledge savoli`)).toBeInTheDocument();
  });
};

describe('JlptMockExamPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    timingMockState.config = {};
    timingMockState.userId = 'test-user-id';
    localStorage.clear();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves an unanswered session and resumes its exact variant without fetching new questions', async () => {
    const view = renderPage('N2');
    await startExam('N2');
    await waitFor(() => expect(readExamDraft('test-user-id')).not.toBeNull());
    const saved = readExamDraft('test-user-id')!;
    expect(saved.answers).toEqual({});
    expect(saved.exam.questions).toHaveLength(3);
    view.unmount();
    vi.mocked(ExamService.getExamWithQuestions).mockClear();
    renderPage('N2');
    fireEvent.click(screen.getByRole('button', { name: 'Davom ettirish' }));
    expect(await screen.findByText('N2 knowledge savoli')).toBeInTheDocument();
    expect(ExamService.getExamWithQuestions).not.toHaveBeenCalled();
    expect(readExamDraft('test-user-id')?.deadline).toBe(saved.deadline);
  });

  it('does not restore a different student’s draft', async () => {
    const view = renderPage('N2');
    await startExam('N2');
    await waitFor(() => expect(readExamDraft('test-user-id')).not.toBeNull());
    const saved = localStorage.getItem(examDraftKey('test-user-id'))!;
    view.unmount();
    localStorage.removeItem(examDraftKey('test-user-id'));
    localStorage.setItem(examDraftKey('another-student'), saved);
    renderPage('N2');
    expect(screen.queryByRole('button', { name: 'Davom ettirish' })).toBeNull();
  });

  it('keeps deterministic results and saved history when AI analysis fails', async () => {
    vi.mocked(evaluateMockExamSession).mockRejectedValueOnce(new Error('AI unavailable'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const view = renderPage('N5');
    await startExam('N5');
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    fireEvent.click(screen.getByText(/Imtihonni Yakunlash/i));
    expect(await screen.findByRole('region', { name: 'Javoblar natijasi' })).toBeInTheDocument();
    expect(HistoryService.saveMockExam).toHaveBeenCalledWith(
      expect.objectContaining({ score: 1, totalQuestions: 1 }),
    );
    await waitFor(() => expect(evaluateMockExamSession).toHaveBeenCalled());
    expect(readExamDraft('test-user-id')).toBeNull();
    view.unmount();
    expect(readExamDraft('test-user-id')).toBeNull();
    error.mockRestore();
  });

  it('unloads the in-memory attempt when the signed-in account changes', async () => {
    const view = renderPage('N2');
    await startExam('N2');
    await waitFor(() => expect(readExamDraft('test-user-id')).not.toBeNull());
    timingMockState.userId = 'another-student';
    view.rerender(
      <MemoryRouter initialEntries={['/jlpt?tab=mock&level=N2']}>
        <JlptMockExamPage />
      </MemoryRouter>,
    );
    expect(screen.queryByText('N2 knowledge savoli')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Davom ettirish' })).toBeNull();
    expect(readExamDraft('test-user-id')).not.toBeNull();
    expect(readExamDraft('another-student')).toBeNull();
  });

  it('catches up through expired blocks after the browser was suspended and submits once', async () => {
    timingMockState.config = {
      N2: [
        { block: 'language_reading', officialMinutes: 1, simulationMinutes: 1 },
        { block: 'listening', officialMinutes: 1, simulationMinutes: 1 },
      ],
    };
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderPage('N2');
    await startExam('N2');
    const saved = readExamDraft('test-user-id')!;
    act(() => {
      vi.setSystemTime(saved.startedAt + 150000);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(await screen.findByRole('region', { name: 'Javoblar natijasi' })).toBeInTheDocument();
    expect(HistoryService.saveMockExam).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new Event('focus'));
      vi.advanceTimersByTime(5000);
    });
    expect(HistoryService.saveMockExam).toHaveBeenCalledTimes(1);
  });

  it('uses one variant selector with short labels and no duplicated variant buttons', async () => {
    renderPage('N3');
    const selector = await screen.findByRole('combobox', { name: 'Sinov' });
    await waitFor(() => expect(selector).toHaveValue('mock-n3'));
    expect(screen.getByRole('option', { name: 'Variant A' })).toHaveValue('builtin_n3');
    expect(screen.queryByRole('button', { name: 'Variant A' })).toBeNull();
    expect(screen.queryByText('180 ballik rasmiy format')).toBeNull();
    fireEvent.change(selector, { target: { value: 'builtin_n3_set2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Boshlash' }));
    await screen.findByText('N3 knowledge savoli');
    expect(ExamService.getExamWithQuestions).toHaveBeenCalledWith('builtin_n3_set2', 'N3');
  });

  it('renders level selectors and loads published exams from ExamService', async () => {
    renderPage('N5');

    expect(screen.getByText('Sinovni tanlang')).toBeInTheDocument();
    expect(screen.getByText('N5')).toBeInTheDocument();
    expect(screen.getByText('N1')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Sinov (2026)' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Sinov' })).toHaveValue('mock-n5');
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
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Sinov (2026)' })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText('Boshlash'));

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
    fireEvent.click(await screen.findByText('Aralash variant sozlamalari'));
    const periodSelect = await screen.findByTestId('jlpt-no-repeat-period');
    expect(periodSelect).toHaveValue('30');

    fireEvent.change(periodSelect, { target: { value: '7' } });
    expect(ExamService.setNoRepeatPeriodDays).toHaveBeenCalledWith(7);
  });

  it('renders official and practice mode selectors separately', async () => {
    renderPage('N5');

    expect(screen.getByText('Imtihon')).toBeInTheDocument();
    expect(screen.getByText('Mashq')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Sinov (2026)' })).toBeInTheDocument(),
    );
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
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Sinov (2026)' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText('Mashq'));
    fireEvent.click(screen.getByText('Boshlash'));

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

  it('records the final changed answer only when the exam is submitted', async () => {
    const record = vi.spyOn(TimedSkillAssessmentService, 'record');
    renderPage('N5');
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Sinov (2026)' })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText('Mashq'));
    fireEvent.click(screen.getByText('Boshlash'));
    await screen.findByText('N5 knowledge savoli');
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(record).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(/Imtihonni Yakunlash/i));
    await screen.findByTestId('jlpt-timing-model-summary');
    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ skill: 'knowledge', correct: true, skipped: false }),
      'test-user-id',
    );
    record.mockRestore();
  });

  it('shows which timing model was used on the result screen', async () => {
    renderPage('N5');
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Sinov (2026)' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText('Mashq'));
    fireEvent.click(screen.getByText('Boshlash'));
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
      expect(screen.getAllByText('00:59').length).toBeGreaterThan(0);
    });
  });
});
