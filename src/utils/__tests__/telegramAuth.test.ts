import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  isTelegramWebApp,
  getTelegramWebAppUser,
  createTelegramUser,
  createTelegramSession,
  initTelegramAuth,
  TELEGRAM_SUPERADMIN_ID,
} from '../telegramAuth';
import { safeLocalStorage } from '../storage/safeLocalStorage';

describe('telegramAuth utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).Telegram;
    localStorage.clear();
  });

  it('1. detects when NOT running inside Telegram WebApp', () => {
    expect(isTelegramWebApp()).toBe(false);
    expect(getTelegramWebAppUser()).toBeNull();
    expect(initTelegramAuth()).toBeNull();
  });

  it('2. detects Telegram WebApp from window.Telegram.WebApp.initData', () => {
    (window as any).Telegram = {
      WebApp: {
        initData: 'query_id=AA&user=%7B%22id%22%3A123456%2C%22first_name%22%3A%22Ali%22%7D',
        ready: vi.fn(),
        expand: vi.fn(),
      },
    };

    expect(isTelegramWebApp()).toBe(true);
    const user = getTelegramWebAppUser();
    expect(user).toBeDefined();
    expect(user?.id).toBe(123456);
    expect(user?.first_name).toBe('Ali');
  });

  it('3. identifies Superadmin (6756073816) and assigns superadmin role and fsoyilov@gmail.com', () => {
    const tgAdmin = {
      id: TELEGRAM_SUPERADMIN_ID,
      first_name: 'Farhod',
      last_name: 'Soyilov',
      username: 'Soyilov_Farhod',
    };

    const user = createTelegramUser(tgAdmin);
    expect(user.email).toBe('fsoyilov@gmail.com');
    expect(user.app_metadata.role).toBe('superadmin');
    expect(user.user_metadata.role).toBe('superadmin');
    expect(user.user_metadata.full_name).toBe('Farhod Soyilov');
    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('4. creates regular student user with deterministic UUID and tg_ email', () => {
    const tgStudent = {
      id: 99887766,
      first_name: 'Temur',
      last_name: 'Malik',
    };

    const user1 = createTelegramUser(tgStudent);
    const user2 = createTelegramUser(tgStudent);

    // Deterministic UUID
    expect(user1.id).toBe(user2.id);
    expect(user1.email).toBe('tg_99887766@kaiwa.live');
    expect(user1.app_metadata.role).toBe('student');
    expect(user1.user_metadata.role).toBe('student');
    expect(user1.user_metadata.full_name).toBe('Temur Malik');

    const session = createTelegramSession(user1);
    expect(session.user.id).toBe(user1.id);
    expect(session.access_token).toContain('tg-jwt-');
  });

  it('5. initTelegramAuth initializes WebApp and stores user in cache', () => {
    const readyMock = vi.fn();
    const expandMock = vi.fn();

    (window as any).Telegram = {
      WebApp: {
        initDataUnsafe: {
          user: {
            id: 887766,
            first_name: 'Shahzod',
          },
        },
        ready: readyMock,
        expand: expandMock,
        setHeaderColor: vi.fn(),
        setBackgroundColor: vi.fn(),
      },
    };

    const authResult = initTelegramAuth();
    expect(authResult).not.toBeNull();
    expect(authResult?.user.user_metadata.first_name).toBe('Shahzod');
    expect(readyMock).toHaveBeenCalled();
    expect(expandMock).toHaveBeenCalled();

    const cached = safeLocalStorage.getJSON<any>('study_planner_user_cache', null);
    expect(cached?.id).toBe(authResult?.user.id);
  });
});
