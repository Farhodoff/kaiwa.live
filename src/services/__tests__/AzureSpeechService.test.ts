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
