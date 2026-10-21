import React, { useState, useRef } from 'react';
import { Upload, Volume2, Play, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  validateAudioFile,
  publicAudioUrl,
  checkAudioExists,
  type ListeningAudio,
} from '../../services/ListeningAudioService';

interface AudioUploadPreviewProps {
  audio: ListeningAudio | null;
  onChange: (updates: Partial<ListeningAudio>) => void;
  onUpload: (file: File) => void;
  onRemoveAudio: () => void;
  isUploading?: boolean;
}

export const AudioUploadPreview: React.FC<AudioUploadPreviewProps> = ({
  audio,
  onChange,
  onUpload,
  onRemoveAudio,
  isUploading = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'missing'>('idle');
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const validation = validateAudioFile(f);
    if (!validation.ok) {
      alert(validation.message);
      return;
    }
    setFile(f);
    setStatus('idle');
  };

  const handleUpload = () => {
    if (!file) return;
    onUpload(file);
  };

  const handleCheck = async () => {
    if (!audio?.audio_url) {
      setStatus('missing');
      return;
    }
    setStatus('checking');
    const exists = await checkAudioExists(audio.audio_url);
    setStatus(exists ? 'ok' : 'missing');
  };

  const formatDuration = (sec: number | null) => {
    if (!sec) return '-';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const previewUrl = audio?.audio_url ? publicAudioUrl(audio.audio_url) : null;
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          🎧 Audio (MP3 / WAV)
        </span>
        {audio?.audio_url && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRemoveAudio}
            className="text-rose-600 hover:bg-rose-50"
          >
            O'chirish
          </Button>
        )}
      </div>

      <label className="block">
        <input
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/mp3,audio/wav"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="sr-only"
        />
        <Button
          size="sm"
          variant={file ? 'default' : 'outline'}
          disabled={isUploading || !file}
          onClick={handleUpload}
          className="gap-1 rounded-xl"
        >
          <Upload className="h-3.5 w-3.5" />
          {file ? `Yuklash: ${file.name}` : 'Audio yuklash'}
        </Button>
        {isUploading && (
          <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
            <Loader2 className="inline h-3 w-3 animate-spin" /> Yuklanmoqda...
          </span>
        )}
      </label>

      {audio && (
        <div className="flex items-center gap-3 border-t border-slate-200 pt-2 dark:border-slate-700/50">
          {previewUrl ? (
            <>
              <audio ref={audioRef} src={previewUrl} className="w-40" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const el = audioRef.current;
                  if (!el) return;
                  if (el.paused) el.play().catch(() => {});
                  else el.pause();
                }}
                className="gap-1 rounded-xl"
              >
                {audioRef.current?.paused ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
                Tinglash
              </Button>
              <span className="text-xs text-slate-500">
                Davomiylik: {formatDuration(audio.duration_seconds)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCheck}
                disabled={status === 'checking'}
                className="rounded-xl px-2"
              >
                {status === 'checking' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : status === 'ok' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-rose-600" />
                )}
              </Button>
              {status === 'missing' && (
                <span className="text-xs text-rose-600">Fayl topilmadi yoki ochilmaydi.</span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-400">Audio hali yuklanmagan.</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Transkript</label>
          <textarea
            rows={2}
            value={audio?.transcript ?? ''}
            onChange={(e) => onChange({ transcript: e.target.value })}
            placeholder="Transkript..."
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Oʻzbekcha tarjima
          </label>
          <input
            value={audio?.uz_translation ?? ''}
            onChange={(e) => onChange({ uz_translation: e.target.value })}
            placeholder="Tarjima..."
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Suvor (Speaker)
          </label>
          <input
            value={audio?.speaker ?? ''}
            onChange={(e) => onChange({ speaker: e.target.value })}
            placeholder="Suvor..."
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>
    </div>
  );
};
