import { describe, it, expect, beforeEach } from 'vitest';
import { SkillMatrixService } from '../SkillMatrixService';
import { MasteryEngine } from '../MasteryEngine';
import { JlptLevel } from '../JlptReadinessService';

describe('SkillMatrixService', () => {
  const testUserId = 'test_matrix_user';

  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Generates complete report with all 7 skills for JLPT N5', () => {
    const report = SkillMatrixService.computeLevelReport('N5', testUserId);

    expect(report.level).toBe('N5');
    expect(report.language).toBe('ja');
    expect(report.masteredSkillsCount).toBeGreaterThanOrEqual(0);

    const skills = Object.keys(report.skills);
    expect(skills).toContain('vocabulary');
    expect(skills).toContain('grammar');
    expect(skills).toContain('kanji');
    expect(skills).toContain('reading');
    expect(skills).toContain('listening');
    expect(skills).toContain('writing');
    expect(skills).toContain('speaking');
    expect(skills).toHaveLength(7);
  });

  it('2. Evaluates sub-competencies and multi-format validation correctly', () => {
    // Record quiz evidence
    MasteryEngine.recordEvidence(testUserId, 'ja', {
      skill: 'grammar',
      score: 90,
      activityType: 'quiz',
      timestamp: new Date().toISOString(),
    });

    // Record srs_review evidence (2nd format)
    MasteryEngine.recordEvidence(testUserId, 'ja', {
      skill: 'grammar',
      score: 95,
      activityType: 'srs_review',
      timestamp: new Date().toISOString(),
    });

    const report = SkillMatrixService.computeLevelReport('N5', testUserId);
    const grammarMatrix = report.skills.grammar;

    expect(grammarMatrix.multiFormatPassed).toBe(true);
    expect(grammarMatrix.competencies.length).toBeGreaterThanOrEqual(3);
  });

  it('3. Generates level-specific benchmarks across N5 to N1', () => {
    const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

    for (const lvl of levels) {
      const report = SkillMatrixService.computeLevelReport(lvl, testUserId);
      expect(report.level).toBe(lvl);
      expect(report.skills.vocabulary.overallTargetCount).toBeGreaterThan(0);
      expect(report.skills.kanji.overallTargetCount).toBeGreaterThan(0);
      expect(report.skills.grammar.overallTargetCount).toBeGreaterThan(0);
    }

    const n5Report = SkillMatrixService.computeLevelReport('N5', testUserId);
    const n1Report = SkillMatrixService.computeLevelReport('N1', testUserId);

    expect(n1Report.skills.vocabulary.overallTargetCount).toBeGreaterThan(
      n5Report.skills.vocabulary.overallTargetCount,
    );
    expect(n1Report.skills.kanji.overallTargetCount).toBeGreaterThan(
      n5Report.skills.kanji.overallTargetCount,
    );
  });

  it('4. Correctly flags weak competencies and routes to proper practice modules', () => {
    const report = SkillMatrixService.computeLevelReport('N5', testUserId);
    expect(Array.isArray(report.topWeaknesses)).toBe(true);

    if (report.topWeaknesses.length > 0) {
      const weakness = report.topWeaknesses[0];
      expect(weakness.recommendedRoute).toBeTruthy();
      expect(typeof weakness.recommendedRoute).toBe('string');
      expect(weakness.recommendedRoute.startsWith('/')).toBe(true);
    }
  });
});
