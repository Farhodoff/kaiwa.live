import React, { useState, useEffect, useCallback } from 'react';
import {
  WifiOff,
  RefreshCw,
  AlertCircle,
  Volume2,
  CloudOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OfflineSyncManager, StorageDiagnostics } from '../../services/OfflineSyncManager';
import { useStudyData } from '../../context/StudyPlannerContext';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../hooks/use-toast';

export const OfflineSyncStatusBar: React.FC = () => {
  const { user } = useStudyData();
  const { language } = useLanguage();
  const isJa = language === 'ja';

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [diagnostics, setDiagnostics] = useState<StorageDiagnostics | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const refreshStatus = useCallback(async () => {
    try {
      const diag = await OfflineSyncManager.getDiagnostics(user?.id);
      setDiagnostics(diag);
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    } catch {
      // Ignore background diagnostic check errors
    }
  }, [user?.id]);

  useEffect(() => {
    refreshStatus();

    const handleOnline = () => {
      setIsOnline(true);
      refreshStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 30 seconds
    const interval = setInterval(refreshStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshStatus]);

  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    try {
      const res = await OfflineSyncManager.syncAll(true);
      await refreshStatus();
      if (res.totalFailed === 0) {
        toast({
          title: isJa ? '同期完了' : 'Sinxronlash muvaffaqiyatli',
          description: isJa
            ? `${res.totalSynced}件の結果がサーバーに正常に同期されました。`
            : `${res.totalSynced} ta natija serverga muvaffaqiyatli saqlandi.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: isJa ? '同期保留' : 'Qisman sinxronlanmadi',
          description: isJa
            ? `${res.totalSynced}件成功、${res.totalFailed}件失敗。再試行されます。`
            : `${res.totalSynced} ta saqlandi, ${res.totalFailed} ta natija navbatda qoldi. Qayta uriniladi.`,
        });
      }
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: isJa ? '同期エラー' : 'Sinxronlash xatosi',
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const totalPending = diagnostics?.totalPending || 0;

  // If online and nothing is pending sync, stay invisible to keep layout clean
  if (isOnline && totalPending === 0) {
    return null;
  }

  return (
    <div className="w-full border-b border-border transition-all duration-300">
      {/* Offline Mode Banner */}
      {!isOnline ? (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 px-4 py-2.5 text-xs text-white shadow-md">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <WifiOff className="h-4 w-4 text-white" />
              </span>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {isJa ? '⚠️ オフラインモード' : '⚠️ Oflayn Rejim'}
                </span>
                <span className="ml-2 opacity-95">
                  {isJa
                    ? 'AI評価とクラウド同期は一時休止中。教材と単語帳は端末ローカルで利用可能です。'
                    : "AI tahlili va bulutli sinxronlash vaqtincha to'xtatildi. Darslar va lug'atlar lokal ishlaydi."}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold transition hover:bg-white/25"
              >
                <span>{isJa ? '詳細' : 'Batafsil'}</span>
                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>

          {/* Expanded Offline Disclaimers */}
          {isExpanded && (
            <div className="mx-auto mt-2.5 grid max-w-7xl grid-cols-1 gap-2 border-t border-white/20 pt-2.5 text-[11px] sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-300" />
                <span>
                  <strong>AI Cheklovi:</strong> AI Speaking & Writing Internet ulanganda ishlaydi.
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2">
                <Volume2 className="h-4 w-4 shrink-0 text-amber-300" />
                <span>
                  <strong>Audio Fallback:</strong> Ovozlar qurilmaning mahalliy TTS tizimida ijro
                  etiladi.
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2">
                <CloudOff className="h-4 w-4 shrink-0 text-amber-300" />
                <span>
                  <strong>Lokal Saqlash:</strong> {totalPending} ta o'zgarish qurilmangizda xavfsiz
                  turibdi.
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Online with Pending Changes */
        totalPending > 0 && (
          <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-foreground">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CloudOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {totalPending}{' '}
                  {isJa
                    ? '件のローカル変更が未同期です'
                    : 'ta natija hali serverga sinxronlanmagan (Lokal saqlangan)'}
                </span>
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-500/30 disabled:opacity-40 dark:text-amber-300"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing
                    ? isJa
                      ? '同期中...'
                      : 'Sinxronlanmoqda...'
                    : isJa
                      ? '今すぐ同期'
                      : 'Hozir sinxronlash'}
                </span>
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
