import { SupportedLanguage } from './lesson';
import { MasterySkill } from './mastery';

/**
 * Phase 19 — Unified Learning Evidence Model.
 *
 * A single coherent representation of every learning activity that can feed
 * mastery, weakness detection, SRS, and next-lesson decisions.
 *
 * Strict separation:
 *   - `completion` evidence  → confirms a lesson/task was finished (checkbox).
 *                              Does NOT raise mastery.
 *   - `performance` evidence → quiz / SRS / diagnostic / practice results.
 *                              These DO feed mastery.
 */

export type LearningActivityType =
  | 'lesson_completion'
  | 'quiz'
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'listening'
  | 'speaking'
  | 'writing'
  | 'srs_review'
  | 'diagnostic';

export type EvidenceCategory = 'completion' | 'performance';

export interface LearningEvidence {
  /** Stable idempotency key. Duplicate ids are skipped on write. */
  id?: string;
  /** Legacy idempotency alias. */
  eventId?: string;

  userId?: string;
  language?: SupportedLanguage;
  lessonId?: string;

  /** What kind of activity produced this evidence. */
  activityType?: LearningActivityType;
  /** The skill this evidence contributes to. */
  skill: MasterySkill;

  timestamp: string;
  startedAt?: string;
  completedAt?: string;
  /** Minutes spent on the activity. */
  timeSpent?: number;

  /** 0–100 score (completion % or quiz accuracy). */
  score: number;
  /** 0–100 answer accuracy (distinct from completion score). */
  accuracy?: number;
  attempts?: number;
  isCompleted?: boolean;

  /**
   * completion | performance.
   * When omitted, derived from `activityType` (lesson_completion → completion).
   */
  category?: EvidenceCategory;

  /**
   * Determinstic mastery contribution: 0 for completion, (score − 50) clamped
   * to [−50, 50] for performance. Never simulated/random.
   */
  masteryImpact?: number;

  source?: string;
  details?: string;
  metadata?: Record<string, unknown>;

  /** Legacy alias for `category`. */
  type?: 'performance' | 'completion';
}

/** Activity types that only signal completion (no mastery boost). */
const COMPLETION_ACTIVITY_TYPES: ReadonlySet<LearningActivityType> = new Set(['lesson_completion']);

/**
 * Derive the evidence category from the activity type.
 */
export function deriveCategory(activityType?: LearningActivityType): EvidenceCategory {
  return activityType && COMPLETION_ACTIVITY_TYPES.has(activityType) ? 'completion' : 'performance';
}

/**
 * Resolve the effective category of an evidence record, honoring explicit
 * `category` / legacy `type` first, then deriving from `activityType`.
 */
export function resolveCategory(
  evidence: Pick<LearningEvidence, 'category' | 'type' | 'activityType'>,
): EvidenceCategory {
  if (evidence.category === 'completion' || evidence.category === 'performance') {
    return evidence.category;
  }
  if (evidence.type === 'completion') return 'completion';
  if (evidence.type === 'performance') return 'performance';
  return deriveCategory(evidence.activityType);
}

/**
 * Deterministic mastery impact: completion evidence never raises mastery.
 * Performance evidence contributes (score − 50), clamped to [−50, 50].
 */
export function computeMasteryImpact(
  activityType: LearningActivityType | undefined,
  score: number,
  explicitCategory?: EvidenceCategory,
): number {
  const category = explicitCategory ?? deriveCategory(activityType);
  if (category === 'completion') return 0;
  return Math.max(-50, Math.min(50, Math.round(score) - 50));
}
