import { SupportedLanguage } from './lesson';

export type NextActionType =
  | 'resume_lesson'
  | 'review_srs'
  | 'weakness_practice'
  | 'start_next_lesson'
  | 'take_test'
  | 'speaking_practice'
  | 'writing_practice';

export interface NextLearningAction {
  type: NextActionType;
  title: string;
  description: string;
  reason: string;
  ctaLabel: string;
  estimatedMinutes: number;
  priority: number;
  language: SupportedLanguage;
  route: string;
  lessonId?: string;
  badgeIcon?: string;
  metadata?: Record<string, unknown>;
}
