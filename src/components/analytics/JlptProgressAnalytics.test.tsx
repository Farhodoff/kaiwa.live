import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { JlptProgressAnalytics } from './JlptProgressAnalytics';
import { HistoryService } from '../../services/HistoryService';

// Mock HistoryService
vi.mock('../../services/HistoryService', () => ({
  HistoryService: {
    getMockExamsHistory: vi.fn(),
    getSpeakingHistory: vi.fn(),
  },
}));

// Mock ResizeObserver for Recharts in jsdom environment
(globalThis as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('JlptProgressAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders empty history state correctly', async () => {
    vi.mocked(HistoryService.getMockExamsHistory).mockResolvedValue([]);
    vi.mocked(HistoryService.getSpeakingHistory).mockResolvedValue([]);

    render(<JlptProgressAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/JLPT & Kaiwa Japanese Progress/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Hozircha JLPT imtihon sinovlari tarixi mavjud emas/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getByText(/- \/ 10|-\/10/)).toBeInTheDocument();
  });

  it('filters JLPT exams and JA speaking sessions and calculates KPI metrics', async () => {
    vi.mocked(HistoryService.getMockExamsHistory).mockResolvedValue([
      {
        id: '1',
        examType: 'jlpt',
        level: 'N3',
        score: 50,
        totalQuestions: 100,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        examType: 'jlpt',
        level: 'N3',
        score: 80,
        totalQuestions: 100,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        examType: 'ielts_reading',
        score: 30,
        totalQuestions: 40,
        createdAt: new Date().toISOString(),
      },
    ]);

    vi.mocked(HistoryService.getSpeakingHistory).mockResolvedValue([
      {
        id: 's1',
        language: 'ja',
        persona: 'Sensei',
        durationSeconds: 120,
        fluencyScore: 8.5,
        pronunciationScore: 8.0,
        transcript: 'test',
        feedback: 'good',
        createdAt: new Date().toISOString(),
      },
      {
        id: 's2',
        language: 'en',
        persona: 'Native',
        durationSeconds: 120,
        fluencyScore: 9.0,
        pronunciationScore: 9.0,
        transcript: 'test',
        feedback: 'good',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<JlptProgressAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/JLPT & Kaiwa Japanese Progress/i)).toBeInTheDocument();
    });

    // JLPT exam count: 2 (ielts filtered out)
    expect(screen.getByText('2')).toBeInTheDocument();

    // Kaiwa sessions count: 1 (en filtered out)
    expect(screen.getByText('1')).toBeInTheDocument();

    // Highest score out of 180: Math.round((80/100) * 180) = 144
    expect(screen.getByText('144')).toBeInTheDocument();

    // Average fluency: 8.5 / 10 -> '8.5'
    expect(screen.getByText(/8\.5/i)).toBeInTheDocument();
  });

  it('renders target plan badge when saved in localStorage', async () => {
    vi.mocked(HistoryService.getMockExamsHistory).mockResolvedValue([]);
    vi.mocked(HistoryService.getSpeakingHistory).mockResolvedValue([]);

    localStorage.setItem(
      'study_planner_jlpt_user_target',
      JSON.stringify({ currentLevel: 'N4', targetLevel: 'N2' }),
    );

    render(<JlptProgressAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/Target: N4 ➔ N2/i)).toBeInTheDocument();
    });
  });

  it('handles service errors gracefully without crashing', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(HistoryService.getMockExamsHistory).mockRejectedValue(new Error('Network error'));
    vi.mocked(HistoryService.getSpeakingHistory).mockRejectedValue(new Error('Network error'));

    render(<JlptProgressAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/JLPT & Kaiwa Japanese Progress/i)).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
