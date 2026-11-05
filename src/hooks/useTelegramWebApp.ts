import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TelegramWebApp, TelegramWebAppUser } from '../types/telegram-webapp';

export interface UseTelegramWebAppReturn {
  isTwa: boolean;
  webApp: TelegramWebApp | null;
  user: TelegramWebAppUser | null;
  initData: string;
  colorScheme: 'dark' | 'light';
  themeParams: Record<string, string | undefined>;
  haptics: {
    impact: (style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notification: (type: 'error' | 'success' | 'warning') => void;
    selection: () => void;
  };
  closeApp: () => void;
  openTelegramLink: (url: string) => void;
  openLink: (url: string) => void;
}

export function useTelegramWebApp(): UseTelegramWebAppReturn {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isTwa, setIsTwa] = useState(false);
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

    // Only consider it a real Telegram WebApp if there is actual initData,
    // a Telegram URL parameter (e.g. ?twa=true or #tgWebAppData), or TelegramWebviewProxy.
    // In standard desktop browsers, window.Telegram.WebApp exists from telegram-web-app.js
    // but initData is empty and the user is NOT inside Telegram.
    const hasInitData = Boolean(tg?.initData && tg.initData.trim().length > 0);
    const hasTwaParam =
      typeof window !== 'undefined' &&
      (window.location.search.includes('twa=true') ||
        window.location.hash.includes('tgWebAppData'));
    const hasProxy = typeof window !== 'undefined' && Boolean((window as any).TelegramWebviewProxy);
    const isRealTwa = Boolean(tg && (hasInitData || hasTwaParam || hasProxy));

    if (isRealTwa && tg) {
      setWebApp(tg);
      setIsTwa(true);

      // Tell Telegram the web app is ready and expanded
      try {
        tg.ready();
        tg.expand();
      } catch (err) {
        console.warn('Telegram WebApp expand/ready warning:', err);
      }

      // Sync color scheme ONLY if running inside real Telegram WebApp
      const scheme = tg.colorScheme === 'light' ? 'light' : 'dark';
      setColorScheme(scheme);

      // Respect user's explicit theme choice if stored
      const savedTheme =
        typeof window !== 'undefined'
          ? localStorage.getItem('kaiwa_theme') || localStorage.getItem('study_planner_theme')
          : null;

      if (!savedTheme) {
        if (scheme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      }

      // Listen to theme change
      const handleThemeChange = () => {
        if (tg.colorScheme) {
          setColorScheme(tg.colorScheme);
          const currentSaved =
            typeof window !== 'undefined'
              ? localStorage.getItem('kaiwa_theme') || localStorage.getItem('study_planner_theme')
              : null;
          if (!currentSaved) {
            if (tg.colorScheme === 'light') {
              document.documentElement.classList.remove('dark');
            } else {
              document.documentElement.classList.add('dark');
            }
          }
        }
      };

      try {
        tg.onEvent('themeChanged', handleThemeChange);
      } catch {}

      return () => {
        try {
          tg.offEvent('themeChanged', handleThemeChange);
        } catch {}
      };
    } else {
      setIsTwa(false);
      setWebApp(null);
    }
  }, []);

  const user = useMemo<TelegramWebAppUser | null>(() => {
    if (webApp?.initDataUnsafe?.user) {
      return webApp.initDataUnsafe.user;
    }
    return null;
  }, [webApp]);

  const initData = webApp?.initData || '';

  const haptics = useMemo(
    () => ({
      impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
        try {
          if (webApp?.HapticFeedback) {
            webApp.HapticFeedback.impactOccurred(style);
          } else if ('vibrate' in navigator) {
            navigator.vibrate(20);
          }
        } catch {}
      },
      notification: (type: 'error' | 'success' | 'warning') => {
        try {
          if (webApp?.HapticFeedback) {
            webApp.HapticFeedback.notificationOccurred(type);
          } else if ('vibrate' in navigator) {
            navigator.vibrate(type === 'error' ? [30, 50, 30] : [20, 20]);
          }
        } catch {}
      },
      selection: () => {
        try {
          if (webApp?.HapticFeedback) {
            webApp.HapticFeedback.selectionChanged();
          } else if ('vibrate' in navigator) {
            navigator.vibrate(10);
          }
        } catch {}
      },
    }),
    [webApp],
  );

  const closeApp = useCallback(() => {
    if (webApp) {
      webApp.close();
    }
  }, [webApp]);

  const openTelegramLink = useCallback(
    (url: string) => {
      if (webApp?.openTelegramLink) {
        webApp.openTelegramLink(url);
      } else {
        window.open(url, '_blank');
      }
    },
    [webApp],
  );

  const openLink = useCallback(
    (url: string) => {
      if (webApp?.openLink) {
        webApp.openLink(url);
      } else {
        window.open(url, '_blank');
      }
    },
    [webApp],
  );

  return {
    isTwa,
    webApp,
    user,
    initData,
    colorScheme,
    themeParams: (webApp?.themeParams as Record<string, string>) || {},
    haptics,
    closeApp,
    openTelegramLink,
    openLink,
  };
}
