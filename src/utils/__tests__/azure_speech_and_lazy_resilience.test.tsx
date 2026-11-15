import { Suspense } from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lazyWithRetry } from '../lazyRetry';
import { CoachSpeechRecognition } from '../coachSpeechRecognition';
import { AzureSpeechService } from '../../services/AzureSpeechService';

describe('Azure Speech & Lazy Loading Resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('1. lazyWithRetry non-object defense', () => {
    it('catches non-object/malformed module and triggers reload without uncaught syntax error', async () => {
      const reloadMock = vi.fn();
      const origLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { ...origLocation, reload: reloadMock },
        writable: true,
      });

      const faultyFactory = vi.fn().mockResolvedValue(undefined as any);
      const Component = lazyWithRetry(faultyFactory);

      render(
        <Suspense fallback={<div>loading...</div>}>
          <Component />
        </Suspense>,
      );

      await vi.waitFor(() => {
        expect(reloadMock).toHaveBeenCalled();
      });

      Object.defineProperty(window, 'location', {
        value: origLocation,
        writable: true,
      });
    });
  });

  describe('2. CoachSpeechRecognition primary provider priority', () => {
    it('always attempts Azure Speech first on each new turn start()', async () => {
      let currentProvider = '';
      const recognition = new CoachSpeechRecognition((provider) => {
        currentProvider = provider;
      });

      const createSpy = vi
        .spyOn(AzureSpeechService, 'createContinuousRecognizer')
        .mockResolvedValue({
          start: vi.fn().mockResolvedValue(undefined),
          stop: vi.fn().mockResolvedValue(undefined),
          close: vi.fn(),
        } as any);

      recognition.start();
      await vi.waitFor(() => expect(currentProvider).toBe('azure'));
      expect(createSpy).toHaveBeenCalledTimes(1);

      recognition.abort();

      // Trigger another turn - should still prefer Azure Speech
      recognition.start();
      await vi.waitFor(() => expect(currentProvider).toBe('azure'));
      expect(createSpy).toHaveBeenCalledTimes(2);
    });
  });
});
