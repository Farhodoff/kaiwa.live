import { describe, it, expect, vi, beforeEach } from 'vitest';
// @ts-expect-error - Edge serverless module
import speechTokenHandler from '../../../api/speech-token.js';
// @ts-expect-error - Edge serverless module
import * as authModule from '../../../api/_auth.js';
// @ts-expect-error - Edge serverless module
import * as rateLimitModule from '../../../api/_rateLimit.js';
// @ts-expect-error - Edge serverless module
import * as quotaModule from '../../../api/_quota.js';

describe('Speech Token Security & Edge API Test Suite (/api/speech-token)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TEST 1: No Authorization header returns 401 Unauthorized', async () => {
    const req = new Request('https://kaiwa.live/api/speech-token', {
      method: 'GET',
    });
    const res = await speechTokenHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('TEST 2: Invalid JWT token returns 401 Unauthorized', async () => {
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValueOnce({
      user: null,
      error: 'Invalid or expired token',
    });

    const req = new Request('https://kaiwa.live/api/speech-token', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid-token-12345',
      },
    });
    const res = await speechTokenHandler(req);
    expect(res.status).toBe(401);
  });

  it('TEST 3: Unsupported HTTP methods return 405 Method Not Allowed', async () => {
    const req = new Request('https://kaiwa.live/api/speech-token', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer some-token',
      },
    });
    const res = await speechTokenHandler(req);
    expect(res.status).toBe(405);
  });

  it('TEST 4: Rate limit exceeded returns 429 Too Many Requests', async () => {
    vi.spyOn(rateLimitModule, 'checkRateLimit').mockResolvedValueOnce({
      allowed: false,
      retryAfter: 30,
      remaining: 0,
    });

    const req = new Request('https://kaiwa.live/api/speech-token', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authModule.SUPABASE_ANON_KEY}`,
      },
    });
    const res = await speechTokenHandler(req);
    expect(res.status).toBe(429);
  });

  it('TEST 5: Returns 503 if AZURE_SPEECH_KEY is not set', async () => {
    const origKey = process.env.AZURE_SPEECH_KEY;
    delete process.env.AZURE_SPEECH_KEY;

    vi.spyOn(rateLimitModule, 'checkRateLimit').mockResolvedValueOnce({
      allowed: true,
      retryAfter: 0,
      remaining: 29,
    });
    vi.spyOn(quotaModule, 'checkDailyQuota').mockResolvedValueOnce({
      allowed: true,
      used: 1,
      limit: 100,
      tier: 'standard',
    });

    const req = new Request('https://kaiwa.live/api/speech-token', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authModule.SUPABASE_ANON_KEY}`,
      },
    });

    const res = await speechTokenHandler(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('Service Unavailable');

    process.env.AZURE_SPEECH_KEY = origKey;
  });

  it('TEST 6: Successful STS response returns token and region with X-Speech-Provider header', async () => {
    process.env.AZURE_SPEECH_KEY = 'test-azure-speech-key';
    process.env.AZURE_SPEECH_REGION = 'swedencentral';

    vi.spyOn(rateLimitModule, 'checkRateLimit').mockResolvedValueOnce({
      allowed: true,
      retryAfter: 0,
      remaining: 29,
    });
    vi.spyOn(quotaModule, 'checkDailyQuota').mockResolvedValueOnce({
      allowed: true,
      used: 1,
      limit: 100,
      tier: 'standard',
    });

    // Mock fetch for Azure STS
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
      return new Response('mock-azure-sts-jwt-token-12345', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    });

    const req = new Request('https://kaiwa.live/api/speech-token', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authModule.SUPABASE_ANON_KEY}`,
        Origin: 'https://kaiwa.live',
      },
    });

    const res = await speechTokenHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Speech-Provider')).toBe('azure');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://kaiwa.live');

    const data = await res.json();
    expect(data.token).toBe('mock-azure-sts-jwt-token-12345');
    expect(data.region).toBe('swedencentral');
    expect(data.expiresIn).toBe(600);

    fetchSpy.mockRestore();
  });
});
