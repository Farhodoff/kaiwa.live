import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { LearningOrchestrator } from '../services/LearningOrchestrator';
import {
  AlertCircle,
  ChevronRight,
  X,
  CheckCircle2,
  Headphones,
  BookOpen,
  Edit3,
} from 'lucide-react';
import { useStudyData } from '../context/StudyPlannerContext';
import { LessonService } from '../services/LessonService';
import { LearningSignalService } from '../services/LearningSignalService';
import { Lesson, LessonStep, UserLessonProgress } from '../types/lesson';
import { IncorrectAnswerSignal } from '../types/learningSignals';
import { LearnStepView } from '../components/lesson/LearnStepView';
import { PracticeStepView } from '../components/lesson/PracticeStepView';
import { TestStepView, MissedQuestionInfo } from '../components/lesson/TestStepView';
import { LessonCompletionView } from '../components/lesson/LessonCompletionView';
import { ActivityLoggingService } from '../services/ActivityLoggingService';
import { useGamificationStore } from '../stores/useGamificationStore';
import { useSEO } from '../hooks/useSEO';
import { toast } from '../hooks/use-toast';

export const LessonPlayerPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, awardXP, settings, updateSettings } = useStudyData();

  const [lesson, setLesson] = useState<Lesson | null>(() => {
    if (!lessonId) return null;
    const initial = LessonService.getLessonById(lessonId);
    return initial && initial.steps && initial.steps.length > 0 ? initial : null;
  });
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<
    { score: number; total: number; percentage: number } | undefined
  >(undefined);
  const [loading, setLoading] = useState(() => {
    if (!lessonId) return false;
    const initial = LessonService.getLessonById(lessonId);
    if (!initial) return false;
    return !(initial.steps && initial.steps.length > 0);
  });
  const [sessionErrors, setSessionErrors] = useState<IncorrectAnswerSignal[]>([]);
  const [srsSummary, setSrsSummary] = useState<{ newCardsCount: number; mistakesCount: number }>({
    newCardsCount: 0,
    mistakesCount: 0,
  });
  const completionInFlightRef = useRef(false);

  useSEO({
    title: lesson ? `${lesson.title} - Dars Mashg'uloti` : "O'quv Darsi - Nihongo Talk",
    description: lesson ? lesson.description : "Interaktiv til o'rganish darsi.",
    canonical: `/lesson/${lessonId || ''}`,
  });

  useEffect(() => {
    if (!lessonId) {
      setLoading(false);
      return;
    }

    const checkInitial = LessonService.getLessonById(lessonId);
    if (!checkInitial) {
      setLesson(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const setupLesson = (foundLesson: Lesson) => {
      // Phase 15: Service-level prerequisite and access validation
      const access = LearningOrchestrator.canAccessLesson(lessonId, user?.id || '');
      if (!access.allowed) {
        console.warn(`[LessonPlayer] Access denied: ${access.reason}`);
        toast({
          title: '🔒 Dars qulflangan',
          description:
            access.reason ||
            "Bu darsni ochish uchun avval oldingi mavzularni yakunlang. Sizni mos darsga yo'naltirdik.",
        });
        navigate(access.redirectTo || '/jlpt', { replace: true });
        return;
      }
      setLesson(foundLesson);

      // Handle direct step navigation via query param (e.g. ?step=mondai or ?step=3)
      const stepParam = searchParams.get('step');
      let targetStepIdx: number | null = null;

      if (stepParam) {
        if (stepParam === 'mondai' || stepParam === 'listening' || stepParam === 'choukai') {
          const mondaiIdx = foundLesson.steps.findIndex(
            (s) =>
              s.id.includes('s4') ||
              s.title.toLowerCase().includes('tinglash') ||
              s.title.toLowerCase().includes('mondai'),
          );
          if (mondaiIdx >= 0) {
            targetStepIdx = mondaiIdx;
          }
        } else {
          const parsed = parseInt(stepParam, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < foundLesson.steps.length) {
            targetStepIdx = parsed;
          }
        }
      }

      // Load saved progress
      const savedProgress = LessonService.getLessonProgress(user?.id || '', lessonId);
      if (targetStepIdx !== null) {
        setCurrentStepIdx(targetStepIdx);
        if (savedProgress?.isCompleted && savedProgress.quizScore) {
          setQuizResult(savedProgress.quizScore);
        }
      } else if (savedProgress) {
        if (savedProgress.isCompleted) {
          setIsLessonCompleted(true);
          setQuizResult(savedProgress.quizScore);
        } else if (savedProgress.currentStepIndex !== undefined) {
          setCurrentStepIdx(Math.min(savedProgress.currentStepIndex, foundLesson.steps.length - 1));
        }
      }
      setLoading(false);
    };

    const syncLesson = LessonService.getLessonById(lessonId);
    if (syncLesson && syncLesson.steps && syncLesson.steps.length > 0) {
      setupLesson(syncLesson);
    } else {
      setLoading(true);
      LessonService.loadLessonById(lessonId).then((foundLesson) => {
        if (!isMounted) return;
        if (foundLesson) {
          setupLesson(foundLesson);
        } else {
          setLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [lessonId, user?.id, searchParams, navigate]);

  const totalSteps = lesson ? lesson.steps.length : 0;
  const progressPercentage =
    totalSteps > 0
      ? Math.round(((currentStepIdx + (isLessonCompleted ? 1 : 0)) / totalSteps) * 100)
      : 0;

  const currentStep: LessonStep | undefined = lesson?.steps[currentStepIdx];

  const handlePracticeIncorrectAnswer = (
    exerciseId: string,
    prompt: string,
    userAnswer: string | number,
    expectedAnswer: string | number,
    explanation?: string,
  ) => {
    if (!lesson || !currentStep) return;
    const errSig: IncorrectAnswerSignal = {
      id: 'err_' + Math.random().toString(36).substring(2, 9),
      type: 'incorrect_answer',
      language: lesson.language,
      lessonId: lesson.id,
      userId: user?.id || 'guest',
      stepId: currentStep.id,
      questionId: exerciseId,
      prompt,
      userAnswer,
      expectedAnswer,
      explanation,
      attemptCount: 1,
      timestamp: new Date().toISOString(),
    };
    setSessionErrors((prev) => [...prev, errSig]);
  };

  const handleNextStep = async () => {
    if (!lesson) return;

    if (currentStepIdx < totalSteps - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);

      // Save progress
      const progress: UserLessonProgress = {
        lessonId: lesson.id,
        userId: user?.id || 'guest',
        currentStepIndex: nextIdx,
        completedStepIds: lesson.steps.slice(0, nextIdx).map((s) => s.id),
        isCompleted: false,
        lastAttemptedAt: new Date().toISOString(),
      };
      await LessonService.saveLessonProgress(user?.id || '', progress);
    } else {
      // Reached completion
      await handleCompleteLesson(
        quizResult || { score: totalSteps, total: totalSteps, percentage: 100 },
      );
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleJumpToStep = async (idx: number) => {
    if (!lesson || idx < 0 || idx >= totalSteps || idx === currentStepIdx) return;
    setCurrentStepIdx(idx);

    // Save progress (same shape as sequential navigation)
    const progress: UserLessonProgress = {
      lessonId: lesson.id,
      userId: user?.id || 'guest',
      currentStepIndex: idx,
      completedStepIds: lesson.steps.slice(0, idx).map((s) => s.id),
      isCompleted: false,
      lastAttemptedAt: new Date().toISOString(),
    };
    await LessonService.saveLessonProgress(user?.id || '', progress);
  };

  const handleTestCompletion = async (result: {
    score: number;
    total: number;
    percentage: number;
    missedQuestions: MissedQuestionInfo[];
  }) => {
    if (!lesson || !currentStep) return;

    const testErrors: IncorrectAnswerSignal[] = (result.missedQuestions || []).map((mq) => ({
      id: 'err_' + Math.random().toString(36).substring(2, 9),
      type: 'incorrect_answer',
      language: lesson.language,
      lessonId: lesson.id,
      userId: user?.id || 'guest',
      stepId: currentStep.id,
      questionId: mq.questionId,
      prompt: mq.prompt,
      userAnswer: mq.userAnswer,
      expectedAnswer: mq.expectedAnswer,
      explanation: mq.explanation,
      attemptCount: 1,
      timestamp: new Date().toISOString(),
    }));

    const allErrors = [...sessionErrors, ...testErrors];
    setSessionErrors(allErrors);

    const passingScore = currentStep.testData?.passingScorePercentage ?? 75;
    const isPassed = result.percentage >= passingScore;

    // Failed test attempt should remain incomplete (do not mark lesson completed).
    if (!isPassed) {
      setQuizResult({
        score: result.score,
        total: result.total,
        percentage: result.percentage,
      });

      // Persist attempt progress without completing the lesson.
      const progress: UserLessonProgress = {
        lessonId: lesson.id,
        userId: user?.id || 'guest',
        currentStepIndex: currentStepIdx,
        completedStepIds: lesson.steps.slice(0, currentStepIdx).map((s) => s.id),
        isCompleted: false,
        quizScore: {
          score: result.score,
          total: result.total,
          percentage: result.percentage,
        },
        lastAttemptedAt: new Date().toISOString(),
      };
      await LessonService.saveLessonProgress(user?.id || '', progress);
      return;
    }

    // If there are subsequent steps remaining (e.g. Step 4: Mondai Tinglash Testi), advance smoothly!
    if (currentStepIdx < totalSteps - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      const progress: UserLessonProgress = {
        lessonId: lesson.id,
        userId: user?.id || 'guest',
        currentStepIndex: nextIdx,
        completedStepIds: lesson.steps.slice(0, nextIdx).map((s) => s.id),
        isCompleted: false,
        quizScore: {
          score: result.score,
          total: result.total,
          percentage: result.percentage,
        },
        lastAttemptedAt: new Date().toISOString(),
      };
      await LessonService.saveLessonProgress(user?.id || '', progress);
      return;
    }

    await handleCompleteLesson(
      {
        score: result.score,
        total: result.total,
        percentage: result.percentage,
      },
      allErrors,
    );
  };

  const handleCompleteLesson = async (
    score: { score: number; total: number; percentage: number },
    mistakes: IncorrectAnswerSignal[] = sessionErrors,
  ) => {
    if (!lesson || completionInFlightRef.current) return;
    completionInFlightRef.current = true;

    const activeUserId = user?.id || 'guest';
    const existingProgress = LessonService.getLessonProgress(activeUserId, lesson.id);
    const alreadyCompleted = !!existingProgress?.isCompleted;

    setQuizResult(score);
    setIsLessonCompleted(true);

    // Award XP
    try {
      if (!alreadyCompleted && awardXP) {
        await awardXP(50);
      }
    } catch (e) {}

    try {
      // Persist lesson completion first, then emit canonical learning signals/mastery evidence.
      await LessonService.completeLesson(activeUserId, lesson.id, score);

      const summary = await LearningSignalService.processLessonCompletion(
        activeUserId,
        lesson,
        score,
        mistakes,
      );
      setSrsSummary(summary);

      // Log activity to user learning history and update listening quest if applicable
      await ActivityLoggingService.logActivity(
        {
          activityType: 'lesson',
          activityTitle: `${lesson.title} Darsi`,
          durationMinutes: lesson.estimatedDurationMinutes || 20,
          itemsCount: lesson.steps.length,
          xpEarned: alreadyCompleted ? 0 : 50,
          metadata: {
            lessonId: lesson.id,
            level: lesson.level,
            unitId: lesson.unitId,
            score: score.percentage,
          },
        },
        activeUserId,
      );

      const hasListeningStep = lesson.steps.some(
        (s) =>
          s.id.includes('s4') ||
          s.title.toLowerCase().includes('tinglash') ||
          s.title.toLowerCase().includes('mondai') ||
          s.title.toLowerCase().includes('choukai'),
      );
      if (hasListeningStep) {
        useGamificationStore.getState().recordQuestProgress('listening', 1);
      }
    } catch (err) {
      console.error('[LessonPlayerPage] Failed to complete lesson mastery pipeline:', err);
    } finally {
      completionInFlightRef.current = false;
    }
  };

  const handleExit = () => {
    navigate('/jlpt');
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="mx-auto my-16 max-w-md space-y-4 rounded-3xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Dars Topilmadi</h2>
        <p className="text-xs text-muted-foreground">
          Siz qidirayotgan dars ID si mavjud emas yoki o'chirilgan bo'lishi mumkin.
        </p>
        <button
          onClick={handleExit}
          className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:opacity-90"
        >
          Bosh Sahifaga Qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <div className="z-20 shrink-0 border-b border-border bg-background/80 px-3.5 py-2.5 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 sm:gap-4">
          {/* Left: Exit & Title */}
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <button
              onClick={handleExit}
              className="rounded-xl border border-border p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
              title="Chiqish"
              aria-label="Chiqish"
            >
              <X size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-primary sm:px-2 sm:text-xs">
                  {lesson.language === 'ja'
                    ? `🇯🇵 JLPT ${lesson.level}`
                    : `🇬🇧 English ${lesson.level}`}
                </span>
                <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                  {lesson.unitTitle}
                </span>
              </div>
              <h1 className="truncate text-xs font-bold text-foreground sm:text-sm md:text-base">
                {lesson.title}
              </h1>
            </div>
          </div>

          {/* Right: Furigana Toggle & Step Counter */}
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
            {lesson.language === 'ja' && (
              <button
                type="button"
                onClick={() => updateSettings({ showFurigana: !settings.showFurigana })}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  settings?.showFurigana
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-500 shadow-xs hover:bg-indigo-500/20 dark:text-indigo-400'
                    : 'border-border bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
                title={
                  settings?.showFurigana
                    ? "Furiganani o'chirish (Kanjilarni mustaqil o'qish)"
                    : "Furiganani ko'rsatish"
                }
                aria-pressed={settings?.showFurigana}
              >
                <span className="font-mono text-[11px] font-bold">振</span>
                <span className="hidden sm:inline">
                  {settings?.showFurigana ? 'Furigana: ON' : 'Furigana: OFF'}
                </span>
                <span className="sm:hidden">{settings?.showFurigana ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {!isLessonCompleted && (
              <div className="text-right">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">Qadam</div>
                <div className="text-xs font-black text-foreground">
                  {currentStepIdx + 1} / {totalSteps}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Line */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(5, progressPercentage))}%` }}
          />
        </div>

        {/* Interactive Step Navigation Pills */}
        {lesson && totalSteps > 1 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
            {lesson.steps.map((step, idx) => {
              const isActive = currentStepIdx === idx && !isLessonCompleted;
              const isPast = currentStepIdx > idx || isLessonCompleted;
              const isMondai =
                step.id.includes('s4') ||
                step.title.toLowerCase().includes('tinglash') ||
                step.title.toLowerCase().includes('mondai');

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleJumpToStep(idx)}
                  className={`group flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all active:scale-95 sm:px-3 sm:py-1.5 ${
                    isActive
                      ? isMondai
                        ? 'border-amber-500 bg-amber-500/15 text-amber-600 shadow-xs ring-2 ring-amber-500/30 dark:text-amber-300'
                        : 'border-primary bg-primary/15 text-primary shadow-xs ring-2 ring-primary/30'
                      : isPast
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary hover:text-foreground'
                  }`}
                  title={`${idx + 1}-qadam: ${step.title}`}
                >
                  <span className="flex items-center justify-center text-xs">
                    {isPast && !isActive ? (
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    ) : isMondai ? (
                      <Headphones
                        size={13}
                        className={
                          isActive ? 'animate-pulse text-amber-500' : 'text-muted-foreground'
                        }
                      />
                    ) : step.type === 'learn' ? (
                      <BookOpen size={13} />
                    ) : step.type === 'practice' ? (
                      <Edit3 size={13} />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                  </span>
                  <span className="max-w-[100px] truncate sm:max-w-[150px]">
                    {step.title.replace(/\s*\(CD Audio\)/i, '')}
                  </span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-current" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area - Scrollable Container with bottom buffer */}
      <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto overscroll-contain p-3.5 pb-24 sm:p-5 sm:pb-28 md:p-8">
        {isLessonCompleted ? (
          <LessonCompletionView
            lesson={lesson}
            userId={user?.id}
            scoreData={quizResult}
            newCardsCount={srsSummary.newCardsCount}
            mistakesCount={srsSummary.mistakesCount}
            onExit={handleExit}
          />
        ) : currentStep ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Step Type Pill Header */}
            <div className="mb-2 flex items-center justify-center">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${
                  currentStep.type === 'learn'
                    ? 'border border-blue-500/20 bg-blue-500/10 text-blue-500'
                    : currentStep.type === 'practice'
                      ? 'border border-purple-500/20 bg-purple-500/10 text-purple-500'
                      : currentStep.id.includes('s4') ||
                          currentStep.title.toLowerCase().includes('tinglash') ||
                          currentStep.title.toLowerCase().includes('mondai')
                        ? 'border border-amber-500/30 bg-amber-500/15 text-amber-600 shadow-xs dark:text-amber-400'
                        : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                }`}
              >
                {(currentStep.id.includes('s4') ||
                  currentStep.title.toLowerCase().includes('tinglash')) &&
                  '🎧 '}
                {currentStep.title}
              </span>
            </div>

            {/* Step Renderers */}
            {currentStep.type === 'learn' && currentStep.learnData && (
              <LearnStepView content={currentStep.learnData} language={lesson.language} />
            )}

            {currentStep.type === 'practice' && currentStep.practiceData && (
              <PracticeStepView
                instructions={currentStep.practiceData.instructions}
                exercises={currentStep.practiceData.exercises}
                onIncorrectAnswer={handlePracticeIncorrectAnswer}
                onNextStep={handleNextStep}
              />
            )}

            {currentStep.type === 'test' && currentStep.testData && (
              <TestStepView
                instructions={currentStep.testData.instructions}
                questions={currentStep.testData.questions}
                passingScorePercentage={currentStep.testData.passingScorePercentage}
                onCompleteTest={handleTestCompletion}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom Step Controller Footer */}
      {!isLessonCompleted && (
        <div className="z-20 shrink-0 border-t border-border bg-background/90 p-3 pb-[max(env(safe-area-inset-bottom),0.875rem)] backdrop-blur-xl sm:p-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-2.5 sm:gap-4">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIdx === 0}
              className="h-11 shrink-0 cursor-pointer touch-manipulation select-none rounded-2xl border border-border px-3 text-xs font-bold text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 sm:px-4"
            >
              <span className="sm:hidden">Oldingi</span>
              <span className="hidden sm:inline">Oldingi qadam</span>
            </button>

            {lesson && totalSteps > 1 && (
              <select
                value={currentStepIdx}
                onChange={(e) => handleJumpToStep(Number(e.target.value))}
                aria-label="Qadamga sakrash"
                className="h-11 min-w-0 flex-1 cursor-pointer truncate rounded-2xl border border-border bg-card px-2 text-center text-xs font-bold text-foreground focus:border-primary focus:outline-none sm:flex-none sm:px-3"
              >
                {lesson.steps.map((s, i) => (
                  <option key={s.id} value={i}>
                    {i + 1}/{totalSteps} · {s.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleNextStep}
              aria-label={
                currentStepIdx === totalSteps - 1 ? 'Darsni Yakunlash' : "Keyingi Qadamga O'tish"
              }
              className="flex h-11 cursor-pointer touch-manipulation select-none items-center gap-1.5 rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-95 sm:gap-2 sm:px-6 md:text-sm"
            >
              <span>
                {currentStepIdx === totalSteps - 1 ? (
                  <>
                    <span className="sm:hidden">Yakunlash 🎉</span>
                    <span className="hidden sm:inline">Darsni Yakunlash 🎉</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Keyingi</span>
                    <span className="hidden sm:inline">Keyingi Qadamga O'tish</span>
                  </>
                )}
              </span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlayerPage;
