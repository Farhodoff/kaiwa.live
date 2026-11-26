import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ActivityHeatmap from '../ActivityHeatmap';
import { ActivityLoggingService } from '../../../services/ActivityLoggingService';
import { MemoryRouter } from 'react-router-dom';

describe('ActivityHeatmap Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ActivityLoggingService, 'getActivities').mockResolvedValue([]);
  });

  it('renders heatmap container, title and 2026 calendar legend', async () => {
    render(
      <MemoryRouter>
        <ActivityHeatmap sessions={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/O'quv Faolligi/i)).toBeInTheDocument();
    expect(screen.queryByText(/Supabase Live/i)).toBeNull();
    expect(screen.getAllByText(/2026-yil/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Kam/i)).toBeInTheDocument();
    expect(screen.getByText(/Ko'p/i)).toBeInTheDocument();
  });

  it('opens day detail modal when clicking an active day cell', async () => {
    const activities = [
      {
        id: 'act-101',
        activityType: 'flashcards' as const,
        activityTitle: 'N5 Flashcardlar: 1-qism',
        durationMinutes: 20,
        itemsCount: 100,
        xpEarned: 50,
        activityDate: '2026-05-15',
        createdAt: '2026-05-15T09:00:00Z',
      },
    ];

    render(
      <MemoryRouter>
        <ActivityHeatmap activities={activities} sessions={[]} />
      </MemoryRouter>,
    );

    // Heatmap should render day elements with cursor-pointer
    const cells = document.querySelectorAll('.cursor-pointer');
    expect(cells.length).toBeGreaterThan(0);

    // Click on the first valid day cell
    fireEvent.click(cells[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Yopish/i })).toBeInTheDocument();
    });
  });
  it('lets keyboard users move between days and open a day record', () => {
    render(
      <MemoryRouter>
        <ActivityHeatmap activities={[]} sessions={[]} />
      </MemoryRouter>,
    );
    const day = screen.getByRole('button', { name: /^2026-05-15:/ });
    fireEvent.keyDown(day, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: /^2026-05-16:/ })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(screen.getByRole('button', { name: /Yopish/i })).toBeInTheDocument();
  });
});
