import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { KaiwaOrbCharacter } from '../KaiwaOrbCharacter';
import { KaiwaOrbShowcase } from '../KaiwaOrbShowcase';

describe('KaiwaOrbCharacter Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with default idle state and accessible role', () => {
    render(<KaiwaOrbCharacter />);

    const orb = screen.getByRole('img');
    expect(orb).toBeDefined();
    expect(orb.getAttribute('aria-label')).toContain('AI kutish rejimida (Idle)');
  });

  it('updates accessibility label according to listening and speaking states', () => {
    const { rerender } = render(<KaiwaOrbCharacter state="listening" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain(
      'AI tinglamoqda (Listening)',
    );

    rerender(<KaiwaOrbCharacter state="speaking" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain(
      'AI gapirmoqda (Speaking)',
    );
  });

  it('handles custom size and ariaLabel', () => {
    render(<KaiwaOrbCharacter size={320} ariaLabel="Custom Character Label" />);
    const orb = screen.getByLabelText('Custom Character Label');
    expect(orb).toBeDefined();
    expect(orb.style.width).toBe('360px'); // size + 40
  });

  it('cycles states on click when interactive=true', () => {
    const handleStateChange = vi.fn();
    render(<KaiwaOrbCharacter state="idle" interactive={true} onStateChange={handleStateChange} />);

    const button = screen.getByRole('button');
    expect(button).toBeDefined();

    fireEvent.click(button);
    expect(handleStateChange).toHaveBeenCalledWith('listening');
  });

  it('cycles states on keyboard Enter/Space when interactive=true', () => {
    const handleStateChange = vi.fn();
    render(
      <KaiwaOrbCharacter state="listening" interactive={true} onStateChange={handleStateChange} />,
    );

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleStateChange).toHaveBeenCalledWith('speaking');

    fireEvent.keyDown(button, { key: ' ' });
    expect(handleStateChange).toHaveBeenCalledWith('speaking');
  });

  it('does not trigger state change when interactive=false', () => {
    const handleStateChange = vi.fn();
    render(
      <KaiwaOrbCharacter state="idle" interactive={false} onStateChange={handleStateChange} />,
    );

    const orb = screen.getByRole('img');
    fireEvent.click(orb);
    expect(handleStateChange).not.toHaveBeenCalled();
  });

  it('triggers blinking timer cycles without error', () => {
    render(<KaiwaOrbCharacter state="idle" />);

    // Fast-forward 6 seconds so blink timers execute
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByRole('img')).toBeDefined();
  });

  it('accepts audioVolume in speaking state and calculates reactive physics', () => {
    const { rerender } = render(<KaiwaOrbCharacter state="speaking" audioVolume={0.8} />);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByRole('img')).toBeDefined();

    rerender(<KaiwaOrbCharacter state="speaking" audioVolume={0} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('img')).toBeDefined();
  });
});

describe('KaiwaOrbShowcase Component', () => {
  it('renders showcase header, character, and controls', () => {
    render(<KaiwaOrbShowcase />);

    expect(screen.getByText(/Yumshoq Gradient Sharcha & Jonli Ko'zlar/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Idle' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Listening' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Speaking' })).toBeDefined();
  });

  it('allows clicking Listening and Speaking buttons to switch active state', () => {
    render(<KaiwaOrbShowcase />);

    const listeningBtn = screen.getByRole('button', { name: /Listening/i });
    fireEvent.click(listeningBtn);
    expect(screen.getByText(/listening rejimida/i)).toBeDefined();

    const speakingBtn = screen.getByRole('button', { name: /Speaking/i });
    fireEvent.click(speakingBtn);
    expect(screen.getByText(/speaking rejimida/i)).toBeDefined();
  });

  it('allows changing orb size in showcase', () => {
    render(<KaiwaOrbShowcase />);

    const size320Btn = screen.getByRole('button', { name: /320px/i });
    fireEvent.click(size320Btn);
    expect(size320Btn.className).toContain('font-bold');
  });
});
