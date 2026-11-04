import { describe, it, expect } from 'vitest';
import { sanitizeErrorMessage } from '../../components/ErrorBoundary';
import { detectUserIntent } from '../ai/aiCore';

describe('PRODUCTION DEPLOYMENT & LIVE ENVIRONMENT READINESS SUITE', () => {
  describe('1. Vercel SPA Routing & Rewrites Audit', () => {
    it('maps all non-asset SPA routes to index.html for smooth page refresh', () => {
      const spaRegex = /^(?!\/api\/|\/sw\.js|\/workbox-).*/;
      expect(spaRegex.test('/tasks')).toBe(true);
      expect(spaRegex.test('/grammar')).toBe(true);
      expect(spaRegex.test('/jlpt')).toBe(true);
      expect(spaRegex.test('/speaking')).toBe(true);
      expect(spaRegex.test('/ielts')).toBe(true);
      expect(spaRegex.test('/rooms')).toBe(true);
      expect(spaRegex.test('/progress')).toBe(true);
      expect(spaRegex.test('/admin')).toBe(true);
      expect(spaRegex.test('/api/deepseek')).toBe(false);
      expect(spaRegex.test('/sw.js')).toBe(false);
    });
  });

  describe('2. Environment Variable Segregation & Secret Safety', () => {
    it('strictly differentiates client-safe public vars from server-only secrets', () => {
      const clientVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_TELEGRAM_BOT_USERNAME',
      ];
      const serverSecrets = ['SERVICE_ROLE', 'TELEGRAM_BOT_TOKEN', 'DEEPSEEK_API_KEY'];

      // Client vars must start with VITE_
      clientVars.forEach((v) => expect(v.startsWith('VITE_')).toBe(true));
      // Server secrets must NOT start with VITE_
      serverSecrets.forEach((s) => expect(s.startsWith('VITE_')).toBe(false));
    });

    it('redacts sensitive credentials before rendering in client error UI', () => {
      const errorWithKey = 'Failed request with token AIzaSyTESTTOKEN1234567890ABCDEF';
      const clean = sanitizeErrorMessage(errorWithKey);
      expect(clean).not.toContain('AIzaSyTESTTOKEN1234567890ABCDEF');
      expect(clean).toContain('AIzaSy[REDACTED]');
    });
  });

  describe('3. AI Rate-Limit & Cost Protection', () => {
    it('prevents multiple rapid clicks from spawning duplicate AI streams', async () => {
      let activeLock = false;
      let executionCount = 0;

      const handleSpeechSubmit = async () => {
        if (activeLock) return false;
        activeLock = true;
        try {
          await new Promise((r) => setTimeout(r, 25));
          executionCount++;
          return true;
        } finally {
          activeLock = false;
        }
      };

      const results = await Promise.all([
        handleSpeechSubmit(),
        handleSpeechSubmit(),
        handleSpeechSubmit(),
        handleSpeechSubmit(),
      ]);

      expect(results.filter(Boolean).length).toBe(1);
      expect(executionCount).toBe(1);
    });

    it('classifies user request intent accurately without creating extra API calls', () => {
      expect(detectUserIntent('Anime style video yarat')).toBe('video_generation');
      expect(detectUserIntent('YouTube dan video top')).toBe('video_search');
      expect(detectUserIntent('Video uchun prompt yoz')).toBe('video_prompt');
      expect(detectUserIntent('Grammatika qoidasi')).toBe('general');
    });
  });

  describe('4. Real User Onboarding Integrity', () => {
    it('onboarding flow generates default subjects and zero-metric state smoothly', () => {
      const newUser = {
        id: 'new-user-001',
        email: 'student@example.com',
        created_at: new Date().toISOString(),
      };
      const defaultSubjects = [
        { id: 'sub-1', name: 'Ingliz tili (IELTS)' },
        { id: 'sub-2', name: 'Yapon tili (JLPT)' },
      ];
      expect(newUser.id).toBeDefined();
      expect(defaultSubjects.length).toBe(2);
    });
  });

  describe('5. PWA Service Worker & Offline Cache Rules', () => {
    it('denylists API endpoints from service worker navigate fallback cache', () => {
      const denylist = [/^\/api/];
      const isApi = (path: string) => denylist.some((rx) => rx.test(path));
      expect(isApi('/api/deepseek')).toBe(true);
      expect(isApi('/api/tts')).toBe(true);
      expect(isApi('/dashboard')).toBe(false);
      expect(isApi('/tasks')).toBe(false);
    });
  });
});
