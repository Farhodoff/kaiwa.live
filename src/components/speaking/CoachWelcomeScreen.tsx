import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Mic } from 'lucide-react';
import { LiveAmbientSphere } from './LiveAmbientSphere';

interface CoachWelcomeScreenProps {
  currentPersona: any;
  isLiveSession: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
  promptSuggestions?: any[];
  onStartSession: () => void;
  onPromptClick?: (text: string) => void;
}

export const CoachWelcomeScreen: React.FC<CoachWelcomeScreenProps> = ({
  currentPersona,
  isLiveSession,
  isSpeaking,
  isThinking,
  isListening,
  onStartSession,
}) => {
  const navigate = useNavigate();

  return (
    <div className="scrollbar-hide flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 text-center">
      {/* Dynamic Live Ambient Neon Sphere */}
      <div className="group relative mb-6 cursor-pointer" onClick={onStartSession}>
        {isLiveSession ? (
          <LiveAmbientSphere
            status={
              isSpeaking ? 'speaking' : isThinking ? 'thinking' : isListening ? 'listening' : 'idle'
            }
            size={220}
          />
        ) : (
          <>
            {/* Outer glow rings */}
            <div
              className={`absolute -inset-4 rounded-full bg-gradient-to-tr ${currentPersona.color} pointer-events-none animate-pulse opacity-20 blur-xl`}
            />
            <div className="pointer-events-none absolute -inset-2 rounded-full border border-primary/20" />

            {/* Main orb */}
            <div
              className={`relative h-28 w-28 rounded-full bg-gradient-to-tr sm:h-36 sm:w-36 ${currentPersona.color} p-[3px] shadow-2xl transition-transform duration-300 group-hover:scale-105`}
            >
              <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-full bg-card">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,72,58,0.25)_0%,transparent_70%)] opacity-40" />
                <Mic
                  size={32}
                  className="relative z-10 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                />
                <span className="relative z-10 mt-1 text-[10px] font-extrabold uppercase tracking-widest text-[#C9A961]">
                  Boshlash
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Clean Clean Title & Description — No weird sensei names or noise */}
      <h2 className="mb-2 font-display text-xl font-black text-foreground sm:text-2xl">
        AI Bilan Erkin Muloqot (フリートーク)
      </h2>
      <p className="mb-5 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
        Xohlagan mavzuingizda erkin gapiring. AI sizning ovozingizni tinglab, tabiiy yapon tilida
        suhbatlashadi.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={onStartSession}
          className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95 sm:text-sm"
        >
          <Mic size={16} />
          <span>Suhbatni boshlash</span>
        </button>

        <button
          onClick={() => navigate('/scenarios?lang=ja')}
          className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 text-xs font-medium text-foreground transition-all hover:bg-card active:scale-95 sm:text-sm"
        >
          <LayoutGrid size={15} className="text-primary" />
          <span>Mavzuli ssenariylar</span>
        </button>
      </div>
    </div>
  );
};
