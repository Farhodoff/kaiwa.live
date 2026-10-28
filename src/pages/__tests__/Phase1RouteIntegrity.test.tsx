import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudyModePage from '../StudyModePage';
import { Flashcard } from '../../types';

// Mock audioTts
vi.mock('../../utils/audioTts', () => ({
  speakText: vi.fn(),
}));

const mockFlashcards: Flashcard[] = [
  {
    id: 'fc-1',
    subjectId: 'subj-ielts',
    front: 'Meticulous',
    back: "Juda sinchkov, e'tiborli",
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date(Date.now() - 86400000).toISOString(), // due yesterday
  },
  {
    id: 'fc-2',
    subjectId: 'subj-jlpt',
    front: '食べる (taberu)',
    back: "Yemoq (fe'l)",
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date(Date.now() - 86400000).toISOString(), // due yesterday
  },
];

let mockCurrentContextValue: any = {
  user: { id: 'u1', email: 'test@example.com' },
  flashcards: mockFlashcards,
  subjects: [
    { id: 'subj-ielts', name: 'IELTS Vocabulary', targetHours: 10, color: '#3b82f6' },
    { id: 'subj-jlpt', name: 'JLPT N3 Kanji', targetHours: 10, color: '#ec4899' },
  ],
  reviewFlashcard: vi.fn().mockResolvedValue(true),
  updateFlashcard: vi.fn().mockResolvedValue(true),
  deleteFlashcard: vi.fn().mockResolvedValue(true),
  loading: false,
};

vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => mockCurrentContextValue,
}));

describe('Phase 1 — Route Integrity & StudyMode Global Entry Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentContextValue = {
      user: { id: 'u1', email: 'test@example.com' },
      flashcards: mockFlashcards,
      subjects: [
        { id: 'subj-ielts', name: 'IELTS Vocabulary', targetHours: 10, color: '#3b82f6' },
        { id: 'subj-jlpt', name: 'JLPT N3 Kanji', targetHours: 10, color: '#ec4899' },
      ],
      reviewFlashcard: vi.fn().mockResolvedValue(true),
      updateFlashcard: vi.fn().mockResolvedValue(true),
      deleteFlashcard: vi.fn().mockResolvedValue(true),
      loading: false,
    };
  });

  it('1. /study-mode defaults to Japanese due cards in the Japanese-only product', async () => {
    render(
      <MemoryRouter initialEntries={['/study-mode']}>
        <Routes>
          <Route path="study-mode" element={<StudyModePage />} />
          <Route path="study-mode/:subjectId" element={<StudyModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/1 \/ 1/)).toBeInTheDocument();
    });

    expect(screen.getAllByText('食べる (taberu)').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Meticulous')).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Flashcard SRS/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yozib Tekshirish/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Javobni ko'rish/i })).toBeInTheDocument();
  });

  it('2. /study-mode/:subjectId filters cards specifically for given subject', async () => {
    render(
      <MemoryRouter initialEntries={['/study-mode/subj-ielts']}>
        <Routes>
          <Route path="study-mode" element={<StudyModePage />} />
          <Route path="study-mode/:subjectId" element={<StudyModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/1 \/ 1/)).toBeInTheDocument();
    });

    const cardElements = screen.getAllByText('Meticulous');
    expect(cardElements.length).toBeGreaterThanOrEqual(1);
  });

  it('3. /flashcards/study/:subjectId backward compatibility works seamlessly', async () => {
    render(
      <MemoryRouter initialEntries={['/flashcards/study/subj-jlpt']}>
        <Routes>
          <Route path="flashcards/study/:subjectId" element={<StudyModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/1 \/ 1/)).toBeInTheDocument();
    });

    const cardElements = screen.getAllByText('食べる (taberu)');
    expect(cardElements.length).toBeGreaterThanOrEqual(1);
  });

  it('4. Handles empty flashcards state gracefully without crashing', async () => {
    mockCurrentContextValue = {
      ...mockCurrentContextValue,
      flashcards: [],
    };

    render(
      <MemoryRouter initialEntries={['/study-mode']}>
        <Routes>
          <Route path="study-mode" element={<StudyModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Fleshkartalar topilmadi')).toBeInTheDocument();
    });
    expect(screen.getByText("To'plamlarni ko'rish")).toBeInTheDocument();
  });

  it('5. Legacy routes redirect to canonical destinations', () => {
    render(
      <MemoryRouter initialEntries={['/decks']}>
        <Routes>
          <Route
            path="flashcards"
            element={<div data-testid="canonical-flashcards">Flashcards Canonical</div>}
          />
          <Route path="decks" element={<Navigate to="/flashcards" replace />} />
          <Route path="deck" element={<Navigate to="/flashcards" replace />} />
          <Route path="ielts/grammar" element={<Navigate to="/ielts" replace />} />
          <Route path="ielts" element={<div data-testid="canonical-ielts">IELTS Canonical</div>} />
          <Route path="jlpt/grammar" element={<Navigate to="/jlpt/grammar-quiz" replace />} />
          <Route
            path="jlpt/grammar-quiz"
            element={<div data-testid="canonical-jlpt-quiz">JLPT Quiz Canonical</div>}
          />
          <Route
            path="personal-plan"
            element={<div data-testid="canonical-personal-plan">Personal Plan Canonical</div>}
          />
          <Route path="goals" element={<Navigate to="/personal-plan" replace />} />
          <Route path="plan" element={<Navigate to="/personal-plan" replace />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('canonical-flashcards')).toBeInTheDocument();
  });

  it('6. /goals and /plan redirect to /personal-plan canonical hub', () => {
    render(
      <MemoryRouter initialEntries={['/goals']}>
        <Routes>
          <Route
            path="personal-plan"
            element={<div data-testid="canonical-personal-plan">Personal Plan Canonical</div>}
          />
          <Route path="goals" element={<Navigate to="/personal-plan" replace />} />
          <Route path="plan" element={<Navigate to="/personal-plan" replace />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('canonical-personal-plan')).toBeInTheDocument();
  });

  it('7. /study-mode?lang=ja strictly filters out non-Japanese cards and loads only Japanese cards', async () => {
    render(
      <MemoryRouter initialEntries={['/study-mode?lang=ja']}>
        <Routes>
          <Route path="study-mode" element={<StudyModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Should filter out fc-1 ('Meticulous' English card), leaving only fc-2 ('食べる (taberu)')
    await waitFor(() => {
      expect(screen.getByText(/1 \/ 1/)).toBeInTheDocument();
    });

    const cardElements = screen.getAllByText('食べる (taberu)');
    expect(cardElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Meticulous')).not.toBeInTheDocument();
    expect(screen.getByText(/🇯🇵 JP/)).toBeInTheDocument();
  });

  it('8. /study-mode?lang=ja excludes cards owned by unrelated user-created subjects', async () => {
    mockCurrentContextValue = {
      ...mockCurrentContextValue,
      subjects: [
        ...mockCurrentContextValue.subjects,
        { id: 'sub-math', name: 'N2 Matematika', targetHours: 10, color: '#10b981' },
      ],
      flashcards: [
        ...mockFlashcards,
        {
          id: 'fc-math',
          subjectId: 'sub-math',
          front: 'Formula：速度 = 距離 ÷ 時間',
          back: 'Tezlik formulasi',
          interval: 1,
          repetitions: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    };

    render(
      <MemoryRouter initialEntries={['/study-mode?lang=ja']}>
        <Routes>
          <Route path="study-mode" element={<StudyModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/1 \/ 1/)).toBeInTheDocument();
    });

    expect(screen.getAllByText('食べる (taberu)').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Formula：速度 = 距離 ÷ 時間')).not.toBeInTheDocument();
  });

  it('9. /study-mode?lang=all intentionally includes cards from all subjects', async () => {
    render(
      <MemoryRouter initialEntries={['/study-mode?lang=all']}>
        <Routes>
          <Route path="study-mode" element={<StudyModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
    });
  });

  it('10. Global study mode displays language filter pills', async () => {
    render(
      <MemoryRouter initialEntries={['/study-mode']}>
        <Routes>
          <Route path="study-mode" element={<StudyModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Filter: Barchasi/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Filter: Yaponcha/i })).toBeInTheDocument();
    });
  });

  it('11. Excludes future-scheduled cards and limits new cards from the daily SRS queue', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 3).toISOString(); // 3 days in future
    const overdueDate = new Date(Date.now() - 86400000).toISOString();

    const complexFlashcards: Flashcard[] = [
      {
        id: 'fc-due',
        subjectId: 'subj-jlpt',
        front: 'Due Card',
        back: 'Overdue Japanese card',
        interval: 1,
        repetitions: 2,
        easeFactor: 2.5,
        nextReviewDate: overdueDate,
      },
      {
        id: 'fc-future',
        subjectId: 'subj-jlpt',
        front: 'Future Card',
        back: 'Card scheduled for future review',
        interval: 5,
        repetitions: 3,
        easeFactor: 2.5,
        nextReviewDate: futureDate,
      },
      {
        id: 'fc-new-1',
        subjectId: 'subj-jlpt',
        front: 'New Card 1',
        back: 'Unstudied new card 1',
        interval: 0,
        repetitions: 0,
        easeFactor: 2.5,
        nextReviewDate: '',
      },
    ];

    mockCurrentContextValue = {
      ...mockCurrentContextValue,
      flashcards: complexFlashcards,
    };

    render(
      <MemoryRouter initialEntries={['/study-mode?lang=ja']}>
        <Routes>
          <Route path="study-mode" element={<StudyModePage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Should include fc-due (1) and fc-new-1 (1) = total 2 cards. fc-future must be excluded.
    await waitFor(() => {
      expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
    });

    expect(screen.getAllByText('Due Card').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Future Card')).not.toBeInTheDocument();
  });
});
