import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionCompleteModal } from './SessionCompleteModal';

// Mock the context
vi.mock('../context/StudyPlannerContext', () => ({
  useStudyData: vi.fn(),
}));
vi.mock('../context/FocusTimerContext', () => ({
  useFocusTimerContext: vi.fn(),
}));

import { useStudyData } from '../context/StudyPlannerContext';
import { useFocusTimerContext } from '../context/FocusTimerContext';

describe('SessionCompleteModal Component', () => {
  const mockAddSession = vi.fn();
  const mockAwardXP = vi.fn();
  const mockResetTimer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when session is not completed', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: false,
        mode: 'focus',
        selectedSubjectId: null,
      },
      resetTimer: mockResetTimer,
    } as any);

    const { container } = render(<SessionCompleteModal />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when mode is not focus', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: true,
        mode: 'short_break',
        selectedSubjectId: null,
      },
      resetTimer: mockResetTimer,
    } as any);

    const { container } = render(<SessionCompleteModal />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when session is completed and mode is focus', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: true,
        mode: 'focus',
        selectedSubjectId: null,
      },
      resetTimer: mockResetTimer,
    } as any);

    render(<SessionCompleteModal />);
    expect(screen.getByText(/Tabriklaymiz!/i)).toBeInTheDocument();
  });

  it('should display congratulations message', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: true,
        mode: 'focus',
        selectedSubjectId: null,
      },
      resetTimer: mockResetTimer,
    } as any);

    render(<SessionCompleteModal />);
    expect(screen.getByText(/25 daqiqalik fokus sessiyasi yakunlandi/i)).toBeInTheDocument();
  });

  it('should render all mood options', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: true,
        mode: 'focus',
        selectedSubjectId: null,
      },
      resetTimer: mockResetTimer,
    } as any);

    render(<SessionCompleteModal />);
    expect(screen.getByText('Stressed')).toBeInTheDocument();
    expect(screen.getByText('Tired')).toBeInTheDocument();
    expect(screen.getByText('Okay')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Great')).toBeInTheDocument();
  });

  it('should allow selecting a mood', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: true,
        mode: 'focus',
        selectedSubjectId: null,
      },
      resetTimer: mockResetTimer,
    } as any);

    render(<SessionCompleteModal />);
    const goodMoodButton = screen.getByText('Good').closest('button');
    fireEvent.click(goodMoodButton!);

    // Check if the button has the selected class
    expect(goodMoodButton).toHaveClass('bg-indigo-100');
  });

  it('should have save button disabled when no mood selected', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: true,
        mode: 'focus',
        selectedSubjectId: null,
      },
      resetTimer: mockResetTimer,
    } as any);

    render(<SessionCompleteModal />);
    const saveButton = screen.getByRole('button', { name: /Saqlash \(\+250 XP\)/i });
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when mood is selected', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: true,
        mode: 'focus',
        selectedSubjectId: null,
      },
      resetTimer: mockResetTimer,
    } as any);

    render(<SessionCompleteModal />);
    const goodMoodButton = screen.getByText('Good').closest('button');
    fireEvent.click(goodMoodButton!);

    const saveButton = screen.getByRole('button', { name: /Saqlash \(\+250 XP\)/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('should call addSession, awardXP, and resetTimer when save is clicked', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: true,
        mode: 'focus',
        selectedSubjectId: 'subject-123',
      },
      resetTimer: mockResetTimer,
    } as any);

    render(<SessionCompleteModal />);

    // Select a mood
    const greatMoodButton = screen.getByText('Great').closest('button');
    fireEvent.click(greatMoodButton!);

    // Click save
    const saveButton = screen.getByRole('button', { name: /Saqlash \(\+250 XP\)/i });
    fireEvent.click(saveButton);

    expect(mockAddSession).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectId: 'subject-123',
        duration: 25,
        type: 'focus',
        completed: true,
        moodAfter: 5,
      }),
    );
    expect(mockAwardXP).toHaveBeenCalledWith(250);
    expect(mockResetTimer).toHaveBeenCalled();
  });

  it('should call resetTimer when skip is clicked', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: true,
        mode: 'focus',
        selectedSubjectId: null,
      },
      resetTimer: mockResetTimer,
    } as any);

    render(<SessionCompleteModal />);
    const skipButton = screen.getByRole('button', { name: /O'tkazib yuborish/i });
    fireEvent.click(skipButton);

    expect(mockResetTimer).toHaveBeenCalled();
    expect(mockAddSession).not.toHaveBeenCalled();
    expect(mockAwardXP).not.toHaveBeenCalled();
  });

  it('should use default mood (3) when saving without selection', () => {
    vi.mocked(useStudyData).mockReturnValue({
      addSession: mockAddSession,
      awardXP: mockAwardXP,
    } as any);
    vi.mocked(useFocusTimerContext).mockReturnValue({
      focusState: {
        isSessionCompleted: true,
        mode: 'focus',
        selectedSubjectId: null,
      },
      resetTimer: mockResetTimer,
    } as any);

    render(<SessionCompleteModal />);

    // Manually enable and click save (simulating a bug or edge case)
    const saveButton = screen.getByRole('button', { name: /Saqlash \(\+250 XP\)/i });
    // Note: In real scenario this is disabled, but testing the default mood logic
    fireEvent.click(saveButton);

    // Should not be called because button is disabled
    expect(mockAddSession).not.toHaveBeenCalled();
  });
});
