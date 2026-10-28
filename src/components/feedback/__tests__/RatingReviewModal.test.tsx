import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RatingReviewModal } from '../RatingReviewModal';

describe('RatingReviewModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<RatingReviewModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.queryByText(/kaiwa\.live ilovasi sizga yoqdimi\?/i)).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(<RatingReviewModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.getByText(/kaiwa\.live ilovasi sizga yoqdimi\?/i)).toBeDefined();
    expect(screen.getByRole('radiogroup', { name: /Baho tanlang/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/Ilovada nima yoqdi/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Baholash va Yuborish/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Keyinroq/i })).toBeDefined();
  });

  it('calls onClose when Keyinroq button is clicked', () => {
    render(<RatingReviewModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    const cancelButton = screen.getByRole('button', { name: /Keyinroq/i });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows selecting different star ratings and typing a comment', async () => {
    mockOnSubmit.mockResolvedValueOnce({ success: true, message: 'Qabul qilindi' });

    render(<RatingReviewModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    // Click 4th star
    const star4 = screen.getByRole('radio', { name: '4 yulduzcha' });
    fireEvent.click(star4);
    expect(screen.getByText(/Yaxshi, ma'qul keldi/i)).toBeDefined();

    // Type a comment
    const textarea = screen.getByPlaceholderText(/Ilovada nima yoqdi/i);
    fireEvent.change(textarea, { target: { value: 'Ajoyib platforma!' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Baholash va Yuborish/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 4,
          comment: 'Ajoyib platforma!',
        }),
      );
    });
  });

  it('displays error text when submission fails', async () => {
    mockOnSubmit.mockResolvedValueOnce({
      success: false,
      error: 'Tarmoq xatosi yuz berdi',
    });

    render(<RatingReviewModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /Baholash va Yuborish/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Tarmoq xatosi yuz berdi/i)).toBeDefined();
    });
  });

  it('displays success state when submission succeeds', async () => {
    mockOnSubmit.mockResolvedValueOnce({ success: true });

    render(<RatingReviewModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /Baholash va Yuborish/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Katta rahmat!/i)).toBeDefined();
    });
  });
});
