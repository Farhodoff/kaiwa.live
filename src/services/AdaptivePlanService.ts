import { UserLearningState } from '../types/learningOrchestrator';
import { DailyStudyPlan, DailyPlanItem } from '../types/dailyPlan';
import { CurriculumLessonResolver } from './CurriculumLessonResolver';

export const AdaptivePlanService = {
  /**
   * Generate an adaptive, time-constrained daily study plan based on user state.
   */
  generateDailyPlan(state: UserLearningState, customMinutes?: number): DailyStudyPlan {
    const totalMinutes = customMinutes || state.availableStudyMinutes || 30;
    const isJa = state.primaryLanguage === 'ja';
    const isBeginner =
      state.currentLevel === 'A1' ||
      state.currentLevel === 'A2' ||
      state.currentLevel === 'N5' ||
      state.currentLevel === 'N4';

    const pool: DailyPlanItem[] = [];

    // 1. Candidate: Critical or Due SRS Reviews
    const { dueCount, overdueCount } = state.reviewSummary;
    if (overdueCount > 0 || dueCount > 0) {
      let srsTime = Math.min(15, Math.max(5, Math.round(dueCount * 0.5)));
      if (totalMinutes === 15) srsTime = 5;
      else if (totalMinutes >= 60) srsTime = Math.min(20, Math.max(8, Math.round(dueCount * 0.6)));

      const srsPriority = overdueCount >= 10 ? 98 : overdueCount > 0 ? 92 : 78;

      pool.push({
        id: `srs-${Date.now()}`,
        type: 'srs_review',
        title: isJa
          ? `${dueCount || 10} ta fleshkartani takrorlash`
          : `Review ${dueCount || 10} Flashcards`,
        reason:
          overdueCount > 0
            ? isJa
              ? `${overdueCount} ta so'zning muddati o'tib ketgan.`
              : `${overdueCount} cards are overdue for review.`
            : isJa
              ? `Interval takrorlash bo'yicha bugungi mashg'ulot.`
              : `Scheduled spaced repetition review session.`,
        estimatedMinutes: srsTime,
        priority: srsPriority,
        route: isJa ? '/study-mode?lang=ja' : '/study-mode',
        isCompleted: false,
        metadata: { dueCount, overdueCount },
      });
    }

    // 2. Candidate: Unfinished Lesson (Resume)
    if (state.unfinishedLessons && state.unfinishedLessons.length > 0) {
      const unfinished = state.unfinishedLessons[0];
      const resolved = CurriculumLessonResolver.resolveLesson(
        unfinished.lessonId,
        state.primaryLanguage,
      );
      let lessonTime = totalMinutes <= 15 ? 10 : totalMinutes <= 30 ? 15 : 20;
      pool.push({
        id: `lesson-unfinished-${unfinished.lessonId}`,
        type: 'lesson',
        title: isJa
          ? `Darsni davom ettiring: ${unfinished.lessonTitle}`
          : `Resume: ${unfinished.lessonTitle}`,
        reason: isJa
          ? `Darsning ${unfinished.progressPercentage}% qismi bajarilgan.`
          : `Lesson is currently ${unfinished.progressPercentage}% complete.`,
        estimatedMinutes: lessonTime,
        priority: 95,
        route: resolved.route,
        lessonId: unfinished.lessonId,
        isCompleted: false,
        metadata: { stepIndex: unfinished.lastStepIndex },
      });
    } else if (
      state.currentPosition &&
      (!state.currentPosition.lessonId.includes('-') ||
        state.currentPosition.lessonId.startsWith(isJa ? 'ja-' : 'en-'))
    ) {
      // Candidate: Next Curriculum Lesson
      const resolved = CurriculumLessonResolver.resolveLesson(
        state.currentPosition.lessonId,
        state.primaryLanguage,
      );
      let lessonTime = totalMinutes <= 15 ? 10 : totalMinutes <= 30 ? 15 : 20;
      pool.push({
        id: `lesson-next-${state.currentPosition.lessonId}`,
        type: 'lesson',
        title: state.currentPosition.lessonTitle,
        reason: isJa ? `O'quv rejangizdagi navbatdagi dars.` : `Next scheduled curriculum lesson.`,
        estimatedMinutes: lessonTime,
        priority: 75,
        route: resolved.route,
        lessonId: state.currentPosition.lessonId,
        isCompleted: false,
        metadata: { courseId: state.currentPosition.courseId },
      });
    }

    // 3. Candidate: Top Weakness Remediation (from MasteryProfile)
    const topWeaknesses = state.masteryProfile?.topWeaknesses || [];
    if (topWeaknesses.length > 0) {
      const weakness = topWeaknesses[0];
      let weaknessTime = totalMinutes <= 15 ? 5 : totalMinutes <= 30 ? 7 : 12;
      const weaknessPriority = weakness.severity === 'high' ? 88 : 80;

      pool.push({
        id: `weakness-${weakness.skill}`,
        type: 'weakness_practice',
        title: isJa
          ? `${weakness.skill.toUpperCase()} mashg'uloti`
          : `${weakness.skill.toUpperCase()} Practice`,
        reason: weakness.reason,
        estimatedMinutes: weaknessTime,
        priority: weaknessPriority,
        route: weakness.recommendedRoute,
        skill: weakness.skill,
        isCompleted: false,
        metadata: { score: weakness.score, severity: weakness.severity },
      });
    }

    // 4. Candidate: Level / Exam Context Enrichment Practice
    if (!isBeginner) {
      // Advanced Enrichment (IELTS Speaking / Writing or JLPT Mock / Kanji)
      if (isJa) {
        pool.push({
          id: 'enrichment-speaking-ja',
          type: 'speaking',
          title: 'AI bilan jonli yaponcha muloqot',
          reason: 'Ravon gapirish va talaffuzni mustahkamlash mashqi.',
          estimatedMinutes: 10,
          priority: 60,
          route: '/speaking-coach?lang=ja',
          isCompleted: false,
        });
      } else {
        pool.push({
          id: 'enrichment-speaking-en',
          type: 'speaking',
          title: 'AI bilan jonli muloqot',
          reason: 'Ovozli muloqot amaliyoti va talaffuzni mustahkamlash.',
          estimatedMinutes: 10,
          priority: 60,
          route: '/speaking-coach?lang=ja',
          isCompleted: false,
        });
      }
    } else {
      // Beginner Safe Enrichment
      if (isJa) {
        pool.push({
          id: 'enrichment-kanji-ja',
          type: 'reading',
          title: "Boshlang'ich Kanji va lug'at mashqi",
          reason: "Asosiy belgilar va so'zlarni mustahkamlash.",
          estimatedMinutes: 7,
          priority: 55,
          route: '/jlpt',
          isCompleted: false,
        });
      } else {
        pool.push({
          id: 'enrichment-vocab-en',
          type: 'reading',
          title: "Lug'at boyligini oshirish mashqi",
          reason: "A1/A2 bosqichi uchun yangi so'zlar tahlili.",
          estimatedMinutes: 7,
          priority: 55,
          route: '/vocabulary',
          isCompleted: false,
        });
      }
    }

    // 5. Fallback if pool is empty
    if (pool.length === 0) {
      const fallbackRoute = '/jlpt';
      pool.push({
        id: 'fallback-action',
        type: 'lesson',
        title: "Yapon tili mashg'ulotlari",
        reason: "Kunlik reja bo'yicha darslar.",
        estimatedMinutes: totalMinutes,
        priority: 50,
        route: fallbackRoute,
        isCompleted: false,
      });
    }

    // Sort pool strictly by priority descending
    pool.sort((a, b) => b.priority - a.priority);

    // Fit candidates into totalMinutes budget
    const selectedItems: DailyPlanItem[] = [];
    let allocated = 0;

    for (const item of pool) {
      const remainingBudget = totalMinutes - allocated;
      if (remainingBudget < 5) {
        break; // No room for minimum 5 min block
      }

      let itemTime = Math.min(item.estimatedMinutes, remainingBudget);
      if (itemTime >= 5) {
        selectedItems.push({
          ...item,
          estimatedMinutes: itemTime,
        });
        allocated += itemTime;
      }
    }

    // Distribute any remaining difference to ensure sum(minutes) === totalMinutes
    const remainder = totalMinutes - allocated;
    if (remainder > 0 && selectedItems.length > 0) {
      selectedItems[0].estimatedMinutes += remainder;
      allocated += remainder;
    }

    // Determine plan summary & reasoning
    const primaryFocus =
      selectedItems.length > 0
        ? selectedItems[0].title
        : isJa
          ? "O'quv mashg'uloti"
          : 'Study Session';
    const reason = isJa
      ? `Bugungi reja ${state.currentLevel} darajasi va kunlik ${totalMinutes} daqiqalik maqsadingiz asosida optimallashtirildi.`
      : `Today's plan is tailored for your ${state.currentLevel} level and ${totalMinutes}-minute goal.`;

    return {
      userId: state.userId,
      language: state.primaryLanguage,
      totalMinutes,
      allocatedMinutes: allocated,
      generatedAt: new Date().toISOString(),
      items: selectedItems,
      summary: {
        primaryFocus,
        reason,
      },
    };
  },
};
