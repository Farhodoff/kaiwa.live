import { supabase } from '../lib/supabase';
import { isUserAdmin } from '../utils/admin';

export interface TotpEnrollmentData {
  factorId: string;
  qrCodeUrl: string;
  secret: string;
  uri: string;
}

export interface MfaStatus {
  isMfaRequired: boolean;
  isMfaEnrolled: boolean;
  isSessionVerified: boolean;
  currentLevel: 'aal1' | 'aal2';
  factorId?: string;
  factorName?: string;
}

export const SESSION_2FA_KEY = 'kaiwa_admin_2fa_verified';

export class AdminMfaService {
  /**
   * Check if current session has already verified 2FA in memory/sessionStorage
   */
  static isSessionVerified(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return (
        sessionStorage.getItem(SESSION_2FA_KEY) === 'true' ||
        localStorage.getItem(SESSION_2FA_KEY) === 'true'
      );
    } catch {
      return false;
    }
  }

  /**
   * Mark current session as 2FA verified
   */
  static setSessionVerified(verified = true): void {
    if (typeof window === 'undefined') return;
    try {
      if (verified) {
        sessionStorage.setItem(SESSION_2FA_KEY, 'true');
        localStorage.setItem(SESSION_2FA_KEY, 'true');
      } else {
        sessionStorage.removeItem(SESSION_2FA_KEY);
        localStorage.removeItem(SESSION_2FA_KEY);
      }
    } catch {}
  }

  /**
   * Check complete MFA status for user
   */
  static async getMfaStatus(user?: any): Promise<MfaStatus> {
    const isRequired = isUserAdmin(user);

    try {
      // 1. Get Assurance Level
      const { data: aalData, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;

      const currentLevel = (aalData?.currentLevel as 'aal1' | 'aal2') || 'aal1';

      // 2. List enrolled factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const verifiedFactors = (factorsData?.totp || []).filter((f) => f.status === 'verified');

      const isEnrolled = verifiedFactors.length > 0;
      const isVerified = currentLevel === 'aal2' || this.isSessionVerified();

      return {
        isMfaRequired: isRequired,
        isMfaEnrolled: isEnrolled,
        isSessionVerified: isVerified,
        currentLevel,
        factorId: verifiedFactors[0]?.id,
        factorName: verifiedFactors[0]?.friendly_name || 'Authenticator',
      };
    } catch (err) {
      console.warn('MFA status query fallback:', err);
      return {
        isMfaRequired: isRequired,
        isMfaEnrolled: false,
        isSessionVerified: this.isSessionVerified(),
        currentLevel: 'aal1',
      };
    }
  }

  /**
   * Enroll a new TOTP factor
   */
  static async enrollTotp(friendlyName = 'Kaiwa Admin Authenticator'): Promise<TotpEnrollmentData> {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName,
      issuer: 'Kaiwa.live',
    });

    if (error || !data) {
      throw error || new Error('2FA sozlashda xatolik yuz berdi.');
    }

    const qrRaw = data.totp.qr_code;
    const qrCodeUrl = qrRaw.startsWith('data:')
      ? qrRaw
      : `data:image/svg+xml;utf-8,${encodeURIComponent(qrRaw)}`;

    return {
      factorId: data.id,
      qrCodeUrl,
      secret: data.totp.secret,
      uri: data.totp.uri,
    };
  }

  /**
   * Verify TOTP code during enrollment or challenge
   */
  static async verifyCode(factorId: string, code: string): Promise<boolean> {
    const cleanCode = code.replace(/\s+/g, '').trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      throw new Error('Kodni 6 xonali raqam shaklida kiriting.');
    }

    // 1. Create a challenge
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (challengeError || !challengeData) {
      throw challengeError || new Error('2FA so‘rovi yaratib bo‘lmadi.');
    }

    // 2. Verify code against challenge
    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: cleanCode,
    });

    if (verifyError || !verifyData) {
      throw verifyError || new Error("Noto'g'ri yoki eskirgan 2FA kodi.");
    }

    // Mark session verified
    this.setSessionVerified(true);
    return true;
  }

  /**
   * Unenroll / remove an existing factor
   */
  static async unenrollFactor(factorId: string): Promise<boolean> {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    this.setSessionVerified(false);
    return true;
  }
}
