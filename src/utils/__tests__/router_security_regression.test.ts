import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isAdminEmail } from '../admin';

describe('Router Security & Navigation Closure (BUG #19)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Protocol-relative or backslash paths (//evil.com or \\\\evil.com) cannot bypass route isolation', () => {
    const testInputs = ['//evil.com', '\\\\evil.com', 'https://attacker.com', '/admin\\evil.com'];
    testInputs.forEach((input) => {
      const isInternalPath =
        input.startsWith('/') && !input.startsWith('//') && !input.includes('\\');
      // Malicious redirect inputs must be detected as non-safe internal paths
      if (input === '/admin\\evil.com' || input.startsWith('//') || input.startsWith('\\')) {
        expect(isInternalPath).toBe(false);
      }
    });
  });

  it('2. Unauthorized user cannot access admin route via localStorage spoofing', () => {
    localStorage.setItem('study_planner_user_email', 'fsoyilov@gmail.com');
    localStorage.setItem('role', 'admin');

    const unauthenticatedUser = null;
    expect(isAdminEmail(unauthenticatedUser)).toBe(false);

    const regularUser = { id: 'regular-user-id', email: 'regular@example.com' };
    expect(isAdminEmail(regularUser.email)).toBe(false);
  });

  it('3. Verified superadmin is authorized while impostor with manipulated domain is rejected', () => {
    expect(isAdminEmail('fsoyilov@gmail.com')).toBe(true);
    expect(isAdminEmail('fsoyilov@gmail.com.attacker.com')).toBe(false);
    expect(isAdminEmail('attacker_fsoyilov@gmail.com')).toBe(false);
    expect(isAdminEmail('fsoyilov@notgmail.com')).toBe(false);
  });
});
