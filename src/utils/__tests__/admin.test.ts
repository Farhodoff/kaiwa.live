import { describe, it, expect } from 'vitest';
import {
  isAdminEmail,
  isSuperAdmin,
  isEnglishTrackAllowed,
  DEFAULT_ADMIN_EMAILS,
  SUPER_ADMIN_EMAILS,
} from '../admin';

describe('Admin Email Security & English Track Gating Tests', () => {
  it('returns false for null or undefined email', () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail('')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
    expect(isEnglishTrackAllowed(null)).toBe(false);
  });

  it('returns false for non-admin user emails', () => {
    expect(isAdminEmail('guest@example.com')).toBe(false);
    expect(isAdminEmail('user@gmail.com')).toBe(false);
    expect(isAdminEmail('attacker_soyilov@evil.com')).toBe(false);
    expect(isSuperAdmin('regular_student@gmail.com')).toBe(false);
    expect(isEnglishTrackAllowed('regular_student@gmail.com')).toBe(false);
  });

  it('returns true strictly for configured admin emails', () => {
    DEFAULT_ADMIN_EMAILS.forEach((email) => {
      expect(isAdminEmail(email)).toBe(true);
      expect(isAdminEmail(email.toUpperCase())).toBe(true);
      expect(isAdminEmail(`  ${email}  `)).toBe(true);
    });
  });

  it('identifies super admin as strictly fsoyilov@gmail.com and disables English track for single-language isolation', () => {
    expect(SUPER_ADMIN_EMAILS).toEqual(['fsoyilov@gmail.com']);
    expect(isSuperAdmin('fsoyilov@gmail.com')).toBe(true);
    expect(isSuperAdmin('FSOYILOV@GMAIL.COM')).toBe(true);
    expect(isSuperAdmin('  fsoyilov@gmail.com  ')).toBe(true);
    expect(isEnglishTrackAllowed('fsoyilov@gmail.com')).toBe(false);

    // All other emails are strictly regular users
    expect(isSuperAdmin('fsoyilovv@gmail.com')).toBe(false);
    expect(isAdminEmail('fsoyilovv@gmail.com')).toBe(false);
    expect(isEnglishTrackAllowed('fsoyilovv@gmail.com')).toBe(false);
    expect(isSuperAdmin('soyilovfarhod157@gmail.com')).toBe(false);
    expect(isAdminEmail('soyilovfarhod157@gmail.com')).toBe(false);
    expect(isSuperAdmin('testadmin2026@kaiwa.live')).toBe(false);
    expect(isAdminEmail('testadmin2026@kaiwa.live')).toBe(false);

    expect(isSuperAdmin('fsayilov.ml@gmail.com')).toBe(false);
    expect(isSuperAdmin('f.sayilov.ml@gmail.com')).toBe(false);
    expect(isSuperAdmin('fsoyilov.ml@gmail.com')).toBe(false);
    expect(isEnglishTrackAllowed('fsayilov.ml@gmail.com')).toBe(false);
    expect(isEnglishTrackAllowed('f.sayilov.ml@gmail.com')).toBe(false);

    // Former non-admin candidates are strictly regular users
    expect(isAdminEmail('220075f@jdu.uz')).toBe(false);
    expect(isAdminEmail('ssoyilov7700@gmail.com')).toBe(false);

    // Non-super admin cannot access English track
    expect(isEnglishTrackAllowed('student@gmail.com')).toBe(false);
    expect(isEnglishTrackAllowed('john.doe@gmail.com')).toBe(false);
  });

  it('strictly enforces single superadmin rule: ONLY fsoyilov@gmail.com is superadmin even with role=superadmin', () => {
    // Attackers or non-fsoyilov users attempting to pass role='superadmin' MUST be rejected
    expect(isSuperAdmin('attacker@evil.com', 'superadmin')).toBe(false);
    expect(isSuperAdmin('hacker@domain.com', 'superadmin')).toBe(false);
    expect(isSuperAdmin('helper@kaiwa.live', 'superadmin')).toBe(false);
    expect(isSuperAdmin('fsoyilovv@gmail.com', 'superadmin')).toBe(false);
    expect(isSuperAdmin('soyilovfarhod157@gmail.com', 'superadmin')).toBe(false);
    expect(isSuperAdmin('random_user@domain.com', 'superadmin')).toBe(false);
    expect(isSuperAdmin(null, 'superadmin')).toBe(false);
    expect(isSuperAdmin(undefined, 'superadmin')).toBe(false);
    expect(isSuperAdmin('', 'superadmin')).toBe(false);

    // ONLY fsoyilov@gmail.com is recognized as Super Admin
    expect(isSuperAdmin('fsoyilov@gmail.com', 'superadmin')).toBe(true);
    expect(isSuperAdmin('fsoyilov@gmail.com', 'admin')).toBe(true);
    expect(isSuperAdmin('fsoyilov@gmail.com', 'user')).toBe(true);
    expect(isSuperAdmin('fsoyilov@gmail.com', null)).toBe(true);
    expect(isSuperAdmin('FSOYILOV@GMAIL.COM', 'superadmin')).toBe(true);
    expect(isSuperAdmin('  fsoyilov@gmail.com  ', 'superadmin')).toBe(true);
  });

  it('verifies helper admins in DEFAULT_ADMIN_EMAILS have admin rights but NOT superadmin rights', () => {
    // admin@kaiwa.live is a trusted helper admin
    expect(isAdminEmail('admin@kaiwa.live')).toBe(true);
    expect(isAdminEmail('ADMIN@KAIWA.LIVE')).toBe(true);
    expect(isAdminEmail('  admin@kaiwa.live  ')).toBe(true);
    expect(isAdminEmail('admin@kaiwa.live', 'admin')).toBe(true);

    // But it is strictly NOT superadmin under any role argument
    expect(isSuperAdmin('admin@kaiwa.live')).toBe(false);
    expect(isSuperAdmin('admin@kaiwa.live', 'admin')).toBe(false);
    expect(isSuperAdmin('admin@kaiwa.live', 'superadmin')).toBe(false);
  });
});
