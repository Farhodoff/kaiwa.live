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

export interface EvidenceSourceSummary {
  source: string;
  format: ActivityFormat;
  count: number;
  accuracy: number | null; // 0-100, null when the source has no scored attempts
  lastUsedAt?: string;
}

export interface CompetencyProgress {
  competencyId: string;
  name: { uz: string; ja: string; en: string };
  category: string;
  description: { uz: string; ja: string; en: string };
  targetCount: number;
  currentCount: number;
  accuracy: number; // 0-100, computed from the latest competency evidence
  evidenceCount: number;
  evidenceSources: string[];
  formatsTested: ActivityFormat[];
  status: MasteryStatus;
  benchmarkRule: string;
}

export interface CompetencyResultRecord {
  competencyId: string;
  skill: MasterySkill;
  level: JlptLevel;
  accuracy: number;
  status: MasteryStatus;
  evidenceCount: number;
  evidenceSources: string[];
  updatedAt: string;
}

export interface SkillMatrixDefinition {
  skill: MasterySkill;
  level: JlptLevel;
  title: { uz: string; ja: string; en: string };
  description: { uz: string; ja: string; en: string };
  overallTargetCount: number;
  currentCount: number;
  score: number; // 0-100
  accuracy: number; // 0-100, latest-attempt accuracy for this skill
  evidenceCount: number;
  evidenceSources: EvidenceSourceSummary[];
  multiFormatPassed: boolean; // >= 2 distinct formats, each at >= minimum format accuracy
  retentionRate: number; // 0-100
  retentionPassed: boolean; // retention rate >= retentionThreshold (80%)
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
