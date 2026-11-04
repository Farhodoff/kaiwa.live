import React from 'react';
import { Play, Pause, RotateCcw, Volume2, Mic } from 'lucide-react';

interface VoicePlaybackBarProps {
  recordedUrl: string | null;
  durationSeconds: number;
  isPlaying: boolean;
  audioProgress: number;
  onPlay: () => void;
  onPause: () => void;
  onClear?: () => void;
  title?: string;
}

export const VoicePlaybackBar: React.FC<VoicePlaybackBarProps> = ({
  recordedUrl,
  durationSeconds,
  isPlaying,
  audioProgress,
  onPlay,
  onPause,
  onClear,
  title = 'Sizning ovozli yozuv va talaffuzingiz',
}) => {
  if (!recordedUrl) return null;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <span className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-500">
            <Mic size={14} />
          </span>
          <span>{title}</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {formatSeconds(durationSeconds)}
        </span>
      </div>

      {/* Audio Wave Visualizer & Progress Bar */}
      <div className="relative flex h-8 w-full items-center gap-1 overflow-hidden rounded-xl bg-muted/40 px-3">
        {/* Simulated Waveform Bars */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 opacity-30">
          {[40, 75, 30, 90, 60, 100, 45, 80, 55, 95, 40, 70, 85, 35, 90, 65, 50, 80, 40, 75].map(
            (h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full ${isPlaying ? 'animate-pulse bg-indigo-500' : 'bg-foreground'}`}
                style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }}
              />
            ),
          )}
        </div>

        {/* Progress bar fill */}
        <div
          className="absolute bottom-0 left-0 top-0 border-r-2 border-indigo-500 bg-indigo-500/20 transition-all duration-150"
          style={{ width: `${audioProgress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
            >
              <Pause size={14} />
              <span>Pauza</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
            >
              <Play size={14} />
              <span>Ovozni eshitish</span>
            </button>
          )}

          {onClear && (
            <button
              onClick={onClear}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              title="Yazuvni tozalash"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Volume2 size={13} />
          <span>Mikrofon yozuvi tayyor</span>
        </div>
      </div>
    </div>
  );
};
