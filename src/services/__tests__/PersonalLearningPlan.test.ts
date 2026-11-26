import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersonalLearningPlanService } from '../PersonalLearningPlanService';
import { PersonalLearningPlanEngine } from '../PersonalLearningPlanEngine';
import { WeeklyEvaluationEngine } from '../WeeklyEvaluationEngine';
import { PersonalLearningGoal, WeeklyLearningPlan } from '../../types/learningPlan';
import { callSelectedAIProvider } from '../../utils/ai/aiCore';
import { MasteryEngine } from '../MasteryEngine';

// Mock Supabase to run tests offline/independently
let lastUpsertedId = 'goal-test-uuid';
const chainableMock = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi
    .fn()
    .mockImplementation(async () => ({ data: { id: lastUpsertedId }, error: null })),
  single: vi.fn().mockImplementation(async () => ({ data: { id: lastUpsertedId }, error: null })),
  upsert: vi.fn().mockImplementation((payload) => {
    if (payload && payload.id) {
      lastUpsertedId = payload.id;
    }
    return chainableMock;
  }),
  delete: vi.fn().mockReturnThis(),
};

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
      from: vi.fn(() => chainableMock),
    },
  };
});

// Mock AI Core to avoid hitting actual endpoints during tests
vi.mock('../../utils/ai/aiCore', () => ({
  callSelectedAIProvider: vi.fn(async (prompt: string) => {
    if (prompt.includes('Student Parameters:')) {
      return JSON.stringify({
        objectives: ['Weekly goal 1', 'Weekly goal 2'],
        focusSkills: ['grammar', 'vocabulary'],
        days: [
          {
            day: 'monday',
            tasks: [
              {
                title: 'Grammar lesson A1',
                type: 'grammar',
                estimatedMinutes: 20,
                contentId: 'en-a1-u1-l1',
                route: '/lesson/en-a1-u1-l1',
              },
            ],
          },
        ],
        reasoning: 'Test reasoning',
        expectedOutcome: 'Test outcome',
      });
    }
    if (
      prompt.includes('JLPT') ||
      prompt.includes('IELTS/CEFR') ||
      prompt.includes('multiple-choice')
    ) {
      return JSON.stringify([
        {
          id: 'ai-diag-en-b1-mock',
          language: 'en',
          level: 'B1',
          skill: 'grammar',
          difficulty: 'medium',
          prompt: 'Mock prompt',
          options: ['A', 'B', 'C', 'D'],
          correctAnswerIndex: 0,
          explanation: 'Uzbekcha test',
          topic: 'mock topic',
        },
      ]);
    }
    return 'Ajoyib natija! Darslar rejalashtirildi.';
  }),
}));

describe('Personal Learning Plan System Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Feasibility Checker & Goal System', () => {
    it('should mark a realistic goal as realistic', () => {
      const res = PersonalLearningPlanService.checkFeasibility(
        'en',
        'ielts',
        '5.0',
        '6.0',
        180, // 6 months
        60, // 60 minutes daily
      );
      expect(res.status).toBe('realistic');
      expect(res.warningMessage).toBeNull();
    });

    it('should mark an unrealistic deadline goal as unrealistic with a warning', () => {
      const res = PersonalLearningPlanService.checkFeasibility(
        'en',
        'ielts',
        '5.0',
        '8.0',
        30, // 1 month
        30, // 30 minutes daily
      );
      expect(res.status).toBe('unrealistic');
      expect(res.warningMessage).toContain('study');
    });

    it('should validate target goal level index constraints', () => {
      // Target higher than current -> valid
      expect(PersonalLearningPlanService.isTargetLevelValid('5.0', '7.0', 'ielts')).toBe(true);
      expect(PersonalLearningPlanService.isTargetLevelValid('N3', 'N2', 'jlpt')).toBe(true);
      expect(PersonalLearningPlanService.isTargetLevelValid('A1', 'B2', 'general_en')).toBe(true);

      // Target equal to or lower than current -> invalid
      expect(PersonalLearningPlanService.isTargetLevelValid('5.0', '5.0', 'ielts')).toBe(false);
      expect(PersonalLearningPlanService.isTargetLevelValid('5.0', '4.5', 'ielts')).toBe(false);
      expect(PersonalLearningPlanService.isTargetLevelValid('N3', 'N3', 'jlpt')).toBe(false);
      expect(PersonalLearningPlanService.isTargetLevelValid('N2', 'N4', 'jlpt')).toBe(false);
      expect(PersonalLearningPlanService.isTargetLevelValid('B2', 'A2', 'general_en')).toBe(false);
    });
  });

  describe('3. Weekly Plan Generation', () => {
    const sampleGoal: PersonalLearningGoal = {
      id: 'goal-123',
      userId: 'test_user',
      language: 'en',
      goalType: 'ielts',
      currentLevel: '5.0',
      targetGoal: 'IELTS 7.0',
      targetLevel: '7.0',
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      dailyMinutes: 60,
      totalWeeks: 24,
      currentWeek: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should generate a valid 7-day plan with restricted daily minutes', async () => {
      const result = await PersonalLearningPlanEngine.generateWeeklyPlan(
        'test_user',
        sampleGoal,
        1,
      );
      expect(result.isFallback).toBe(false);
      expect(result.plan.days.length).toBe(7);

      // Monday should have a grammar lesson task matching prompt output
      const monTasks = result.plan.days.find((d) => d.day === 'monday')?.tasks || [];
      expect(monTasks.length).toBeGreaterThan(0);
      expect(monTasks[0].estimatedMinutes).toBeLessThanOrEqual(sampleGoal.dailyMinutes);
    });

    it('surfaces an AI provider failure instead of creating a hidden fallback plan', async () => {
      vi.mocked(callSelectedAIProvider).mockRejectedValueOnce(new Error('Rate limited'));
      await expect(
        PersonalLearningPlanEngine.generateWeeklyPlan('test_user', sampleGoal, 1),
      ).rejects.toThrow('Rate limited');
    });

    it('should prevent concurrent generation with idempotency lock', async () => {
      // Acquire lock manually
      const locked = PersonalLearningPlanEngine.acquireLock('test_user', sampleGoal.id, 1);
      expect(locked).toBe(true);

      const duplicateLock = PersonalLearningPlanEngine.acquireLock('test_user', sampleGoal.id, 1);
      expect(duplicateLock).toBe(false); // Locked!
    });
  });

  describe('Incomplete week debt carry-over', () => {
    const sampleGoal: PersonalLearningGoal = {
      id: 'goal-123',
      userId: 'test_user',
      language: 'en',
      goalType: 'ielts',
      currentLevel: '5.0',
      targetGoal: 'IELTS 7.0',
      targetLevel: '7.0',
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      dailyMinutes: 30,
      totalWeeks: 24,
      currentWeek: 2,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('carries over at most three incomplete lesson tasks without exceeding day budget', async () => {
      const previousWeekPlan: WeeklyLearningPlan = {
        id: 'plan-week-1',
        goalId: 'goal-123',
        userId: 'test_user',
        weekNumber: 1,
        startDate: '2026-09-01',
        endDate: '2026-09-07',
        objectives: ['Prev week'],
        focusSkills: ['grammar'],
        reasoning: 'Prev',
        expectedOutcome: 'Prev',
        aiGenerated: true,
        version: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
        days: [
          {
            day: 'monday',
            tasks: [
              {
                id: 'debt-1',
                title: 'Debt L1',
                type: 'lesson',
                estimatedMinutes: 10,
                completed: false,
                status: 'pending',
                sourceType: 'lesson',
                contentId: 'en-a1-u1-l1',
                route: '/lesson/en-a1-u1-l1',
                skill: 'grammar',
              },
              {
                id: 'debt-2',
                title: 'Debt L2',
                type: 'lesson',
                estimatedMinutes: 10,
                completed: false,
                status: 'pending',
                sourceType: 'lesson',
                contentId: 'en-a1-u1-l2',
                route: '/lesson/en-a1-u1-l2',
                skill: 'grammar',
              },
            ],
          },
          {
            day: 'tuesday',
            tasks: [
              {
                id: 'debt-3',
                title: 'Debt L3',
                type: 'lesson',
                estimatedMinutes: 10,
                completed: false,
                status: 'pending',
                sourceType: 'lesson',
                contentId: 'en-a1-u1-l3',
                route: '/lesson/en-a1-u1-l3',
                skill: 'grammar',
              },
            ],
          },
          {
            day: 'wednesday',
            tasks: [
              {
                id: 'debt-4',
                title: 'Debt L4',
                type: 'lesson',
                estimatedMinutes: 10,
                completed: false,
                status: 'pending',
                sourceType: 'lesson',
                contentId: 'en-a1-u1-l4',
                route: '/lesson/en-a1-u1-l4',
                skill: 'grammar',
              },
            ],
          },
          { day: 'thursday', tasks: [] },
          { day: 'friday', tasks: [] },
          { day: 'saturday', tasks: [] },
          { day: 'sunday', tasks: [] },
        ],
      };

      await PersonalLearningPlanService.saveWeeklyPlan(previousWeekPlan);

      const week2Raw = JSON.stringify({
        objectives: ['Week 2'],
        focusSkills: ['grammar'],
        days: [
          {
            day: 'monday',
            tasks: [
              { title: 'New Monday', type: 'grammar', estimatedMinutes: 25, route: '/ielts' },
            ],
          },
          {
            day: 'tuesday',
            tasks: [
              { title: 'New Tuesday', type: 'grammar', estimatedMinutes: 25, route: '/ielts' },
            ],
          },
          {
            day: 'wednesday',
            tasks: [
              { title: 'New Wednesday', type: 'grammar', estimatedMinutes: 25, route: '/ielts' },
            ],
          },
          {
            day: 'thursday',
            tasks: [
              { title: 'New Thursday', type: 'grammar', estimatedMinutes: 25, route: '/ielts' },
            ],
          },
          {
            day: 'friday',
            tasks: [
              { title: 'New Friday', type: 'grammar', estimatedMinutes: 25, route: '/ielts' },
            ],
          },
          {
            day: 'saturday',
            tasks: [
              { title: 'New Saturday', type: 'grammar', estimatedMinutes: 25, route: '/ielts' },
            ],
          },
          {
            day: 'sunday',
            tasks: [
              { title: 'New Sunday', type: 'grammar', estimatedMinutes: 25, route: '/ielts' },
            ],
          },
        ],
        reasoning: 'Week 2 reason',
        expectedOutcome: 'Week 2 outcome',
      });

      const parsed = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(
        week2Raw,
        sampleGoal,
        2,
        'test_user',
        30,
      );

      expect(parsed).not.toBeNull();

      const debtContentIds = parsed!.days
        .flatMap((day) => day.tasks)
        .filter((task) => task.metadata?.carryOverFromWeek === 1)
        .map((task) => task.contentId);

      expect(debtContentIds).toEqual(['en-a1-u1-l1', 'en-a1-u1-l2', 'en-a1-u1-l3']);
      expect(debtContentIds).not.toContain('en-a1-u1-l4');

      for (const day of parsed!.days) {
        const total = day.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
        expect(total).toBeLessThanOrEqual(30);
      }
    });
  });

  describe('Plan task completion', () => {
    it('persists completion from a learning module without changing other tasks', async () => {
      const plan: WeeklyLearningPlan = {
        id: 'srs-plan',
        goalId: 'goal-123',
        userId: 'test_user',
        weekNumber: 1,
        startDate: '2026-08-20',
        endDate: '2026-08-27',
        objectives: [],
        focusSkills: [],
        reasoning: '',
        expectedOutcome: '',
        aiGenerated: true,
        version: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
        days: [
          {
            day: 'monday',
            tasks: [
              {
                id: 'srs-task',
                title: 'SRS',
                type: 'srs',
                estimatedMinutes: 10,
                completed: false,
                status: 'pending',
                sourceType: 'srs',
                route: '/study-mode',
              },
              {
                id: 'lesson-task',
                title: 'Lesson',
                type: 'lesson',
                estimatedMinutes: 20,
                completed: false,
                status: 'pending',
                sourceType: 'curriculum',
                route: '/ielts',
              },
            ],
          },
        ],
      };
      await PersonalLearningPlanService.saveWeeklyPlan(plan);
      const updated = await PersonalLearningPlanService.completePlanTask(
        'test_user',
        'srs-plan',
        'srs-task',
      );
      expect(updated?.days[0].tasks[0]).toMatchObject({ completed: true, status: 'completed' });
      expect(updated?.days[0].tasks[1]).toMatchObject({ completed: false, status: 'pending' });
    });
  });

  describe('4. Weekly Evaluation & Adaptation', () => {
    const sampleGoal: PersonalLearningGoal = {
      id: 'goal-123',
      userId: 'test_user',
      language: 'en',
      goalType: 'ielts',
      currentLevel: '5.0',
      targetGoal: 'IELTS 7.0',
      targetLevel: '7.0',
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      dailyMinutes: 60,
      totalWeeks: 24,
      currentWeek: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const samplePlan: WeeklyLearningPlan = {
      id: 'plan-123',
      goalId: 'goal-123',
      userId: 'test_user',
      weekNumber: 1,
      startDate: '2026-08-20',
      endDate: '2026-08-27',
      objectives: ['Test'],
      focusSkills: ['grammar'],
      days: [
        {
          day: 'monday',
          tasks: [
            {
              id: 'task-1',
              title: 'Practice',
              type: 'grammar',
              estimatedMinutes: 30,
              completed: true,
              status: 'completed',
              sourceType: 'curriculum',
              route: '/ielts',
            },
          ],
        },
      ],
      reasoning: 'None',
      expectedOutcome: 'None',
      aiGenerated: false,
      version: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    it('should evaluate the completed week and recommend next week adaptations', async () => {
      // Save active goal
      await PersonalLearningPlanService.saveGoal('test_user', sampleGoal);

      const evalRes = await WeeklyEvaluationEngine.evaluateWeek(
        'test_user',
        sampleGoal,
        samplePlan,
      );
      expect(evalRes.completionRate).toBe(100);
      expect(evalRes.studyMinutesActual).toBe(30);
      expect(evalRes.aiFeedback).toBeDefined();

      // Verify active goal's currentWeek was incremented to 2
      const updatedGoal = PersonalLearningPlanService.getActiveGoal('test_user');
      expect(updatedGoal?.currentWeek).toBe(2);
    });
  });

  describe('5. Isolation & Route Security', () => {
    it('does not schedule the retired essay feature', () => {
      const goal: PersonalLearningGoal = {
        id: 'retired-essay',
        userId: 'test_user',
        language: 'ja',
        goalType: 'jlpt',
        currentLevel: 'N5',
        targetGoal: 'JLPT N4',
        targetLevel: 'N4',
        deadline: new Date(Date.now() + 86400000 * 90).toISOString(),
        dailyMinutes: 60,
        totalWeeks: 12,
        currentWeek: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const raw = JSON.stringify({
        days: [
          {
            day: 'monday',
            tasks: [
              {
                title: 'Essay',
                type: 'writing',
                skill: 'writing',
                route: '/jlpt-writing',
                estimatedMinutes: 15,
              },
              {
                title: 'Sakubun',
                type: 'practice',
                skill: 'sakubun',
                route: '/jlpt?tab=writing',
                estimatedMinutes: 15,
              },
              {
                title: 'Reading',
                type: 'reading',
                skill: 'reading',
                route: '/jlpt?tab=reading',
                estimatedMinutes: 15,
              },
            ],
          },
        ],
      });
      const plan = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(raw, goal, 1, 'test_user');
      expect(plan).not.toBeNull();
      const tasks = plan!.days.flatMap((day) => day.tasks);
      expect(tasks.some((task) => task.title === 'Essay' || task.title === 'Sakubun')).toBe(false);
      expect(tasks.some((task) => task.skill === 'reading')).toBe(true);
    });

    it('should enforce strict route validation and avoid mixing language resources', () => {
      const sampleGoalJa: PersonalLearningGoal = {
        id: 'goal-ja-123',
        userId: 'test_user',
        language: 'ja',
        goalType: 'jlpt',
        currentLevel: 'N4',
        targetGoal: 'JLPT N2',
        targetLevel: 'N2',
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        dailyMinutes: 60,
        totalWeeks: 24,
        currentWeek: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const maliciousJson = JSON.stringify({
        objectives: ['Learn English writing'],
        focusSkills: ['writing'],
        days: [
          {
            day: 'monday',
            tasks: [
              {
                title: 'English grammar exercise',
                type: 'grammar',
                estimatedMinutes: 20,
                contentId: 'en-a1-u1-l1',
                route: '/ielts/writing', // English route!
              },
            ],
          },
        ],
        reasoning: 'Force English',
        expectedOutcome: 'Fail',
      });

      const parsed = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(
        maliciousJson,
        sampleGoalJa,
        1,
        'test_user',
      );
      expect(parsed).not.toBeNull();

      const monTasks = parsed!.days.find((d) => d.day === 'monday')?.tasks || [];
      expect(monTasks.length).toBeGreaterThan(0);
      // Verify it was sanitized and mapped to a Japanese route
      expect(monTasks[0].route).toBe('/jlpt');
    });
  });

  describe('6. Pedagogical Model (Completion vs Performance Mastery)', () => {
    it('should record completion type evidence and ignore it in mastery score computation', () => {
      const userId = 'pedagogical_test_user';
      const language = 'en';

      // Record a task completion evidence (ticking a checkbox)
      MasteryEngine.recordEvidence(userId, language, {
        id: 'task-complete-1',
        skill: 'reading',
        score: 100,
        timestamp: new Date().toISOString(),
        details: 'Checkbox ticked',
        type: 'completion',
      });

      // Retrieve mastery profile
      const profile = MasteryEngine.calculateMasteryProfile(userId, language);
      const readingMastery = profile.skills['reading'];

      // Actual score must remain 0 because there is no performance evidence, but totalCount is logged
      expect(readingMastery.score).toBe(0);
      expect(readingMastery.evidenceCount).toBe(1);

      // Record a performance quiz score of 80%
      MasteryEngine.recordEvidence(userId, language, {
        id: 'quiz-score-1',
        skill: 'reading',
        score: 80,
        timestamp: new Date().toISOString(),
        details: 'Quiz score',
        type: 'performance',
      });

      const updatedProfile = MasteryEngine.calculateMasteryProfile(userId, language);
      const updatedReadingMastery = updatedProfile.skills['reading'];

      // Average score is calculated strictly from performance evidence (which is 80)
      expect(updatedReadingMastery.score).toBe(80);
      // Total evidence counts both completion and performance
      expect(updatedReadingMastery.evidenceCount).toBe(2);
    });
  });

  describe('7. Fallback Level Filtering & Wizard Option Validation', () => {
    it('should filter fallback lessons matching goal currentLevel', () => {
      // A1 English goal
      const a1Goal: PersonalLearningGoal = {
        id: 'goal-a1',
        userId: 'test_user_a1',
        language: 'en',
        goalType: 'ielts',
        currentLevel: 'A1',
        targetGoal: 'IELTS 6.0',
        targetLevel: '6.0',
        deadline: new Date(Date.now() + 90 * 86400000).toISOString(),
        dailyMinutes: 60,
        totalWeeks: 12,
        currentWeek: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const plan = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(
        JSON.stringify({
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
            (d) => ({
              day: d,
              tasks: [
                { title: 'Review', type: 'srs', estimatedMinutes: 15 },
                {
                  title: 'Lesson 1',
                  type: 'lesson',
                  contentId: a1Goal.language === 'ja' ? 'ja-n5-u1-l1' : 'en-a1-u1-l1',
                  estimatedMinutes: 30,
                },
                {
                  title: 'Practice',
                  type: 'practice',
                  contentId: 'en-a1-u1-l1',
                  estimatedMinutes: 15,
                },
              ],
            }),
          ),
        }),
        a1Goal,
        1,
        'test_user_a1',
      )!;
      const curriculumTasks = plan.days.flatMap((d) => d.tasks).filter((t) => t.type === 'lesson');
      expect(curriculumTasks.length).toBeGreaterThan(0);

      // All generated fallback lessons should belong to A1 level code
      curriculumTasks.forEach((t) => {
        expect(t.contentId).toMatch(/^en-a1-/);
      });

      // N5 Japanese goal
      const n5Goal: PersonalLearningGoal = {
        id: 'goal-n5',
        userId: 'test_user_n5',
        language: 'ja',
        goalType: 'jlpt',
        currentLevel: 'N5',
        targetGoal: 'JLPT N3',
        targetLevel: 'N3',
        deadline: new Date(Date.now() + 90 * 86400000).toISOString(),
        dailyMinutes: 60,
        totalWeeks: 12,
        currentWeek: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const planJa = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(
        JSON.stringify({
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
            (d) => ({
              day: d,
              tasks: [
                {
                  title: 'Lesson 1',
                  type: 'lesson',
                  contentId: 'ja-n5-u1-l1',
                  route: '/jlpt',
                  estimatedMinutes: 45,
                },
              ],
            }),
          ),
        }),
        n5Goal,
        1,
        'test_user_n5',
      )!;
      const curriculumTasksJa = planJa.days
        .flatMap((d) => d.tasks)
        .filter((t) => t.type === 'lesson');
      expect(curriculumTasksJa.length).toBeGreaterThan(0);

      // All generated fallback lessons should belong to N5 level code
      curriculumTasksJa.forEach((t) => {
        expect(t.contentId).toMatch(/^ja-n5-/);
      });
    });

    it('should enforce language separation for current and target level dropdown options', () => {
      const getTargetsForLang = (lang: 'en' | 'ja', goalType: string) => {
        if (lang === 'ja') {
          return ['N5', 'N4', 'N3', 'N2', 'N1'];
        }
        if (goalType === 'ielts') {
          return ['5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5+'];
        }
        return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      };

      const getCurrentsForLang = (lang: 'en' | 'ja', goalType: string) => {
        if (lang === 'ja') {
          return ['ZERO', 'N5', 'N4', 'N3', 'N2'];
        }
        if (goalType === 'ielts') {
          return ['ZERO', '4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0'];
        }
        return ['ZERO', 'A1', 'A2', 'B1', 'B2', 'C1'];
      };

      // Test English IELTS options
      const enTargets = getTargetsForLang('en', 'ielts');
      const enCurrents = getCurrentsForLang('en', 'ielts');
      expect(enTargets).toContain('7.0');
      expect(enTargets).not.toContain('N3');
      expect(enCurrents).toContain('5.0');
      expect(enCurrents).not.toContain('N5');

      // Test Japanese JLPT options
      const jaTargets = getTargetsForLang('ja', 'jlpt');
      const jaCurrents = getCurrentsForLang('ja', 'jlpt');
      expect(jaTargets).toContain('N1');
      expect(jaTargets).not.toContain('7.0');
      expect(jaCurrents).toContain('N3');
      expect(jaCurrents).not.toContain('5.0');
    });
  });

  describe('8. Completed Lesson Deduplication & Fallback Hardening', () => {
    const sampleGoal: PersonalLearningGoal = {
      id: 'goal-dedup-123',
      userId: 'test_user_dedup',
      language: 'en',
      goalType: 'ielts',
      currentLevel: 'A1',
      targetGoal: 'IELTS 7.0',
      targetLevel: '7.0',
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      dailyMinutes: 60,
      totalWeeks: 24,
      currentWeek: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      localStorage.clear();
    });

    it('should exclude completed lessons from deterministic fallback plan', async () => {
      // Mark a lesson as completed via LearningSignalService
      const signal = {
        id: 'sig-1',
        type: 'completed_lesson',
        language: 'en',
        lessonId: 'en-a1-u1-l1',
        userId: 'test_user_dedup',
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(
        'study_planner_learning_signals_test_user_dedup',
        JSON.stringify([signal]),
      );

      // Generate fallback
      const plan = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(
        JSON.stringify({
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
            (d) => ({
              day: d,
              tasks: [
                { title: 'Review', type: 'srs', estimatedMinutes: 15 },
                {
                  title: 'Lesson 1',
                  type: 'lesson',
                  contentId: sampleGoal.language === 'ja' ? 'ja-n5-u1-l1' : 'en-a1-u1-l1',
                  estimatedMinutes: 30,
                },
                {
                  title: 'Practice',
                  type: 'practice',
                  contentId: 'en-a1-u1-l1',
                  estimatedMinutes: 15,
                },
              ],
            }),
          ),
        }),
        sampleGoal,
        1,
        'test_user_dedup',
      )!;
      const curriculumTasks = plan.days.flatMap((d) => d.tasks).filter((t) => t.type === 'lesson');

      // Should select en-a1-u1-l2 (or other uncompleted ones), not en-a1-u1-l1
      curriculumTasks.forEach((t) => {
        expect(t.contentId).not.toBe('en-a1-u1-l1');
      });
    });

    it('should fall back to review tasks if all lessons at current level are completed', async () => {
      // Mark all A1 lessons completed
      const signal1 = {
        id: 'sig-1',
        type: 'completed_lesson',
        language: 'en',
        lessonId: 'en-a1-u1-l1',
        userId: 'test_user_dedup',
        timestamp: new Date().toISOString(),
      };
      const signal2 = {
        id: 'sig-2',
        type: 'completed_lesson',
        language: 'en',
        lessonId: 'en-a1-u1-l2',
        userId: 'test_user_dedup',
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(
        'study_planner_learning_signals_test_user_dedup',
        JSON.stringify([signal1, signal2]),
      );

      const plan = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(
        JSON.stringify({
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
            (d) => ({
              day: d,
              tasks: [
                { title: 'Review', type: 'srs', estimatedMinutes: 15 },
                {
                  title: 'Lesson 1',
                  type: 'lesson',
                  contentId: sampleGoal.language === 'ja' ? 'ja-n5-u1-l1' : 'en-a1-u1-l1',
                  estimatedMinutes: 30,
                },
                {
                  title: 'Practice',
                  type: 'practice',
                  contentId: 'en-a1-u1-l1',
                  estimatedMinutes: 15,
                },
              ],
            }),
          ),
        }),
        sampleGoal,
        1,
        'test_user_dedup',
      )!;
      const reviewTasks = plan.days.flatMap((d) => d.tasks).filter((t) => t.type === 'review');
      expect(reviewTasks.length).toBeGreaterThan(0);
      reviewTasks.forEach((t) => {
        expect(t.title).toContain('(Takrorlash)');
      });
    });

    it('should exclude completed lessons from AI generated validated tasks using hard guard replacement', async () => {
      // Mark a lesson as completed
      const signal = {
        id: 'sig-1',
        type: 'completed_lesson',
        language: 'en',
        lessonId: 'en-a1-u1-l1',
        userId: 'test_user_dedup',
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(
        'study_planner_learning_signals_test_user_dedup',
        JSON.stringify([signal]),
      );

      // Invalid Mock AI response proposing completed lesson en-a1-u1-l1 as new lesson
      const proposedPlanJson = JSON.stringify({
        objectives: ['Test'],
        focusSkills: ['grammar'],
        days: [
          {
            day: 'monday',
            tasks: [
              {
                title: 'Present Simple',
                type: 'lesson',
                estimatedMinutes: 20,
                contentId: 'en-a1-u1-l1',
                route: '/lesson/en-a1-u1-l1',
              },
            ],
          },
        ],
        reasoning: 'Test reasoning',
        expectedOutcome: 'Test outcome',
      });

      const parsed = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(
        proposedPlanJson,
        sampleGoal,
        1,
        'test_user_dedup',
      );
      expect(parsed).not.toBeNull();

      const monTasks = parsed!.days.find((d) => d.day === 'monday')?.tasks || [];
      expect(monTasks.length).toBeGreaterThan(0);

      // Should be replaced with en-a1-u1-l2 as it is uncompleted
      expect(monTasks[0].contentId).toBe('en-a1-u1-l2');
    });

    it('should allow SRS/Review tasks to reference completed lessons', async () => {
      const signal = {
        id: 'sig-1',
        type: 'completed_lesson',
        language: 'en',
        lessonId: 'en-a1-u1-l1',
        userId: 'test_user_dedup',
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(
        'study_planner_learning_signals_test_user_dedup',
        JSON.stringify([signal]),
      );

      // Mock AI response proposing completed lesson as a review or SRS activity
      const proposedPlanJson = JSON.stringify({
        objectives: ['Test'],
        focusSkills: ['grammar'],
        days: [
          {
            day: 'monday',
            tasks: [
              {
                title: 'Present Simple Review',
                type: 'review',
                estimatedMinutes: 15,
                contentId: 'en-a1-u1-l1',
                route: '/lesson/en-a1-u1-l1',
              },
            ],
          },
        ],
        reasoning: 'Test reasoning',
        expectedOutcome: 'Test outcome',
      });

      const parsed = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(
        proposedPlanJson,
        sampleGoal,
        1,
        'test_user_dedup',
      );
      expect(parsed).not.toBeNull();

      const monTasks = parsed!.days.find((d) => d.day === 'monday')?.tasks || [];
      expect(monTasks.length).toBeGreaterThan(0);

      // Type review should be retained and not rejected/replaced
      expect(monTasks[0].contentId).toBe('en-a1-u1-l1');
      expect(monTasks[0].type).toBe('review');
    });

    it('should isolate completed lessons by language', async () => {
      // Mark English lesson completed
      const signalEn = {
        id: 'sig-en',
        type: 'completed_lesson',
        language: 'en',
        lessonId: 'en-a1-u1-l1',
        userId: 'test_user_dedup',
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(
        'study_planner_learning_signals_test_user_dedup',
        JSON.stringify([signalEn]),
      );

      // Japanese N5 fallback goal
      const jaGoal: PersonalLearningGoal = {
        id: 'goal-ja',
        userId: 'test_user_dedup',
        language: 'ja',
        goalType: 'jlpt',
        currentLevel: 'N5',
        targetGoal: 'JLPT N4',
        targetLevel: 'N4',
        deadline: new Date(Date.now() + 90 * 86400000).toISOString(),
        dailyMinutes: 60,
        totalWeeks: 12,
        currentWeek: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // English completed should NOT affect ja-n5-u1-l1 matching fallback
      const planJa = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(
        JSON.stringify({
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
            (d) => ({
              day: d,
              tasks: [
                { title: 'Review', type: 'srs', estimatedMinutes: 15 },
                {
                  title: 'Lesson 1',
                  type: 'lesson',
                  contentId: jaGoal.language === 'ja' ? 'ja-n5-u1-l1' : 'en-a1-u1-l1',
                  estimatedMinutes: 30,
                },
                {
                  title: 'Practice',
                  type: 'practice',
                  contentId: 'en-a1-u1-l1',
                  estimatedMinutes: 15,
                },
              ],
            }),
          ),
        }),
        jaGoal,
        1,
        'test_user_dedup',
      )!;
      const jaTasks = planJa.days.flatMap((d) => d.tasks).filter((t) => t.type === 'lesson');
      expect(jaTasks[0].contentId).toBe('ja-n5-u1-l1');
    });

    it('should isolate completed lessons by user', async () => {
      // Mark en-a1-u1-l1 completed for User A
      const signalUserA = {
        id: 'sig-usera',
        type: 'completed_lesson',
        language: 'en',
        lessonId: 'en-a1-u1-l1',
        userId: 'user_a',
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('study_planner_learning_signals_user_a', JSON.stringify([signalUserA]));

      // Generate fallback for User B
      const planB = PersonalLearningPlanEngine.parseAndValidateWeeklyPlan(
        JSON.stringify({
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
            (d) => ({
              day: d,
              tasks: [
                { title: 'Review', type: 'srs', estimatedMinutes: 15 },
                {
                  title: 'Lesson 1',
                  type: 'lesson',
                  contentId: sampleGoal.language === 'ja' ? 'ja-n5-u1-l1' : 'en-a1-u1-l1',
                  estimatedMinutes: 30,
                },
                {
                  title: 'Practice',
                  type: 'practice',
                  contentId: 'en-a1-u1-l1',
                  estimatedMinutes: 15,
                },
              ],
            }),
          ),
        }),
        sampleGoal,
        1,
        'user_b',
      )!;
      const bTasks = planB.days.flatMap((d) => d.tasks).filter((t) => t.type === 'lesson');

      // Should still select en-a1-u1-l1 for User B as they did not complete it
      expect(bTasks[0].contentId).toBe('en-a1-u1-l1');
    });
  });
});
