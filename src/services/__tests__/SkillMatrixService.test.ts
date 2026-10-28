import { describe, it, expect, beforeEach } from 'vitest';
import { SkillMatrixService, SKILL_MATRIX_CONFIG } from '../SkillMatrixService';
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

  it('5. Computes a separate recent accuracy for each skill from real evidence', () => {
    MasteryEngine.recordEvidence(testUserId, 'ja', {
      skill: 'grammar',
      score: 90,
      activityType: 'quiz',
      timestamp: '2026-10-01T10:00:00.000Z',
    });
    MasteryEngine.recordEvidence(testUserId, 'ja', {
      skill: 'reading',
      score: 40,
      activityType: 'reading',
      timestamp: '2026-10-01T10:05:00.000Z',
    });

    const report = SkillMatrixService.computeLevelReport('N5', testUserId);

    expect(report.skills.grammar.accuracy).toBe(90);
    expect(report.skills.reading.accuracy).toBe(40);
    expect(report.skills.grammar.accuracy).not.toBe(report.skills.reading.accuracy);
    expect(report.skills.grammar.evidenceCount).toBe(1);
    expect(report.skills.grammar.evidenceSources[0]).toMatchObject({
      source: 'quiz',
      format: 'quiz',
      count: 1,
      accuracy: 90,
    });
  });

  it('6. Stores a separate result for every competency', () => {
    MasteryEngine.recordEvidence(testUserId, 'ja', {
      skill: 'grammar',
      score: 92,
      activityType: 'quiz',
      timestamp: '2026-10-01T10:00:00.000Z',
      metadata: { competencyId: 'particles' },
    });
    MasteryEngine.recordEvidence(testUserId, 'ja', {
      skill: 'grammar',
      score: 61,
      activityType: 'quiz',
      timestamp: '2026-10-01T10:01:00.000Z',
      metadata: { competencyId: 'conjugations' },
    });

    const report = SkillMatrixService.computeLevelReport('N5', testUserId);
    const particles = report.skills.grammar.competencies.find(
      (c) => c.competencyId === 'particles',
    );
    const conjugations = report.skills.grammar.competencies.find(
      (c) => c.competencyId === 'conjugations',
    );

    expect(particles?.accuracy).toBe(92);
    expect(conjugations?.accuracy).toBe(61);
    expect(particles?.accuracy).not.toBe(conjugations?.accuracy);

    const stored = SkillMatrixService.getCompetencyResults(testUserId, 'N5');
    expect(stored.length).toBe(report.totalCompetenciesCount);
    expect(stored.find((r) => r.competencyId === 'particles')).toMatchObject({
      accuracy: 92,
      evidenceCount: 1,
      level: 'N5',
      skill: 'grammar',
    });
    expect(stored.find((r) => r.competencyId === 'conjugations')?.accuracy).toBe(61);
  });

  it('7. Requires every tested format to meet the minimum accuracy for multi-format mastery', () => {
    MasteryEngine.recordEvidence('multi_fail_user', 'ja', {
      skill: 'grammar',
      score: 95,
      activityType: 'quiz',
      timestamp: '2026-10-01T10:00:00.000Z',
    });
    MasteryEngine.recordEvidence('multi_fail_user', 'ja', {
      skill: 'grammar',
      score: 40,
      activityType: 'srs_review',
      timestamp: '2026-10-01T10:01:00.000Z',
    });

    MasteryEngine.recordEvidence('multi_pass_user', 'ja', {
      skill: 'grammar',
      score: 90,
      activityType: 'quiz',
      timestamp: '2026-10-01T10:00:00.000Z',
    });
    MasteryEngine.recordEvidence('multi_pass_user', 'ja', {
      skill: 'grammar',
      score: 88,
      activityType: 'srs_review',
      timestamp: '2026-10-01T10:01:00.000Z',
    });

    const failed = SkillMatrixService.computeLevelReport('N5', 'multi_fail_user');
    const passed = SkillMatrixService.computeLevelReport('N5', 'multi_pass_user');

    expect(failed.skills.grammar.multiFormatPassed).toBe(false);
    expect(passed.skills.grammar.multiFormatPassed).toBe(true);
    expect(passed.skills.grammar.status).not.toBe('mastered');
  });

  it('8. Uses the shared 80% retention threshold in code and report output', () => {
    expect(SKILL_MATRIX_CONFIG.retentionThreshold).toBe(80);

    MasteryEngine.recordEvidence('retention_low_user', 'ja', {
      skill: 'grammar',
      score: 75,
      activityType: 'srs_review',
      timestamp: '2026-10-01T10:00:00.000Z',
    });
    MasteryEngine.recordEvidence('retention_high_user', 'ja', {
      skill: 'grammar',
      score: 85,
      activityType: 'srs_review',
      timestamp: '2026-10-01T10:00:00.000Z',
    });

    const low = SkillMatrixService.computeLevelReport('N5', 'retention_low_user');
    const high = SkillMatrixService.computeLevelReport('N5', 'retention_high_user');

    expect(low.skills.grammar.retentionRate).toBe(75);
    expect(low.skills.grammar.retentionPassed).toBe(false);
    expect(high.skills.grammar.retentionRate).toBe(85);
    expect(high.skills.grammar.retentionPassed).toBe(true);
  });

  it('9. Weighs only the latest 5 attempts for accuracy', () => {
    const timestamps = [
      '2026-10-01T10:00:00.000Z',
      '2026-10-01T10:01:00.000Z',
      '2026-10-01T10:02:00.000Z',
      '2026-10-01T10:03:00.000Z',
      '2026-10-01T10:04:00.000Z',
      '2026-10-01T10:05:00.000Z',
      '2026-10-01T10:06:00.000Z',
      '2026-10-01T10:07:00.000Z',
    ];

    [20, 20, 20, 20, 20, 95, 95, 95].forEach((score, idx) => {
      MasteryEngine.recordEvidence(testUserId, 'ja', {
        skill: 'grammar',
        score,
        activityType: 'quiz',
        timestamp: timestamps[idx],
      });
    });

    const report = SkillMatrixService.computeLevelReport('N5', testUserId);
    expect(report.skills.grammar.accuracy).toBe(65);
  });

  it('10. Measures writing by its evaluation criteria, not by session count alone', () => {
    localStorage.setItem(
      'study_planner_jlpt_writing_history',
      JSON.stringify([
        {
          id: 'writing-1',
          taskType: 'sakubun_n5',
          prompt: 'Jikoshoukai',
          essay: 'Watashi wa...',
          score: 60,
          criteriaBreakdown: {
            taskAchievement: 9,
            coherence: 8,
            kanjiRating: 'Yaxshi',
            suggestions: ['Zarrachalarga e’tibor bering'],
          },
          feedback: 'Yaxshi urinish',
          createdAt: '2026-10-02T10:00:00.000Z',
        },
        {
          id: 'writing-2',
          taskType: 'sakubun_n5',
          prompt: 'Suki na tabemono',
          essay: 'Sushi ga suki desu.',
          score: 70,
          criteriaBreakdown: {
            taskAchievement: 9,
            coherence: 8,
          },
          feedback: 'Yaxshi',
          createdAt: '2026-10-02T10:05:00.000Z',
        },
      ]),
    );

    const report = SkillMatrixService.computeLevelReport('N5', testUserId);
    const writing = report.skills.writing;
    const essay = writing.competencies.find((c) => c.competencyId === 'free_expression_essay');

    expect(writing.currentCount).toBe(2);
    expect(writing.accuracy).toBe(85);
    expect(writing.evidenceCount).toBe(2);
    expect(writing.evidenceSources.map((source) => source.source)).toContain('writing_history');
    expect(essay?.accuracy).toBe(85);
    expect(essay?.evidenceCount).toBe(2);
    expect(essay?.evidenceSources).toContain('writing_history');
  });

  it('11. Measures speaking competency results from evaluation criteria', () => {
    localStorage.setItem(
      'study_planner_speaking_coach_sessions',
      JSON.stringify([
        {
          id: 'speaking-1',
          language: 'ja',
          persona: 'Ssenariy',
          durationSeconds: 120,
          fluencyScore: 9,
          pronunciationScore: 6,
          transcript: '[]',
          feedback: JSON.stringify({
            pronunciation_score: 60,
            fluency_score: 90,
            grammar_score: 80,
            vocabulary_score: 70,
            overall_score: 75,
          }),
          createdAt: '2026-10-02T11:00:00.000Z',
        },
      ]),
    );

    const report = SkillMatrixService.computeLevelReport('N5', testUserId);
    const speaking = report.skills.speaking;
    const pronunciation = speaking.competencies.find(
      (c) => c.competencyId === 'pronunciation_pitch',
    );
    const fluency = speaking.competencies.find((c) => c.competencyId === 'fluency_hesitation');
    const roleplay = speaking.competencies.find((c) => c.competencyId === 'situational_roleplay');

    expect(speaking.accuracy).toBe(75);
    expect(speaking.evidenceCount).toBe(1);
    expect(speaking.evidenceSources.map((source) => source.source)).toContain('speaking_history');
    expect(pronunciation?.accuracy).toBe(60);
    expect(fluency?.accuracy).toBe(90);
    expect(roleplay?.accuracy).toBe(75);
    expect(new Set([pronunciation?.accuracy, fluency?.accuracy, roleplay?.accuracy]).size).toBe(3);
  });
});
