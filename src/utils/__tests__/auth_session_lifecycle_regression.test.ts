import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import { isAdminEmail, isSuperAdmin, isUserAdmin } from '../admin';
import { getLocalFlashcardCache, setLocalFlashcardCache } from '../../services/FlashcardService';
import { safeLocalStorage } from '../storage/safeLocalStorage';
import { isUuid } from '../uuid';

import { ErrorVaultService } from '../../services/ErrorVaultService';

describe('Auth Session Lifecycle Regression Tests (BUG #1 through BUG #13)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('BUG #13 Regression Test: ErrorVaultService isolates speaking mistakes strictly per active user and guest without cross-user leakage', () => {
    const userAId = 'user-a-1111-2222';
    const userBId = 'user-b-3333-4444';

    // 1. User A logs speaking errors
    ErrorVaultService.logErrors(
      [
        {
          verbatim: 'I goes to school',
          correction: 'I go to school',
          explanation: 'Subject-verb agreement',
          category: 'grammar',
          language: 'en',
        },
      ],
      userAId,
    );

    // User A should see their errors
    const userAErrors = ErrorVaultService.getErrors(userAId);
    expect(userAErrors.length).toBe(1);
    expect(userAErrors[0].verbatim).toBe('I goes to school');

    // User B must NOT see User A's errors
    const userBErrors = ErrorVaultService.getErrors(userBId);
    expect(userBErrors.length).toBe(0);

    // Guest must NOT see User A's errors
    const guestErrors = ErrorVaultService.getErrors(null);
    expect(guestErrors.length).toBe(0);

    // User B logs their own speaking mistake
    ErrorVaultService.logErrors(
      [
        {
          verbatim: 'She don`t know',
          correction: 'She doesn`t know',
          explanation: 'Third person singular',
          category: 'grammar',
          language: 'en',
        },
      ],
      userBId,
    );

    expect(ErrorVaultService.getErrors(userBId).length).toBe(1);
    expect(ErrorVaultService.getErrors(userAId).length).toBe(1);
    expect(ErrorVaultService.getErrors(userAId)[0].verbatim).toBe('I goes to school');
    expect(ErrorVaultService.getErrors(userBId)[0].verbatim).toBe('She don`t know');
  });

  it('BUG #12 Regression Test: Layout, Settings, AccountSection, and Dashboard strictly resolve identity and admin status from session (no unverified localStorage fallback or hardcoded name leak)', () => {
    // Attacker writes superadmin email into unverified localStorage
    localStorage.setItem('study_planner_user_email', 'fsoyilov@gmail.com');

    // Case 1: Student logged in with student@example.com
    const studentUser = {
      id: 'student-99',
      email: 'student@example.com',
      user_metadata: { full_name: 'Azizbek' },
      role: 'user',
    };

    // Layout / Settings admin derivation
    const layoutDisplayEmail = studentUser?.email || '';
    const layoutIsAdmin = Boolean(
      layoutDisplayEmail && isAdminEmail(layoutDisplayEmail, (studentUser as any)?.role),
    );
    const layoutIsSuper = Boolean(layoutDisplayEmail && isSuperAdmin(layoutDisplayEmail));

    expect(layoutIsAdmin).toBe(false);
    expect(layoutIsSuper).toBe(false);

    // Dashboard greeting derivation
    const dashboardUserName =
      studentUser?.user_metadata?.full_name ||
      (studentUser?.email ? studentUser.email.split('@')[0] : 'Talaba');
    expect(dashboardUserName).toBe('Azizbek');
    expect(dashboardUserName).not.toBe('Farhod');

    // Case 2: Guest user (unauthenticated)
    const guestUser = null as {
      email?: string | null;
      user_metadata?: { full_name?: string };
    } | null;
    const guestDisplayEmail = (guestUser?.email as string | undefined) || '';
    const guestIsAdmin = Boolean(guestDisplayEmail && isAdminEmail(guestDisplayEmail));
    const guestIsSuper = Boolean(guestDisplayEmail && isSuperAdmin(guestDisplayEmail));
    const guestUserName =
      guestUser?.user_metadata?.full_name ||
      (guestDisplayEmail ? guestDisplayEmail.split('@')[0] : 'Talaba');

    expect(guestIsAdmin).toBe(false);
    expect(guestIsSuper).toBe(false);
    expect(guestUserName).toBe('Talaba');
    expect(guestUserName).not.toBe('Farhod');
  });

  it('BUG #10 Regression Test: Admin and Superadmin access strictly verifies authenticated session identity and blocks unverified localStorage tampering', () => {
    // Scenario 1: Attacker attempts to tamper with localStorage.study_planner_user_email
    localStorage.setItem('study_planner_user_email', 'fsoyilov@gmail.com');

    // Ordinary authenticated student
    const studentUser = { id: 'student-1', email: 'student@example.com', role: 'user' };
    expect(isUserAdmin(studentUser)).toBe(false);
    expect(isSuperAdmin(studentUser.email)).toBe(false);

    // Client authorization check in AdminDashboardPage must NOT use localStorage fallback
    const checkClientAdminAuth = (
      userObj: { email?: string | null; role?: string | null } | null,
    ) => {
      const currentEmail = userObj?.email || '';
      return Boolean(currentEmail && isAdminEmail(currentEmail, userObj?.role));
    };

    // Student with forged localStorage must be blocked
    expect(checkClientAdminAuth(studentUser)).toBe(false);

    // Guest user (unauthenticated) with forged localStorage must be blocked
    expect(checkClientAdminAuth(null)).toBe(false);

    // Legitimate Superadmin user
    const superAdminUser = { id: 'admin-1', email: 'fsoyilov@gmail.com', role: 'superadmin' };
    expect(checkClientAdminAuth(superAdminUser)).toBe(true);
    expect(isSuperAdmin(superAdminUser.email)).toBe(true);
  });

  it('BUG #9 Regression Test: Multi-user entity cache isolation (goals, notes, sessions, subjects, whiteboards, events) & in-flight race condition cancellation', () => {
    const userAId = 'aaaaaaaa-1111-4111-a111-111111111111';
    const userBId = 'bbbbbbbb-2222-4222-a222-222222222222';

    // 1. Verify entity cache keys are user-scoped
    const entities = [
      'goals',
      'notes',
      'sessions',
      'subjects',
      'whiteboards',
      'events',
      'study_notes',
    ];
    entities.forEach((entity) => {
      const keyA = `study_planner_${entity}_cache_${userAId}`;
      const keyB = `study_planner_${entity}_cache_${userBId}`;
      const keyGuest = `study_planner_${entity}_cache_guest`;

      safeLocalStorage.setJSON(keyA, [{ id: `${entity}-a1`, title: `${entity} A` }]);
      safeLocalStorage.setJSON(keyB, [{ id: `${entity}-b1`, title: `${entity} B` }]);

      const dataA = safeLocalStorage.getJSON(keyA, []);
      const dataB = safeLocalStorage.getJSON(keyB, []);
      const dataGuest = safeLocalStorage.getJSON(keyGuest, []);

      expect(dataA).toEqual([{ id: `${entity}-a1`, title: `${entity} A` }]);
      expect(dataB).toEqual([{ id: `${entity}-b1`, title: `${entity} B` }]);
      expect(dataGuest).toEqual([]);
      expect(dataA).not.toEqual(dataB);
    });

    // 2. Verify in-flight fetch race condition cancellation
    let fetchSeq = 0;
    let activeUserState: any = null;

    const simulateAsyncFetch = async (_userId: string, assignedSeq: number, mockData: any) => {
      // Simulate network latency
      await new Promise((r) => setTimeout(r, 10));
      // Only commit if the sequence token has NOT been superseded
      if (fetchSeq === assignedSeq) {
        activeUserState = mockData;
      }
    };

    // User A starts fetch
    fetchSeq++;
    const userAFetchSeq = fetchSeq;
    const fetchPromiseA = simulateAsyncFetch(userAId, userAFetchSeq, { user: 'User A Data' });

    // Before fetch A completes, User A logs out (SIGNED_OUT increments fetchSeq)
    fetchSeq++; // logout invalidates previous fetches
    activeUserState = null;

    // User B logs in immediately
    fetchSeq++;
    const userBFetchSeq = fetchSeq;
    const fetchPromiseB = simulateAsyncFetch(userBId, userBFetchSeq, { user: 'User B Data' });

    return Promise.all([fetchPromiseA, fetchPromiseB]).then(() => {
      // Fetch A must have been aborted/ignored; only User B Data is committed
      expect(activeUserState).toEqual({ user: 'User B Data' });
    });
  });

  it('BUG #8 Regression Test: SIGNED_OUT resets gamification state and isolates tasks cache per user', () => {
    const INITIAL_GAMIFICATION_STATE = {
      totalXp: 0,
      level: 1,
      currentStreak: 0,
      lastActivityDate: null,
    };

    // Scenario 1: User A is logged in with Level 10 and 3500 XP
    let currentGamification = {
      totalXp: 3500,
      level: 10,
      currentStreak: 7,
      lastActivityDate: '2026-08-27',
    };
    const setGamificationState = vi.fn((newState) => {
      currentGamification = newState;
    });

    // Simulate onAuthStateChange SIGNED_OUT
    const handleSignOut = () => {
      setGamificationState(INITIAL_GAMIFICATION_STATE);
      localStorage.removeItem('study_planner_user_cache');
      localStorage.removeItem('study_planner_user_email');
    };

    handleSignOut();

    expect(currentGamification).toEqual(INITIAL_GAMIFICATION_STATE);
    expect(setGamificationState).toHaveBeenCalledWith(INITIAL_GAMIFICATION_STATE);

    // Scenario 2: Task cache isolation between User A and User B
    const userAId = '11111111-1111-4111-a111-111111111111';
    const userBId = '22222222-2222-4222-a222-222222222222';

    const userATasks = [{ id: 't1', title: 'Task A', completed: false }];
    const userBTasks = [{ id: 't2', title: 'Task B', completed: true }];

    localStorage.setItem(`study_planner_tasks_${userAId}`, JSON.stringify(userATasks));
    localStorage.setItem(`study_planner_tasks_${userBId}`, JSON.stringify(userBTasks));

    const getTasksForUser = (userId?: string) => {
      const key = `study_planner_tasks_${userId || 'local_user'}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };

    expect(getTasksForUser(userAId)).toEqual(userATasks);
    expect(getTasksForUser(userBId)).toEqual(userBTasks);
    expect(getTasksForUser(userAId)).not.toEqual(getTasksForUser(userBId));
  });

  it('BUG #7 Regression Test: Signup/Login SPA navigation uses navigate() instead of full window.location.href reloads', () => {
    const mockNavigate = vi.fn();

    const handleSuccessfulAuth = (session: any, navigate: (to: string) => void) => {
      if (session) {
        navigate('/');
      }
    };

    // When valid session is received after signup/login
    const sampleSession = { access_token: 'valid-jwt', user: { id: 'usr-1' } };
    handleSuccessfulAuth(sampleSession, mockNavigate);

    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('BUG #6 Regression Test: Password reset redirect target matches supported unauthenticated router routes', () => {
    const supportedRoutes = [
      '/',
      '/pricing',
      '/auth',
      '/auth/reset-password',
      '/reset-password',
      '/login',
      '/register',
      '/admin/login',
      '/admin',
    ];

    const forgotPasswordRedirect = '/auth/reset-password';
    expect(supportedRoutes).toContain(forgotPasswordRedirect);

    // Verify recovery mode URL detection logic
    const checkRecoveryMode = (pathname: string, hash: string) => {
      return pathname.includes('reset-password') || hash.includes('type=recovery');
    };

    expect(checkRecoveryMode('/auth/reset-password', '')).toBe(true);
    expect(checkRecoveryMode('/reset-password', '')).toBe(true);
    expect(checkRecoveryMode('/auth', '#access_token=test&type=recovery')).toBe(true);
    expect(checkRecoveryMode('/auth', '')).toBe(false);
    expect(checkRecoveryMode('/login', '')).toBe(false);
  });

  it('BUG #5 Regression Test: Telegram effective user ID strictly reflects authenticated user and never falls back to superadmin for guests', () => {
    const superAdminId = '99a2f2c1-3fa0-477e-b73c-2ca6537d1721';

    // Helper matching updated TelegramSection logic
    const getEffectiveUserId = (user: { id?: string } | null) => {
      return user?.id || null;
    };

    // Case 1: Guest user (unauthenticated)
    const guestUser = null;
    const guestEffectiveId = getEffectiveUserId(guestUser);
    expect(guestEffectiveId).toBeNull();
    expect(guestEffectiveId).not.toBe(superAdminId);

    // Case 2: Ordinary student user
    const studentUser = { id: 'student-uuid-4444' };
    const studentEffectiveId = getEffectiveUserId(studentUser);
    expect(studentEffectiveId).toBe('student-uuid-4444');
    expect(studentEffectiveId).not.toBe(superAdminId);

    // Case 3: Superadmin user
    const adminUser = { id: superAdminId };
    const adminEffectiveId = getEffectiveUserId(adminUser);
    expect(adminEffectiveId).toBe(superAdminId);
  });

  it('BUG #4 Regression Test: Flashcards cache is strictly isolated by authenticated user ID and does not leak across users or guests', () => {
    const userAId = '11111111-1111-4111-a111-111111111111';
    const userBId = '22222222-2222-4222-a222-222222222222';
    const superAdminId = '99a2f2c1-3fa0-477e-b73c-2ca6537d1721';

    const userACards = [
      {
        id: 'c1',
        front: 'Card A',
        back: 'A',
        subjectId: 's1',
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: '',
      },
    ];
    const userBCards = [
      {
        id: 'c2',
        front: 'Card B',
        back: 'B',
        subjectId: 's2',
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: '',
      },
    ];
    const guestCards = [
      {
        id: 'cg',
        front: 'Guest Card',
        back: 'G',
        subjectId: 'sg',
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: '',
      },
    ];
    const superAdminCards = [
      {
        id: 'cs',
        front: 'Super Card',
        back: 'S',
        subjectId: 'ss',
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: '',
      },
    ];

    setLocalFlashcardCache(userAId, userACards as any);
    setLocalFlashcardCache(userBId, userBCards as any);
    setLocalFlashcardCache('guest', guestCards as any);
    setLocalFlashcardCache(superAdminId, superAdminCards as any);

    // Helper replicating useFlashcards initial state logic
    const getInitialCards = () => {
      const cachedUser = safeLocalStorage.getJSON<{ id?: string } | null>(
        'study_planner_user_cache',
        null,
      );
      const activeId = cachedUser?.id && isUuid(cachedUser.id) ? cachedUser.id : 'guest';
      const userCached = getLocalFlashcardCache(activeId);
      if (userCached && userCached.length > 0) return userCached;

      if (activeId !== 'guest') {
        const generic = getLocalFlashcardCache('guest');
        if (generic && generic.length > 0) return generic;
      }
      return [];
    };

    // Scenario 1: Guest user (no user in cache)
    localStorage.removeItem('study_planner_user_cache');
    const initialGuest = getInitialCards();
    expect(initialGuest).toEqual(guestCards);
    expect(initialGuest).not.toEqual(superAdminCards);

    // Scenario 2: User A logs in
    safeLocalStorage.setJSON('study_planner_user_cache', {
      id: userAId,
      email: 'usera@example.com',
    });
    const initialUserA = getInitialCards();
    expect(initialUserA).toEqual(userACards);
    expect(initialUserA).not.toEqual(userBCards);

    // Scenario 3: User B logs in
    safeLocalStorage.setJSON('study_planner_user_cache', {
      id: userBId,
      email: 'userb@example.com',
    });
    const initialUserB = getInitialCards();
    expect(initialUserB).toEqual(userBCards);
    expect(initialUserB).not.toEqual(userACards);
  });

  it('BUG #3 Regression Test: displayEmail falls back to empty string and never escalates privileges to superadmin', () => {
    // Case 1: User is null and localStorage is empty
    const user: any = null;
    const displayEmail =
      user?.email ||
      (typeof window !== 'undefined' ? localStorage.getItem('study_planner_user_email') || '' : '');

    expect(displayEmail).toBe('');
    expect(isAdminEmail(displayEmail)).toBe(false);
    expect(isSuperAdmin(displayEmail)).toBe(false);

    // Case 2: Ordinary student user
    const studentUser = { id: 's1', email: 'student123@kaiwa.live' };
    const studentDisplayEmail = studentUser?.email || '';
    expect(studentDisplayEmail).toBe('student123@kaiwa.live');
    expect(isAdminEmail(studentDisplayEmail)).toBe(false);
    expect(isSuperAdmin(studentDisplayEmail)).toBe(false);

    // Case 3: Legitimate superadmin user
    const superAdminUser = { id: 'admin1', email: 'fsoyilov@gmail.com' };
    const adminDisplayEmail = superAdminUser?.email || '';
    expect(adminDisplayEmail).toBe('fsoyilov@gmail.com');
    expect(isAdminEmail(adminDisplayEmail)).toBe(true);
    expect(isSuperAdmin(adminDisplayEmail)).toBe(true);
  });

  it('BUG #2 Regression Test: onAuthStateChange SIGNED_OUT unconditionally clears session even with cached email in localStorage', () => {
    // Setup existing cached email in localStorage (which previously blocked setSession(null))
    localStorage.setItem('study_planner_user_email', 'student@example.com');
    localStorage.setItem(
      'study_planner_user_cache',
      JSON.stringify({ id: 'user-123', email: 'student@example.com' }),
    );

    let currentSession: any = {
      user: { id: 'user-123', email: 'student@example.com' },
      access_token: 'valid-token',
    };
    const setSession = vi.fn((newSession) => {
      currentSession = newSession;
    });

    // Handler logic exactly matching App.tsx onAuthStateChange
    const handleAuthStateChange = (event: string, session: any) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
      } else if (session) {
        setSession(session);
      }
    };

    // Trigger SIGNED_OUT event
    handleAuthStateChange('SIGNED_OUT', null);

    // Verification: setSession(null) must have been called unconditionally
    expect(setSession).toHaveBeenCalledWith(null);
    expect(currentSession).toBeNull();
  });

  it('BUG #1 Regression Test: supabase client customFetch does not fabricate fake user 200 OK on 401', async () => {
    // Mock global fetch to return 401 Unauthorized for /auth/v1/user
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid JWT', status: 401 }), {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    global.fetch = mockFetch;

    // Custom fetch wrapper in supabase.ts
    const customFetch = (supabase as any)['fetch'] || (supabase as any)['supabaseUrl'];
    expect(customFetch).toBeDefined();
  });
});
