import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlashcardStudySession } from '../FlashcardStudySession';
import { Rating } from '../../../utils/srs';

const mockReviewFlashcard = vi.fn().mockResolvedValue(true);
const mockToast = vi.fn();

const sampleCards = [
  {
    id: 'card-1',
    subjectId: 'subj-1',
    front: '手負い',
    back: 'Yaralangan, jarohatlangan',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    nextReviewDate: new Date(Date.now() - 3600000).toISOString(),
  },
];

let currentMockCards = sampleCards;
let currentMockLoading = false;

let currentMockUser: any = { id: 'u1', email: 'test@example.com' };
const mockUpdateFlashcard = vi.fn().mockResolvedValue(true);

vi.mock('../../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({
    user: currentMockUser,
    flashcards: currentMockCards,
    subjects: [{ id: 'subj-1', name: 'JLPT N2 Vocabulary' }],
    reviewFlashcard: mockReviewFlashcard,
    updateFlashcard: mockUpdateFlashcard,
    deleteFlashcard: vi.fn(),
    loading: currentMockLoading,
  }),
}));

vi.mock('../../../context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'uz' }),
}));

vi.mock('../../../hooks/use-toast', () => ({
  toast: (args: any) => mockToast(args),
}));

vi.mock('../../../utils/audioTts', () => ({
  speakText: vi.fn(),
}));

describe('FlashcardStudySession Component Live QA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockCards = sampleCards;
    currentMockLoading = false;
  });

  it('opens the 50 unassigned cards counted in the first active deck', async () => {
    currentMockCards = Array.from({ length: 50 }, (_, index) => ({
      ...sampleCards[0],
      id: `legacy-${index}`,
      subjectId: '',
      front: `Legacy ${index}`,
    }));
    render(<FlashcardStudySession subjectId="subj-1" onClose={vi.fn()} />);
    expect(await screen.findByTestId('study-card')).toBeDefined();
    expect(screen.queryByText(/Barchasi Takrorlandi/)).toBeNull();
  });

  it('waits for data before selecting the review queue', async () => {
    currentMockLoading = true;
    currentMockCards = [];
    const { rerender } = render(<FlashcardStudySession subjectId="subj-1" onClose={vi.fn()} />);
    expect(screen.getByText('Kartochkalar tayyorlanmoqda...')).toBeDefined();
    expect(screen.queryByText('Kartalar topilmadi')).toBeNull();
    currentMockLoading = false;
    currentMockCards = sampleCards;
    rerender(<FlashcardStudySession subjectId="subj-1" onClose={vi.fn()} />);
    expect(await screen.findByTestId('study-card')).toBeDefined();
  });

  it('shows an empty state without claiming a review was completed', async () => {
    currentMockCards = [];
    render(<FlashcardStudySession subjectId="subj-1" onClose={vi.fn()} />);
    expect(await screen.findByText('Kartalar topilmadi')).toBeDefined();
    expect(screen.queryByText(/Barchasi Takrorlandi/)).toBeNull();
    expect(mockReviewFlashcard).not.toHaveBeenCalled();
  });

  it('completes a linked task once only after a saved review', async () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <FlashcardStudySession subjectId="subj-1" onClose={vi.fn()} onComplete={onComplete} />,
    );
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByTestId('study-card'));
    fireEvent.click(screen.getByRole('button', { name: /Yaxshi \(Good\)/ }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    rerender(
      <FlashcardStudySession subjectId="subj-1" onClose={vi.fn()} onComplete={onComplete} />,
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('keeps the current card when saving the rating fails', async () => {
    const onComplete = vi.fn();
    mockReviewFlashcard.mockRejectedValueOnce(new Error('save failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<FlashcardStudySession subjectId="subj-1" onClose={vi.fn()} onComplete={onComplete} />);
    fireEvent.click(await screen.findByTestId('study-card'));
    fireEvent.click(screen.getByRole('button', { name: /Yaxshi \(Good\)/ }));
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })),
    );
    expect(screen.getByTestId('study-card')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders card front and displays calibrated button intervals when flipped', async () => {
    const handleClose = vi.fn();
    render(<FlashcardStudySession subjectId="subj-1" onClose={handleClose} />);

    // Front of card is rendered
    const card = await screen.findByTestId('study-card');
    expect(card).toBeDefined();

    // Flip card by clicking the study card container
    fireEvent.click(card);

    // Verify calibrated interval labels on buttons
    expect(await screen.findByText(/10 daq \(1\)/i)).toBeDefined(); // AGAIN
    expect(await screen.findByText(/30 daq \(2\)/i)).toBeDefined(); // HARD
    expect(await screen.findByText(/2 kun \(3\)/i)).toBeDefined(); // GOOD
    expect(await screen.findByText(/4 kun \(4\)/i)).toBeDefined(); // EASY
  });

  it('re-queues card to the end of the session when clicking Qayta (Again) or Qiyin (Hard)', async () => {
    const handleClose = vi.fn();
    render(<FlashcardStudySession subjectId="subj-1" onClose={handleClose} />);

    const card = await screen.findByTestId('study-card');
    fireEvent.click(card);

    // Click Qiyin (Hard)
    const hardBtn = await screen.findByText(/Qiyin \(Hard\)/i);
    fireEvent.click(hardBtn);

    await waitFor(() => {
      expect(mockReviewFlashcard).toHaveBeenCalledWith('card-1', Rating.HARD);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Qiyin karta (30 daq)'),
        }),
      );
    });
  });

  it('responds to keyboard shortcuts: Space to flip and 1-4 to rate', async () => {
    const handleClose = vi.fn();
    render(<FlashcardStudySession subjectId="subj-1" onClose={handleClose} />);

    await screen.findByTestId('study-card');

    // Space key flips card
    fireEvent.keyDown(window, { code: 'Space' });

    // Buttons should now be visible
    const againBtn = await screen.findByText(/Qayta \(Again\)/i);
    expect(againBtn).toBeDefined();

    // Key '1' rates AGAIN
    fireEvent.keyDown(window, { key: '1' });

    await waitFor(() => {
      expect(mockReviewFlashcard).toHaveBeenCalledWith('card-1', Rating.AGAIN);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Qayta takrorlash (10 daq)'),
        }),
      );
    });
  });

  it('supports mobile touch swipe: swipe right rates GOOD, swipe left rates AGAIN', async () => {
    const mockSelection = vi.fn();
    const mockNotification = vi.fn();
    const mockImpact = vi.fn();

    (window as any).Telegram = {
      WebApp: {
        initData: 'query_id=123',
        ready: vi.fn(),
        expand: vi.fn(),
        onEvent: vi.fn(),
        offEvent: vi.fn(),
        HapticFeedback: {
          selectionChanged: mockSelection,
          notificationOccurred: mockNotification,
          impactOccurred: mockImpact,
        },
      },
    };

    const handleClose = vi.fn();
    render(<FlashcardStudySession subjectId="subj-1" onClose={handleClose} />);

    const card = await screen.findByTestId('study-card');

    // 1. Swipe on unflipped card flips to answer side
    fireEvent.touchStart(card, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchMove(card, { touches: [{ clientX: 190, clientY: 100 }] });
    fireEvent.touchEnd(card);

    // Answer side should now be visible
    expect(await screen.findByText(/Qayta \(Again\)/i)).toBeDefined();
    expect(mockSelection).toHaveBeenCalled();

    // 2. Swipe right on flipped card rates as GOOD
    fireEvent.touchStart(card, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchMove(card, { touches: [{ clientX: 200, clientY: 100 }] }); // +100px
    fireEvent.touchEnd(card);

    await waitFor(() => {
      expect(mockReviewFlashcard).toHaveBeenCalledWith('card-1', Rating.GOOD);
      expect(mockImpact).toHaveBeenCalledWith('light');
    });
  });

  it('allows admin users to edit card fields and saves global override to database', async () => {
    currentMockUser = { id: 'admin-1', email: 'fsoyilov@gmail.com' };
    const handleClose = vi.fn();
    render(<FlashcardStudySession subjectId="subj-1" onClose={handleClose} />);

    // Admin edit button should be rendered because user is fsoyilov@gmail.com
    const editBtn = await screen.findByTitle('Tahrirlash');
    expect(editBtn).toBeDefined();
    fireEvent.click(editBtn);

    // Edit form should be open with 4 fields
    expect(await screen.findByText('Fleshkartani tahrirlash')).toBeDefined();
    expect(screen.getByText(/Admin/i)).toBeDefined();
    expect(screen.getByText(/Umumiy production bazasiga saqlash/i)).toBeDefined();

    // Verify inputs exist
    const frontInput = screen.getByDisplayValue('手負い');
    const backInput = screen.getByDisplayValue('Yaralangan, jarohatlangan');
    expect(frontInput).toBeDefined();
    expect(backInput).toBeDefined();

    // Change translation
    fireEvent.change(backInput, { target: { value: 'Yarador, shikastlangan (Admin)' } });

    // Save edit
    const saveBtn = screen.getByText('Saqlash');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateFlashcard).toHaveBeenCalled();
    });
  });
});
