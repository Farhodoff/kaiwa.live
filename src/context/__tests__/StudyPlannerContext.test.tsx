import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  useStudyData,
  useOptionalStudyData,
  useKaiwaData,
  useOptionalKaiwaData,
  FALLBACK_STUDY_CONTEXT,
} from '../StudyPlannerContext';

describe('StudyPlannerContext Resilience', () => {
  it('useStudyData does not throw when called outside StudyPlannerProvider and returns fallback context', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useStudyData());

    expect(result.current).toBeDefined();
    expect(result.current.settings.notificationsEnabled).toBe(true);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.flashcards).toEqual([]);
    expect(result.current.user).toBeNull();
    expect(result.current).toEqual(FALLBACK_STUDY_CONTEXT);

    warnSpy.mockRestore();
  });

  it('useOptionalStudyData returns undefined when outside StudyPlannerProvider', () => {
    const { result } = renderHook(() => useOptionalStudyData());
    expect(result.current).toBeUndefined();
  });

  it('useKaiwaData and useOptionalKaiwaData are valid aliases', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result: studyData } = renderHook(() => useKaiwaData());
    const { result: optionalData } = renderHook(() => useOptionalKaiwaData());

    expect(studyData.current).toEqual(FALLBACK_STUDY_CONTEXT);
    expect(optionalData.current).toBeUndefined();

    warnSpy.mockRestore();
  });
});
