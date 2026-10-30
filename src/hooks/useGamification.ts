import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getLevelInfo, calculateStreak } from '../utils/gamification';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { DailyQuestService } from '../services/DailyQuestService';
import { toDeterministicUUID, isUuid } from '../utils/uuid';

export interface GamificationState {
  totalXp: number;
  level: number;
  currentStreak: number;
  lastActivityDate: string | null;
}

const getAuthUser = async () => {
  try {
    if (typeof supabase?.auth?.getSession === 'function') {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) return data.session.user;
      return null;
    }
    if (typeof supabase?.auth?.getUser === 'function') {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return data.user;
    }
  } catch {}
  return null;
};

export const useGamification = (initialState: GamificationState) => {
  const [gameState, setGameState] = useState<GamificationState>(initialState);

  const getRank = useCallback((level: number): string => {
    if (level >= 8) return 'Professor';
    if (level >= 7) return 'Grossmeyster';
    if (level >= 6) return 'Usta';
    if (level >= 5) return 'Ekspert';
    if (level >= 4) return 'Tadqiqotchi';
    if (level >= 3) return 'Olim';
    if (level >= 2) return 'Shogird';
    return "Boshlang'ich Talaba";
  }, []);

  const awardXP = useCallback(async (amount: number) => {
    const user = await getAuthUser();

    setGameState((prev) => {
      const newXp = prev.totalXp + amount;
      const newLevel = getLevelInfo(newXp).level;
      const meta = DailyQuestService.getGamificationMeta(user?.id);
      const streakFreezeAvailable = (meta?.streakFreezes || 0) > 0;
      const {
        streak: newStreak,
        lastActivityDate: newLastActivityDate,
        freezeUsed,
      } = calculateStreak(prev.lastActivityDate, prev.currentStreak, new Date(), {
        streakFreezeAvailable,
        useLocalDate: true,
      });

      if (freezeUsed) {
        DailyQuestService.consumeStreakFreeze(user?.id);
      }

      if (user) {
        const dbUserId = isUuid(user.id) ? user.id : toDeterministicUUID(user.id);
        supabase
          .from('profiles')
          .upsert({
            id: dbUserId,
            total_xp: newXp,
            level: newLevel,
            current_streak: newStreak,
            last_activity_date: newLastActivityDate,
            updated_at: new Date().toISOString(),
          })
          .then(
            ({ error }) => {
              if (error) console.error('XP and streak update failed:', error);
            },
            (error: unknown) => {
              console.error('XP and streak update failed:', error);
            },
          );
      } else {
        safeLocalStorage.setJSON('study_planner_guest_gamification', {
          totalXp: newXp,
          level: newLevel,
          currentStreak: newStreak,
          lastActivityDate: newLastActivityDate,
        });
      }

      return {
        ...prev,
        totalXp: newXp,
        level: newLevel,
        currentStreak: newStreak,
        lastActivityDate: newLastActivityDate,
      };
    });
  }, []);

  // Helper to manually sync state if parent fetches fresh data
  const setGamificationState = useCallback(
    (value: GamificationState | ((prev: GamificationState) => GamificationState)) => {
      setGameState(value);
    },
    [],
  );

  const resetXP = useCallback(async () => {
    const user = await getAuthUser();
    const todayStr = new Date().toISOString().split('T')[0];
    setGameState((prev) => ({
      ...prev,
      totalXp: 0,
      level: 1,
      currentStreak: 0,
      lastActivityDate: todayStr,
    }));
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        total_xp: 0,
        level: 1,
        current_streak: 0,
        last_activity_date: todayStr,
        updated_at: new Date().toISOString(),
      });
    } else {
      safeLocalStorage.setJSON('study_planner_guest_gamification', {
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        lastActivityDate: todayStr,
      });
    }
  }, []);

  return {
    gameState,
    setGamificationState,
    awardXP,
    resetXP,
    getRank,
  };
};
