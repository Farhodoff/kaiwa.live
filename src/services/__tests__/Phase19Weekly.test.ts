import { describe, it, expect, beforeEach } from 'vitest';
import { computeRealMasteryDelta } from '../WeeklyEvaluationEngine';
import { MasteryEngine } from '../MasteryEngine';

describe('Phase 19 (D) — Real Weekly Mastery Delta', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. returns 0 delta when no evidence exists in the last 7 days', () => {
    const delta = computeRealMasteryDelta('test-user', 'en', ['grammar', 'vocabulary']);
    expect(delta.grammar).toBe(0);
    expect(delta.vocabulary).toBe(0);
  });

  it('2. returns positive delta for strong recent performance evidence', () => {
    MasteryEngine.recordEvent('test-user', 'en', {
      id: 'ev-recent-good-1',
      activityType: 'quiz',
      skill: 'grammar',
      score: 100,
      accuracy: 100,
      timestamp: new Date().toISOString(),
    });

    const delta = computeRealMasteryDelta('test-user', 'en', ['grammar']);
    // masteryImpact = score(100) - 50 = +50
    expect(delta.grammar).toBe(50);
  });

  it('3. returns negative delta for a lapse / weak recent performance', () => {
    MasteryEngine.recordEvent('test-user', 'en', {
      id: 'ev-recent-weak-1',
      activityType: 'srs_review',
      skill: 'vocabulary',
      score: 0,
      accuracy: 0,
      timestamp: new Date().toISOString(),
    });

    const delta = computeRealMasteryDelta('test-user', 'en', ['vocabulary']);
    // masteryImpact = score(0) - 50 = -50
    expect(delta.vocabulary).toBe(-50);
  });

  it('4. averages multiple recent evidence impacts deterministically', () => {
    MasteryEngine.recordEvent('test-user', 'en', {
      id: 'ev-multi-1',
      activityType: 'quiz',
      skill: 'grammar',
      score: 90,
      timestamp: new Date().toISOString(),
    });
    MasteryEngine.recordEvent('test-user', 'en', {
      id: 'ev-multi-2',
      activityType: 'quiz',
      skill: 'grammar',
      score: 70,
      timestamp: new Date().toISOString(),
    });

    const delta = computeRealMasteryDelta('test-user', 'en', ['grammar']);
    // impacts: 90-50=40, 70-50=20 → avg 30
    expect(delta.grammar).toBe(30);
  });

  it('5. excludes evidence older than 7 days', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    MasteryEngine.recordEvent('test-user', 'en', {
      id: 'ev-old-1',
      activityType: 'quiz',
      skill: 'grammar',
      score: 100,
      timestamp: eightDaysAgo,
    });

    const delta = computeRealMasteryDelta('test-user', 'en', ['grammar']);
    expect(delta.grammar).toBe(0);
  });

  it('6. completion evidence contributes zero impact (no simulated boost)', () => {
    MasteryEngine.recordEvent('test-user', 'en', {
      id: 'ev-completion-1',
      activityType: 'lesson_completion',
      skill: 'grammar',
      score: 100,
      timestamp: new Date().toISOString(),
    });

    const delta = computeRealMasteryDelta('test-user', 'en', ['grammar']);
    // lesson_completion → completion category → masteryImpact 0
    expect(delta.grammar).toBe(0);
  });
});
