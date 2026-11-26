import { useEffect, useRef } from 'react';
import { secondsUntil } from '../utils/examSession';

/** Wall-clock time remains accurate when browser timer callbacks are throttled. */
export function useExamDeadline(
  deadline: number | null,
  running: boolean,
  onTick: (seconds: number) => void,
  onExpire: () => void,
) {
  const callbacks = useRef({ onTick, onExpire });
  callbacks.current = { onTick, onExpire };
  const expiredDeadline = useRef<number | null>(null);
  useEffect(() => {
    if (!running || deadline === null) return;
    const update = () => {
      const seconds = secondsUntil(deadline);
      callbacks.current.onTick(seconds);
      if (seconds === 0 && expiredDeadline.current !== deadline) {
        expiredDeadline.current = deadline;
        callbacks.current.onExpire();
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
    };
  }, [deadline, running]);
}
