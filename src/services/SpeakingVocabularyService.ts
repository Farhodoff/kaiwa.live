import { supabase } from '../lib/supabase';
import { toDeterministicUUID } from '../utils/uuid';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { CoachVocabularyItem } from '../components/speaking/speakingTypes';

export interface SpeakingVocabularyRecord {
  id: string;
  userId: string;
  word: string;
  reading?: string;
  meaning: string;
  example?: string;
  language: 'ja' | 'en';
  sessionId?: string;
  topic?: string;
  masteryLevel?: number;
  createdAt: string;
}

export class SpeakingVocabularyService {
  private static getStorageKey(userId: string, language: string): string {
    return `study_planner_speaking_vocabularies_${userId}_${language}`;
  }

  /**
   * Saves an AI Coach recommended vocabulary word to Supabase DB (`speaking_vocabularies` & `flashcards`)
   */
  public static async saveVocabulary(
    userId: string,
    item: CoachVocabularyItem,
    language: 'ja' | 'en' = 'ja',
    topic?: string,
    sessionId?: string,
  ): Promise<{ success: boolean; record: SpeakingVocabularyRecord; alreadyExists?: boolean }> {
    const id = toDeterministicUUID(`${userId}_${language}_${item.word.trim().toLowerCase()}`);
    const now = new Date().toISOString();

    const record: SpeakingVocabularyRecord = {
      id,
      userId,
      word: item.word.trim(),
      reading: item.reading?.trim(),
      meaning: item.meaning.trim(),
      example: item.example?.trim(),
      language,
      sessionId,
      topic: topic || 'AI Speaking Coach',
      masteryLevel: 0,
      createdAt: now,
    };

    // 1. Update Local Storage Cache immediately
    const key = this.getStorageKey(userId, language);
    const existingList = safeLocalStorage.getJSON<SpeakingVocabularyRecord[]>(key, []);
    const alreadyExists = existingList.some(
      (v) => v.word.toLowerCase() === record.word.toLowerCase(),
    );

    if (!alreadyExists) {
      const updated = [record, ...existingList];
      safeLocalStorage.setJSON(key, updated);
    }

    // 2. Direct Supabase Database Persist to `speaking_vocabularies`
    if (userId && userId !== 'guest' && userId !== 'local_user') {
      try {
        const { error: vocabDbErr } = await supabase.from('speaking_vocabularies').upsert(
          {
            id: record.id,
            user_id: userId,
            word: record.word,
            reading: record.reading || null,
            meaning: record.meaning,
            example: record.example || null,
            language: record.language,
            session_id: record.sessionId || null,
            topic: record.topic || null,
            mastery_level: record.masteryLevel || 0,
            created_at: record.createdAt,
          },
          { onConflict: 'id', ignoreDuplicates: false },
        );

        if (vocabDbErr) {
          console.warn('[SpeakingVocabularyService] DB upsert notice:', vocabDbErr.message);
        } else {
          console.info(
            '[SpeakingVocabularyService] ✅ Saved vocabulary to speaking_vocabularies DB:',
            record.word,
          );
        }
      } catch (dbErr) {
        console.warn('[SpeakingVocabularyService] DB network error:', dbErr);
      }
    }

    return {
      success: true,
      record,
      alreadyExists,
    };
  }

  /**
   * Fetches saved speaking vocabulary items from Supabase DB merged with local cache
   */
  public static async fetchVocabularies(
    userId: string,
    language: 'ja' | 'en' = 'ja',
  ): Promise<SpeakingVocabularyRecord[]> {
    const key = this.getStorageKey(userId, language);
    const localList = safeLocalStorage.getJSON<SpeakingVocabularyRecord[]>(key, []);

    if (!userId || userId === 'guest' || userId === 'local_user') {
      return localList;
    }

    try {
      const { data, error } = await supabase
        .from('speaking_vocabularies')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const dbRecords: SpeakingVocabularyRecord[] = data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          word: d.word,
          reading: d.reading,
          meaning: d.meaning,
          example: d.example,
          language: d.language || language,
          sessionId: d.session_id,
          topic: d.topic,
          masteryLevel: d.mastery_level || 0,
          createdAt: d.created_at,
        }));

        const dbIds = new Set(dbRecords.map((r) => r.id));
        const merged = [...dbRecords, ...localList.filter((l) => !dbIds.has(l.id))];
        safeLocalStorage.setJSON(key, merged);
        return merged;
      }
    } catch (e) {
      console.warn('[SpeakingVocabularyService] fetch notice:', e);
    }

    return localList;
  }

  /**
   * Deletes a vocabulary item from Supabase DB and local cache
   */
  public static async deleteVocabulary(
    userId: string,
    id: string,
    language: 'ja' | 'en' = 'ja',
  ): Promise<boolean> {
    const key = this.getStorageKey(userId, language);
    const localList = safeLocalStorage.getJSON<SpeakingVocabularyRecord[]>(key, []);
    const updated = localList.filter((v) => v.id !== id);
    safeLocalStorage.setJSON(key, updated);

    if (userId && userId !== 'guest' && userId !== 'local_user') {
      try {
        await supabase.from('speaking_vocabularies').delete().eq('id', id).eq('user_id', userId);
      } catch {}
    }

    return true;
  }
}
