import { describe, it, expect, vi, beforeEach } from 'vitest';
// @ts-expect-error - Edge serverless module
import ttsHandler from '../../../api/tts.js';
// @ts-expect-error - Edge serverless module
import * as authModule from '../../../api/_auth.js';
// @ts-expect-error - Edge serverless module
import * as rateLimitModule from '../../../api/_rateLimit.js';
// @ts-expect-error - Edge serverless module
import * as quotaModule from '../../../api/_quota.js';

describe('TTS Security Hardening & Edge API Test Suite (/api/tts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TEST 1: No Authorization header returns 401 Unauthorized', async () => {
    const req = new Request('https://studyplanner.app/api/tts?text=hello&lang=en', {
      method: 'GET',
    });
    const res = await ttsHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('TEST 2: Invalid JWT token returns 401 Unauthorized', async () => {
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValueOnce({
      user: null,
      error: 'Invalid or expired token',
    });

    const req = new Request('https://studyplanner.app/api/tts?text=hello&lang=en', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid-token-12345',
      },
    });
    const res = await ttsHandler(req);
    expect(res.status).toBe(401);
  });

  it('TEST 3 & 4: Valid JWT processes request using verified user.id and ignores spoofed body userId', async () => {
    const testUserId = 'user-valid-123';
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValueOnce({
      user: { id: testUserId, role: 'user' },
      error: null,
    });

    // Mock global fetch for upstream Google TTS
    const fakeAudioBuffer = new Uint8Array([0xff, 0xfb, 0x90, 0x44]).buffer;
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(fakeAudioBuffer, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      }),
    );

    const req = new Request('https://studyplanner.app/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-jwt-token',
      },
      body: JSON.stringify({
        text: 'Konnichiwa',
        lang: 'ja',
        userId: 'victim-user-999', // Spoofed ID in body
      }),
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
  });

  it('TEST 5: 16th request within window is rejected with 429 Too Many Requests', async () => {
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValue({
      user: { id: 'rate-limited-user', role: 'user' },
      error: null,
    });

    vi.spyOn(rateLimitModule, 'checkRateLimit').mockResolvedValueOnce({
      allowed: false,
      retryAfter: 45,
    });

    const req = new Request('https://studyplanner.app/api/tts?text=Hello&lang=en', {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('45');
  });

  it('TEST 6: Exceeded daily quota returns 403 Forbidden', async () => {
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValue({
      user: { id: 'quota-exceeded-user', role: 'user' },
      error: null,
    });

    vi.spyOn(quotaModule, 'checkDailyQuota').mockResolvedValueOnce({
      allowed: false,
      remainingQuota: 0,
      reason: "Kunlik AI/TTS so'rovlar chegarasiga yetdingiz (25 ta).",
    });

    const req = new Request('https://studyplanner.app/api/tts?text=Hello&lang=en', {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Quota Exceeded');
  });

  it('TEST 7: Text longer than 200 characters returns 400 Bad Request', async () => {
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
      error: null,
    });

    const longText = 'a'.repeat(201);
    const req = new Request('https://studyplanner.app/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: JSON.stringify({ text: longText, lang: 'en' }),
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('200 belgidan oshmasligi kerak');
  });

  it('TEST 8: Non-string text (object/array/number) returns 400 Bad Request', async () => {
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
      error: null,
    });

    const req = new Request('https://studyplanner.app/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: JSON.stringify({ text: { nested: 'bad' }, lang: 'en' }),
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(400);
  });

  it('TEST 9: Empty or whitespace-only text returns 400 Bad Request', async () => {
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
      error: null,
    });

    const req = new Request('https://studyplanner.app/api/tts?text=%20%20%20&lang=en', {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(400);
  });

  it('TEST 10: Unknown language not in allowlist returns 400 Bad Request', async () => {
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
      error: null,
    });

    const req = new Request('https://studyplanner.app/api/tts?text=Test&lang=evil-lang-ssrf', {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain("Qo'llab-quvvatlanmaydigan til");
  });

  it('TEST 11: Upstream provider timeout returns 504 Gateway Timeout', async () => {
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
      error: null,
    });

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    const req = new Request('https://studyplanner.app/api/tts?text=Test&lang=en', {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(504);
    const data = await res.json();
    expect(data.error).toBe('Gateway Timeout');
  });

  it('TEST 12: Upstream provider returning empty buffer returns 502 Bad Gateway', async () => {
    vi.spyOn(authModule, 'verifyAuth').mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
      error: null,
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(new Uint8Array([]).buffer, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      }),
    );

    const req = new Request('https://studyplanner.app/api/tts?text=Test&lang=en', {
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe('Bad Gateway');
  });

  it('TEST 13: Platform Supabase Anon Key allows guest TTS request', async () => {
    const fakeAudioBuffer = new Uint8Array([0xff, 0xfb, 0x90, 0x44]).buffer;
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(fakeAudioBuffer, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      }),
    );

    const req = new Request('https://studyplanner.app/api/tts?text=Konnichiwa&lang=ja', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authModule.SUPABASE_ANON_KEY}`,
      },
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
  });

  it('TEST 14: Synthesizes with Azure Neural TTS when AZURE_SPEECH_KEY is provided and sets X-TTS-Provider header', async () => {
    process.env.AZURE_SPEECH_KEY = 'mock-azure-speech-key-123456';
    process.env.AZURE_SPEECH_REGION = 'swedencentral';

    let interceptedUrl = '';
    let interceptedHeaders: any = {};
    const fakeAudioBuffer = new Uint8Array([0xff, 0xfb, 0x90, 0x44]).buffer;

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (url, init: any) => {
      interceptedUrl = String(url);
      interceptedHeaders = init?.headers || {};
      return new Response(fakeAudioBuffer, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    });

    const req = new Request('https://studyplanner.app/api/tts?text=Konnichiwa&lang=ja', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authModule.SUPABASE_ANON_KEY}`,
      },
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-TTS-Provider')).toBe('azure-neural');
    expect(interceptedUrl).toContain('swedencentral.tts.speech.microsoft.com');
    expect(interceptedHeaders['Ocp-Apim-Subscription-Key']).toBe('mock-azure-speech-key-123456');

    delete process.env.AZURE_SPEECH_KEY;
    delete process.env.AZURE_SPEECH_REGION;
  });

  it('TEST 15: Falls back to Google TTS when Azure Neural TTS fails', async () => {
    process.env.AZURE_SPEECH_KEY = 'mock-azure-speech-key-123456';
    process.env.AZURE_SPEECH_REGION = 'swedencentral';

    const fakeAudioBuffer = new Uint8Array([0xff, 0xfb, 0x90, 0x44]).buffer;

    // 1st call to Azure fails with 500
    // 2nd call to Google fallback succeeds with 200
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('Azure error', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(fakeAudioBuffer, {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg' },
        }),
      );

    const req = new Request('https://studyplanner.app/api/tts?text=Konnichiwa&lang=ja', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authModule.SUPABASE_ANON_KEY}`,
      },
    });

    const res = await ttsHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-TTS-Provider')).toBe('google-tts');

    delete process.env.AZURE_SPEECH_KEY;
    delete process.env.AZURE_SPEECH_REGION;
  });
});
