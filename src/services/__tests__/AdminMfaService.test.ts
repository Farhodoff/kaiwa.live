import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AdminMfaService, SESSION_2FA_KEY } from '../AdminMfaService';
import { supabase } from '../../lib/supabase';

describe('AdminMfaService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('Session verification state', () => {
    it('returns false when 2FA has not been verified in session', () => {
      expect(AdminMfaService.isSessionVerified()).toBe(false);
    });

    it('sets and remembers session verification correctly', () => {
      AdminMfaService.setSessionVerified(true);
      expect(AdminMfaService.isSessionVerified()).toBe(true);
      expect(sessionStorage.getItem(SESSION_2FA_KEY)).toBe('true');

      AdminMfaService.setSessionVerified(false);
      expect(AdminMfaService.isSessionVerified()).toBe(false);
      expect(sessionStorage.getItem(SESSION_2FA_KEY)).toBeNull();
    });
  });

  describe('getMfaStatus', () => {
    it('identifies admin user as requiring 2FA', async () => {
      vi.spyOn(supabase.auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
        data: { currentLevel: 'aal1', nextLevel: 'aal2', currentAuthenticationMethods: [] },
        error: null,
      });

      vi.spyOn(supabase.auth.mfa, 'listFactors').mockResolvedValue({
        data: {
          all: [],
          totp: [
            {
              id: 'factor-123',
              friendly_name: 'Admin Google Auth',
              factor_type: 'totp',
              status: 'verified',
              created_at: '',
              updated_at: '',
            },
          ],
          phone: [],
          webauthn: [],
        } as any,
        error: null,
      });

      const status = await AdminMfaService.getMfaStatus({
        email: 'admin@kaiwa.live',
        role: 'admin',
      });

      expect(status.isMfaRequired).toBe(true);
      expect(status.isMfaEnrolled).toBe(true);
      expect(status.factorId).toBe('factor-123');
      expect(status.currentLevel).toBe('aal1');
      expect(status.isSessionVerified).toBe(false);
    });

    it('marks isSessionVerified true when currentLevel is aal2', async () => {
      vi.spyOn(supabase.auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
        data: { currentLevel: 'aal2', nextLevel: 'aal2', currentAuthenticationMethods: [] },
        error: null,
      });

      vi.spyOn(supabase.auth.mfa, 'listFactors').mockResolvedValue({
        data: {
          all: [],
          totp: [
            {
              id: 'factor-123',
              friendly_name: 'Authenticator',
              factor_type: 'totp',
              status: 'verified',
              created_at: '',
              updated_at: '',
            },
          ],
          phone: [],
          webauthn: [],
        } as any,
        error: null,
      });

      const status = await AdminMfaService.getMfaStatus({
        email: 'fsoyilov@gmail.com',
      });

      expect(status.isMfaRequired).toBe(true);
      expect(status.isMfaEnrolled).toBe(true);
      expect(status.currentLevel).toBe('aal2');
      expect(status.isSessionVerified).toBe(true);
    });
  });

  describe('enrollTotp', () => {
    it('formats SVG QR Code data URL and returns secret', async () => {
      vi.spyOn(supabase.auth.mfa, 'enroll').mockResolvedValue({
        data: {
          id: 'new-factor-456',
          type: 'totp',
          totp: {
            qr_code: '<svg>dummy_qr</svg>',
            secret: 'JBSWY3DPEHPK3PXP',
            uri: 'otpauth://totp/Kaiwa:admin?secret=JBSWY3DPEHPK3PXP',
          },
        },
        error: null,
      });

      const res = await AdminMfaService.enrollTotp('Test Admin');
      expect(res.factorId).toBe('new-factor-456');
      expect(res.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(res.qrCodeUrl).toContain('data:image/svg+xml;utf-8,');
    });

    it('throws error when enroll API fails', async () => {
      vi.spyOn(supabase.auth.mfa, 'enroll').mockResolvedValue({
        data: null as any,
        error: { name: 'AuthError', message: 'Rate limit exceeded' } as any,
      });

      await expect(AdminMfaService.enrollTotp()).rejects.toThrow(/Rate limit/);
    });
  });

  describe('verifyCode', () => {
    it('validates 6-digit formatting before sending challenge', async () => {
      await expect(AdminMfaService.verifyCode('factor-1', '123')).rejects.toThrow(/6 xonali raqam/);
      await expect(AdminMfaService.verifyCode('factor-1', 'abcdef')).rejects.toThrow(
        /6 xonali raqam/,
      );
    });

    it('creates challenge, verifies code, and sets session verified', async () => {
      vi.spyOn(supabase.auth.mfa, 'challenge').mockResolvedValue({
        data: { id: 'challenge-789', type: 'totp', expires_at: 123456 },
        error: null,
      });

      vi.spyOn(supabase.auth.mfa, 'verify').mockResolvedValue({
        data: { access_token: 'new-token', user: {} as any } as any,
        error: null,
      });

      const success = await AdminMfaService.verifyCode('factor-123', '654321');
      expect(success).toBe(true);
      expect(AdminMfaService.isSessionVerified()).toBe(true);
    });
  });

  describe('unenrollFactor', () => {
    it('calls supabase unenroll and clears session flag', async () => {
      AdminMfaService.setSessionVerified(true);
      vi.spyOn(supabase.auth.mfa, 'unenroll').mockResolvedValue({
        data: { id: 'factor-123' },
        error: null,
      });

      const success = await AdminMfaService.unenrollFactor('factor-123');
      expect(success).toBe(true);
      expect(AdminMfaService.isSessionVerified()).toBe(false);
    });
  });
});
