import type { User, Session } from '@supabase/supabase-js';
import type { TelegramWebAppUser } from '../types/telegram-webapp';
import { toDeterministicUUID } from './uuid';
import { safeLocalStorage } from './storage/safeLocalStorage';

const envAdminIds = (import.meta.env.VITE_TELEGRAM_ADMIN_IDS || '')
  .split(',')
  .map((s: string) => Number(s.trim()))
  .filter((n: number) => !isNaN(n) && n > 0);

export const TELEGRAM_SUPERADMIN_ID = envAdminIds[0] || 6756073816;
export const TELEGRAM_SUPERADMIN_IDS =
  envAdminIds.length > 0 ? envAdminIds : [6756073816, 6839776532];

/**
 * Checks whether the current runtime environment is inside Telegram WebApp (Mini App).
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;

  const tg = window.Telegram?.WebApp;
  if (!tg) {
    return (
      window.location.search.includes('twa=true') || window.location.search.includes('tgWebAppData')
    );
  }

  return Boolean(
    tg.initData ||
    tg.initDataUnsafe?.user ||
    window.location.search.includes('twa=true') ||
    window.location.search.includes('tgWebAppData'),
  );
}

/**
 * Extracts the Telegram user from WebApp initData or URL mock.
 */
export function getTelegramWebAppUser(): TelegramWebAppUser | null {
  if (typeof window === 'undefined') return null;

  const tg = window.Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user && tg.initDataUnsafe.user.id) {
    return tg.initDataUnsafe.user;
  }

  if (tg?.initData) {
    try {
      const params = new URLSearchParams(tg.initData);
      const userJson = params.get('user');
      if (userJson) {
        const parsed = JSON.parse(userJson);
        if (parsed && parsed.id) return parsed;
      }
    } catch {}
  }

  // Development / test fallback from query string
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const mockUserJson = searchParams.get('mock_tg_user');
    if (mockUserJson) {
      const parsed = JSON.parse(decodeURIComponent(mockUserJson));
      if (parsed && parsed.id) return parsed;
    }
  } catch {}

  return null;
}

/**
 * Builds a deterministic Supabase-compatible User object from Telegram WebApp user profile.
 */
export function createTelegramUser(tgUser: TelegramWebAppUser): User {
  const isSuper =
    TELEGRAM_SUPERADMIN_IDS.includes(tgUser.id) ||
    tgUser.username?.toLowerCase() === 'soyilov_farhod';

  const fullName =
    [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim() ||
    tgUser.username ||
    "O'quvchi";

  const email = isSuper ? 'fsoyilov@gmail.com' : `tg_${tgUser.id}@kaiwa.live`;
  const userId = toDeterministicUUID(`tg-user-${tgUser.id}`);
  const role = isSuper ? 'superadmin' : 'student';

  return {
    id: userId,
    app_metadata: {
      provider: 'telegram',
      providers: ['telegram'],
      role,
    },
    user_metadata: {
      full_name: fullName,
      first_name: tgUser.first_name || '',
      last_name: tgUser.last_name || '',
      username: tgUser.username || '',
      telegram_id: tgUser.id,
      avatar_url: tgUser.photo_url || '',
      role,
    },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    recovery_sent_at: null,
    email_change_sent_at: null,
    new_email: null,
    invited_at: null,
    action_link: null,
    email,
    phone: null,
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: null,
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
    identities: [],
    factors: null,
  } as unknown as User;
}

/**
 * Builds a Supabase Session object from a Telegram User.
 */
export function createTelegramSession(user: User): Session {
  return {
    access_token: `tg-jwt-${user.id}`,
    token_type: 'bearer',
    expires_in: 31536000, // 1 year
    expires_at: Math.floor(Date.now() / 1000) + 31536000,
    refresh_token: `tg-refresh-${user.id}`,
    user,
  };
}

/**
 * Automatically initializes Telegram WebApp, styles, cache, and returns session for seamless auto-login.
 */
export function initTelegramAuth(): { user: User; session: Session } | null {
  if (typeof window === 'undefined') return null;

  if (!isTelegramWebApp()) {
    return null;
  }

  const tg = window.Telegram?.WebApp;

  // Initialize WebApp UI options
  try {
    tg?.ready?.();
    tg?.expand?.();
    tg?.enableClosingConfirmation?.();

    if (tg?.setHeaderColor) {
      tg.setHeaderColor('#0F1419');
    }
    if (tg?.setBackgroundColor) {
      tg.setBackgroundColor('#0F1419');
    }
  } catch (err) {
    console.debug('[TelegramAuth] WebApp UI config warning:', err);
  }

  const tgUser = getTelegramWebAppUser();

  if (tgUser) {
    const user = createTelegramUser(tgUser);
    const session = createTelegramSession(user);

    // Persist into user cache
    safeLocalStorage.setJSON('study_planner_user_cache', user);
    if (user.email) {
      safeLocalStorage.setItem('study_planner_user_email', user.email);
    }

    // Background sync to backend database (upsert to telegram_users table)
    if (typeof window !== 'undefined' && window.location?.origin && typeof fetch !== 'undefined') {
      try {
        const syncUrl = `${window.location.origin}/api/telegram/auth-twa`;
        fetch(syncUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: tg?.initData || '',
            mockUser: tgUser,
            userId: user.id,
          }),
        }).catch((e) => {
          console.debug('[TelegramAuth] Backend sync notice:', e);
        });
      } catch {}
    }

    return { user, session };
  }

  // If inside Telegram WebApp without explicit user object, check existing cache
  const cachedUser = safeLocalStorage.getJSON<User | null>('study_planner_user_cache', null);
  if (cachedUser && cachedUser.id) {
    const session = createTelegramSession(cachedUser);
    return { user: cachedUser, session };
  }

  return null;
}
