import { afterEach, describe, expect, it, vi } from 'vitest';
import { callCoachAI, streamCoachTokens } from '../coachAI';
import { AzureSpeechService } from '../../services/AzureSpeechService';

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn(async () => ({ data: { session: null } })) } },
  supabaseAnonKey: 'test-public-key',
}));
vi.mock('../../lib/consoleFilter', () => ({ purgeOversizedCookies: vi.fn() }));
afterEach(() => {
  AzureSpeechService.clearTokenCache();
  vi.restoreAllMocks();
});

describe('Coach and Speech cookie-free transport', () => {
  it('keeps both consecutive streamed turns and the JSON fallback cookie-free', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () =>
        Response.json({ choices: [{ message: { content: 'はい。' } }] }),
      );
    await streamCoachTokens([{ role: 'user', content: 'こんにちは。' }], vi.fn());
    await streamCoachTokens([{ role: 'user', content: '元気です。' }], vi.fn());
    await callCoachAI('もう一度。');
    expect(fetch).toHaveBeenCalledTimes(3);
    for (const [url, init] of fetch.mock.calls) {
      expect(url).toBe('/api/coach');
      expect(init?.credentials).toBe('omit');
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-public-key');
      expect(new Headers(init?.headers).has('cookie')).toBe(false);
    }
  });

  it('uses the resolved public key for guests and retries after a failed token request', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 431 }))
      .mockResolvedValueOnce(Response.json({ token: 'ephemeral', region: 'test', expiresIn: 600 }));
    expect(await AzureSpeechService.getSpeechToken()).toBeNull();
    expect((await AzureSpeechService.getSpeechToken())?.token).toBe('ephemeral');
    expect(fetch).toHaveBeenCalledTimes(2);
    for (const [, init] of fetch.mock.calls) {
      expect(init?.credentials).toBe('omit');
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-public-key');
    }
  });
});
