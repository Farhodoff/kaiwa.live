import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LessonPlayerPage } from '../LessonPlayerPage';
import { LessonService } from '../../services/LessonService';
import type { Lesson } from '../../types/lesson';

const effects = vi.hoisted(() => ({ xp: vi.fn(), signals: vi.fn(), log: vi.fn() }));
vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: { id: 'guest' },
    awardXP: effects.xp,
    settings: {},
    updateSettings: vi.fn(),
  }),
}));
vi.mock('../../services/LearningSignalService', () => ({
  LearningSignalService: { processLessonCompletion: effects.signals },
}));
vi.mock('../../services/ActivityLoggingService', () => ({
  ActivityLoggingService: { logActivity: effects.log },
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: vi.fn() }));
vi.mock('../../components/lesson/LearnStepView', () => ({
  LearnStepView: () => <h2>Material</h2>,
}));
vi.mock('../../components/lesson/PracticeStepView', () => ({
  PracticeStepView: ({ onCompletePractice }: any) => (
    <>
      <h2>Mustahkamlash</h2>
      <button onClick={() => onCompletePractice({ score: 1, total: 5 })}>Mashqdan yiqilish</button>
      <button onClick={() => onCompletePractice({ score: 4, total: 5 })}>Mashqdan o‘tish</button>
    </>
  ),
}));
vi.mock('../../components/lesson/TestStepView', () => ({
  TestStepView: ({ questions, onCompleteTest }: any) => (
    <>
      <h2>Test: {questions.length}</h2>
      <button
        onClick={() =>
          onCompleteTest({
            score: 0,
            total: questions.length,
            percentage: 100,
            missedQuestions: [
              {
                questionId: questions[0].id,
                prompt: 'Savol',
                userAnswer: 'B',
                expectedAnswer: 'A',
                explanation: 'Izoh',
              },
            ],
          })
        }
      >
        Testdan yiqilish
      </button>
      <button
        onClick={() =>
          onCompleteTest({
            score: questions.length === 4 ? 3 : 2,
            total: questions.length,
            percentage: 100,
            missedQuestions: [],
          })
        }
      >
        Testdan o‘tish
      </button>
    </>
  ),
}));
vi.mock('../../components/lesson/LessonCompletionView', () => ({
  LessonCompletionView: ({ scoreData }: any) => (
    <h2>
      Umumiy: {scoreData.score}/{scoreData.total} · {scoreData.percentage}%
    </h2>
  ),
}));
const questions = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `q${i}`,
    question: '',
    options: ['a', 'b'],
    correctAnswerIndex: 0,
    explanation: '',
  }));
const lesson: Lesson = {
  id: 'sequence',
  courseId: 'c',
  unitId: 'u',
  unitTitle: 'Unit',
  language: 'ja',
  level: 'N5',
  lessonNumber: 1,
  title: 'Ketma-ket dars',
  description: '',
  estimatedDurationMinutes: 1,
  steps: [
    {
      id: 'learn',
      type: 'learn',
      title: 'Material',
      estimatedMinutes: 1,
      learnData: { title: '', explanation: '' },
    },
    {
      id: 'practice',
      type: 'practice',
      title: 'Mashqlar',
      estimatedMinutes: 1,
      practiceData: {
        instructions: '',
        exercises: Array.from({ length: 5 }, (_, i) => ({
          id: `p${i}`,
          type: 'multiple-choice',
          prompt: '',
          options: ['a', 'b'],
          correctAnswer: 0,
        })),
      },
    },
    {
      id: 'test',
      type: 'test',
      title: 'Bilim testi',
      estimatedMinutes: 1,
      testData: { instructions: '', passingScorePercentage: 75, questions: questions(4) },
    },
    {
      id: 'listen-s4',
      type: 'test',
      title: 'Tinglash',
      estimatedMinutes: 1,
      testData: { instructions: '', passingScorePercentage: 75, questions: questions(2) },
    },
  ],
};
const show = (query = '') =>
  render(
    <MemoryRouter initialEntries={[`/lesson/sequence${query}`]}>
      <Routes>
        <Route path="/lesson/:lessonId" element={<LessonPlayerPage />} />
      </Routes>
    </MemoryRouter>,
  );
const next = () => screen.getByRole('button', { name: "Keyingi Qadamga O'tish" });

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.spyOn(LessonService, 'getLessonById').mockReturnValue(lesson);
  effects.xp.mockResolvedValue(undefined);
  effects.signals.mockResolvedValue({ newCardsCount: 0, mistakesCount: 0 });
  effects.log.mockResolvedValue(undefined);
});

describe('Connected lesson steps', () => {
  it('blocks direct URLs, step tabs and the selector until the previous stage is passed', async () => {
    show('?step=3');
    expect(screen.getByRole('heading', { name: 'Material' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Qadamga sakrash' })).toHaveValue('0');
    expect(screen.getByRole('button', { name: 'Tinglash' })).toBeDisabled();
    fireEvent.click(next());
    await screen.findByRole('heading', { name: 'Mustahkamlash' });
    expect(next()).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Mashqdan yiqilish' }));
    await waitFor(() =>
      expect(
        LessonService.getLessonProgress('guest', 'sequence')?.stepResults?.practice.score,
      ).toBe(1),
    );
    expect(next()).toBeDisabled();
    expect(effects.xp).not.toHaveBeenCalled();
  });
  it('persists stages across reload, requires both tests, sums scores and awards completion once', async () => {
    let view = show();
    fireEvent.click(next());
    await screen.findByRole('heading', { name: 'Mustahkamlash' });
    fireEvent.click(screen.getByRole('button', { name: 'Mashqdan o‘tish' }));
    await waitFor(() => expect(next()).toBeEnabled());
    fireEvent.click(next());
    await screen.findByRole('heading', { name: 'Test: 4' });
    fireEvent.click(screen.getByRole('button', { name: 'Testdan yiqilish' }));
    await waitFor(() =>
      expect(LessonService.getLessonProgress('guest', 'sequence')?.stepResults?.test.score).toBe(0),
    );
    expect(next()).toBeDisabled();
    view.unmount();
    view = show('?step=3');
    expect(screen.getByRole('heading', { name: 'Test: 4' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Testdan o‘tish' }));
    await screen.findByRole('heading', { name: 'Test: 2' });
    expect(screen.queryByText(/Umumiy:/)).toBeNull();
    const finish = screen.getByRole('button', { name: 'Testdan o‘tish' });
    fireEvent.click(finish);
    fireEvent.click(finish);
    expect(await screen.findByRole('heading', { name: 'Umumiy: 9/11 · 82%' })).toBeInTheDocument();
    await waitFor(() => expect(effects.signals).toHaveBeenCalledOnce());
    expect(effects.xp).toHaveBeenCalledExactlyOnceWith(50);
    expect(effects.signals.mock.calls[0][3]).toEqual(
      expect.arrayContaining([expect.objectContaining({ userAnswer: 'B', stepId: 'test' })]),
    );
    expect(LessonService.getLessonProgress('guest', 'sequence')?.isCompleted).toBe(true);
    view.unmount();
    show();
    expect(screen.getByRole('heading', { name: 'Umumiy: 9/11 · 82%' })).toBeInTheDocument();
    expect(effects.xp).toHaveBeenCalledOnce();
  });
  it('keeps the learner on the current stage if saving fails', async () => {
    vi.spyOn(LessonService, 'saveLessonProgress').mockRejectedValueOnce(new Error('Storage full'));
    show();
    fireEvent.click(next());
    expect(await screen.findByRole('alert')).toHaveTextContent('Natija saqlanmadi');
    expect(screen.getByRole('heading', { name: 'Material' })).toBeInTheDocument();
    expect(effects.xp).not.toHaveBeenCalled();
  });
  it('resumes at the next unfinished stage after passing practice and closing the page', async () => {
    const view = show();
    fireEvent.click(next());
    await screen.findByRole('heading', { name: 'Mustahkamlash' });
    fireEvent.click(screen.getByRole('button', { name: 'Mashqdan o‘tish' }));
    await waitFor(() => expect(next()).toBeEnabled());
    view.unmount();
    show();
    expect(screen.getByRole('heading', { name: 'Test: 4' })).toBeInTheDocument();
    expect(next()).toBeDisabled();
  });
});
