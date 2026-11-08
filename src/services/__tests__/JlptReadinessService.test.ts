import { describe, it, expect } from 'vitest';
import { JlptReadinessService, JLPT_BENCHMARKS, UserSkillStats } from '../JlptReadinessService';

describe('JlptReadinessService', () => {
  it('contains official JLPT benchmarks for all levels N5-N1', () => {
    expect(JLPT_BENCHMARKS.N5.passMark).toBe(80);
    expect(JLPT_BENCHMARKS.N4.passMark).toBe(90);
    expect(JLPT_BENCHMARKS.N3.passMark).toBe(95);
    expect(JLPT_BENCHMARKS.N2.passMark).toBe(90);
    expect(JLPT_BENCHMARKS.N1.passMark).toBe(100);

    // Sectional floor is strictly 19 points out of 60 for all levels
    ['N5', 'N4', 'N3', 'N2', 'N1'].forEach((lvl) => {
      expect(JLPT_BENCHMARKS[lvl as keyof typeof JLPT_BENCHMARKS].sectionalFloor).toBe(19);
    });
  });

  it('calculates 5 skill pillars and generates radar items for N5', () => {
    const stats: UserSkillStats = {
      vocabCount: 600, // 600/800 = 75%
      vocabRetentionRate: 85,
      kanjiCount: 80, // 80/100 = 80%
      grammarMasteredCount: 30, // 30/40 = 75%
      listeningCompletedCount: 8, // 8/10 = 80%
      listeningAccuracy: 80,
      speakingSessionsCount: 4, // 4/5 = 80%
      speakingFluencyScore: 8.0,
    };

    const report = JlptReadinessService.calculateReadiness(stats, 'N5');

    expect(report.level).toBe('N5');
    expect(report.pillars.length).toBe(5);
    expect(report.radarData.length).toBe(5);
    expect(report.radarData.map((r) => r.subject)).toEqual([
      '単語 (Tango)',
      '漢字 (Kanji)',
      '文法 (Bunpou)',
      '聴解 (Choukai)',
      '会話 (Kaiwa)',
    ]);

    expect(report.overallReadiness).toBeGreaterThan(60);
    expect(report.projectedScore).toBeGreaterThanOrEqual(80);
    expect(report.isProjectedToPass).toBe(true);
    expect(report.hasSectionalFailureRisk).toBe(false);
  });

  it('detects sectional failure risk when listening score is below 19 floor', () => {
    const stats: UserSkillStats = {
      vocabCount: 800,
      vocabRetentionRate: 90,
      kanjiCount: 100,
      grammarMasteredCount: 40,
      listeningCompletedCount: 1, // very low listening!
      listeningAccuracy: 30,
      speakingSessionsCount: 5,
    };

    const report = JlptReadinessService.calculateReadiness(stats, 'N5');

    expect(report.sections.choukai.isAtRisk).toBe(true);
    expect(report.sections.choukai.score).toBeLessThan(19);
    expect(report.hasSectionalFailureRisk).toBe(true);
    expect(report.isProjectedToPass).toBe(false); // even if total is high, failing section prevents pass!
    expect(report.actionableRecommendation.uz).toContain('Tinglash');
  });

  it('correctly adapts when switching target level from N5 to N3', () => {
    const stats: UserSkillStats = {
      vocabCount: 800,
      kanjiCount: 120,
      grammarMasteredCount: 45,
      listeningCompletedCount: 10,
      speakingSessionsCount: 5,
    };

    // Ready for N5
    const reportN5 = JlptReadinessService.calculateReadiness(stats, 'N5');
    expect(reportN5.overallReadiness).toBeGreaterThan(70);

    // But for N3 (which requires 3750 words, 650 kanji), readiness is much lower
    const reportN3 = JlptReadinessService.calculateReadiness(stats, 'N3');
    expect(reportN3.overallReadiness).toBeLessThan(40);
    expect(reportN3.isProjectedToPass).toBe(false);
  });

  it('generates official 4-pillar model (Moji-Goi, Bunpou, Dokkai, Choukai) and passThresholdRatio', () => {
    const stats: UserSkillStats = {
      vocabCount: 800,
      kanjiCount: 100,
      grammarMasteredCount: 40,
      readingCompletedCount: 8,
      readingAccuracy: 85,
      listeningCompletedCount: 10,
      listeningAccuracy: 80,
      speakingSessionsCount: 5,
    };

    const report = JlptReadinessService.calculateReadiness(stats, 'N5');

    // Benchmark checks
    expect(JLPT_BENCHMARKS.N5.readingTarget).toBe(8);
    expect(JLPT_BENCHMARKS.N4.readingTarget).toBe(12);
    expect(JLPT_BENCHMARKS.N3.readingTarget).toBe(18);
    expect(JLPT_BENCHMARKS.N2.readingTarget).toBe(24);
    expect(JLPT_BENCHMARKS.N1.readingTarget).toBe(30);

    // 4-pillar model
    expect(report.fourPillars.length).toBe(4);
    expect(report.radarData4.length).toBe(4);
    expect(report.radarData4.map((r) => r.subject)).toEqual([
      '文字・語彙 (Moji-Goi)',
      '文法 (Bunpou)',
      '読解 (Dokkai)',
      '聴解 (Choukai)',
    ]);

    // Pass threshold ratio (80 / 180 = 0.444)
    expect(report.passThresholdRatio).toBeCloseTo(0.444, 2);
    expect(report.isProjectedToPass).toBe(true);
  });

  it('applies deduction penalty when unresolved mistakes exist in Mistake Vault', () => {
    const cleanStats: UserSkillStats = {
      vocabCount: 800,
      kanjiCount: 100,
      grammarMasteredCount: 40,
      listeningCompletedCount: 10,
      speakingSessionsCount: 5,
    };
    const cleanReport = JlptReadinessService.calculateReadiness(cleanStats, 'N5');

    const penalisedStats: UserSkillStats = {
      ...cleanStats,
      unresolvedMistakesCount: 8,
      mistakesByCategory: {
        grammar: 4, // 4 * 2 = 8 pts penalty
        listening: 3, // 3 * 2 = 6 pts penalty
      },
    };
    const penalisedReport = JlptReadinessService.calculateReadiness(penalisedStats, 'N5');

    // Grammar score should be penalized
    const cleanGrammar = cleanReport.pillars.find((p) => p.key === 'grammar')!.score;
    const penalisedGrammar = penalisedReport.pillars.find((p) => p.key === 'grammar')!.score;
    expect(penalisedGrammar).toBeLessThan(cleanGrammar);

    // Recommendation should reflect unresolved mistakes
    expect(penalisedReport.unresolvedMistakesCount).toBe(8);
    expect(penalisedReport.actionableRecommendation.uz).toContain('Xatolar daftarchangizda');
  });

  it('labels missing reading and listening evidence instead of presenting it as measured', () => {
    const report = JlptReadinessService.calculateReadiness(
      {
        vocabCount: 800,
        kanjiCount: 100,
        grammarMasteredCount: 40,
        listeningCompletedCount: 0,
        speakingSessionsCount: 10,
      },
      'N5',
    );
    expect(report.sections.dokkai.evidenceState).toBe('estimated');
    expect(report.sections.choukai.evidenceState).toBe('insufficient_data');
    expect(report.sections.choukai.score).toBe(0);
    expect(report.readinessConfidence).toBe(0);
    expect(report.evidenceSummary.join(' ')).toContain('Speaking is tracked separately');
  });

  it('marks completed reading and listening assessments as measured', () => {
    const report = JlptReadinessService.calculateReadiness(
      {
        vocabCount: 800,
        kanjiCount: 100,
        grammarMasteredCount: 40,
        readingCompletedCount: 8,
        readingAccuracy: 80,
        listeningCompletedCount: 10,
        listeningAccuracy: 80,
        speakingSessionsCount: 0,
      },
      'N5',
    );
    expect(report.sections.dokkai.evidenceState).toBe('measured');
    expect(report.sections.choukai.evidenceState).toBe('measured');
    expect(report.readinessConfidence).toBe(100);
  });
});
