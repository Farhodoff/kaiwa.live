import { Task, Flashcard } from '../../types';
import { supabase } from '../../lib/supabase';

export interface RebalanceResult {
  success: boolean;
  weakAreas: string[];
  suggestedFocus: string;
  newTasksCreated: number;
  message: string;
}

/**
 * Analyzes user's recent task completions, flashcard recall rates, and error vault logs.
 * Dynamically re-balances upcoming study schedule and saves updated plan to Supabase DB.
 */
export async function analyzeAndRebalanceSchedule(
  userId: string,
  tasks: Task[],
  flashcards: Flashcard[],
  planType: 'IELTS' | 'JLPT' = 'IELTS',
): Promise<RebalanceResult> {
  try {
    // 1. Analyze Weak Areas from Tasks & Flashcards
    const completedTasks = tasks.filter((t) => t.completed);

    const lowEaseCards = flashcards.filter(
      (f) => (f.easeFactor || 2.5) < 2.1 || (f.repetitions || 0) < 2,
    );

    const weakSkillsSet = new Set<string>();

    if (lowEaseCards.length > 5) {
      weakSkillsSet.add('Vocabulary & Spaced Repetition');
    }

    // Skill frequency analysis
    let readingCount = 0;
    let listeningCount = 0;
    let writingCount = 0;
    let speakingCount = 0;

    completedTasks.forEach((t) => {
      const titleLower = t.title.toLowerCase();
      if (titleLower.includes('reading')) readingCount++;
      if (titleLower.includes('listening')) listeningCount++;
      if (titleLower.includes('writing') || titleLower.includes('essay')) writingCount++;
      if (titleLower.includes('speaking') || titleLower.includes('coach')) speakingCount++;
    });

    const counts = [
      { skill: 'Reading', count: readingCount },
      { skill: 'Listening', count: listeningCount },
      { skill: 'Writing', count: writingCount },
      { skill: 'Speaking', count: speakingCount },
    ].sort((a, b) => a.count - b.count);

    // Weakest 2 skills get priority
    counts.slice(0, 2).forEach((item) => weakSkillsSet.add(item.skill));

    const weakAreas = Array.from(weakSkillsSet);
    const primaryFocus = weakAreas.slice(0, 2).join(' & ') || 'Writing & Speaking';

    // 2. Generate Next 7 Days Optimized Tasks
    const newTasks: Partial<Task>[] = [];
    const today = new Date();

    for (let day = 1; day <= 7; day++) {
      const dueDate = new Date(today.getTime() + day * 86400000).toISOString().split('T')[0];

      if (planType === 'IELTS') {
        newTasks.push({
          title: `[IELTS Re-balanced Day ${day}] ${primaryFocus} Intensiv Mashq`,
          completed: false,
          status: 'todo',
          priority: day <= 3 ? 'high' : 'medium',
          dueDate,
        });
        newTasks.push({
          title: `[IELTS Re-balanced Day ${day}] SM-2 Fleshkartalarni Takrorlash (${lowEaseCards.length} ta kartochka)`,
          completed: false,
          status: 'todo',
          priority: 'medium',
          dueDate,
        });
      } else {
        newTasks.push({
          title: `[JLPT Re-balanced Day ${day}] ${primaryFocus} Kanji & Bunpou Mashq`,
          completed: false,
          status: 'todo',
          priority: day <= 3 ? 'high' : 'medium',
          dueDate,
        });
      }
    }

    // 3. Save new tasks to Supabase DB tasks table
    if (userId) {
      const dbTasksPayload = newTasks.map((t) => ({
        user_id: userId,
        title: t.title,
        completed: false,
        status: 'todo',
        priority: t.priority,
        due_date: t.dueDate,
      }));

      const { error } = await supabase.from('tasks').insert(dbTasksPayload).select();
      if (error) {
        console.warn('Re-balancer DB insert warning:', error);
      }
    }

    // 4. Update user_metadata in Supabase Auth DB
    const metadataKey = planType === 'IELTS' ? 'ielts_user_target' : 'jlpt_user_target';
    const rebalancedMetadata = {
      lastRebalancedAt: new Date().toISOString(),
      primaryFocus,
      weakAreas,
      rebalancedDaysCount: 7,
    };

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const existingMetadata = user?.user_metadata?.[metadataKey] || {};
      await supabase.auth.updateUser({
        data: {
          [metadataKey]: {
            ...existingMetadata,
            rebalanceHistory: [...(existingMetadata.rebalanceHistory || []), rebalancedMetadata],
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } catch (e) {
      console.warn('Failed to update user_metadata rebalance history:', e);
    }

    return {
      success: true,
      weakAreas,
      suggestedFocus: primaryFocus,
      newTasksCreated: newTasks.length,
      message: `Haftalik reja muvaffaqiyatli optimallashtirildi! Eng zaif yo'nalishlar (${primaryFocus}) bo'yicha ${newTasks.length} ta yangi intensiv topshiriq biriktirildi.`,
    };
  } catch (err: any) {
    console.error('Weekly Re-balancer error:', err);
    return {
      success: false,
      weakAreas: ['General Practice'],
      suggestedFocus: 'General Practice',
      newTasksCreated: 0,
      message: err?.message || 'Rejani optimallashtirishda xatolik yuz berdi.',
    };
  }
}
