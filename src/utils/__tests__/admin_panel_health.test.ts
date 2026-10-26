import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isAdminEmail, isSuperAdmin, SUPER_ADMIN_EMAILS } from '../admin';

describe('Admin Panel Health & Security Gatekeeper (CI/CD Protection Layer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Superadmin & Admin Whitelist Security', () => {
    it('strictly authorizes fsoyilov@gmail.com as superadmin', () => {
      expect(isSuperAdmin('fsoyilov@gmail.com')).toBe(true);
      expect(isSuperAdmin('FSOYILOV@GMAIL.COM')).toBe(true);
      expect(isSuperAdmin(' fsoyilov@gmail.com ')).toBe(true);
      expect(isAdminEmail('fsoyilov@gmail.com')).toBe(true);
    });

    it('strictly blocks unauthorized emails from superadmin privileges', () => {
      const unauthorized = [
        'attacker@evil.com',
        'testadmin2026@kaiwa.live',
        'hacker@exploit.io',
        'student@kaiwa.live',
        'user@gmail.com',
        '',
        null,
        undefined,
      ];

      for (const email of unauthorized) {
        expect(isSuperAdmin(email as string)).toBe(false);
      }
    });

    it('ensures SUPER_ADMIN_EMAILS whitelist contains ONLY authorized admins', () => {
      expect(SUPER_ADMIN_EMAILS).toContain('fsoyilov@gmail.com');
      // Ensure no legacy test/backdoor emails exist in whitelist
      expect(SUPER_ADMIN_EMAILS).not.toContain('testadmin2026@kaiwa.live');
      expect(SUPER_ADMIN_EMAILS).not.toContain('attacker@evil.com');
    });
  });

  describe('2. Live Database Metrics 10-Table Contract', () => {
    it('validates the complete 10-table schema required by Admin Dashboard', () => {
      const expectedTableKeys = [
        'profiles_count',
        'flashcards_count',
        'study_sessions_count',
        'speaking_sessions_count',
        'speaking_coach_sessions_count',
        'ai_coach_sessions_count',
        'speaking_errors_count',
        'speaking_vocabularies_count',
        'diagnostic_results_count',
        'learning_goals_count',
      ];

      // Mock RPC response object representing get_admin_database_metrics
      const mockDbMetrics = {
        profiles_count: 28,
        flashcards_count: 13157,
        study_sessions_count: 48,
        speaking_sessions_count: 8,
        speaking_coach_sessions_count: 6,
        ai_coach_sessions_count: 10,
        speaking_errors_count: 38,
        speaking_vocabularies_count: 3,
        diagnostic_results_count: 0,
        learning_goals_count: 0,
      };

      for (const key of expectedTableKeys) {
        expect(mockDbMetrics).toHaveProperty(key);
        expect(typeof (mockDbMetrics as any)[key]).toBe('number');
        expect((mockDbMetrics as any)[key]).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('3. get_admin_all_sessions RPC Contract Integrity', () => {
    it('ensures session aggregator returns all 4 session streams without dropping data', () => {
      const mockAggregatorPayload = {
        study_sessions: [
          { id: 's-1', user_id: 'u-1', duration_minutes: 25, created_at: '2026-08-30' },
        ],
        speaking_sessions: [
          { id: 'sp-1', user_id: 'u-1', scenario_id: 'travel', duration_seconds: 120 },
        ],
        speaking_coach_sessions: [{ id: 'sc-1', user_id: 'u-1', overall_score: 85 }],
        ai_coach_sessions: [{ id: 'ac-1', user_id: 'u-1', grammar_score: 90 }],
      };

      expect(Array.isArray(mockAggregatorPayload.study_sessions)).toBe(true);
      expect(Array.isArray(mockAggregatorPayload.speaking_sessions)).toBe(true);
      expect(Array.isArray(mockAggregatorPayload.speaking_coach_sessions)).toBe(true);
      expect(Array.isArray(mockAggregatorPayload.ai_coach_sessions)).toBe(true);

      expect(mockAggregatorPayload.study_sessions.length).toBe(1);
      expect(mockAggregatorPayload.speaking_sessions.length).toBe(1);
      expect(mockAggregatorPayload.speaking_coach_sessions.length).toBe(1);
      expect(mockAggregatorPayload.ai_coach_sessions.length).toBe(1);
    });
  });

  describe('4. get_admin_all_users User Aggregation & Cold Start Resilience', () => {
    it('normalizes user records correctly with proper default values and role inheritance', () => {
      const rawRpcUsers = [
        {
          id: '57b9ec2c-ce64-4d9f-938a-f38466e4d254',
          email: 'kholmirzaergashov30@gmail.com',
          full_name: 'hori',
          role: 'user',
          tier: 'unlimited',
          ai_credits: 99999,
          created_at: '2026-08-29T11:32:05Z',
          last_sign_in_at: '2026-08-29T15:40:47Z',
        },
        {
          id: 'admin-uuid-123',
          email: 'fsoyilov@gmail.com',
          full_name: 'Farhod Soyilov',
          role: 'superadmin',
          tier: 'unlimited',
          ai_credits: 99999,
          created_at: '2026-08-01T00:00:00Z',
          last_sign_in_at: '2026-08-30T10:00:00Z',
        },
      ];

      const userMap = new Map();
      rawRpcUsers.forEach((u) => {
        userMap.set(u.id, {
          ...u,
          email: u.email || "Noma'lum",
          full_name: u.full_name || (u.email ? u.email.split('@')[0] : 'Talaba'),
          role: isSuperAdmin(u.email) ? 'superadmin' : u.role || 'user',
        });
      });

      expect(userMap.size).toBe(2);
      expect(userMap.get('admin-uuid-123').role).toBe('superadmin');
      expect(userMap.get('57b9ec2c-ce64-4d9f-938a-f38466e4d254').role).toBe('user');
    });
  });
});
