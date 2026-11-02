import { describe, it, expect, vi, beforeEach } from 'vitest';
// @ts-expect-error - Serverless module
import { isAllowedOrigin, setCorsHeaders } from '../../../api/_cors.js';
// @ts-expect-error - Serverless module
import { checkDailyQuota } from '../../../api/_quota.js';
// @ts-expect-error - Serverless module
import * as authModule from '../../../api/_auth.js';
// @ts-expect-error - Serverless module
import updateDeckCardHandler from '../../../api/admin/update-deck-card.js';
// @ts-expect-error - Serverless module
import deepseekHandler from '../../../api/deepseek.js';

describe('API Security Hardening Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Origin & CORS Restriction (_cors.js)', () => {
    it('allows production domains and vercel previews', () => {
      expect(isAllowedOrigin('https://kaiwa.live')).toBe(true);
      expect(isAllowedOrigin('https://www.kaiwa.live')).toBe(true);
      expect(isAllowedOrigin('https://kaiwa-preview-123.vercel.app')).toBe(true);
      expect(isAllowedOrigin('https://web.telegram.org')).toBe(true);
      expect(isAllowedOrigin('capacitor://localhost')).toBe(true);
      expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
      expect(isAllowedOrigin('http://127.0.0.1:3000')).toBe(true);
    });

    it('rejects untrusted third-party origins and malicious subdomains', () => {
      expect(isAllowedOrigin('https://evil.com')).toBe(false);
      expect(isAllowedOrigin('https://kaiwa.live.fake.com')).toBe(false);
      expect(isAllowedOrigin('http://kaiwa.live')).toBe(false); // Insecure HTTP
      expect(isAllowedOrigin('null')).toBe(false);
      expect(isAllowedOrigin('')).toBe(false);
    });

    it('sets proper CORS headers on Node.js response objects', () => {
      const headersMap: Record<string, string> = {};
      const mockRes = {
        setHeader: (key: string, val: string) => {
          headersMap[key] = val;
        },
      };

      const reqWithTrustedOrigin = {
        headers: { origin: 'https://kaiwa.live' },
      };

      setCorsHeaders(reqWithTrustedOrigin, mockRes);
      expect(headersMap['Access-Control-Allow-Origin']).toBe('https://kaiwa.live');
      expect(headersMap['Vary']).toBe('Origin');

      const reqWithUntrustedOrigin = {
        headers: { origin: 'https://malicious-site.com' },
      };

      setCorsHeaders(reqWithUntrustedOrigin, mockRes);
      expect(headersMap['Access-Control-Allow-Origin']).toBe('https://kaiwa.live');
    });
  });

  describe('2. AI Daily Quota & Anti-Draining Guard (_quota.js)', () => {
    it('rejects oversized payloads (> 25 KB)', async () => {
      const oversized = 'a'.repeat(26 * 1024);
      const res = await checkDailyQuota('user-1', 'user', oversized);
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('maksimal chegaradan');
    });

    it('enforces guest limit (5 requests per day)', async () => {
      const mockReq = { headers: { 'x-forwarded-for': '203.0.113.195' } };

      for (let i = 0; i < 5; i++) {
        const check = await checkDailyQuota(null, 'guest', 'small body', mockReq);
        expect(check.allowed).toBe(true);
      }

      // 6th attempt should be blocked
      const blocked = await checkDailyQuota(null, 'guest', 'small body', mockReq);
      expect(blocked.allowed).toBe(false);
      expect(blocked.reason).toContain('Mehmon sifatida kunlik bepul AI so');
    });

    it('enforces standard user limit (35 requests per day)', async () => {
      const testUserId = 'test-quota-user-std-1';

      for (let i = 0; i < 35; i++) {
        const check = await checkDailyQuota(testUserId, 'user', 'body');
        expect(check.allowed).toBe(true);
      }

      // 36th attempt should be blocked
      const blocked = await checkDailyQuota(testUserId, 'user', 'body');
      expect(blocked.allowed).toBe(false);
      expect(blocked.reason).toContain("Bugungi kunlik AI so'rovlar limitingiz");
    });
  });

  describe('3. Admin Deck Card Auth Bypass Prevention (update-deck-card.js)', () => {
    it('strictly returns 401 Unauthorized for unauthenticated requests with no token', async () => {
      vi.spyOn(authModule, 'verifyAuth').mockResolvedValueOnce({
        user: null,
        error: null,
      });

      let statusReceived = 0;
      let jsonReceived: any = null;

      const mockRes = {
        setHeader: vi.fn(),
        status: (s: number) => {
          statusReceived = s;
          return {
            json: (data: any) => {
              jsonReceived = data;
            },
            end: vi.fn(),
          };
        },
      };

      const mockReq = {
        method: 'POST',
        headers: {},
        body: { word: 'test', back: 'translation' },
      };

      await updateDeckCardHandler(mockReq, mockRes);
      expect(statusReceived).toBe(401);
      expect(jsonReceived.error).toContain('Unauthorized');
    });

    it('returns 401 for authenticated standard user who is not an admin', async () => {
      vi.spyOn(authModule, 'verifyAuth').mockResolvedValueOnce({
        user: { id: 'regular-student', email: 'student@example.com', role: 'user' },
        error: null,
      });

      let statusReceived = 0;
      const mockRes = {
        setHeader: vi.fn(),
        status: (s: number) => {
          statusReceived = s;
          return {
            json: vi.fn(),
            end: vi.fn(),
          };
        },
      };

      const mockReq = {
        method: 'POST',
        headers: { authorization: 'Bearer student-token' },
        body: { word: 'test', back: 'translation' },
      };

      await updateDeckCardHandler(mockReq, mockRes);
      expect(statusReceived).toBe(401);
    });
  });

  describe('4. DeepSeek Gateway Hardening (/api/deepseek)', () => {
    it('applies origin CORS and responds to GET health-check', async () => {
      const headersMap: Record<string, string> = {};
      let statusReceived = 0;
      let jsonReceived: any = null;

      const mockRes = {
        setHeader: (k: string, v: string) => {
          headersMap[k] = v;
        },
        status: (s: number) => {
          statusReceived = s;
          return {
            json: (data: any) => {
              jsonReceived = data;
            },
          };
        },
      };

      const mockReq = {
        method: 'GET',
        headers: { origin: 'https://kaiwa.live' },
      };

      await deepseekHandler(mockReq, mockRes);
      expect(statusReceived).toBe(200);
      expect(headersMap['Access-Control-Allow-Origin']).toBe('https://kaiwa.live');
      expect(jsonReceived.status).toBe('active');
    });
  });
});
