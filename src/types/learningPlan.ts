import { SupportedLanguage } from './lesson';
import { MasterySkill } from './mastery';

export type PlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
export type PlanGoalType = 'ielts' | 'jlpt' | 'general_en' | 'general_ja';

export interface PersonalLearningGoal {
  id: string;
  userId: string;
  language: SupportedLanguage;
  goalType: PlanGoalType;
  currentLevel: string; // e.g. 'A2' or 'N3' or 'IELTS 5.0'
  currentEstimatedScore?: number; // e.g. 5.0
  currentDiagnosticConfidence?: number; // e.g. 78
  targetGoal: string; // e.g. 'IELTS 7.0+' or 'JLPT N1'
  targetLevel: string; // e.g. 'B2', 'N1'
  targetScore?: number; // e.g. 7.0
  deadline: string; // ISO date string
  dailyMinutes: number; // e.g. 60
  totalWeeks: number;
  currentWeek: number;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export type TaskSourceType = 'curriculum' | 'exam_bank' | 'srs' | 'lesson' | 'ai_generated';
export type WeeklyPlanTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface WeeklyPlanTask {
  id: string;
  title: string;
  type: string; // e.g., 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing' | 'srs' | 'mock_test'
  estimatedMinutes: number;
  completed: boolean;
  status: WeeklyPlanTaskStatus;
  sourceType: TaskSourceType;
  contentId?: string; // lessonId, grammar topic ID, etc.
  route: string;
  skill?: MasterySkill;
  metadata?: Record<string, any>;
}

export interface WeeklyPlanDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  tasks: WeeklyPlanTask[];
}

export interface WeeklyLearningPlan {
  id: string;
  goalId: string;
  userId: string;
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  objectives: string[];
  focusSkills: string[];
  days: WeeklyPlanDay[];
  reasoning: string;
  expectedOutcome: string;
  aiGenerated: boolean;
  version: number;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
}

export interface WeeklyEvaluation {
  id: string;
  weeklyPlanId: string;
  userId: string;
  weekNumber: number;
  completionRate: number; // percentage, e.g., 87
  studyMinutesPlanned: number;
  studyMinutesActual: number;
  skillScores: Record<string, number>; // e.g., { vocabulary: 80, grammar: 75 }
  masteryDelta: Record<string, number>; // e.g., { vocabulary: 5, grammar: -2 }
  srsRetention?: number;
  weakSkills: string[];
  strongSkills: string[];
  aiFeedback: string;
  createdAt: string;
}
