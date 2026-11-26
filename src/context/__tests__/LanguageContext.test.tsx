import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { LanguageProvider, useLanguage } from '../LanguageContext';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';

describe('LanguageContext Unit & Fallback Tests', () => {
  beforeEach(() => {
    safeLocalStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <LanguageProvider>{children}</LanguageProvider>
  );

  it('1. defaults to uzbek language if no query param or stored preference', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('uz');
  });

  it('2. reads stored language preference from safeLocalStorage', () => {
    safeLocalStorage.setItem('study_planner_lang', 'ja');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('ja');
  });

  it('3. switches language and persists to safeLocalStorage', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => {
      result.current.setLanguage('en');
    });
    expect(result.current.language).toBe('en');
    expect(safeLocalStorage.getItem('study_planner_lang')).toBe('en');
  });

  it('keeps the chosen interface language when opening a Japanese-content link', () => {
    safeLocalStorage.setItem('kaiwa_lang', 'en');
    window.history.replaceState({}, '', '/study-mode?lang=ja');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('en');
    act(() => {
      window.history.replaceState({}, '', '/jlpt?lang=uz');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.language).toBe('en');
  });

  it('4. translates known nested keys in selected language', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => {
      result.current.setLanguage('uz');
    });
    const uzHome = result.current.t('nav.home');
    expect(uzHome).toBeTruthy();
    expect(typeof uzHome).toBe('string');
  });

  it('5. returns keyPath safely when translation is completely missing in all languages', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const missing = result.current.t('nonexistent.deeply.nested.key.path');
    expect(missing).toBe('nonexistent.deeply.nested.key.path');
  });
});
