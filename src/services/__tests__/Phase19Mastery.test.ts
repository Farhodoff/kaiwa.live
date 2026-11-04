import { describe, it, expect, beforeEach } from 'vitest';
import { MasteryEngine, MASTERY_CONFIG, statusForScore } from '../MasteryEngine';

describe('Phase 19 — Real Mastery Engine', () => {
  const userId = 'mastery_real_user';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('A. Status ladder is config-driven', () => {
    it('maps scores to canonical statuses', () => {
      expect(statusForScore(40, 100)).toBe('weak');
      expect(statusForScore(50, 100)).toBe('developing');
      expect(statusForScore(69, 100)).toBe('developing');
      expect(statusForScore(70, 100)).toBe('proficient');
      expect(statusForScore(84, 100)).toBe('proficient');
      expect(statusForScore(85, 100)).toBe('mastered');
    });

    it('requires confidence >= threshold for mastered', () => {
      // score 90 but confidence below threshold → not mastered
      expect(statusForScore(90, 39)).toBe('proficient');
      expect(statusForScore(90, 40)).toBe('mastered');
    });
  });

  describe('B. Mastery is deterministic (no simulation)', () => {
    it('produces identical results for identical evidence', () => {
      const evidence = [
        { skill: 'grammar' as const, score: 80, timestamp: '2026-01-01T00:00:00Z' },
        { skill: 'grammar' as const, score: 90, timestamp: '2026-01-02T00:00:00Z' },
      ];
      const p1 = MasteryEngine.computeSkillMastery('grammar', evidence, 'en');
      const p2 = MasteryEngine.computeSkillMastery('grammar', evidence, 'en');
      expect(p1.score).toBe(p2.score);
      expect(p1.status).toBe(p2.status);
    });

    it('trend reflects only real evidence ordering', () => {
      const improving = [
        { skill: 'grammar' as const, score: 40, timestamp: '2026-01-01T00:00:00Z' },
        { skill: 'grammar' as const, score: 60, timestamp: '2026-01-02T00:00:00Z' },
        { skill: 'grammar' as const, score: 90, timestamp: '2026-01-03T00:00:00Z' },
      ];
      expect(MasteryEngine.calculateTrend(improving)).toBe('improving');

      const declining = [
        { skill: 'grammar' as const, score: 90, timestamp: '2026-01-01T00:00:00Z' },
        { skill: 'grammar' as const, score: 60, timestamp: '2026-01-02T00:00:00Z' },
        { skill: 'grammar' as const, score: 40, timestamp: '2026-01-03T00:00:00Z' },
      ];
      expect(MasteryEngine.calculateTrend(declining)).toBe('declining');
    });
  });

  describe('C. Per-skill mastery', () => {
    it('computes each skill independently', () => {
      MasteryEngine.recordEvent(userId, 'en', {
        id: 'ev_gr',
        activityType: 'quiz',
        skill: 'grammar',
        score: 90,
        timestamp: new Date().toISOString(),
      });
      MasteryEngine.recordEvent(userId, 'en', {
        id: 'ev_voc',
        activityType: 'quiz',
        skill: 'vocabulary',
        score: 40,
        timestamp: new Date().toISOString(),
      });

      const grammar = MasteryEngine.getSkillMastery(userId, 'en', 'grammar');
      const vocab = MasteryEngine.getSkillMastery(userId, 'en', 'vocabulary');

      expect(grammar.score).toBeGreaterThanOrEqual(80);
      expect(vocab.score).toBeLessThan(50);
      expect(vocab.status).toBe('weak');
    });

    it('unknown skill returns not_started fallback', () => {
      const reading = MasteryEngine.getSkillMastery(userId, 'en', 'reading');
      expect(reading.status).toBe('not_started');
      expect(reading.score).toBe(0);
    });
  });

  describe('D. Language isolation', () => {
    it('English mastery never affects Japanese mastery', () => {
      MasteryEngine.recordEvent(userId, 'en', {
        id: 'ev_en',
        activityType: 'quiz',
        skill: 'grammar',
        score: 95,
        timestamp: new Date().toISOString(),
      });

      const enGrammar = MasteryEngine.getSkillMastery(userId, 'en', 'grammar');
      const jaGrammar = MasteryEngine.getSkillMastery(userId, 'ja', 'grammar');

      expect(enGrammar.score).toBeGreaterThan(0);
      expect(jaGrammar.score).toBe(0);
      expect(jaGrammar.status).toBe('not_started');
    });

    it('kanji is Japanese-only, writing is English-only', () => {
      expect(MasteryEngine.getSkillsForLanguage('ja')).toContain('kanji');
      expect(MasteryEngine.getSkillsForLanguage('ja')).not.toContain('writing');
      expect(MasteryEngine.getSkillsForLanguage('en')).toContain('writing');
      expect(MasteryEngine.getSkillsForLanguage('en')).not.toContain('kanji');
    });
  });

  describe('E. Config integrity', () => {
    it('threshold ladder is monotonically ordered', () => {
      expect(MASTERY_CONFIG.weakThreshold).toBeLessThan(MASTERY_CONFIG.proficientThreshold);
      expect(MASTERY_CONFIG.proficientThreshold).toBeLessThan(MASTERY_CONFIG.masteredThreshold);
    });
  });
});
