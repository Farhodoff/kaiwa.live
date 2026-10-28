import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptiveDifficultyEngine } from '../AdaptiveDifficultyEngine';
import { CurriculumService } from '../CurriculumService';
import { LearningProgressionService } from '../LearningProgressionService';
import { UserPerformanceData } from '../../types/adaptiveDifficulty';
import * as aiCore from '../../utils/ai/aiCore';

describe('AdaptiveDifficultyEngine Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Difficulty Score Computation (Deterministic Heuristics)', () => {
    it('computes elevated difficulty score and "advance" strategy for high-performing user', async () => {
      const highPerformance: UserPerformanceData = {
        userId: 'student-high',
        language: 'ja',
        currentLevel: 'N4',
        recentAccuracyRate: 95,
        avgTimePerStepSeconds: 12, // fast & confident
        consecutiveErrors: 0,
        recentMistakesCount: 0,
        hesitationCount: 0,
        skillProficiencies: {
          grammar: 90,
          vocabulary: 88,
          kanji: 92,
        },
      };

      const result = await AdaptiveDifficultyEngine.computeDifficultyScore(highPerformance, {
        useAI: false,
      });

      expect(result.difficultyScore).toBeGreaterThanOrEqual(0.68);
      expect(result.difficultyLevel).toBeGreaterThanOrEqual(6.8);
      expect(['challenging', 'advanced']).toContain(result.difficultyTier);
      expect(result.factors.accuracyWeight).toBeGreaterThan(0);
      expect(result.factors.speedFactor).toBeGreaterThan(0);
      expect(result.factors.errorPenalty).toBe(0);
      expect(result.rationale).toContain('Yuqori aniqlik');
    });

    it('computes reduced difficulty score and "remediate" strategy for struggling user', async () => {
      const strugglingPerformance: UserPerformanceData = {
        userId: 'student-struggling',
        language: 'ja',
        currentLevel: 'N4',
        recentAccuracyRate: 35,
        avgTimePerStepSeconds: 52, // slow / hesitating
        consecutiveErrors: 4,
        recentMistakesCount: 5,
        hesitationCount: 3,
        skillProficiencies: {
          grammar: 30,
          vocabulary: 40,
        },
      };

      const result = await AdaptiveDifficultyEngine.computeDifficultyScore(strugglingPerformance, {
        useAI: false,
      });

      expect(result.difficultyScore).toBeLessThanOrEqual(0.4);
      expect(result.difficultyLevel).toBeLessThanOrEqual(4.0);
      expect(['foundational', 'easy']).toContain(result.difficultyTier);
      expect(result.factors.accuracyWeight).toBeLessThan(0);
      expect(result.factors.speedFactor).toBeLessThan(0);
      expect(result.factors.errorPenalty).toBeLessThan(0);
      expect(result.rationale).toContain('xatolik');
    });

    it('computes balanced difficulty score and "standard" tier for moderate user', async () => {
      const moderatePerformance: UserPerformanceData = {
        userId: 'student-mod',
        language: 'en',
        currentLevel: 'B1',
        recentAccuracyRate: 74,
        avgTimePerStepSeconds: 24,
        consecutiveErrors: 0,
        recentMistakesCount: 1,
        hesitationCount: 0,
      };

      const result = await AdaptiveDifficultyEngine.computeDifficultyScore(moderatePerformance, {
        useAI: false,
      });

      expect(result.difficultyScore).toBeGreaterThanOrEqual(0.45);
      expect(result.difficultyScore).toBeLessThanOrEqual(0.68);
      expect(result.difficultyTier).toBe('standard');
    });

    it('derives accuracy from recentQuizScore object when recentAccuracyRate is missing', async () => {
      const performanceWithQuiz: UserPerformanceData = {
        userId: 'student-quiz',
        recentQuizScore: { score: 9, total: 10, percentage: 90 },
      };

      const result = await AdaptiveDifficultyEngine.computeDifficultyScore(performanceWithQuiz, {
        useAI: false,
      });

      expect(result.factors.accuracyWeight).toBeGreaterThan(0);
      expect(result.difficultyScore).toBeGreaterThan(0.6);
    });

    it('identifies the weakest skill as targetSkill when proficiencies are provided', async () => {
      const performance: UserPerformanceData = {
        userId: 'student-skills',
        skillProficiencies: {
          grammar: 85,
          vocabulary: 80,
          kanji: 35, // weakest
          listening: 70,
        },
      };

      const result = await AdaptiveDifficultyEngine.computeDifficultyScore(performance, {
        useAI: false,
      });

      expect(result.targetSkill).toBe('kanji');
    });
  });

  describe('2. AI-Powered Dynamic Difficulty Prediction & Graceful Fallback', () => {
    it('applies AI predicted adjustment when callAI succeeds with valid JSON', async () => {
      const callAISpy = vi.spyOn(aiCore, 'callAI').mockResolvedValue(
        JSON.stringify({
          aiAdjustment: 0.12,
          confidence: 88,
          rationale:
            'AI predicts student exhibits high flow state and readiness for accelerated content.',
        }),
      );

      const performance: UserPerformanceData = {
        userId: 'student-ai',
        language: 'ja',
        recentAccuracyRate: 85,
      };

      const result = await AdaptiveDifficultyEngine.computeDifficultyScore(performance, {
        useAI: true,
      });

      expect(callAISpy).toHaveBeenCalledTimes(1);
      expect(result.factors.aiPrediction).toBe(0.12);
      expect(result.confidence).toBe(88);
      expect(result.rationale).toContain('AI predicts student');
    });

    it('falls back seamlessly to heuristic score when callAI throws an error (offline / network error)', async () => {
      vi.spyOn(aiCore, 'callAI').mockRejectedValue(new Error('Network offline or timeout'));

      const performance: UserPerformanceData = {
        userId: 'student-offline',
        recentAccuracyRate: 80,
      };

      // Must not throw: graceful degradation
      const result = await AdaptiveDifficultyEngine.computeDifficultyScore(performance, {
        useAI: true,
      });

      expect(result.factors.aiPrediction).toBe(0);
      expect(result.difficultyScore).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    it('bounds extreme AI adjustments to safe range [-0.20, +0.20]', async () => {
      vi.spyOn(aiCore, 'callAI').mockResolvedValue(
        JSON.stringify({
          aiAdjustment: 0.95, // out of range
          confidence: 90,
        }),
      );

      const performance: UserPerformanceData = {
        userId: 'student-extreme',
        recentAccuracyRate: 70,
      };

      const result = await AdaptiveDifficultyEngine.computeDifficultyScore(performance, {
        useAI: true,
      });

      expect(result.factors.aiPrediction).toBe(0.2); // clamped
    });
  });

  describe('3. Intrinsic Lesson Difficulty Calculation', () => {
    it('ranks N5/A1 lessons lower than N1/C1 lessons', () => {
      const n5Lesson = {
        id: 'ja-n5-u1-l1',
        level: 'N5',
        unit: 'u1',
        order: 1,
        skill: 'grammar' as const,
        difficulty: 'beginner' as const,
      } as any;

      const n1Lesson = {
        id: 'ja-n1-u5-l4',
        level: 'N1',
        unit: 'u5',
        order: 4,
        skill: 'reading' as const,
        difficulty: 'advanced' as const,
      } as any;

      const n5Diff = AdaptiveDifficultyEngine.calculateLessonIntrinsicDifficulty(n5Lesson);
      const n1Diff = AdaptiveDifficultyEngine.calculateLessonIntrinsicDifficulty(n1Lesson);

      expect(n5Diff).toBeLessThan(0.3);
      expect(n1Diff).toBeGreaterThan(0.9);
      expect(n1Diff).toBeGreaterThan(n5Diff);
    });
  });

  describe('4. Optimal Next Lesson Matching', () => {
    it('returns optimal lesson, predicted success rate, and alternatives for high-performing user', async () => {
      const highPerf: UserPerformanceData = {
        userId: 'test-advance-user',
        language: 'ja',
        recentAccuracyRate: 96,
        avgTimePerStepSeconds: 14,
        consecutiveErrors: 0,
      };

      const recommendation = await AdaptiveDifficultyEngine.getOptimalNextLesson(highPerf, {
        useAI: false,
        includeAlternatives: true,
      });

      expect(recommendation).toBeDefined();
      expect(recommendation.optimalLesson).toBeDefined();
      expect(recommendation.optimalLesson.id).toBeTruthy();
      expect(recommendation.strategy).toBe('advance');
      expect(recommendation.predictedSuccessRate).toBeGreaterThan(50);
      expect(recommendation.difficultyScore.difficultyScore).toBeGreaterThan(0.65);
      expect(recommendation.reason).toBeTruthy();
    });

    it('returns remedial strategy and lesson when student encounters consecutive errors', async () => {
      const strugglingPerf: UserPerformanceData = {
        userId: 'test-remedial-user',
        language: 'ja',
        recentAccuracyRate: 30,
        consecutiveErrors: 4,
      };

      const recommendation = await AdaptiveDifficultyEngine.getOptimalNextLesson(strugglingPerf, {
        useAI: false,
      });

      expect(recommendation.strategy).toBe('remediate');
      expect(recommendation.reason).toContain('Zaiflashgan');
    });
  });

  describe('5. Backward Compatibility with Curriculum Endpoints', () => {
    it('decorates curriculum course with adaptive difficulty scores without modifying existing structure', () => {
      const decorated = AdaptiveDifficultyEngine.getDecoratedCurriculum('ja', {
        recentAccuracyRate: 85,
      });

      expect(decorated.id).toBe('course-ja-jlpt');
      expect(decorated.levels.length).toBeGreaterThan(0);

      const firstLesson = decorated.levels[0].units[0].lessons[0] as any;
      expect(firstLesson.id).toBeTruthy();
      expect(firstLesson.title).toBeTruthy();
      // Decorated properties:
      expect(firstLesson.adaptiveDifficultyScore).toBeDefined();
      expect(firstLesson.adaptiveTier).toBeDefined();
      expect(typeof firstLesson.recommendedForPerformance).toBe('boolean');
    });

    it('CurriculumService.getAdaptiveCurriculum delegates properly', async () => {
      const course = await CurriculumService.getAdaptiveCurriculum('en');
      expect(course.id).toBe('course-en-general');
      expect(course.levels.length).toBeGreaterThan(0);
    });

    it('CurriculumService.getAdaptiveNextLesson returns valid recommendation', async () => {
      const rec = await CurriculumService.getAdaptiveNextLesson('ja', {
        userId: 'test-user',
        recentAccuracyRate: 90,
      });

      expect(rec.optimalLesson).toBeDefined();
      expect(rec.tier).toBeDefined();
      expect(rec.difficultyScore).toBeDefined();
    });

    it('LearningProgressionService.getAdaptiveNextLesson integrates smoothly', async () => {
      const rec = await LearningProgressionService.getAdaptiveNextLesson(
        'test-user',
        {
          recentAccuracyRate: 88,
        },
        'ja',
      );

      expect(rec).not.toBeNull();
      expect(rec?.optimalLesson).toBeDefined();
      expect(rec?.difficultyScore.difficultyScore).toBeGreaterThan(0.5);
    });
  });
});
