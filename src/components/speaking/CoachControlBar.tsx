import React, { useState } from 'react';
import { Mic, RotateCcw, MicOff, Send, Square } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { useLanguage } from '../../context/LanguageContext';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

interface CoachControlBarProps {
  isLiveSession: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  sessionSeconds: number;
  chatHistoryLength: number;
  toggleSession: () => void;
  onClearHistory: () => void;
  formatTimer: (sec: number) => string;
  onForceStartListening?: () => void;
  onBargeIn?: () => void;
  isPreparingAudio?: boolean;
  onSendText?: (text: string) => void;
}

export const CoachControlBar: React.FC<CoachControlBarProps> = ({
  isLiveSession,
  isSpeaking,
  isThinking,
  isListening,
  isMuted,
  setIsMuted,
  sessionSeconds,
  chatHistoryLength,
  toggleSession,
  onClearHistory,
  formatTimer,
  onForceStartListening,
  onBargeIn,
  isPreparingAudio = false,
  onSendText,
}) => {
  const { language } = useLanguage();
  const { haptics } = useTelegramWebApp();
  const isJa = language === 'ja';
  const [textDraft, setTextDraft] = useState('');

  const submitText = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!onSendText || isThinking || textDraft.trim().length === 0) return;
    haptics.impact('light');
    onSendText(textDraft);
    setTextDraft('');
  };

  const getStatusInfo = () => {
    if (isSpeaking)
      return {
        label: isJa ? 'AI話しています (タップで中断)' : "AI Gapirmoqda (To'xtatish)",
        color: 'text-blue-400',
        pulseColor: 'bg-blue-500',
      };
    if (isPreparingAudio)
      return {
        label: isJa ? '準備中...' : 'Ovoz tayyorlanmoqda...',
        color: 'text-amber-400',
        pulseColor: 'bg-amber-500',
      };
    if (isThinking)
      return {
        label: isJa ? '思考中...' : "Coach javob o'ylamoqda...",
        color: 'text-purple-400',
        pulseColor: 'bg-purple-500',
      };
    if (isListening)
      return {
        label: isJa ? 'あなたの番です (お話しください)' : 'Sizning navbatingiz... Gapiring',
        color: 'text-emerald-400',
        pulseColor: 'bg-emerald-500',
      };
    if (isMuted)
      return {
        label: isJa ? 'マイクはミュート中' : "Mikrofon o'chiq (Mute)",
        color: 'text-amber-400',
        pulseColor: 'bg-amber-500',
      };
    return {
      label: isJa ? '自動対話モード (お話しください)' : 'Navbat sizda... Gapiring',
      color: 'text-emerald-400/90',
      pulseColor: 'bg-emerald-500',
    };
  };

  const status = getStatusInfo();

  return (
    <div className="relative z-20 flex-shrink-0 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1 md:px-5 md:pb-3">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur-2xl md:p-3">
        {/* Status & Visualizer Row (when active) */}
        {isLiveSession && (
          <div className="mb-2 px-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div
                onClick={() => {
                  if (isSpeaking && onBargeIn) {
                    onBargeIn();
                  } else if (onForceStartListening) {
                    onForceStartListening();
                  }
                }}
                className="flex min-w-0 cursor-pointer items-center gap-1.5 transition-opacity hover:opacity-80"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${status.pulseColor} animate-pulse`}
                />
                <span className={`truncate text-[11px] font-bold ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <span className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                {formatTimer(sessionSeconds)}
              </span>
            </div>
            <AudioVisualizer
              isActive={isSpeaking || isListening || isThinking}
              mode={
                isSpeaking
                  ? 'speaking'
                  : isThinking
                    ? 'thinking'
                    : isListening
                      ? 'listening'
                      : 'idle'
              }
            />
          </div>
        )}

        {/* Input and Actions Bar — Clean & Mobile Optimized */}
        <div className="flex items-center gap-2">
          {/* Text Input */}
          <form onSubmit={submitText} className="flex min-w-0 flex-1 items-center gap-1.5">
            <input
              type="text"
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              enterKeyHint="send"
              autoComplete="off"
              disabled={isThinking}
              placeholder={isJa ? 'メッセージを入力…' : 'Xabar yozing (yaponcha)…'}
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none disabled:opacity-50"
            />
            {textDraft.trim().length > 0 && (
              <button
                type="submit"
                disabled={isThinking}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95"
                title="Yuborish"
              >
                <Send size={16} />
              </button>
            )}
          </form>

          {/* Main Voice Mic Button (No weird Call button!) */}
          <button
            onClick={() => {
              haptics.impact('medium');
              if (!isLiveSession) {
                toggleSession();
              } else if (isSpeaking && onBargeIn) {
                onBargeIn();
              } else {
                if (isMuted) {
                  setIsMuted(false);
                }
                if (onForceStartListening) {
                  onForceStartListening();
                }
              }
            }}
            className={`flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold shadow-md transition-all active:scale-95 ${
              !isLiveSession
                ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-rose-500/20 hover:opacity-95'
                : isSpeaking
                  ? 'animate-pulse border border-amber-500/30 bg-amber-500/20 text-amber-300'
                  : isListening
                    ? 'animate-pulse bg-emerald-500 text-slate-950'
                    : isMuted
                      ? 'bg-amber-500 text-white shadow-amber-500/25'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            title={
              isSpeaking
                ? isJa
                  ? 'AI音声を中断'
                  : "AI ni to'xtatish va gapirish"
                : isMuted
                  ? isJa
                    ? 'マイクをオン'
                    : 'Mikrofonni yoqish'
                  : isJa
                    ? '話す（マイク有効化）'
                    : 'Gapirish (Mikrofonni faollashtirish)'
            }
          >
            {isMuted ? (
              <MicOff size={18} />
            ) : (
              <Mic size={18} className={isListening ? 'animate-pulse text-slate-950' : ''} />
            )}
            <span className="hidden sm:inline">
              {!isLiveSession
                ? isJa
                  ? '会話を開始'
                  : 'BOSHLASH'
                : isSpeaking
                  ? isJa
                    ? '中断'
                    : "TO'XTATISH"
                  : isListening
                    ? isJa
                      ? '聴取中'
                      : 'ESHITYAPMAN'
                    : isThinking
                      ? isJa
                        ? '思考中'
                        : "O'YLANMOQDA"
                      : isMuted
                        ? isJa
                          ? 'ミュート'
                          : "O'CHIQ"
                        : isJa
                          ? '話す'
                          : 'GAPIRISH'}
            </span>
          </button>

          {/* Reset / Clear Button */}
          {chatHistoryLength > 0 && (
            <button
              onClick={() => {
                haptics.impact('light');
                onClearHistory();
              }}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
              title="Suhbatni tozalash"
            >
              <RotateCcw size={16} />
            </button>
          )}

          {/* End live session button if active */}
          {isLiveSession && (
            <button
              onClick={() => {
                haptics.impact('light');
                toggleSession();
              }}
              className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 active:scale-95"
              title="Suhbatni yakunlash"
            >
              <Square size={14} className="fill-current" />
              <span className="hidden sm:inline">Yakunlash</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachControlBar;
