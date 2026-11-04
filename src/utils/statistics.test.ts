import { describe, expect, it } from 'vitest';
import { calculateCompletionRates, calculateStreak, getWeeklyProgress } from './statistics';
import { Goal, Task } from '../types';

describe('Statistics Utils', () => {
  describe('calculateStreak', () => {
    it('should return 0 for empty task array', () => {
      const result = calculateStreak([]);
      expect(result).toBe(0);
    });

    it('should return 0 for no completed tasks', () => {
      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: false,
          status: 'todo',
          priority: 'medium',
          deadline: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      const result = calculateStreak(tasks);
      expect(result).toBe(0);
    });

    it('should return 0 if last completed task is more than 1 day old', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: threeDaysAgo.toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      const result = calculateStreak(tasks);
      expect(result).toBe(0);
    });

    it('should return 1 for task completed today', () => {
      const today = new Date();
      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: today.toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      const result = calculateStreak(tasks);
      expect(result).toBe(1);
    });

    it('should return 1 for task completed yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: yesterday.toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      const result = calculateStreak(tasks);
      expect(result).toBe(1);
    });

    it('should calculate streak for consecutive days', () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: today.toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Task 2',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: yesterday.toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Task 3',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: twoDaysAgo.toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      const result = calculateStreak(tasks);
      expect(result).toBe(3);
    });

    it('should break streak on missing day', () => {
      const today = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: today.toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Task 2',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: threeDaysAgo.toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      const result = calculateStreak(tasks);
      expect(result).toBe(1); // Only today counts
    });

    it('should handle multiple tasks on same day', () => {
      const today = new Date();
      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: today.toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Task 2',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: today.toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      const result = calculateStreak(tasks);
      expect(result).toBe(1); // Same day, streak = 1
    });
  });

  describe('calculateCompletionRates', () => {
    it('should return zeros for empty arrays', () => {
      const result = calculateCompletionRates([], []);
      expect(result).toEqual({
        totalGoals: 0,
        completedGoals: 0,
        totalTasks: 0,
        completedTasks: 0,
        overallPercentage: 0,
      });
    });

    it('should count total goals and tasks', () => {
      const goals: Goal[] = [
        {
          id: '1',
          title: 'Goal 1',
          deadline: new Date().toISOString(),
          progress: 0,
          completed: false,
        },
      ];
      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: false,
          status: 'todo',
          priority: 'medium',
          createdAt: new Date().toISOString(),
        },
      ];
      const result = calculateCompletionRates(goals, tasks);
      expect(result.totalGoals).toBe(1);
      expect(result.totalTasks).toBe(1);
    });

    it('should count completed goals', () => {
      const goals: Goal[] = [
        {
          id: '1',
          title: 'Goal 1',
          deadline: new Date().toISOString(),
          progress: 100,
          completed: true,
        },
        {
          id: '2',
          title: 'Goal 2',
          deadline: new Date().toISOString(),
          progress: 50,
          completed: false,
        },
      ];
      const result = calculateCompletionRates(goals, []);
      expect(result.completedGoals).toBe(1);
    });

    it('should count completed tasks', () => {
      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Task 2',
          completed: false,
          status: 'todo',
          priority: 'medium',
          createdAt: new Date().toISOString(),
        },
      ];
      const result = calculateCompletionRates([], tasks);
      expect(result.completedTasks).toBe(1);
    });

    it('should calculate overall percentage', () => {
      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Task 2',
          completed: false,
          status: 'todo',
          priority: 'medium',
          createdAt: new Date().toISOString(),
        },
      ];
      const result = calculateCompletionRates([], tasks);
      expect(result.overallPercentage).toBe(0.5); // 1/2 = 0.5
    });

    it('should return 0 percentage when no tasks', () => {
      const result = calculateCompletionRates([], []);
      expect(result.overallPercentage).toBe(0);
    });
  });

  describe('getWeeklyProgress', () => {
    it('should return 7 days of data', () => {
      const result = getWeeklyProgress([]);
      expect(result).toHaveLength(7);
    });

    it('should return 0 counts for no tasks', () => {
      const result = getWeeklyProgress([]);
      result.forEach((day) => {
        expect(day.count).toBe(0);
      });
    });

    it('should have labels for each day', () => {
      const result = getWeeklyProgress([]);
      result.forEach((day) => {
        expect(day.label).toBeTruthy();
        expect(typeof day.label).toBe('string');
      });
    });

    it('should have date objects for each day', () => {
      const result = getWeeklyProgress([]);
      result.forEach((day) => {
        expect(day.date).toBeInstanceOf(Date);
      });
    });

    it('should count completed tasks on specific days', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: today.toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      const result = getWeeklyProgress(tasks);
      const todayData = result[result.length - 1]; // Last day should be today
      expect(todayData.count).toBe(1);
    });

    it('should not count incomplete tasks', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: false,
          status: 'todo',
          priority: 'medium',
          deadline: today.toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      const result = getWeeklyProgress(tasks);
      const todayData = result[result.length - 1];
      expect(todayData.count).toBe(0);
    });

    it('should not count tasks without deadline', () => {
      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          createdAt: new Date().toISOString(),
        },
      ];
      const result = getWeeklyProgress(tasks);
      result.forEach((day) => {
        expect(day.count).toBe(0);
      });
    });

    it('should count multiple tasks on same day', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: today.toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Task 2',
          completed: true,
          status: 'done',
          priority: 'medium',
          deadline: today.toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      const result = getWeeklyProgress(tasks);
      const todayData = result[result.length - 1];
      expect(todayData.count).toBe(2);
    });

    it('should cover last 7 days including today', () => {
      const result = getWeeklyProgress([]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastDay = result[result.length - 1].date;
      lastDay.setHours(0, 0, 0, 0);
      expect(lastDay.getTime()).toBe(today.getTime());
    });
  });
});
