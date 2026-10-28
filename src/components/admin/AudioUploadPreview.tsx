import React, { useState, useRef } from 'react';
import {
  Upload,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  RefreshCw,
  FileAudio,
  User,
  Languages,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  validateAudioFile,
  publicAudioUrl,
  checkAudioHealth,
  type ListeningAudio,
  type AudioHealthReport,
} from '../../services/ListeningAudioService';

interface AudioUploadPreviewProps {
  audio: ListeningAudio | null;
  onChange: (updates: Partial<ListeningAudio>) => void;
  onUpload: (file: File) => void;
  onRemoveAudio?: () => void;
  isUploading?: boolean;
}

export const AudioUploadPreview: React.FC<AudioUploadPreviewProps> = ({
  audio,
  onChange,
  onUpload,
  onRemoveAudio,
  isUploading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<AudioHealthReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const previewUrl = audio?.audio_url ? publicAudioUrl(audio.audio_url) : null;

  // Format seconds into M:SS
  const formatDuration = (sec: number | null | undefined) => {
    if (sec === null || sec === undefined || isNaN(sec) || sec <= 0) return '-';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const validation = validateAudioFile(f);
    if (!validation.ok) {
      setFileError(validation.message);
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(f);
    setHealthStatus(null);
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) return;
    onUpload(selectedFile);
    setSelectedFile(null);
  };

  const handleCheckHealth = async () => {
    if (!audio?.audio_url) {
      setHealthStatus({
        exists: false,
        playable: false,
        status: 'missing',
        message: 'Audio fayl hali yuklanmagan.',
      });
      return;
    }
    setIsChecking(true);
    try {
      const report = await checkAudioHealth(audio.audio_url);
      setHealthStatus(report);
      if (report.duration && (!audio.duration_seconds || audio.duration_seconds <= 0)) {
        onChange({ duration_seconds: report.duration });
      }
    } catch (err: any) {
      setHealthStatus({
        exists: false,
        playable: false,
        status: 'missing',
        message: err?.message || 'Tekshirishda xatolik yuz berdi.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Choukai Audio Fayl (MP3 / WAV)
            </h4>
            <p className="text-[11px] text-slate-500">
              Tinglash imtihoni uchun audio yuklash, davomiylik va tekshiruv
            </p>
          </div>
        </div>

        {audio?.audio_url && onRemoveAudio && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemoveAudio}
            className="gap-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Faylni o'chirish
          </Button>
        )}
      </div>

      {/* File Upload & Dropzone */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative inline-flex cursor-pointer items-center justify-center">
          <input
            type="file"
            accept=".mp3,.wav,audio/mpeg,audio/mp3,audio/wav,audio/x-wav"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="sr-only"
            data-testid="audio-file-input"
          />
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Upload className="h-4 w-4 text-indigo-500" />
            <span>{selectedFile ? selectedFile.name : 'MP3 / WAV fayl tanlash...'}</span>
          </div>
        </label>

        {selectedFile && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
            <Button
              size="sm"
              onClick={handleUploadSubmit}
              disabled={isUploading}
              className="gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Yuklanmoqda...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" /> Saqlash omboriga yuklash
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {fileError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* Audio Player Preview & Health Verification */}
      {previewUrl ? (
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <FileAudio className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Audio Pleyer (Preview)
                </p>
                <p className="text-[11px] text-slate-500">
                  Davomiylik: {formatDuration(audio?.duration_seconds)}
                  {audio?.duration_seconds ? ` (${audio.duration_seconds} soniya)` : ''}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckHealth}
              disabled={isChecking}
              className="gap-1.5 rounded-xl text-xs font-bold"
              data-testid="check-audio-health-btn"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Tekshirilmoqda...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-blue-500" /> Audio ishlashini tekshirish
                </>
              )}
            </Button>
          </div>

          {/* HTML5 Audio Player */}
          <div className="w-full">
            <audio
              ref={audioRef}
              controls
              src={previewUrl}
              className="w-full rounded-lg"
              data-testid="audio-preview-player"
              onLoadedMetadata={(e) => {
                const el = e.currentTarget;
                if (el.duration && (!audio?.duration_seconds || audio.duration_seconds <= 0)) {
                  onChange({ duration_seconds: Math.round(el.duration) });
                }
              }}
            />
          </div>

          {/* Health Status Banner */}
          {healthStatus && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed ${
                healthStatus.status === 'ok'
                  ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-300'
                  : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-300'
              }`}
              data-testid="audio-health-banner"
            >
              {healthStatus.status === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <div>
                <p className="font-bold">
                  {healthStatus.status === 'ok' ? 'Audio holati: Alo' : 'Audio holatida muammo bor'}
                </p>
                <p className="mt-0.5">{healthStatus.message}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
          Audio fayl hali yuklanmagan. Yuqoridagi tugma orqali MP3 yoki WAV fayl yuklang.
        </div>
      )}

      {/* Metadata Fields: Speaker, Transcript, Uzbek translation */}
      <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              Audio Sarlavhasi
            </label>
            <input
              type="text"
              value={audio?.title ?? ''}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Masalan: Mondai 1 - Tanaka va Satou suhbati"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              So‘zlovchi / Spiker (Speaker)
            </label>
            <input
              type="text"
              value={audio?.speaker ?? ''}
              onChange={(e) => onChange({ speaker: e.target.value })}
              placeholder="Masalan: 田中 (erkak), 佐藤 (ayol)"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Languages className="h-3.5 w-3.5 text-indigo-500" />
            Yaponcha Transkript (Script / Matn)
          </label>
          <textarea
            rows={3}
            value={audio?.transcript ?? ''}
            onChange={(e) => onChange({ transcript: e.target.value })}
            placeholder="男の人と女の人が話しています。男の人はこの後まず何をしますか..."
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-sans text-xs leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Languages className="h-3.5 w-3.5 text-emerald-500" />
            O‘zbekcha Tarjima (Uzbek translation)
          </label>
          <textarea
            rows={2}
            value={audio?.uz_translation ?? ''}
            onChange={(e) => onChange({ uz_translation: e.target.value })}
            placeholder="Erkak va ayol gaplashmoqda. Erkak kishi bundan keyin birinchi nima qiladi..."
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>
    </div>
  );
};
