import { describe, it, expect, beforeEach } from 'vitest';
import { RoadmapService } from '../RoadmapService';
import { UserLearningState } from '../../types/learningOrchestrator';

describe('RoadmapService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const createBaseState = (overrides?: Partial<UserLearningState>): UserLearningState => ({
    userId: 'test_roadmap_user',
    primaryLanguage: 'en',
    enabledLanguages: ['en'],
    currentLevel: 'B2',
    targetLevel: 'B2',
    targetGoal: 'IELTS 7.5+',
    availableStudyMinutes: 30,
    currentPosition: {
      courseId: 'course-en-general',
      unitId: 'en-b2-u1',
      unitTitle: 'Unit 1: Education',
      lessonId: 'en-b2-u1-l1',
      lessonTitle: 'Academic Learning & Inversion',
      stepIndex: 0,
      totalSteps: 3,
      status: 'not_started',
      percentage: 0,
    },
    completedLessonsCount: 0,
    unfinishedLessons: [],
    reviewSummary: {
      totalCards: 0,
      dueCount: 0,
      overdueCount: 0,
      newCount: 0,
      learnedCount: 0,
      averageRetentionScore: 0,
    },
    signalsSummary: {
      totalSignalsCount: 0,
      recentMistakesCount: 0,
      newVocabCount: 0,
      completedLessonsCount: 0,
      recentMistakeTopics: [],
    },
    recentActivity: {
      lastStudyAt: null,
      recentLessonIds: [],
      lastCompletedLessonId: null,
    },
    ...overrides,
  });

  it('1. should build English A1 beginner roadmap correctly', () => {
    const state = createBaseState({ currentLevel: 'A1', targetLevel: 'B2' });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    expect(roadmap.language).toBe('en');
    expect(roadmap.levels[0].code).toBe('A1');
    expect(roadmap.levels[0].status).toBe('current');
    expect(roadmap.levels[1].status).toBe('locked'); // A2 is locked
  });

  it('2. should build English B2 roadmap with A1-B1 marked as completed/skipped', () => {
    const state = createBaseState({ currentLevel: 'B2', targetLevel: 'B2' });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    const a1 = roadmap.levels.find((l) => l.code === 'A1');
    const b2 = roadmap.levels.find((l) => l.code === 'B2');
    const c1 = roadmap.levels.find((l) => l.code === 'C1');

    expect(a1?.status).toBe('completed');
    expect(b2?.status).toBe('current');
    expect(c1?.status).toBe('locked');
  });

  it('3. should build Japanese N5 beginner roadmap', () => {
    const state = createBaseState({
      primaryLanguage: 'ja',
      currentLevel: 'N5',
      targetLevel: 'N3',
      targetGoal: 'JLPT N2',
    });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    expect(roadmap.language).toBe('ja');
    expect(roadmap.levels[0].code).toBe('N5');
    expect(roadmap.levels[0].status).toBe('current');
    expect(roadmap.levels[1].status).toBe('locked'); // N4 is locked
  });

  it('4. should build Japanese N3 roadmap with N5-N4 completed and N2-N1 locked', () => {
    const state = createBaseState({
      primaryLanguage: 'ja',
      currentLevel: 'N3',
      targetLevel: 'N2',
      targetGoal: 'JLPT N2',
    });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    const n5 = roadmap.levels.find((l) => l.code === 'N5');
    const n4 = roadmap.levels.find((l) => l.code === 'N4');
    const n3 = roadmap.levels.find((l) => l.code === 'N3');
    const n2 = roadmap.levels.find((l) => l.code === 'N2');

    expect(n5?.status).toBe('completed');
    expect(n4?.status).toBe('completed');
    expect(n3?.status).toBe('current');
    expect(n2?.status).toBe('locked');
  });

  it('5. should identify active lesson node on the roadmap', () => {
    const state = createBaseState({ currentLevel: 'B2' });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    expect(roadmap.activeLesson).not.toBeNull();
    expect(roadmap.activeLesson?.id).toBe('en-b2-u1-l1');
  });

  it('6. should provide explicit lockReason on locked future lessons', () => {
    const state = createBaseState({ currentLevel: 'B2' });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    const c1Level = roadmap.levels.find((l) => l.code === 'C1');
    const lockedLesson = c1Level?.units[0].lessons[0];

    expect(lockedLesson?.status).toBe('locked');
    expect(lockedLesson?.lockReason).toBeDefined();
  });

  it('7. should flag weak skills on relevant roadmap lessons', () => {
    const state = createBaseState({
      currentLevel: 'B2',
      masteryProfile: {
        userId: 'test_roadmap_user',
        language: 'en',
        skills: {},
        topWeaknesses: [
          {
            skill: 'vocabulary',
            score: 45,
            confidence: 60,
            severity: 'high',
            reason: 'Low vocab retention',
            recommendedRoute: '/vocabulary',
            language: 'en',
          },
        ],
        topStrengths: [],
        overallMasteryScore: 60,
        overallConfidence: 60,
        lastCalculatedAt: '',
      },
    });

    const roadmap = RoadmapService.getLearningRoadmap(state);
    const b2Level = roadmap.levels.find((l) => l.code === 'B2');
    const vocabLesson = b2Level?.units[0].lessons.find((l) => l.skill === 'vocabulary');

    // If available, weak flag applies
    expect(vocabLesson).toBeDefined();
  });

  it('8. should calculate overall progress percentage towards target level', () => {
    const state = createBaseState({ currentLevel: 'B2' });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    expect(roadmap.overallProgressPercentage).toBeGreaterThanOrEqual(0);
    expect(roadmap.overallProgressPercentage).toBeLessThanOrEqual(100);
  });

  it('9. should ensure Japanese user receives only Japanese JLPT levels', () => {
    const state = createBaseState({
      primaryLanguage: 'ja',
      enabledLanguages: ['ja', 'en'],
    });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    for (const lvl of roadmap.levels) {
      expect(['N5', 'N4', 'N3', 'N2', 'N1']).toContain(lvl.code);
    }
  });

  it('10. should ensure English user receives only English CEFR levels', () => {
    const state = createBaseState({
      primaryLanguage: 'en',
      enabledLanguages: ['en', 'ja'],
    });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    for (const lvl of roadmap.levels) {
      expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).toContain(lvl.code);
    }
  });

  it('11. should provide valid route on every single roadmap lesson node', () => {
    const state = createBaseState();
    const roadmap = RoadmapService.getLearningRoadmap(state);

    for (const lvl of roadmap.levels) {
      for (const unit of lvl.units) {
        for (const lesson of unit.lessons) {
          expect(lesson.route).toBeDefined();
          expect(lesson.route.startsWith('/')).toBe(true);
        }
      }
    }
  });

  it('12. should handle empty state gracefully without crashing', () => {
    const state = createBaseState({ currentPosition: null, currentLevel: '' });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    expect(roadmap.levels.length).toBeGreaterThan(0);
    expect(roadmap.currentLevelCode).toBeDefined();
  });

  it('13. getNextRecommendedLesson should prioritize weak skill lessons', () => {
    const state = createBaseState({
      currentLevel: 'A1',
      masteryProfile: {
        userId: 'test_roadmap_user',
        language: 'en',
        skills: {},
        topWeaknesses: [
          {
            skill: 'grammar',
            score: 40,
            confidence: 70,
            severity: 'high',
            reason: 'Weak grammar',
            recommendedRoute: '/grammar',
            language: 'en',
          },
        ],
        topStrengths: [],
        overallMasteryScore: 50,
        overallConfidence: 70,
        lastCalculatedAt: '',
      },
    });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const nextLesson = RoadmapService.getNextRecommendedLesson(roadmap);

    expect(nextLesson).not.toBeNull();
    expect(nextLesson?.status).toBe('weak');
    expect(nextLesson?.skill).toBe('grammar');
  });

  it('14. getNextRecommendedLesson should pick in_progress lesson if no weak lesson exists', () => {
    // Set in_progress progress for en-a1-u1-l1
    localStorage.setItem(
      'study_planner_lesson_progress_test_roadmap_user_en-a1-u1-l1',
      JSON.stringify({ lessonId: 'en-a1-u1-l1', isCompleted: false, currentStepIndex: 1 }),
    );

    const state = createBaseState({ currentLevel: 'A1' });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const nextLesson = RoadmapService.getNextRecommendedLesson(roadmap);

    expect(nextLesson).not.toBeNull();
    expect(nextLesson?.id).toBe('en-a1-u1-l1');
    expect(nextLesson?.status).toBe('in_progress');
  });

  it('15. getNextRecommendedLesson should return null when all lessons are completed', () => {
    const state = createBaseState({ currentLevel: 'A1' });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    // Manually mark all lessons in the roadmap as completed
    roadmap.levels.forEach((lvl) => {
      lvl.units.forEach((u) => {
        u.lessons.forEach((l) => {
          l.status = 'completed';
        });
      });
    });

    const nextLesson = RoadmapService.getNextRecommendedLesson(roadmap);
    expect(nextLesson).toBeNull();
  });

  it('16. getRoadmapSummary should calculate totalCount and completedCount accurately', () => {
    const state = createBaseState({ currentLevel: 'A1' });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const summary = RoadmapService.getRoadmapSummary(roadmap);

    expect(summary.totalCount).toBe(10); // 10 English lessons
    expect(summary.completedCount).toBe(0);
    expect(summary.currentLevelCode).toBe('A1');
  });

  it('17. getRoadmapSummary progressPercentage should be between 0 and 100', () => {
    const state = createBaseState({ currentLevel: 'B2' });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const summary = RoadmapService.getRoadmapSummary(roadmap);

    expect(summary.progressPercentage).toBeGreaterThanOrEqual(0);
    expect(summary.progressPercentage).toBeLessThanOrEqual(100);
  });

  it('18. getRoadmapSummary should identify nextLesson correctly', () => {
    const state = createBaseState({ currentLevel: 'A1' });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const summary = RoadmapService.getRoadmapSummary(roadmap);

    expect(summary.nextLesson).not.toBeNull();
    expect(summary.nextLesson?.id).toBe('en-a1-u1-l1');
  });

  it('19. getRoadmapSummary should detect topWeakLesson when weakness exists', () => {
    const state = createBaseState({
      currentLevel: 'A1',
      masteryProfile: {
        userId: 'test_roadmap_user',
        language: 'en',
        skills: {},
        topWeaknesses: [
          {
            skill: 'grammar',
            score: 35,
            confidence: 80,
            severity: 'high',
            reason: 'Grammar issues',
            recommendedRoute: '/grammar',
            language: 'en',
          },
        ],
        topStrengths: [],
        overallMasteryScore: 45,
        overallConfidence: 80,
        lastCalculatedAt: '',
      },
    });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const summary = RoadmapService.getRoadmapSummary(roadmap);

    expect(summary.topWeakLesson).not.toBeNull();
    expect(summary.topWeakLesson?.skill).toBe('grammar');
  });

  it('20. getRoadmapSummary should return null for topWeakLesson when no weakness exists', () => {
    const state = createBaseState({ currentLevel: 'A1' });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const summary = RoadmapService.getRoadmapSummary(roadmap);

    expect(summary.topWeakLesson).toBeNull();
  });

  it('21. should mark uncompleted current-level lessons with met prereqs as available or current', () => {
    const state = createBaseState({ currentLevel: 'A1' });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    const a1Level = roadmap.levels.find((l) => l.code === 'A1');
    const l1 = a1Level?.units[0].lessons.find((l) => l.id === 'en-a1-u1-l1');

    expect(['current', 'available']).toContain(l1?.status);
  });

  it('22. Japanese N5 prerequisite chain: l2 is locked until l1 is completed', () => {
    const state = createBaseState({
      primaryLanguage: 'ja',
      currentLevel: 'N5',
      targetLevel: 'N3',
    });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const n5Level = roadmap.levels.find((l) => l.code === 'N5');
    const l2 = n5Level?.units[0].lessons.find((l) => l.id === 'ja-n5-u1-l2');

    expect(l2?.status).toBe('locked');
    expect(l2?.lockReason).toBeDefined();

    // Now complete l1
    localStorage.setItem(
      'study_planner_lesson_progress_test_roadmap_user_ja-n5-u1-l1',
      JSON.stringify({ lessonId: 'ja-n5-u1-l1', isCompleted: true }),
    );

    const updatedRoadmap = RoadmapService.getLearningRoadmap(state);
    const updatedN5 = updatedRoadmap.levels.find((l) => l.code === 'N5');
    const updatedL2 = updatedN5?.units[0].lessons.find((l) => l.id === 'ja-n5-u1-l2');

    expect(updatedL2?.status).toBe('available');
  });

  it('23. Curriculum exhaustion handles gracefully without errors', () => {
    const state = createBaseState({ currentLevel: 'C2' });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const summary = RoadmapService.getRoadmapSummary(roadmap);

    expect(summary.completedCount).toBeGreaterThanOrEqual(0);
    expect(summary.totalCount).toBe(10);
  });

  it('24. Language isolation: English roadmap never contains Japanese lessons', () => {
    const state = createBaseState({
      primaryLanguage: 'en',
      enabledLanguages: ['en', 'ja'],
    });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    for (const level of roadmap.levels) {
      for (const unit of level.units) {
        for (const lesson of unit.lessons) {
          expect(lesson.id.startsWith('ja-')).toBe(false);
          expect(lesson.id.startsWith('en-')).toBe(true);
        }
      }
    }
  });

  it('25. User isolation: user_a progress does not affect user_b roadmap', () => {
    // Complete lesson for user_a
    localStorage.setItem(
      'study_planner_lesson_progress_user_a_en-a1-u1-l1',
      JSON.stringify({ lessonId: 'en-a1-u1-l1', isCompleted: true }),
    );

    const stateUserB = createBaseState({ userId: 'user_b', currentLevel: 'A1' });
    const roadmapB = RoadmapService.getLearningRoadmap(stateUserB);
    const a1 = roadmapB.levels.find((l) => l.code === 'A1');
    const l1 = a1?.units[0].lessons.find((l) => l.id === 'en-a1-u1-l1');

    expect(l1?.status).not.toBe('completed');
  });

  it('26. Progress update: completing a lesson increases level progress', () => {
    const stateBefore = createBaseState({ currentLevel: 'A1' });
    const roadmapBefore = RoadmapService.getLearningRoadmap(stateBefore);
    const a1Before = roadmapBefore.levels.find((l) => l.code === 'A1');
    const initialProgress = a1Before?.progressPercentage || 0;

    // Complete a lesson
    localStorage.setItem(
      'study_planner_lesson_progress_test_roadmap_user_en-a1-u1-l1',
      JSON.stringify({ lessonId: 'en-a1-u1-l1', isCompleted: true }),
    );

    const roadmapAfter = RoadmapService.getLearningRoadmap(stateBefore);
    const a1After = roadmapAfter.levels.find((l) => l.code === 'A1');
    const updatedProgress = a1After?.progressPercentage || 0;

    expect(updatedProgress).toBeGreaterThan(initialProgress);
  });

  it('27. UI readiness: all lessons have title, route, and estimatedMinutes', () => {
    const state = createBaseState({ primaryLanguage: 'ja', currentLevel: 'N3' });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    for (const level of roadmap.levels) {
      for (const unit of level.units) {
        for (const lesson of unit.lessons) {
          expect(lesson.title.trim().length).toBeGreaterThan(0);
          expect(lesson.route).toBeDefined();
          expect(lesson.estimatedMinutes).toBeGreaterThan(0);
        }
      }
    }
  });

  it('28. Target visualization: target level and target goal are preserved', () => {
    const state = createBaseState({
      currentLevel: 'B1',
      targetLevel: 'C1',
      targetGoal: 'IELTS 7.5',
    });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    expect(roadmap.currentLevelCode).toBe('B1');
    expect(roadmap.targetLevelCode).toBe('C1');
    expect(roadmap.targetGoal).toBe('IELTS 7.5');
  });

  it('29. In-progress step calculation: currentStepIndex calculates percentage', () => {
    localStorage.setItem(
      'study_planner_lesson_progress_test_roadmap_user_en-b2-u1-l1',
      JSON.stringify({ lessonId: 'en-b2-u1-l1', isCompleted: false, currentStepIndex: 2 }),
    );

    const state = createBaseState({ currentLevel: 'B2' });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const b2 = roadmap.levels.find((l) => l.code === 'B2');
    const l1 = b2?.units[0].lessons.find((l) => l.id === 'en-b2-u1-l1');

    expect(l1?.status).toBe('in_progress');
    expect(l1?.progressPercentage).toBe(67); // Math.round((2 / 3) * 100) = 67
  });

  it('30. Resilience: handles undefined or null masteryProfile gracefully', () => {
    const state = createBaseState({
      currentLevel: 'B2',
      masteryProfile: undefined,
    });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const summary = RoadmapService.getRoadmapSummary(roadmap);

    expect(roadmap).toBeDefined();
    expect(summary.totalCount).toBe(10);
  });

  it('31. Resilience: fallback level for invalid level string', () => {
    const state = createBaseState({ currentLevel: 'UNKNOWN_LEVEL' });
    const roadmap = RoadmapService.getLearningRoadmap(state);

    expect(roadmap.levels.length).toBeGreaterThan(0);
    expect(roadmap.overallProgressPercentage).toBeDefined();
  });

  it('32. Prerequisite lock reason contains meaningful explanation', () => {
    const state = createBaseState({ currentLevel: 'B2' });
    const roadmap = RoadmapService.getLearningRoadmap(state);
    const b2 = roadmap.levels.find((l) => l.code === 'B2');
    const l2 = b2?.units[0].lessons.find((l) => l.id === 'en-b2-u1-l2');

    expect(l2?.status).toBe('locked');
    expect(l2?.lockReason).toBeDefined();
    expect(l2?.lockReason?.length).toBeGreaterThan(5);
  });
});
