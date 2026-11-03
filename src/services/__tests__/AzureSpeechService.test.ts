import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AzureSpeechService } from '../AzureSpeechService';

describe('AzureSpeechService Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    AzureSpeechService.clearTokenCache();
  });

  it('1. should fetch and cache ephemeral speech token from /api/speech-token', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'azure-mock-jwt-token-123',
        region: 'swedencentral',
        expiresIn: 600,
      }),
    } as Response);

    const tokenData = await AzureSpeechService.getSpeechToken();
    expect(tokenData).toBeDefined();
    expect(tokenData?.token).toBe('azure-mock-jwt-token-123');
    expect(tokenData?.region).toBe('swedencentral');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second call should hit the in-memory cache without another fetch
    const cachedData = await AzureSpeechService.getSpeechToken();
    expect(cachedData?.token).toBe('azure-mock-jwt-token-123');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('2. should force refresh token when forceRefresh is true', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({
          token: 'token-' + Math.random(),
          region: 'swedencentral',
          expiresIn: 600,
        }),
      } as Response;
    });

    const token1 = await AzureSpeechService.getSpeechToken();
    const token2 = await AzureSpeechService.getSpeechToken(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(token1?.token).not.toBe(token2?.token);
  });

  it('3. should handle API errors gracefully and return null', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    const tokenData = await AzureSpeechService.getSpeechToken();
    expect(tokenData).toBeNull();
  });

  it('4. should report isAzureSpeechAvailable as false if token fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const available = await AzureSpeechService.isAzureSpeechAvailable();
    expect(available).toBe(false);
  });

  it('5. should report isAzureSpeechAvailable as true if token is valid', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'valid-token',
        region: 'swedencentral',
        expiresIn: 600,
      }),
    } as Response);

    const available = await AzureSpeechService.isAzureSpeechAvailable();
    expect(available).toBe(true);
  });

  it('6. should clear cache on clearTokenCache()', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'first-token',
        region: 'swedencentral',
        expiresIn: 600,
      }),
    } as Response);

    await AzureSpeechService.getSpeechToken();
    AzureSpeechService.clearTokenCache();

    // After clearing, fetch should be called again
    await AzureSpeechService.getSpeechToken();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});

// A continuous session must renew the token on the recognizer itself, not only its config.
describe('Azure continuous session lifecycle', () => {
  it('shares the microphone stream, refreshes authorization and cancels refresh on close', async () => {
    vi.useFakeTimers();
    const stream = {} as MediaStream;
    const fromStreamInput = vi.fn().mockReturnValue({});
    class FakeRecognizer {
      static instances: FakeRecognizer[] = [];
      authorizationToken = '';
      startContinuousRecognitionAsync = vi.fn((done) => done());
      stopContinuousRecognitionAsync = vi.fn((done) => done?.());
      close = vi.fn();
      constructor() {
        FakeRecognizer.instances.push(this);
      }
    }
    vi.spyOn(AzureSpeechService, 'getSDK').mockResolvedValue({
      SpeechConfig: { fromAuthorizationToken: () => ({ setProfanity: vi.fn() }) },
      ProfanityOption: { Raw: 0 },
      AudioConfig: { fromStreamInput },
      SpeechRecognizer: FakeRecognizer,
    } as any);
    const getToken = vi.spyOn(AzureSpeechService, 'getSpeechToken').mockResolvedValue({
      token: 'initial',
      region: 'swedencentral',
      expiresAt: Date.now() + 600000,
    });
    try {
      const controller = await AzureSpeechService.createContinuousRecognizer({ stream });
      await controller!.start();
      const recognizer = FakeRecognizer.instances[0];
      expect(fromStreamInput).toHaveBeenCalledWith(stream);
      getToken.mockResolvedValue({
        token: 'renewed',
        region: 'swedencentral',
        expiresAt: Date.now() + 600000,
      });
      await vi.advanceTimersByTimeAsync(8 * 60 * 1000);
      expect(getToken).toHaveBeenLastCalledWith(true);
      expect(recognizer.authorizationToken).toBe('renewed');
      controller!.close();
      const calls = getToken.mock.calls.length;
      await vi.advanceTimersByTimeAsync(8 * 60 * 1000);
      expect(getToken).toHaveBeenCalledTimes(calls);
      expect(recognizer.close).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });
});
