import { Flashcard, Subject } from './index';
import { SupportedLanguage } from './lesson';
import { MasterySkill, UserMasteryProfile } from './mastery';
import { DiagnosticResult } from './diagnostic';
import {
  LessonPosition,
  UnfinishedLessonInfo,
  SrsReviewSummary,
  SignalsSummary,
} from './learningOrchestrator';

/**
 * Standardized, machine-readable reason codes for all learning recommendations
 */
export type LearningReasonCode =
  | 'UNFINISHED_LESSON'
  | 'WEAK_SKILL'
  | 'SRS_DUE'
  | 'SRS_OVERDUE'
  | 'RECENT_MISTAKES'
  | 'NEW_VOCABULARY'
  | 'ZERO_LEVEL_FOUNDATION'
  | 'NEXT_CURRICULUM_STEP'
  | 'TARGET_EXAM'
  | 'LOW_MASTERY'
  | 'SKILL_BALANCE'
  | 'PERSONAL_PLAN_TARGET'
  | 'DIAGNOSTIC_REQUIRED';

export type LearningReasonType =
  | 'unfinished_lesson'
  | 'weak_skill'
  | 'due_srs'
  | 'overdue_srs'
  | 'mistake_topic'
  | 'diagnostic_baseline'
  | 'curriculum_next'
  | 'progression_advancement'
  | 'zero_level_foundation'
  | 'exam_preparation'
  | 'goal_alignment'
  | LearningReasonCode;

export interface LearningReasonEvidence {
  level?: string;
  confidence?: number;
  recentMistakes?: number;
  metricName?: string;
  metricValue?: string | number;
  threshold?: string | number;
  sourceId?: string;
  [key: string]: unknown;
}

export interface LearningReason {
  code?: LearningReasonCode;
  type?: LearningReasonType;
  title?: string;
  description?: string;
  message?: string;
  evidence: LearningReasonEvidence;
  priority: number; // 0 - 100
}

/**
 * Standardized Action Types for Learning Path Recommendations
 */
export type NextActionType =
  | 'continue_lesson'
  | 'resume_lesson'
  | 'remediation'
  | 'weakness_remediation'
  | 'srs_review'
  | 'review_srs'
  | 'new_lesson'
  | 'start_next_lesson'
  | 'skill_practice'
  | 'topic_practice'
  | 'diagnostic'
  | 'mock_exam'
  | 'zero_foundation'
  | 'checkpoint_test';

export interface NextBestAction {
  type: NextActionType;
  contentId?: string;
  lessonId?: string;
  route: string;
  language?: SupportedLanguage;
  skill?: MasterySkill;
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: number; // 0 - 100
  reason: LearningReason;
  evidence?: LearningReasonEvidence;
  expectedOutcome?: string;
  ctaLabel: string;
  badgeIcon?: string;
  isZeroFoundation?: boolean;
  metadata?: Record<string, unknown>;
}

// Alias for seamless backward compatibility
export type PathNextAction = NextBestAction;

export interface SkillAllocation {
  skill: MasterySkill;
  percentage?: number;
  weightPercentage?: number; // e.g. 40% for weak skill, 20% for standard
  minutes: number;
  reason: string | LearningReason;
  targetLevel?: string;
  isWeaknessFocus?: boolean;
}

export interface DailyPlanActivity {
  id: string;
  type: NextActionType;
  title: string;
  skill?: MasterySkill;
  topic?: string;
  contentId?: string;
  lessonId?: string;
  language?: SupportedLanguage;
  estimatedMinutes: number;
  minutes?: number;
  route: string;
  priority: number;
  isCompleted: boolean;
  status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
  reason: LearningReason;
  metadata?: Record<string, unknown>;
}

// Alias for seamless backward compatibility
export type PathDailyActivity = DailyPlanActivity;

export interface DailyLearningPlan {
  userId?: string;
  language?: SupportedLanguage;
  targetDate?: string; // YYYY-MM-DD
  totalMinutes: number;
  allocatedMinutes?: number;
  completedMinutes?: number;
  remainingMinutes?: number;
  items?: DailyPlanActivity[];
  activities?: DailyPlanActivity[];
  skillAllocations?: SkillAllocation[];
  primaryFocus?: string;
  summaryReason?: string;
  primaryActivity?: DailyPlanActivity;
  srsAllocation?: SRSAllocation;
  completionStatus?: string;
  summary?: {
    primaryFocus: string;
    reason: string;
  };
}

// Alias for seamless backward compatibility
export type PathDailyPlan = DailyLearningPlan;

export interface ProgressionRequirement {
  id: string;
  title: string;
  description: string;
  requiredValue: number;
  currentValue: number;
  isSatisfied: boolean;
  category: 'mastery' | 'lesson_completion' | 'srs_retention' | 'assessment';
}

export interface ProgressionState {
  currentLevel: string; // 'A1' | 'A2' | 'B1' ... or 'N5' | 'N4' ...
  nextLevel: string | null;
  isZeroLevel?: boolean;
  readinessScore?: number; // 0 - 100
  overallProgressPercentage?: number; // 0 - 100
  requiredEvidence?: string[];
  missingEvidence?: string[];
  canAdvance: boolean;
  ready?: boolean;
  isReadyForPromotion?: boolean;
  requirements?: ProgressionRequirement[];
  advancementBlockers?: string[];

  // Additional fields for EnglishProgressionState
  achievedEvidence?: string[];
  weakestSkill?: string;
  strongestSkill?: string;
  recommendedAction?: string;
  explanation?: string;
}

export interface LessonRecommendation {
  lessonId: string;
  title: string;
  level: string;
  skill: MasterySkill;
  route: string;
  estimatedMinutes: number;
  isResume: boolean;
  stepIndex?: number;
  totalSteps?: number;
  reason: LearningReason;
}

export interface ReviewRecommendation {
  dueCount: number;
  overdueCount: number;
  estimatedMinutes: number;
  averageRetentionScore: number;
  urgency: 'critical' | 'high' | 'normal' | 'none';
  reason: LearningReason;
}

export interface RemediationRecommendation {
  skill: MasterySkill;
  topic?: string;
  severity: 'high' | 'medium' | 'low';
  currentScore: number;
  suggestedRoute: string;
  estimatedMinutes: number;
  recentMistakesCount: number;
  reason: LearningReason;
}

export interface LearningDecision {
  primaryAction: NextBestAction;
  rationale: string;
  evidenceSummary: string[];
  generatedAt: string;
}

export interface LearningRecommendation {
  decision: LearningDecision;
  lesson?: LessonRecommendation;
  review?: ReviewRecommendation;
  remediation?: RemediationRecommendation;
}

export interface LearningPathState {
  userId: string;
  primaryLanguage: SupportedLanguage;
  currentLevel: string;
  targetLevel: string;
  targetGoal: string;
  isZeroLevel: boolean;
  dailyMinutes?: number;
  availableStudyMinutes?: number;
  currentLesson?: LessonPosition | null;
  currentPosition?: LessonPosition | null;
  unfinishedLesson?: UnfinishedLessonInfo | null;
  unfinishedLessons?: UnfinishedLessonInfo[];
  masterySummary?: UserMasteryProfile;
  masteryProfile?: UserMasteryProfile;
  weaknessSummary?: string[];
  srsSummary?: SrsReviewSummary;
  reviewSummary?: SrsReviewSummary;
  recentSignals?: SignalsSummary;
  signalsSummary?: SignalsSummary;
  progression: ProgressionState;
  progressionState?: ProgressionState;
  nextAction: NextBestAction;
  nextBestAction?: NextBestAction;
  todayPlan: DailyLearningPlan;
  skillAllocations: SkillAllocation[];
  reasons: LearningReason[];
  diagnosticBaseline?: DiagnosticResult | null;
  diagnosticSummary?: string;
  diagnosticLevel?: string;
  recentMockScores?: any;
  reviewRecommendation?: ReviewRecommendation;
  remediationRecommendation?: RemediationRecommendation;
  lastEvaluatedAt: string;
}

export interface RemediationItem {
  skill: MasterySkill;
  topic: string;
  severity: 'high' | 'medium' | 'low';
  currentScore: number;
  recentMistakesCount: number;
  suggestedRoute: string;
  reason: LearningReason;
}

export interface SRSAllocation {
  dueCount: number;
  overdueCount: number;
  minutesAllocated: number;
  urgency: 'critical' | 'high' | 'normal' | 'none';
  reason: LearningReason;
}

export interface LearningPathOptions {
  forceLanguage?: SupportedLanguage;
  cachedFlashcards?: Flashcard[];
  cachedSubjects?: Subject[];
  customMinutes?: number;
  goalWeightingEnabled?: boolean;
  skipSrs?: boolean;
  skipDailyPlan?: boolean;
  skipRemediation?: boolean;
}

export interface LevelPromotionCandidate {
  language: SupportedLanguage;
  currentLevel: string;
  candidateLevel: string;
  reason: string;
  evidenceIds: string[];
  masteryScore: number;
  requiredThreshold: number;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'dismissed';
  completedLessonsCount: number;
}
