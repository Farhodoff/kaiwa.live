import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Sparkles,
  Award,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Gauge,
} from 'lucide-react';
import { FuriganaText } from '../jlpt/FuriganaText';
import { speakJapaneseText } from '../../utils/audioTts';
import { resolveAudioUrl } from '../../utils/audioUrl';
import {
  ShadowingEvaluationService,
  ShadowingEvaluationResult,
} from '../../services/ShadowingEvaluationService';

export interface ShadowingTarget {
  id?: string;
  japanese: string;
  romaji?: string;
  uzbek?: string;
  audioUrl?: string;
}

interface ShadowingTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: ShadowingTarget | null;
  onCompleted?: (result: ShadowingEvaluationResult) => void;
}

export const ShadowingTrainerModal: React.FC<ShadowingTrainerModalProps> = ({
  isOpen,
  onClose,
  target,
  onCompleted,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<ShadowingEvaluationResult | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Reset state when target changes or modal opens/closes
  useEffect(() => {
    if (isOpen && target) {
      setIsPlaying(false);
      setIsRecording(false);
      setTranscript('');
      setEvaluation(null);
      setRecordingError(null);
    } else {
      cleanupAudioAndMic();
    }
    return () => cleanupAudioAndMic();
  }, [isOpen, target]);

  const cleanupAudioAndMic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsRecording(false);
  };

  const handlePlayAudio = () => {
    if (!target) return;
    if (isPlaying) {
      cleanupAudioAndMic();
      return;
    }

    setIsPlaying(true);

    if (target.audioUrl) {
      const resolved = resolveAudioUrl(target.audioUrl);
      const audio = new Audio(resolved);
      audio.playbackRate = playbackRate;
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        // Fallback to TTS if audio file fails
        audioRef.current = null;
        speakJapaneseText(target.japanese, playbackRate);
        const approxDuration = Math.max(1800, target.japanese.length * 120 * (1 / playbackRate));
        setTimeout(() => setIsPlaying(false), approxDuration);
      };

      audio.play().catch(() => {
        speakJapaneseText(target.japanese, playbackRate);
        const approxDuration = Math.max(1800, target.japanese.length * 120 * (1 / playbackRate));
        setTimeout(() => setIsPlaying(false), approxDuration);
      });
    } else {
      speakJapaneseText(target.japanese, playbackRate);
      const approxDuration = Math.max(1800, target.japanese.length * 120 * (1 / playbackRate));
      setTimeout(() => setIsPlaying(false), approxDuration);
    }
  };

  const startSpeechRecognition = () => {
    setRecordingError(null);
    setTranscript('');
    setEvaluation(null);

    const WinSpeech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!WinSpeech) {
      setRecordingError("Brauzeringizda ovozni tanish (SpeechRecognition) qo'llab-quvvatlanmaydi.");
      return;
    }

    try {
      const recognition = new WinSpeech();
      recognition.lang = 'ja-JP';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalRecognized = '';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalRecognized += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        const combined = (finalRecognized || currentInterim).trim();
        setTranscript(combined);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('SpeechRecognition error:', event.error);
          setRecordingError(
            `Ovozni yozishda xatolik yuz berdi (${event.error}). Qaytadan urinib ko'ring.`,
          );
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
        // Evaluate user speech
        if (target) {
          const evalResult = ShadowingEvaluationService.evaluate(
            target.japanese,
            finalRecognized || transcript,
          );
          setEvaluation(evalResult);
          onCompleted?.(evalResult);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error(err);
      setRecordingError('Mikrofonga ulanishda xatolik yuz berdi. Ruxsatni tekshiring.');
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  if (!isOpen || !target) return null;

  const scoreColor = !evaluation
    ? 'text-foreground'
    : evaluation.score >= 90
      ? 'text-emerald-500'
      : evaluation.score >= 75
        ? 'text-sky-500'
        : evaluation.score >= 50
          ? 'text-amber-500'
          : 'text-rose-500';

  const scoreBg = !evaluation
    ? 'bg-muted/40'
    : evaluation.score >= 90
      ? 'bg-emerald-500/10 border-emerald-500/30'
      : evaluation.score >= 75
        ? 'bg-sky-500/10 border-sky-500/30'
        : evaluation.score >= 50
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-rose-500/10 border-rose-500/30';

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shadowing-modal-title"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 id="shadowing-modal-title" className="text-base font-bold text-foreground">
                Shadowing & Talaffuz Mashqi
              </h3>
              <p className="text-xs text-muted-foreground">
                Audioni tinglang va aynan shunday talaffuz bilan qaytaring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[80vh] space-y-6 overflow-y-auto p-6">
          {/* Target Sentence Card */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/30 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Maqsadli Gap
              </span>
              {/* Playback speed toggle */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                <span>Tezlik:</span>
                <button
                  type="button"
                  onClick={() => setPlaybackRate(0.8)}
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-all ${
                    playbackRate === 0.8
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  0.8x
                </button>
                <button
                  type="button"
                  onClick={() => setPlaybackRate(1.0)}
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-all ${
                    playbackRate === 1.0
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  1.0x
                </button>
              </div>
            </div>

            {/* Japanese Text with Furigana */}
            <div className="text-xl font-bold leading-relaxed text-foreground sm:text-2xl">
              <FuriganaText text={target.japanese} />
            </div>

            {/* Romaji */}
            {target.romaji && (
              <div className="font-mono text-xs text-muted-foreground">{target.romaji}</div>
            )}

            {/* Uzbek translation */}
            {target.uzbek && (
              <div className="border-t border-border/40 pt-2.5 text-sm font-medium text-foreground/85">
                {target.uzbek}
              </div>
            )}
          </div>

          {/* Action Audio & Mic Control Row */}
          <div className="flex flex-col items-center justify-center gap-4 py-2 sm:flex-row">
            {/* Native Audio Button */}
            <button
              type="button"
              onClick={handlePlayAudio}
              className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 font-semibold shadow-sm transition-all sm:w-auto ${
                isPlaying
                  ? 'animate-pulse bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Volume2 className="h-5 w-5" />
              <span>{isPlaying ? 'Tinglanmoqda...' : '1. Audioni Tinglash'}</span>
            </button>

            {/* Mic Record Button */}
            <button
              type="button"
              onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
              className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 font-semibold shadow-sm transition-all sm:w-auto ${
                isRecording
                  ? 'animate-pulse bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-700'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              <span>{isRecording ? 'Yakunlash' : '2. Gapirib Qaytaring'}</span>
            </button>
          </div>

          {/* Recording pulse wave indicator */}
          {isRecording && (
            <div className="animate-fade-in flex flex-col items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
              <div className="flex h-6 items-center gap-1.5">
                <span className="h-3 w-1.5 animate-bounce rounded-full bg-rose-500 [animation-delay:-0.3s]" />
                <span className="h-5 w-1.5 animate-bounce rounded-full bg-rose-500 [animation-delay:-0.15s]" />
                <span className="h-6 w-1.5 animate-bounce rounded-full bg-rose-500" />
                <span className="h-4 w-1.5 animate-bounce rounded-full bg-rose-500 [animation-delay:-0.2s]" />
                <span className="h-2 w-1.5 animate-bounce rounded-full bg-rose-500 [animation-delay:-0.35s]" />
              </div>
              <p className="animate-pulse text-xs font-semibold text-rose-500">
                Sizni tinglayapman... Gapiring!
              </p>
              {transcript && (
                <p className="rounded-md border border-border/50 bg-background/80 px-3 py-1 text-sm font-medium italic text-foreground">
                  "{transcript}"
                </p>
              )}
            </div>
          )}

          {/* Error notice */}
          {recordingError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{recordingError}</span>
            </div>
          )}

          {/* Evaluation Results Card */}
          {evaluation && !isRecording && (
            <div className={`animate-scale-in space-y-4 rounded-2xl border p-5 ${scoreBg}`}>
              {/* Score and Rating Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className={`h-6 w-6 ${scoreColor}`} />
                  <span className={`text-2xl font-black ${scoreColor}`}>{evaluation.score}%</span>
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Aniqlik
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 px-3 py-1 text-xs font-bold shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{evaluation.badgeUz}</span>
                </div>
              </div>

              {/* Sensei Feedback */}
              <p className="text-sm font-medium leading-relaxed text-foreground/90">
                {evaluation.feedbackUz}
              </p>

              {/* Spoken Speech Recognition */}
              <div className="space-y-1.5 border-t border-border/40 pt-3">
                <div className="text-xs font-semibold text-muted-foreground">
                  Sizning talaffuzingiz:
                </div>
                <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-sm font-medium text-foreground">
                  {evaluation.rawSpoken || '(Ovoz yozilmadi)'}
                </div>
              </div>

              {/* Character Diff Visualization */}
              {evaluation.diff.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-muted-foreground">
                    Belgilar tahlili:
                  </div>
                  <div className="flex flex-wrap gap-1 rounded-lg border border-border/40 bg-background/60 p-2.5 font-mono text-sm">
                    {evaluation.diff.map((item, index) => {
                      if (item.status === 'matched') {
                        return (
                          <span
                            key={index}
                            className="rounded bg-emerald-500/15 px-1 py-0.5 font-bold text-emerald-600 dark:text-emerald-400"
                            title="To'g'ri aytilgan"
                          >
                            {item.char}
                          </span>
                        );
                      }
                      if (item.status === 'missed') {
                        return (
                          <span
                            key={index}
                            className="rounded bg-rose-500/15 px-1 py-0.5 text-rose-600 line-through dark:text-rose-400"
                            title="Tushib qolgan tovush"
                          >
                            {item.char}
                          </span>
                        );
                      }
                      return (
                        <span
                          key={index}
                          className="rounded bg-amber-500/15 px-1 py-0.5 text-amber-600 dark:text-amber-400"
                          title="Ortiqcha tovush"
                        >
                          {item.char}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-border/30 pt-2">
                <button
                  type="button"
                  onClick={startSpeechRecognition}
                  className="flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Qayta urinish</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Tugatish</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
