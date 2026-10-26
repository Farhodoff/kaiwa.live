import React from 'react';
import { Mic, Settings as SettingsIcon } from 'lucide-react';
import { CoachPersona, PERSONAS_BY_LANG } from './speakingTypes';

interface CoachTopBarProps {
  language: 'en' | 'ja';
  persona: CoachPersona;
  isLiveSession: boolean;
  sessionSeconds: number;
  onOpenSettings: () => void;
  activeScenario?: any;
  formatTimer: (sec: number) => string;
  isAdmin?: boolean;
  targetLevel?: string;
  setTargetLevel?: (level: any) => void;
  speechSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  onOpenPitchTrainer?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const CoachTopBar: React.FC<CoachTopBarProps> = ({
  language,
  persona,
  isLiveSession,
  sessionSeconds,
  onOpenSettings,
  activeScenario,
  formatTimer,
}) => {
  const personas = PERSONAS_BY_LANG[language];
  const currentPersona = personas[persona];
  const Icon = currentPersona.icon || Mic;
  const title = isLiveSession ? activeScenario?.title_uz || currentPersona.name : 'Yapon tili';

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/20 px-4 text-white backdrop-blur-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary">
          {isLiveSession && activeScenario?.emoji ? (
            <span aria-hidden="true">{activeScenario.emoji}</span>
          ) : (
            <Icon size={17} />
          )}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
            {title}
          </h1>
          {isLiveSession ? (
            <p className="flex items-center gap-1.5 text-[10px] font-medium text-white/65 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Suhbat davom etmoqda · {formatTimer(sessionSeconds)}
            </p>
          ) : null}
        </div>
      </div>

      {isLiveSession && (
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Speaking sozlamalari"
          title="Sozlamalar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-slate-950/45 text-white/75 transition hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <SettingsIcon size={18} />
        </button>
      )}
    </header>
  );
};
