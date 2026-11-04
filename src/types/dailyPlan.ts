import { SupportedLanguage } from './lesson';
import { MasterySkill } from './mastery';

export type DailyPlanItemType =
  | 'srs_review'
  | 'lesson'
  | 'weakness_practice'
  | 'reading'
  | 'listening'
  | 'speaking'
  | 'writing'
  | 'test'
  | 'review';

export interface DailyPlanItem {
  id: string;
  type: DailyPlanItemType;
  title: string;
  reason: string;
  estimatedMinutes: number;
  priority: number;
  route: string;
  lessonId?: string;
  skill?: MasterySkill;
  isCompleted: boolean;
  metadata?: Record<string, unknown>;
}

export interface DailyStudyPlan {
  userId: string;
  language: SupportedLanguage;
  totalMinutes: number;
  allocatedMinutes: number;
  generatedAt: string;
  items: DailyPlanItem[];
  summary: {
    primaryFocus: string;
    reason: string;
  };
}
