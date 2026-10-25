import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeeklyStudyDigest } from '../WeeklyStudyDigest';
import { UserLearningActivity } from '../../../services/ActivityLoggingService';
import { format } from 'date-fns';

describe('WeeklyStudyDigest Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const mockActivities: UserLearningActivity[] = [
    {
      id: 'act-1',
      activityType: 'flashcards',
      activityTitle: 'N5 Flashcards',
      durationMinutes: 15,
      itemsCount: 20,
      xpEarned: 35,
      activityDate: todayStr,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'act-2',
      activityType: 'speaking',
      activityTitle: 'AI Coach Yuki',
      durationMinutes: 10,
      itemsCount: 1,
      xpEarned: 40,
      activityDate: todayStr,
      createdAt: new Date().toISOString(),
    },
  ];

  it('renders weekly digest title, day bars, and aggregated metrics', () => {
    render(<WeeklyStudyDigest activities={mockActivities} />);

    expect(screen.getByText("Haftalik Digest & Sur'at")).toBeInTheDocument();
    expect(screen.getByText('Kunlik Faollik (Daqiqalar)')).toBeInTheDocument();

    // Check aggregated cards
    expect(screen.getByText("O'qish Vaqti")).toBeInTheDocument();
    expect(screen.getByText("To'plangan XP")).toBeInTheDocument();
    expect(screen.getByText("So'z & Iboralar")).toBeInTheDocument();
    expect(screen.getByText('AI Speaking')).toBeInTheDocument();

    // Minutes: 15 + 10 = 25 daq
    expect(screen.getByText('25')).toBeInTheDocument();
    // XP: 35 + 40 = 75 XP
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('allows clicking on a day bar to view detailed day stats', () => {
    render(<WeeklyStudyDigest activities={mockActivities} />);

    // Click the today day button
    const dayButtons = screen.getAllByRole('button', { name: /:\s*\d+\s*daqiqa/i });
    expect(dayButtons.length).toBe(7);

    // Click the last button (today)
    fireEvent.click(dayButtons[6]);

    expect(screen.getByText(/25 daqiqa dars/i)).toBeInTheDocument();
    expect(screen.getByText(/75 XP to'plandi/i)).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByText('Yopish');
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/25 daqiqa dars/i)).not.toBeInTheDocument();
  });

  it('handles sharing and copying weekly report to clipboard', () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<WeeklyStudyDigest activities={mockActivities} />);

    const shareBtn = screen.getByTitle('Hisobotni nusxalash');
    fireEvent.click(shareBtn);

    expect(writeTextMock).toHaveBeenCalled();
    const copiedText = writeTextMock.mock.calls[0][0];
    expect(copiedText).toContain("kaiwa.live — Haftalik O'rganish Hisoboti");
    expect(copiedText).toContain('25 daqiqa');
    expect(copiedText).toContain('75 XP');
  });
});
