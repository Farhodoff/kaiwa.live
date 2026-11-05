import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { uz } from '../i18n/uz';
import { ja } from '../i18n/ja';
import { en } from '../i18n/en';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

export type Language = 'uz' | 'ja' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string) => string;
}

const translations: Record<Language, any> = { uz, ja, en };

const defaultT = (keyPath: string, lang: Language = 'uz'): string => {
  const keys = keyPath.split('.');
  const getNestedValue = (obj: any): string | null => {
    let current = obj;
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        return null;
      }
    }
    return typeof current === 'string' ? current : null;
  };

  // 1. Try primary requested language
  const primary = getNestedValue(translations[lang]);
  if (primary !== null) return primary;

  // 2. Fallback hierarchy: if ja/en, try en first, then uz
  if (lang !== 'en') {
    const enFallback = getNestedValue(translations.en);
    if (enFallback !== null) return enFallback;
  }
  if (lang !== 'uz') {
    const uzFallback = getNestedValue(translations.uz);
    if (uzFallback !== null) return uzFallback;
  }

  return keyPath;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'uz',
  setLanguage: () => {},
  t: (keyPath: string) => defaultT(keyPath, 'uz'),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check URL query parameter first
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang');
      if (langParam === 'ja' || langParam === 'uz' || langParam === 'en') {
        return langParam as Language;
      }
      // Fallback to safeLocalStorage
      const saved =
        safeLocalStorage.getItem('kaiwa_lang') || safeLocalStorage.getItem('study_planner_lang');
      if (saved === 'ja' || saved === 'uz' || saved === 'en') {
        return saved as Language;
      }
    }
    return 'uz';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    safeLocalStorage.setItem('kaiwa_lang', lang);
    safeLocalStorage.setItem('study_planner_lang', lang);

    // Update URL query parameter without full reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());
      document.documentElement.lang = lang;
    }
  }, []);

  // Handle browser back/forward and initial sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.documentElement.lang = language;

    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang');
      if (langParam === 'ja' || langParam === 'uz' || langParam === 'en') {
        setLanguageState(langParam as Language);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [language]);

  const t = useCallback(
    (keyPath: string): string => {
      return defaultT(keyPath, language);
    },
    [language],
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  return useContext(LanguageContext);
};
