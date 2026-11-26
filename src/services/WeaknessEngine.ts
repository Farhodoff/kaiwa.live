import { SupportedLanguage } from '../types/lesson';
import {
  MasterySkill,
  SkillMastery,
  SkillWeakness,
  UserMasteryProfile,
  WeaknessSeverity,
} from '../types/mastery';
import { MasteryEngine } from './MasteryEngine';

export const WeaknessEngine = {
  /**
   * Resolve targeted, language-specific practicing route for a given skill.
   */
  resolveRouteForSkill(skill: MasterySkill, language: SupportedLanguage): string {
    if (language === 'ja') {
      switch (skill) {
        case 'kanji':
          return '/jlpt';
        case 'grammar':
          return '/jlpt/grammar-quiz';
        case 'reading':
          return '/jlpt/reading';
        case 'listening':
          return '/jlpt/listening';
        case 'speaking':
          return '/speaking-coach?lang=ja';
        case 'writing':
          return '/jlpt/grammar';
        case 'vocabulary':
        default:
          return '/study-mode';
      }
    } else {
      switch (skill) {
        case 'speaking':
          return '/speaking-coach?lang=en';
        case 'writing':
          return '/ielts/writing';
        case 'reading':
          return '/ielts/reading-listening';
        case 'listening':
          return '/ielts/reading-listening';
        case 'grammar':
          return '/ielts/reading-listening';
        case 'vocabulary':
        default:
          return '/vocabulary';
      }
    }
  },

  /**
   * Evaluate weakness severity based on score, confidence, and trend.
   */
  evaluateSeverity(mastery: SkillMastery): WeaknessSeverity {
    if (mastery.score < 50 || (mastery.score < 75 && mastery.trend === 'declining')) {
      return 'high';
    }
    if (mastery.score < 70) {
      return 'medium';
    }
    return 'low';
  },

  /**
   * Format a descriptive diagnostic reason for the weakness.
   */
  formatReason(mastery: SkillMastery, language: SupportedLanguage): string {
    const isJa = language === 'ja';
    const skillName = mastery.skill.toUpperCase();

    if (mastery.trend === 'declining') {
      return isJa
        ? `${skillName} bo'yicha so'nggi mashg'ulotlarda ko'rsatkich pasayish tendentsiyasida (${mastery.score}%).`
        : `Recent ${skillName} scores show a declining trend (${mastery.score}%).`;
    }

    if (mastery.score < 50) {
      return isJa
        ? `${skillName} bo'yicha o'zlashtirish darajasi past (${mastery.score}%). Qo'shimcha mashq tavsiya etiladi.`
        : `${skillName} mastery is critically low (${mastery.score}%). Immediate practice recommended.`;
    }

    return isJa
      ? `${skillName} ko'nikmasida xatoliklar soni ko'paygan (${mastery.score}%).`
      : `Detected recurring inaccuracies in ${skillName} (${mastery.score}%).`;
  },

  /**
   * Identify Top Weaknesses from skill masteries.
   */
  getTopWeaknesses(profile: UserMasteryProfile, limit: number = 3): SkillWeakness[] {
    const weaknesses: SkillWeakness[] = [];
    const skills = Object.values(profile.skills);

    for (const mastery of skills) {
      // Completion-only evidence intentionally keeps status as not_started; it should not create a weakness.
      if (
        mastery.status !== 'not_started' &&
        mastery.evidenceCount > 0 &&
        (mastery.score < 75 || mastery.trend === 'declining')
      ) {
        const severity = this.evaluateSeverity(mastery);
        const reason = this.formatReason(mastery, profile.language);
        const recommendedRoute = this.resolveRouteForSkill(mastery.skill, profile.language);

        weaknesses.push({
          skill: mastery.skill,
          score: mastery.score,
          confidence: mastery.confidence,
          severity,
          reason,
          recommendedRoute,
          language: profile.language,
        });
      }
    }

    // Sort by severity (high > medium > low), then lowest score
    const severityOrder: Record<WeaknessSeverity, number> = { high: 3, medium: 2, low: 1 };
    weaknesses.sort((a, b) => {
      const sevDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (sevDiff !== 0) return sevDiff;
      return a.score - b.score;
    });

    return weaknesses.slice(0, limit);
  },

  /**
   * Identify Top Strengths from skill masteries.
   */
  getTopStrengths(profile: UserMasteryProfile, limit: number = 3): SkillMastery[] {
    const skills = Object.values(profile.skills).filter(
      (m) => m.evidenceCount > 0 && m.score >= 70,
    );
    skills.sort((a, b) => b.score - a.score);
    return skills.slice(0, limit);
  },

  /**
   * Complete and enrich a UserMasteryProfile with weaknesses and strengths.
   */
  enrichProfile(profile: UserMasteryProfile): UserMasteryProfile {
    profile.topWeaknesses = this.getTopWeaknesses(profile);
    profile.topStrengths = this.getTopStrengths(profile);
    return profile;
  },

  /**
   * Convenience method to calculate and enrich mastery profile in one step.
   */
  getUserMasteryProfile(
    userId: string = 'guest',
    language: SupportedLanguage = 'en',
    supplementary?: { srsRetention?: number },
  ): UserMasteryProfile {
    const profile = MasteryEngine.calculateMasteryProfile(userId, language, supplementary);
    return this.enrichProfile(profile);
  },
};
