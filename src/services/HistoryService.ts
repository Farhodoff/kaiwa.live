import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { OfflineSyncManager } from './OfflineSyncManager';
import { toDeterministicUUID, generateUUID, isUuid } from '../utils/uuid';

export interface WritingHistoryItem {
  id: string;
  taskType: 'task1' | 'task2' | string;
  prompt: string;
  essay: string;
  score: number;
  criteriaBreakdown?: {
    tr?: number; // Task Achievement
    cc?: number; // Coherence & Cohesion
    lr?: number; // Lexical Resource
    gra?: number; // Grammatical Range
    [key: string]: any;
  };
  feedback: string;
  createdAt: string;
}

export interface SpeakingSessionItem {
  id: string;
  language: 'en' | 'ja';
  persona: string;
  durationSeconds: number;
  fluencyScore: number;
  pronunciationScore: number;
  transcript: string;
  feedback: string;
  createdAt: string;
}

export interface MockExamItem {
  id: string;
  examType: 'ielts_reading' | 'ielts_listening' | 'ielts_speaking' | 'ielts_writing' | 'jlpt';
  level?: string; // for JLPT (N5-N1)
  score: number; // raw correct count or JLPT score out of 180
  totalQuestions: number;
  bandScore?: number; // for IELTS (e.g. 7.5)
  createdAt: string;
}

// In-memory set of missing tables to avoid repeated 404 network errors
const missingTables = new Set<string>();

function isTableDisabled(tableName: string): boolean {
  return missingTables.has(tableName);
}

function handleTableError(tableName: string, error: any) {
  if (
    error &&
    (error.code === 'PGRST301' ||
      error.code === '42P01' ||
      error.status === 404 ||
      String(error.message).includes('404'))
  ) {
    missingTables.add(tableName);
  }
}

const getStorageKey = (prefix: string, userId?: string | null): string => {
  return `${prefix}:${userId || 'anon'}`;
};

export class HistoryService {
  static clearMissingTablesCache() {
    missingTables.clear();
  }
  // === Writing History ===
  static async saveWritingHistory(
    item: Omit<WritingHistoryItem, 'id' | 'createdAt'>,
  ): Promise<WritingHistoryItem> {
    return this.saveWritingAttempt(item);
  }

  static async saveWritingAttempt(
    item: Omit<WritingHistoryItem, 'id' | 'createdAt'>,
  ): Promise<WritingHistoryItem> {
    const newItem: WritingHistoryItem = {
      ...item,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      createdAt: new Date().toISOString(),
    };

    let userId: string | null = null;
    if (!isTableDisabled('ielts_writing_history')) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          const safeUserId = toDeterministicUUID(user.id);
          const { error } = await supabase.from('ielts_writing_history').insert({
            user_id: safeUserId,
            task_type: newItem.taskType,
            prompt: newItem.prompt,
            essay: newItem.essay,
            score: newItem.score,
            criteria: newItem.criteriaBreakdown,
            feedback: newItem.feedback,
            created_at: newItem.createdAt,
          });
          if (error) handleTableError('ielts_writing_history', error);
        }
      } catch (e) {
        handleTableError('ielts_writing_history', e);
      }
    }

    const scopedKey = getStorageKey('study_planner_jlpt_writing_history', userId);
    const legacyScopedKey = getStorageKey('study_planner_ielts_writing_history', userId);
    const rawLocal =
      safeLocalStorage.getItem('study_planner_jlpt_writing_history') ||
      safeLocalStorage.getItem('study_planner_ielts_writing_history') ||
      (userId
        ? safeLocalStorage.getItem(scopedKey) || safeLocalStorage.getItem(legacyScopedKey)
        : null);
    const list: WritingHistoryItem[] = rawLocal ? JSON.parse(rawLocal) : [];
    list.unshift(newItem);
    safeLocalStorage.setJSON('study_planner_jlpt_writing_history', list.slice(0, 50));
    safeLocalStorage.setJSON('study_planner_ielts_writing_history', list.slice(0, 50));
    if (userId) {
      safeLocalStorage.setJSON(scopedKey, list.slice(0, 50));
      safeLocalStorage.setJSON(legacyScopedKey, list.slice(0, 50));
    }

    return newItem;
  }

  static async getWritingHistory(limit: number = 100): Promise<WritingHistoryItem[]> {
    let userId: string | null = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch (e) {
      logger.debug('HistoryService', 'No authenticated user for writing history', e);
    }

    const scopedKey = getStorageKey('study_planner_jlpt_writing_history', userId);
    const legacyScopedKey = getStorageKey('study_planner_ielts_writing_history', userId);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const local = userId
        ? safeLocalStorage.getItem(scopedKey) ||
          safeLocalStorage.getItem(legacyScopedKey) ||
          safeLocalStorage.getItem('study_planner_jlpt_writing_history') ||
          safeLocalStorage.getItem('study_planner_ielts_writing_history')
        : safeLocalStorage.getItem('study_planner_jlpt_writing_history') ||
          safeLocalStorage.getItem('study_planner_ielts_writing_history');
      return local ? JSON.parse(local) : [];
    }

    if (!isTableDisabled('ielts_writing_history') && userId) {
      try {
        const safeUserId = toDeterministicUUID(userId);
        const { data, error } = await supabase
          .from('ielts_writing_history')
          .select('*')
          .eq('user_id', safeUserId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!error && data) {
          const mapped = data.map((item: any) => ({
            id: item.id || item.user_id,
            taskType: item.task_type,
            prompt: item.prompt,
            essay: item.essay,
            score: item.score,
            criteriaBreakdown: item.criteria,
            feedback: item.feedback,
            createdAt: item.created_at,
          }));
          safeLocalStorage.setJSON(scopedKey, mapped.slice(0, 50));
          safeLocalStorage.setJSON(legacyScopedKey, mapped.slice(0, 50));
          return mapped;
        } else if (error) {
          handleTableError('ielts_writing_history', error);
        }
      } catch (e) {
        handleTableError('ielts_writing_history', e);
      }
    }

    const local = userId
      ? safeLocalStorage.getItem(scopedKey) ||
        safeLocalStorage.getItem(legacyScopedKey) ||
        safeLocalStorage.getItem('study_planner_jlpt_writing_history') ||
        safeLocalStorage.getItem('study_planner_ielts_writing_history')
      : safeLocalStorage.getItem('study_planner_jlpt_writing_history') ||
        safeLocalStorage.getItem('study_planner_ielts_writing_history');
    return local ? JSON.parse(local) : [];
  }

  // === Speaking Coach Sessions ===
  static async saveSpeakingSession(
    item: Omit<SpeakingSessionItem, 'id' | 'createdAt'>,
  ): Promise<SpeakingSessionItem> {
    const newItem: SpeakingSessionItem = {
      ...item,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };

    let userId: string | null = null;
    let dbSuccess = false;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          const safeUserId = isUuid(user.id) ? user.id : toDeterministicUUID(user.id);

          const { error } = await supabase.from('speaking_coach_sessions').upsert(
            {
              id: newItem.id,
              user_id: safeUserId,
              language: newItem.language,
              persona: newItem.persona || 'AI Sensei',
              topic: newItem.persona || 'General Practice',
              duration_seconds: newItem.durationSeconds,
              fluency_score: newItem.fluencyScore,
              pronunciation_score: newItem.pronunciationScore,
              transcript:
                typeof newItem.transcript === 'string'
                  ? newItem.transcript
                  : JSON.stringify(newItem.transcript),
              feedback:
                typeof newItem.feedback === 'string'
                  ? newItem.feedback
                  : JSON.stringify(newItem.feedback),
              created_at: newItem.createdAt,
            },
            { onConflict: 'id' },
          );

          if (!error) {
            dbSuccess = true;
          }
        }
      }
    } catch (e) {
      console.warn('[HistoryService] DB speaking session insert notice:', e);
    }

    if (!dbSuccess && userId) {
      await OfflineSyncManager.enqueueSpeakingSession({
        id: newItem.id,
        userId,
        topic: newItem.persona,
        fluencyScore: newItem.fluencyScore,
        grammarScore: 8.0,
        pronunciationScore: newItem.pronunciationScore,
        vocabularyScore: 8.0,
        durationSeconds: newItem.durationSeconds,
        createdAt: newItem.createdAt,
      }).catch(() => {});
    }

    const scopedKey = getStorageKey('study_planner_speaking_coach_sessions', userId);
    const rawLocal =
      safeLocalStorage.getItem('study_planner_speaking_coach_sessions') ||
      (userId ? safeLocalStorage.getItem(scopedKey) : null);
    const list: SpeakingSessionItem[] = rawLocal ? JSON.parse(rawLocal) : [];
    list.unshift(newItem);
    safeLocalStorage.setJSON('study_planner_speaking_coach_sessions', list.slice(0, 50));
    if (userId) {
      safeLocalStorage.setJSON(scopedKey, list.slice(0, 50));
    }

    return newItem;
  }

  static async getSpeakingHistory(limit: number = 100): Promise<SpeakingSessionItem[]> {
    let userId: string | null = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch (e) {
      logger.debug('HistoryService', 'No authenticated user for speaking history', e);
    }

    const scopedKey = getStorageKey('study_planner_speaking_coach_sessions', userId);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const local = userId
        ? safeLocalStorage.getItem(scopedKey) ||
          safeLocalStorage.getItem('study_planner_speaking_coach_sessions')
        : safeLocalStorage.getItem('study_planner_speaking_coach_sessions');
      return local ? JSON.parse(local) : [];
    }

    if (!isTableDisabled('speaking_coach_sessions') && userId) {
      try {
        const safeUserId = toDeterministicUUID(userId);
        const { data, error } = await supabase
          .from('speaking_coach_sessions')
          .select('*')
          .eq('user_id', safeUserId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!error && data) {
          const mapped = data.map((item: any) => ({
            id: item.id || item.user_id,
            language: item.language,
            persona: item.persona,
            durationSeconds: item.duration_seconds,
            fluencyScore: item.fluency_score,
            pronunciationScore: item.pronunciation_score,
            transcript: item.transcript,
            feedback: item.feedback,
            createdAt: item.created_at,
          }));
          safeLocalStorage.setJSON(scopedKey, mapped.slice(0, 50));
          return mapped;
        } else if (error) {
          handleTableError('speaking_coach_sessions', error);
        }
      } catch (e) {
        handleTableError('speaking_coach_sessions', e);
      }
    }

    const local = userId
      ? safeLocalStorage.getItem(scopedKey) ||
        safeLocalStorage.getItem('study_planner_speaking_coach_sessions')
      : safeLocalStorage.getItem('study_planner_speaking_coach_sessions');
    return local ? JSON.parse(local) : [];
  }

  // === Mock Exams (IELTS Reading/Listening, JLPT) ===
  static async saveMockExam(item: Omit<MockExamItem, 'id' | 'createdAt'>): Promise<MockExamItem> {
    const newItem: MockExamItem = {
      ...item,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };

    let userId: string | null = null;
    let dbSuccess = false;
    if (!isTableDisabled('mock_exams_history')) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          if (typeof navigator !== 'undefined' && navigator.onLine) {
            const safeUserId = isUuid(user.id) ? user.id : toDeterministicUUID(user.id);
            const { error } = await supabase.from('mock_exams_history').upsert(
              {
                id: newItem.id,
                user_id: safeUserId,
                exam_type: newItem.examType,
                level: newItem.level || null,
                score: newItem.score,
                total_questions: newItem.totalQuestions,
                band_score: newItem.bandScore || null,
                created_at: newItem.createdAt,
              },
              { onConflict: 'id' },
            );
            if (error) {
              handleTableError('mock_exams_history', error);
            } else {
              dbSuccess = true;
            }
          }
        }
      } catch (e) {
        handleTableError('mock_exams_history', e);
      }
    }

    if (!dbSuccess && userId) {
      await OfflineSyncManager.enqueueMockExam({
        id: newItem.id,
        userId,
        examType: newItem.examType,
        level: newItem.level,
        score: newItem.score,
        totalQuestions: newItem.totalQuestions,
        bandScore: newItem.bandScore,
        createdAt: newItem.createdAt,
      }).catch(() => {});
    }

    const scopedKey = getStorageKey('study_planner_mock_exams_history', userId);
    const rawLocal =
      safeLocalStorage.getItem('study_planner_mock_exams_history') ||
      (userId ? safeLocalStorage.getItem(scopedKey) : null);
    const list: MockExamItem[] = rawLocal ? JSON.parse(rawLocal) : [];
    list.unshift(newItem);
    safeLocalStorage.setJSON('study_planner_mock_exams_history', list.slice(0, 50));
    if (userId) {
      safeLocalStorage.setJSON(scopedKey, list.slice(0, 50));
    }

    return newItem;
  }

  static async getMockExamsHistory(limit: number = 100): Promise<MockExamItem[]> {
    let userId: string | null = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch (e) {
      logger.debug('HistoryService', 'No authenticated user for mock exams history', e);
    }

    const scopedKey = getStorageKey('study_planner_mock_exams_history', userId);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const local = userId
        ? safeLocalStorage.getItem(scopedKey) ||
          safeLocalStorage.getItem('study_planner_mock_exams_history')
        : safeLocalStorage.getItem('study_planner_mock_exams_history');
      return local ? JSON.parse(local) : [];
    }

    if (!isTableDisabled('mock_exams_history') && userId) {
      try {
        const safeUserId = toDeterministicUUID(userId);
        const { data, error } = await supabase
          .from('mock_exams_history')
          .select('*')
          .eq('user_id', safeUserId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!error && data) {
          const mapped = data.map((item: any) => ({
            id: item.id || item.user_id,
            examType: item.exam_type,
            level: item.level,
            score: item.score,
            totalQuestions: item.total_questions,
            bandScore: item.band_score,
            createdAt: item.created_at,
          }));
          safeLocalStorage.setJSON(scopedKey, mapped.slice(0, 50));
          return mapped;
        } else if (error) {
          handleTableError('mock_exams_history', error);
        }
      } catch (e) {
        handleTableError('mock_exams_history', e);
      }
    }

    const local = userId
      ? safeLocalStorage.getItem(scopedKey) ||
        safeLocalStorage.getItem('study_planner_mock_exams_history')
      : safeLocalStorage.getItem('study_planner_mock_exams_history');
    return local ? JSON.parse(local) : [];
  }
}
