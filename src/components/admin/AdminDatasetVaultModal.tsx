import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Send,
  RefreshCw,
  Database,
  Mic,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Flame,
  BarChart3,
  Clock,
  Sparkles,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import JSZip from 'jszip';
import { TelegramDatasetService, DailySpeechSummary } from '../../services/TelegramDatasetService';
import { toast } from '../../hooks/use-toast';

interface AdminDatasetVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PeriodFilter = 'TODAY' | 'YESTERDAY' | '7DAYS' | 'ALL' | 'CUSTOM';

export const AdminDatasetVaultModal: React.FC<AdminDatasetVaultModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [summary, setSummary] = useState<DailySpeechSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  // Period state
  const [period, setPeriod] = useState<PeriodFilter>('TODAY');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Telegram Settings
  const [chatId, setChatId] = useState('');
  const [isConfigSaved, setIsConfigSaved] = useState(false);

  const resolveTargetDate = (p: PeriodFilter, cDate: string): string => {
    if (p === 'ALL') return 'ALL';
    if (p === '7DAYS') return '7DAYS';
    if (p === 'YESTERDAY') {
      const y = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return y.toISOString().split('T')[0];
    }
    if (p === 'CUSTOM') return cDate;
    return new Date().toISOString().split('T')[0];
  };

  const loadData = async (
    targetPeriod: PeriodFilter = period,
    targetCustomDate: string = customDate,
  ) => {
    setIsLoading(true);
    try {
      const queryDate = resolveTargetDate(targetPeriod, targetCustomDate);
      const data = await TelegramDatasetService.getDailySummary(queryDate);
      setSummary(data);

      const config = TelegramDatasetService.getStoredConfig();
      setChatId(config.chatId);
    } catch (err) {
      console.error('Failed to load dataset summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData(period, customDate);
    }
  }, [isOpen, period, customDate]);

  const handlePeriodChange = (newPeriod: PeriodFilter) => {
    setPeriod(newPeriod);
  };

  const handleSaveTelegramConfig = (e: React.FormEvent) => {
    e.preventDefault();
    TelegramDatasetService.saveConfig(chatId);
    setIsConfigSaved(true);
    setTimeout(() => setIsConfigSaved(false), 2500);
    toast({
      title: '✅ Maxfiy Sozlamalar Saqlandi',
      description: 'Telegram Kanal / Guruh Chat ID saqlandi.',
    });
  };

  const handleSendTelegramNow = async () => {
    if (!summary) return;
    setIsSendingTelegram(true);
    try {
      const res = await TelegramDatasetService.sendDailyReportToTelegram(summary);
      if (res.success) {
        toast({
          title: '✈️ Telegramga Yuborildi',
          description: res.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Xatolik',
          description: res.message,
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Yuborishda xatolik',
        description: err.message,
      });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const handleDownloadZipDataset = async () => {
    if (!summary || summary.sessions.length === 0) {
      toast({
        title: "Dataset bo'sh",
        description:
          'Tanlangan muddat uchun ovozli suhbatlar topilmadi. "Barcha Datasetlar" tugmasini tanlab ko\'ring.',
      });
      return;
    }

    setIsExportingZip(true);
    try {
      const zip = new JSZip();

      // 1. Build metadata.jsonl for ML training pipelines (Hugging Face / PyTorch / Whisper fine-tuning standard)
      // PRIVACY STRICT: user emails and full names are completely excluded.
      const jsonlLines = summary.sessions
        .map((s, index) => {
          const fullText = s.transcript
            .map((t) => `${t.role === 'user' ? 'User' : 'AI'}: ${t.content}`)
            .join('\n');
          const userOnlyText = s.transcript
            .filter((t) => t.role === 'user')
            .map((t) => t.content)
            .join(' ');

          return JSON.stringify({
            session_id: s.id,
            index: index + 1,
            anonymous_user_id: s.anonymousUserId,
            created_at: s.createdAt,
            language: s.language,
            topic: s.topic,
            duration_seconds: s.durationSeconds,
            score: s.score,
            turn_count: s.transcript.length,
            user_speech_text: userOnlyText,
            full_text: fullText,
            full_dialogue: s.transcript,
          });
        })
        .join('\n');

      zip.file('metadata.jsonl', jsonlLines);

      // 2. Human-readable text archive (Clean & Beautiful)
      let humanReadableText = `================================================================================\n`;
      humanReadableText += `KAIWA.LIVE SPEECH DATASET ARCHIVE\n`;
      humanReadableText += `Export Timestamp: ${new Date().toISOString()}\n`;
      humanReadableText += `Dataset Filter: ${summary.date}\n`;
      humanReadableText += `Total Sessions: ${summary.totalSessions} | Total Duration: ${summary.totalDurationMinutes} min | Active Users: ${summary.activeUsersCount}\n`;
      humanReadableText += `PRIVACY NOTICE: All user emails and PII have been anonymized for AI Model Training.\n`;
      humanReadableText += `================================================================================\n\n`;

      summary.sessions.forEach((s, idx) => {
        humanReadableText += `--------------------------------------------------------------------------------\n`;
        humanReadableText += `[SESSION #${idx + 1}] ID: ${s.id}\n`;
        humanReadableText += `ANONYMOUS USER: ${s.anonymousUserId} | CREATED AT: ${s.createdAt}\n`;
        humanReadableText += `LANGUAGE: ${s.language.toUpperCase()} | TOPIC: ${s.topic} | DURATION: ${Math.round(s.durationSeconds)}s | SCORE: ${s.score}%\n`;
        humanReadableText += `--------------------------------------------------------------------------------\n`;
        if (s.transcript && s.transcript.length > 0) {
          s.transcript.forEach((t) => {
            humanReadableText += `${t.role === 'user' ? '👤 USER' : '🤖 AI'}: ${t.content}\n`;
          });
        } else {
          humanReadableText += `(Bo'sh transkript / Faqat ovozli sessiya)\n`;
        }
        humanReadableText += `\n`;
      });

      zip.file('transcripts.txt', humanReadableText);

      // 3. Sanitized Summary JSON
      const sanitizedSummary = {
        date: summary.date,
        totalSessions: summary.totalSessions,
        totalDurationMinutes: summary.totalDurationMinutes,
        activeUsersCount: summary.activeUsersCount,
        topTopics: summary.topTopics,
        topMistakes: summary.topMistakes,
        sessions: summary.sessions.map((s) => ({
          id: s.id,
          anonymousUserId: s.anonymousUserId,
          language: s.language,
          topic: s.topic,
          durationSeconds: s.durationSeconds,
          score: s.score,
          createdAt: s.createdAt,
          turnCount: s.transcript.length,
        })),
      };
      zip.file('summary.json', JSON.stringify(sanitizedSummary, null, 2));

      // 4. Audio folder (if any recorded blob URLs exist in session)
      const audioFolder = zip.folder('audios');
      for (const s of summary.sessions) {
        if (s.audioUrl && (s.audioUrl.startsWith('blob:') || s.audioUrl.startsWith('http'))) {
          try {
            const response = await fetch(s.audioUrl);
            const blob = await response.blob();
            audioFolder?.file(`session_${s.id}.webm`, blob);
          } catch (fetchErr) {
            console.warn(`Audio fetch skipped for session ${s.id}:`, fetchErr);
          }
        }
      }

      // Generate zip file and trigger browser download
      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const filenameDate = summary.date.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `dataset_${filenameDate}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: '📦 Dataset Yuklandi',
        description: `dataset_${filenameDate}.zip fayli muvaffaqiyatli saqlandi! (${summary.totalSessions} ta suhbat)`,
      });
    } catch (err: any) {
      console.error('ZIP generation error:', err);
      toast({
        variant: 'destructive',
        title: 'Eksportda xatolik',
        description: err.message || 'ZIP yaratishda xatolik yuz berdi.',
      });
    } finally {
      setIsExportingZip(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md duration-200 animate-in fade-in md:p-6">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl duration-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card p-5 text-foreground">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-primary/25 bg-primary/10 p-2.5 text-primary">
              <Lock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-black tracking-tight text-foreground">
                  AI Speech Dataset & Voice Vault
                </h2>
                <span className="rounded-full border border-[#C9A961]/30 bg-[#C9A961]/15 px-2 py-0.5 text-[10px] font-bold text-[#C9A961]">
                  SECRET ADMIN PORTAL
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ovozli suhbatlar, transkriptlar, xatolar tahlili va model train qilish arxivi
                (Anonim & Xavfsiz)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-6 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <Calendar size={13} /> Davr:
            </span>
            <button
              onClick={() => handlePeriodChange('TODAY')}
              className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                period === 'TODAY'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Bugun
            </button>
            <button
              onClick={() => handlePeriodChange('YESTERDAY')}
              className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                period === 'YESTERDAY'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Kecha
            </button>
            <button
              onClick={() => handlePeriodChange('7DAYS')}
              className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                period === '7DAYS'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Oxirgi 7 kun
            </button>
            <button
              onClick={() => handlePeriodChange('ALL')}
              className={`flex cursor-pointer items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                period === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>Barchasi (All Time)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setPeriod('CUSTOM');
              }}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
            <button
              onClick={() => loadData(period, customDate)}
              disabled={isLoading}
              className="cursor-pointer rounded-xl bg-muted p-1.5 text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground"
              title="Yangilash"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-foreground">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <p className="text-xs font-semibold">Ovozli ma'lumotlar tahlili yuklanmoqda...</p>
            </div>
          ) : (
            <>
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1 rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mic size={14} className="text-primary" />
                    <span>Suhbatlar</span>
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {summary?.totalSessions || 0} ta
                  </div>
                </div>

                <div className="space-y-1 rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock size={14} className="text-emerald-400" />
                    <span>Umumiy Vaqt</span>
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {summary?.totalDurationMinutes || 0} daq
                  </div>
                </div>

                <div className="space-y-1 rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Flame size={14} className="text-amber-400" />
                    <span>Faol O'quvchilar</span>
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {summary?.activeUsersCount || 0} nafar
                  </div>
                </div>

                <div className="space-y-1 rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Database size={14} className="text-[#C9A961]" />
                    <span>Filtr / Sana</span>
                  </div>
                  <div className="truncate pt-1 text-sm font-bold text-foreground">
                    {period === 'ALL'
                      ? 'Barchasi (All Time)'
                      : period === '7DAYS'
                        ? 'Oxirgi 7 kun'
                        : summary?.date || 'Bugun'}
                  </div>
                </div>
              </div>

              {summary?.totalSessions === 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-600 dark:text-amber-400">
                  <span>
                    ℹ️ Tanlangan sana uchun suhbatlar topilmadi. Barcha mavjud suhbatlarni ko'rish
                    uchun <b>"Barcha Datasetlar"</b> tugmasini bosing.
                  </span>
                  <button
                    onClick={() => handlePeriodChange('ALL')}
                    className="cursor-pointer rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-amber-500"
                  >
                    Barchasini Ko'rish
                  </button>
                </div>
              )}

              {/* Deep Breakdown: Top Topics & Top Grammar Mistakes */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Top Topics */}
                <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
                      <BarChart3 size={14} className="text-primary" />
                      <span>Eng Ko'p Gaplashilgan Mavzular</span>
                    </h3>
                    <span className="text-[10px] text-muted-foreground">Top 5</span>
                  </div>

                  {summary?.topTopics && summary.topTopics.length > 0 ? (
                    <div className="space-y-2">
                      {summary.topTopics.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl bg-muted/40 p-2 text-xs"
                        >
                          <span className="max-w-[200px] truncate font-semibold">
                            {i + 1}. {t.topic}
                          </span>
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary">
                            {t.count} ta
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      Tanlangan muddatda mavzular qayd etilmadi.
                    </div>
                  )}
                </div>

                {/* Top Grammar Mistakes */}
                <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
                      <AlertTriangle size={14} className="text-rose-400" />
                      <span>Ko'p Uchragan Xatolar</span>
                    </h3>
                    <span className="text-[10px] text-muted-foreground">Grammar Log</span>
                  </div>

                  {summary?.topMistakes && summary.topMistakes.length > 0 ? (
                    <div className="space-y-2">
                      {summary.topMistakes.map((m, i) => (
                        <div
                          key={i}
                          className="space-y-0.5 rounded-xl border border-rose-500/15 bg-rose-500/5 p-2 text-xs"
                        >
                          <div className="text-[11px] text-rose-500 line-through">{m.mistake}</div>
                          <div className="flex items-center justify-between font-bold text-emerald-500">
                            <span>➔ {m.correction}</span>
                            <span className="text-[10px] text-muted-foreground">({m.count}x)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      Tanlangan muddat uchun grammatik xatolar qayd etilmadi.
                    </div>
                  )}
                </div>
              </div>

              {/* Telegram Config & 22:00 Dispatch Section */}
              <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Send size={16} className="text-primary" />
                      <span>Telegram Yopiq Kanalga Kunlik Yuborish (22:00)</span>
                    </h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Suhbat transkriptlari va kunlik tahliliy hisobotni Telegram yopiq guruhga
                      yuborish
                    </p>
                  </div>
                  <button
                    onClick={handleSendTelegramNow}
                    disabled={isSendingTelegram || !chatId}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSendingTelegram ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    <span>Hozir Telegramga Yuborish</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={16} className="shrink-0" />
                  <span>
                    <b>Xavfsizlik:</b> Telegram Bot Token server muhitida (Supabase Secrets /
                    Environment) xavfsiz sozlangan. Brauzerda kalit talab etilmaydi.
                  </span>
                </div>

                <form
                  onSubmit={handleSaveTelegramConfig}
                  className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3"
                >
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold text-muted-foreground">
                      Yopiq Kanal / Guruh Chat ID:
                    </label>
                    <input
                      type="text"
                      placeholder="-1001234567890"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-muted py-2 text-xs font-bold text-foreground transition-all hover:bg-muted/80"
                    >
                      {isConfigSaved ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <Database size={14} />
                      )}
                      <span>{isConfigSaved ? 'Saqlandi!' : 'Chat ID Saqlash'}</span>
                    </button>
                  </div>
                </form>

                {isConfigSaved && (
                  <div className="px-1 text-[10px] font-bold text-emerald-500 animate-in slide-in-from-top-1">
                    ✅ Sozlamalar muvaffaqiyatli saqlandi!
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles size={14} className="shrink-0 text-primary" />
            <span>
              Fayl arxivi: <code>metadata.jsonl</code> + <code>transcripts.txt</code> (Privacy & AI
              Train Ready)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              Yopish
            </button>

            <button
              onClick={handleDownloadZipDataset}
              disabled={isExportingZip || (summary?.totalSessions || 0) === 0}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {isExportingZip ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>📦 Datasetni Yuklab Olish (.ZIP) ({summary?.totalSessions || 0} ta)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
