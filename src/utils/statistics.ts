import { Goal, Task } from '../types';

export interface StudyActivityItem {
  type: 'task' | 'session' | 'flashcard' | 'quiz' | 'exam' | 'speaking';
  timestamp: string | number | Date;
}

/**
 * Extracts normalized local calendar date timestamp (midnight 00:00:00) from various input formats.
 */
function extractMidnightTimestamp(dateInput?: string | number | Date | null): number | null {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Calculates current streak across all learning activities (Tasks, Pomodoro sessions, Flashcards, Quizzes).
 */
export const calculateUnifiedStreak = (
  tasks: Task[] = [],
  sessions: { createdAt?: string; startTime?: string; completed?: boolean }[] = [],
  additionalActivities: StudyActivityItem[] = [],
): number => {
  const activityDates = new Set<number>();

  // 1. Completed Tasks (using deadline, dueDate, or createdAt)
  tasks.forEach((t) => {
    if (t.completed || t.status === 'done') {
      const time = extractMidnightTimestamp(t.deadline || t.dueDate || t.createdAt);
      if (time) activityDates.add(time);
    }
  });

  // 2. Completed Study Sessions (Pomodoro)
  sessions.forEach((s) => {
    if (s.completed !== false) {
      const time = extractMidnightTimestamp(s.createdAt || s.startTime);
      if (time) activityDates.add(time);
    }
  });

  // 3. Additional Activities (Flashcard reviews, quizzes, exams, speaking)
  additionalActivities.forEach((a) => {
    const time = extractMidnightTimestamp(a.timestamp);
    if (time) activityDates.add(time);
  });

  if (activityDates.size === 0) return 0;

  const sortedDates = Array.from(activityDates).sort((a, b) => b - a);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayTime = now.getTime();
  const yesterdayTime = todayTime - 86400000;

  const lastActiveDate = sortedDates[0];

  // If no activity today OR yesterday, streak is broken
  if (lastActiveDate !== todayTime && lastActiveDate !== yesterdayTime) {
    return 0;
  }

  let streak = 1;
  let expectedDate = lastActiveDate;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = expectedDate - 86400000;
    if (sortedDates[i] === prevDate) {
      streak++;
      expectedDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Backward compatible task-based streak calculation.
 */
export const calculateStreak = (tasks: Task[]): number => {
  return calculateUnifiedStreak(tasks);
};

export const calculateCompletionRates = (goals: Goal[], tasks: Task[]) => {
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.completed).length; // Wait, Goal doesn't have 'completed' auto-calculation in Context yet. Defaulted false.

  // Let's infer goal completion? Or use the field?
  // Let's use the field we defined in types, assuming manual toggle or we need to auto-update it.
  // Currently no auto-update. Let's rely on tasks count for "Overall Progress".

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  return {
    totalGoals,
    completedGoals, // This might be 0 if we never toggle it.
    totalTasks,
    completedTasks,
    overallPercentage: totalTasks > 0 ? completedTasks / totalTasks : 0,
  };
};

export const getWeeklyProgress = (tasks: Task[]) => {
  // Return array of 7 days with counts of completed tasks
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i); // Go back i days
    const dayTime = d.getTime();

    const count = tasks.filter((t) => {
      if (!t.completed || !t.deadline) return false;
      const taskDate = new Date(t.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === dayTime;
    }).length;

    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
      date: d,
    });
  }
  return days;
};
