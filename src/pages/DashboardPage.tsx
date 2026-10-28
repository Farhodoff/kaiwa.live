import { Trophy, ArrowRight, Clock, Map, Sparkles, Loader2 } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import WeeklyStudyDigest from '../components/analytics/WeeklyStudyDigest';
import { LearningPathEngine } from '../services/LearningPathEngine';
import { LearningOrchestrator } from '../services/LearningOrchestrator';
import { LearningProgressionService } from '../services/LearningProgressionService';
import { RoadmapService } from '../services/RoadmapService';
import {
  NextBestAction,
  DailyLearningPlan,
  ProgressionState,
  LevelPromotionCandidate,
} from '../types/learningPath';
import { RoadmapSummary } from '../types/curriculum';
import { LevelUpModal } from '../components/gamification/LevelUpModal';
import { JlptReadinessService, UserSkillStats, JlptLevel } from '../services/JlptReadinessService';
import { DailyQuestService } from '../services/DailyQuestService';
import { MistakeVaultService } from '../services/MistakeVaultService';
import { LessonKanjiLevelSummary, LessonKanjiService } from '../services/LessonKanjiService';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading,
    flashcards,
    subjects,
    primaryLanguage,
    targetLevel,
    targetGoal,
    user,
    settings,
  } = useStudyData();
  const { language } = useLanguage();
  const isJaTrack = true; // Nihongo Talk is strictly Japanese only
  const cachedStateKey = `study_planner_cached_dashboard_ja`;
  const initialCached = useMemo(() => {
    return safeLocalStorage.getJSON<any>(cachedStateKey, null);
  }, [cachedStateKey]);

  const [nextAction, setNextAction] = useState<NextBestAction | null>(
    () => initialCached?.nextAction || null,
  );
  const [dailyPlan, setDailyPlan] = useState<DailyLearningPlan | null>(
    () => initialCached?.dailyPlan || null,
  );
  const [progression, setProgression] = useState<ProgressionState | null>(
    () => initialCached?.progression || null,
  );
  const [roadmapSummary, setRoadmapSummary] = useState<RoadmapSummary | null>(
    () => initialCached?.roadmapSummary || null,
  );
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionCandidate, setPromotionCandidate] = useState<LevelPromotionCandidate | null>(
    null,
  );
  const [lessonKanjiSummary, setLessonKanjiSummary] = useState<LessonKanjiLevelSummary | null>(
    null,
  );

  const dashboardJlptLevel = (
    ['N5', 'N4', 'N3', 'N2', 'N1'].includes(targetLevel) ? targetLevel : 'N5'
  ) as JlptLevel;

  useEffect(() => {
    let cancelled = false;
    void LessonKanjiService.getLevelProgressSummary(user?.id || '', dashboardJlptLevel).then(
      (summary) => {
        if (!cancelled) setLessonKanjiSummary(summary);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [dashboardJlptLevel, user?.id]);

  const resolveDashboardRoute = (route?: string) => {
    if (!route) return '/jlpt';
    if (
      (isJaTrack || primaryLanguage === 'ja') &&
      route.startsWith('/study-mode') &&
      !route.includes('lang=')
    ) {
      return `${route}${route.includes('?') ? '&' : '?'}lang=ja`;
    }
    return route;
  };

  // Daily progress comes only from the JLPT adaptive plan.
  // Calendar tasks live in Personal Plan / Calendar and are not counted here.
  const todayPlanActivities = dailyPlan?.activities || [];
  const totalDailyPlanCount = todayPlanActivities.length;
  const completedDailyPlanCount = todayPlanActivities.filter(
    (a) => a.isCompleted || a.status === 'completed',
  ).length;
  const pendingDailyPlanCount = totalDailyPlanCount - completedDailyPlanCount;

  const totalTodayItems = totalDailyPlanCount;
  const totalCompletedItems = completedDailyPlanCount;
  const totalPendingItems = pendingDailyPlanCount;

  const progressPercentage =
    totalTodayItems > 0 ? Math.round((totalCompletedItems / totalTodayItems) * 100) : 0;

  const nowForDue = new Date();
  const srsDueCount = flashcards.filter(
    (c) => c.nextReviewDate && new Date(c.nextReviewDate) <= nowForDue,
  ).length;

  const readinessReport = useMemo(() => {
    const cards = Array.isArray(flashcards) ? flashcards : [];
    const kanjiCount = cards.filter((c) => /[\u4e00-\u9faf]/.test(c.front || '')).length;
    const grammarCount = cards.filter(
      (c) => c.subjectId?.includes('grammar') || (c as any).skill === 'grammar',
    ).length;
    const meta = DailyQuestService.getGamificationMeta(null);
    const mistakes = MistakeVaultService.getStats(user?.id);

    const stats: UserSkillStats = {
      vocabCount: Math.max(cards.length, meta.flashcardsReviewed || 0),
      vocabRetentionRate: 85,
      kanjiCount: Math.max(
        kanjiCount,
        meta.kanjiMastered || 0,
        lessonKanjiSummary?.masteredKanji || 0,
      ),
      lessonKanjiMasteredCount: lessonKanjiSummary?.masteredKanji,
      lessonKanjiReviewedCount: lessonKanjiSummary?.reviewedKanji,
      lessonKanjiTotalCount: lessonKanjiSummary?.totalKanji,
      grammarMasteredCount: Math.max(grammarCount, meta.listeningQuestionsCompleted > 0 ? 35 : 20),
      readingCompletedCount: (meta as any).readingPassagesCompleted || 0,
      readingAccuracy: 80,
      listeningCompletedCount: meta.listeningQuestionsCompleted || 0,
      listeningAccuracy: 80,
      speakingSessionsCount: meta.speakingSessionsCompleted || 0,
      speakingFluencyScore: 7.5,
      mockExamHighestScore: meta.highestMockScore || 0,
      unresolvedMistakesCount: mistakes.unresolved,
      mistakesByCategory: mistakes.byCategory,
    };

    const targetLvl = (
      ['N5', 'N4', 'N3', 'N2', 'N1'].includes(targetLevel) ? targetLevel : 'N5'
    ) as JlptLevel;

    return JlptReadinessService.calculateReadiness(stats, targetLvl);
  }, [flashcards, targetLevel, user?.id, lessonKanjiSummary]);

  const greetingSubtitle = useMemo(() => {
    if (totalTodayItems === 0) {
      if (language === 'ja') return '今日の学習を始めましょう 🚀';
      if (language === 'en') return "Ready to start today's study journey? 🚀";
      return "Bugungi o'quv rejangizni boshlang 🚀";
    }
    if (totalPendingItems === 0) {
      if (language === 'ja') return '素晴らしい！今日の学習はすべて完了しました 🎉';
      if (language === 'en') return "Great job! All of today's tasks and lessons are completed 🎉";
      return 'Ajoyib! Bugungi barcha dars va vazifalar bajarildi 🎉';
    }
    if (language === 'ja') return `今日は ${totalPendingItems} 件の学習アクティビティがあります`;
    if (language === 'en') return `You have ${totalPendingItems} activities scheduled for today`;
    return `Bugun sizda ${totalPendingItems} ta dars va vazifa rejalashtirilgan`;
  }, [language, totalTodayItems, totalPendingItems]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (language === 'ja') {
      if (hour < 12) return 'おはようございます';
      if (hour < 18) return 'こんにちは';
      return 'こんばんは';
    }
    if (language === 'en') {
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    }
    if (hour < 12) return 'Xayrli tong';
    if (hour < 18) return 'Xayrli kun';
    return 'Xayrli kech';
  }, [language]);

  const handleManualPromotion = async () => {
    setIsPromoting(true);
    try {
      const activeUserId = user?.id || 'default-user';
      const result = await LearningOrchestrator.promoteIfReady(activeUserId, primaryLanguage);
      const candidate = LearningProgressionService.getPromotionCandidate(primaryLanguage);
      setPromotionCandidate(candidate);

      if (candidate) {
        alert(
          language === 'en'
            ? `Promotion candidate registered for ${candidate.candidateLevel}! Please confirm below.`
            : `${candidate.candidateLevel} darajasiga o'tish taklifi yaratildi! Iltimos, quyida tasdiqlang.`,
        );
      } else {
        alert(
          language === 'en'
            ? `Cannot promote: ${result.reason}`
            : `Darajani oshirib bo'lmadi: ${result.reason}`,
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleConfirmCandidatePromotion = async () => {
    setIsPromoting(true);
    try {
      const activeUserId = user?.id || 'default-user';
      const result = await LearningProgressionService.confirmPromotion(
        activeUserId,
        primaryLanguage,
      );
      if (result.promoted) {
        alert(
          language === 'en'
            ? `Congratulations! You have been promoted to ${result.newLevel}!`
            : `Tabriklaymiz! Siz ${result.newLevel} darajasiga ko'tarildingiz!`,
        );
        setPromotionCandidate(null);
        setRetryTrigger((prev) => prev + 1);
      } else {
        alert(
          language === 'en'
            ? `Cannot promote: ${result.reason}`
            : `Darajani oshirib bo'lmadi: ${result.reason}`,
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleDismissCandidatePromotion = () => {
    LearningProgressionService.dismissPromotion(primaryLanguage);
    setPromotionCandidate(null);
  };

  // Load Next Best Action & Adaptive Daily Plan dynamically in background
  useEffect(() => {
    let isMounted = true;
    setLoadingState('loading');
    const activeUserId = user?.id || 'default-user';

    const effectiveTrack = 'ja';

    // Background load of learning path state
    const pathPromise = LearningPathEngine.getLearningPathState(activeUserId, {
      forceLanguage: effectiveTrack,
      cachedFlashcards: flashcards,
      cachedSubjects: subjects,
    }).then(async (pathState) => {
      if (isMounted) {
        setNextAction(pathState.nextAction);
        setDailyPlan(pathState.todayPlan);
        setProgression(pathState.progression);

        // Update cache for next instant load
        safeLocalStorage.setJSON(cachedStateKey, {
          nextAction: pathState.nextAction,
          dailyPlan: pathState.todayPlan,
          progression: pathState.progression,
        });

        try {
          const candidate = await LearningProgressionService.evaluatePromotion(
            activeUserId,
            effectiveTrack,
          );
          if (isMounted) {
            setPromotionCandidate(candidate);
          }
        } catch (e) {
          console.warn('[DashboardPage] Failed to evaluate promotion:', e);
        }
      }
    });

    // Load roadmap summary (parallel, non-blocking)
    const roadmapPromise = LearningOrchestrator.getUserLearningState(activeUserId, {
      forceLanguage: effectiveTrack,
      cachedFlashcards: flashcards,
      cachedSubjects: subjects,
    })
      .then((learningState) => {
        if (isMounted) {
          const rm = RoadmapService.getLearningRoadmap(learningState);
          const sum = RoadmapService.getRoadmapSummary(rm);
          setRoadmapSummary(sum);
        }
      })
      .catch((err) => {
        console.warn('[DashboardPage] Failed to load roadmap summary:', err);
      });

    Promise.all([pathPromise, roadmapPromise])
      .then(() => {
        if (isMounted) setLoadingState('success');
      })
      .catch((err) => {
        console.warn('[DashboardPage] Background path sync:', err);
        if (isMounted) setLoadingState('error');
      });

    return () => {
      isMounted = false;
    };
  }, [
    isJaTrack,
    primaryLanguage,
    targetLevel,
    targetGoal,
    flashcards.length,
    subjects.length,
    user?.id,
    retryTrigger,
    cachedStateKey,
  ]);

  const isPlanCompleted = useMemo(() => {
    if (!dailyPlan || !dailyPlan.activities || dailyPlan.activities.length === 0) return false;
    return dailyPlan.activities.every(
      (activity) => activity.isCompleted || activity.status === 'completed',
    );
  }, [dailyPlan]);

  const effectiveTargetLevel = useMemo(() => {
    return ['ZERO', 'N5', 'N4', 'N3', 'N2', 'N1'].includes(targetLevel?.toUpperCase())
      ? targetLevel.toUpperCase()
      : 'N3';
  }, [targetLevel]);

  const effectiveTargetGoal = useMemo(() => {
    if (
      !targetGoal ||
      targetGoal.includes('IELTS') ||
      targetGoal.includes('English') ||
      targetGoal.includes('A1') ||
      targetGoal.includes('B2')
    ) {
      return 'JLPT Imtihoni';
    }
    return targetGoal;
  }, [targetGoal]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          role="status"
          aria-label="Loading Nihongo Talk dashboard..."
        />
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center space-y-4 p-6 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-500"
          aria-hidden="true"
        >
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {language === 'en'
            ? 'Failed to load learning path'
            : "Ma'lumotlarni yuklashda muammo yuz berdi"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {language === 'en'
            ? 'Please check your connection and try again.'
            : 'Sessiyani yuklashda xatolik yuz berdi. Iltimos tarmoq ulanishini tekshirib qayta urining.'}
        </p>
        <button
          onClick={() => {
            setLoadingState('loading');
            setRetryTrigger((prev) => prev + 1);
          }}
          className="rounded-xl bg-primary px-6 py-2.5 font-black text-primary-foreground shadow-sm transition-all hover:scale-[1.02] hover:bg-primary/95 active:scale-[0.98]"
          aria-label="Retry loading data"
        >
          {language === 'en' ? 'Retry' : 'Qayta urinish'}
        </button>
      </div>
    );
  }

  const displayUserName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : language === 'ja' ? '学習者' : 'Talaba');

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 duration-200 animate-in fade-in md:p-8">
      <LevelUpModal />
      {/* Top Greeting & Quick Stats */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            {greeting}, <span className="text-gradient">{displayUserName}</span> 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{greetingSubtitle}</p>
        </div>

        {/* Mini Stats Cards */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Streak Card */}
          <div className="glass-card flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-2.5 px-4 shadow-xs">
            <div className="flex items-center justify-center rounded-xl bg-amber-500/20 p-2 text-lg text-amber-500">
              🔥
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {language === 'ja' ? '連続日数' : 'Streak'}
              </div>
              <div className="text-sm font-black text-foreground">
                {settings?.currentStreak || 0} {language === 'ja' ? '日' : 'Kun'}
              </div>
            </div>
          </div>

          {/* Progress Card — single today fraction */}
          <div
            className="glass-card flex items-center gap-4 rounded-2xl border-border p-3 px-5"
            title={
              language === 'ja'
                ? '今日のプランとタスクの完了数'
                : 'Bugungi reja va vazifalar: bajarilgan / jami'
            }
          >
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Trophy size={24} />
            </div>
            <div>
              <div className="mb-1 flex items-end justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {language === 'en' ? 'Today' : 'Bugun'}
                </span>
                <span className="ml-4 text-sm font-bold text-foreground">
                  {totalCompletedItems}/{totalTodayItems} • {progressPercentage}%
                </span>
              </div>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] leading-none text-muted-foreground">
                {language === 'ja'
                  ? 'プラン＋タスク'
                  : language === 'en'
                    ? 'plan + tasks'
                    : 'reja + vazifalar'}
              </div>
            </div>
          </div>

          {/* JLPT Readiness Mini Card */}
          <Link
            to="/personal-plan"
            className="glass-card group flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-2.5 px-4 shadow-xs transition-all hover:border-rose-500/60 hover:bg-rose-500/10"
            title={
              language === 'ja'
                ? `JLPT ${readinessReport.level} 合格準備度: ${readinessReport.overallReadiness}%`
                : `JLPT ${readinessReport.level} tayyorgarligi: ${readinessReport.overallReadiness}%`
            }
          >
            <div className="flex items-center justify-center rounded-xl bg-rose-500/20 p-2 text-lg text-rose-500 transition-transform group-hover:scale-110">
              🎌
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <span>JLPT {readinessReport.level}</span>
                <span className="font-black">{readinessReport.overallReadiness}%</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-rose-500/20">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-700"
                    style={{ width: `${readinessReport.overallReadiness}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-foreground">
                  {readinessReport.projectedScore}/180
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Language Focus & Next Best Action Hero Card */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 shadow-xl md:p-8 ${
          primaryLanguage === 'ja'
            ? 'border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-card to-card'
            : 'border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-card to-card'
        }`}
      >
        <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl">🇯🇵</span>
              <span className="rounded-full border border-rose-500/30 bg-rose-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-400">
                JLPT {effectiveTargetLevel} Focus Mode
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                • {effectiveTargetGoal}
              </span>
            </div>

            {/* Next Best Action Banner */}
            {nextAction ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-500">
                    <Sparkles size={14} className="animate-pulse" />
                    {language === 'ja'
                      ? 'いま いちばん たいせつな ステップ'
                      : 'Hozirgi Eng Muhim Qadam'}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    ⏱️ ~{nextAction.estimatedMinutes} {language === 'ja' ? 'ふん' : 'daqiqa'}
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  {nextAction.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {nextAction.description ||
                    nextAction.reason?.description ||
                    nextAction.reason?.message ||
                    ''}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {language === 'ja'
                    ? 'きょうの にほんご レッスン'
                    : "Bugungi Yapon Tili Mashg'ulotlari"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'ja'
                    ? 'まいにち 20この かんじ、ぶんぽう、AI かいわ。'
                    : 'Har kuni 20 ta yangi Kanji, grammatika va AI muloqot.'}
                </p>
              </div>
            )}
          </div>

          {/* Single Primary Action CTA */}
          <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
            {nextAction && (
              <Link
                to={resolveDashboardRoute(nextAction.route)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] hover:bg-rose-500 active:scale-[0.98] sm:w-auto"
              >
                <span>{nextAction.badgeIcon || '🚀'}</span>
                <span>{nextAction.ctaLabel}</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Compact status panorama — no CTAs, details live in Roadmap/Progress/Review */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-card px-3 py-1.5 font-bold text-foreground">
          🎯 JLPT {effectiveTargetLevel}
        </span>
        {progression && (
          <span className="rounded-full border border-border bg-card px-3 py-1.5">
            {progression.currentLevel} → {progression.nextLevel || 'Max'} •{' '}
            {progression.readinessScore || 0}%
          </span>
        )}
        {roadmapSummary && (
          <span className="rounded-full border border-border bg-card px-3 py-1.5">
            🗺️ {roadmapSummary.completedCount}/{roadmapSummary.totalCount}
          </span>
        )}
        <span className="rounded-full border border-border bg-card px-3 py-1.5">
          🔁 SRS due: {srsDueCount}
        </span>
        {dailyPlan && (
          <span className="rounded-full border border-border bg-card px-3 py-1.5">
            ⏱️ {dailyPlan.totalMinutes} daq
          </span>
        )}
        <Link to="/progress" className="font-bold text-primary hover:underline">
          {language === 'ja' ? '詳細' : 'Batafsil →'}
        </Link>
      </div>

      {/* Daily quests live in Progress > Achievements; Dashboard keeps only Streak header */}

      {/* Today's Adaptive Daily Plan */}
      {dailyPlan && dailyPlan.activities && dailyPlan.activities.length > 0 && (
        <div className="glass-card space-y-4 rounded-3xl border border-border p-6 shadow-sm md:p-7">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                <Clock size={20} />
              </span>
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-foreground duration-300 animate-in fade-in">
                  {language === 'ja'
                    ? 'きょうの がくしゅうプラン'
                    : language === 'en'
                      ? "Today's Adaptive Plan"
                      : 'Bugungi Adaptiv Reja'}
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    ⏱️ {dailyPlan.totalMinutes}{' '}
                    {language === 'ja' ? 'ふん' : language === 'en' ? 'mins' : 'daqiqa'}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {dailyPlan.summary?.reason ||
                    (language === 'ja'
                      ? 'きょうの あなた専用 がくしゅうプラン'
                      : language === 'en'
                        ? 'Your customized route for today.'
                        : "Bugungi moslashtirilgan o'quv rejangiz.")}
                </p>
              </div>
            </div>
          </div>

          {isPlanCompleted ? (
            <div className="space-y-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-xl font-bold text-green-600 dark:text-green-400">
                🎉
              </div>
              <h4 className="text-base font-bold text-green-700 dark:text-green-400">
                {language === 'ja'
                  ? 'きょうの プランを かんりょうしました！'
                  : language === 'en'
                    ? "Today's Plan Completed!"
                    : 'Bugungi reja bajarildi!'}
              </h4>
              <p className="mx-auto max-w-md text-xs text-green-600 dark:text-green-500">
                {language === 'ja'
                  ? 'きょうの レッスンと ふくしゅうは すべて おわりました。あしたの プランも じどうで さくせいされます。'
                  : language === 'en'
                    ? "All scheduled tasks for today have been completed. Tomorrow's customized plan will be automatically generated."
                    : 'Bugun uchun rejalashtirilgan barcha dars va takrorlashlar yakunlandi. Ertangi reja avtomatik tayyorlanadi.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-3">
              {dailyPlan.activities.map((item, idx) => (
                <Link
                  key={item.id || idx}
                  to={resolveDashboardRoute(item.route)}
                  className={`group relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border p-4 transition-all ${
                    item.isCompleted || item.status === 'completed'
                      ? 'border-green-500/20 bg-green-500/5 opacity-70 hover:opacity-90'
                      : 'border-border/50 bg-secondary/30 hover:border-primary/40 hover:bg-secondary/60'
                  }`}
                  aria-label={`Step ${idx + 1}: ${item.title}, ${item.estimatedMinutes} minutes, ${
                    item.isCompleted || item.status === 'completed' ? 'Completed' : 'Pending'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
                        {idx + 1}-{language === 'ja' ? 'ステップ' : 'Qadam'}
                      </span>
                      {item.isCompleted || item.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                          ✓{' '}
                          {language === 'ja'
                            ? 'かんりょう'
                            : language === 'en'
                              ? 'Done'
                              : 'Bajarildi'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-primary">
                          <Clock size={12} /> {item.estimatedMinutes}{' '}
                          {language === 'ja' ? 'ふん' : language === 'en' ? 'min' : 'daq'}
                        </span>
                      )}
                    </div>
                    <h4 className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                      {item.title}
                    </h4>
                    <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                      {typeof item.reason === 'string'
                        ? item.reason
                        : item.reason?.description || item.reason?.message || ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-1 pt-1 text-xs font-bold text-primary">
                    <span>
                      {language === 'ja' ? 'スタート' : language === 'en' ? 'Start' : 'Boshlash'}
                    </span>
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Learning map teaser — full details live in Roadmap & Progress */}
      {roadmapSummary && (
        <div className="glass-card flex flex-col gap-3 rounded-3xl border border-border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-primary/10 p-2.5 text-primary">
              <Map size={20} />
            </span>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                {language === 'ja'
                  ? 'がくしゅう ロードマップ'
                  : language === 'en'
                    ? 'My Learning Roadmap'
                    : "Mening O'quv Yo'l Xaritam"}
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {roadmapSummary.currentLevelCode}{' '}
                  {language === 'ja' ? 'レベル' : language === 'en' ? 'Level' : 'Bosqich'} •{' '}
                  {roadmapSummary.completedCount}/{roadmapSummary.totalCount} •{' '}
                  {roadmapSummary.progressPercentage}%
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'ja'
                  ? '詳細はロードマップ・進捗で'
                  : 'Batafsil — Roadmap va Progress sahifasida'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              to="/roadmap"
              className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20"
            >
              <span>🗺️</span>
              <span>
                {language === 'ja'
                  ? 'ロードマップを みる'
                  : language === 'en'
                    ? 'View Full Roadmap'
                    : "To'liq Xarita"}
              </span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/progress"
              className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-all hover:border-primary/40"
            >
              <span>📊</span>
              <span>{language === 'ja' ? '進捗' : 'Progress'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Progression Track Section */}
      {progression && (
        <div className="glass-card space-y-4 rounded-3xl border border-border p-6 shadow-sm md:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-foreground">
                {language === 'ja'
                  ? 'レベルの せいちょう'
                  : language === 'en'
                    ? 'Level Progression Status'
                    : "Daraja bo'yicha rivojlanish"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {progression.explanation ||
                  (language === 'ja'
                    ? 'せいせきに もとづく レベルの しんちょく。'
                    : language === 'en'
                      ? 'Evidence-based progression tracking.'
                      : 'Bilim va natijalar asosida darajani oshirish.')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary">{progression.currentLevel}</span>
              <ArrowRight size={16} className="text-muted-foreground" />
              <span className="text-2xl font-black text-muted-foreground">
                {progression.nextLevel || 'Max'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                {language === 'ja' ? 'レベルアップ じゅんび:' : 'Promotion Readiness:'}
              </span>
              <span
                className={`font-bold ${progression.isReadyForPromotion ? 'text-green-500' : 'text-amber-500'}`}
              >
                {progression.readinessScore || 0}% (
                {progression.isReadyForPromotion
                  ? language === 'ja'
                    ? 'じゅんび OK ✓'
                    : language === 'en'
                      ? 'Ready ✓'
                      : 'Tayyor ✓'
                  : language === 'ja'
                    ? 'まだ じゅんびちゅう'
                    : language === 'en'
                      ? 'Not Ready'
                      : 'Tayyor emas'}
                )
              </span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuenow={progression.readinessScore || 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Promotion readiness percentage: ${progression.readinessScore || 0}%`}
            >
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  progression.isReadyForPromotion ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progression.readinessScore || 0}%` }}
              />
            </div>
          </div>

          {progression.advancementBlockers && progression.advancementBlockers.length > 0 && (
            <details className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {language === 'ja'
                  ? `⚠️ ${progression.nextLevel}への じょうけん (${progression.advancementBlockers.length})`
                  : `⚠️ Blockers to ${progression.nextLevel} (${progression.advancementBlockers.length})`}
              </summary>
              <ul className="list-inside list-disc space-y-1 pt-2 text-xs text-muted-foreground">
                {progression.advancementBlockers.map((blocker: string, index: number) => (
                  <li key={index}>{blocker}</li>
                ))}
              </ul>
            </details>
          )}

          {progression.recommendedAction && (
            <details className="rounded-xl border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-bold text-primary">
                {language === 'ja' ? '💡 つぎのステップ' : '💡 Next Step'}
              </summary>
              <span className="block pt-1">{progression.recommendedAction}</span>
            </details>
          )}

          {promotionCandidate ? (
            <div className="mt-2 space-y-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-bold text-primary">
                🏆{' '}
                {language === 'ja'
                  ? 'レベルアップの チャンス！'
                  : language === 'en'
                    ? 'Promotion Candidate Available!'
                    : "Yangi darajaga o'tish taklifi!"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {language === 'ja'
                  ? `${promotionCandidate.currentLevel} から ${promotionCandidate.candidateLevel} へ レベルアップできます！`
                  : language === 'en'
                    ? `You are ready to advance from ${promotionCandidate.currentLevel} to ${promotionCandidate.candidateLevel}!`
                    : `Siz ${promotionCandidate.currentLevel} darajasidan ${promotionCandidate.candidateLevel} darajasiga o'tishga tayyorsiz!`}
              </p>
              <p className="text-xs font-semibold italic text-muted-foreground">
                {language === 'ja'
                  ? `りゆう: ${promotionCandidate.reason}`
                  : language === 'en'
                    ? `Reason: ${promotionCandidate.reason}`
                    : `Sabab: ${promotionCandidate.reason}`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmCandidatePromotion}
                  disabled={isPromoting}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md disabled:opacity-50"
                >
                  {isPromoting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Trophy size={14} />
                  )}
                  <span>
                    {language === 'ja'
                      ? 'レベルアップする'
                      : language === 'en'
                        ? 'Confirm & Advance'
                        : "Darajaga o'tish"}
                  </span>
                </button>
                <button
                  onClick={handleDismissCandidatePromotion}
                  className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary/80"
                >
                  {language === 'ja' ? 'あとで' : language === 'en' ? 'Not Now' : 'Hozir emas'}
                </button>
              </div>
            </div>
          ) : (
            progression.isReadyForPromotion &&
            progression.nextLevel && (
              <button
                onClick={handleManualPromotion}
                disabled={isPromoting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 font-bold text-white shadow-md transition hover:bg-green-700 hover:shadow-lg disabled:opacity-50"
              >
                {isPromoting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>
                      {language === 'ja'
                        ? 'レベルアップちゅう...'
                        : language === 'en'
                          ? 'Promoting...'
                          : 'Darajani oshirish...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Trophy size={16} />
                    <span>
                      {language === 'ja'
                        ? `${progression.nextLevel}へ レベルアップを しんせい`
                        : language === 'en'
                          ? `Request Promotion to ${progression.nextLevel}`
                          : `${progression.nextLevel} darajasiga so'rov yuborish`}
                    </span>
                  </>
                )}
              </button>
            )
          )}
        </div>
      )}

      {/* Weekly Study Digest & Streak Analytics */}
      <WeeklyStudyDigest
        onNavigateToDecks={() => navigate('/decks')}
        onNavigateToSpeaking={() => navigate('/speaking')}
      />

      {/* Calendar tasks live in Personal Plan / Calendar — not duplicated here.
          Full AI insights live in Progress (SmartInsight). */}
      <div>
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="leading-relaxed text-muted-foreground">
            {language === 'ja'
              ? 'カレンダーのタスクは個人プランで管理します。ここはJLPTプランのみ。'
              : 'Kalendar vazifalar Shaxsiy reja va Kalendarda — bu yerda faqat JLPT rejasi.'}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/personal-plan"
              className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              {language === 'ja' ? '個人プラン' : 'Shaxsiy reja'}
            </Link>
            <Link
              to="/calendar"
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-primary/40"
            >
              {language === 'ja' ? 'カレンダー' : 'Kalendar'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
