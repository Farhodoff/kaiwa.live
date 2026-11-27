import type { Session } from '@supabase/supabase-js';
import { safeLocalStorage } from './storage/safeLocalStorage';

/**
 * Standard Supabase JWTs are ~800-1500 bytes. Anything above 8 KB indicates
 * bloated user_metadata and risks HTTP 431 / 494 (REQUEST_HEADER_TOO_LARGE) on edge proxies.
 */
export const MAX_BEARER_TOKEN_BYTES = 8192;

const cleanedMetadataUsers = new Set<string>();

export function isOversizedJwt(token?: string | null): boolean {
  return typeof token === 'string' && token.length > MAX_BEARER_TOKEN_BYTES;
}

export function shouldRetryWithAnonKey(status: number): boolean {
  return status === 401 || status === 403 || status === 431 || status === 494;
}

/**
 * Picks a safe Authorization Bearer token for same-origin /api/* calls.
 * If a signed-in user's JWT has grown past MAX_BEARER_TOKEN_BYTES, skips it
 * and uses the compact public anon key so Vercel edge does not reject with HTTP 494.
 */
export function resolveSafeApiBearerToken(
  accessToken: string | null | undefined,
  anonKey: string,
): { token: string; isUserToken: boolean } {
  if (accessToken && accessToken !== anonKey && !isOversizedJwt(accessToken)) {
    return { token: accessToken, isUserToken: true };
  }
  return { token: anonKey, isUserToken: false };
}

function preserveLegacyMetadataLocally(userId: string, meta: Record<string, any>): void {
  if (Array.isArray(meta.learning_signals) && meta.learning_signals.length > 0) {
    const key = `study_planner_learning_signals_${userId}`;
    const existing = safeLocalStorage.getJSON<any[]>(key, []);
    const existingIds = new Set(existing.map((s) => s?.id).filter(Boolean));
    const missing = meta.learning_signals.filter((s) => s?.id && !existingIds.has(s.id));
    if (missing.length > 0) {
      safeLocalStorage.setJSON(key, [...missing, ...existing].slice(-300));
    }
  }

  if (
    meta.jlpt_mastery &&
    typeof meta.jlpt_mastery === 'object' &&
    !Array.isArray(meta.jlpt_mastery)
  ) {
    const existing = safeLocalStorage.getJSON<Record<string, any>>('jlpt_mastery_status_v1', {});
    safeLocalStorage.setJSON('jlpt_mastery_status_v1', { ...meta.jlpt_mastery, ...existing });
  }

  if (
    meta.lesson_progress &&
    typeof meta.lesson_progress === 'object' &&
    !Array.isArray(meta.lesson_progress)
  ) {
    for (const [lessonId, progress] of Object.entries(meta.lesson_progress)) {
      const storageKey = `study_planner_lesson_progress_${userId}_${lessonId}`;
      if (!safeLocalStorage.getItem(storageKey) && progress) {
        safeLocalStorage.setJSON(storageKey, progress);
      }
    }
  }
}

/**
 * Removes legacy heavy arrays/maps from Supabase auth user_metadata (which are
 * serialized into every JWT) and refreshes the session to shrink the access_token.
 */
export async function pruneBloatedAuthMetadata(
  session: Session | null | undefined,
  supabaseClient: any,
): Promise<boolean> {
  const userId = session?.user?.id;
  const meta = session?.user?.user_metadata as Record<string, any> | undefined;
  if (!userId || !meta || typeof supabaseClient?.auth?.updateUser !== 'function') {
    return false;
  }

  if (cleanedMetadataUsers.has(userId)) {
    return false;
  }

  const patch: Record<string, any> = {};
  if (meta.learning_signals !== undefined && meta.learning_signals !== null) {
    patch.learning_signals = null;
  }
  if (meta.lesson_progress !== undefined && meta.lesson_progress !== null) {
    patch.lesson_progress = null;
  }
  if (meta.jlpt_mastery !== undefined && meta.jlpt_mastery !== null) {
    patch.jlpt_mastery = null;
  }
  if (Array.isArray(meta.ielts_user_target?.rebalanceHistory)) {
    const { rebalanceHistory: _dropped, ...rest } = meta.ielts_user_target;
    patch.ielts_user_target = rest;
  }
  if (Array.isArray(meta.jlpt_user_target?.rebalanceHistory)) {
    const { rebalanceHistory: _dropped, ...rest } = meta.jlpt_user_target;
    patch.jlpt_user_target = rest;
  }

  if (Object.keys(patch).length === 0) {
    return false;
  }

  cleanedMetadataUsers.add(userId);
  try {
    preserveLegacyMetadataLocally(userId, meta);
    const { error } = await supabaseClient.auth.updateUser({ data: patch });
    if (error) {
      cleanedMetadataUsers.delete(userId);
      return false;
    }
    if (typeof supabaseClient.auth.refreshSession === 'function') {
      await supabaseClient.auth.refreshSession().catch(() => {});
    }
    return true;
  } catch {
    cleanedMetadataUsers.delete(userId);
    return false;
  }
}

export function resetCleanedMetadataCacheForTests(): void {
  cleanedMetadataUsers.clear();
}
