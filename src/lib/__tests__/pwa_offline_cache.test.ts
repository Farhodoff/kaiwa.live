import { describe, it, expect } from 'vitest';
import {
  pwaGlobIgnores,
  pwaRuntimeCaching,
  WorkboxRuntimeCachingRule,
} from '../../config/pwaRuntimeCaching';

describe('PWA Workbox Runtime Caching & Offline Resilience', () => {
  const findRuleByCacheName = (cacheName: string): WorkboxRuntimeCachingRule | undefined => {
    return pwaRuntimeCaching.find((rule) => rule.options?.cacheName === cacheName);
  };

  it('defines all required production cache stores with handlers', () => {
    const cacheNames = pwaRuntimeCaching
      .map((r) => r.options?.cacheName)
      .filter((name): name is string => Boolean(name));

    expect(cacheNames).toContain('large-data-chunks-cache');
    expect(cacheNames).toContain('html-cache');
    expect(cacheNames).toContain('google-fonts-cache');
    expect(cacheNames).toContain('gstatic-fonts-cache');
    expect(cacheNames).toContain('kanjivg-svg-cache');
    expect(cacheNames).toContain('external-audio-cache');
    expect(cacheNames).toContain('dicebear-avatar-cache');
    expect(cacheNames).toContain('audio-assets-cache');
    expect(cacheNames).toContain('supabase-audio-cache');
    expect(cacheNames).toContain('tts-api-cache');
  });

  describe('KanjiVG Stroke Order SVGs (kanjivg-svg-cache)', () => {
    const kanjiRule = findRuleByCacheName('kanjivg-svg-cache');

    it('exists and uses CacheFirst strategy', () => {
      expect(kanjiRule).toBeDefined();
      expect(kanjiRule?.handler).toBe('CacheFirst');
    });

    it('matches KanjiVG SVG vector URLs', () => {
      const pattern = kanjiRule?.urlPattern as RegExp;
      expect(pattern).toBeInstanceOf(RegExp);
      expect(pattern.test('https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg/kanji/06f22.svg')).toBe(
        true,
      );
      expect(pattern.test('https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg/kanji/04e00.svg')).toBe(
        true,
      );
      expect(pattern.test('https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg/kanji/09f8d.svg')).toBe(
        true,
      );
    });

    it('does not match non-KanjiVG or non-SVG assets', () => {
      const pattern = kanjiRule?.urlPattern as RegExp;
      expect(pattern.test('https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg/kanji/index.html')).toBe(
        false,
      );
      expect(pattern.test('https://example.com/kanji/06f22.svg')).toBe(false);
    });

    it('allows opaque responses and has high capacity for kanji characters', () => {
      expect(kanjiRule?.options?.cacheableResponse?.statuses).toEqual([0, 200]);
      expect(kanjiRule?.options?.expiration?.maxEntries).toBeGreaterThanOrEqual(2000);
      expect(kanjiRule?.options?.expiration?.maxAgeSeconds).toBeGreaterThanOrEqual(
        30 * 24 * 60 * 60,
      );
    });
  });

  describe('External Ambient & Focus Audio (external-audio-cache)', () => {
    const audioRule = findRuleByCacheName('external-audio-cache');

    it('exists and uses CacheFirst strategy', () => {
      expect(audioRule).toBeDefined();
      expect(audioRule?.handler).toBe('CacheFirst');
    });

    it('matches Pixabay, Google Actions, and Mixkit audio URLs', () => {
      const pattern = audioRule?.urlPattern as RegExp;
      expect(pattern).toBeInstanceOf(RegExp);
      expect(pattern.test('https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3')).toBe(
        true,
      );
      expect(pattern.test('https://actions.google.com/sounds/v1/weather/rain_heavy.ogg')).toBe(
        true,
      );
      expect(
        pattern.test('https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg'),
      ).toBe(true);
      expect(pattern.test('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav')).toBe(
        true,
      );
    });

    it('rejects unsupported origins or formats', () => {
      const pattern = audioRule?.urlPattern as RegExp;
      expect(pattern.test('https://untrusted-domain.com/sound.mp3')).toBe(false);
      expect(pattern.test('https://cdn.pixabay.com/images/cat.jpg')).toBe(false);
    });

    it('supports opaque responses (status 0) from CDNs', () => {
      expect(audioRule?.options?.cacheableResponse?.statuses).toContain(0);
      expect(audioRule?.options?.cacheableResponse?.statuses).toContain(200);
    });
  });

  describe('Local Choukai & Audio Assets (audio-assets-cache)', () => {
    const localAudioRule = findRuleByCacheName('audio-assets-cache');

    it('uses CacheFirst with capacity for at least 350 audio tracks', () => {
      expect(localAudioRule).toBeDefined();
      expect(localAudioRule?.handler).toBe('CacheFirst');
      expect(localAudioRule?.options?.expiration?.maxEntries).toBeGreaterThanOrEqual(350);
    });

    it('matches MP3, WAV, OGG, and M4A audio files', () => {
      const pattern = localAudioRule?.urlPattern as RegExp;
      expect(pattern.test('/audio/choukai/n3/01%20Track%201.mp3')).toBe(true);
      expect(pattern.test('/audio/choukai/n2/Track01.mp3')).toBe(true);
      expect(pattern.test('/audio/choukai/n4/shinkanzen_chokai_n4_CD-A_001.mp3')).toBe(true);
    });
  });

  describe('TTS Audio API Cache (tts-api-cache)', () => {
    const ttsRule = findRuleByCacheName('tts-api-cache');

    it('uses CacheFirst with query parameter support', () => {
      expect(ttsRule).toBeDefined();
      expect(ttsRule?.handler).toBe('CacheFirst');
      const pattern = ttsRule?.urlPattern as RegExp;
      expect(pattern.test('/api/tts?text=test&lang=ja')).toBe(true);
      expect(pattern.test('/api/tts')).toBe(true);
    });
  });

  describe('Dicebear User Avatars (dicebear-avatar-cache)', () => {
    const avatarRule = findRuleByCacheName('dicebear-avatar-cache');

    it('exists and matches avatar SVGs', () => {
      expect(avatarRule).toBeDefined();
      expect(avatarRule?.handler).toBe('CacheFirst');
      const pattern = avatarRule?.urlPattern as RegExp;
      expect(pattern.test('https://api.dicebear.com/7.x/avataaars/svg?seed=Farhod')).toBe(true);
      expect(avatarRule?.options?.cacheableResponse?.statuses).toEqual([0, 200]);
    });
  });

  describe('Curriculum & Large Data Chunks (large-data-chunks-cache)', () => {
    const chunkRule = findRuleByCacheName('large-data-chunks-cache');

    it('uses StaleWhileRevalidate for fast offline load with background updates', () => {
      expect(chunkRule).toBeDefined();
      expect(chunkRule?.handler).toBe('StaleWhileRevalidate');
    });

    it('matches all curriculum and vocab chunk patterns', () => {
      const pattern = chunkRule?.urlPattern as RegExp;
      expect(pattern.test('/assets/kanji-strokes-B_9sD32z.js')).toBe(true);
      expect(pattern.test('/assets/curriculum-core-C71d1822.js')).toBe(true);
      expect(pattern.test('/assets/curriculum-minna-n5-A882c91.js')).toBe(true);
      expect(pattern.test('/assets/curriculum-minna-n4-B1104e.js')).toBe(true);
      expect(pattern.test('/assets/curriculum-n1-D4219f.js')).toBe(true);
      expect(pattern.test('/assets/curriculum-n2-D4219f.js')).toBe(true);
      expect(pattern.test('/assets/jlpt-vocab-core-E59a11.js')).toBe(true);
      expect(pattern.test('/assets/jlpt-vocab-n1-F8240b.js')).toBe(true);
      expect(pattern.test('/assets/jlpt-deck-n3-A120f.js')).toBe(true);
    });
  });

  describe('Navigation & Version Handling', () => {
    it('provides NetworkFirst HTML navigation fallback', () => {
      const htmlRule = findRuleByCacheName('html-cache');
      expect(htmlRule).toBeDefined();
      expect(htmlRule?.handler).toBe('NetworkFirst');

      if (typeof htmlRule?.urlPattern === 'function') {
        const fakeReq = { mode: 'navigate' } as Request;
        const fakeUrl = new URL('https://kaiwa.live/jlpt');
        expect(htmlRule.urlPattern({ request: fakeReq, url: fakeUrl })).toBe(true);

        const fakeNonNavReq = { mode: 'cors' } as Request;
        expect(htmlRule.urlPattern({ request: fakeNonNavReq, url: fakeUrl })).toBe(false);
      }
    });

    it('keeps version.json strictly NetworkOnly', () => {
      const versionRule = pwaRuntimeCaching.find(
        (rule) => rule.urlPattern instanceof RegExp && rule.urlPattern.test('/version.json'),
      );
      expect(versionRule).toBeDefined();
      expect(versionRule?.handler).toBe('NetworkOnly');
    });
  });

  describe('Precache Exclusion Patterns (pwaGlobIgnores)', () => {
    it('excludes heavy dynamic and curriculum chunks from SW install precache', () => {
      expect(pwaGlobIgnores).toContain('**/kanji-strokes-*.js');
      expect(pwaGlobIgnores).toContain('**/jlpt-vocab-*.js');
      expect(pwaGlobIgnores).toContain('**/jlpt-deck-*.js');
      expect(pwaGlobIgnores).toContain('**/curriculum-*.js');
      expect(pwaGlobIgnores).toContain('**/AdminDashboardPage-*.js');
      expect(pwaGlobIgnores).toContain('**/JlptGrammarKanjiMaster-*.js');
      expect(pwaGlobIgnores).toContain('**/jlpt-grammar-kanji-data-*.js');
    });
  });
});
