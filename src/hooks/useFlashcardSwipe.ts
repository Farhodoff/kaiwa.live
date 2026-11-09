import { useState, useRef, useCallback, CSSProperties } from 'react';

export interface UseFlashcardSwipeOptions {
  isFlipped: boolean;
  onFlip: () => void;
  onSwipeLeft?: () => void; // Typically Rating.AGAIN
  onSwipeRight?: () => void; // Typically Rating.GOOD
  threshold?: number; // Pixels required to trigger swipe action (default: 75)
  disabled?: boolean;
  onHapticThreshold?: () => void;
}

export interface UseFlashcardSwipeReturn {
  isDragging: boolean;
  deltaX: number;
  deltaY: number;
  swipeDirection: 'left' | 'right' | null;
  swipeProgress: number; // 0 to 1
  isPastThreshold: boolean;
  cardStyle: CSSProperties;
  handlers: {
    onClick: (e?: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e?: React.TouchEvent) => void;
    onTouchCancel: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e?: React.MouseEvent) => void;
    onMouseLeave: (e?: React.MouseEvent) => void;
  };
}

export function useFlashcardSwipe({
  isFlipped,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
  threshold = 75,
  disabled = false,
  onHapticThreshold,
}: UseFlashcardSwipeOptions): UseFlashcardSwipeReturn {
  const [deltaX, setDeltaX] = useState(0);
  const [deltaY, setDeltaY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const deltaXRef = useRef(0);
  const deltaYRef = useRef(0);
  const hasTriggeredThresholdHapticRef = useRef(false);
  const hasJustSwipedRef = useRef(false);

  const shouldIgnoreEvent = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    return !!target.closest('button, input, textarea, select, a, [data-ignore-swipe="true"]');
  };

  const handleStart = (clientX: number, clientY: number, target: EventTarget | null) => {
    if (disabled || shouldIgnoreEvent(target)) return;
    startPosRef.current = { x: clientX, y: clientY };
    isDraggingRef.current = true;
    deltaXRef.current = 0;
    deltaYRef.current = 0;
    hasTriggeredThresholdHapticRef.current = false;
    setIsDragging(true);
    setDeltaX(0);
    setDeltaY(0);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !startPosRef.current) return;
    const currentDeltaX = clientX - startPosRef.current.x;
    const currentDeltaY = clientY - startPosRef.current.y;

    deltaXRef.current = currentDeltaX;
    deltaYRef.current = currentDeltaY;

    if (Math.abs(currentDeltaX) >= threshold && !hasTriggeredThresholdHapticRef.current) {
      hasTriggeredThresholdHapticRef.current = true;
      onHapticThreshold?.();
    } else if (Math.abs(currentDeltaX) < threshold) {
      hasTriggeredThresholdHapticRef.current = false;
    }

    setDeltaX(currentDeltaX);
    setDeltaY(currentDeltaY);
  };

  const handleEnd = useCallback(() => {
    if (!isDraggingRef.current || !startPosRef.current) {
      setIsDragging(false);
      setDeltaX(0);
      setDeltaY(0);
      return;
    }

    const finalDeltaX = deltaXRef.current;
    const finalDeltaY = deltaYRef.current;
    const absX = Math.abs(finalDeltaX);
    const absY = Math.abs(finalDeltaY);

    isDraggingRef.current = false;
    startPosRef.current = null;
    setIsDragging(false);
    setDeltaX(0);
    setDeltaY(0);
    hasTriggeredThresholdHapticRef.current = false;

    if (disabled) return;

    // If significant swipe occurred, mark so standard click won't double-fire flip
    if (absX >= threshold || (!isFlipped && absX > 25)) {
      hasJustSwipedRef.current = true;
      setTimeout(() => {
        hasJustSwipedRef.current = false;
      }, 250);

      if (!isFlipped) {
        onFlip();
      } else {
        if (finalDeltaX < 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    } else if (absX < 15 && absY < 15) {
      // Tap without click listener (e.g. pure touch without click)
      onFlip();
    }
  }, [disabled, isFlipped, onFlip, onSwipeLeft, onSwipeRight, threshold]);

  const handleClick = (e?: React.MouseEvent) => {
    if (e && shouldIgnoreEvent(e.target)) return;
    if (hasJustSwipedRef.current) {
      e?.stopPropagation();
      return;
    }
    onFlip();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  const onTouchCancel = () => {
    isDraggingRef.current = false;
    startPosRef.current = null;
    setIsDragging(false);
    setDeltaX(0);
    setDeltaY(0);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      handleStart(e.clientX, e.clientY, e.target);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      handleMove(e.clientX, e.clientY);
    }
  };

  const onMouseUp = () => {
    if (isDraggingRef.current) {
      handleEnd();
    }
  };

  const onMouseLeave = () => {
    if (isDraggingRef.current) {
      handleEnd();
    }
  };

  const absX = Math.abs(deltaX);
  const swipeDirection = deltaX < -15 ? 'left' : deltaX > 15 ? 'right' : null;
  const swipeProgress = Math.min(1, absX / threshold);
  const isPastThreshold = absX >= threshold;

  const cardStyle: CSSProperties = {
    transform: isDragging
      ? `translate3d(${deltaX}px, ${deltaY * 0.15}px, 0px) rotate(${deltaX * 0.045}deg)`
      : 'translate3d(0px, 0px, 0px) rotate(0deg)',
    transition: isDragging ? 'none' : 'transform 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: isDragging ? 'transform' : 'auto',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    cursor: isDragging ? 'grabbing' : 'pointer',
  };

  return {
    isDragging,
    deltaX,
    deltaY,
    swipeDirection,
    swipeProgress,
    isPastThreshold,
    cardStyle,
    handlers: {
      onClick: handleClick,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
  };
}
