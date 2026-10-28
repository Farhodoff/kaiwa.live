import { describe, it, expect } from 'vitest';
import {
  normalizeLicenseType,
  validateJlptOfficialStatus,
  formatAttribution,
  LICENSE_CONFIG,
  OFFICIAL_JLPT_ORGANIZATIONS,
} from '../examMetadata';

describe('examMetadata (Task 7: Source and License Metadata)', () => {
  describe('normalizeLicenseType', () => {
    it('returns "original" for undefined, null, or empty string', () => {
      expect(normalizeLicenseType()).toBe('original');
      expect(normalizeLicenseType(null)).toBe('original');
      expect(normalizeLicenseType('')).toBe('original');
      expect(normalizeLicenseType('   ')).toBe('original');
    });

    it('normalizes CC BY variants correctly', () => {
      expect(normalizeLicenseType('cc-by')).toBe('cc-by');
      expect(normalizeLicenseType('CC BY')).toBe('cc-by');
      expect(normalizeLicenseType('Creative Common BY')).toBe('cc-by');
      expect(normalizeLicenseType('cc_by')).toBe('cc-by');
    });

    it('normalizes CC BY-SA variants correctly', () => {
      expect(normalizeLicenseType('cc-by-sa')).toBe('cc-by-sa');
      expect(normalizeLicenseType('CC BY-SA')).toBe('cc-by-sa');
      expect(normalizeLicenseType('Creative Common BY-SA')).toBe('cc-by-sa');
    });

    it('normalizes Public Domain variants correctly', () => {
      expect(normalizeLicenseType('public-domain')).toBe('public-domain');
      expect(normalizeLicenseType('Public Domain')).toBe('public-domain');
      expect(normalizeLicenseType('cc0')).toBe('public-domain');
      expect(normalizeLicenseType('pd')).toBe('public-domain');
    });

    it('normalizes Restricted variants correctly', () => {
      expect(normalizeLicenseType('restricted')).toBe('restricted');
      expect(normalizeLicenseType('Restricted')).toBe('restricted');
      expect(normalizeLicenseType('copyrighted')).toBe('restricted');
      expect(normalizeLicenseType('all rights reserved')).toBe('restricted');
    });

    it('falls back to "original" for unknown or proprietary license strings', () => {
      expect(normalizeLicenseType('original')).toBe('original');
      expect(normalizeLicenseType('proprietary')).toBe('original');
      expect(normalizeLicenseType('unknown_custom_license')).toBe('original');
    });
  });

  describe('validateJlptOfficialStatus (Official JLPT False-Labeling Guard)', () => {
    it('passes when isOfficialJlpt is false or undefined regardless of source name', () => {
      const res1 = validateJlptOfficialStatus({ isOfficialJlpt: false, sourceName: 'Random Blog' });
      expect(res1.isValid).toBe(true);

      const res2 = validateJlptOfficialStatus({ sourceName: 'Unofficial Mock Test' });
      expect(res2.isValid).toBe(true);
    });

    it('includes Japan Foundation and JEES in OFFICIAL_JLPT_ORGANIZATIONS', () => {
      expect(OFFICIAL_JLPT_ORGANIZATIONS).toContain('japan foundation');
      expect(OFFICIAL_JLPT_ORGANIZATIONS).toContain('jees');
    });

    it('passes when isOfficialJlpt is true and source is from Japan Foundation or JEES', () => {
      const validSources = [
        'The Japan Foundation',
        'JEES',
        'Japan Educational Exchanges and Services',
        'Official JLPT 2024 Sample',
        'https://www.jlpt.jp',
      ];

      for (const source of validSources) {
        const res = validateJlptOfficialStatus({
          isOfficialJlpt: true,
          sourceName: source,
        });
        expect(res.isValid).toBe(true);
        expect(res.error).toBeUndefined();
      }
    });

    it('rejects with descriptive error when isOfficialJlpt is true but source is third-party or empty', () => {
      const invalidSources = [
        '',
        '   ',
        'Kanji Master School',
        'Shin Kanzen Master Practice',
        '500 Mon publisher',
        'Custom teacher notes',
      ];

      for (const source of invalidSources) {
        const res = validateJlptOfficialStatus({
          isOfficialJlpt: true,
          sourceName: source,
        });
        expect(res.isValid).toBe(false);
        expect(res.error).toContain('Japan Foundation / JEES');
      }
    });
  });

  describe('formatAttribution', () => {
    it('formats attribution for an official JLPT material', () => {
      const attr = formatAttribution({
        sourceName: 'The Japan Foundation',
        author: 'JEES Exam Board',
        licenseType: 'restricted',
        isOfficialJlpt: true,
      });

      expect(attr.displayTitle).toBe('Manba: The Japan Foundation • Muallif: JEES Exam Board');
      expect(attr.sourceText).toContain('The Japan Foundation');
      expect(attr.licenseMeta.id).toBe('restricted');
      expect(attr.disclaimer).toContain('The Japan Foundation / JEES');
      expect(attr.hasAttribution).toBe(true);
    });

    it('formats attribution for an open CC BY community material', () => {
      const attr = formatAttribution({
        sourceName: 'JLPT Sensei',
        author: 'Sensei Team',
        licenseType: 'cc-by',
        isOfficialJlpt: false,
      });

      expect(attr.displayTitle).toBe('Manba: JLPT Sensei • Muallif: Sensei Team');
      expect(attr.licenseMeta.id).toBe('cc-by');
      expect(attr.disclaimer).toContain("o'quv-amaliyot materialidir");
      expect(attr.hasAttribution).toBe(true);
    });

    it('handles material without explicit source but with attribution-requiring license', () => {
      const attr = formatAttribution({
        licenseType: 'cc-by-sa',
      });

      expect(attr.hasAttribution).toBe(true);
      expect(attr.licenseMeta.shortLabel).toBe('CC BY-SA');
    });

    it('handles original platform content with minimal defaults', () => {
      const attr = formatAttribution({
        licenseType: 'original',
      });

      expect(attr.hasAttribution).toBe(false);
      expect(attr.displayTitle).toBe('Mock Sinov Materiali');
      expect(attr.licenseMeta.shortLabel).toBe('Original');
    });
  });

  describe('LICENSE_CONFIG definitions', () => {
    it('defines restricted flag strictly for restricted license', () => {
      expect(LICENSE_CONFIG['restricted'].isRestricted).toBe(true);
      expect(LICENSE_CONFIG['original'].isRestricted).toBe(false);
      expect(LICENSE_CONFIG['cc-by'].isRestricted).toBe(false);
      expect(LICENSE_CONFIG['cc-by-sa'].isRestricted).toBe(false);
      expect(LICENSE_CONFIG['public-domain'].isRestricted).toBe(false);
    });

    it('requires attribution for cc-by, cc-by-sa, and restricted', () => {
      expect(LICENSE_CONFIG['cc-by'].requiresAttribution).toBe(true);
      expect(LICENSE_CONFIG['cc-by-sa'].requiresAttribution).toBe(true);
      expect(LICENSE_CONFIG['restricted'].requiresAttribution).toBe(true);
      expect(LICENSE_CONFIG['original'].requiresAttribution).toBe(false);
      expect(LICENSE_CONFIG['public-domain'].requiresAttribution).toBe(false);
    });
  });
});
