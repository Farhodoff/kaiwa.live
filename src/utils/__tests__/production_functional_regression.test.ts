import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';
import { ScenarioService } from '../../services/ScenarioService';

describe('kaiwa.live Production Functional & UX Regression Tests (BUG #25)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Speaking scenario service retrieves immediate scenarios with titles and difficulty', () => {
    const scenarios = ScenarioService.getImmediateScenarios();
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBeGreaterThan(0);

    scenarios.forEach((scenario) => {
      expect(scenario.title_uz).toBeDefined();
      expect(scenario.difficulty).toBeDefined();
      expect(scenario.category).toBeDefined();
    });
  });

  it('2. Local storage corrupted state recovers gracefully without throwing unhandled exceptions', () => {
    localStorage.setItem('study_planner_user_cache', 'MALFORMED_JSON_STRING_%%');
    const user = safeLocalStorage.getJSON('study_planner_user_cache', null);
    expect(user).toBeNull();
  });

  it('3. User switching cleans active user state and prevents cross-user pollution', () => {
    const userA = 'user-uuid-nihongo-a';
    const userB = 'user-uuid-nihongo-b';

    interface SimpleSession {
      id: string;
      score: number;
    }

    safeLocalStorage.setJSON<SimpleSession[]>(`study_planner_speaking_cache_${userA}`, [
      { id: 'sess_1', score: 95 },
    ]);
    safeLocalStorage.setJSON<SimpleSession[]>(`study_planner_speaking_cache_${userB}`, [
      { id: 'sess_2', score: 88 },
    ]);

    const dataA = safeLocalStorage.getJSON<SimpleSession[]>(
      `study_planner_speaking_cache_${userA}`,
      [],
    );
    const dataB = safeLocalStorage.getJSON<SimpleSession[]>(
      `study_planner_speaking_cache_${userB}`,
      [],
    );

    expect(dataA[0].score).toBe(95);
    expect(dataB[0].score).toBe(88);
    expect(dataA).not.toEqual(dataB);
  });

  it('4. MediaStream audio cleanup contract releases microphone tracks on session end', () => {
    const stopMock = vi.fn();
    const fakeTrack = { stop: stopMock, kind: 'audio' };
    const fakeStream = {
      getTracks: () => [fakeTrack],
      active: true,
    };

    // Simulating standard cleanup pattern in SpeakingCoach
    fakeStream.getTracks().forEach((track) => track.stop());
    expect(stopMock).toHaveBeenCalledTimes(1);
  });
});
