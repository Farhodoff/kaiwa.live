import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileJson,
  FileSpreadsheet,
  History,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from '../../hooks/use-toast';
import { sanitizeErrorMessage } from '../ErrorBoundary';
import {
  ExamContentVersion,
  ExamImportBatch,
  ExamImportBatchItem,
  ExamImportHistoryService,
} from '../../services/ExamImportHistoryService';

export interface ExamImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examTitle?: string;
  onChanged?: () => void;
}

type Tab = 'batches' | 'versions';

type ConfirmAction = {
  type: 'rollback' | 'revert' | 'previous';
  id: string;
  title: string;
  description: string;
  versionNumber?: number;
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('uz-UZ');
  } catch {
    return value;
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case 'applied':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'rolled_back':
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300';
    case 'failed':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'applied':
      return 'Qo‘llangan';
    case 'rolled_back':
      return 'Rollback qilingan';
    case 'failed':
      return 'Xato';
    default:
      return 'Kutilmoqda';
  }
};

const modeLabel = (mode: string) => {
  switch (mode) {
    case 'section':
      return "Bo'limga import";
    case 'full-exam':
      return 'Yangi imtihon';
    case 'existing-exam':
      return 'Mavjud imtihonga';
    default:
      return mode;
  }
};

export const ExamImportHistoryModal: React.FC<ExamImportHistoryModalProps> = ({
  isOpen,
  onClose,
  examId,
  examTitle,
  onChanged,
}) => {
  const [tab, setTab] = useState<Tab>('batches');
  const [batches, setBatches] = useState<ExamImportBatch[]>([]);
  const [versions, setVersions] = useState<ExamContentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [batchItems, setBatchItems] = useState<Record<string, ExamImportBatchItem[]>>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmReason, setConfirmReason] = useState('');

  const loadData = async () => {
    if (!examId) return;
    setIsLoading(true);
    try {
      const [batchList, versionList] = await Promise.all([
        ExamImportHistoryService.listImportBatches({ examId }),
        ExamImportHistoryService.listVersions(examId),
      ]);
      setBatches(batchList);
      setVersions(versionList);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Tarixni yuklashda xatolik',
        description: sanitizeErrorMessage(err?.message || ''),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && examId) {
      setExpandedBatchId(null);
      setBatchItems({});
      setConfirmAction(null);
      setConfirmReason('');
      void loadData();
    }
  }, [isOpen, examId]);

  const toggleBatch = async (batchId: string) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId(null);
      return;
    }
    setExpandedBatchId(batchId);
    if (!batchItems[batchId]) {
      try {
        const items = await ExamImportHistoryService.getBatchQuestions(batchId);
        setBatchItems((prev) => ({ ...prev, [batchId]: items }));
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Batch savollarini olishda xatolik',
          description: sanitizeErrorMessage(err?.message || ''),
        });
      }
    }
  };

  const requestRollback = (batch: ExamImportBatch) => {
    setConfirmReason('');
    setConfirmAction({
      type: 'rollback',
      id: batch.id,
      title: 'Import batchni rollback qilish',
      description: `Batch ${batch.id.slice(0, 8)}… orqali qo'shilgan ${batch.question_count} ta savol o'chiriladi. Bu amalni faqat admin tasdiqlashi mumkin.`,
    });
  };

  const requestRevert = (version: ExamContentVersion) => {
    setConfirmReason('');
    setConfirmAction({
      type: 'revert',
      id: version.id,
      versionNumber: version.version_number,
      title: `${version.version_number}-versiyaga qaytish`,
      description:
        'Joriy imtihon contenti ushbu snapshot bilan to‘liq almashtiriladi. Avval xavfsizlik snapshoti avtomatik yaratiladi.',
    });
  };

  const requestPreviousVersion = () => {
    if (versions.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Oldingi versiya topilmadi',
        description: "Qaytish uchun kamida 2 ta versiya snapshoti bo'lishi kerak.",
      });
      return;
    }
    setConfirmReason('');
    setConfirmAction({
      type: 'previous',
      id: examId,
      title: 'Oldingi versiyaga qaytish',
      description:
        'Imtihon contenti oldingi versiya snapshotiga qaytariladi. Bu amal faqat admin tasdig‘i bilan bajariladi.',
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    setIsActionLoading(true);
    try {
      if (confirmAction.type === 'rollback') {
        const res = await ExamImportHistoryService.rollbackBatch(confirmAction.id, {
          adminConfirmed: true,
          reason: confirmReason.trim() || undefined,
        });
        toast({
          title: 'Rollback bajarildi',
          description: `${res.deletedCount} ta savol o'chirildi.`,
        });
      } else if (confirmAction.type === 'revert') {
        const res = await ExamImportHistoryService.revertToVersion(confirmAction.id, {
          adminConfirmed: true,
          reason: confirmReason.trim() || undefined,
        });
        toast({
          title: 'Versiya tiklandi',
          description: `${res.versionNumber}-versiya: ${res.restoredQuestions} ta savol.`,
        });
      } else {
        const res = await ExamImportHistoryService.revertToPreviousVersion(examId, {
          adminConfirmed: true,
          reason: confirmReason.trim() || undefined,
        });
        toast({
          title: 'Oldingi versiya tiklandi',
          description: `${res.versionNumber}-versiya: ${res.restoredQuestions} ta savol.`,
        });
      }
      setConfirmAction(null);
      setConfirmReason('');
      await loadData();
      onChanged?.();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Amal bajarilmadi',
        description: sanitizeErrorMessage(err?.message || ''),
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setIsActionLoading(true);
    try {
      await ExamImportHistoryService.downloadExamExport(examId, format);
      toast({
        title: 'Eksport tayyor',
        description: `Imtihon ${format.toUpperCase()} formatida yuklandi.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Eksport xatoligi',
        description: sanitizeErrorMessage(err?.message || ''),
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const appliedCount = batches.filter((batch) => batch.status === 'applied').length;
  const totalImported = batches.reduce((sum, batch) => sum + (batch.question_count || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
              <History className="h-5 w-5 text-indigo-600" /> Import tarixi va versiyalar
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {examTitle || 'Imtihon'} — kim, qachon va qancha savol import qilgani
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Batchlar: {batches.length}
            </span>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              Qo‘llangan: {appliedCount}
            </span>
            <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
              Jami savol: {totalImported}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isActionLoading}
              onClick={() => handleExport('json')}
            >
              <FileJson className="mr-1.5 h-4 w-4" /> JSON eksport
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isActionLoading}
              onClick={() => handleExport('csv')}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> CSV eksport
            </Button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-slate-100 px-5 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab('batches')}
            className={`rounded-t-xl px-4 py-2 text-xs font-black transition ${
              tab === 'batches'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Import batchlari
          </button>
          <button
            type="button"
            onClick={() => setTab('versions')}
            className={`rounded-t-xl px-4 py-2 text-xs font-black transition ${
              tab === 'versions'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Versiyalar ({versions.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
            </div>
          ) : tab === 'batches' ? (
            <div className="space-y-3">
              {batches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500 dark:border-slate-700">
                  Hali import batchlari mavjud emas.
                </div>
              ) : (
                batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {batch.id.slice(0, 8)}…
                          </code>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusBadge(
                              batch.status,
                            )}`}
                          >
                            {statusLabel(batch.status)}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {modeLabel(batch.mode)}
                          </span>
                          <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                            {batch.question_count} savol
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {batch.imported_by_email || 'Noma’lum admin'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(batch.created_at)}
                          </span>
                          {batch.source_format && <span>Format: {batch.source_format}</span>}
                        </div>
                        {batch.status === 'rolled_back' && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400">
                            Rollback: {formatDate(batch.rolled_back_at)} —{' '}
                            {batch.rolled_back_by_email || 'admin'}
                            {batch.rollback_reason ? ` (${batch.rollback_reason})` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void toggleBatch(batch.id)}
                        >
                          {expandedBatchId === batch.id ? 'Yopish' : 'Savollarni ko‘rish'}
                        </Button>
                        {batch.status === 'applied' && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => requestRollback(batch)}
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Rollback
                          </Button>
                        )}
                      </div>
                    </div>

                    {expandedBatchId === batch.id && (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                        {(batchItems[batch.id] || []).length === 0 ? (
                          <p className="text-xs text-slate-500">
                            Bu batch uchun savol snapshotlari topilmadi.
                          </p>
                        ) : (
                          (batchItems[batch.id] || []).map((item, index) => (
                            <div
                              key={item.id}
                              className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                  {index + 1}.{' '}
                                  {String(
                                    item.question_snapshot?.question_text ||
                                      item.question_snapshot?.question ||
                                      'Savol matni saqlanmagan',
                                  )}
                                </p>
                                <code className="shrink-0 text-[10px] text-slate-400">
                                  {item.question_id ? `${item.question_id.slice(0, 8)}…` : '—'}
                                </code>
                              </div>
                              {item.question_snapshot?.correct_answer && (
                                <p className="mt-1 text-emerald-600 dark:text-emerald-400">
                                  Javob: {String(item.question_snapshot.correct_answer)}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Har bir importdan keyin content snapshoti avtomatik saqlanadi.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={requestPreviousVersion}
                  disabled={versions.length < 2}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Oldingi versiyaga qaytish
                </Button>
              </div>
              {versions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500 dark:border-slate-700">
                  Hali versiya snapshotlari mavjud emas.
                </div>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-black text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                          v{version.version_number}
                        </span>
                        {version.is_current && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Joriy
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {version.label || 'Snapshot'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(version.created_at)} — {version.created_by_email || 'admin'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={version.is_current ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => requestRevert(version)}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Tiklash
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {confirmAction && (
          <div className="border-t border-rose-200 bg-rose-50 p-5 dark:border-rose-900/60 dark:bg-rose-950/30">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-black text-rose-800 dark:text-rose-200">
                    {confirmAction.title}
                  </p>
                  <p className="text-xs text-rose-700/90 dark:text-rose-300/90">
                    {confirmAction.description}
                  </p>
                </div>
                <input
                  value={confirmReason}
                  onChange={(event) => setConfirmReason(event.target.value)}
                  placeholder="Sabab (ixtiyoriy)..."
                  className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-rose-400 dark:border-rose-900 dark:bg-slate-900 dark:text-slate-200"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isActionLoading}
                    onClick={() => setConfirmAction(null)}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isActionLoading}
                    onClick={() => void executeConfirmedAction()}
                  >
                    {isActionLoading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Admin sifatida tasdiqlash
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
