import { describe, it, expect, beforeEach } from 'vitest';
import { MasteryEngine } from '../MasteryEngine';
import {
  deriveCategory,
  resolveCategory,
  computeMasteryImpact,
  LearningEvidence,
} from '../../types/learningEvidence';

describe('Phase 19 — Evidence Model', () => {
  const userId = 'evidence_user_1';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('A. Category derivation', () => {
    it('derives lesson_completion as completion', () => {
      expect(deriveCategory('lesson_completion')).toBe('completion');
    });

    it('derives quiz/srs/diagnostic as performance', () => {
      expect(deriveCategory('quiz')).toBe('performance');
      expect(deriveCategory('srs_review')).toBe('performance');
      expect(deriveCategory('diagnostic')).toBe('performance');
      expect(deriveCategory('speaking')).toBe('performance');
    });

    it('resolveCategory honors explicit category first', () => {
      expect(resolveCategory({ category: 'completion', activityType: 'quiz' })).toBe('completion');
      expect(resolveCategory({ category: 'performance', activityType: 'lesson_completion' })).toBe(
        'performance',
      );
    });

    it('resolveCategory honors legacy type alias', () => {
      expect(resolveCategory({ type: 'completion' })).toBe('completion');
      expect(resolveCategory({ type: 'performance' })).toBe('performance');
    });

    it('resolveCategory falls back to activityType', () => {
      expect(resolveCategory({ activityType: 'lesson_completion' })).toBe('completion');
      expect(resolveCategory({ activityType: 'quiz' })).toBe('performance');
    });
  });

  describe('B. Mastery impact (deterministic, never simulated)', () => {
    it('completion evidence has zero mastery impact', () => {
      expect(computeMasteryImpact('lesson_completion', 100)).toBe(0);
    });

    it('performance impact is score-50 clamped to [-50, 50]', () => {
      expect(computeMasteryImpact('quiz', 80)).toBe(30);
      expect(computeMasteryImpact('quiz', 30)).toBe(-20);
      expect(computeMasteryImpact('quiz', 100)).toBe(50);
      expect(computeMasteryImpact('quiz', 0)).toBe(-50);
    });

    it('explicit completion category forces zero impact even for quiz-like activity', () => {
      expect(computeMasteryImpact('quiz', 90, 'completion')).toBe(0);
    });
  });

  describe('C. recordEvent canonical entry', () => {
    it('records completion evidence WITHOUT raising mastery', () => {
      MasteryEngine.recordEvent(userId, 'en', {
        id: 'ev_comp_1',
        activityType: 'lesson_completion',
        lessonId: 'en-a1-u1-l1',
        skill: 'grammar',
        score: 100,
        isCompleted: true,
        timestamp: new Date().toISOString(),
      });

      const profile = MasteryEngine.calculateMasteryProfile(userId, 'en');
      const grammar = profile.skills.grammar;

      // completion evidence counts toward evidence/confidence but does NOT raise score
      expect(grammar.score).toBe(0);
      expect(grammar.status).toBe('not_started');
      expect(grammar.evidenceCount).toBeGreaterThanOrEqual(1);
    });

    it('records quiz performance evidence that DOES raise mastery', () => {
      MasteryEngine.recordEvent(userId, 'en', {
        id: 'ev_quiz_1',
        activityType: 'quiz',
        skill: 'grammar',
        score: 85,
        accuracy: 85,
        timestamp: new Date().toISOString(),
      });

      const profile = MasteryEngine.calculateMasteryProfile(userId, 'en');
      const grammar = profile.skills.grammar;

      expect(grammar.score).toBeGreaterThan(0);
      expect(grammar.status).not.toBe('not_started');
    });

    it('auto-derives category and masteryImpact on stored record', () => {
      MasteryEngine.recordEvent(userId, 'en', {
        id: 'ev_quiz_2',
        activityType: 'quiz',
        skill: 'grammar',
        score: 80,
        timestamp: new Date().toISOString(),
      });

      const stored = MasteryEngine.getUserEvidence(userId, 'en');
      expect(stored.length).toBe(1);
      expect(stored[0].category).toBe('performance');
      expect(stored[0].masteryImpact).toBe(30);
      expect(stored[0].type).toBe('performance');
    });

    it('is idempotent — duplicate id is skipped', () => {
      const rec: LearningEvidence = {
        id: 'ev_dup_1',
        activityType: 'quiz',
        skill: 'vocabulary',
        score: 70,
        timestamp: new Date().toISOString(),
      };
      MasteryEngine.recordEvent(userId, 'en', rec);
      MasteryEngine.recordEvent(userId, 'en', rec);

      const stored = MasteryEngine.getUserEvidence(userId, 'en');
      expect(stored.length).toBe(1);
    });

    it('keeps language isolation on stored evidence', () => {
      MasteryEngine.recordEvent(userId, 'en', {
        id: 'ev_en_1',
        activityType: 'quiz',
        skill: 'grammar',
        score: 90,
        timestamp: new Date().toISOString(),
      });
      MasteryEngine.recordEvent(userId, 'ja', {
        id: 'ev_ja_1',
        activityType: 'quiz',
        skill: 'kanji',
        score: 60,
        timestamp: new Date().toISOString(),
      });

      const enEvidence = MasteryEngine.getUserEvidence(userId, 'en');
      const jaEvidence = MasteryEngine.getUserEvidence(userId, 'ja');
      expect(enEvidence.length).toBe(1);
      expect(jaEvidence.length).toBe(1);
      expect(enEvidence[0].language).toBe('en');
      expect(jaEvidence[0].language).toBe('ja');
    });
  });

  describe('D. Weak performance stays weak', () => {
    it('low quiz score yields a weak status', () => {
      MasteryEngine.recordEvent(userId, 'en', {
        id: 'ev_weak_1',
        activityType: 'quiz',
        skill: 'reading',
        score: 30,
        accuracy: 30,
        timestamp: new Date().toISOString(),
      });

      const profile = MasteryEngine.calculateMasteryProfile(userId, 'en');
      expect(profile.skills.reading.status).toBe('weak');
    });
  });
});
