import { describe, it, expect } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import { ProjectOrb } from '../ProjectOrb';
import { useAudioLevel } from '../../../hooks/useAudioLevel';

describe('ProjectOrb & useAudioLevel', () => {
  it('renders ProjectOrb with accessible aria labels across idle, listening, and speaking states', () => {
    const { rerender } = render(<ProjectOrb state="idle" size={200} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringMatching(/kutish/i));

    rerender(<ProjectOrb state="listening" size={200} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/listening/i),
    );

    rerender(<ProjectOrb state="speaking" size={200} audioVolume={0.8} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/speaking/i),
    );
  });

  it('normalizes audio level cleanly between 0.0 and 1.0 in useAudioLevel', () => {
    const { result, rerender } = renderHook(({ vol }: { vol: number }) => useAudioLevel(vol), {
      initialProps: { vol: 0 },
    });

    expect(result.current).toBe(0);

    rerender({ vol: 30 }); // 30 / 60 = 0.5
    expect(result.current).toBe(0.5);

    rerender({ vol: 90 }); // capped at 1.0
    expect(result.current).toBe(1);
  });
});
