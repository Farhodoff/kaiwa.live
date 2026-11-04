import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WhiteboardMetadata } from '../types';
import { generateUUID, isUuid } from '../utils/uuid';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

const getActiveUserId = (): string => {
  const cachedUser = safeLocalStorage.getJSON<{ id?: string } | null>(
    'study_planner_user_cache',
    null,
  );
  return cachedUser?.id && isUuid(cachedUser.id) ? cachedUser.id : 'guest';
};

export const useWhiteboards = () => {
  const [whiteboards, setWhiteboards] = useState<WhiteboardMetadata[]>(() => {
    const activeId = getActiveUserId();
    return safeLocalStorage.getJSON<WhiteboardMetadata[]>(
      `study_planner_whiteboards_cache_${activeId}`,
      [],
    );
  });

  const addWhiteboard = useCallback(
    async (subjectId: string, title: string): Promise<string | null> => {
      let activeUserId = 'local_user';
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) activeUserId = session.user.id;
      } catch {}

      const newId = generateUUID();
      const newWb: WhiteboardMetadata = {
        id: newId,
        subjectId: subjectId,
        userId: activeUserId,
        title: title || 'Adsiz Doska',
        updatedAt: new Date().toISOString(),
      };

      setWhiteboards((prev) => {
        const updated = [...prev, newWb];
        const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
        safeLocalStorage.setJSON(`study_planner_whiteboards_cache_${activeId}`, updated);
        return updated;
      });

      if (activeUserId !== 'local_user') {
        try {
          const { data } = await supabase
            .from('whiteboards')
            .insert({
              id: newId,
              user_id: activeUserId,
              subject_id: subjectId,
              title: title,
              updated_at: new Date().toISOString(),
            })
            .select('id, subject_id, user_id, title, updated_at')
            .single();

          if (data) {
            setWhiteboards((prev) => {
              const updated = prev.map((w) =>
                w.id === newId
                  ? {
                      id: data.id,
                      subjectId: data.subject_id,
                      userId: data.user_id,
                      title: data.title,
                      updatedAt: data.updated_at,
                    }
                  : w,
              );
              const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
              safeLocalStorage.setJSON(`study_planner_whiteboards_cache_${activeId}`, updated);
              return updated;
            });
          }
        } catch (error: any) {
          console.warn('addWhiteboard DB notice (local whiteboard preserved):', error);
        }
      }
      return newId;
    },
    [],
  );

  const deleteWhiteboard = useCallback(async (id: string): Promise<void> => {
    let activeUserId = 'local_user';
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) activeUserId = session.user.id;
    } catch {}

    setWhiteboards((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
      safeLocalStorage.setJSON(`study_planner_whiteboards_cache_${activeId}`, updated);
      return updated;
    });
    await supabase.from('whiteboards').delete().eq('id', id);
  }, []);

  const updateWhiteboardTitle = useCallback(async (id: string, title: string): Promise<void> => {
    let activeUserId = 'local_user';
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) activeUserId = session.user.id;
    } catch {}

    setWhiteboards((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, title } : w));
      const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
      safeLocalStorage.setJSON(`study_planner_whiteboards_cache_${activeId}`, updated);
      return updated;
    });
    await supabase.from('whiteboards').update({ title }).eq('id', id);
  }, []);

  return {
    whiteboards,
    setWhiteboards,
    addWhiteboard,
    deleteWhiteboard,
    updateWhiteboardTitle,
  };
};
