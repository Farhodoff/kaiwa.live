import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Trophy,
  Zap,
  Flame,
  RotateCcw,
  Share2,
  ChevronRight,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { JAPANESE_DIAGNOSTIC_BANK } from '../../data/japaneseDiagnosticBank';
import { useGamificationStore } from '../../stores';

interface TelegramQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLevel?: 'N5' | 'N4' | 'N3' | 'ALL';
}

const QUESTIONS_PER_ROUND = 5;

export const TelegramQuizModal: React.FC<TelegramQuizModalProps> = ({
  isOpen,
  onClose,
  defaultLevel = 'ALL',
}) => {
  const [selectedLevel, setSelectedLevel] = useState<'N5' | 'N4' | 'N3' | 'ALL'>(defaultLevel);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hasAwardedXp, setHasAwardedXp] = useState(false);

  const awardXP = useGamificationStore((s) => s.awardXP);
  const recordQuestProgress = useGamificationStore((s) => s.recordQuestProgress);
  const currentStreak = useGamificationStore((s) => s.currentStreak);

  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    } catch {}
  }, []);

  // Filter and shuffle questions
  const roundQuestions = useMemo(() => {
    if (!isOpen) return [];
    let pool = JAPANESE_DIAGNOSTIC_BANK;
    if (selectedLevel !== 'ALL') {
      pool = pool.filter((q) => q.level === selectedLevel);
    }
    // Shuffle and pick 5
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(QUESTIONS_PER_ROUND, shuffled.length));
  }, [isOpen, selectedLevel]);

  // Reset round state
  const startNewRound = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setIsFinished(false);
    setHasAwardedXp(false);
  }, []);

  // When opening or level changing, reset
  useEffect(() => {
    if (isOpen) {
      startNewRound();
    }
  }, [isOpen, selectedLevel, startNewRound]);

  const currentQ = roundQuestions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctAnswerIndex;
    if (isCorrect) {
      triggerHaptic('light');
      setCorrectCount((prev) => prev + 1);
    } else {
      triggerHaptic('heavy');
    }
  };

  const handleNext = () => {
    triggerHaptic('medium');
    if (currentIndex + 1 < roundQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  // Award XP upon finishing
  useEffect(() => {
    if (isFinished && !hasAwardedXp) {
      const earnedXp = correctCount * 10;
      if (earnedXp > 0) {
        awardXP(earnedXp);
        recordQuestProgress('grammar', correctCount);
      }
      setHasAwardedXp(true);
      triggerHaptic('medium');
    }
  }, [isFinished, hasAwardedXp, correctCount, awardXP, recordQuestProgress, triggerHaptic]);

  const handleShareResult = () => {
    triggerHaptic('light');
    const pct = Math.round((correctCount / roundQuestions.length) * 100);
    const text = `🎌 Nihongo Talk Telegram Mini Quizda ${roundQuestions.length} ta savoldan ${correctCount} tasiga to'g'ri javob berdim (${pct}%)! 🔥\nSiz ham o'z bilmingizni sinab ko'ring:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent('https://kaiwa.live')}&text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(shareUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  const totalQuestions = roundQuestions.length;
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const earnedXp = correctCount * 10;

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 duration-200 animate-in fade-in sm:items-center sm:p-4">
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-background p-5 text-foreground shadow-2xl duration-200 animate-in slide-in-from-bottom sm:rounded-3xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="JLPT Tezkor Quiz"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2 text-white shadow-sm">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground sm:text-base">
                JLPT Tezkor Mini-Quiz
              </h2>
              <span className="text-[11px] font-bold text-muted-foreground">
                {isFinished ? 'Natijalar' : `Savol ${currentIndex + 1} / ${totalQuestions}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        {/* Level Selector (when not finished) */}
        {!isFinished && (
          <div className="flex items-center justify-between gap-1.5 pt-3">
            <span className="text-[11px] font-bold text-muted-foreground">Daraja:</span>
            <div className="flex items-center gap-1">
              {(['ALL', 'N5', 'N4', 'N3'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setSelectedLevel(lvl);
                    triggerHaptic('light');
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition-all ${
                    selectedLevel === lvl
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {!isFinished && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Main Body */}
        <div className="mt-4 flex-1 overflow-y-auto">
          {!isFinished && currentQ ? (
            <div className="space-y-4">
              {/* Question Badge and Prompt */}
              <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-black text-indigo-500">
                    JLPT {currentQ.level} • {currentQ.topic || 'Grammatika'}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">+10 XP</span>
                </div>
                <h3 className="text-sm font-black leading-relaxed text-foreground sm:text-base">
                  {currentQ.prompt}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctAnswerIndex;

                  let optionStyle =
                    'border-border bg-card text-foreground hover:border-emerald-500/40 hover:bg-muted/50';
                  let icon = null;

                  if (isAnswered) {
                    if (isCorrect) {
                      optionStyle =
                        'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black';
                      icon = <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />;
                    } else if (isSelected) {
                      optionStyle =
                        'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-black';
                      icon = <XCircle size={18} className="shrink-0 text-rose-500" />;
                    } else {
                      optionStyle = 'opacity-50 border-border bg-muted/30 text-muted-foreground';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left text-xs font-bold transition-all sm:text-sm ${optionStyle} ${
                        !isAnswered ? 'active:scale-[0.99]' : ''
                      }`}
                    >
                      <span className="flex-1 pr-2">{opt}</span>
                      {icon}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Card */}
              {isAnswered && (
                <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 duration-200 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <HelpCircle size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    <div className="space-y-1">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {selectedOption === currentQ.correctAnswerIndex
                          ? "Barakalla, to'g'ri javob! 🎉"
                          : "Noto'g'ri javob 💡"}
                      </span>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {currentQ.explanation}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-500 active:scale-[0.98]"
                  >
                    <span>
                      {currentIndex + 1 < totalQuestions ? 'Keyingi Savol' : "Natijani Ko'rish"}
                    </span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Results Screen */
            <div className="space-y-5 py-2 text-center duration-300 animate-in zoom-in-95">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg">
                <Trophy size={40} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-foreground sm:text-xl">
                  {correctCount === totalQuestions
                    ? 'Mukammal Natija! 🌟'
                    : correctCount >= 3
                      ? 'Ajoyib Mashq! 👏'
                      : 'Yaxshi Harakat! 💪'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {totalQuestions} ta savoldan {correctCount} tasiga to'g'ri javob berdingiz!
                </p>
              </div>

              {/* Rewards Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left">
                  <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
                    <Zap size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Keltirilgan XP
                    </span>
                    <p className="text-sm font-black text-foreground">+{earnedXp} XP</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left">
                  <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500">
                    <Flame size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Streak Zanjiri
                    </span>
                    <p className="text-sm font-black text-foreground">{currentStreak || 1} kun</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={startNewRound}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-500 active:scale-[0.98]"
                >
                  <RotateCcw size={16} />
                  <span>Yana 5 ta savol ishlash</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareResult}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-xs font-black text-foreground shadow-xs transition-all hover:bg-muted active:scale-[0.98]"
                >
                  <Share2 size={16} />
                  <span>Natijani Telegramda Ulashish</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Yakunlash va Mini Appga qaytish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramQuizModal;
