import { describe, it, expect, beforeEach } from 'vitest';
import { MasteryEngine } from '../MasteryEngine';

describe('MasteryEngine Unit Tests', () => {
  const userId = 'mastery_user_1';

  beforeEach(() => {
    localStorage.clear();
  });

  it('1. should return correct skill list for English', () => {
    const skills = MasteryEngine.getSkillsForLanguage('en');
    expect(skills).toContain('writing');
    expect(skills).not.toContain('kanji');
    expect(skills.length).toBe(6);
  });

  it('2. should return correct skill list for Japanese with Kanji', () => {
    const skills = MasteryEngine.getSkillsForLanguage('ja');
    expect(skills).toContain('kanji');
    expect(skills).not.toContain('writing');
    expect(skills.length).toBe(6);
  });

  it('3. should handle cold start / empty evidence gracefully', () => {
    const profile = MasteryEngine.calculateMasteryProfile(userId, 'en');

    expect(profile.userId).toBe(userId);
    expect(profile.language).toBe('en');
    expect(profile.skills.grammar.status).toBe('not_started');
    expect(profile.skills.grammar.score).toBe(0);
    expect(profile.skills.grammar.confidence).toBe(0);
    expect(profile.overallMasteryScore).toBe(0);
  });

  it('4. should compute mastery and confidence scaling from evidence records', () => {
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'grammar',
      score: 80,
      timestamp: new Date().toISOString(),
    });
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'grammar',
      score: 90,
      timestamp: new Date().toISOString(),
    });

    const profile = MasteryEngine.calculateMasteryProfile(userId, 'en');
    const grammar = profile.skills.grammar;

    expect(grammar.evidenceCount).toBe(2);
    expect(grammar.score).toBeGreaterThanOrEqual(80);
    expect(grammar.confidence).toBe(24); // 2 * 12
    expect(grammar.status).toBe('proficient'); // score ~85+, confidence=24 < 40 → proficient (not mastered)
  });

  it('5. should detect improving trend when recent scores are higher', () => {
    const now = new Date();
    const evidence = [
      {
        skill: 'listening' as const,
        score: 50,
        timestamp: new Date(now.getTime() - 40000).toISOString(),
      },
      {
        skill: 'listening' as const,
        score: 60,
        timestamp: new Date(now.getTime() - 30000).toISOString(),
      },
      {
        skill: 'listening' as const,
        score: 75,
        timestamp: new Date(now.getTime() - 20000).toISOString(),
      },
      {
        skill: 'listening' as const,
        score: 85,
        timestamp: new Date(now.getTime() - 10000).toISOString(),
      },
    ];

    const trend = MasteryEngine.calculateTrend(evidence);
    expect(trend).toBe('improving');
  });

  it('6. should detect declining trend when recent scores drop', () => {
    const now = new Date();
    const evidence = [
      {
        skill: 'speaking' as const,
        score: 85,
        timestamp: new Date(now.getTime() - 40000).toISOString(),
      },
      {
        skill: 'speaking' as const,
        score: 80,
        timestamp: new Date(now.getTime() - 30000).toISOString(),
      },
      {
        skill: 'speaking' as const,
        score: 60,
        timestamp: new Date(now.getTime() - 20000).toISOString(),
      },
      {
        skill: 'speaking' as const,
        score: 50,
        timestamp: new Date(now.getTime() - 10000).toISOString(),
      },
    ];

    const trend = MasteryEngine.calculateTrend(evidence);
    expect(trend).toBe('declining');
  });

  it('7. should apply smooth time decay when inactive for over 14 days', () => {
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const score = MasteryEngine.applyRecencyDecay(90, twentyDaysAgo);

    // (20 - 14) * 0.5 = 3 points decay
    expect(score).toBe(87);
  });

  it('8. should not decay if last practice was recent', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const score = MasteryEngine.applyRecencyDecay(90, fiveDaysAgo);
    expect(score).toBe(90);
  });

  it('9. should calculate Japanese Kanji mastery separately from vocabulary', () => {
    MasteryEngine.recordEvidence(userId, 'ja', {
      skill: 'kanji',
      score: 95,
      timestamp: new Date().toISOString(),
    });
    MasteryEngine.recordEvidence(userId, 'ja', {
      skill: 'vocabulary',
      score: 65,
      timestamp: new Date().toISOString(),
    });

    const profile = MasteryEngine.calculateMasteryProfile(userId, 'ja');
    expect(profile.skills.kanji.score).toBe(95);
    expect(profile.skills.vocabulary.score).toBe(65);
  });

  it('10. should generate human-readable explainability for each skill', () => {
    MasteryEngine.recordEvidence(userId, 'en', {
      skill: 'reading',
      score: 75,
      timestamp: new Date().toISOString(),
    });
    const profile = MasteryEngine.calculateMasteryProfile(userId, 'en');

    expect(profile.skills.reading.explanation).toBeDefined();
    expect(profile.skills.reading.explanation.length).toBeGreaterThan(10);
  });
});
