import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFocusTimer } from '../useFocusTimer';

describe('useFocusTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should initialize with default 25 minutes in focus mode', () => {
    const { result } = renderHook(() => useFocusTimer(false));

    expect(result.current.focusState.mode).toBe('focus');
    expect(result.current.focusState.timeLeft).toBe(25 * 60);
    expect(result.current.focusState.isActive).toBe(false);
  });

  it('should start timer', () => {
    const { result } = renderHook(() => useFocusTimer(false));

    act(() => {
      result.current.startTimer();
    });

    expect(result.current.focusState.isActive).toBe(true);
  });

  it('should decrease time when active', () => {
    const { result } = renderHook(() => useFocusTimer(false));

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.focusState.timeLeft).toBe(25 * 60 - 1);
  });

  it('should pause timer', () => {
    const { result } = renderHook(() => useFocusTimer(false));

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      result.current.pauseTimer();
    });

    expect(result.current.focusState.isActive).toBe(false);
    expect(result.current.focusState.timeLeft).toBe(25 * 60 - 5);

    // Ensure time doesn't change after pause
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.focusState.timeLeft).toBe(25 * 60 - 5);
  });

  it('should reset timer', () => {
    const { result } = renderHook(() => useFocusTimer(false));

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    act(() => {
      result.current.resetTimer();
    });

    expect(result.current.focusState.isActive).toBe(false);
    expect(result.current.focusState.timeLeft).toBe(25 * 60);
  });

  it('should switch mode', () => {
    const { result } = renderHook(() => useFocusTimer(false));

    act(() => {
      result.current.switchMode('short_break');
    });

    expect(result.current.focusState.mode).toBe('short_break');
    expect(result.current.focusState.timeLeft).toBe(5 * 60);
    expect(result.current.focusState.isActive).toBe(false);
  });

  it('should complete session when time reaches 0', () => {
    const { result } = renderHook(() => useFocusTimer(false));

    act(() => {
      result.current.startTimer();
    });

    act(() => {
      // Advance full duration 25 mins
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    act(() => {
      // One more tick to trigger the completion logic strictly
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.focusState.timeLeft).toBe(0);
    expect(result.current.focusState.isActive).toBe(false);
    expect(result.current.focusState.isSessionCompleted).toBe(true);
  });

  it('should synchronize timer state across tabs on storage event', () => {
    const { result } = renderHook(() => useFocusTimer(false));

    const externalTabState = {
      mode: 'short_break',
      timeLeft: 300,
      isActive: true,
      lastUpdated: Date.now() - 10000, // 10 seconds ago
    };

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'study_planner_focus_state',
          newValue: JSON.stringify(externalTabState),
        }),
      );
    });

    expect(result.current.focusState.mode).toBe('short_break');
    expect(result.current.focusState.isActive).toBe(true);
    expect(result.current.focusState.timeLeft).toBeLessThanOrEqual(290);
  });

  it('should recalculate elapsed time on visibilitychange when tab becomes visible', () => {
    const { result } = renderHook(() => useFocusTimer(false));

    const backgroundState = {
      mode: 'focus',
      timeLeft: 1500,
      isActive: true,
      lastUpdated: Date.now() - 30000, // 30 seconds passed while tab was in background
    };
    localStorage.setItem('study_planner_focus_state', JSON.stringify(backgroundState));

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.focusState.timeLeft).toBeLessThanOrEqual(1470);
    expect(result.current.focusState.isActive).toBe(true);
  });
});
