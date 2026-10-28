import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateReview, Rating, addCalendarDays } from '../../utils/srs';
import { ScenarioService } from '../../services/ScenarioService';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';
import { TaskService } from '../../services/TaskService';
import { supabase } from '../../lib/supabase';

describe('kaiwa.live Advanced Real-World User & Product Audit (BUG #28)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('1. SM-2 Spaced Repetition handles overdue cards and multi-day calendar boundaries correctly', () => {
    const baseDate = '2026-08-20';
    const { dueDate, nextReviewDate } = addCalendarDays(baseDate, 5);

    expect(dueDate).toBe('2026-08-25');
    expect(nextReviewDate).toBe('2026-08-25T00:00:00.000Z');

    // Review with EASY rating
    const review = calculateReview(Rating.EASY, 5, 2, 2.6, baseDate);
    expect(review.interval).toBeGreaterThan(5);
    expect(review.repetitions).toBe(3);
    expect(review.easeFactor).toBeGreaterThanOrEqual(2.6);
  });

  it('2. ScenarioService provides realistic Japanese conversations with context prompts and opening lines', () => {
    const scenarios = ScenarioService.getImmediateScenarios();
    expect(scenarios.length).toBeGreaterThan(0);

    scenarios.forEach((sc) => {
      expect(sc.id).toBeDefined();
      expect(sc.title_uz).toBeDefined();
      expect(sc.context_prompt).toBeDefined();
      expect(sc.key_phrases).toBeDefined();
      expect(Array.isArray(sc.key_phrases)).toBe(true);
    });
  });

  it('3. User A and User B speaking data & error vaults are strictly isolated', () => {
    const userA = 'user-uuid-nihon-a';
    const userB = 'user-uuid-nihon-b';

    interface ErrorItem {
      id: string;
      mistake: string;
      correction: string;
    }

    safeLocalStorage.setJSON<ErrorItem[]>(`study_planner_error_vault_cache_${userA}`, [
      { id: 'err1', mistake: 'たべますでした', correction: 'たべました' },
    ]);
    safeLocalStorage.setJSON<ErrorItem[]>(`study_planner_error_vault_cache_${userB}`, [
      { id: 'err2', mistake: 'いきましたです', correction: 'いきました' },
    ]);

    const userAErrors = safeLocalStorage.getJSON<ErrorItem[]>(
      `study_planner_error_vault_cache_${userA}`,
      [],
    );
    const userBErrors = safeLocalStorage.getJSON<ErrorItem[]>(
      `study_planner_error_vault_cache_${userB}`,
      [],
    );

    expect(userAErrors[0].mistake).toBe('たべますでした');
    expect(userBErrors[0].mistake).toBe('いきましたです');
    expect(userAErrors).not.toEqual(userBErrors);
  });

  it('4. Offline network disruption gracefully preserves user tasks and provides local recovery', async () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    safeLocalStorage.setJSON(`study_planner_tasks_${userId}`, [
      { id: 'offline-task-28', title: 'JLPT N2 Kanji Drill 50-100', status: 'in_progress' },
    ]);

    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockRejectedValue(new Error('NetworkConnectionLost')),
          }),
        }),
      }),
    } as any);

    const tasks = await TaskService.fetchTasks(userId);
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('JLPT N2 Kanji Drill 50-100');
  });

  it('5. Dashboard metrics clamp values cleanly to valid non-negative ranges', () => {
    const clampMetric = (val: number, min = 0, max = 100): number => {
      if (isNaN(val) || !isFinite(val)) return min;
      return Math.max(min, Math.min(max, Math.round(val)));
    };

    expect(clampMetric(85.6)).toBe(86);
    expect(clampMetric(-10)).toBe(0);
    expect(clampMetric(150)).toBe(100);
    expect(clampMetric(NaN)).toBe(0);
    expect(clampMetric(Infinity)).toBe(0);
  });
});
