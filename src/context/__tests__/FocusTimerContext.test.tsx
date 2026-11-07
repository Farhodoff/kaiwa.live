import { renderHook, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FocusTimerProvider, useFocusTimerContext } from '../FocusTimerContext';

describe('FocusTimerContext', () => {
  it('renders children and provides timer controls without throwing outside StudyPlannerProvider', () => {
    const TestConsumer = () => {
      const { focusState, startTimer } = useFocusTimerContext();
      return (
        <div>
          <span data-testid="mode">{focusState.mode}</span>
          <span data-testid="is-active">{focusState.isActive ? 'active' : 'inactive'}</span>
          <button onClick={startTimer}>Start</button>
        </div>
      );
    };

    render(
      <FocusTimerProvider>
        <TestConsumer />
      </FocusTimerProvider>,
    );

    expect(screen.getByTestId('mode').textContent).toBe('focus');
    expect(screen.getByTestId('is-active').textContent).toBe('inactive');
  });

  it('provides safe fallback timer values when useFocusTimerContext is used without FocusTimerProvider', () => {
    const { result } = renderHook(() => useFocusTimerContext());

    expect(result.current.focusState.mode).toBe('focus');
    expect(result.current.focusState.timeLeft).toBe(1500);
    expect(result.current.focusState.isActive).toBe(false);
    expect(typeof result.current.startTimer).toBe('function');
  });
});
