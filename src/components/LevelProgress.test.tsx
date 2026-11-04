import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LevelProgress from './LevelProgress';

// Mock the context
vi.mock('../context/StudyPlannerContext', async () => {
  const actual = await vi.importActual('../context/StudyPlannerContext');
  return {
    ...actual,
    useStudyData: vi.fn(),
  };
});

import { useStudyData } from '../context/StudyPlannerContext';

describe('LevelProgress Component', () => {
  it('should render level 1 for 0 XP', () => {
    vi.mocked(useStudyData).mockReturnValue({
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        lastActivityDate: null,
      },
    } as any);

    render(<LevelProgress />);
    expect(screen.getByText(/Lvl 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Boshlang'ich Talaba/i)).toBeInTheDocument();
  });

  it('should display current XP', () => {
    vi.mocked(useStudyData).mockReturnValue({
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        totalXp: 250,
        level: 1,
        currentStreak: 0,
        lastActivityDate: null,
      },
    } as any);

    render(<LevelProgress />);
    // Use getAllByText and check the first one (current XP display)
    const xpElements = screen.getAllByText(/250 XP/i);
    expect(xpElements.length).toBeGreaterThan(0);
  });

  it('should display XP to next level', () => {
    vi.mocked(useStudyData).mockReturnValue({
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        totalXp: 250,
        level: 1,
        currentStreak: 0,
        lastActivityDate: null,
      },
    } as any);

    render(<LevelProgress />);
    expect(screen.getByText(/keyingisiga 250 XP/i)).toBeInTheDocument();
  });

  it('should display current streak', () => {
    vi.mocked(useStudyData).mockReturnValue({
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        totalXp: 500,
        level: 2,
        currentStreak: 5,
        lastActivityDate: new Date().toISOString(),
      },
    } as any);

    render(<LevelProgress />);
    expect(screen.getByText(/5 Kunlik Streak/i)).toBeInTheDocument();
  });

  it('should render level 2 for 500 XP', () => {
    vi.mocked(useStudyData).mockReturnValue({
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        totalXp: 500,
        level: 2,
        currentStreak: 0,
        lastActivityDate: null,
      },
    } as any);

    render(<LevelProgress />);
    expect(screen.getByText(/Lvl 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Shogird/i)).toBeInTheDocument();
  });

  it('should render level 5 for 5000 XP', () => {
    vi.mocked(useStudyData).mockReturnValue({
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        totalXp: 5000,
        level: 5,
        currentStreak: 10,
        lastActivityDate: null,
      },
    } as any);

    render(<LevelProgress />);
    expect(screen.getByText(/Lvl 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Ekspert/i)).toBeInTheDocument();
  });

  it('should handle undefined totalXp gracefully', () => {
    vi.mocked(useStudyData).mockReturnValue({
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        totalXp: undefined as any,
        level: 1,
        currentStreak: 0,
        lastActivityDate: null,
      },
    } as any);

    render(<LevelProgress />);
    expect(screen.getByText(/Lvl 1/i)).toBeInTheDocument();
  });

  it('should display 0 streak when currentStreak is undefined', () => {
    vi.mocked(useStudyData).mockReturnValue({
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        totalXp: 100,
        level: 1,
        currentStreak: undefined as any,
        lastActivityDate: null,
      },
    } as any);

    render(<LevelProgress />);
    expect(screen.getByText(/0 Kunlik Streak/i)).toBeInTheDocument();
  });

  it('should render progress bar', () => {
    vi.mocked(useStudyData).mockReturnValue({
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        totalXp: 250,
        level: 1,
        currentStreak: 0,
        lastActivityDate: null,
      },
    } as any);

    const { container } = render(<LevelProgress />);
    const progressBar = container.querySelector('.h-full.bg-white\\/90');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '50%' }); // 250/500 = 50%
  });
});
