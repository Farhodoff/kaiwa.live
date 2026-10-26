import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Star } from 'lucide-react';
import { SentenceOrderingQuestion as IQuestion } from '../../data/jlpt/sentence_ordering_data';
import { FuriganaText } from './FuriganaText';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

interface SentenceOrderingQuestionProps {
  question: IQuestion;
  onNext?: () => void;
  onComplete?: (isCorrect: boolean) => void;
}

export const SentenceOrderingQuestion: React.FC<SentenceOrderingQuestionProps> = ({
  question,
  onNext,
  onComplete,
}) => {
  const { haptics } = useTelegramWebApp();
  // slots: array of length 4 storing index of fragment placed in slot i, or null
  const [placedSlots, setPlacedSlots] = useState<(number | null)[]>([null, null, null, null]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Available fragments that are not yet placed
  const placedSet = new Set(placedSlots.filter((x): x is number => x !== null));

  const handleSelectFragment = (fragIdx: number) => {
    if (isSubmitted || placedSet.has(fragIdx)) return;
    haptics.selection();
    // Find first empty slot
    const emptySlotIdx = placedSlots.findIndex((s) => s === null);
    if (emptySlotIdx !== -1) {
      const next = [...placedSlots];
      next[emptySlotIdx] = fragIdx;
      setPlacedSlots(next);
    }
  };

  const handleRemoveFromSlot = (slotIdx: number) => {
    if (isSubmitted) return;
    haptics.impact('light');
    const next = [...placedSlots];
    next[slotIdx] = null;
    setPlacedSlots(next);
  };

  const handleReset = () => {
    if (isSubmitted) return;
    haptics.impact('light');
    setPlacedSlots([null, null, null, null]);
  };

  const isFull = placedSlots.every((s) => s !== null);

  // Check if current placedSlots matches question.correctOrder
  const isCorrect = isFull && placedSlots.every((val, idx) => val === question.correctOrder[idx]);

  // Option that belongs in starPosition (1-indexed)
  const starCorrectFragmentIdx = question.correctOrder[question.starPosition - 1];

  const handleSubmit = () => {
    if (!isFull || isSubmitted) return;
    setIsSubmitted(true);
    if (isCorrect) {
      haptics.notification('success');
    } else {
      haptics.notification('warning');
    }
    if (onComplete) {
      onComplete(isCorrect);
    }
  };

  return (
    <div className="space-y-6 duration-200 animate-in fade-in">
      {/* Title & Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-black text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>文の組み立て (Gap tartibi)</span>
          </span>
          <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
            {question.level}
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitted || placedSet.size === 0}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-40"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Tozalash</span>
        </button>
      </div>

      <p className="text-xs text-muted-foreground sm:text-sm">
        So‘z bo‘laklarini to‘g‘ri tartibda joylashtiring. Yulduzcha (<strong>★</strong>) o‘rniga
        qaysi variant tushishini aniqlang:
      </p>

      {/* The Sentence Template with 4 interactive slots */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-4 shadow-xs sm:p-6">
        <div className="font-japanese flex flex-wrap items-center gap-2.5 text-base font-bold leading-loose text-foreground sm:text-lg md:text-xl">
          {question.prefix && (
            <span className="mr-1">
              <FuriganaText text={question.prefix} />
            </span>
          )}

          {/* 4 Slots */}
          {[0, 1, 2, 3].map((slotIdx) => {
            const isStar = slotIdx === question.starPosition - 1;
            const placedFragIdx = placedSlots[slotIdx];

            return (
              <button
                key={slotIdx}
                type="button"
                onClick={() => placedFragIdx !== null && handleRemoveFromSlot(slotIdx)}
                disabled={isSubmitted}
                className={`relative flex min-h-[44px] min-w-[58px] max-w-full items-center justify-center rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold transition-all sm:min-w-[85px] sm:text-base ${
                  isStar
                    ? 'border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/40'
                    : 'border-dashed border-border bg-muted/30'
                } ${
                  placedFragIdx !== null
                    ? 'border-solid border-primary/60 bg-primary/10 text-primary shadow-xs'
                    : 'hover:border-primary/40'
                }`}
              >
                {/* Star indicator */}
                {isStar && (
                  <span className="py-0.2 absolute -top-2.5 right-1 inline-flex items-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-slate-950 shadow-xs">
                    ★
                  </span>
                )}

                {placedFragIdx !== null ? (
                  <span className="flex items-center gap-1">
                    <span className="text-[11px] opacity-60">({placedFragIdx + 1})</span>
                    <FuriganaText text={question.fragments[placedFragIdx]} />
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-muted-foreground/60">
                    {slotIdx + 1}
                  </span>
                )}
              </button>
            );
          })}

          {question.suffix && (
            <span className="ml-1">
              <FuriganaText text={question.suffix} />
            </span>
          )}
        </div>
      </div>

      {/* Available Word Chips */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tanlanadigan Variantlar (Bosing):
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {question.fragments.map((frag, idx) => {
            const isPlaced = placedSet.has(idx);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectFragment(idx)}
                disabled={isPlaced || isSubmitted}
                className={`active:scale-98 flex items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-bold transition-all ${
                  isPlaced
                    ? 'border-border/40 bg-muted/20 text-muted-foreground/40 opacity-40'
                    : 'border-border bg-card shadow-xs hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-black text-foreground">
                  {idx + 1}
                </span>
                <span className="font-japanese flex-1 text-sm font-medium leading-relaxed sm:text-base">
                  <FuriganaText text={frag} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submission & Action Button */}
      {!isSubmitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFull}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-40"
        >
          <span>Javobni Tekshirish</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <div className="animate-fadeIn space-y-4 rounded-3xl border border-border bg-muted/30 p-5">
          {/* Result Banner */}
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-500" />
                <div>
                  <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    Ajoyib! To‘g‘ri ketma-ketlik topildi! 🎉
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Yulduzcha (★) o‘rnida: <strong>{starCorrectFragmentIdx + 1}-variant</strong> (
                    <FuriganaText text={question.fragments[starCorrectFragmentIdx]} />)
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-7 w-7 shrink-0 text-rose-500" />
                <div>
                  <h4 className="text-sm font-black text-rose-600 dark:text-rose-400">
                    Kichik xatolik yuz berdi. To‘g‘ri javobni ko‘rib chiqing.
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    To‘g‘ri javob (★): <strong>{starCorrectFragmentIdx + 1}-variant</strong> (
                    <FuriganaText text={question.fragments[starCorrectFragmentIdx]} />)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Explanation in Uzbek */}
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            <div className="mb-1 font-bold text-foreground">💡 Sintaktik tahlil va izoh:</div>
            <p className="whitespace-pre-line">{question.explanationUzbek}</p>
          </div>

          {onNext && (
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                onNext();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <span>Keyingi Savol</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SentenceOrderingQuestion;
