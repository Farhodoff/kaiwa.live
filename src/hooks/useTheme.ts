import { useState, useEffect, useCallback } from 'react';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'study_planner_theme';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = safeLocalStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    if (document.documentElement.classList.contains('dark')) return 'dark';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {}
  return 'dark';
};

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Update mobile status bar theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0F1419' : '#F8F6F0');
  }
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    safeLocalStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyThemeToDOM(newTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: newTheme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    // Initial sync
    applyThemeToDOM(theme);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
        applyThemeToDOM(e.newValue);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      if (customEvent.detail && (customEvent.detail === 'light' || customEvent.detail === 'dark')) {
        setThemeState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('themechange', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('themechange', handleCustomEvent);
    };
  }, [theme]);

  return {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  };
};
