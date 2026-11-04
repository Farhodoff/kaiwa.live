import { SupportedLanguage } from './lesson';

export type MasterySkill =
  'vocabulary' | 'grammar' | 'reading' | 'listening' | 'writing' | 'speaking' | 'kanji';

export type MasteryTrend = 'improving' | 'stable' | 'declining';

/**
 * Phase 19 canonical status ladder:
 *   not_started → weak (<50) → developing (50–69) → proficient (70–84) → mastered (85+)
 *
 * Legacy aliases kept for backward-compatibility with DiagnosticService / DiagnosticPage:
 *   'learning' ≈ 'developing'
 *   'strong'   ≈ 'proficient'
 */
export type MasteryStatus =
  | 'not_started'
  | 'weak'
  | 'developing' // Phase 19: 50–69 (canonical)
  | 'proficient' // Phase 19: 70–84 (canonical)
  | 'mastered' // Phase 19: 85+
  | 'learning' // legacy alias ≈ developing
  | 'strong'; // legacy alias ≈ proficient

export type WeaknessSeverity = 'high' | 'medium' | 'low';

export interface SkillMastery {
  skill: MasterySkill;
  score: number; // 0-100
  confidence: number; // 0-100 (based on evidence volume & variety)
  evidenceCount: number;
  lastUpdatedAt?: string;
  trend: MasteryTrend;
  status: MasteryStatus;
  explanation: string;
}

export interface SkillWeakness {
  skill: MasterySkill;
  score: number;
  confidence: number;
  severity: WeaknessSeverity;
  reason: string;
  recommendedRoute: string;
  language: SupportedLanguage;
  evidenceDetails?: string[];
}

export interface UserMasteryProfile {
  userId: string;
  language: SupportedLanguage;
  skills: Record<string, SkillMastery>;
  topWeaknesses: SkillWeakness[];
  topStrengths: SkillMastery[];
  overallMasteryScore: number;
  overallConfidence: number;
  lastCalculatedAt: string;
}
