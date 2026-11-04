/**
 * AudioStorageService
 * Handles uploading recorded speaking session voice audio to private Supabase Storage bucket 'speaking_audios'
 * and provides safe deletion of audio files after automated 22:00 Telegram report dispatch.
 */

import { supabase } from '../lib/supabase';

export class AudioStorageService {
  static readonly BUCKET_NAME = 'speaking_audios';

  /**
   * Upload a session's recorded audio Blob to Supabase Storage
   * Stored under: {userId}/{sessionId}.webm
   * Returns the relative storage path (e.g. 'user_123/session_456.webm') or null if failed.
   */
  static async uploadSpeakingAudio(
    userId: string,
    sessionId: string,
    audioBlob: Blob,
  ): Promise<string | null> {
    if (!userId || !sessionId || !audioBlob || audioBlob.size === 0) {
      return null;
    }

    const cleanSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `${userId}/${cleanSessionId}.webm`;

    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, audioBlob, {
          contentType: audioBlob.type || 'audio/webm',
          upsert: true,
        });

      if (error) {
        console.warn('[AudioStorageService] Audio upload notice:', error.message);
        return null;
      }

      console.log(
        '[AudioStorageService] ✅ Audio successfully uploaded to storage:',
        data?.path || filePath,
      );
      return data?.path || filePath;
    } catch (err) {
      console.warn('[AudioStorageService] Unexpected upload error:', err);
      return null;
    }
  }

  /**
   * Delete an array of audio paths from speaking_audios storage bucket
   */
  static async deleteAudioFiles(
    paths: string[],
  ): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    const validPaths = paths.filter((p) => typeof p === 'string' && p.trim().length > 0);
    if (validPaths.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    try {
      const { data, error } = await supabase.storage.from(this.BUCKET_NAME).remove(validPaths);

      if (error) {
        console.error('[AudioStorageService] Batch delete error:', error.message);
        return { success: false, deletedCount: 0, error: error.message };
      }

      const count = Array.isArray(data) ? data.length : validPaths.length;
      console.log(
        `[AudioStorageService] 🗑️ Successfully deleted ${count} audio files from storage.`,
      );
      return { success: true, deletedCount: count };
    } catch (err: any) {
      console.error('[AudioStorageService] Unexpected delete error:', err);
      return { success: false, deletedCount: 0, error: err.message };
    }
  }
}
