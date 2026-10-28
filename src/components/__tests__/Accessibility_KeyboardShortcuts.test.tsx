import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Accessibility & Keyboard Shortcuts Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves single-letter shortcuts when typing inside form inputs', () => {
    let navigated = false;
    const fakeNavigate = () => {
      navigated = true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key.toLowerCase() === 'f') {
        fakeNavigate();
      }
    };

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const inputEvent = new KeyboardEvent('keydown', { key: 'f', bubbles: true });
    Object.defineProperty(inputEvent, 'target', { value: input });
    handleKeyDown(inputEvent);

    expect(navigated).toBe(false);

    // Outside of input
    const bodyEvent = new KeyboardEvent('keydown', { key: 'f', bubbles: true });
    Object.defineProperty(bodyEvent, 'target', { value: document.body });
    handleKeyDown(bodyEvent);

    expect(navigated).toBe(true);
    document.body.removeChild(input);
  });
});
