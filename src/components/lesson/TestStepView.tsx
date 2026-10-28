import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, ChevronRight, RotateCcw, Headphones } from 'lucide-react';
import { TestQuestion } from '../../types/lesson';
import { FuriganaText, FuriganaMode } from '../jlpt/FuriganaText';
import { LessonAudioPlayer } from './LessonAudioPlayer';

export interface MissedQuestionInfo {
  questionId: string;
  prompt: string;
  userAnswer: string;
  expectedAnswer: string;
  explanation: string;
}

interface TestStepViewProps {
  instructions: string;
  questions: TestQuestion[];
  passingScorePercentage?: number;
  onCompleteTest?: (result: {
    score: number;
    total: number;
    percentage: number;
    missedQuestions: MissedQuestionInfo[];
  }) => void;
}

export const TestStepView: React.FC<TestStepViewProps> = ({
  instructions,
  questions,
  passingScorePercentage = 75,
  onCompleteTest,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [attemptSeed, setAttemptSeed] = useState(0);
  const [furiganaMode, setFuriganaMode] = useState<FuriganaMode>('hover');

  // Shuffle options for each question dynamically per attempt
  const activeQuestions = useMemo(() => {
    return questions.map((q) => {
      if (!q.options || q.options.length < 2) return q;
      const correctOptionText = q.options[q.correctAnswerIndex];

      const shuffled = [...q.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const newCorrectIdx = shuffled.indexOf(correctOptionText);

      return {
        ...q,
        options: shuffled,
        correctAnswerIndex: newCorrectIdx >= 0 ? newCorrectIdx : q.correctAnswerIndex,
      };
    });
  }, [questions, attemptSeed]);

  const currentQuestion = activeQuestions[currentIdx];
  const totalQuestions = activeQuestions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const isTwoColumns = useMemo(() => {
    if (!currentQuestion?.options || currentQuestion.options.length < 2) return false;
    return currentQuestion.options.every((opt) => opt.length <= 24 && !opt.includes('\n'));
  }, [currentQuestion]);

  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  const handleSelectOption = (optionIdx: number) => {
    if (isCompleted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionIdx,
    }));

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    autoAdvanceTimerRef.current = setTimeout(() => {
      if (currentIdx < totalQuestions - 1) {
        setCurrentIdx((prev) => prev + 1);
      }
    }, 320);
  };

  const handlePrevQuestion = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    setCurrentIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNextQuestion = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleFinishTest = () => {
    let correctCount = 0;
    const missedQuestions: MissedQuestionInfo[] = [];

    activeQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correctCount++;
      } else {
        missedQuestions.push({
          questionId: q.id,
          prompt: q.question,
          userAnswer: q.options[selectedAnswers[idx]] || 'Tanlanmadi',
          expectedAnswer: q.options[q.correctAnswerIndex],
          explanation: q.explanation,
        });
      }
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    setIsCompleted(true);
    onCompleteTest?.({
      score: correctCount,
      total: totalQuestions,
      percentage,
      missedQuestions,
    });
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setIsCompleted(false);
    setAttemptSeed((prev) => prev + 1);
  };

  let score = 0;
  if (isCompleted) {
    activeQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        score++;
      }
    });
  }
  const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const isPassed = scorePercentage >= passingScorePercentage;

  return (
    <div className="mx-auto max-w-2xl space-y-6 duration-200 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary">
            <Award size={14} />
            <span>Dars Testi (Quiz)</span>
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {instructions || "Bilimingizni sinovdan o'tkazing:"}
          </p>
        </div>
        {!isCompleted && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              {answeredCount}/{totalQuestions} belgilandi
            </span>
            <div className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground">
              {currentIdx + 1} / {totalQuestions}
            </div>
          </div>
        )}
      </div>

      {!isCompleted ? (
        <>
          {/* Question Navigator Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeQuestions.map((_, idx) => {
              const isSelected = selectedAnswers[idx] !== undefined;
              const isCurrent = currentIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
                    setCurrentIdx(idx);
                  }}
                  className={`flex h-8 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all active:scale-95 ${
                    isCurrent
                      ? 'border-2 border-primary bg-primary/15 text-primary shadow-xs ring-1 ring-primary/40'
                      : isSelected
                        ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                  title={`${idx + 1}-savol`}
                >
                  <span>{idx + 1}</span>
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </button>
              );
            })}
          </div>

          {/* Active Question Card */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:space-y-6 sm:rounded-3xl sm:p-6">
            {currentQuestion.audioUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-amber-700 dark:text-amber-300">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Headphones size={15} className="text-amber-600 dark:text-amber-400" />
                    <span>Mondai Tinglash Topshirig'i</span>
                  </div>
                  <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
                    Audioni tinglang va to'g'ri javobni tanlang
                  </span>
                </div>
                <LessonAudioPlayer
                  key={`audio-${currentQuestion.id}-${currentIdx}`}
                  audioUrl={currentQuestion.audioUrl}
                  audioTitle={currentQuestion.audioTitle || 'Minna no Nihongo Mondai CD Audiosi'}
                />
              </div>
            )}

            {/* Prompt Header with Furigana Peek Controls */}
            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {currentQuestion.audioUrl ? '🎧 Savol:' : 'Savol matni:'}
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
              <FuriganaText text={currentQuestion.question} mode={furiganaMode} />
            </div>

            <div
              className={
                isTwoColumns ? 'grid grid-cols-2 gap-2.5 sm:gap-3' : 'space-y-2 sm:space-y-2.5'
              }
            >
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentIdx] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`flex min-h-[50px] w-full cursor-pointer touch-manipulation select-none items-center justify-between gap-2 rounded-2xl border p-3 text-left text-sm transition-all active:scale-[0.99] sm:min-h-[56px] sm:gap-3 sm:p-4 sm:text-base ${
                      isSelected
                        ? 'border-primary bg-primary/10 font-bold text-primary shadow-sm'
                        : 'border-border bg-secondary/30 text-foreground hover:bg-secondary'
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

            {/* Footer Nav Controls */}
            <div className="flex items-center justify-between gap-2.5 pt-2 sm:gap-3">
              <button
                onClick={handlePrevQuestion}
                disabled={currentIdx === 0}
                className="h-11 cursor-pointer touch-manipulation select-none rounded-xl border border-border px-3.5 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 sm:px-4 sm:text-sm"
              >
                Oldingisi
              </button>

              {currentIdx < totalQuestions - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[currentIdx] === undefined}
                  className="flex h-11 flex-1 cursor-pointer touch-manipulation select-none items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:text-sm"
                >
                  <span>Davom etish</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleFinishTest}
                  disabled={answeredCount < totalQuestions}
                  className="flex h-11 flex-1 cursor-pointer touch-manipulation select-none items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-md shadow-emerald-600/30 transition-all hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:text-sm"
                >
                  <CheckCircle2 size={16} />
                  <span>Testni Yakunlash</span>
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Test Summary & Question Review Card */
        <div className="space-y-6">
          {/* Score Hero Banner */}
          <div
            className={`space-y-3 rounded-3xl border p-6 text-center shadow-md ${
              isPassed
                ? 'border-emerald-500/30 bg-emerald-500/10 text-foreground'
                : 'border-amber-500/30 bg-amber-500/10 text-foreground'
            }`}
          >
            <div className="text-3xl">{isPassed ? '🎉' : '📖'}</div>
            <h3 className="text-xl font-black">
              {isPassed ? 'Test Muvaffaqiyatli Topshirildi!' : "Qayta urinib ko'ring"}
            </h3>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black text-primary">
                {score} / {totalQuestions}
              </span>
              <span className="text-sm font-bold text-muted-foreground">({scorePercentage}%)</span>
            </div>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              {isPassed
                ? "Ajoyib natija! Ushbu darsning barcha asosiy mavzularini o'zlashtirdingiz."
                : "Natijangizni yaxshilash uchun tahlillarni ko'rib chiqing va qayta urinib ko'ring."}
            </p>
          </div>

          {/* Question by Question Review */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Savollar Tahlili:
              </h4>

              {/* Furigana Mode Pills in Review */}
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

            {activeQuestions.map((q, qIdx) => {
              const userAnswer = selectedAnswers[qIdx];
              const isUserCorrect = userAnswer === q.correctAnswerIndex;

              return (
                <div
                  key={qIdx}
                  className={`space-y-2 rounded-2xl border bg-card p-4 ${
                    isUserCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-bold text-foreground">
                      {qIdx + 1}. <FuriganaText text={q.question} mode={furiganaMode} />
                    </div>
                    {isUserCorrect ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-500">
                        <CheckCircle2 size={14} /> To'g'ri
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-rose-500">
                        <XCircle size={14} /> Xato
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 border-t border-border/50 pt-1 text-xs text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">To'g'ri javob: </span>
                      <span className="font-bold text-emerald-500">
                        <FuriganaText text={q.options[q.correctAnswerIndex]} mode={furiganaMode} />
                      </span>
                    </div>
                    {q.explanation && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        💡 <FuriganaText text={q.explanation} mode={furiganaMode} />
                      </div>
                    )}
                    {q.audioUrl && (
                      <div className="pt-2">
                        <LessonAudioPlayer
                          audioUrl={q.audioUrl}
                          audioTitle={q.audioTitle || 'Minna no Nihongo Mondai CD Audiosi'}
                          className="!p-2.5 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isPassed && (
            <button
              onClick={handleRetry}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-xs font-bold text-foreground transition-all hover:bg-secondary"
            >
              <RotateCcw size={14} />
              <span>Testni Qayta Topshirish</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
