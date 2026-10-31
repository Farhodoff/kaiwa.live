import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StudySession, CoachSession } from '../types';
import { DatabaseSession } from '../types/supabase-types';
import { generateUUID, isUuid } from '../utils/uuid';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { OfflineSyncManager } from '../services/OfflineSyncManager';

const getActiveUserId = (): string => {
  const cachedUser = safeLocalStorage.getJSON<{ id?: string } | null>(
    'study_planner_user_cache',
    null,
  );
  return cachedUser?.id && isUuid(cachedUser.id) ? cachedUser.id : 'guest';
};

export const useSessions = (awardXP?: (amount: number) => Promise<void>) => {
  const awardXPRef = useRef(awardXP);
  useEffect(() => {
    awardXPRef.current = awardXP;
  }, [awardXP]);

  const [sessions, setSessions] = useState<StudySession[]>(() => {
    const activeId = getActiveUserId();
    return safeLocalStorage.getJSON<StudySession[]>(`study_planner_sessions_cache_${activeId}`, []);
  });
  const [coachSessions, setCoachSessions] = useState<CoachSession[]>([]);

  const addSession = useCallback(async (sessionData: Partial<StudySession>): Promise<void> => {
    let activeUserId = 'local_user';
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) activeUserId = session.user.id;
    } catch {}

    const sessionId = sessionData.id || generateUUID();
    const supabaseData: DatabaseSession = {
      id: sessionId,
      user_id: activeUserId,
      duration: sessionData.duration || 0,
      type: sessionData.type || 'focus',
      completed: !!sessionData.completed,
      mood_before: sessionData.moodBefore === null ? undefined : sessionData.moodBefore,
      mood_after: sessionData.moodAfter === null ? undefined : sessionData.moodAfter,
      subject_id: sessionData.subjectId || undefined,
      start_time: sessionData.startTime || new Date().toISOString(),
    };

    const mappedSession: StudySession = {
      id: sessionId,
      subjectId: sessionData.subjectId,
      startTime: supabaseData.start_time,
      duration: supabaseData.duration,
      type: supabaseData.type as 'focus' | 'break',
      completed: supabaseData.completed,
      moodBefore: supabaseData.mood_before,
      moodAfter: supabaseData.mood_after,
    };

    setSessions((prev) => {
      const updated = [...prev, mappedSession];
      const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
      safeLocalStorage.setJSON(`study_planner_sessions_cache_${activeId}`, updated);
      return updated;
    });

    let dbSuccess = false;
    if (
      activeUserId !== 'local_user' &&
      isUuid(activeUserId) &&
      typeof navigator !== 'undefined' &&
      navigator.onLine
    ) {
      try {
        const { data, error } = await supabase
          .from('study_sessions')
          .upsert(supabaseData, { onConflict: 'id' })
          .select()
          .single();
        if (data && !error) {
          dbSuccess = true;
          setSessions((prev) => {
            const updated = prev.map((s) =>
              s.id === sessionId
                ? ({
                    ...data,
                    subjectId: data.subject_id,
                    startTime: data.start_time,
                    moodBefore: data.mood_before,
                    moodAfter: data.mood_after,
                  } as StudySession)
                : s,
            );
            const activeId = activeUserId !== 'local_user' ? activeUserId : getActiveUserId();
            safeLocalStorage.setJSON(`study_planner_sessions_cache_${activeId}`, updated);
            return updated;
          });
          if (awardXPRef.current) {
            await awardXPRef.current(sessionData.type === 'focus' ? 10 : 2);
          }
        }
      } catch (e) {
        console.warn('[addSession] Server save error:', e);
      }
    }

    // Only enqueue to offline queue if server save failed or device is offline!
    if (!dbSuccess && activeUserId !== 'local_user' && isUuid(activeUserId)) {
      OfflineSyncManager.enqueueStudySession({
        id: sessionId,
        userId: activeUserId,
        startTime: supabaseData.start_time,
        duration: supabaseData.duration,
        type: supabaseData.type,
        subjectId: supabaseData.subject_id,
        completed: supabaseData.completed,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }, []);

  const addCoachSession = useCallback(async (session: Partial<CoachSession>): Promise<void> => {
    let activeUserId: string | null = null;
    let userEmail: string | undefined = undefined;
    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      if (authSession?.user?.id) {
        activeUserId = authSession.user.id;
        userEmail = authSession.user.email;
      }
    } catch {}

    if (!activeUserId) return;

    const sessionId = session.id || generateUUID();
    const personaTitle = session.personaTitle || 'AI Coach';
    const fluencyScore = Number(session.fluencyScore) || 0;
    const pronunciationScore = Number(session.pronunciationScore) || fluencyScore;
    const vocabularyScore = Number(session.vocabularyScore) || 0;
    const grammarScore = Number(session.grammarScore) || 0;
    const overallScore = Math.round(
      (fluencyScore +
        pronunciationScore +
        (vocabularyScore || fluencyScore) +
        (grammarScore || fluencyScore)) /
        4,
    );
    const feedback = session.feedback || '';
    const createdAt = session.createdAt || new Date().toISOString();

    // 1. Primary insert to speaking_sessions
    try {
      await supabase.from('speaking_sessions').insert({
        id: sessionId,
        user_id: activeUserId,
        user_email: userEmail,
        persona_title: personaTitle,
        topic: personaTitle,
        fluency_score: fluencyScore,
        pronunciation_score: pronunciationScore,
        vocabulary_score: vocabularyScore,
        grammar_score: grammarScore,
        overall_score: overallScore,
        duration_seconds: 120,
        feedback: feedback,
        ai_feedback: feedback,
        language: 'ja',
        created_at: createdAt,
      });
    } catch (e) {
      console.warn('[useSessions] speaking_sessions insert notice:', e);
    }

    // 2. Insert to speaking_coach_sessions
    const dbCoachSession = {
      id: sessionId,
      user_id: activeUserId,
      persona: personaTitle,
      persona_title: personaTitle,
      fluency_score: fluencyScore,
      pronunciation_score: pronunciationScore,
      vocabulary_score: vocabularyScore,
      grammar_score: grammarScore,
      feedback: feedback,
      created_at: createdAt,
    };

    const { data, error } = await supabase
      .from('speaking_coach_sessions')
      .insert(dbCoachSession)
      .select()
      .single();

    if (error) {
      console.warn("Coach Session Supabase'ga saqlanmadi (lokal saqlanmoqda):", error);
      const newLocalSession: CoachSession = {
        id: sessionId,
        personaTitle: personaTitle,
        fluencyScore: fluencyScore,
        vocabularyScore: vocabularyScore,
        grammarScore: grammarScore,
        pronunciationScore: pronunciationScore,
        feedback: feedback,
        createdAt: createdAt,
      };
      setCoachSessions((prev) => [newLocalSession, ...prev]);
      return;
    }

    if (data) {
      setCoachSessions((prev) => [
        {
          id: data.id,
          personaTitle: data.persona_title || data.persona || personaTitle,
          fluencyScore: data.fluency_score,
          vocabularyScore: data.vocabulary_score || vocabularyScore,
          grammarScore: data.grammar_score || grammarScore,
          pronunciationScore: data.pronunciation_score,
          feedback: data.feedback,
          createdAt: data.created_at,
        },
        ...prev,
      ]);
      if (awardXPRef.current) {
        await awardXPRef.current(15);
      }
    }
  }, []);

  const setSessionsState = useCallback((value: React.SetStateAction<StudySession[]>) => {
    setSessions(value);
  }, []);

  const setCoachSessionsState = useCallback((value: React.SetStateAction<CoachSession[]>) => {
    setCoachSessions(value);
  }, []);

  return {
    sessions,
    setSessions: setSessionsState,
    coachSessions,
    setCoachSessions: setCoachSessionsState,
    addSession,
    addCoachSession,
  };
};
