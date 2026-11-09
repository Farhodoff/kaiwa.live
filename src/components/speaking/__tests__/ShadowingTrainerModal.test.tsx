import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShadowingTrainerModal, ShadowingTarget } from '../ShadowingTrainerModal';

describe('ShadowingTrainerModal', () => {
  const mockTarget: ShadowingTarget = {
    id: 'test-1',
    japanese: '日本[にほん]へ行[い]きます。',
    romaji: 'Nihon e ikimasu.',
    uzbek: 'Yaponiyaga boraman.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ShadowingTrainerModal isOpen={false} onClose={vi.fn()} target={mockTarget} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders target sentence, romaji, uzbek, and controls when open', () => {
    render(<ShadowingTrainerModal isOpen={true} onClose={vi.fn()} target={mockTarget} />);

    expect(screen.getByText('Shadowing & Talaffuz Mashqi')).toBeInTheDocument();
    expect(screen.getByText('Nihon e ikimasu.')).toBeInTheDocument();
    expect(screen.getByText('Yaponiyaga boraman.')).toBeInTheDocument();
    expect(screen.getByText('1. Audioni Tinglash')).toBeInTheDocument();
    expect(screen.getByText('2. Gapirib Qaytaring')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ShadowingTrainerModal isOpen={true} onClose={onClose} target={mockTarget} />);

    const closeBtn = screen.getByLabelText('Yopish');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles speed toggle between 0.8x and 1.0x', () => {
    render(<ShadowingTrainerModal isOpen={true} onClose={vi.fn()} target={mockTarget} />);

    const slowBtn = screen.getByText('0.8x');
    const normalBtn = screen.getByText('1.0x');

    fireEvent.click(slowBtn);
    expect(slowBtn.className).toContain('bg-primary');

    fireEvent.click(normalBtn);
    expect(normalBtn.className).toContain('bg-primary');
  });
});
