import { SupportedLanguage } from './lesson';
import { MasterySkill, MasteryStatus } from './mastery';
import { JlptLevel } from '../services/JlptReadinessService';

export type ActivityFormat =
  | 'quiz'
  | 'srs'
  | 'audio'
  | 'canvas'
  | 'speech'
  | 'essay'
  | 'fill_in_the_blank'
  | 'sentence_ordering'
  | 'reading_passage';

export interface CompetencyProgress {
  competencyId: string;
  name: { uz: string; ja: string; en: string };
  category: string;
  description: { uz: string; ja: string; en: string };
  targetCount: number;
  currentCount: number;
  accuracy: number; // 0-100
  formatsTested: ActivityFormat[];
  status: MasteryStatus;
  benchmarkRule: string;
}

export interface SkillMatrixDefinition {
  skill: MasterySkill;
  level: JlptLevel;
  title: { uz: string; ja: string; en: string };
  description: { uz: string; ja: string; en: string };
  overallTargetCount: number;
  currentCount: number;
  score: number; // 0-100
  accuracy: number; // 0-100
  multiFormatPassed: boolean; // >= 2 distinct formats tested with >= 80% accuracy
  retentionPassed: boolean; // retention rate >= 80%
  status: MasteryStatus;
  competencies: CompetencyProgress[];
  practiceRoute: string;
  iconName: string;
}

export interface LevelSkillMatrixReport {
  level: JlptLevel;
  language: SupportedLanguage;
  overallCompletionRate: number; // 0-100
  masteredSkillsCount: number; // out of 7
  totalCompetenciesCount: number;
  masteredCompetenciesCount: number;
  skills: Record<MasterySkill, SkillMatrixDefinition>;
  topWeaknesses: {
    skill: MasterySkill;
    competencyName: string;
    reason: string;
    recommendedRoute: string;
  }[];
  generatedAt: string;
}
