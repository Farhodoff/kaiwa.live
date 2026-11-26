import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useExamDeadline } from '../useExamDeadline';
describe('Wall-clock exam timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100000);
  });
  afterEach(() => vi.useRealTimers());
  it('catches up after hidden-tab throttling and expires once', () => {
    const tick = vi.fn(),
      expire = vi.fn();
    renderHook(() => useExamDeadline(160000, true, tick, expire));
    expect(tick).toHaveBeenLastCalledWith(60);
    act(() => {
      vi.setSystemTime(180000);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(tick).toHaveBeenLastCalledWith(0);
    expect(expire).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new Event('focus'));
      vi.advanceTimersByTime(3000);
    });
    expect(expire).toHaveBeenCalledTimes(1);
  });
  it('uses fresh callbacks and cleans up after leaving a session', () => {
    const tick = vi.fn(),
      expire = vi.fn(),
      nextExpire = vi.fn();
    const view = renderHook(
      ({ deadline, callback }) => useExamDeadline(deadline, true, tick, callback),
      { initialProps: { deadline: 160000, callback: expire } },
    );
    view.rerender({ deadline: 160000, callback: nextExpire });
    act(() => vi.advanceTimersByTime(60000));
    expect(expire).not.toHaveBeenCalled();
    expect(nextExpire).toHaveBeenCalledTimes(1);
    view.unmount();
    tick.mockClear();
    act(() => window.dispatchEvent(new Event('focus')));
    expect(tick).not.toHaveBeenCalled();
  });
});
