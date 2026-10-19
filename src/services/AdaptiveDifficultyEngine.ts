import { SupportedLanguage } from '../types/lesson';
import { MasterySkill } from '../types/mastery';
import { RoadmapLessonNode, CurriculumCourse, CurriculumLessonNode } from '../types/curriculum';
import {
  UserPerformanceData,
  DifficultyScoreResult,
  DifficultyTier,
  AdaptiveStrategy,
  AdaptiveLessonRecommendation,
  AdaptiveEvaluationOptions,
  DifficultyScoreFactors,
  AdaptiveCurriculumLessonNode,
} from '../types/adaptiveDifficulty';
import { CurriculumService } from './CurriculumService';
import { RoadmapService } from './RoadmapService';
import { LearningOrchestrator } from './LearningOrchestrator';
import { callAI } from '../utils/ai/aiCore';

// Level base difficulties on 0.0 to 1.0 scale
const LEVEL_BASE_DIFFICULTY: Record<string, number> = {
  // Japanese JLPT
  N5: 0.22,
  N4: 0.4,
  N3: 0.6,
  N2: 0.78,
  N1: 0.94,
  // English CEFR
  A1: 0.2,
  A2: 0.38,
  B1: 0.58,
  B2: 0.76,
  C1: 0.92,
  C2: 0.98,
};

export class AdaptiveDifficultyEngine {
  // ==========================================
  // 1. DIFFICULTY SCORE COMPUTATION
  // ==========================================

  /**
   * Computes dynamic difficulty score from real-time performance metrics and AI predictions.
   * Deterministic, zero-crash fallback guarantees reliability even when offline or unauthenticated.
   */
  static async computeDifficultyScore(
    performance: UserPerformanceData,
    options: AdaptiveEvaluationOptions = {},
  ): Promise<DifficultyScoreResult> {
    const accuracy = this.extractAccuracy(performance);
    const speedSeconds = performance.avgTimePerStepSeconds ?? 25;
    const consecutiveErrors = Math.max(0, performance.consecutiveErrors ?? 0);
    const recentMistakes = Math.max(0, performance.recentMistakesCount ?? 0);
    const hesitationCount = Math.max(0, performance.hesitationCount ?? 0);

    // 1. Mastery Baseline (0.1 to 1.0, default 0.50)
    let masteryBaseline = 0.5;
    if (performance.skillProficiencies && Object.keys(performance.skillProficiencies).length > 0) {
      const vals = Object.values(performance.skillProficiencies).filter(
        (v): v is number => typeof v === 'number' && Number.isFinite(v),
      );
      if (vals.length > 0) {
        masteryBaseline = Math.max(
          0.1,
          Math.min(1.0, vals.reduce((a, b) => a + b, 0) / (vals.length * 100)),
        );
      }
    }

    // 2. Accuracy Weight (-0.25 to +0.25)
    let accuracyWeight = 0;
    if (accuracy >= 85) {
      accuracyWeight = +0.15 + ((accuracy - 85) / 15) * 0.1; // +0.15 to +0.25
    } else if (accuracy >= 70) {
      accuracyWeight = ((accuracy - 70) / 15) * 0.12; // 0.0 to +0.12
    } else if (accuracy >= 50) {
      accuracyWeight = -(((70 - accuracy) / 20) * 0.15); // -0.15 to 0.0
    } else {
      accuracyWeight = -0.15 - ((50 - accuracy) / 50) * 0.1; // -0.25 to -0.15
    }

    // 3. Speed & Hesitation Factor (-0.08 to +0.06)
    let speedFactor = 0;
    if (speedSeconds < 16 && accuracy >= 75) {
      speedFactor = +0.05; // Quick and confident
    } else if (speedSeconds > 45 || hesitationCount >= 3) {
      speedFactor = -0.06; // Significant hesitation/retries
    } else if (speedSeconds > 35 || hesitationCount >= 1) {
      speedFactor = -0.03;
    }

    // 4. Error Penalty (-0.30 to 0.0)
    const rawPenalty = consecutiveErrors * 0.07 + recentMistakes * 0.02;
    const errorPenalty = rawPenalty === 0 ? 0 : Math.max(-0.3, -rawPenalty);

    // Base heuristic score before AI adjustment
    let rawScore =
      masteryBaseline * 0.45 +
      (accuracy / 100) * 0.35 +
      accuracyWeight +
      speedFactor +
      errorPenalty;

    // 5. AI-Powered Dynamic Prediction (Optional / Fallback Safe)
    let aiPrediction = 0;
    let aiRationale = '';
    let confidence = 80;

    if (options.useAI !== false) {
      try {
        const aiResult = await this.predictWithAI(performance, rawScore);
        aiPrediction = aiResult.aiAdjustment;
        confidence = aiResult.confidence;
        if (aiResult.rationale) {
          aiRationale = aiResult.rationale;
        }
      } catch (err) {
        // Safe graceful degradation: AI failure never stops learning
        aiPrediction = 0;
        confidence = 75;
      }
    }

    // Combine and clamp strictly between 0.05 and 0.98
    const finalScore = Math.max(0.05, Math.min(0.98, rawScore + aiPrediction));
    const normalizedDifficulty = Math.round(finalScore * 100) / 100;
    const difficultyLevel = Math.round((finalScore * 9 + 1) * 10) / 10; // 1.0 to 10.0 scale

    // Determine Difficulty Tier
    const difficultyTier = this.classifyTier(normalizedDifficulty, options.targetTier);

    // Identify target skill if user has marked weak points
    const targetSkill = this.identifyTargetSkill(performance);

    const factors: DifficultyScoreFactors = {
      accuracyWeight: Math.round(accuracyWeight * 100) / 100 || 0,
      speedFactor: Math.round(speedFactor * 100) / 100 || 0,
      errorPenalty: Math.round(errorPenalty * 100) / 100 || 0,
      masteryBaseline: Math.round(masteryBaseline * 100) / 100 || 0,
      aiPrediction: Math.round(aiPrediction * 100) / 100 || 0,
    };

    const rationale =
      aiRationale ||
      this.generateHeuristicRationale(
        accuracy,
        consecutiveErrors,
        speedSeconds,
        difficultyTier,
        factors,
      );

    return {
      difficultyScore: normalizedDifficulty,
      difficultyLevel,
      difficultyTier,
      confidence,
      targetSkill,
      factors,
      rationale,
    };
  }

  // ==========================================
  // 2. OPTIMAL LESSON SELECTION
  // ==========================================

  /**
   * Evaluates user roadmap and returns the optimal next lesson matched to the computed difficulty score.
   */
  static async getOptimalNextLesson(
    performance: UserPerformanceData,
    options: AdaptiveEvaluationOptions = {},
  ): Promise<AdaptiveLessonRecommendation> {
    const lang = performance.language || 'ja';
    const userId = performance.userId || 'guest';

    // 1. Compute dynamic difficulty score
    const difficultyResult = await this.computeDifficultyScore(performance, options);

    // 2. Load learning state and roadmap
    const state = await LearningOrchestrator.getUserLearningState(userId, { forceLanguage: lang });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    // Flatten accessible lessons (in_progress, current, available, weak)
    const accessibleLessons: RoadmapLessonNode[] = [];
    for (const lvl of roadmap.levels) {
      for (const unit of lvl.units) {
        for (const lesson of unit.lessons) {
          if (
            lesson.status === 'in_progress' ||
            lesson.status === 'current' ||
            lesson.status === 'available' ||
            lesson.status === 'weak'
          ) {
            accessibleLessons.push(lesson);
          }
        }
      }
    }

    // Determine adaptive strategy
    const strategy = this.determineStrategy(difficultyResult.difficultyScore, performance);

    // Calculate intrinsic lesson difficulties
    const scoredLessons = accessibleLessons.map((l) => ({
      lesson: l,
      intrinsicDifficulty: this.calculateLessonIntrinsicDifficulty(l),
    }));

    // Target intrinsic difficulty corresponds to user difficulty score
    const targetDiff = difficultyResult.difficultyScore;

    let optimal: RoadmapLessonNode | null = null;
    let easierAlt: RoadmapLessonNode | undefined;
    let harderAlt: RoadmapLessonNode | undefined;

    if (scoredLessons.length > 0) {
      // Sort accessible lessons by distance to target difficulty
      const sortedBySuitability = [...scoredLessons].sort((a, b) => {
        // Prioritize in-progress if available
        if (a.lesson.status === 'in_progress' && b.lesson.status !== 'in_progress') return -1;
        if (b.lesson.status === 'in_progress' && a.lesson.status !== 'in_progress') return 1;

        if (strategy === 'remediate') {
          // In remediation, favor weak nodes or lower intrinsic difficulty
          if (a.lesson.status === 'weak' && b.lesson.status !== 'weak') return -1;
          if (b.lesson.status === 'weak' && a.lesson.status !== 'weak') return 1;
          return a.intrinsicDifficulty - b.intrinsicDifficulty;
        }

        if (strategy === 'advance') {
          // In advancement, favor higher difficulty challenges
          return b.intrinsicDifficulty - a.intrinsicDifficulty;
        }

        // Standard/maintain: closest to target score
        const distA = Math.abs(a.intrinsicDifficulty - targetDiff);
        const distB = Math.abs(b.intrinsicDifficulty - targetDiff);
        return distA - distB;
      });

      optimal = sortedBySuitability[0].lesson;

      // Identify alternatives (easier reinforcement and harder stretch)
      if (options.includeAlternatives !== false && scoredLessons.length > 1) {
        const sortedByDiff = [...scoredLessons].sort(
          (a, b) => a.intrinsicDifficulty - b.intrinsicDifficulty,
        );
        easierAlt = sortedByDiff.find((item) => item.lesson.id !== optimal!.id)?.lesson;
        harderAlt = [...sortedByDiff]
          .reverse()
          .find(
            (item) => item.lesson.id !== optimal!.id && item.lesson.id !== easierAlt?.id,
          )?.lesson;
      }
    }

    // Fallback if roadmap has no accessible lessons (e.g. fresh/uninitialized)
    if (!optimal) {
      const fallbackCourse =
        lang === 'ja'
          ? CurriculumService.getJapaneseCurriculum()
          : CurriculumService.getEnglishCurriculum();
      const firstLevel = fallbackCourse.levels[0];
      const firstUnit = firstLevel?.units[0];
      const firstLesson = firstUnit?.lessons[0];

      optimal = {
        ...(firstLesson || {
          id: lang === 'ja' ? 'ja-n5-u1-l1' : 'en-a1-u1-l1',
          language: lang,
          level: lang === 'ja' ? 'N5' : 'A1',
          unit: 'u1',
          order: 1,
          title: 'Introduction & Foundations',
          description: 'Basic introduction',
          skill: 'grammar',
          duration: 12,
          difficulty: 'beginner',
          route: `/lesson/${lang === 'ja' ? 'ja-n5-u1-l1' : 'en-a1-u1-l1'}`,
          contentType: 'interactive',
        }),
        status: 'current',
        progressPercentage: 0,
      };
    }

    // Predicted success rate using logistic model
    const optimalIntrinsic = this.calculateLessonIntrinsicDifficulty(optimal);
    const predictedSuccessRate = this.calculatePredictedSuccessRate(
      difficultyResult.difficultyScore,
      optimalIntrinsic,
    );

    const reason = this.buildRecommendationReason(
      strategy,
      optimal,
      difficultyResult,
      predictedSuccessRate,
    );

    return {
      optimalLesson: optimal,
      difficultyScore: difficultyResult,
      tier: difficultyResult.difficultyTier,
      strategy,
      reason,
      predictedSuccessRate,
      appliedAIPrediction: options.useAI !== false && difficultyResult.factors.aiPrediction !== 0,
      alternativeLessons: {
        easier: easierAlt,
        harder: harderAlt,
      },
    };
  }

  // ==========================================
  // 3. CURRICULUM ENDPOINTS INTEGRATION
  // ==========================================

  /**
   * Returns complete curriculum course with adaptive difficulty annotations on all lessons.
   * 100% backward-compatible with CurriculumCourse interface.
   */
  static getDecoratedCurriculum(
    language: SupportedLanguage,
    performance?: UserPerformanceData,
  ): CurriculumCourse {
    const course =
      language === 'ja'
        ? CurriculumService.getJapaneseCurriculum()
        : CurriculumService.getEnglishCurriculum();

    const userDifficulty = performance ? this.extractAccuracy(performance) / 100 : 0.5;

    return {
      ...course,
      levels: course.levels.map((lvl) => ({
        ...lvl,
        units: lvl.units.map((unit) => ({
          ...unit,
          lessons: unit.lessons.map((lesson) => {
            const intrinsic = this.calculateLessonIntrinsicDifficulty(lesson);
            const tier = this.classifyTier(intrinsic);
            const recommended = Math.abs(intrinsic - userDifficulty) < 0.2;

            const decorated: AdaptiveCurriculumLessonNode = {
              ...lesson,
              adaptiveDifficultyScore: intrinsic,
              adaptiveTier: tier,
              recommendedForPerformance: recommended,
            };
            return decorated;
          }),
        })),
      })),
    };
  }

  // ==========================================
  // 4. PRIVATE HELPER METHODS
  // ==========================================

  private static extractAccuracy(p: UserPerformanceData): number {
    if (typeof p.recentAccuracyRate === 'number' && Number.isFinite(p.recentAccuracyRate)) {
      return Math.max(0, Math.min(100, Math.round(p.recentAccuracyRate)));
    }
    if (p.recentQuizScore) {
      if (typeof p.recentQuizScore.percentage === 'number') {
        return Math.max(0, Math.min(100, Math.round(p.recentQuizScore.percentage)));
      }
      if (p.recentQuizScore.total > 0) {
        return Math.max(
          0,
          Math.min(100, Math.round((p.recentQuizScore.score / p.recentQuizScore.total) * 100)),
        );
      }
    }
    return 70; // Sensible default
  }

  private static classifyTier(score: number, override?: DifficultyTier): DifficultyTier {
    if (override) return override;
    if (score >= 0.82) return 'advanced';
    if (score >= 0.68) return 'challenging';
    if (score >= 0.5) return 'standard';
    if (score >= 0.35) return 'easy';
    return 'foundational';
  }

  private static determineStrategy(
    difficultyScore: number,
    performance: UserPerformanceData,
  ): AdaptiveStrategy {
    const errors = performance.consecutiveErrors ?? 0;
    const accuracy = this.extractAccuracy(performance);

    if (errors >= 3 || accuracy < 45 || difficultyScore < 0.35) {
      return 'remediate';
    }
    if (accuracy < 65 || difficultyScore < 0.5) {
      return 'reinforce';
    }
    if (accuracy >= 85 && errors === 0 && difficultyScore >= 0.68) {
      return 'advance';
    }
    return 'maintain';
  }

  /**
   * Intrinsic difficulty of a curriculum lesson node based on level, order, and metadata.
   */
  public static calculateLessonIntrinsicDifficulty(
    lesson: CurriculumLessonNode | RoadmapLessonNode,
  ): number {
    const levelKey = (lesson.level || 'N5').toUpperCase();
    let base = LEVEL_BASE_DIFFICULTY[levelKey] ?? 0.4;

    // Difficulty attribute adjustment
    if (lesson.difficulty === 'beginner') base -= 0.05;
    if (lesson.difficulty === 'advanced') base += 0.06;

    // Reading or Listening comprehension is cognitively denser
    if (lesson.skill === 'reading' || lesson.skill === 'listening') {
      base += 0.03;
    }

    // Unit / lesson order progression (lessons later in unit are slightly more challenging)
    const orderOffset = Math.min(0.06, (lesson.order || 1) * 0.015);

    return Math.max(0.1, Math.min(0.98, Math.round((base + orderOffset) * 100) / 100));
  }

  /**
   * Predict probability of user passing the lesson using a logistic response curve.
   */
  private static calculatePredictedSuccessRate(
    userScore: number,
    lessonDifficulty: number,
  ): number {
    const diff = userScore - lessonDifficulty;
    // Logistic curve: 1 / (1 + exp(-7 * diff))
    const prob = 1 / (1 + Math.exp(-7 * diff));
    return Math.max(10, Math.min(99, Math.round(prob * 100)));
  }

  private static identifyTargetSkill(p: UserPerformanceData): MasterySkill | undefined {
    if (!p.skillProficiencies) return undefined;
    const entries = Object.entries(p.skillProficiencies) as [MasterySkill, number][];
    if (entries.length === 0) return undefined;

    // Find skill with lowest score
    entries.sort((a, b) => a[1] - b[1]);
    return entries[0][0];
  }

  /**
   * AI-powered prediction module via universal callAI.
   */
  private static async predictWithAI(
    performance: UserPerformanceData,
    heuristicScore: number,
  ): Promise<{ aiAdjustment: number; confidence: number; rationale?: string }> {
    const systemPrompt = `You are an AI Adaptive Learning Engine for Japanese and English language education.
Given the student's real-time performance metrics, evaluate their cognitive load and predict an adaptive difficulty adjustment (-0.20 to +0.20).
Return STRICT JSON ONLY without markdown:
{"aiAdjustment": <number between -0.20 and 0.20>, "confidence": <number 0-100>, "rationale": "<concise explanation>"}`;

    const userMessage = JSON.stringify({
      accuracy: this.extractAccuracy(performance),
      avgTimePerStepSeconds: performance.avgTimePerStepSeconds,
      consecutiveErrors: performance.consecutiveErrors,
      recentMistakes: performance.recentMistakesCount,
      srsRetentionRate: performance.srsRetentionRate,
      baselineDifficulty: Math.round(heuristicScore * 100) / 100,
    });

    const response = await callAI(userMessage, systemPrompt, true, {
      ttlMs: 10 * 60 * 1000,
      maxRetries: 1,
    });

    try {
      const parsed = JSON.parse(response);
      const adj = typeof parsed.aiAdjustment === 'number' ? parsed.aiAdjustment : 0;
      const boundedAdj = Math.max(-0.2, Math.min(0.2, adj));
      const conf = typeof parsed.confidence === 'number' ? parsed.confidence : 80;
      return {
        aiAdjustment: boundedAdj,
        confidence: Math.max(40, Math.min(100, conf)),
        rationale: parsed.rationale || undefined,
      };
    } catch {
      return { aiAdjustment: 0, confidence: 75 };
    }
  }

  private static generateHeuristicRationale(
    accuracy: number,
    errors: number,
    speed: number,
    tier: DifficultyTier,
    _factors: DifficultyScoreFactors,
  ): string {
    if (errors >= 3) {
      return `Ketma-ket ${errors} ta xatolik qayd etildi. Qiyinlik darajasi pasaytirilib, o'zlashtirishni mustahkamlash rejalashtirildi.`;
    }
    if (accuracy >= 85) {
      return `Yuqori aniqlik (${accuracy}%) va barqaror natija. Qiyinlik darajasi '${tier}' pog'onasiga oshirildi.`;
    }
    if (accuracy <= 55) {
      return `Aniqlik darajasi (${accuracy}%) pastligi sababli mustahkamlovchi o'quv yo'nalishi belgilandi.`;
    }
    if (speed < 16) {
      return `Tez va ishonchli javoblar hisobga olingan holda optimal '${tier}' dars tanlandi.`;
    }
    return `O'rtacha ko'rsatkichlar asosida muvozanatli '${tier}' darsi tavsiya etildi.`;
  }

  private static buildRecommendationReason(
    strategy: AdaptiveStrategy,
    lesson: RoadmapLessonNode,
    scoreResult: DifficultyScoreResult,
    predictedSuccess: number,
  ): string {
    switch (strategy) {
      case 'remediate':
        return `Zaiflashgan ko'nikmalarni qayta tiklash: «${lesson.title}» darsi tavsiya etildi (kutilayotgan natija: ${predictedSuccess}%).`;
      case 'advance':
        return `Yuqori natija (${scoreResult.difficultyLevel}/10): Yuqori darajadagi «${lesson.title}» darsi tanlandi.`;
      case 'reinforce':
        return `O'zlashtirishni mustahkamlash: «${lesson.title}» darsi orqali bilimlar chuqurlashtiriladi.`;
      case 'maintain':
      default:
        return `Muntazam o'quv rejasi: «${lesson.title}» (${scoreResult.difficultyTier} qiyinlikda).`;
    }
  }
}
