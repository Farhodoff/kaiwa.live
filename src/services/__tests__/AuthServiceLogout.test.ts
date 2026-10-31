import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../AuthService';
import { supabase, setSigningOut, getIsSigningOut } from '../../lib/supabase';
import { useAuthStore } from '../../stores';
import { OfflineSyncManager } from '../OfflineSyncManager';
import { FlashcardOfflineSync } from '../FlashcardOfflineSync';

describe('AuthService Robust Logout Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setSigningOut(false);
    vi.clearAllMocks();

    // Mock initial authenticated user
    useAuthStore.getState().setUser({
      id: 'test-user-uuid',
      email: 'user@kaiwa.live',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any);

    localStorage.setItem('study_planner_user_cache', JSON.stringify({ id: 'test-user-uuid' }));
    localStorage.setItem('sb-test-auth-token', 'mock-jwt-token');
    localStorage.setItem('supabase.auth.token', 'mock-legacy-token');
    localStorage.setItem('study_planner_user_email', 'user@kaiwa.live');
    sessionStorage.setItem('active_session_temp', 'temp-data');
  });

  it('1. Signs out of Supabase, clears storage, and resets Zustand auth store', async () => {
    const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null } as any);

    // Mock window.location
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '', replace: vi.fn() } as any;

    expect(useAuthStore.getState().user).not.toBeNull();
    expect(localStorage.getItem('study_planner_user_cache')).toBeTruthy();

    await AuthService.signOut('/login');

    expect(signOutSpy).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem('study_planner_user_cache')).toBeNull();
    expect(localStorage.getItem('sb-test-auth-token')).toBeNull();
    expect(localStorage.getItem('supabase.auth.token')).toBeNull();
    expect(sessionStorage.getItem('active_session_temp')).toBeNull();
    expect(window.location.href).toBe('/login');

    (window as any).location = originalLocation;
  });

  it('2. Dispatches app:cancel-all-speech and cancels SpeechSynthesis upon logout', async () => {
    vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null } as any);

    const speechCancelSpy = vi.fn();
    (window as any).speechSynthesis = {
      cancel: speechCancelSpy,
      speaking: false,
      pending: false,
    };

    let eventFired = false;
    const eventHandler = () => {
      eventFired = true;
    };
    window.addEventListener('app:cancel-all-speech', eventHandler);

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '' } as any;

    await AuthService.signOut('/login');

    expect(speechCancelSpy).toHaveBeenCalled();
    expect(eventFired).toBe(true);

    window.removeEventListener('app:cancel-all-speech', eventHandler);
    (window as any).location = originalLocation;
  });

  it('3. Sets isSigningOut flag to prevent token refresh or offline sync resurrection', async () => {
    setSigningOut(true);
    expect(getIsSigningOut()).toBe(true);

    // When isSigningOut is true, syncAllPending immediately returns without making network queries
    const res = await OfflineSyncManager.syncAllPending(true);
    expect(res.totalSynced).toBe(0);

    const cardRes = await FlashcardOfflineSync.syncPending(true);
    expect(cardRes.synced).toBe(0);

    setSigningOut(false);
    expect(getIsSigningOut()).toBe(false);
  });

  it('4. Completes logout even if Supabase network call hangs or fails', async () => {
    // Simulate Supabase hanging network request
    vi.spyOn(supabase.auth, 'signOut').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null } as any), 5000)),
    );

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '' } as any;

    const start = Date.now();
    await AuthService.signOut('/login');
    const elapsed = Date.now() - start;

    // Timeout race must resolve within ~2 seconds instead of hanging for 5 seconds
    expect(elapsed).toBeLessThan(2500);
    expect(useAuthStore.getState().user).toBeNull();
    expect(window.location.href).toBe('/login');

    (window as any).location = originalLocation;
  });
});
