import { describe, it, expect } from 'vitest';
import {
  isAdminEmail,
  isSuperAdmin,
  isUserAdmin,
  SUPER_ADMIN_EMAIL,
  DEFAULT_ADMIN_EMAILS,
} from '../admin';
import { calculateReview, Rating, getPreviewIntervals } from '../srs';

describe('Security: Admin Role Verification Hardening', () => {
  it('should correctly identify Super Admin email', () => {
    expect(isSuperAdmin(SUPER_ADMIN_EMAIL)).toBe(true);
    expect(isSuperAdmin('   FSOYILOV@GMAIL.COM  ')).toBe(true);
    expect(isSuperAdmin('attacker@gmail.com')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
  });

  it('should allow default admin emails and reject random emails', () => {
    DEFAULT_ADMIN_EMAILS.forEach((email) => {
      expect(isAdminEmail(email)).toBe(true);
    });
    expect(isAdminEmail('random_user@domain.com')).toBe(false);
  });

  it('should recognize database role admin regardless of email', () => {
    expect(isAdminEmail('custom_admin@study.com', 'admin')).toBe(true);
    expect(isAdminEmail('custom_admin@study.com', 'superadmin')).toBe(true);
    expect(isAdminEmail('custom_admin@study.com', 'user')).toBe(false);
  });

  it('isUserAdmin should handle full user objects securely', () => {
    expect(isUserAdmin({ email: SUPER_ADMIN_EMAIL, role: 'user' })).toBe(true);
    expect(isUserAdmin({ email: 'normal@study.com', role: 'admin' })).toBe(true);
    expect(isUserAdmin({ email: 'normal@study.com', role: 'user' })).toBe(false);
    expect(isUserAdmin(null)).toBe(false);
  });
});

describe('SRS: Spaced Repetition Normalization & Consistency', () => {
  it('should calculate valid calendar review date and ISO format', () => {
    const review = calculateReview(Rating.GOOD, 0, 0, 2.5, '2026-08-19');
    expect(review.dueDate).toBe('2026-08-21');
    expect(review.nextReviewDate).toBe('2026-08-21T00:00:00.000Z');
  });

  it('should calculate initial repetitions accurately', () => {
    const againReview = calculateReview(Rating.AGAIN, 0, 0, 2.5);
    expect(againReview.interval).toBe(1);
    expect(againReview.repetitions).toBe(0);

    const goodReview = calculateReview(Rating.GOOD, 0, 0, 2.5);
    expect(goodReview.interval).toBe(2);
    expect(goodReview.repetitions).toBe(1);

    const easyReview = calculateReview(Rating.EASY, 0, 0, 2.5);
    expect(easyReview.interval).toBe(4);
    expect(easyReview.repetitions).toBe(1);
  });

  it('getPreviewIntervals should return valid intervals for all 4 ratings', () => {
    const previews = getPreviewIntervals(0, 0, 2.5);
    expect(previews[Rating.AGAIN]).toBe(1);
    expect(previews[Rating.HARD]).toBe(1);
    expect(previews[Rating.GOOD]).toBe(2);
    expect(previews[Rating.EASY]).toBe(4);
  });
});
