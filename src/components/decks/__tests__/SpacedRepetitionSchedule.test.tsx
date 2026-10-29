import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SpacedRepetitionSchedule } from '../SpacedRepetitionSchedule';
import { SpacedRepetitionEngine } from '../../../services/SpacedRepetitionEngine';
import { TaskService } from '../../../services/TaskService';
import type { Task } from '../../../types';

const { refreshData, toast } = vi.hoisted(() => ({
  refreshData: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({ refreshData }),
}));
vi.mock('../../../hooks/use-toast', () => ({ toast }));

const userId = 'srs-schedule-test-user';
const renderSchedule = () =>
  render(
    <MemoryRouter>
      <SpacedRepetitionSchedule flashcards={[]} userId={userId} />
    </MemoryRouter>,
  );

describe('SpacedRepetitionSchedule task synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    refreshData.mockResolvedValue(undefined);
    SpacedRepetitionEngine.scheduleLessonReview(userId, 'ja-n3-u1-l1', {
      quizScorePercentage: 70,
      baseDate: new Date('2026-10-10T00:00:00.000Z'),
    });
    vi.spyOn(TaskService, 'addTask').mockImplementation(
      async (_, taskData) =>
        ({
          ...taskData,
          id: 'review-task-1',
          createdAt: new Date().toISOString(),
        }) as Task,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates one planner task across repeated clicks and remounts', async () => {
    const view = renderSchedule();
    fireEvent.click(screen.getByRole('button', { name: 'Rejaga Vazifa Qilish' }));
    await waitFor(() => expect(refreshData).toHaveBeenCalledTimes(1));
    await screen.findByRole('button', { name: 'Rejaga Vazifa Qilish' });

    fireEvent.click(screen.getByRole('button', { name: 'Rejaga Vazifa Qilish' }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Barchasi dolzarb! ✨',
        }),
      ),
    );
    expect(TaskService.addTask).toHaveBeenCalledTimes(1);
    expect(refreshData).toHaveBeenCalledTimes(1);

    view.unmount();
    toast.mockClear();
    renderSchedule();
    fireEvent.click(screen.getByRole('button', { name: 'Rejaga Vazifa Qilish' }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Barchasi dolzarb! ✨',
        }),
      ),
    );
    expect(TaskService.addTask).toHaveBeenCalledTimes(1);
  });

  it('disables synchronization while task creation is pending', async () => {
    let finishCreation!: () => void;
    vi.mocked(TaskService.addTask).mockImplementationOnce(
      (_, taskData) =>
        new Promise((resolve) => {
          finishCreation = () =>
            resolve({
              ...taskData,
              id: 'review-task-1',
              createdAt: new Date().toISOString(),
            } as Task);
        }),
    );
    renderSchedule();
    fireEvent.click(screen.getByRole('button', { name: 'Rejaga Vazifa Qilish' }));

    const pendingButton = screen.getByRole('button', { name: "Bog'lanmoqda..." });
    expect(pendingButton).toBeDisabled();
    fireEvent.click(pendingButton);
    await waitFor(() => expect(TaskService.addTask).toHaveBeenCalledTimes(1));

    await act(async () => {
      finishCreation();
    });
    expect(screen.getByRole('button', { name: 'Rejaga Vazifa Qilish' })).toBeEnabled();
    expect(refreshData).toHaveBeenCalledTimes(1);
  });
});
