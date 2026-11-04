import { safeLocalStorage } from './safeLocalStorage';
import { SupportedLanguage } from '../../types/lesson';
import { LevelPromotionCandidate } from '../../types/learningPath';
import { supabase } from '../../lib/supabase';

const CURRENT_LEVEL_KEY = 'study_planner_current_level';
const TARGET_LEVEL_KEY = 'study_planner_target_level';
const TARGET_GOAL_KEY = 'study_planner_target_goal';
const PROMOTION_CANDIDATE_KEY = 'study_planner_promotion_candidate';

export const LearningTrackStorage = {
  getCurrentLevel(language: SupportedLanguage): string {
    this.migrateSharedKeys(language);
    if (language === 'ja') {
      const val = safeLocalStorage.getItem(`${CURRENT_LEVEL_KEY}_ja`);
      if (val && ['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1'].includes(val.toUpperCase())) {
        return val.toUpperCase();
      }
      return 'N5';
    }
    const val = safeLocalStorage.getItem(`${CURRENT_LEVEL_KEY}_en`);
    if (
      val &&
      (['ZERO', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(val.toUpperCase()) ||
        val.includes('.'))
    ) {
      return val.toUpperCase();
    }
    return 'A1';
  },

  setCurrentLevel(language: SupportedLanguage, level: string): void {
    const key = `${CURRENT_LEVEL_KEY}_${language}`;

    // Validation: Do not set cross-language levels
    if (
      language === 'ja' &&
      !['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1'].includes(level.toUpperCase())
    ) {
      console.warn(`[LearningTrackStorage] Blocked invalid level "${level}" for Japanese track.`);
      return;
    }
    if (
      language === 'en' &&
      !['ZERO', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level.toUpperCase()) &&
      !level.includes('.')
    ) {
      console.warn(`[LearningTrackStorage] Blocked invalid level "${level}" for English track.`);
      return;
    }

    safeLocalStorage.setItem(key, level);
    this.triggerSupabaseSync();
  },

  getTargetLevel(language: SupportedLanguage): string {
    this.migrateSharedKeys(language);
    if (language === 'ja') {
      const val = safeLocalStorage.getItem(`${TARGET_LEVEL_KEY}_ja`);
      if (val && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(val.toUpperCase())) {
        return val.toUpperCase();
      }
      return 'N5';
    }
    const val = safeLocalStorage.getItem(`${TARGET_LEVEL_KEY}_en`);
    if (
      val &&
      (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(val.toUpperCase()) || val.includes('.'))
    ) {
      return val.toUpperCase();
    }
    return 'A1';
  },

  setTargetLevel(language: SupportedLanguage, level: string): void {
    const key = `${TARGET_LEVEL_KEY}_${language}`;

    // Validation: Do not set cross-language levels
    if (language === 'ja' && !['N5', 'N4', 'N3', 'N2', 'N1'].includes(level.toUpperCase())) {
      return;
    }
    if (
      language === 'en' &&
      !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level.toUpperCase()) &&
      !level.includes('.')
    ) {
      return;
    }

    safeLocalStorage.setItem(key, level);
    this.triggerSupabaseSync();
  },

  getTargetGoal(language: SupportedLanguage): string {
    this.migrateSharedKeys(language);
    if (language === 'ja') {
      const val = safeLocalStorage.getItem(`${TARGET_GOAL_KEY}_ja`);
      if (
        val &&
        !val.includes('IELTS') &&
        !val.includes('English') &&
        !val.includes('A1') &&
        !val.includes('B2')
      ) {
        return val;
      }
      return 'JLPT Imtihoni';
    }
    const val = safeLocalStorage.getItem(`${TARGET_GOAL_KEY}_en`);
    return val || 'IELTS 7.0+';
  },

  setTargetGoal(language: SupportedLanguage, goal: string): void {
    const key = `${TARGET_GOAL_KEY}_${language}`;
    safeLocalStorage.setItem(key, goal);
    this.triggerSupabaseSync();
  },

  getPromotionCandidate(language: SupportedLanguage): LevelPromotionCandidate | null {
    const key = `${PROMOTION_CANDIDATE_KEY}_${language}`;
    return safeLocalStorage.getJSON<LevelPromotionCandidate | null>(key, null);
  },

  setPromotionCandidate(
    language: SupportedLanguage,
    candidate: LevelPromotionCandidate | null,
  ): void {
    const key = `${PROMOTION_CANDIDATE_KEY}_${language}`;
    if (candidate === null) {
      safeLocalStorage.removeItem(key);
    } else {
      safeLocalStorage.setJSON(key, candidate);
    }
  },

  async triggerSupabaseSync(): Promise<void> {
    try {
      const cachedUser = safeLocalStorage.getJSON<any>('study_planner_user_cache', null);
      if (!cachedUser?.id || cachedUser.id === 'guest') return;

      const currentEn = safeLocalStorage.getItem(`${CURRENT_LEVEL_KEY}_en`) || 'A1';
      const currentJa = safeLocalStorage.getItem(`${CURRENT_LEVEL_KEY}_ja`) || 'N5';
      const targetEn = safeLocalStorage.getItem(`${TARGET_LEVEL_KEY}_en`) || 'A1';
      const targetJa = safeLocalStorage.getItem(`${TARGET_LEVEL_KEY}_ja`) || 'N5';
      const goalEn = safeLocalStorage.getItem(`${TARGET_GOAL_KEY}_en`) || 'IELTS 7.0+';
      const goalJa = safeLocalStorage.getItem(`${TARGET_GOAL_KEY}_ja`) || 'JLPT Imtihoni';

      await supabase.auth.updateUser({
        data: {
          current_level_en: currentEn,
          current_level_ja: currentJa,
          target_level_en: targetEn,
          target_level_ja: targetJa,
          target_goal_en: goalEn,
          target_goal_ja: goalJa,
        },
      });
    } catch (e) {
      console.warn('[LearningTrackStorage] Supabase metadata sync error:', e);
    }
  },

  migrateSharedKeys(primaryLang: SupportedLanguage): void {
    try {
      const currentShared = localStorage.getItem(CURRENT_LEVEL_KEY);
      const targetShared = localStorage.getItem(TARGET_LEVEL_KEY);
      const goalShared = localStorage.getItem(TARGET_GOAL_KEY);

      // Migrate current level
      if (currentShared) {
        const enKey = `${CURRENT_LEVEL_KEY}_en`;
        const jaKey = `${CURRENT_LEVEL_KEY}_ja`;
        const isJaValue = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(currentShared);

        if (isJaValue || (currentShared === 'ZERO' && primaryLang === 'ja')) {
          if (!localStorage.getItem(jaKey)) {
            localStorage.setItem(jaKey, currentShared);
          }
        } else {
          if (!localStorage.getItem(enKey)) {
            localStorage.setItem(enKey, currentShared);
          }
        }
        localStorage.removeItem(CURRENT_LEVEL_KEY);
      }

      // Migrate target level
      if (targetShared) {
        const enKey = `${TARGET_LEVEL_KEY}_en`;
        const jaKey = `${TARGET_LEVEL_KEY}_ja`;
        const isJaValue = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(targetShared);

        if (isJaValue || (targetShared === 'ZERO' && primaryLang === 'ja')) {
          if (!localStorage.getItem(jaKey)) {
            localStorage.setItem(jaKey, targetShared);
          }
        } else {
          if (!localStorage.getItem(enKey)) {
            localStorage.setItem(enKey, targetShared);
          }
        }
        localStorage.removeItem(TARGET_LEVEL_KEY);
      }

      // Migrate target goal
      if (goalShared) {
        const key = `${TARGET_GOAL_KEY}_${primaryLang}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, goalShared);
        }
        localStorage.removeItem(TARGET_GOAL_KEY);
      }
    } catch (e) {
      console.warn('[LearningTrackStorage] Migration error:', e);
    }
  },
};

export default LearningTrackStorage;
