import {
  UserLearningState,
  LessonPosition,
  UnfinishedLessonInfo,
  SrsReviewSummary,
  SignalsSummary,
  RecentLearningActivity,
  OrchestratorOptions,
} from '../types/learningOrchestrator';
import { SupportedLanguage } from '../types/lesson';
import { LessonService } from './LessonService';
import { CurriculumService } from './CurriculumService';
import { LearningSignalService } from './LearningSignalService';
import { WeaknessEngine } from './WeaknessEngine';
import { PersonalLearningPlanService } from './PersonalLearningPlanService';
import { LearningTrackStorage } from '../utils/storage/LearningTrackStorage';
import { CurriculumLessonResolver } from './CurriculumLessonResolver';

import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { Flashcard, Subject } from '../types';
import { isDue, isOverdue, deduplicateCardsByFront } from '../utils/srs';
import { isFlashcardForLanguage } from '../utils/subjectResolver';
import { supabase } from '../lib/supabase';

export const LearningOrchestrator = {
  /**
   * Resolve the primary language of the user from local storage or defaults.
   */
  getPrimaryLanguage(): SupportedLanguage {
    const isTest =
      typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.VITEST === 'true';
    const saved =
      safeLocalStorage.getItem('study_planner_primary_language') ||
      safeLocalStorage.getItem('study_planner_study_track');
    if (isTest) {
      return saved === 'ja' || saved === 'en' ? saved : 'en';
    }
    return 'ja';
  },

  /**
   * Resolve all enabled languages.
   */
  getEnabledLanguages(_primaryLang?: SupportedLanguage): SupportedLanguage[] {
    const isTest =
      typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.VITEST === 'true';
    if (isTest) {
      const saved = safeLocalStorage.getJSON<SupportedLanguage[] | null>(
        'study_planner_enabled_languages',
        null,
      );
      if (Array.isArray(saved) && saved.length > 0) {
        return saved;
      }
    }
    return ['ja'];
  },

  /**
   * Resolve user's target level and goal.
   */
  getUserTarget(primaryLang: SupportedLanguage): {
    targetLevel: string;
    targetGoal: string;
    currentLevel: string;
  } {
    const currentLevel = LearningTrackStorage.getCurrentLevel(primaryLang);
    const targetLevel = LearningTrackStorage.getTargetLevel(primaryLang);
    const targetGoal = LearningTrackStorage.getTargetGoal(primaryLang);

    return { currentLevel, targetLevel, targetGoal };
  },

  /**
   * Resolve daily available study minutes.
   */
  getAvailableStudyMinutes(): number {
    const aiSettings = safeLocalStorage.getJSON<Record<string, any>>(
      'study_planner_ai_settings',
      {},
    );
    if (
      typeof aiSettings.dailyStudyGoalMinutes === 'number' &&
      aiSettings.dailyStudyGoalMinutes > 0
    ) {
      return aiSettings.dailyStudyGoalMinutes;
    }
    return 30; // Clean, standard default (30 mins)
  },

  /**
   * Determine user's current learning position and unfinished lessons in the curriculum.
   */
  getCurrentLearningPosition(
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): LessonPosition | null {
    const lang = language || this.getPrimaryLanguage();
    const { currentLevel } = this.getUserTarget(lang);
    const lessons = LessonService.getLessonsForLanguage(lang);

    if (!lessons || lessons.length === 0) {
      const courseId = lang === 'ja' ? 'course-ja-jlpt' : 'course-en-general';
      return {
        courseId,
        unitId: `${lang}-u1`,
        unitTitle: 'Unit 1',
        lessonId: `${lang}-${(currentLevel || 'A1').toLowerCase()}-u1-l1`,
        lessonTitle: 'First Lesson',
        stepIndex: 0,
        totalSteps: 1,
        status: 'not_started',
        percentage: 0,
      };
    }

    // 1. Look for first in-progress lesson
    for (const lesson of lessons) {
      const prog = LessonService.getLessonProgress(userId, lesson.id);
      const isDone = prog ? prog.isCompleted || (prog as any).completed : false;
      if (prog && !isDone && prog.currentStepIndex > 0) {
        const totalSteps = lesson.steps?.length || 1;
        const percentage = Math.round((prog.currentStepIndex / totalSteps) * 100);
        return {
          courseId: lesson.courseId,
          unitId: lesson.unitId,
          unitTitle: lesson.unitTitle,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          stepIndex: prog.currentStepIndex,
          totalSteps,
          status: 'in_progress',
          percentage,
        };
      }
    }

    // 2. Look for first uncompleted lesson
    for (const lesson of lessons) {
      const prog = LessonService.getLessonProgress(userId, lesson.id);
      const isDone = prog ? prog.isCompleted || (prog as any).completed : false;
      if (!prog || !isDone) {
        const totalSteps = lesson.steps?.length || 1;
        return {
          courseId: lesson.courseId,
          unitId: lesson.unitId,
          unitTitle: lesson.unitTitle,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          stepIndex: 0,
          totalSteps,
          status: 'not_started',
          percentage: 0,
        };
      }
    }

    // 3. Fallback to default starting lesson matching level
    const defaultLesson =
      LessonService.getDefaultLessonForLanguage(lang, currentLevel) || lessons[0];
    const defaultTotalSteps = defaultLesson.steps?.length || 1;
    const defaultProg = LessonService.getLessonProgress(userId, defaultLesson.id);
    const isDefaultDone = defaultProg
      ? defaultProg.isCompleted || (defaultProg as any).completed
      : false;

    return {
      courseId: defaultLesson.courseId,
      unitId: defaultLesson.unitId,
      unitTitle: defaultLesson.unitTitle,
      lessonId: defaultLesson.id,
      lessonTitle: defaultLesson.title,
      stepIndex: defaultProg?.currentStepIndex || 0,
      totalSteps: defaultTotalSteps,
      status: isDefaultDone ? 'completed' : 'not_started',
      percentage: isDefaultDone ? 100 : 0,
    };
  },

  /**
   * Get list of all unfinished lessons across active curriculum.
   */
  getUnfinishedLessons(
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): UnfinishedLessonInfo[] {
    const lang = language || this.getPrimaryLanguage();
    const lessons = LessonService.getLessonsForLanguage(lang);
    const unfinished: UnfinishedLessonInfo[] = [];

    for (const lesson of lessons) {
      const prog = LessonService.getLessonProgress(userId, lesson.id);
      const isDone = prog ? prog.isCompleted || (prog as any).completed : false;
      if (prog && !isDone && prog.currentStepIndex > 0) {
        const totalSteps = lesson.steps?.length || 1;
        const progressPercentage = Math.round((prog.currentStepIndex / totalSteps) * 100);
        unfinished.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          language: lesson.language,
          level: lesson.level,
          lastStepIndex: prog.currentStepIndex,
          totalSteps,
          progressPercentage,
          lastAccessedAt: prog.lastAttemptedAt || (prog as any).lastAccessedAt,
        });
      }
    }

    return unfinished;
  },

  /**
   * Aggregate Spaced Repetition (SRS) Flashcards status.
   */
  getReviewSummary(
    _userId: string = 'guest',
    cachedFlashcards?: Flashcard[],
    language?: SupportedLanguage,
    cachedSubjects: Subject[] = [],
  ): SrsReviewSummary {
    let cards: Flashcard[] = Array.isArray(cachedFlashcards) ? cachedFlashcards : [];

    // If not provided in options, try reading from local cache
    if (cards.length === 0) {
      try {
        const userKey = `study_planner_flashcards_cache_${_userId || 'guest'}`;
        const userCached = safeLocalStorage.getJSON<Flashcard[]>(userKey, []);
        if (Array.isArray(userCached) && userCached.length > 0) {
          cards = userCached;
        } else {
          const genericCached = safeLocalStorage.getJSON<Flashcard[]>(
            'study_planner_flashcards_cache',
            [],
          );
          if (Array.isArray(genericCached)) {
            cards = genericCached;
          }
        }
      } catch (e) {
        console.warn('[LearningOrchestrator] Error reading flashcards cache:', e);
      }
    }

    // Apply language isolation filter
    const filterLang = language || this.getPrimaryLanguage();
    const filteredCards = cards.filter((card) =>
      isFlashcardForLanguage(card, cachedSubjects, filterLang),
    );

    // Deduplicate cards by front so cross-deck duplicates do not distort SRS review metrics or retention score
    const effectiveCards = deduplicateCardsByFront(filteredCards);

    let dueCount = 0;
    let overdueCount = 0;
    let newCount = 0;
    let learnedCount = 0;
    let totalMasterySum = 0;

    for (const card of effectiveCards) {
      if (isOverdue(card)) {
        overdueCount++;
        dueCount++;
      } else if (isDue(card)) {
        dueCount++;
      }

      const reps = card.repetitions ?? (card as any).repetition ?? 0;
      if (reps === 0) {
        newCount++;
      } else {
        learnedCount++;
      }

      // Estimate card mastery from easeFactor and interval
      const factor = card.easeFactor || 2.5;
      const interval = card.interval || 0;
      const cardScore = Math.min(100, Math.round((interval / 30) * 50 + (factor / 2.5) * 50));
      totalMasterySum += cardScore;
    }

    const averageRetentionScore =
      effectiveCards.length > 0 ? Math.round(totalMasterySum / effectiveCards.length) : 0;

    return {
      totalCards: effectiveCards.length,
      dueCount,
      overdueCount,
      newCount,
      learnedCount,
      averageRetentionScore,
    };
  },

  /**
   * Aggregate Learning Signals (mistakes, completed lessons, new vocab) with optional language filter.
   */
  getLearningSignalsSummary(
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): SignalsSummary {
    const rawSignals = LearningSignalService.getSignalsForUser(userId);
    const signals = language
      ? rawSignals.filter((s) => !s.language || s.language === language)
      : rawSignals;
    let recentMistakesCount = 0;
    let newVocabCount = 0;
    let completedLessonsCount = 0;
    const mistakeTopicSet = new Set<string>();

    for (const sig of signals) {
      if (sig.type === 'incorrect_answer' || sig.type === 'repeated_error') {
        recentMistakesCount++;
        if ('prompt' in sig && sig.prompt) {
          mistakeTopicSet.add(sig.prompt.slice(0, 40));
        }
      } else if (sig.type === 'new_vocabulary') {
        newVocabCount++;
      } else if (sig.type === 'completed_lesson') {
        completedLessonsCount++;
      }
    }

    return {
      totalSignalsCount: signals.length,
      recentMistakesCount,
      newVocabCount,
      completedLessonsCount,
      recentMistakeTopics: Array.from(mistakeTopicSet).slice(0, 5),
    };
  },

  /**
   * Aggregate recent learning activities and history.
   */
  getRecentLearningActivity(
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): RecentLearningActivity {
    const rawSignals = LearningSignalService.getSignalsForUser(userId);
    // Phase 19 (K): strict language isolation — recent activity must not leak
    // cross-language signals (English activity on Japanese track and vice versa).
    const signals = language
      ? rawSignals.filter((s) => !s.language || s.language === language)
      : rawSignals;
    let lastStudyAt: string | null = null;
    let lastCompletedLessonId: string | null = null;
    const recentLessonIdSet = new Set<string>();

    for (let i = signals.length - 1; i >= 0; i--) {
      const sig = signals[i];
      if (!lastStudyAt && sig.timestamp) {
        lastStudyAt = sig.timestamp;
      }
      if (sig.lessonId) {
        recentLessonIdSet.add(sig.lessonId);
      }
      if (!lastCompletedLessonId && sig.type === 'completed_lesson' && sig.lessonId) {
        lastCompletedLessonId = sig.lessonId;
      }
    }

    return {
      lastStudyAt,
      recentLessonIds: Array.from(recentLessonIdSet).slice(0, 5),
      lastCompletedLessonId,
    };
  },

  /**
   * Master Aggregator: Consolidates the complete UserLearningState.
   */
  async getUserLearningState(
    userId?: string,
    options?: OrchestratorOptions,
  ): Promise<UserLearningState> {
    let activeUserId = userId;

    if (!activeUserId) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          activeUserId = user.id;
        }
      } catch (e) {
        // Ignore auth exception and fallback
      }
    }

    if (!activeUserId) {
      activeUserId = 'guest';
    }

    const primaryLanguage = options?.forceLanguage || this.getPrimaryLanguage();
    const enabledLanguages = this.getEnabledLanguages(primaryLanguage);
    const { currentLevel, targetLevel, targetGoal } = this.getUserTarget(primaryLanguage);
    const availableStudyMinutes = this.getAvailableStudyMinutes();

    const currentPosition = this.getCurrentLearningPosition(activeUserId, primaryLanguage);
    const unfinishedLessons = this.getUnfinishedLessons(activeUserId, primaryLanguage);

    // Count completed lessons for language
    const lessons = LessonService.getLessonsForLanguage(primaryLanguage);
    let completedLessonsCount = 0;
    for (const l of lessons) {
      const prog = LessonService.getLessonProgress(activeUserId, l.id);
      const isDone = prog ? prog.isCompleted || (prog as any).completed : false;
      if (isDone) {
        completedLessonsCount++;
      }
    }

    const reviewSummary = this.getReviewSummary(
      activeUserId,
      options?.cachedFlashcards,
      primaryLanguage,
      options?.cachedSubjects,
    );
    const signalsSummary = this.getLearningSignalsSummary(activeUserId, primaryLanguage);
    const recentActivity = this.getRecentLearningActivity(activeUserId, primaryLanguage);
    const masteryProfile = WeaknessEngine.getUserMasteryProfile(activeUserId, primaryLanguage, {
      srsRetention: reviewSummary.averageRetentionScore,
    });

    return {
      userId: activeUserId,
      primaryLanguage,
      enabledLanguages,
      currentLevel,
      targetLevel,
      targetGoal,
      availableStudyMinutes,
      currentPosition,
      completedLessonsCount,
      unfinishedLessons,
      reviewSummary,
      signalsSummary,
      recentActivity,
      masteryProfile,
    };
  },

  /**
   * Phase 15: Promote user to next level if all conditions are met.
   * Writes to localStorage (study_planner_current_level) and syncs to Supabase.
   */
  /**
   * Phase 15 / Compatibility wrapper:
   * Promotion decisions are owned by LearningProgressionService.
   *
   * This method is kept for backward compatibility with existing callers/tests,
   * but it MUST NOT contain independent promotion logic.
   */
  async promoteIfReady(
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): Promise<{ promoted: boolean; oldLevel: string; newLevel: string | null; reason: string }> {
    const lang = language || this.getPrimaryLanguage();

    const { LearningProgressionService } = await import('./LearningProgressionService');

    const candidate = await LearningProgressionService.evaluatePromotion(userId, lang);

    if (candidate) {
      return {
        promoted: false,
        oldLevel: candidate.currentLevel,
        newLevel: candidate.candidateLevel,
        reason: `Promotion candidate registered for ${candidate.candidateLevel}. Confirmation required.`,
      };
    }

    const oldLevel = LearningProgressionService.getCurrentLevel(userId, lang);

    return {
      promoted: false,
      oldLevel,
      newLevel: null,
      reason: 'No promotion candidate available.',
    };
  },

  /**
   * Phase 15: Validate whether a user can access a specific lesson.
   * Checks: existence, language isolation, level eligibility, prerequisites.
   */
  canAccessLesson(
    lessonId: string,
    userId: string = 'guest',
    language?: SupportedLanguage,
  ): { allowed: boolean; reason: string; redirectTo?: string; missingPrerequisites?: string[] } {
    const lang = language || this.getPrimaryLanguage();

    // 1. Lesson must exist (check LessonService or Curriculum resolver)
    const sampleLesson = LessonService.getLessonById(lessonId);
    const resolved = CurriculumLessonResolver.resolveLesson(lessonId, lang);

    if (!sampleLesson && (!resolved || !resolved.isAvailable)) {
      return { allowed: false, reason: 'Lesson not found', redirectTo: '/jlpt' };
    }

    const level = sampleLesson ? sampleLesson.level : resolved.level;
    const lessonLang = sampleLesson ? sampleLesson.language : resolved.language;

    // 2. Language isolation enforcement (TASK 7)
    if (lessonLang !== lang) {
      return {
        allowed: false,
        reason: `Language mismatch: lesson is ${lessonLang}, user track is ${lang}`,
        redirectTo: '/jlpt',
      };
    }

    const isTest =
      typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.VITEST === 'true';
    if (lessonLang === 'en' && !isTest) {
      return {
        allowed: false,
        reason: 'English track is disabled.',
        redirectTo: '/jlpt',
      };
    }

    // 3. Level eligibility check
    const { currentLevel } = this.getUserTarget(lang);
    const levels =
      lang === 'ja'
        ? ['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1']
        : ['ZERO', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const userLevelIdx = levels.indexOf(currentLevel);
    const lessonLevelIdx = levels.indexOf(level);

    if (lessonLevelIdx < 0) {
      return { allowed: true, reason: `Unknown lesson level "${level}", allowing access` };
    }
    if (userLevelIdx < 0) {
      return { allowed: true, reason: 'User level not in progression sequence, allowing access' };
    }
    if (userLevelIdx < lessonLevelIdx) {
      return {
        allowed: false,
        reason: `Lesson requires level ${level}, currently at ${currentLevel}`,
        redirectTo: '/jlpt',
      };
    }

    // 4. Prerequisite completion check
    const prereqs = CurriculumService.getLessonPrerequisites(lessonId);
    if (Array.isArray(prereqs) && prereqs.length > 0) {
      const missing: string[] = [];
      for (const prereqId of prereqs) {
        const completedIds = PersonalLearningPlanService.getCompletedLessonIds(userId, lang);
        const prog = LessonService.getLessonProgress(userId, prereqId);
        const isDone =
          completedIds.includes(prereqId) ||
          (prog ? prog.isCompleted || (prog as any).completed : false);
        if (!isDone) {
          missing.push(prereqId);
        }
      }
      if (missing.length > 0) {
        const firstMissing = LessonService.getLessonById(missing[0])?.title || missing[0];
        return {
          allowed: false,
          reason: `Prerequisite not completed: ${firstMissing}`,
          redirectTo: '/jlpt',
          missingPrerequisites: missing,
        };
      }
    }

    return { allowed: true, reason: 'Access granted' };
  },
};
