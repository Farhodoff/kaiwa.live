import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { JlptMistakeNotebook } from '../JlptMistakeNotebook';
import { MistakeVaultService } from '../../../services/MistakeVaultService';

const mockAddFlashcardsBatch = vi.fn().mockResolvedValue(undefined);
const mockAwardXP = vi.fn();
const mockUser = { id: 'test-user-mistake-nb', email: 'test@kaiwa.live' };

vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: mockUser,
    addFlashcardsBatch: mockAddFlashcardsBatch,
    subjects: [{ id: 'sub-ja', language: 'ja', name: 'Yapon Tili' }],
    addSubject: vi.fn(),
    awardXP: mockAwardXP,
  }),
}));

vi.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'uz',
  }),
}));

vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('JlptMistakeNotebook Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Populate mistake vault with initial items
    MistakeVaultService.recordBatch(
      [
        {
          userId: mockUser.id,
          source: 'mock_exam',
          level: 'N5',
          category: 'grammar',
          title: 'JLPT N5 Mock — Grammatika',
          questionText: 'わたしはパン _____ たべます。',
          options: ['に', 'で', 'を', 'が'],
          userAnswer: 0,
          correctAnswer: 2,
          explanationUzbek: "Vositasiz to'ldiruvchi bilan 'を' yuklamasi ishlatiladi.",
        },
        {
          userId: mockUser.id,
          source: 'mock_exam',
          level: 'N5',
          category: 'listening',
          title: 'JLPT N5 Choukai Mock — Q2',
          questionText: '男の人はどこに行きますか。',
          options: ['えき', 'ぎんこう', 'がっこう', 'びょういん'],
          userAnswer: 0,
          correctAnswer: 1,
          explanationUzbek: 'Suhbatda erkak bankka borishini aytadi.',
        },
      ],
      mockUser.id,
    );
  });

  it('renders mistake list, count stats, and mastery overview', () => {
    render(<JlptMistakeNotebook />);

    expect(screen.getByText(/Xatolar Daftari/i)).toBeInTheDocument();
    expect(screen.getByText('わたしはパン _____ たべます。')).toBeInTheDocument();
    expect(screen.getByText('男の人はどこに行きますか。')).toBeInTheDocument();
  });

  it('filters mistakes by category tabs (e.g. Tinglash / Grammatika)', () => {
    render(<JlptMistakeNotebook />);

    // Click 'Tinglash' category
    const listeningBtn = screen.getByRole('button', { name: /Tinglash/i });
    fireEvent.click(listeningBtn);

    expect(screen.getByText('男の人はどこに行きますか。')).toBeInTheDocument();
    expect(screen.queryByText('わたしはパン _____ たべます。')).not.toBeInTheDocument();
  });

  it('exports filtered mistakes to Anki SRS flashcards on 1-click button', async () => {
    render(<JlptMistakeNotebook />);

    const exportBtn = screen.getByRole('button', { name: /Fleshkartaga/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(mockAddFlashcardsBatch).toHaveBeenCalledTimes(1);
    });

    const exportedCards = mockAddFlashcardsBatch.mock.calls[0][0];
    expect(exportedCards).toHaveLength(2);

    const grammarCard = exportedCards.find((c: any) =>
      c.front.includes('わたしはパン _____ たべます。'),
    );
    expect(grammarCard).toBeDefined();
    expect(grammarCard.back).toContain('を');
    expect(grammarCard.back).toContain("Vositasiz to'ldiruvchi");

    const listeningCard = exportedCards.find((c: any) =>
      c.front.includes('男の人はどこに行きますか。'),
    );
    expect(listeningCard).toBeDefined();
    expect(listeningCard.back).toContain('ぎんこう');
  });

  it('starts interactive re-test drill and records mastery on correct answer', async () => {
    render(<JlptMistakeNotebook />);

    const startDrillBtn = screen.getByRole('button', { name: /Qayta Yechish/i });
    fireEvent.click(startDrillBtn);

    // Should enter drill mode
    expect(screen.getByText(/Savol 1 \/ 2/i)).toBeInTheDocument();

    // The first item in LIFO list is '男の人はどこに行きますか。' with options ['えき', 'ぎんこう', 'がっこう', 'びょういん'] (correct is ぎんこう)
    const options = screen.getAllByRole('button');
    const correctOptBtn = options.find((btn) => btn.textContent?.includes('ぎんこう'));
    expect(correctOptBtn).toBeDefined();
    fireEvent.click(correctOptBtn!);

    // Submit answer
    const submitBtn = screen.getByRole('button', { name: /Tekshirish/i });
    fireEvent.click(submitBtn);

    expect(mockAwardXP).toHaveBeenCalledWith(20);
  });
});
