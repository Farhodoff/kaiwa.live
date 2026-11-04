import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toDeterministicUUID } from '../utils/uuid';

export type MasteryStatus = 'unlearned' | 'learned' | 'hard' | 'mastered';

export interface MasteryRecord {
  [itemId: string]: MasteryStatus;
}

const STORAGE_KEY = 'jlpt_mastery_status_v1';

export const useJlptMastery = () => {
  const [records, setRecords] = useState<MasteryRecord>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load from DB (jlpt_item_mastery table + user_metadata fallback) on mount
  useEffect(() => {
    const fetchDbMastery = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user?.id) return;

        // 1. Fetch from jlpt_item_mastery table
        const { data: dbRows, error: dbErr } = await supabase
          .from('jlpt_item_mastery')
          .select('*')
          .eq('user_id', user.id);

        if (!dbErr && dbRows && dbRows.length > 0) {
          const dbMap: MasteryRecord = {};
          dbRows.forEach((r) => {
            dbMap[r.item_id] = r.mastery_status as MasteryStatus;
          });
          setRecords((prev) => {
            const merged = { ...prev, ...dbMap };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
          return;
        }

        // 2. Metadata fallback
        if (user?.user_metadata?.jlpt_mastery) {
          const dbRecords = user.user_metadata.jlpt_mastery as MasteryRecord;
          setRecords((prev) => {
            const merged = { ...dbRecords, ...prev };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (e) {
        console.warn('Failed to fetch DB JLPT mastery:', e);
      }
    };
    fetchDbMastery();
  }, []);

  const setItemStatus = (itemId: string, status: MasteryStatus) => {
    setRecords((prev) => {
      const updated = {
        ...prev,
        [itemId]: status,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save JLPT mastery status to localStorage:', e);
      }

      // Sync to Supabase DB (jlpt_item_mastery table)
      supabase.auth.getSession().then(({ data: { session } }) => {
        const user = session?.user;
        if (user) {
          const uuid = toDeterministicUUID(`jlpt_${user.id}_${itemId}`);
          supabase
            .from('jlpt_item_mastery')
            .upsert({
              id: uuid,
              user_id: user.id,
              item_id: itemId,
              mastery_status: status,
              updated_at: new Date().toISOString(),
            })
            .then(({ error }) => {
              if (error) console.warn('[useJlptMastery] DB upsert error:', error);
            });

          // Fallback to user_metadata
          supabase.auth
            .updateUser({
              data: { jlpt_mastery: updated },
            })
            .catch((err) => console.warn('Failed to sync JLPT mastery to metadata:', err));
        }
      });

      return updated;
    });
  };

  const getItemStatus = (itemId: string): MasteryStatus => {
    return records[itemId] || 'unlearned';
  };

  const getStatsForLevel = (items: { id: string; level: string }[]) => {
    const total = items.length;
    if (total === 0) return { learned: 0, hard: 0, mastered: 0, unlearned: 0, percentage: 0 };

    let learned = 0;
    let hard = 0;
    let mastered = 0;

    items.forEach((item) => {
      const st = getItemStatus(item.id);
      if (st === 'learned') learned++;
      else if (st === 'hard') hard++;
      else if (st === 'mastered') mastered++;
    });

    const completed = learned + mastered;
    const percentage = Math.round((completed / total) * 100);

    return {
      total,
      learned,
      hard,
      mastered,
      unlearned: total - (learned + hard + mastered),
      percentage,
    };
  };

  return {
    records,
    setItemStatus,
    getItemStatus,
    getStatsForLevel,
  };
};
