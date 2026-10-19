import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Flame,
  CheckCircle2,
  Zap,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Play,
  Square,
  RefreshCw,
  Activity,
  ArrowRight,
  AlertCircle,
  Terminal,
  Download,
  Trash2,
  BookOpen,
  Mic,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRealTimeAnalytics } from '../../hooks/useRealTimeAnalytics';
import { useLanguage } from '../../context/LanguageContext';
import { ApiLoggingService } from '../../services/ApiLoggingService';
import { toast } from '../../hooks/use-toast';

export const RealTimeAnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const {
    metrics,
    isSessionActive,
    startStudySession,
    endStudySession,
    recordActivityEvent,
    latestFeedback,
    isGeneratingFeedback,
    refreshFeedback,
    apiMetrics,
    refreshApiMetrics,
  } = useRealTimeAnalytics();

  const [showApiLogs, setShowApiLogs] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<
    'flashcards' | 'quiz' | 'speaking' | 'kanji' | 'listening' | 'focus'
  >('quiz');

  // Format active session seconds into MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleSession = () => {
    if (isSessionActive) {
      endStudySession(5, 4, { manualEnd: true });
      toast({
        title: language === 'ja' ? 'セッション終了' : 'Dars seansi yakunlandi',
        description:
          language === 'ja'
            ? `学習時間が記録され、XPが付与されました。`
            : `O'rganish vaqti muvaffaqiyatli saqlandi va XP berildi! 🎉`,
      });
    } else {
      startStudySession(
        selectedActivityType,
        `${selectedActivityType.toUpperCase()} Jonli Amaliyot`,
      );
      toast({
        title: language === 'ja' ? 'セッション開始' : 'Jonli seans boshlandi',
        description:
          language === 'ja'
            ? 'タイマーがリアルタイムで測定中です。'
            : "O'rganish vaqti real-vaqtda hisoblanmoqda. Omad! ⏱️",
      });
    }
  };

  const handleSimulateActivity = (type: 'quiz' | 'flashcards' | 'speaking') => {
    if (type === 'quiz') {
      recordActivityEvent({
        activityType: 'quiz',
        title: 'JLPT N4 Grammatika Savollari',
        durationSeconds: 120,
        itemsCount: 5,
        successCount: 4,
        xpEarned: 15,
      });
    } else if (type === 'flashcards') {
      recordActivityEvent({
        activityType: 'flashcards',
        title: "So'z boyligi takrorlash (SRS)",
        durationSeconds: 90,
        itemsCount: 8,
        successCount: 7,
        xpEarned: 12,
      });
    } else {
      recordActivityEvent({
        activityType: 'speaking',
        title: 'AI Coach Muloqot Amaliyoti',
        durationSeconds: 180,
        itemsCount: 3,
        successCount: 3,
        xpEarned: 25,
      });
    }

    toast({
      title: language === 'ja' ? 'アクティビティ記録' : 'Faoliyat qayd etildi',
      description:
        language === 'ja'
          ? 'リアルタイムメトリクスが更新されました。'
          : "Natijadorlik va vaqt ko'rsatkichlari darhol yangilandi! ✨",
    });
  };

  const handleExportLogs = () => {
    try {
      const json = ApiLoggingService.exportLogsAsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nihongo-api-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Eksportda xatolik',
        description: 'Loglarni yuklab olishda muammo yuz berdi.',
      });
    }
  };

  const handleClearLogs = () => {
    ApiLoggingService.clearLogs();
    refreshApiMetrics();
    toast({
      title: language === 'ja' ? 'ログクリア' : 'Loglar tozalandi',
      description: 'API va tizim telemetriyasi tozalandi.',
    });
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 80) return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    if (rate >= 60) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div id="realtime-analytics-dashboard" className="space-y-6 duration-200 animate-in fade-in">
      {/* 1. Header Banner with Live Session Control */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-5 shadow-sm md:p-7">
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 items-center justify-center">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isSessionActive ? 'animate-ping bg-emerald-500' : 'bg-muted-foreground/40'
                  }`}
                />
              </span>
              <span
                className={`text-xs font-black uppercase tracking-wider ${
                  isSessionActive ? 'text-emerald-500' : 'text-muted-foreground'
                }`}
              >
                {isSessionActive
                  ? language === 'ja'
                    ? '● リアルタイム学習セッション進行中'
                    : "● Jonli O'rganish Seansi Faol"
                  : language === 'ja'
                    ? '○ スタンバイ（いつでも開始可能）'
                    : '○ Tayyor Holatda (Seans boshlashga tayyor)'}
              </span>
            </div>
            <h2 className="text-xl font-black text-foreground md:text-2xl">
              {language === 'ja'
                ? 'リアルタイム アナリティクス & AI フィードバック'
                : language === 'en'
                  ? 'Real-Time Analytics & Personalized AI Feedback'
                  : 'Real-Vaqt Tahlili & Shaxsiylashtirilgan AI Fikr'}
            </h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              {language === 'ja'
                ? '日々の学習時間、スキル別正答率、APIレイテンシをリアルタイムに自動追跡します。'
                : "Kunlik o'rganish vaqti, to'g'ri javoblar koeffitsiyenti va tizim telemetriyasini real-vaqtda kuzatish."}
            </p>
          </div>

          {/* Interactive Live Session Controller */}
          <div className="flex flex-wrap items-center gap-3">
            {isSessionActive ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    {metrics.activeSessionTitle || 'Seans'}
                  </span>
                  <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-300">
                    {formatTimer(metrics.activeSessionSeconds)}
                  </span>
                </div>
                <button
                  id="stop-study-session-btn"
                  onClick={handleToggleSession}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-rose-500 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition-all hover:bg-rose-600 active:scale-95"
                >
                  <Square size={14} />
                  <span>{language === 'ja' ? '終了する' : 'Yakunlash'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={selectedActivityType}
                  onChange={(e) => setSelectedActivityType(e.target.value as any)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="quiz">🎯 Quiz & Test</option>
                  <option value="flashcards">🎴 Flashcards</option>
                  <option value="speaking">🎙️ Speaking Coach</option>
                  <option value="kanji">✍️ Kanji Canvas</option>
                  <option value="listening">🎧 Choukai Listening</option>
                  <option value="focus">⏱️ Pomodoro Focus</option>
                </select>

                <button
                  id="start-study-session-btn"
                  onClick={handleToggleSession}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95"
                >
                  <Play size={14} />
                  <span>{language === 'ja' ? '計測スタート' : 'Boshlash'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top 4 Live KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Today's Study Time */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-muted-foreground">
              {language === 'ja' ? '本日の学習時間' : "Bugungi O'qish Vaqti"}
            </span>
            <span className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {metrics.todayStudyTimeMinutes}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              {language === 'ja' ? '分' : 'daqiqa'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>
              {isSessionActive
                ? `+${metrics.activeSessionSeconds}s jonli o'smoqda`
                : `${metrics.todayStudyTimeSeconds}s jami`}
            </span>
          </div>
        </div>

        {/* KPI 2: Overall Success Rate */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-muted-foreground">
              {language === 'ja' ? 'リアルタイム正答率' : 'Jonli Natijadorlik'}
            </span>
            <span
              className={`rounded-xl p-2 ${
                metrics.overallSuccessRate >= 80
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {metrics.overallSuccessRate}%
            </span>
            <span
              className={`flex items-center text-xs font-extrabold ${
                metrics.performanceTrend === 'improving'
                  ? 'text-emerald-500'
                  : metrics.performanceTrend === 'needs_attention'
                    ? 'text-rose-500'
                    : 'text-muted-foreground'
              }`}
            >
              {metrics.performanceTrend === 'improving' ? (
                <>
                  <TrendingUp size={13} className="mr-0.5" /> O'sish
                </>
              ) : metrics.performanceTrend === 'needs_attention' ? (
                <>
                  <TrendingDown size={13} className="mr-0.5" /> Pasayish
                </>
              ) : (
                'Barqaror'
              )}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {metrics.totalItemsSuccessful} / {metrics.totalItemsAttempted}{' '}
            {language === 'ja' ? '問正解' : "to'g'ri bajarildi"}
          </div>
        </div>

        {/* KPI 3: Weakest & Strongest Area */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-muted-foreground">
              {language === 'ja' ? 'スキル分析' : "Ko'nikmalar Tahlili"}
            </span>
            <span className="rounded-xl bg-purple-500/10 p-2 text-purple-500">
              <Zap size={18} />
            </span>
          </div>
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-500">★ Kuchli:</span>
              <span className="capitalize text-foreground">{metrics.strongestSkill}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-rose-400">⚠️ E'tibor:</span>
              <span className="capitalize text-foreground">{metrics.weakestSkill}</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {language === 'ja' ? 'AIレコメンド対象' : 'AI shaxsiy tavsiyasi uchun tayyor'}
          </div>
        </div>

        {/* KPI 4: Daily Streak & Gamification */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-muted-foreground">
              {language === 'ja' ? '連続学習日数' : "O'qish Seriyasi"}
            </span>
            <span className="rounded-xl bg-amber-500/10 p-2 text-amber-500">
              <Flame size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500">{metrics.streakDays}</span>
            <span className="text-xs font-bold text-muted-foreground">
              {language === 'ja' ? '日連続' : 'kun'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {language === 'ja' ? '継続は力なり 🔥' : "Har kuni o'rganish — muvaffaqiyat garovi 🔥"}
          </div>
        </div>
      </div>

      {/* 3. Spotlight Section: Personalized AI Feedback Generator */}
      <div
        id="personalized-ai-feedback-section"
        className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card/95 to-primary/5 p-6 shadow-md md:p-8"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-primary/20 p-1.5 text-primary">
                <Sparkles size={18} />
              </span>
              <h3 className="text-lg font-black text-foreground md:text-xl">
                {language === 'ja'
                  ? 'パーソナライズ AI フィードバック'
                  : 'Shaxsiylashtirilgan AI Fikr & Tavsiyalar'}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'ja'
                ? 'リアルタイムの学習統計に基づき、AIメンターが弱点克服のための最適解を提案します。'
                : "Sizning real-vaqt natijalaringiz tahlil qilinib, shaxsiylashtirilgan o'qish yo'riqnomasi tuzildi."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {latestFeedback && (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                {language === 'ja' ? '総合スコア:' : 'AI Bahosi:'} {latestFeedback.overallScore} /
                100
              </span>
            )}
            <button
              id="refresh-ai-feedback-btn"
              onClick={() => refreshFeedback()}
              disabled={isGeneratingFeedback}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isGeneratingFeedback ? 'animate-spin' : ''} />
              <span>
                {isGeneratingFeedback
                  ? language === 'ja'
                    ? 'AI生成中...'
                    : 'Tahlil qilinmoqda...'
                  : language === 'ja'
                    ? 'AI フィードバック更新'
                    : 'AI Tahlilni Yangilash'}
              </span>
            </button>
          </div>
        </div>

        {/* Feedback Body */}
        {latestFeedback ? (
          <div className="mt-6 space-y-6">
            {/* Summary Banner */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm font-bold text-foreground">
              {latestFeedback.summary}
            </div>

            {/* Strengths & Weaknesses 2-Column Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Strengths */}
              <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={16} />
                  <span>{language === 'ja' ? '強み・成果' : 'Kuchli Jihatlar'}</span>
                </div>
                <ul className="space-y-2 text-xs text-foreground/90">
                  {latestFeedback.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <AlertCircle size={16} />
                  <span>{language === 'ja' ? '改善ポイント' : 'Rivojlantirish Kerak'}</span>
                </div>
                <ul className="space-y-2 text-xs text-foreground/90">
                  {latestFeedback.areasForImprovement.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {language === 'ja' ? '推奨アクションプラン' : 'Tavsiya Etilgan Keyingi Qadamlar'}
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {latestFeedback.actionableRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    onClick={() => rec.actionUrl && navigate(rec.actionUrl)}
                    className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                            rec.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-500'
                              : rec.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-blue-500/10 text-blue-500'
                          }`}
                        >
                          {rec.priority}
                        </span>
                        <ArrowRight
                          size={14}
                          className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                        />
                      </div>
                      <div className="font-extrabold text-foreground">{rec.title}</div>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Quote & Study Pace */}
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4 sm:flex-row sm:items-center">
              <div className="text-xs italic text-muted-foreground">
                "{latestFeedback.motivationalQuote}"
              </div>
              <div className="text-xs font-bold text-foreground">
                📌 {latestFeedback.studyPaceAdvice}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center space-y-3 py-6 text-center">
            <Sparkles className="h-10 w-10 animate-pulse text-primary" />
            <p className="text-sm font-bold text-foreground">
              {language === 'ja'
                ? 'AIフィードバックを生成する準備が整いました。'
                : "AI tahlilini boshlash uchun 'AI Tahlilni Yangilash' tugmasini bosing."}
            </p>
            <button
              onClick={() => refreshFeedback()}
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm"
            >
              {language === 'ja' ? '今すぐ生成' : 'Hozir Generatsiya Qilish'}
            </button>
          </div>
        )}
      </div>

      {/* 4. Skill Breakdown & Recent Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Skill Breakdown */}
        <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-sm font-extrabold text-foreground">
              {language === 'ja' ? 'スキル別正答率・所要時間' : "Ko'nikmalar Bo'yicha Natijalar"}
            </h3>
            <span className="text-[11px] font-bold text-muted-foreground">
              {metrics.totalItemsAttempted} {language === 'ja' ? '問' : 'savol'}
            </span>
          </div>

          <div className="space-y-3.5">
            {Object.entries(metrics.skillBreakdown).map(([type, skill]) => {
              if (skill.itemsCount === 0 && skill.durationMinutes === 0) return null;
              return (
                <div key={type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold capitalize text-foreground">{type}</span>
                    <span className="font-extrabold text-muted-foreground">
                      {skill.accuracyPercent}% ({skill.successCount}/{skill.itemsCount}) •{' '}
                      {skill.durationMinutes}m
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all duration-500 ${
                        skill.accuracyPercent >= 80
                          ? 'bg-emerald-500'
                          : skill.accuracyPercent >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, skill.accuracyPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Simulation Bar for instant local test verification */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
            <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {language === 'ja' ? 'クイック実習シミュレータ' : 'Tezkor Amaliyot Sinovi'}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSimulateActivity('quiz')}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
              >
                <BookOpen size={13} className="text-blue-500" />
                <span>+5 Quiz Savoli</span>
              </button>
              <button
                onClick={() => handleSimulateActivity('flashcards')}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
              >
                <Layers size={13} className="text-purple-500" />
                <span>+8 Flashcard</span>
              </button>
              <button
                onClick={() => handleSimulateActivity('speaking')}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
              >
                <Mic size={13} className="text-emerald-500" />
                <span>+1 Speaking Seans</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Real-time Activity Feed */}
        <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              <h3 className="text-sm font-extrabold text-foreground">
                {language === 'ja'
                  ? 'リアルタイム アクティビティ履歴'
                  : 'Real-Vaqt Faoliyat Tarixi'}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">
              {metrics.recentEvents.length} {language === 'ja' ? '件' : 'ta voqea'}
            </span>
          </div>

          <div className="max-h-[300px] space-y-2.5 overflow-y-auto pr-1">
            {metrics.recentEvents.length > 0 ? (
              metrics.recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 transition-all hover:bg-muted/40"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-foreground">{ev.title}</span>
                      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold capitalize text-primary">
                        {ev.activityType}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {ev.timestamp.slice(11, 16)} • {ev.durationSeconds}s • {ev.itemsCount} ta
                      topshiriq
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-lg border px-2 py-0.5 text-xs font-black ${getSuccessColor(
                        ev.accuracyPercent,
                      )}`}
                    >
                      {ev.accuracyPercent}%
                    </span>
                    <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-black text-amber-500">
                      +{ev.xpEarned} XP
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                {language === 'ja'
                  ? '本日のアクティビティはまだありません。'
                  : "Bugun hali faoliyat qayd etilmagan. Yuqoridagi 'Boshlash' tugmasi bilan darsni boshlang!"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. System Metrics & API Logging Drawer */}
      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <button
          onClick={() => setShowApiLogs((prev) => !prev)}
          className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-all hover:bg-muted/30"
        >
          <div className="flex items-center gap-2.5">
            <span className="rounded-xl bg-muted p-2 text-foreground">
              <Terminal size={16} />
            </span>
            <div>
              <h4 className="text-sm font-extrabold text-foreground">
                {language === 'ja'
                  ? 'システムメトリクス & API ログ監視 (Telemetry)'
                  : 'Tizim Metriklari & API Telemetriya Loglari'}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {language === 'ja'
                  ? `総リクエスト: ${apiMetrics.totalCalls}件 | 成功率: ${apiMetrics.successRate}% | 平均応答速度: ${apiMetrics.avgDurationMs}ms`
                  : `Jami so'rovlar: ${apiMetrics.totalCalls} ta | Muvaffaqiyat: ${apiMetrics.successRate}% | O'rtacha kechikish: ${apiMetrics.avgDurationMs}ms`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {showApiLogs ? (
                <ChevronUp size={14} className="mr-1 inline" />
              ) : (
                <ChevronDown size={14} className="mr-1 inline" />
              )}
              {showApiLogs ? 'Yashirish' : "Ko'rish"}
            </span>
          </div>
        </button>

        {showApiLogs && (
          <div className="space-y-4 border-t border-border p-5 duration-150 animate-in fade-in">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-background p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Jami API So'rovlar
                </span>
                <div className="text-lg font-black text-foreground">{apiMetrics.totalCalls}</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Muvaffaqiyat Foizi
                </span>
                <div className="text-lg font-black text-emerald-500">{apiMetrics.successRate}%</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  O'rtacha Kechikish
                </span>
                <div className="text-lg font-black text-foreground">
                  {apiMetrics.avgDurationMs} ms
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Eng Sekin So'rov
                </span>
                <div className="text-lg font-black text-amber-500">
                  {apiMetrics.slowestDurationMs} ms
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                So'nggi API chaqiruvlari (Avtomatik loglanadi)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportLogs}
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted"
                >
                  <Download size={13} />
                  <span>JSON Eksport</span>
                </button>
                <button
                  onClick={handleClearLogs}
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-rose-500 transition-all hover:bg-rose-500/10"
                >
                  <Trash2 size={13} />
                  <span>Tozalash</span>
                </button>
              </div>
            </div>

            {/* Logs List */}
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-3 font-mono text-xs">
              {ApiLoggingService.getApiLogs({ limit: 15 }).length > 0 ? (
                ApiLoggingService.getApiLogs({ limit: 15 }).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between border-b border-border/30 pb-1.5 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black ${
                          log.success ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        [{log.method}]
                      </span>
                      <span className="text-foreground">{log.endpoint}</span>
                      {log.statusCode && (
                        <span className="text-muted-foreground">({log.statusCode})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{log.durationMs}ms</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {log.timestamp.slice(11, 19)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  Hozircha API loglari mavjud emas.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeAnalyticsDashboard;
