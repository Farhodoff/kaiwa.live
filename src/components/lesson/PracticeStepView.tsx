import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Headphones,
} from 'lucide-react';
import { PracticeExercise } from '../../types/lesson';
import { FuriganaText, FuriganaMode } from '../jlpt/FuriganaText';
import { LessonAudioPlayer } from './LessonAudioPlayer';
import { SentenceOrderingQuestion } from '../jlpt/SentenceOrderingQuestion';

interface PracticeStepViewProps {
  instructions: string;
  exercises: PracticeExercise[];
  onCompleteExercise?: (exerciseId: string, isCorrect: boolean) => void;
  onIncorrectAnswer?: (
    exerciseId: string,
    prompt: string,
    userAnswer: string | number,
    expectedAnswer: string | number,
    explanation?: string,
  ) => void;
  onNextStep?: () => void;
}

export const PracticeStepView: React.FC<PracticeStepViewProps> = ({
  instructions,
  exercises,
  onCompleteExercise,
  onIncorrectAnswer,
  onNextStep,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number | string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [attemptSeed, setAttemptSeed] = useState(0);
  const [furiganaMode, setFuriganaMode] = useState<FuriganaMode>('hover');
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Dynamic shuffle for multiple-choice exercise options per attempt
  const activeExercises = useMemo(() => {
    return exercises.map((ex) => {
      if (ex.type !== 'multiple-choice' || !ex.options || ex.options.length < 2) {
        return ex;
      }
      const correctText =
        typeof ex.correctAnswer === 'number' ? ex.options[ex.correctAnswer] : ex.correctAnswer;

      const shuffled = [...ex.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const newCorrectIdx = shuffled.indexOf(correctText);

      return {
        ...ex,
        options: shuffled,
        correctAnswer: newCorrectIdx >= 0 ? newCorrectIdx : ex.correctAnswer,
      };
    });
  }, [exercises, attemptSeed]);

  const currentExercise = activeExercises[currentIdx];
  const totalExercises = activeExercises.length;
  const answeredCount = Object.keys(userAnswers).length;

  // Determine 2-column layout based on text length
  const isTwoColumns = useMemo(() => {
    if (!currentExercise?.options || currentExercise.options.length < 2) return false;
    return currentExercise.options.every((opt) => opt.length <= 24 && !opt.includes('\n'));
  }, [currentExercise]);

  const handleSelectOption = (optIdx: number) => {
    if (isCompleted) return;

    // Record answer
    setUserAnswers((prev) => ({
      ...prev,
      [currentIdx]: optIdx,
    }));

    // Silliq avtomatik o'tish (auto-advance after 300ms)
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    autoAdvanceTimerRef.current = setTimeout(() => {
      if (currentIdx < totalExercises - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        // Oxirgi savolda avtomatik natijalarni hisoblash
        finishExercises({
          ...userAnswers,
          [currentIdx]: optIdx,
        });
      }
    }, 320);
  };

  const finishExercises = (answers: Record<number, number | string> = userAnswers) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    // Natijalarni baholash va parent listenerlarga xabar berish
    activeExercises.forEach((ex, idx) => {
      const selected = answers[idx];
      let correct = false;

      if (ex.type === 'multiple-choice') {
        if (typeof ex.correctAnswer === 'number') {
          correct = selected === ex.correctAnswer;
        } else {
          correct =
            String(selected).trim().toLowerCase() === String(ex.correctAnswer).trim().toLowerCase();
        }
      } else if (ex.type === 'sentence-order') {
        correct = selected === 'correct';
      }

      onCompleteExercise?.(ex.id, correct);

      if (!correct && selected !== undefined) {
        const userDisplay =
          ex.type === 'multiple-choice' && typeof selected === 'number' && ex.options
            ? ex.options[selected] || 'Nomaʼlum'
            : String(selected);

        const expectedDisplay =
          ex.type === 'multiple-choice' && typeof ex.correctAnswer === 'number' && ex.options
            ? ex.options[ex.correctAnswer]
            : String(ex.correctAnswer);

        onIncorrectAnswer?.(ex.id, ex.prompt, userDisplay, expectedDisplay, ex.explanation);
      }
    });

    setIsCompleted(true);
  };

  const handleNextExercise = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (currentIdx < totalExercises - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishExercises();
    }
  };

  const handlePrevExercise = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleRetry = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    setUserAnswers({});
    setCurrentIdx(0);
    setIsCompleted(false);
    setAttemptSeed((prev) => prev + 1);
  };

  // Natijalarni hisoblash
  const scoreStats = useMemo(() => {
    let correctCount = 0;
    activeExercises.forEach((ex, idx) => {
      const selected = userAnswers[idx];
      if (ex.type === 'multiple-choice') {
        if (typeof ex.correctAnswer === 'number') {
          if (selected === ex.correctAnswer) correctCount++;
        } else if (
          String(selected).trim().toLowerCase() === String(ex.correctAnswer).trim().toLowerCase()
        ) {
          correctCount++;
        }
      } else if (ex.type === 'sentence-order') {
        if (selected === 'correct') correctCount++;
      }
    });

    const percentage = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0;
    return {
      correctCount,
      totalCount: totalExercises,
      percentage,
      isPassed: percentage >= 70,
    };
  }, [activeExercises, userAnswers, totalExercises]);

  if (!currentExercise && !isCompleted) {
    return <div className="p-8 text-center text-muted-foreground">Mashqlar topilmadi.</div>;
  }

  // 1. ANIQ SAVOLLAR VA TESTLARNI ISHLASH EKRANI
  if (!isCompleted) {
    if (
      currentExercise.type === 'sentence-order' &&
      currentExercise.fragments &&
      currentExercise.correctOrder
    ) {
      const starPos = currentExercise.starPosition || 3;
      const parts = currentExercise.prompt.split('___');
      const questionData = {
        id: currentExercise.id,
        level: 'N3' as const,
        prefix: parts[0] || '',
        suffix: parts[1] || '',
        fragments: currentExercise.fragments,
        correctOrder: currentExercise.correctOrder,
        starPosition: starPos,
        correctSentence: currentExercise.hint || '',
        translationUz: currentExercise.explanation || '',
        explanationUzbek: currentExercise.explanation || '',
      };

      return (
        <div className="mx-auto max-w-2xl space-y-6 duration-200 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary">
                <Sparkles size={14} />
                <span>★ Gap tartibini tuzish (文の組み立て)</span>
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {instructions || "So'z bo'laklarini to'g'ri tartibda joylashtiring:"}
              </p>
            </div>
            <div className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground">
              {currentIdx + 1} / {totalExercises}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <SentenceOrderingQuestion
              key={currentExercise.id}
              question={questionData}
              onNext={handleNextExercise}
              onComplete={(correct) => {
                setUserAnswers((prev) => ({
                  ...prev,
                  [currentIdx]: correct ? 'correct' : 'incorrect',
                }));
              }}
            />

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <button
                onClick={handlePrevExercise}
                disabled={currentIdx === 0}
                className="cursor-pointer rounded-xl border border-border px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Oldingi
              </button>
              <button
                onClick={handleNextExercise}
                className="flex cursor-pointer items-center gap-1 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
              >
                <span>{currentIdx < totalExercises - 1 ? 'Keyingisi' : 'Natijalar'}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-2xl space-y-6 duration-200 animate-in fade-in">
        {/* Header / Subtitle */}
        <div className="flex items-center justify-between">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary">
              <Sparkles size={14} />
              <span>Interaktiv Amaliy Mashq</span>
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {instructions || "Savolga to'g'ri javobni tanlang:"}
            </p>
          </div>
          <div className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground">
            {currentIdx + 1} / {totalExercises}
          </div>
        </div>

        {/* Exercise Card */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:space-y-6 sm:rounded-3xl sm:p-6">
          {currentExercise.audioUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Headphones size={15} className="text-amber-600 dark:text-amber-400" />
                  <span>Amaliy Tinglash Mashqi</span>
                </div>
                <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
                  Audioni tinglang va mos javobni belgilang
                </span>
              </div>
              <LessonAudioPlayer
                key={`audio-ex-${currentExercise.id}-${currentIdx}`}
                audioUrl={currentExercise.audioUrl}
                audioTitle={currentExercise.audioTitle || 'Mondai Mashq Audiosi'}
              />
            </div>
          )}

          {/* Prompt Header with Furigana Peek Controls */}
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {currentExercise.audioUrl ? '🎧 Savol:' : 'Savol matni:'}
            </span>

            {/* Furigana Mode Pills */}
            <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFuriganaMode('always')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                  furiganaMode === 'always'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Barcha furiganani ko'rsatish"
              >
                振 ON
              </button>
              <button
                type="button"
                onClick={() => setFuriganaMode('hover')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                  furiganaMode === 'hover'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Faqat ustiga borganda ko'rsatish"
              >
                👁️ Hover
              </button>
              <button
                type="button"
                onClick={() => setFuriganaMode('never')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                  furiganaMode === 'never'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Furiganani yashirish"
              >
                🚫 OFF
              </button>
            </div>
          </div>

          <div className="break-words text-base font-bold leading-snug text-foreground sm:text-lg md:text-xl">
            <FuriganaText text={currentExercise.prompt} mode={furiganaMode} />
          </div>

          {/* Options list: Direct selection triggers instant selection & auto-advance */}
          {currentExercise.options && (
            <div
              className={
                isTwoColumns ? 'grid grid-cols-2 gap-2.5 sm:gap-3' : 'space-y-2 sm:space-y-2.5'
              }
            >
              {currentExercise.options.map((opt, optIdx) => {
                const isSelected = userAnswers[currentIdx] === optIdx;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`flex min-h-[50px] w-full cursor-pointer touch-manipulation select-none items-center justify-between gap-2 rounded-2xl border p-3 text-left text-sm transition-all active:scale-[0.99] sm:min-h-[56px] sm:gap-3 sm:p-4 sm:text-base ${
                      isSelected
                        ? 'scale-[1.01] border-primary bg-primary/10 font-bold text-primary shadow-sm ring-1 ring-primary/40'
                        : 'border-border bg-secondary/30 text-foreground hover:border-primary/40 hover:bg-secondary'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black sm:h-8 sm:w-8 sm:text-sm ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-card text-muted-foreground'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="break-words font-medium leading-relaxed">
                        <FuriganaText text={opt} mode={furiganaMode} />
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={18} className="shrink-0 text-primary sm:h-5 sm:w-5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer Controls: Seamless Navigation without blocking confirmation */}
          <div className="flex items-center justify-between gap-2.5 pt-2 sm:gap-3">
            <button
              type="button"
              onClick={handlePrevExercise}
              disabled={currentIdx === 0}
              className="h-11 cursor-pointer touch-manipulation select-none rounded-xl border border-border px-3.5 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 sm:px-4 sm:text-sm"
            >
              Oldingi
            </button>

            {currentIdx < totalExercises - 1 ? (
              <button
                type="button"
                onClick={handleNextExercise}
                disabled={userAnswers[currentIdx] === undefined}
                className="flex h-11 flex-1 cursor-pointer touch-manipulation select-none items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:text-sm"
              >
                <span>Davom etish</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => finishExercises()}
                disabled={answeredCount < totalExercises}
                className="flex h-11 flex-1 cursor-pointer touch-manipulation select-none items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-md shadow-emerald-600/30 transition-all hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:text-sm"
              >
                <CheckCircle2 size={16} />
                <span>Natijalarni Ko'rish</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. YAKUNIY TAHLIL VA NATIJALAR EKRANI (End of Practice Summary & Itemized Review)
  return (
    <div className="mx-auto max-w-2xl space-y-6 duration-200 animate-in fade-in">
      {/* Score Hero Banner */}
      <div
        className={`space-y-3 rounded-3xl border p-6 text-center shadow-md ${
          scoreStats.isPassed
            ? 'border-emerald-500/30 bg-emerald-500/10 text-foreground'
            : 'border-amber-500/30 bg-amber-500/10 text-foreground'
        }`}
      >
        <div className="text-3xl">{scoreStats.isPassed ? '🎉' : '📖'}</div>
        <h3 className="text-xl font-black">
          {scoreStats.isPassed ? 'Amaliy Mashqlar Yakunlandi!' : "Mashqlarni Qayta Ko'rib Chiqing"}
        </h3>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-black text-primary">
            {scoreStats.correctCount} / {scoreStats.totalCount}
          </span>
          <span className="text-sm font-bold text-muted-foreground">
            ({scoreStats.percentage}%)
          </span>
        </div>
        <p className="mx-auto max-w-md text-xs text-muted-foreground">
          {scoreStats.isPassed
            ? "Ajoyib natija! Darsning barcha asosiy amaliy namunalarini o'zlashtirdingiz."
            : "Natijangizni mustahkamlash uchun quyidagi tahlillarni ko'rib chiqing va qayta urinib ko'ring."}
        </p>
      </div>

      {/* Item-by-item Detailed Review */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Mashqlar Tahlili va To'g'ri Javoblar:
          </h4>

          {/* Furigana Mode in Review */}
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFuriganaMode('always')}
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                furiganaMode === 'always'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Barcha furiganani ko'rsatish"
            >
              振 ON
            </button>
            <button
              type="button"
              onClick={() => setFuriganaMode('hover')}
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                furiganaMode === 'hover'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Faqat ustiga borganda ko'rsatish"
            >
              👁️ Hover
            </button>
            <button
              type="button"
              onClick={() => setFuriganaMode('never')}
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                furiganaMode === 'never'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Furiganani yashirish"
            >
              🚫 OFF
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {activeExercises.map((ex, idx) => {
            const selected = userAnswers[idx];
            let isItemCorrect = false;
            let userDisplay = 'Tanlanmadi';
            let expectedDisplay = '';

            if (ex.type === 'multiple-choice') {
              if (typeof ex.correctAnswer === 'number') {
                isItemCorrect = selected === ex.correctAnswer;
                expectedDisplay = ex.options ? ex.options[ex.correctAnswer] : '';
              } else {
                isItemCorrect =
                  String(selected).trim().toLowerCase() ===
                  String(ex.correctAnswer).trim().toLowerCase();
                expectedDisplay = String(ex.correctAnswer);
              }
              if (typeof selected === 'number' && ex.options) {
                userDisplay = ex.options[selected] || 'Nomaʼlum';
              }
            } else if (ex.type === 'sentence-order') {
              isItemCorrect = selected === 'correct';
              userDisplay = isItemCorrect ? 'Toʻgʻri ketma-ketlik' : 'Notoʻgʻri ketma-ketlik';
              expectedDisplay = ex.hint || 'Toʻgʻri tartib';
            }

            return (
              <div
                key={ex.id || idx}
                className={`space-y-3 rounded-2xl border p-4 shadow-sm transition-all sm:p-5 ${
                  isItemCorrect
                    ? 'border-emerald-500/25 bg-card'
                    : 'border-rose-500/30 bg-rose-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-black text-foreground">
                      {idx + 1}
                    </span>
                    <div className="text-sm font-bold text-foreground sm:text-base">
                      <FuriganaText text={ex.prompt} mode={furiganaMode} />
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isItemCorrect
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isItemCorrect ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>To'g'ri</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} />
                        <span>Noto'g'ri</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Answer comparison */}
                <div className="grid grid-cols-1 gap-2 rounded-xl bg-secondary/40 p-3 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-bold text-muted-foreground">Sizning javobingiz: </span>
                    <span
                      className={`font-semibold ${
                        isItemCorrect
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      <FuriganaText text={userDisplay} mode={furiganaMode} />
                    </span>
                  </div>
                  {!isItemCorrect && (
                    <div>
                      <span className="font-bold text-muted-foreground">To'g'ri javob: </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        <FuriganaText text={expectedDisplay} mode={furiganaMode} />
                      </span>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {ex.explanation && (
                  <div className="rounded-xl border border-border/50 bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-bold text-foreground">💡 Izoh: </span>
                    <FuriganaText text={ex.explanation} mode={furiganaMode} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons: Retry or Proceed */}
      <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={handleRetry}
          className="flex h-11 w-full cursor-pointer touch-manipulation select-none items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-foreground transition-all hover:bg-secondary active:scale-95 sm:w-auto sm:text-sm"
        >
          <RotateCcw size={15} />
          <span>Mashqlarni Qayta Bajarish</span>
        </button>

        {onNextStep && (
          <button
            type="button"
            onClick={onNextStep}
            className="flex h-11 w-full cursor-pointer touch-manipulation select-none items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95 sm:w-auto sm:text-sm"
          >
            <span>Dars Testiga O'tish</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
