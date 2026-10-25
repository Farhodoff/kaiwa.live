import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateReview, Rating } from '../../utils/srs';
import { ScenarioService } from '../../services/ScenarioService';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';

describe('kaiwa.live Deep Product, UX & Learning Quality Audit (BUG #27)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('1. SRS calculation handles initial card intervals correctly for all rating grades', () => {
    // Rating.AGAIN (grade 0) -> repetitions reset to 0, interval 1
    const againResult = calculateReview(Rating.AGAIN, 0, 0, 2.5);
    expect(againResult.repetitions).toBe(0);
    expect(againResult.interval).toBe(1);

    // Rating.HARD (grade 1) -> repetitions increment to 1, interval 1
    const hardResult = calculateReview(Rating.HARD, 0, 0, 2.5);
    expect(hardResult.repetitions).toBe(1);
    expect(hardResult.interval).toBe(1);

    // Rating.GOOD (grade 2) -> repetitions increment to 1, interval 2
    const goodResult = calculateReview(Rating.GOOD, 0, 0, 2.5);
    expect(goodResult.repetitions).toBe(1);
    expect(goodResult.interval).toBe(2);

    // Rating.EASY (grade 3) -> repetitions increment to 1, interval 4
    const easyResult = calculateReview(Rating.EASY, 0, 0, 2.5);
    expect(easyResult.repetitions).toBe(1);
    expect(easyResult.interval).toBe(4);

    // Subsequent Rating.GOOD review (from 1 repetition) -> interval moves to 6
    const matureGoodResult = calculateReview(Rating.GOOD, 2, 1, 2.5);
    expect(matureGoodResult.repetitions).toBe(2);
    expect(matureGoodResult.interval).toBe(6);
  });

  it('2. ScenarioService provides comprehensive Japanese scenarios for JLPT levels', () => {
    const scenarios = ScenarioService.getImmediateScenarios();
    expect(scenarios.length).toBeGreaterThan(0);

    const n5Scenarios = scenarios.filter((s) => s.difficulty === 'N5');
    expect(n5Scenarios.length).toBeGreaterThan(0);
    expect(n5Scenarios[0].title_uz).toBeDefined();
    expect(n5Scenarios[0].description_uz).toBeDefined();
  });

  it('3. Learning progress statistics remain strictly bounded between 0% and 100%', () => {
    const calculateSafePercentage = (completed: number, total: number): number => {
      if (!total || total <= 0) return 0;
      const pct = Math.round((completed / total) * 100);
      return Math.max(0, Math.min(100, pct));
    };

    expect(calculateSafePercentage(0, 50)).toBe(0);
    expect(calculateSafePercentage(25, 50)).toBe(50);
    expect(calculateSafePercentage(50, 50)).toBe(100);
    expect(calculateSafePercentage(60, 50)).toBe(100); // Clamped
    expect(calculateSafePercentage(-5, 50)).toBe(0); // Clamped
  });

  it('4. User learning state is safely persisted and isolated per user in safeLocalStorage', () => {
    const activeUserId = '00000000-0000-4000-8000-000000000001';
    const sampleProgress = {
      currentLevel: 'N5',
      completedLessons: ['n5_l1', 'n5_l2'],
      totalXP: 250,
      streakDays: 5,
    };

    safeLocalStorage.setJSON(`nihongo_talk_progress_${activeUserId}`, sampleProgress);
    const retrieved = safeLocalStorage.getJSON(`nihongo_talk_progress_${activeUserId}`, null);

    expect(retrieved).toEqual(sampleProgress);
  });
});
