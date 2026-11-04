import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Goal } from '../types';
import { generateUUID, isUuid } from '../utils/uuid';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

const getActiveUserId = (): string => {
  const cachedUser = safeLocalStorage.getJSON<{ id?: string } | null>(
    'study_planner_user_cache',
    null,
  );
  return cachedUser?.id && isUuid(cachedUser.id) ? cachedUser.id : 'guest';
};

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const activeId = getActiveUserId();
    return safeLocalStorage.getJSON<Goal[]>(`study_planner_goals_cache_${activeId}`, []);
  });

  const addGoal = useCallback(async (goalData: Partial<Goal>): Promise<Goal | null> => {
    let activeUserId = 'local_user';
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) activeUserId = session.user.id;
    } catch {}

    const goalId = goalData.id || generateUUID();
    const fullGoalData: Goal = {
      id: goalId,
      title: goalData.title || '',
      description: goalData.description || '',
      deadline: goalData.deadline || new Date().toISOString(),
      progress: goalData.progress || 0,
      color: goalData.color || '#6366f1',
      priority: goalData.priority || 'medium',
      createdAt: new Date().toISOString(),
      completed: goalData.completed || false,
    };

    setGoals((prev) => {
      const updated = [...prev, fullGoalData];
      const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
      safeLocalStorage.setJSON(`study_planner_goals_cache_${activeId}`, updated);
      return updated;
    });

    if (activeUserId !== 'local_user') {
      try {
        const { error } = await supabase.from('goals').insert({
          id: goalId,
          user_id: activeUserId,
          title: fullGoalData.title,
          description: fullGoalData.description,
          deadline: fullGoalData.deadline,
          progress: fullGoalData.progress,
          color: fullGoalData.color,
          priority: fullGoalData.priority,
          completed: fullGoalData.completed,
          created_at: fullGoalData.createdAt,
        });
        if (error && !error.message?.includes('Offline') && !error.message?.includes('Network')) {
          console.warn('Insert goal warning:', error.message);
        }
      } catch (e) {
        console.warn('[addGoal] DB sync error:', e);
      }
    }
    return fullGoalData;
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    let activeUserId = 'local_user';
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) activeUserId = session.user.id;
    } catch {}

    setGoals((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, ...updates } : g));
      const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
      safeLocalStorage.setJSON(`study_planner_goals_cache_${activeId}`, updated);
      return updated;
    });

    if (activeUserId !== 'local_user') {
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;

      try {
        const { error } = await supabase.from('goals').update(dbUpdates).eq('id', id);
        if (error) {
          console.warn('[updateGoal] DB update warning:', error.message);
        }
      } catch (e) {
        console.warn('[updateGoal] DB sync error:', e);
      }
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    let activeUserId = 'local_user';
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) activeUserId = session.user.id;
    } catch {}

    setGoals((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
      safeLocalStorage.setJSON(`study_planner_goals_cache_${activeId}`, updated);
      return updated;
    });

    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) {
        console.warn('[deleteGoal] DB delete warning:', error.message);
      }
    } catch (e) {
      console.warn('[deleteGoal] DB sync error:', e);
    }
  }, []);

  return {
    goals,
    setGoals,
    addGoal,
    updateGoal,
    deleteGoal,
  };
};
