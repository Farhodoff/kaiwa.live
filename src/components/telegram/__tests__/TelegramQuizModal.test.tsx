import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TelegramQuizModal } from '../TelegramQuizModal';
import { useGamificationStore } from '../../../stores';

describe('TelegramQuizModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGamificationStore.setState({ totalXp: 100, currentStreak: 3 });
  });

  it('renders modal when isOpen is true', () => {
    render(<TelegramQuizModal isOpen={true} onClose={vi.fn()} defaultLevel="N5" />);

    expect(screen.getByRole('dialog', { name: /JLPT Tezkor Quiz/i })).toBeInTheDocument();
    expect(screen.getByText(/JLPT Tezkor Mini-Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/Savol 1 \//i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<TelegramQuizModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<TelegramQuizModal isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: /Yopish/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('allows answering a question and shows explanation and next button', () => {
    render(<TelegramQuizModal isOpen={true} onClose={vi.fn()} defaultLevel="N5" />);

    // Click first option
    const optionButtons = screen
      .getAllByRole('button')
      .filter(
        (btn) =>
          !btn.getAttribute('aria-label') &&
          !['ALL', 'N5', 'N4', 'N3'].includes(btn.textContent || ''),
      );
    expect(optionButtons.length).toBeGreaterThanOrEqual(4);

    fireEvent.click(optionButtons[0]);

    // Should reveal feedback
    expect(screen.getByText(/Barakalla, to'g'ri javob!|Noto'g'ri javob/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Keyingi Savol|Natijani Ko'rish/i }),
    ).toBeInTheDocument();
  });
});
