import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { AdminMfaService, MfaStatus, TotpEnrollmentData } from '../../services/AdminMfaService';
import { isPublicPreviewActive } from '../../config/previewMode';
import { toast } from '../../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AdminTwoFactorGateProps {
  user: any;
  children: React.ReactNode;
}

export const AdminTwoFactorGate: React.FC<AdminTwoFactorGateProps> = ({ user, children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);

  // Enrollment state
  const [enrollmentData, setEnrollmentData] = useState<TotpEnrollmentData | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Code input
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPreview = isPublicPreviewActive();

  const loadStatus = async () => {
    if (isPreview) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const status = await AdminMfaService.getMfaStatus(user);
      setMfaStatus(status);

      // If user is not yet enrolled, initiate enrollment right away
      if (!status.isMfaEnrolled) {
        startEnrollment();
      }
    } catch (err) {
      console.error('Failed to load MFA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    setIsEnrolling(true);
    setErrorMessage(null);
    try {
      const data = await AdminMfaService.enrollTotp(`Kaiwa Admin (${user?.email || 'admin'})`);
      setEnrollmentData(data);
    } catch (err: any) {
      setErrorMessage(err?.message || '2FA sozlashni boshlashda xatolik yuz berdi.');
    } finally {
      setIsEnrolling(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [user?.id]);

  const handleCopySecret = () => {
    if (!enrollmentData?.secret) return;
    navigator.clipboard.writeText(enrollmentData.secret);
    setCopiedSecret(true);
    toast({ title: 'Nusxalandi', description: '2FA maxfiy kaliti nusxa olindi.' });
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const factorId = mfaStatus?.factorId || enrollmentData?.factorId;
    if (!factorId) {
      setErrorMessage("2FA faktori topilmadi. Qayta urinib ko'ring.");
      return;
    }

    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setErrorMessage('Iltimos, ilovadagi 6 xonali raqamli kodni kiriting.');
      return;
    }

    setIsVerifying(true);
    try {
      await AdminMfaService.verifyCode(factorId, verificationCode);
      toast({
        title: 'Xavfsizlik tasdiqlandi ✅',
        description: 'Admin hisobi muvaffaqiyatli autentifikatsiya qilindi.',
      });
      // Refresh status to update UI immediately
      setMfaStatus((prev) =>
        prev
          ? { ...prev, isMfaEnrolled: true, isSessionVerified: true, currentLevel: 'aal2' }
          : null,
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Noto'g'ri yoki eskirgan kod. Qayta tekshirib kiriting.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Preview or dev environment bypass
  if (isPreview) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Admin 2FA xavfsizlik holati tekshirilmoqda...
        </span>
      </div>
    );
  }

  // If session is already verified, allow access
  if (mfaStatus?.isSessionVerified) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white/95 p-8 shadow-2xl backdrop-blur-xl transition-all dark:border-gray-800 dark:bg-gray-900/95">
        {/* Top Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50 dark:bg-indigo-950/60 dark:text-indigo-400 dark:ring-indigo-950/30">
            {mfaStatus?.isMfaEnrolled ? (
              <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldAlert className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <span className="mb-1 rounded-full bg-indigo-100 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            Admin Xavfsizligi (2FA)
          </span>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            {mfaStatus?.isMfaEnrolled ? 'Ikki Bosqichli Tasdiqlash' : '2FA Himoyasini O‘rnating'}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {mfaStatus?.isMfaEnrolled
              ? 'Google Authenticator yoki 1Password ilovangizdagi 6 xonali kodni kiriting.'
              : 'Admin va Superadminlar uchun Authenticator orqali 2FA talab qilinadi.'}
          </p>
        </div>

        {/* Enrollment QR & Secret Key (If Not Yet Enrolled) */}
        {!mfaStatus?.isMfaEnrolled && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              {isEnrolling ? (
                <div className="flex h-44 w-44 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : enrollmentData?.qrCodeUrl ? (
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <img src={enrollmentData.qrCodeUrl} alt="2FA QR Code" className="h-40 w-40" />
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={startEnrollment}
                  className="flex items-center gap-2 text-xs"
                >
                  <RefreshCw size={14} /> QR kodni qayta yuklash
                </Button>
              )}

              {/* Secret Key Text */}
              {enrollmentData?.secret && (
                <div className="mt-3 w-full">
                  <span className="block text-center text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Maxfiy Kalit (Qo'lda kiritish uchun):
                  </span>
                  <div className="mt-1 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-900">
                    <code className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                      {enrollmentData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="ml-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Nusxa olish"
                    >
                      {copiedSecret ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ol className="list-decimal space-y-1 pl-4 text-[11px] text-gray-500 dark:text-gray-400">
              <li>
                <strong>Google Authenticator</strong> yoki <strong>1Password</strong> ilovasini
                oching.
              </li>
              <li>QR kodni skanerlang yoki yuqoridagi maxfiy kalitni qo'shing.</li>
              <li>Ilovada hosil bo'lgan 6 xonali tasdiqlash kodini kiriting.</li>
            </ol>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              6 Xonali Kod
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, ''));
                  setErrorMessage(null);
                }}
                placeholder="123456"
                autoFocus
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center font-mono text-2xl font-black tracking-widest text-gray-900 placeholder-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-600"
              />
              <KeyRound
                className="absolute right-3.5 top-3.5 text-gray-300 dark:text-gray-600"
                size={22}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-center text-xs font-medium text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={isVerifying || verificationCode.length !== 6}
            className="w-full rounded-2xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Tekshirilmoqda...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {mfaStatus?.isMfaEnrolled ? 'Tasdiqlash va Kirish' : '2FA ni Faollashtirish'}
                <ArrowRight size={16} />
              </span>
            )}
          </Button>

          <button
            type="button"
            onClick={() => navigate('/jlpt')}
            className="w-full text-center text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
          >
            ← Bosh sahifaga qaytish
          </button>
        </form>
      </div>
    </div>
  );
};
