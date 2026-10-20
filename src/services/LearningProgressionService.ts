import { SupportedLanguage } from '../types/lesson';
import { RoadmapLessonNode } from '../types/curriculum';
import { LearningOrchestrator } from './LearningOrchestrator';
import { RoadmapService } from './RoadmapService';
import { resolveNextLesson, NextLessonResult, NextLessonBucket } from './NextLessonResolver';
import { LearningTrackStorage } from '../utils/storage/LearningTrackStorage';
import { LevelPromotionCandidate } from '../types/learningPath';
import { LearningPathEngine, PROGRESSION_CONFIG } from './LearningPathEngine';
import { DiagnosticService } from './DiagnosticService';
import { logger } from '../utils/logger';

/**
 * Unified Source of Truth for Level Progression, Promotion, and Lesson Access.
 *
 * All "next lesson" decisions flow through here. UI pages and other services
 * must NOT compute their own next lesson — they call `getNextLesson`.
 */
export const LearningProgressionService = {
  /**
   * Get the user's current level.
   */
  getCurrentLevel(_userId: string = 'guest', language?: SupportedLanguage): string {
    const lang = language || LearningOrchestrator.getPrimaryLanguage();
    const { currentLevel } = LearningOrchestrator.getUserTarget(lang);
    return currentLevel;
  },

  /**
   * Phase 19 — Single next-lesson decision.
   * Returns the resolved lesson node (or null).
   */
  async getNextLesson(
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): Promise<RoadmapLessonNode | null> {
    const result = await this.getNextLessonDetail(userId, language);
    return result.lesson;
  },

  /**
   * Adaptive Next Lesson based on real-time performance metrics and AI predictions.
   * Backward-compatible with standard progression endpoints.
   */
  async getAdaptiveNextLesson(
    userId: string = 'guest',
    performance?: Partial<import('../types/adaptiveDifficulty').UserPerformanceData>,
    language?: SupportedLanguage,
  ): Promise<import('../types/adaptiveDifficulty').AdaptiveLessonRecommendation | null> {
    const lang = language || LearningOrchestrator.getPrimaryLanguage();
    const { AdaptiveDifficultyEngine } = await import('./AdaptiveDifficultyEngine');

    return AdaptiveDifficultyEngine.getOptimalNextLesson({
      userId,
      language: lang,
      ...performance,
    });
  },

  /**
   * Phase 19 — Single next-lesson decision with reason + priority bucket.
   *
   * Pipeline:
   *   1. If a pending *diagnostic* candidate exists, read the latest diagnostic
   *      result for this language and honour recommendedFirstLessonId when the
   *      lesson is accessible in the roadmap (prevents stale-state override).
   *   2. Otherwise fall through to the normal roadmap resolver.
   *
   * Language is always resolved explicitly so stale localStorage keys can
   * never produce cross-language lesson leakage.
   */
  async getNextLessonDetail(
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): Promise<NextLessonResult> {
    const lang = language || LearningOrchestrator.getPrimaryLanguage();
    const state = await LearningOrchestrator.getUserLearningState(userId, { forceLanguage: lang });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    // --- Diagnostic override ---
    // A diagnostic candidate has requiredThreshold === 0 (set by DiagnosticService).
    // When one is pending, route the user to the diagnostically recommended lesson
    // so they are not sent to a stale/wrong lesson from the old level.
    const diagnosticCandidate = LearningTrackStorage.getPromotionCandidate(lang);
    const isDiagnosticCandidate =
      diagnosticCandidate?.status === 'pending' && diagnosticCandidate.requiredThreshold === 0;

    if (isDiagnosticCandidate) {
      const diagResult = DiagnosticService.getLatestDiagnosticResult(userId, lang);
      if (diagResult?.recommendedFirstLessonId) {
        // Validate: lesson must exist in the roadmap AND belong to the correct language
        const recommendedNode = LearningProgressionService._findLessonInRoadmap(
          roadmap,
          diagResult.recommendedFirstLessonId,
          lang,
        );
        if (recommendedNode) {
          return {
            lesson: recommendedNode,
            bucket: 'current',
            reason: `Diagnostic placement: start at ${diagResult.recommendedStartLevel}`,
            priority: 85,
          };
        }
        // If locked (candidate level not yet confirmed), resolve first accessible
        // lesson at the candidate level instead of a locked one
        const candidateLevelFirst = LearningProgressionService._findFirstAccessibleAtLevel(
          roadmap,
          diagnosticCandidate.candidateLevel,
          lang,
        );
        if (candidateLevelFirst) {
          return {
            lesson: candidateLevelFirst,
            bucket: 'current',
            reason: `Diagnostic placement fallback: first accessible lesson at ${diagnosticCandidate.candidateLevel}`,
            priority: 80,
          };
        }
      }
    }

    return resolveNextLesson(roadmap, state.masteryProfile?.topWeaknesses || []);
  },

  /**
   * Alias: get the next recommended lesson node (single source of truth).
   */
  async getNextRecommendedLesson(
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): Promise<RoadmapLessonNode | null> {
    return this.getNextLesson(userId, language);
  },

  /**
   * Phase 19 — Synchronous resolver for callers that already hold a roadmap.
   * Same single ladder; no duplicate decision logic.
   */
  getNextLessonFromRoadmap(
    roadmap: Parameters<typeof resolveNextLesson>[0],
    topWeaknesses: Parameters<typeof resolveNextLesson>[1] = [],
  ): NextLessonResult {
    return resolveNextLesson(roadmap, topWeaknesses);
  },

  /**
   * Service-level authorization to check if a user can access a specific lesson.
   */
  canAccessLesson(
    lessonId: string,
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): { allowed: boolean; reason: string; redirectTo?: string; missingPrerequisites?: string[] } {
    return LearningOrchestrator.canAccessLesson(lessonId, userId, language);
  },

  /**
   * Evaluate and create/save level promotion candidate if user meets criteria.
   */
  async evaluatePromotion(
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): Promise<LevelPromotionCandidate | null> {
    const lang = language || LearningOrchestrator.getPrimaryLanguage();

    // 1. Check if there is already a pending candidate
    const existing = LearningTrackStorage.getPromotionCandidate(lang);
    if (existing && existing.status === 'pending') {
      return existing;
    }

    // 2. Fetch user state
    const state = await LearningOrchestrator.getUserLearningState(userId, { forceLanguage: lang });
    const isZeroLevel =
      state.completedLessonsCount === 0 &&
      (state.currentLevel === 'A1' || state.currentLevel === 'N5');

    // 3. Evaluate progression criteria
    const progression = LearningPathEngine.evalProgression(state, isZeroLevel);

    if (progression.canAdvance && progression.nextLevel) {
      const skills = Object.values(state.masteryProfile?.skills || {});
      const avgMastery =
        skills.length > 0
          ? Math.round(
              skills.reduce((sum: number, sk: any) => sum + (sk.score || 0), 0) / skills.length,
            )
          : 0;

      // Check if user previously dismissed this level candidate
      if (
        existing &&
        existing.status === 'dismissed' &&
        existing.candidateLevel === progression.nextLevel
      ) {
        // Re-evaluate only if there's new evidence (more completed lessons or higher mastery score)
        const hasNewEvidence =
          state.completedLessonsCount > existing.completedLessonsCount ||
          avgMastery > existing.masteryScore;
        if (!hasNewEvidence) {
          return null;
        }
      }

      const requiredThreshold = PROGRESSION_CONFIG.STANDARD_LEVEL_MASTERY_THRESHOLD;

      const candidate: LevelPromotionCandidate = {
        language: lang,
        currentLevel: state.currentLevel,
        candidateLevel: progression.nextLevel,
        reason: progression.explanation || `Passed requirements for ${progression.nextLevel}`,
        evidenceIds: (state.unfinishedLessons || []).map((l: any) => l.lessonId || l),
        masteryScore: avgMastery,
        requiredThreshold,
        createdAt: new Date().toISOString(),
        status: 'pending',
        completedLessonsCount: state.completedLessonsCount,
      };

      LearningTrackStorage.setPromotionCandidate(lang, candidate);
      return candidate;
    }

    return null;
  },

  /**
   * Retrieve the current pending promotion candidate if one exists.
   */
  getPromotionCandidate(language?: SupportedLanguage): LevelPromotionCandidate | null {
    const lang = language || LearningOrchestrator.getPrimaryLanguage();
    const candidate = LearningTrackStorage.getPromotionCandidate(lang);
    return candidate && candidate.status === 'pending' ? candidate : null;
  },

  /**
   * Confirm candidate promotion and advance the user to candidateLevel.
   */
  async confirmPromotion(
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): Promise<{ promoted: boolean; oldLevel: string; newLevel: string | null; reason: string }> {
    const lang = language || LearningOrchestrator.getPrimaryLanguage();
    const candidate = LearningTrackStorage.getPromotionCandidate(lang);

    if (!candidate || candidate.status !== 'pending') {
      return {
        promoted: false,
        oldLevel: LearningTrackStorage.getCurrentLevel(lang),
        newLevel: null,
        reason: 'No pending promotion candidate found.',
      };
    }

    const oldLevel = candidate.currentLevel;
    const newLevel = candidate.candidateLevel;

    // Update candidate status to confirmed
    candidate.status = 'confirmed';
    LearningTrackStorage.setPromotionCandidate(lang, candidate);

    // Update confirmed current level in local track storage
    LearningTrackStorage.setCurrentLevel(lang, newLevel);

    // Sync level to Supabase profile metadata
    if (userId && userId !== 'guest') {
      try {
        const { supabase } = await import('../lib/supabase');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.auth.updateUser({
            data: { current_level: newLevel, current_level_language: lang },
          });
        }
      } catch (err) {
        logger.warn('LearningProgressionService', 'Supabase profile sync failed', err);
      }
    }

    return {
      promoted: true,
      oldLevel,
      newLevel,
      reason: `Promotion confirmed by user: ${newLevel}`,
    };
  },

  /**
   * Dismiss/reject candidate promotion.
   */
  dismissPromotion(language?: SupportedLanguage): void {
    const lang = language || LearningOrchestrator.getPrimaryLanguage();
    const candidate = LearningTrackStorage.getPromotionCandidate(lang);
    if (candidate && candidate.status === 'pending') {
      candidate.status = 'dismissed';
      LearningTrackStorage.setPromotionCandidate(lang, candidate);
    }
  },

  /**
   * Internal: find a specific lesson node in the roadmap by ID.
   * Returns the node only if it belongs to the expected language.
   * This prevents cross-language lesson leakage.
   */
  _findLessonInRoadmap(
    roadmap: Parameters<typeof RoadmapService.getLearningRoadmap>[0] extends any ? any : any,
    lessonId: string,
    expectedLanguage: SupportedLanguage,
  ): RoadmapLessonNode | null {
    for (const level of roadmap.levels || []) {
      for (const unit of level.units || []) {
        for (const lesson of unit.lessons || []) {
          if (lesson.id === lessonId) {
            // Language guard: lesson id must start with the correct language prefix
            const langPrefix = expectedLanguage === 'ja' ? 'ja-' : 'en-';
            if (!lessonId.startsWith(langPrefix)) return null;
            return lesson as RoadmapLessonNode;
          }
        }
      }
    }
    return null;
  },

  /**
   * Internal: find the first accessible (non-locked, non-completed) lesson node
   * at a specific level code in the roadmap.
   * Returns null if the level is locked or has no accessible lessons.
   */
  _findFirstAccessibleAtLevel(
    roadmap: Parameters<typeof RoadmapService.getLearningRoadmap>[0] extends any ? any : any,
    levelCode: string,
    expectedLanguage: SupportedLanguage,
  ): RoadmapLessonNode | null {
    const ACCESSIBLE_STATUSES = new Set(['in_progress', 'current', 'available', 'weak']);
    const langPrefix = expectedLanguage === 'ja' ? 'ja-' : 'en-';
    for (const level of roadmap.levels || []) {
      if (level.code?.toLowerCase() !== levelCode?.toLowerCase()) continue;
      for (const unit of level.units || []) {
        for (const lesson of unit.lessons || []) {
          if (ACCESSIBLE_STATUSES.has(lesson.status) && lesson.id?.startsWith(langPrefix)) {
            return lesson as RoadmapLessonNode;
          }
        }
      }
    }
    return null;
  },
};

export type { NextLessonResult, NextLessonBucket };
export default LearningProgressionService;
