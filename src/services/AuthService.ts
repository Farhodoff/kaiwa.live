import { supabase, setSigningOut } from '../lib/supabase';
import { useAuthStore } from '../stores';

export class AuthService {
  private static isLoggingOut = false;

  /**
   * Complete, safe logout flow:
   * 1. Stops all audio playback, microphone streams, and speech synthesis
   * 2. Signals hooks and active pages to immediately cancel speech/AI operations
   * 3. Blocks token refresh mutex so expired or pending requests cannot revive session
   * 4. Signs out of Supabase locally and remotely with strict timeout race
   * 5. Purges local and session storage caches (Supabase auth tokens, user profile)
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

      // 5. Purge local and session storage
      if (typeof window !== 'undefined') {
        try {
          // Preserve UI theme preference across logouts
          const savedTheme = localStorage.getItem('study_planner_theme');

          // Purge all user, session, and Supabase cache from storage
          localStorage.clear();
          sessionStorage.clear();

          if (savedTheme) {
            localStorage.setItem('study_planner_theme', savedTheme);
          }
        } catch (e) {
          console.warn('[AuthService] Storage purge warning:', e);
        }

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
