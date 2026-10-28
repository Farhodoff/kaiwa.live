import { SupportedLanguage } from './lesson';
import { MasterySkill } from './mastery';
import { RoadmapLessonNode, CurriculumLessonNode } from './curriculum';

export type DifficultyTier = 'foundational' | 'easy' | 'standard' | 'challenging' | 'advanced';

export type AdaptiveStrategy = 'reinforce' | 'maintain' | 'advance' | 'remediate';

export interface UserPerformanceData {
  userId?: string;
  language?: SupportedLanguage;
  currentLevel?: string;
  recentAccuracyRate?: number; // 0..100 percentage
  recentQuizScore?: { score: number; total: number; percentage: number };
  avgTimePerStepSeconds?: number; // Average response speed in seconds
  consecutiveErrors?: number; // Repeated errors in current session
  recentMistakesCount?: number; // Total unresolved mistakes in MistakeVault
  hesitationCount?: number; // Number of long pauses or step retries
  srsRetentionRate?: number; // 0..100 percentage
  streakDays?: number;
  skillProficiencies?: Partial<Record<MasterySkill, number>>;
  lastCompletedLessonId?: string;
  preferredDifficultyTier?: DifficultyTier;
}

export interface DifficultyScoreFactors {
  accuracyWeight: number; // Contribution from quiz accuracy (-0.25 to +0.25)
  speedFactor: number; // Contribution from latency/speed (-0.1 to +0.1)
  errorPenalty: number; // Negative reduction from errors (-0.3 to 0.0)
  masteryBaseline: number; // Baseline proficiency (0.0 to 1.0)
  aiPrediction: number; // AI model adjustment delta (-0.2 to +0.2)
}

export interface DifficultyScoreResult {
  difficultyScore: number; // Normalized 0.0 to 1.0
  difficultyLevel: number; // 1.0 to 10.0 scale
  difficultyTier: DifficultyTier;
  confidence: number; // 0..100 percentage
  targetSkill?: MasterySkill;
  factors: DifficultyScoreFactors;
  rationale: string;
}

export interface AdaptiveLessonRecommendation {
  optimalLesson: RoadmapLessonNode;
  difficultyScore: DifficultyScoreResult;
  tier: DifficultyTier;
  strategy: AdaptiveStrategy;
  reason: string;
  predictedSuccessRate: number; // 0..100 percentage
  appliedAIPrediction: boolean;
  alternativeLessons?: {
    easier?: RoadmapLessonNode;
    harder?: RoadmapLessonNode;
  };
}

export interface AdaptiveEvaluationOptions {
  useAI?: boolean;
  includeAlternatives?: boolean;
  forceSkill?: MasterySkill;
  targetTier?: DifficultyTier;
}

export interface AdaptiveCurriculumLessonNode extends CurriculumLessonNode {
  adaptiveDifficultyScore?: number;
  adaptiveTier?: DifficultyTier;
  recommendedForPerformance?: boolean;
}
