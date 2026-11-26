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
  LockKeyhole,
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
import { ErrorNotificationService } from '../services/ErrorNotificationService';
import {
  completedLessonSteps,
  unlockedLessonStep,
  recordLessonStep,
  validStepResult,
  verifiedLessonCompletion,
  lessonAggregateScore,
} from '../utils/lessonProgression';

const LessonPlayerContent: React.FC = () => {
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
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const sessionErrorsRef = useRef<IncorrectAnswerSignal[]>([]);
  const [srsSummary, setSrsSummary] = useState<{ newCardsCount: number; mistakesCount: number }>({
    newCardsCount: 0,
    mistakesCount: 0,
  });
  const completionInFlightRef = useRef(false);
  const [progress, setProgress] = useState<UserLessonProgress | null>(null);
  const progressRef = useRef<UserLessonProgress | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const savingProgressRef = useRef(false);
  const [saveError, setSaveError] = useState('');
  const pendingProgressRef = useRef<UserLessonProgress | null>(null);

  const persistProgress = async (next: UserLessonProgress) => {
    if (savingProgressRef.current) return false;
    savingProgressRef.current = true;
    setSavingProgress(true);
    setSaveError('');
    next = { ...next, mistakes: [...sessionErrorsRef.current] };
    pendingProgressRef.current = next;
    try {
      await LessonService.saveLessonProgress(user?.id || '', next);
      progressRef.current = next;
      setProgress(next);
      pendingProgressRef.current = null;
      return true;
    } catch {
      setSaveError('Natija saqlanmadi. Keyingi bosqichni ochishdan oldin qayta saqlang.');
      return false;
    } finally {
      savingProgressRef.current = false;
      setSavingProgress(false);
    }
  };

  useSEO({
    title: lesson ? `${lesson.title} - Dars Mashg'uloti` : "O'quv Darsi - kaiwa.live",
    description: lesson ? lesson.description : "Interaktiv til o'rganish darsi.",
    canonical: `/lesson/${lessonId || ''}`,
  });

  useEffect(() => {
    setLoadError(false);
    if (!lessonId) {
      setLesson(null);
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
      // The course catalogue lets learners choose any Japanese lesson explicitly.
      // Progression recommendations must not silently override that choice.
      const access =
        foundLesson.language === 'ja'
          ? { allowed: true, reason: '', redirectTo: undefined }
          : LearningOrchestrator.canAccessLesson(lessonId, user?.id || '', foundLesson.language);
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
      setLoadError(false);

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

      const savedProgress = LessonService.getLessonProgress(user?.id || '', foundLesson.id);
      const initialProgress: UserLessonProgress = savedProgress || {
        lessonId: foundLesson.id,
        userId: user?.id || 'guest',
        currentStepIndex: 0,
        completedStepIds: [],
        isCompleted: false,
        lastAttemptedAt: new Date().toISOString(),
        progressionVersion: 1,
        stepResults: {},
      };
      sessionErrorsRef.current = initialProgress.mistakes || [];
      progressRef.current = initialProgress;
      setProgress(initialProgress);
      const unlocked = unlockedLessonStep(foundLesson, initialProgress);
      const savedIndex = initialProgress.currentStepIndex ?? 0;
      const savedStepIsDone = completedLessonSteps(foundLesson, initialProgress).includes(
        foundLesson.steps[savedIndex]?.id,
      );
      const requested = targetStepIdx ?? (savedStepIsDone ? unlocked : savedIndex);
      setCurrentStepIdx(Math.max(0, Math.min(requested, unlocked)));
      if (targetStepIdx !== null && targetStepIdx > unlocked)
        toast({
          title: 'Avval oldingi bosqichni yakunlang',
          description: 'Mashq va testlarni tartib bilan bajaring.',
        });
      // Preserve historical completed lessons, while all new attempts require per-step evidence.
      const historicalCompletion = savedProgress?.isCompleted && !savedProgress.progressionVersion;
      if (
        targetStepIdx === null &&
        (verifiedLessonCompletion(foundLesson, savedProgress) || historicalCompletion)
      ) {
        setIsLessonCompleted(true);
        setQuizResult(savedProgress?.quizScore);
      }
      setLoading(false);
    };

    const syncLesson = LessonService.getLessonById(lessonId);
    if (syncLesson && syncLesson.steps && syncLesson.steps.length > 0) {
      setupLesson(syncLesson);
    } else {
      setLoading(true);
      LessonService.loadLessonById(lessonId)
        .then((foundLesson) => {
          if (!isMounted) return;
          if (foundLesson) {
            setupLesson(foundLesson);
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setLesson(null);
          setLoadError(true);
          setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [lessonId, user?.id, searchParams, navigate, loadAttempt]);

  const totalSteps = lesson ? lesson.steps.length : 0;
  const completedIds = lesson ? completedLessonSteps(lesson, progress) : [];
  const unlockedStepIdx = lesson ? unlockedLessonStep(lesson, progress) : 0;
  const progressPercentage =
    totalSteps > 0
      ? Math.round(((isLessonCompleted ? totalSteps : completedIds.length) / totalSteps) * 100)
      : 0;
  const currentStep: LessonStep | undefined = lesson?.steps[currentStepIdx];
  const canContinue =
    !!currentStep &&
    (currentStep.type === 'learn' ||
      validStepResult(currentStep, progress?.stepResults?.[currentStep.id]));

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
    sessionErrorsRef.current = [...sessionErrorsRef.current, errSig];
  };

  const handleNextStep = async () => {
    if (
      !lesson ||
      !currentStep ||
      !progressRef.current ||
      savingProgressRef.current ||
      completionInFlightRef.current
    )
      return;
    if (
      currentStep.type !== 'learn' &&
      !validStepResult(currentStep, progressRef.current.stepResults?.[currentStep.id])
    )
      return;
    let next = progressRef.current;
    if (currentStep.type === 'learn') next = recordLessonStep(lesson, next, currentStepIdx);
    next = { ...next, currentStepIndex: Math.min(currentStepIdx + 1, totalSteps - 1) };
    if (!(await persistProgress(next))) return;
    if (verifiedLessonCompletion(lesson, next))
      await handleCompleteLesson(lessonAggregateScore(lesson, next));
    else setCurrentStepIdx(next.currentStepIndex);
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0 && !savingProgressRef.current) setCurrentStepIdx((prev) => prev - 1);
  };

  const handleJumpToStep = async (idx: number) => {
    if (
      !lesson ||
      !progressRef.current ||
      savingProgressRef.current ||
      idx < 0 ||
      idx > unlockedStepIdx ||
      idx === currentStepIdx
    )
      return;
    const next = { ...progressRef.current, currentStepIndex: idx };
    if (await persistProgress(next)) {
      setIsLessonCompleted(false);
      setCurrentStepIdx(idx);
    }
  };

  const handlePracticeCompletion = async (result: { score: number; total: number }) => {
    if (!lesson || !progressRef.current || currentStep?.type !== 'practice') return;
    await persistProgress(
      recordLessonStep(lesson, progressRef.current, currentStepIdx, result.score, result.total),
    );
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

    const allErrors = [...sessionErrorsRef.current, ...testErrors];
    sessionErrorsRef.current = allErrors;

    if (!progressRef.current || currentStep.type !== 'test' || savingProgressRef.current) return;
    const next = recordLessonStep(
      lesson,
      progressRef.current,
      currentStepIdx,
      result.score,
      result.total,
    );
    const passed = validStepResult(currentStep, next.stepResults?.[currentStep.id]);
    next.currentStepIndex = passed ? Math.min(currentStepIdx + 1, totalSteps - 1) : currentStepIdx;
    if (!(await persistProgress(next)) || !passed) return;
    if (verifiedLessonCompletion(lesson, next))
      await handleCompleteLesson(lessonAggregateScore(lesson, next), allErrors);
    else setCurrentStepIdx(next.currentStepIndex);
  };

  const handleCompleteLesson = async (
    score: { score: number; total: number; percentage: number },
    mistakes: IncorrectAnswerSignal[] = sessionErrorsRef.current,
  ) => {
    if (
      !lesson ||
      completionInFlightRef.current ||
      !verifiedLessonCompletion(lesson, progressRef.current)
    )
      return;
    completionInFlightRef.current = true;

    const activeUserId = user?.id || 'guest';
    const existingProgress = LessonService.getLessonProgress(activeUserId, lesson.id);
    const alreadyCompleted = !!(existingProgress?.isCompleted || existingProgress?.completedAt);

    setSavingProgress(true);
    try {
      await LessonService.completeLesson(activeUserId, lesson.id, score);
      setQuizResult(score);
      setIsLessonCompleted(true);
      if (!alreadyCompleted && awardXP) await awardXP(50);

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
      if (hasListeningStep && !alreadyCompleted) {
        useGamificationStore.getState().recordQuestProgress('listening', 1);
      }
    } catch (err) {
      console.error('[LessonPlayerPage] Failed to complete lesson mastery pipeline:', err);
      ErrorNotificationService.notifyError({
        title: 'Dars natijasini saqlashda xatolik',
        message: "Natijani to'liq saqlab bo'lmadi. Iltimos, qayta saqlash tugmasini bosing.",
        error: err,
        retryLabel: 'Qayta saqlash',
        retryAction: () => handleCompleteLesson(score, mistakes),
      });
    } finally {
      completionInFlightRef.current = false;
      setSavingProgress(false);
    }
  };

  const handleExit = () => {
    const level = lesson?.language === 'ja' ? `?level=${lesson.level.toLowerCase()}` : '';
    navigate(`/jlpt${level}`);
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
          {loadError
            ? 'Darsni yuklab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.'
            : "Siz qidirayotgan dars mavjud emas yoki o'chirilgan bo'lishi mumkin."}
        </p>
        {loadError && (
          <button
            type="button"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            className="mr-2 min-h-[44px] rounded-xl border border-border px-5 text-sm font-bold text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Qayta urinish
          </button>
        )}
        <button
          onClick={handleExit}
          className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:opacity-90"
        >
          Darslarga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="lesson-player flex h-full w-full flex-col justify-between overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <div className="z-20 shrink-0 border-b border-border/70 bg-background/95 px-3.5 py-2.5 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 sm:gap-4 xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl">
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
                <span className="text-[11px] font-semibold text-primary sm:text-xs">
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
                <div className="text-[11px] font-medium text-muted-foreground">Bosqich</div>
                <div className="text-xs font-semibold tabular-nums text-foreground">
                  {currentStepIdx + 1} / {totalSteps}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Line */}
        <div className="mt-3 h-px w-full overflow-hidden bg-border">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          />
        </div>

        {/* Interactive Step Navigation Pills */}
        {lesson && totalSteps > 1 && (
          <div className="mt-2 flex items-center overflow-x-auto border-b border-border/60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {lesson.steps.map((step, idx) => {
              const isActive = currentStepIdx === idx && !isLessonCompleted;
              const isPast = completedIds.includes(step.id) || isLessonCompleted;
              const isLocked = idx > unlockedStepIdx;
              const isMondai =
                step.id.includes('s4') ||
                step.title.toLowerCase().includes('tinglash') ||
                step.title.toLowerCase().includes('mondai');

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleJumpToStep(idx)}
                  disabled={isLocked || savingProgress}
                  aria-current={isActive ? 'step' : undefined}
                  className={`group relative flex min-h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    isActive
                      ? isMondai
                        ? 'border-amber-500 text-amber-600 dark:text-amber-300'
                        : 'border-primary text-primary'
                      : isPast
                        ? 'border-transparent text-emerald-600 hover:text-emerald-500 dark:text-emerald-400'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  title={`${idx + 1}-qadam: ${step.title}`}
                >
                  <span className="flex items-center justify-center text-xs">
                    {isLocked ? (
                      <LockKeyhole size={13} />
                    ) : isPast && !isActive ? (
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
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area - Scrollable Container with bottom buffer */}
      <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-24 sm:px-6 sm:py-7 sm:pb-28 md:px-8 xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl">
        {isLessonCompleted ? (
          <LessonCompletionView
            lesson={lesson}
            userId={user?.id}
            scoreData={quizResult}
            progress={progress}
            newCardsCount={srsSummary.newCardsCount}
            mistakesCount={srsSummary.mistakesCount}
            onExit={handleExit}
          />
        ) : currentStep ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Step Type Pill Header */}
            <div className="mb-2 flex items-center border-b border-border/70 pb-3">
              <span
                className={`flex items-center gap-1.5 border-l-2 pl-3 text-sm font-semibold ${
                  currentStep.type === 'learn'
                    ? 'border-blue-500 text-blue-500'
                    : currentStep.type === 'practice'
                      ? 'border-purple-500 text-purple-500'
                      : currentStep.id.includes('s4') ||
                          currentStep.title.toLowerCase().includes('tinglash') ||
                          currentStep.title.toLowerCase().includes('mondai')
                        ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'border-emerald-500 text-emerald-500'
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
              <LearnStepView
                key={currentStep.id}
                content={currentStep.learnData}
                language={lesson.language}
                lesson={lesson}
                userId={user?.id || 'guest'}
              />
            )}

            {currentStep.type === 'practice' && currentStep.practiceData && (
              <PracticeStepView
                key={currentStep.id}
                onCompletePractice={handlePracticeCompletion}
                instructions={currentStep.practiceData.instructions}
                exercises={currentStep.practiceData.exercises}
                onIncorrectAnswer={handlePracticeIncorrectAnswer}
                onNextStep={handleNextStep}
              />
            )}

            {currentStep.type === 'test' && currentStep.testData && (
              <TestStepView
                key={currentStep.id}
                instructions={currentStep.testData.instructions}
                questions={currentStep.testData.questions}
                passingScorePercentage={currentStep.testData.passingScorePercentage}
                onCompleteTest={handleTestCompletion}
              />
            )}
          </div>
        ) : null}
      </div>

      {saveError && (
        <div role="alert" className="border-t border-destructive/30 p-3 text-sm text-destructive">
          {saveError}{' '}
          <button
            className="min-h-11 underline"
            onClick={() => {
              if (pendingProgressRef.current) void persistProgress(pendingProgressRef.current);
            }}
          >
            Qayta saqlash
          </button>
        </div>
      )}
      {!isLessonCompleted && currentStep?.type !== 'learn' && !canContinue && (
        <p className="px-4 py-2 text-center text-xs text-muted-foreground">
          {currentStep?.type === 'practice'
            ? 'Barcha mashqlarni bajaring va kamida 70% oling.'
            : `Testni yakunlang va kamida ${currentStep?.testData?.passingScorePercentage ?? 75}% oling.`}
        </p>
      )}
      {/* Bottom Step Controller Footer */}
      {!isLessonCompleted && (
        <div className="z-20 shrink-0 border-t border-border bg-background/95 p-3 pb-[max(env(safe-area-inset-bottom),0.875rem)] backdrop-blur-xl sm:p-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-2.5 sm:gap-4 xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIdx === 0 || savingProgress}
              className="h-11 shrink-0 cursor-pointer touch-manipulation select-none rounded-xl px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 sm:px-4"
            >
              <span className="sm:hidden">Oldingi</span>
              <span className="hidden sm:inline">Oldingi qadam</span>
            </button>

            {lesson && totalSteps > 1 && (
              <select
                value={currentStepIdx}
                disabled={savingProgress}
                onChange={(e) => handleJumpToStep(Number(e.target.value))}
                aria-label="Qadamga sakrash"
                className="h-11 min-w-0 flex-1 cursor-pointer truncate rounded-xl border border-border bg-background px-2 text-center text-xs font-semibold text-foreground focus:border-primary focus:outline-none sm:flex-none sm:px-3"
              >
                {lesson.steps.map((s, i) => (
                  <option key={s.id} value={i} disabled={i > unlockedStepIdx}>
                    {i + 1}/{totalSteps} · {s.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleNextStep}
              disabled={!canContinue || savingProgress}
              aria-label={
                currentStepIdx === totalSteps - 1 ? 'Darsni Yakunlash' : "Keyingi Qadamga O'tish"
              }
              className="flex h-11 cursor-pointer touch-manipulation select-none items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-6 md:text-sm"
            >
              <span>
                {savingProgress ? (
                  'Saqlanmoqda…'
                ) : currentStepIdx === totalSteps - 1 ? (
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

export const LessonPlayerPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useStudyData();
  return <LessonPlayerContent key={`${user?.id || 'guest'}:${lessonId}`} />;
};

export default LessonPlayerPage;
