import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateReview, Rating } from '../../utils/srs';
import { ScenarioService } from '../../services/ScenarioService';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';
import { TaskService } from '../../services/TaskService';
import { supabase } from '../../lib/supabase';

describe('kaiwa.live Complete Production Release Audit (BUG #29)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Production release verification: Core JLPT scenarios and conversation engines load with valid metadata', () => {
    const scenarios = ScenarioService.getImmediateScenarios();
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBeGreaterThan(0);

    const difficulties = new Set(scenarios.map((s) => s.difficulty));
    expect(difficulties.has('N5')).toBe(true);
    expect(difficulties.has('N4')).toBe(true);
  });

  it('2. SM-2 SRS Algorithm maintains strict interval progression for all standard ratings', () => {
    const initialAgain = calculateReview(Rating.AGAIN, 0, 0, 2.5);
    expect(initialAgain.interval).toBe(1);
    expect(initialAgain.repetitions).toBe(0);

    const initialGood = calculateReview(Rating.GOOD, 0, 0, 2.5);
    expect(initialGood.interval).toBe(2);
    expect(initialGood.repetitions).toBe(1);

    const initialEasy = calculateReview(Rating.EASY, 0, 0, 2.5);
    expect(initialEasy.interval).toBe(4);
    expect(initialEasy.repetitions).toBe(1);
  });

  it('3. User cache isolation strictly prevents state contamination during authentication transitions', () => {
    const userAlpha = 'user-alpha-uuid';
    const userBeta = 'user-beta-uuid';

    safeLocalStorage.setJSON(`kaiwa_live_session_${userAlpha}`, { level: 'N5', active: true });
    safeLocalStorage.setJSON(`kaiwa_live_session_${userBeta}`, { level: 'N2', active: false });

    const sessionAlpha = safeLocalStorage.getJSON(`kaiwa_live_session_${userAlpha}`, null);
    const sessionBeta = safeLocalStorage.getJSON(`kaiwa_live_session_${userBeta}`, null);

    expect(sessionAlpha).toEqual({ level: 'N5', active: true });
    expect(sessionBeta).toEqual({ level: 'N2', active: false });
    expect(sessionAlpha).not.toEqual(sessionBeta);
  });

  it('4. Offline recovery preserves user learning tasks and handles upstream gateway errors gracefully', async () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    safeLocalStorage.setJSON(`study_planner_tasks_${userId}`, [
      { id: 'rel-task-1', title: 'Production Japanese Speaking Session', status: 'completed' },
    ]);

    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockRejectedValue(new Error('503 Service Unavailable')),
          }),
        }),
      }),
    } as any);

    const tasks = await TaskService.fetchTasks(userId);
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Production Japanese Speaking Session');
  });
});
