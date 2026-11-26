import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { SpacedRepetitionSchedule } from '../SpacedRepetitionSchedule';
import type { Flashcard } from '../../../types';

vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({ refreshData: vi.fn() }),
}));
vi.mock('../../../services/SpacedRepetitionEngine', () => ({
  SpacedRepetitionEngine: {
    getLessonReviews: () => [],
    getFlashcardQueueSummary: () => ({
      overdueCount: 0,
      dueTodayCount: 0,
      newCount: 1,
      totalDueCount: 0,
      averageRetentionRate: 100,
    }),
    getFlashcardReviewForecast: () => [],
  },
}));
const newCard: Flashcard = {
  id: 'new',
  subjectId: 'n5',
  front: '猫',
  back: 'Mushuk',
  nextReviewDate: new Date().toISOString(),
  repetitions: 0,
  interval: 0,
  easeFactor: 2.5,
};

describe('Review schedule with new cards', () => {
  it('allows starting new cards without claiming perfect retention', () => {
    const start = vi.fn();
    render(
      <MemoryRouter>
        <SpacedRepetitionSchedule flashcards={[newCard]} onStartFlashcardReview={start} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Takrorlash (1)' }));
    expect(start).toHaveBeenCalledWith('all');
    expect(screen.getByText('Hali baholanmagan')).toBeInTheDocument();
    expect(screen.queryByText('100%')).toBeNull();
  });
  it('does not offer cards scheduled for the future or deleted cards', () => {
    render(
      <MemoryRouter>
        <SpacedRepetitionSchedule
          flashcards={[
            { ...newCard, nextReviewDate: '2099-01-01T00:00:00Z', interval: 1 },
            { ...newCard, id: 'deleted', deletedAt: new Date().toISOString() },
          ]}
          onStartFlashcardReview={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('button', { name: /^Takrorlash \(/ })).toBeNull();
  });
});
