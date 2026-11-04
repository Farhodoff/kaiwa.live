import { describe, expect, it, beforeEach } from 'vitest';
import { calculateReview, Rating, Grade, getPreviewIntervals } from '../srs';
import { getLevelInfo, LEVELS } from '../gamification';
import { calculateMasteryScore, getSubjectAnalytics } from '../analytics';
import { HistoryService } from '../../services/HistoryService';
import { calculateStreak, calculateCompletionRates, getWeeklyProgress } from '../statistics';
import exportImportService from '../../services/ExportImportService';
import { supabase } from '../../lib/supabase';
import { vi } from 'vitest';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Empirical Adversarial Edge Case Harness (Challenger M1-2)', () => {
  beforeEach(() => {
    HistoryService.clearMissingTablesCache();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. SRS Algorithm Edge Cases (srs.ts)', () => {
    it('E1.1: Invalid rating grade (e.g. -1, 999) on subsequent review treats rating as successful recall and increases easeFactor', () => {
      // standardGrade evaluates grade === 0 ? 0 : grade === 1 ? 3 : grade === 2 ? 4 : 5
      // Any grade !== 0,1,2 maps to standardGrade 5, treating it as pass!
      const resInvalid = calculateReview(999 as Grade, 6, 2, 2.5);
      expect(resInvalid.repetitions).toBe(3); // Repetition count increases!
      expect(resInvalid.interval).toBe(15); // Interval increases!
      expect(resInvalid.easeFactor).toBe(2.6); // Ease factor gets boosted!
    });

    it('E1.2: Negative priorInterval sets next review date in the past', () => {
      const result = calculateReview(Rating.GOOD, -10, 2, 2.5);
      // newInterval = Math.max(-10 + 1, Math.round(-10 * 2.5)) = Math.max(-9, -25) = -9
      expect(result.interval).toBe(-9);
      const nextDate = new Date(result.nextReviewDate);
      const now = new Date();
      // Review date is in the past!
      expect(nextDate.getTime()).toBeLessThan(now.getTime());
    });

    it('E1.3: NaN priorInterval causes nextReviewDate to throw RangeError: Invalid time value', () => {
      expect(() => {
        calculateReview(Rating.GOOD, NaN, 2, 2.5);
      }).toThrow(RangeError);
    });

    it('E1.4: Infinity priorInterval causes nextReviewDate to throw RangeError: Invalid time value', () => {
      expect(() => {
        calculateReview(Rating.GOOD, Infinity, 2, 2.5);
      }).toThrow(RangeError);
    });

    it('E1.5: getPreviewIntervals pre-calculates next intervals for all four rating options', () => {
      const intervals = getPreviewIntervals(0, 0, 2.5);
      expect(intervals[Rating.AGAIN]).toBe(1);
      expect(intervals[Rating.HARD]).toBe(1);
      expect(intervals[Rating.GOOD]).toBe(2);
      expect(intervals[Rating.EASY]).toBe(4);
    });
  });

  describe('2. Gamification Edge Cases (gamification.ts)', () => {
    it('E2.1: NaN XP returns NaN progress and NaN xpToNext', () => {
      const result = getLevelInfo(NaN);
      expect(result.level).toBe(1);
      expect(Number.isNaN(result.progress)).toBe(true);
      expect(Number.isNaN(result.xpToNext)).toBe(true);
    });

    it('E2.2: Negative XP calculates negative xpToNext buffer', () => {
      const result = getLevelInfo(-500);
      expect(result.level).toBe(1);
      expect(result.progress).toBe(0); // Clamped
      expect(result.xpToNext).toBe(1000); // 500 - (-500)
    });

    it('E2.3: XP at exact max level threshold vs above max level threshold', () => {
      const exactMax = getLevelInfo(20000);
      expect(exactMax.level).toBe(8);
      expect(exactMax.nextLevelXp).toBe(20000);
      expect(exactMax.xpToNext).toBe(0);

      const aboveMax = getLevelInfo(35000);
      expect(aboveMax.level).toBe(8);
      expect(aboveMax.nextLevelXp).toBe(35000); // nextLevelXp matches input XP when max level reached
      expect(aboveMax.xpToNext).toBe(0);
    });

    it('E2.4: Tier boundary exact XP transitions', () => {
      LEVELS.forEach((tier, idx) => {
        if (idx > 0) {
          const justBelow = getLevelInfo(tier.minXp - 1);
          const atTier = getLevelInfo(tier.minXp);
          expect(justBelow.level).toBe(LEVELS[idx - 1].level);
          expect(atTier.level).toBe(tier.level);
        }
      });
    });
  });

  describe('3. Analytics Edge Cases (analytics.ts)', () => {
    it('E3.1: Null or undefined cards array causes calculateMasteryScore to crash', () => {
      expect(() => {
        // @ts-ignore
        calculateMasteryScore(null);
      }).toThrow(TypeError);
    });

    it('E3.2: Cards with 0 repetitions get 0 score regardless of high interval', () => {
      const cards = [
        {
          id: 'c1',
          subjectId: 's1',
          front: 'f',
          back: 'b',
          interval: 30,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const score = calculateMasteryScore(cards);
      expect(score).toBe(0);
    });

    it('E3.3: Null/undefined inputs in getSubjectAnalytics throw TypeError', () => {
      expect(() => {
        // @ts-ignore
        getSubjectAnalytics(null, []);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-ignore
        getSubjectAnalytics([{ id: '1', name: 'Sub 1', color: '#000', schedule: [] }], null);
      }).toThrow(TypeError);
    });

    it('E3.4: Flashcards with interval=1 count as struggling in getSubjectAnalytics', () => {
      const subjects = [{ id: 'sub1', name: 'Math', color: '#fff', schedule: [] }];
      const cards = [
        {
          id: 'c1',
          subjectId: 'sub1',
          front: 'f',
          back: 'b',
          interval: 1,
          repetitions: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
        },
      ];
      const res = getSubjectAnalytics(subjects, cards);
      expect(res[0].strugglingCards).toBe(1);
    });
  });

  describe('4. HistoryService LocalStorage Corruption Edge Cases (HistoryService.ts)', () => {
    it('E4.1: Corrupted non-JSON string in localStorage causes getWritingHistory to crash with SyntaxError', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      localStorage.setItem('study_planner_ielts_writing_history', '{ invalid json ...');

      await expect(HistoryService.getWritingHistory()).rejects.toThrow(SyntaxError);
    });

    it('E4.2: Corrupted non-JSON string in localStorage causes saveWritingAttempt to crash', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      localStorage.setItem('study_planner_ielts_writing_history', '{ invalid json ...');

      await expect(
        HistoryService.saveWritingAttempt({
          taskType: 'task1',
          prompt: 'p',
          essay: 'e',
          score: 7,
          criteriaBreakdown: { tr: 7, cc: 7, lr: 7, gra: 7 },
          feedback: 'f',
        }),
      ).rejects.toThrow(SyntaxError);
    });

    it('E4.3: Non-array JSON in localStorage (e.g. number/object) causes saveWritingAttempt to crash with TypeError', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      localStorage.setItem('study_planner_ielts_writing_history', '12345');

      await expect(
        HistoryService.saveWritingAttempt({
          taskType: 'task1',
          prompt: 'p',
          essay: 'e',
          score: 7,
          criteriaBreakdown: { tr: 7, cc: 7, lr: 7, gra: 7 },
          feedback: 'f',
        }),
      ).rejects.toThrow(TypeError);
    });

    it('E4.4: Corrupted non-JSON in speaking session localStorage causes getSpeakingHistory & saveSpeakingSession to crash', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      localStorage.setItem('study_planner_speaking_coach_sessions', 'BAD_JSON');

      await expect(HistoryService.getSpeakingHistory()).rejects.toThrow(SyntaxError);
    });

    it('E4.5: Corrupted non-JSON in mock exams localStorage causes getMockExamsHistory & saveMockExam to crash', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      localStorage.setItem('study_planner_mock_exams_history', 'CORRUPTED');

      await expect(HistoryService.getMockExamsHistory()).rejects.toThrow(SyntaxError);
    });
  });

  describe('5. Streak & CSV Parsing Edge Cases (statistics.ts & ExportImportService.ts)', () => {
    it('E5.1: calculateStreak returns 0 if completed tasks have no deadline', () => {
      const tasks = [
        { id: '1', title: 'Task 1', completed: true, status: 'done', priority: 'medium' } as any,
      ];
      expect(calculateStreak(tasks)).toBe(0);
    });

    it('E5.2: Flashcard CSV import with NaN/invalid interval string parses interval as NaN', async () => {
      // Test parseCsv indirectly or via import mock
      const fakeFile = new File(
        [
          'Oldi,Orqasi,Misol,Date,Interval,Ease,Repetitions\nFront,Back,Ex,2026-08-02,INVALID_INT,2.5,0',
        ],
        'test.csv',
        { type: 'text/csv' },
      );
      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: upsertMock } as any);

      await exportImportService.importFlashcardsFromCSV(fakeFile, 'u1', 's1');

      expect(upsertMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            interval: NaN,
          }),
        ]),
      );
    });

    it('E5.3: calculateCompletionRates correctly calculates completion metrics and percentage', () => {
      const goals: any[] = [{ id: 'g1', title: 'Goal 1', completed: false }];
      const tasks: any[] = [
        { id: 't1', title: 'Task 1', completed: true },
        { id: 't2', title: 'Task 2', completed: false },
      ];
      const res = calculateCompletionRates(goals, tasks);
      expect(res.totalGoals).toBe(1);
      expect(res.completedGoals).toBe(0);
      expect(res.totalTasks).toBe(2);
      expect(res.completedTasks).toBe(1);
      expect(res.overallPercentage).toBe(0.5);
    });

    it('E5.4: getWeeklyProgress returns 7 days of historical task completion counts', () => {
      const tasks: any[] = [];
      const progress = getWeeklyProgress(tasks);
      expect(progress).toHaveLength(7);
      expect(progress[6].count).toBe(0);
    });
  });
});
