import React, { useEffect, useState, useMemo } from 'react';
import { HistoryService, MockExamItem, SpeakingSessionItem } from '../../services/HistoryService';
import { DailyQuestService } from '../../services/DailyQuestService';
import { useFlashcardStore } from '../../stores/useFlashcardStore';
import { JlptReadinessService, UserSkillStats } from '../../services/JlptReadinessService';
import { MistakeVaultService } from '../../services/MistakeVaultService';
import { JlptReadinessCard } from './JlptReadinessCard';
import { JlptSkillsBreakdown } from './JlptSkillsBreakdown';
import { Sparkles, Trophy, Flame, BookOpen, Volume2, History, Award } from 'lucide-react';
import { SvgLineChart } from '../ui/SvgCharts';
import { LessonKanjiService, LessonKanjiLevelSummary } from '../../services/LessonKanjiService';

export interface JlptProgressAnalyticsProps {
  userId?: string;
}

export const JlptProgressAnalytics: React.FC<JlptProgressAnalyticsProps> = ({ userId }) => {
  const [jlptExams, setJlptExams] = useState<MockExamItem[]>([]);
  const [jlptSpeaking, setJlptSpeaking] = useState<SpeakingSessionItem[]>([]);
  const [lessonKanjiSummary, setLessonKanjiSummary] = useState<LessonKanjiLevelSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [breakdownMode, setBreakdownMode] = useState<'4pillar' | '5pillar'>('4pillar');

  const flashcards = useFlashcardStore((s) => s.flashcards);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [exams, speaking] = await Promise.all([
          HistoryService.getMockExamsHistory(),
          HistoryService.getSpeakingHistory(),
        ]);

        setJlptExams(exams.filter((e) => e.examType === 'jlpt'));
        setJlptSpeaking(speaking.filter((s) => s.language === 'ja'));
      } catch (e) {
        console.error('[JlptProgressAnalytics] Error loading history:', e);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Stored target plan
  const savedTarget = localStorage.getItem('study_planner_jlpt_user_target');
  const targetPlan = savedTarget ? JSON.parse(savedTarget) : null;

  const chartData = [...jlptExams].reverse().map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    score: Math.round((item.score / item.totalQuestions) * 180),
    level: item.level || 'JLPT',
  }));

  const highestScore =
    jlptExams.length > 0
      ? Math.max(...jlptExams.map((e) => Math.round((e.score / e.totalQuestions) * 180)))
      : 0;

  const avgFluency =
    jlptSpeaking.length > 0
      ? jlptSpeaking.reduce((a, s) => a + s.fluencyScore, 0) / jlptSpeaking.length
      : null;

  const meta = DailyQuestService.getGamificationMeta(null);

  const userStats: UserSkillStats = useMemo(() => {
    const cards = Array.isArray(flashcards) ? flashcards : [];
    const kanjiFromCards = cards.filter((c) => /[\u4e00-\u9faf]/.test(c.front || '')).length;
    const grammarFromCards = cards.filter(
      (c) => c.subjectId?.includes('grammar') || (c as any).skill === 'grammar',
    ).length;

    const mistakeStats = MistakeVaultService.getStats();
    const readingAttempts = jlptExams.filter(
      (e) => (e as any).skill === 'reading' || (e as any).title?.toLowerCase().includes('dokkai'),
    ).length;

    return {
      vocabCount: Math.max(cards.length, meta.flashcardsReviewed || 0),
      vocabRetentionRate: 85,
      kanjiCount: Math.max(
        kanjiFromCards,
        meta.kanjiMastered || 0,
        lessonKanjiSummary?.masteredKanji || 0,
      ),
      lessonKanjiMasteredCount: lessonKanjiSummary?.masteredKanji,
      lessonKanjiReviewedCount: lessonKanjiSummary?.reviewedKanji,
      lessonKanjiTotalCount: lessonKanjiSummary?.totalKanji,
      grammarMasteredCount: Math.max(
        grammarFromCards,
        meta.listeningQuestionsCompleted > 0 ? 30 : 15,
      ),
      readingCompletedCount: Math.max(readingAttempts, (meta as any).readingPassagesCompleted || 0),
      readingAccuracy: 80,
      listeningCompletedCount: Math.max(
        meta.listeningQuestionsCompleted || 0,
        jlptExams.length * 4,
      ),
      listeningAccuracy: 80,
      speakingSessionsCount: Math.max(jlptSpeaking.length, meta.speakingSessionsCompleted || 0),
      speakingFluencyScore: avgFluency ?? 7.5,
      mockExamHighestScore: highestScore > 0 ? highestScore : meta.highestMockScore,
      unresolvedMistakesCount: mistakeStats.unresolved,
      mistakesByCategory: mistakeStats.byCategory,
    };
  }, [
    flashcards,
    meta,
    jlptExams.length,
    jlptSpeaking.length,
    avgFluency,
    highestScore,
    lessonKanjiSummary,
  ]);

  const activeLevel = (targetPlan?.currentLevel || 'N5') as any;

  useEffect(() => {
    let cancelled = false;
    void LessonKanjiService.getLevelProgressSummary(userId || '', activeLevel).then((summary) => {
      if (!cancelled) setLessonKanjiSummary(summary);
    });
    return () => {
      cancelled = true;
    };
  }, [activeLevel, userId]);

  const readinessReport = useMemo(() => {
    return JlptReadinessService.calculateReadiness(userStats, activeLevel);
  }, [userStats, activeLevel]);

  if (loading) return null;

  return (
    <div className="mb-8 space-y-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
              JLPT & Kaiwa Japanese Progress 🎌
            </h3>
            <p className="text-xs text-muted-foreground">
              Yapon tili darajangiz, imtihon sinovlari va so'zlashuv statistikasi
            </p>
          </div>
        </div>

        {targetPlan && (
          <div className="flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
            <Flame size={14} /> Target: {targetPlan.currentLevel || 'N5'} ➔{' '}
            {targetPlan.targetLevel || 'N2'}
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Topshirilgan Imtihonlar
          </span>
          <div className="flex items-center gap-1.5 text-2xl font-black text-foreground">
            <Trophy size={18} className="text-amber-500" />
            {jlptExams.length} <span className="text-xs font-normal text-muted-foreground">ta</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Kaiwa Suhbatlar (JA)
          </span>
          <div className="flex items-center gap-1.5 text-2xl font-black text-foreground">
            <Volume2 size={18} className="text-rose-500" />
            {jlptSpeaking.length}{' '}
            <span className="text-xs font-normal text-muted-foreground">seans</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Eng Yuqori Ball
          </span>
          <div className="flex items-center gap-1.5 text-2xl font-black text-foreground">
            <Award size={18} className="text-emerald-500" />
            {highestScore}
            <span className="text-xs font-normal text-muted-foreground">/ 180</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Suhbat Ravonligi Avg
          </span>
          <div className="flex items-center gap-1.5 text-2xl font-black text-foreground">
            <BookOpen size={18} className="text-indigo-500" />
            {avgFluency !== null ? avgFluency.toFixed(1) : '-'}/10
          </div>
        </div>
      </div>

      {/* 4/5-Pillar Radar & JLPT Readiness Assessment Card */}
      <JlptReadinessCard stats={userStats} initialLevel={activeLevel} />

      {lessonKanjiSummary && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Lesson Kanji Progress — {lessonKanjiSummary.level}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lessonKanjiSummary.masteredKanji} / {lessonKanjiSummary.totalKanji} kanji mastered
                {' · '}
                {lessonKanjiSummary.reviewedKanji} reviewed
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-amber-500/15 sm:w-56">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{
                  width: `${
                    lessonKanjiSummary.totalKanji > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (lessonKanjiSummary.masteredKanji / lessonKanjiSummary.totalKanji) *
                              100,
                          ),
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Skills Breakdown with Action Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {breakdownMode === '4pillar' ? 'Rasmiy 4 Ustun Tahlili' : "5 Ko'nikma Tahlili (+Kaiwa)"}
          </span>
          <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
            <button
              onClick={() => setBreakdownMode('4pillar')}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-black transition-all active:scale-95 ${
                breakdownMode === '4pillar'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🏛️ Rasmiy 4-Ustun
            </button>
            <button
              onClick={() => setBreakdownMode('5pillar')}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-black transition-all active:scale-95 ${
                breakdownMode === '5pillar'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🌐 5-Qirrali (+Kaiwa)
            </button>
          </div>
        </div>
        <JlptSkillsBreakdown
          pillars={
            breakdownMode === '4pillar' ? readinessReport.fourPillars : readinessReport.pillars
          }
        />
      </div>

      {/* Score History Progression Chart */}
      {chartData.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-6">
          <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground">
            <History size={14} className="text-rose-500" />
            JLPT Imtihon Natijalari Dinamikasi (180 ballik shkala)
          </h4>
          <div className="h-44 w-full pt-2">
            <SvgLineChart
              data={chartData}
              xKey="date"
              series={[{ dataKey: 'score', stroke: '#f43f5e', fill: '#f43f5e' }]}
              height={160}
              showArea={true}
              unit="ball"
              showGrid={true}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Hozircha JLPT imtihon sinovlari tarixi mavjud emas. JLPT Hub sahifasiga o'tib sinov
            topshiring! 🎌
          </p>
        </div>
      )}
    </div>
  );
};

export default JlptProgressAnalytics;
