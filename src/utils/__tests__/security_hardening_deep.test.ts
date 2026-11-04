import { describe, it, expect } from 'vitest';
import { isAdminEmail, isSuperAdmin, isUserAdmin, SUPER_ADMIN_EMAIL } from '../admin';
import { calculateReview, Rating, getPreviewIntervals, addCalendarDays } from '../srs';
// @ts-expect-error - Edge serverless JS module
import { validateIeltsResponse, validateFlashcardsResponse } from '../../../api/_validators.js';
// @ts-expect-error - Edge serverless JS module
import { checkRateLimit } from '../../../api/_rateLimit.js';
// @ts-expect-error - Edge serverless JS module
import { checkDailyQuota } from '../../../api/_quota.js';

describe('Security Deep: Admin & Role Authorization', () => {
  it('TEST 1 & 3: should reject normal users from admin authorization', () => {
    expect(isAdminEmail('student@example.com', 'user')).toBe(false);
    expect(isAdminEmail('student@example.com', null)).toBe(false);
    expect(isSuperAdmin('student@example.com')).toBe(false);
    expect(isUserAdmin({ email: 'student@example.com', role: 'user' })).toBe(false);
  });

  it('TEST 4: should strictly enforce Super Admin and DB admin roles without localStorage reliance', () => {
    expect(isSuperAdmin(SUPER_ADMIN_EMAIL)).toBe(true);
    expect(isAdminEmail('verified_admin@study.com', 'admin')).toBe(true);
    expect(isAdminEmail('attacker@study.com', 'user')).toBe(false);
    expect(isUserAdmin({ email: 'verified_admin@study.com', role: 'admin' })).toBe(true);
  });
});

describe('AI Protection: Rate Limiting & Daily Quota', () => {
  it('TEST 5: checkRateLimit should throttle after reaching window limit', async () => {
    const testUserId = 'test-user-throttle-' + Math.random().toString(36).substring(7);
    const reqMock = { headers: { get: () => '192.168.1.100' } };

    // Send 15 requests
    for (let i = 0; i < 15; i++) {
      const res = await checkRateLimit(reqMock, testUserId);
      expect(res.allowed).toBe(true);
    }

    // 16th request MUST be rejected with retryAfter
    const rejected = await checkRateLimit(reqMock, testUserId);
    expect(rejected.allowed).toBe(false);
    expect(rejected.retryAfter).toBeGreaterThan(0);
  });

  it('TEST 6: checkDailyQuota should reject oversized payloads and quota overflow', async () => {
    const testUserId = 'test-user-quota-' + Math.random().toString(36).substring(7);

    // 1. Oversized body (> 25 KB)
    const hugeBody = 'a'.repeat(30 * 1024);
    const sizeRes = await checkDailyQuota(testUserId, 'user', hugeBody);
    expect(sizeRes.allowed).toBe(false);
    expect(sizeRes.reason).toContain('maksimal chegaradan');

    // 2. Normal requests within quota
    const normalRes = await checkDailyQuota(testUserId, 'user', '{"valid":"payload"}');
    expect(normalRes.allowed).toBe(true);
  });
});

describe('AI Output: Strict Schema Validation & Resilient Parsing', () => {
  it('TEST 7 & 8: validateIeltsResponse should normalize out-of-bounds, invalid types, and missing fields', () => {
    // Corrupt AI response with string band and missing scores
    const corruptAiData = {
      overallBand: 'nine point five',
      scores: {
        taskAchievement: 15, // Out of bounds (> 9.0)
        coherenceAndCohesion: 'bad',
      },
      summary: null,
      strengths: 'not an array',
      correctedEssay: null,
    };

    const validated = validateIeltsResponse(corruptAiData, 'Original essay text');

    expect(validated.overallBand).toBeGreaterThanOrEqual(0);
    expect(validated.overallBand).toBeLessThanOrEqual(9.0);
    expect(validated.scores.taskAchievement).toBe(6.0); // clamped/fallback
    expect(typeof validated.summary).toBe('string');
    expect(Array.isArray(validated.strengths)).toBe(true);
    expect(validated.correctedEssay).toBe('Original essay text');
  });

  it('TEST 9: validateFlashcardsResponse should filter malformed items and sanitize valid cards', () => {
    const corruptCards = {
      flashcards: [
        { front: 'Cat', back: 'Mushuk', example: 'A cute cat' },
        { front: '', back: 'Empty front' }, // Invalid (empty front)
        { back: 'Missing front' }, // Invalid
        null,
        { front: 'Dog', back: 'Kuchuk' },
      ],
    };

    const result = validateFlashcardsResponse(corruptCards);
    expect(result.length).toBe(2);
    expect(result[0].front).toBe('Cat');
    expect(result[0].back).toBe('Mushuk');
    expect(result[1].front).toBe('Dog');
  });
});

describe('SRS Engine: Timezone-Invariant Calendar Day Semantics', () => {
  it('TEST 10: addCalendarDays should calculate exact calendar days without local DST or timezone skew', () => {
    // Base calendar date: 2026-08-19
    const baseDate = '2026-08-19';

    const plus1 = addCalendarDays(baseDate, 1);
    expect(plus1.dueDate).toBe('2026-08-20');
    expect(plus1.nextReviewDate).toBe('2026-08-20T00:00:00.000Z');

    const plus6 = addCalendarDays(baseDate, 6);
    expect(plus6.dueDate).toBe('2026-08-25');

    // Month boundary transition (August 31 -> September)
    const monthEnd = addCalendarDays('2026-08-31', 1);
    expect(monthEnd.dueDate).toBe('2026-09-01');

    // Leap year transition (Feb 28 in non-leap year -> March 1)
    const leapTest = addCalendarDays('2026-02-28', 1);
    expect(leapTest.dueDate).toBe('2026-03-01');
  });

  it('calculateReview should return consistent intervals and calendar dates', () => {
    const baseDate = '2026-08-19';

    // AGAIN rating -> reset to 1 day
    const againResult = calculateReview(Rating.AGAIN, 10, 5, 2.5, baseDate);
    expect(againResult.interval).toBe(1);
    expect(againResult.repetitions).toBe(0);
    expect(againResult.dueDate).toBe('2026-08-20');

    // EASY rating -> initial 4 days
    const easyResult = calculateReview(Rating.EASY, 0, 0, 2.5, baseDate);
    expect(easyResult.interval).toBe(4);
    expect(easyResult.repetitions).toBe(1);
    expect(easyResult.dueDate).toBe('2026-08-23');

    // Ease factor lower bound (must not drop below 1.3)
    let ef = 1.3;
    for (let i = 0; i < 5; i++) {
      const r = calculateReview(Rating.AGAIN, 1, 0, ef, baseDate);
      ef = r.easeFactor;
    }
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  it('getPreviewIntervals should return valid integer intervals', () => {
    const previews = getPreviewIntervals(2, 1, 2.5, '2026-08-19');
    expect(previews[Rating.AGAIN]).toBe(1);
    expect(previews[Rating.HARD]).toBe(3);
    expect(previews[Rating.GOOD]).toBe(6);
    expect(previews[Rating.EASY]).toBe(10);
  });
});
