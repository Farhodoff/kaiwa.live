import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Note } from '../types';
import { generateUUID, isUuid } from '../utils/uuid';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

const getActiveUserId = (): string => {
  const cachedUser = safeLocalStorage.getJSON<{ id?: string } | null>(
    'study_planner_user_cache',
    null,
  );
  return cachedUser?.id && isUuid(cachedUser.id) ? cachedUser.id : 'guest';
};

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const activeId = getActiveUserId();
    return safeLocalStorage.getJSON<Note[]>(`study_planner_notes_cache_${activeId}`, []);
  });

  const addNote = useCallback(async (noteData: Partial<Note>): Promise<Note | null> => {
    let activeUserId = 'local_user';
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) activeUserId = session.user.id;
    } catch {}

    const noteId = noteData.id || generateUUID();
    const dbNote = {
      id: noteId,
      user_id: activeUserId,
      subject_id: noteData.subjectId,
      title: noteData.title,
      content: noteData.content,
      attachments: noteData.attachments,
      is_pinned: noteData.isPinned || false,
    };

    const newNote: Note = {
      id: noteId,
      subjectId: noteData.subjectId || '',
      title: noteData.title || '',
      content: noteData.content || '',
      attachments: noteData.attachments || [],
      isPinned: noteData.isPinned || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => {
      const updated = [...prev, newNote];
      const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
      safeLocalStorage.setJSON(`study_planner_notes_cache_${activeId}`, updated);
      return updated;
    });

    try {
      const { data } = await supabase.from('notes').insert(dbNote).select().single();
      if (data) {
        const returnedNote: Note = {
          id: data.id,
          subjectId: data.subject_id,
          title: data.title,
          content: data.content,
          attachments: data.attachments || [],
          isPinned: data.is_pinned || false,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === noteId ? returnedNote : n));
          const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
          safeLocalStorage.setJSON(`study_planner_notes_cache_${activeId}`, updated);
          return updated;
        });
        return returnedNote;
      }
    } catch (e) {
      console.warn('[addNote] DB insert notice (local note preserved):', e);
    }
    return newNote;
  }, []);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    let activeUserId = 'local_user';
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) activeUserId = session.user.id;
    } catch {}

    const dbUpdates: Record<string, unknown> = { ...updates };
    if (updates.subjectId) {
      dbUpdates.subject_id = updates.subjectId;
      delete dbUpdates.subjectId;
    }
    if (updates.isPinned !== undefined) {
      dbUpdates.is_pinned = updates.isPinned;
      delete dbUpdates.isPinned;
    }

    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, ...updates } : n));
      const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
      safeLocalStorage.setJSON(`study_planner_notes_cache_${activeId}`, updated);
      return updated;
    });

    await supabase.from('notes').update(dbUpdates).eq('id', id);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    let activeUserId = 'local_user';
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) activeUserId = session.user.id;
    } catch {}

    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
      safeLocalStorage.setJSON(`study_planner_notes_cache_${activeId}`, updated);
      return updated;
    });

    await supabase.from('notes').delete().eq('id', id);
  }, []);

  return {
    notes,
    setNotes,
    addNote,
    updateNote,
    deleteNote,
  };
};
