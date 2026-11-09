import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { AdminMfaService, MfaStatus, TotpEnrollmentData } from '../../services/AdminMfaService';
import { toast } from '../../hooks/use-toast';

interface Admin2FaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const Admin2FaSetupModal: React.FC<Admin2FaSetupModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<TotpEnrollmentData | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const s = await AdminMfaService.getMfaStatus(user);
      setStatus(s);
      if (!s.isMfaEnrolled) {
        initiateEnrollment();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initiateEnrollment = async () => {
    setIsEnrolling(true);
    setErrorMessage(null);
    try {
      const data = await AdminMfaService.enrollTotp(`Kaiwa (${user?.email || 'user'})`);
      setEnrollmentData(data);
    } catch (err: any) {
      setErrorMessage(err?.message || '2FA sozlashda xatolik yuz berdi.');
    } finally {
      setIsEnrolling(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!enrollmentData?.secret) return;
    navigator.clipboard.writeText(enrollmentData.secret);
    setCopied(true);
    toast({ title: 'Nusxalandi', description: '2FA kaliti buferga olindi.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const factorId = enrollmentData?.factorId;
    if (!factorId) return;

    if (!/^\d{6}$/.test(code.trim())) {
      setErrorMessage('Iltimos, 6 xonali raqamli kodni kiriting.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    try {
      await AdminMfaService.verifyCode(factorId, code);
      toast({
        title: 'Muvaffaqiyatli ✅',
        description: '2FA ikki bosqichli himoyasi faollashtirildi.',
      });
      await loadStatus();
      setCode('');
    } catch (err: any) {
      setErrorMessage(err?.message || "Noto'g'ri kod kiritildi.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnenroll = async () => {
    if (!status?.factorId) return;
    if (!confirm('Haqiqatan ham 2FA himoyasini o‘chirmoqchimisiz?')) return;

    setIsUnenrolling(true);
    try {
      await AdminMfaService.unenrollFactor(status.factorId);
      toast({
        title: '2FA O‘chirildi',
        description: 'Ikki bosqichli himoya o‘chirildi.',
      });
      await loadStatus();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || '2FA ni o‘chirishda xatolik yuz berdi.',
      });
    } finally {
      setIsUnenrolling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 text-foreground shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
            {status?.isMfaEnrolled ? (
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-indigo-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black">Ikki Bosqichli Himoya (2FA)</h3>
            <p className="text-xs text-muted-foreground">
              Google Authenticator yoki 1Password orqali xavfsizlik
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : status?.isMfaEnrolled ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={18} /> 2FA Himoyasi Faol
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Hisobingiz <strong>{status.factorName}</strong> orqali ikki bosqichli himoyalangan.
                Admin paneliga kirishda har safar 6 xonali bir martalik kod talab qilinadi.
              </p>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleUnenroll}
                disabled={isUnenrolling}
                className="border-rose-500/30 text-xs text-rose-500 hover:bg-rose-500/10"
              >
                {isUnenrolling ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}{' '}
                2FA ni O'chirish
              </Button>
              <Button variant="default" onClick={onClose} className="px-5 text-xs font-bold">
                Yopish
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted/30 p-4">
              {isEnrolling ? (
                <div className="flex h-36 w-36 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : enrollmentData?.qrCodeUrl ? (
                <div className="rounded-xl bg-white p-2 shadow-xs">
                  <img src={enrollmentData.qrCodeUrl} alt="2FA QR Code" className="h-36 w-36" />
                </div>
              ) : (
                <Button variant="outline" onClick={initiateEnrollment} className="text-xs">
                  <RefreshCw size={14} className="mr-1.5" /> QR kodni yuklash
                </Button>
              )}

              {enrollmentData?.secret && (
                <div className="mt-3 w-full">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-1.5">
                    <code className="font-mono text-xs font-bold text-foreground">
                      {enrollmentData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copied ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ilovadagi 6 xonali kod
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ''));
                      setErrorMessage(null);
                    }}
                    placeholder="123456"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-center font-mono text-xl font-bold tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <KeyRound className="absolute right-3 top-3 text-muted-foreground" size={18} />
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-center text-xs font-medium text-rose-500">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                disabled={isVerifying || code.length !== 6}
                className="w-full font-bold"
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Tekshirilmoqda...
                  </span>
                ) : (
                  '2FA ni Faollashtirish'
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
