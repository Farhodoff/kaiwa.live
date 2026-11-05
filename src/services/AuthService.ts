import { supabase, setSigningOut } from '../lib/supabase';
import { useAuthStore } from '../stores';

/**
 * Checks whether a given storage key holds auth credentials or session identity
 * that MUST be purged on logout to prevent session leaks and zombie logins.
 *
 * All offline content (sync queues, flashcards, notes, tasks, user settings, BYOK keys)
 * is intentionally preserved across logouts.
 */
export const isAuthStorageKey = (key: string): boolean => {
  // Supabase JWT and session tokens
  if (
    key.includes('auth-token') ||
    key.includes('supabase.auth.token') ||
    key.startsWith('sb-') ||
    key === 'supabase.auth.token'
  ) {
    return true;
  }

  // Active user identity & role cache
  const authIdentityKeys = [
    'study_planner_user_cache',
    'study_planner_user_email',
    'study_planner_user_name',
    'study_planner_admin_api_key',
    'role',
    'admin_role',
  ];

  return authIdentityKeys.includes(key);
};

/**
 * Selectively purges authentication tokens and session identity from localStorage.
 * Unlike localStorage.clear(), this preserves unsynced offline queues, local flashcards,
 * notes, user settings, and BYOK AI keys so that offline work is not lost on logout.
 */
export const purgeAuthSessionStorage = (): void => {
  if (typeof window === 'undefined') return;

  try {
    const allKeys: string[] = [];

    // 1. Standard Web Storage key iteration
    if (window.localStorage && typeof window.localStorage.length === 'number') {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && !allKeys.includes(k)) {
          allKeys.push(k);
        }
      }
    }

    // 2. Fallback key collection via Object.keys where supported
    try {
      Object.keys(localStorage).forEach((k) => {
        if (!allKeys.includes(k) && typeof localStorage.getItem(k) === 'string') {
          allKeys.push(k);
        }
      });
    } catch {}

    // 3. Explicit check for well-known auth keys to guarantee deterministic purge
    const wellKnownAuthKeys = [
      'study_planner_user_cache',
      'study_planner_user_email',
      'study_planner_user_name',
      'study_planner_admin_api_key',
      'supabase.auth.token',
      'role',
      'admin_role',
    ];
    wellKnownAuthKeys.forEach((k) => {
      if (!allKeys.includes(k)) {
        allKeys.push(k);
      }
    });

    allKeys.forEach((key) => {
      if (isAuthStorageKey(key)) {
        try {
          localStorage.removeItem(key);
        } catch {}
      }
    });

    // Clear temporary in-memory session data
    sessionStorage.clear();
  } catch (e) {
    console.warn('[AuthService] Storage purge warning:', e);
  }
};

export class AuthService {
  private static isLoggingOut = false;

  /**
   * Complete, safe logout flow:
   * 1. Stops all audio playback, microphone streams, and speech synthesis
   * 2. Signals hooks and active pages to immediately cancel speech/AI operations
   * 3. Blocks token refresh mutex so expired or pending requests cannot revive session
   * 4. Signs out of Supabase locally and remotely with strict timeout race
   * 5. Selectively purges auth tokens and session caches while preserving offline queues/data
   * 6. Clears auth store state
   * 7. Navigates cleanly to /login
   */
  static async signOut(redirectTo = '/login'): Promise<void> {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;

    try {
      // 1. Immediately signal all active speech, mic, and AI orchestrators to halt
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('app:cancel-all-speech'));
        } catch {}

        if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis) {
          try {
            window.speechSynthesis.cancel?.();
          } catch {}
        }

        // Pause any HTMLAudioElements
        try {
          const audioElements = document.querySelectorAll('audio');
          audioElements.forEach((audio) => {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch {}
          });
        } catch {}
      }

      // 2. Prevent token refresh from reviving the session or issuing requests
      setSigningOut(true);

      // 3. Clear memory store immediately so React components reflect logged-out state
      try {
        useAuthStore.getState().setUser(null);
        useAuthStore.getState().setLoading(false);
      } catch {}

      // 4. Perform Supabase signOut with race timeout (max 1.5s)
      try {
        await Promise.race([
          supabase.auth.signOut({ scope: 'local' }),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      } catch (err) {
        console.warn('[AuthService] Supabase signOut warning:', err);
      }

      // 5. Selectively purge auth credentials while preserving offline queues & data
      if (typeof window !== 'undefined') {
        purgeAuthSessionStorage();

        // 6. Redirect to login page
        window.location.href = redirectTo;
      }
    } finally {
      this.isLoggingOut = false;
      setSigningOut(false);
    }
  }
}

export default AuthService;
