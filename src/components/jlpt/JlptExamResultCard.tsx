import React, { useState } from 'react';
import {
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ArrowLeft,
  XCircle,
  Sparkles,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldAlert,
  Headphones,
  CheckCircle2,
  Award,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ExamDiagnosticReport, ExamQuestionAnswer } from '../../utils/ai/examEvaluator';
import { JlptScoreReport } from '../../utils/jlptScoring';
import { useStudyData } from '../../context/StudyPlannerContext';
import { PersonalLearningPlanService } from '../../services/PersonalLearningPlanService';
import { toast } from '../../hooks/use-toast';

interface JlptExamResultCardProps {
  report: ExamDiagnosticReport;
  level: string;
  mistakes?: ExamQuestionAnswer[];
  jlptReport?: JlptScoreReport;
  onRetry: () => void;
  onBackToHub: () => void;
  onNavigateToPlan?: () => void;
  onViewCertificate?: () => void;
}

export const JlptExamResultCard: React.FC<JlptExamResultCardProps> = ({
  report,
  level,
  mistakes = [],
  jlptReport: propJlptReport,
  onRetry,
  onBackToHub,
  onNavigateToPlan,
  onViewCertificate,
}) => {
  const { user, addFlashcardsBatch } = useStudyData();
  const [isExporting, setIsExporting] = useState(false);
  const [isExported, setIsExported] = useState(false);
  const [showAllMistakes, setShowAllMistakes] = useState(false);
  const [isInjectingPlan, setIsInjectingPlan] = useState(false);
  const [isInjectedPlan, setIsInjectedPlan] = useState(false);
  const [injectedDays, setInjectedDays] = useState<string[]>([]);

  const handleGoToPlan = () => {
    if (onNavigateToPlan) {
      onNavigateToPlan();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/personal-plan';
    }
  };

  const handleInjectToPersonalPlan = async () => {
    const tasks = report.diagnosticAnalysis?.weeklyTasks || [];
    if (tasks.length === 0) {
      toast({
        title: 'Tavsiyalar mavjud emas',
        description: 'Ushbu imtihon uchun alohida zaiflik vazifalari aniqlanmadi.',
      });
      return;
    }

    setIsInjectingPlan(true);
    try {
      const activeUserId = user?.id || 'guest';
      const result = await PersonalLearningPlanService.injectRemediationTasks(
        activeUserId,
        tasks,
        level,
      );

      if (result.success) {
        setIsInjectedPlan(true);
        setInjectedDays(result.targetDays);
        toast({
          title: "🎯 Shaxsiy Rejaga Qo'shildi!",
          description: `${result.addedCount} ta maxsus amaliy mashg'ulot haftalik o'rganish rejangizga biriktirildi.`,
        });
      } else {
        toast({
          title: 'Xatolik',
          description: "Rejaga qo'shishda xatolik yuz berdi.",
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Xatolik',
        description: "Rejaga qo'shishda kutilmagan xatolik yuz berdi.",
        variant: 'destructive',
      });
    } finally {
      setIsInjectingPlan(false);
    }
  };

  const jlptReport = propJlptReport || report.jlptScoreReport;

  const handleExportMistakes = async () => {
    if (!mistakes || mistakes.length === 0) return;
    setIsExporting(true);
    try {
      const cards = mistakes.map((q) => {
        const extraScript = q.script ? `\n\n🎧 Tinglash matni (Script):\n${q.script}` : '';
        return {
          front: `🎌 JLPT ${level} Savol (${(q.section || 'Imtihon').toUpperCase()}):\n\n${q.questionText}${extraScript}`,
          back: `✅ To'g'ri javob:\n${q.correctAnswer}\n\n❌ Sizning javobingiz:\n${q.userAnswer}\n\n💡 Izoh:\n${q.explanationUzbek || "Ushbu savol JLPT imtihoni grammatika/lug'at qoidalariga asoslangan."}`,
        };
      });
      await addFlashcardsBatch(cards);
      setIsExported(true);
      toast({
        title: '🎴 Fleshkartalarga Saqlandi!',
        description: `${cards.length} ta xato qilingan savol Anki SRS fleshkartalar to'plamiga qo'shildi.`,
      });
    } catch (err) {
      console.error('Failed to export mistakes to flashcards:', err);
      toast({
        title: 'Xatolik',
        description: 'Fleshkartalarga saqlashda xatolik yuz berdi.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isPassed = jlptReport ? jlptReport.passed : report.passed;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4">
      {/* Official Certificate Style Header */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 text-center shadow-xl backdrop-blur-xl transition-all ${
          isPassed
            ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-card'
            : 'border-rose-500/40 bg-gradient-to-b from-rose-500/15 via-rose-500/5 to-card'
        }`}
      >
        {/* Japanese Certificate Subtitle */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span>日本語能力試験（JLPT）</span>
          <span>•</span>
          <span>合否結果通知書</span>
        </div>

        {/* Primary Title */}
        <h2 className="mt-2 text-xl font-black tracking-tight text-foreground sm:text-3xl">
          JLPT {level} Imtihon Natijasi
        </h2>

        {/* Official Status Stamp (Muhri) */}
        <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
          <div
            className={`inline-flex items-center gap-2 rounded-2xl border-2 px-6 py-2.5 shadow-md ${
              isPassed
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPassed ? (
              <>
                <CheckCircle2 size={24} className="stroke-[2.5]" />
                <span className="font-mono text-lg font-black tracking-wider">
                  合格 (GOUKAKU - O'TDI) 🎉
                </span>
              </>
            ) : (
              <>
                <XCircle size={24} className="stroke-[2.5]" />
                <span className="font-mono text-lg font-black tracking-wider">
                  不合格 (FUGOUKAKU - O'TMADI) ⚠️
                </span>
              </>
            )}
          </div>
        </div>

        {/* Points Display */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {jlptReport ? (
            <div className="rounded-2xl border border-border bg-background/80 px-4 py-2 shadow-xs">
              <span className="text-xs text-muted-foreground">Rasmiy Ball: </span>
              <span className="font-mono text-2xl font-black text-foreground">
                {jlptReport.totalScore}
              </span>
              <span className="font-mono text-sm text-muted-foreground"> / 180</span>
              <span className="ml-2 text-xs font-bold text-muted-foreground">
                (O'tish: {jlptReport.passMark})
              </span>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-background/80 px-4 py-2 shadow-xs">
            <span className="text-xs text-muted-foreground">To'g'rilik foizi: </span>
            <span className="font-mono text-2xl font-black text-foreground">
              {report.percentage}%
            </span>
          </div>

          {jlptReport?.passProbability !== undefined && (
            <div className="rounded-2xl border border-border bg-background/80 px-4 py-2 shadow-xs">
              <span className="text-xs text-muted-foreground">O'tish Ehtimoli: </span>
              <span
                className={`font-mono text-2xl font-black ${
                  jlptReport.passProbability >= 75
                    ? 'text-emerald-500'
                    : jlptReport.passProbability >= 50
                      ? 'text-amber-500'
                      : 'text-rose-500'
                }`}
              >
                {jlptReport.passProbability}%
              </span>
            </div>
          )}
        </div>

        {/* Status text badge */}
        <div className="mt-3 inline-block rounded-full border border-border bg-background px-3 py-1 text-xs font-extrabold tracking-wide shadow-xs">
          {report.overall_score_text}
        </div>

        {onViewCertificate && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={onViewCertificate}
              data-testid="view-certificate-btn"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Award className="h-4 w-4" />
              <span>🏆 Rasmiy Sertifikatni Ko'rish / Yuklab Olish</span>
            </button>
          </div>
        )}

        {/* Section Cutoff Alert (Crucial Pedagogical Notice) */}
        {jlptReport && jlptReport.statusReason === 'FAILED_SECTION_CUTOFF' && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-left text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            <ShieldAlert size={20} className="shrink-0 text-amber-500" />
            <div>
              <strong className="font-bold">Diqqat (Sectional Cutoff qoidasi):</strong>
              <p className="mt-0.5">
                Umumiy ballingiz ({jlptReport.totalScore} ball) o'tish chegarasidan (
                {jlptReport.passMark}) yuqori bo'lsa ham, rasmiy JLPT qoidasiga ko'ra har bir
                bo'limda kamida 19 ball to'plashingiz shart. Quyidagi bo'lim(lar)da minimal chegara
                bajarilmadi:{' '}
                <strong className="underline">
                  {jlptReport.failedSections.map((s) => jlptReport.sections[s].titleUz).join(', ')}
                </strong>
                .
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Official Sectional Breakdown Matrix (60 / 60 / 60) */}
      {jlptReport && (
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-black text-foreground">
                🎌 Bo'limlar bo'yicha Rasmiy Baholar (得点区分)
              </h3>
              <p className="text-xs text-muted-foreground">
                Har bir bo'lim maksimal 60 ball. Minimal o'tish chegarasi: 19 ball.
              </p>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              Jami: {jlptReport.totalScore} / 180 ball
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(['knowledge', 'reading', 'listening'] as const).map((secKey) => {
              const sec = jlptReport.sections[secKey];
              if (!sec) return null;
              const isSecPassed = sec.passed;
              return (
                <div
                  key={secKey}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                    isSecPassed
                      ? 'border-border/80 bg-muted/30'
                      : 'border-rose-500/40 bg-rose-500/5'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{sec.icon}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                          isSecPassed
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isSecPassed ? "O'tdi (≥19)" : 'Yiqildi (<19)'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-foreground">{sec.titleUz}</h4>
                    <p className="text-[10px] text-muted-foreground">{sec.titleJa}</p>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xl font-black text-foreground">
                        {sec.score}
                        <span className="text-xs font-medium text-muted-foreground"> / 60</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {sec.correctCount}/{sec.totalQuestions} to'g'ri
                      </span>
                    </div>

                    {/* Progress Bar with 19 Cutoff Line indicator (19/60 = 31.6%) */}
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isSecPassed ? 'bg-primary' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.round((sec.score / 60) * 100))}%` }}
                      />
                      {/* Vertical cutoff line at 19/60 mark */}
                      <div
                        className="absolute bottom-0 top-0 w-0.5 bg-foreground/60"
                        style={{ left: '31.6%' }}
                        title="19 ballik minimal chegara chizig'i"
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>0</span>
                      <span className="font-bold text-foreground">| 19 chegara</span>
                      <span>60</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weakness action button */}
          {jlptReport.weakestSection && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs sm:flex-row">
              <div className="flex items-center gap-2">
                <Target size={16} className="shrink-0 text-primary" />
                <span>
                  Eng ko'p e'tibor talab qiladigan zaif bo'lim:{' '}
                  <strong className="text-primary">
                    {jlptReport.sections[jlptReport.weakestSection]?.titleUz}
                  </strong>
                </span>
              </div>
              <button
                onClick={handleGoToPlan}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
              >
                <span>Shaxsiy Rejani Moslashtirish</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4-Pillar Competence Matrix */}
      {report.diagnosticAnalysis?.pillars && (
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-black text-foreground">
                🧭 4 Ustun bo'yicha Chuqur Diagnostika (JLPT Competence Radar)
              </h3>
              <p className="text-xs text-muted-foreground">
                Leksika, Grammatika, O'qish va Tinglash ko'nikmalarining o'zlashtirilish darajasi.
              </p>
            </div>
            {report.diagnosticAnalysis.criticalPillars.length > 0 && (
              <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-black text-rose-600 dark:text-rose-400">
                ⚠️ {report.diagnosticAnalysis.criticalPillars.length} ta zaif soha aniqlandi
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(['kanji_vocab', 'grammar', 'reading', 'listening'] as const).map((pKey) => {
              const p = report.diagnosticAnalysis!.pillars[pKey];
              if (!p) return null;
              const isCrit = p.status === 'critical';
              const isMod = p.status === 'moderate';

              return (
                <div
                  key={pKey}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                    isCrit
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : isMod
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-emerald-500/30 bg-emerald-500/5'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{p.icon}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                          isCrit
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : isMod
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {p.statusTextUz}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-foreground">{p.titleUz}</h4>
                    <p className="text-[10px] text-muted-foreground">{p.titleJa}</p>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xl font-black text-foreground">
                        {p.accuracyPercentage}%
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {p.correctCount}/{p.totalQuestions} to'g'ri
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isCrit ? 'bg-rose-500' : isMod ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${p.accuracyPercentage}%` }}
                      />
                    </div>

                    <p className="text-[10px] leading-tight text-muted-foreground">
                      {p.feedbackUz}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Targeted Remediation & One-Click Plan Integration */}
      {report.diagnosticAnalysis?.remediations &&
        report.diagnosticAnalysis.remediations.length > 0 && (
          <div className="space-y-4 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-card p-5 shadow-xs sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-500/20 p-2.5 text-indigo-500 dark:text-indigo-400">
                  <Target size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    🎯 Zaif Bo'limlar Bo'yicha Maxsus Mashqlar (Targeted Remediation)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Imtihon xatolarini bartaraf qilish uchun eng samarali dars va amaliyotlar.
                  </p>
                </div>
              </div>

              <button
                onClick={handleInjectToPersonalPlan}
                disabled={isInjectingPlan || isInjectedPlan}
                className={`flex shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black shadow-md transition-all ${
                  isInjectedPlan
                    ? 'cursor-default bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/25 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {isInjectedPlan ? (
                  <>
                    <CheckCircle size={15} />
                    <span>Rejangizga Biriktirildi!</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} className="fill-current text-amber-300" />
                    <span>
                      {isInjectingPlan
                        ? "Rejaga qo'shilmoqda..."
                        : '⚡ Shaxsiy Rejamga Biriktirish'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Injected banner */}
            {isInjectedPlan && (
              <div className="flex flex-col items-center justify-between gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 sm:flex-row">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  <span>
                    Vazifalar joriy haftalik rejangizga muvaffaqiyatli qo'shildi{' '}
                    {injectedDays.length > 0 ? `(${injectedDays.join(', ')})` : ''}!
                  </span>
                </div>
                <button
                  onClick={handleGoToPlan}
                  className="inline-flex items-center gap-1 font-bold underline hover:text-emerald-900 dark:hover:text-emerald-100"
                >
                  <span>Rejani ochish</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}

            {/* Remediation Cards Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {report.diagnosticAnalysis.remediations.map((rem) => (
                <div
                  key={rem.id}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-background/90 p-4 shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                          rem.severity === 'high'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {rem.severity === 'high' ? 'Kritik mashq' : 'Tavsiya'}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        ⏱️ {rem.estimatedMinutes} daqiqa
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-foreground">{rem.title}</h4>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {rem.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      Yo'nalish: {rem.skill.toUpperCase()}
                    </span>
                    <a
                      href={rem.route}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                    >
                      <span>{rem.actionText}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Mistakes to Flashcards Export Action */}
      {mistakes.length > 0 && (
        <div className="space-y-4 rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 p-5 shadow-xs sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-500/20 p-2.5 text-rose-500 dark:text-rose-400">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  Xatolarni Fleshkartaga Saqlash ({mistakes.length} ta savol)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Xato qilingan barcha savollarni 1 tugma bilan Anki SRS fleshkartalarga yuklab,
                  keyinroq takrorlang.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportMistakes}
              disabled={isExporting || isExported}
              className={`flex shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black shadow-xs transition-all ${
                isExported
                  ? 'cursor-default bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white shadow-rose-500/20 hover:bg-rose-700 active:scale-95'
              }`}
            >
              {isExported ? (
                <>
                  <CheckCircle size={15} />
                  <span>Saqlandi (Anki SRS)</span>
                </>
              ) : (
                <>
                  <BookOpen size={15} />
                  <span>{isExporting ? 'Saqlanmoqda...' : 'Fleshkartalarga saqlash'}</span>
                </>
              )}
            </button>
          </div>

          {/* Expandable list of all mistakes */}
          <div className="border-t border-border/50 pt-2">
            <button
              onClick={() => setShowAllMistakes(!showAllMistakes)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>
                {showAllMistakes
                  ? "Xatolar ro'yxatini yashirish"
                  : `Barcha ${mistakes.length} ta xatolarni ko'rish`}
              </span>
              {showAllMistakes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAllMistakes && (
              <div className="mt-3 max-h-80 space-y-2.5 overflow-y-auto pr-1">
                {mistakes.map((m, idx) => (
                  <div
                    key={idx}
                    className="space-y-1.5 rounded-2xl border border-border/60 bg-background/80 p-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>
                        Savol #{idx + 1} ({m.section || 'Umumiy'})
                      </span>
                      {m.section === 'listening' && (
                        <span className="flex items-center gap-1 text-[10px] text-primary">
                          <Headphones size={12} /> Tinglash savoli
                        </span>
                      )}
                    </div>
                    <div className="font-serif font-bold text-foreground">{m.questionText}</div>

                    {/* Show listening script if present */}
                    {m.script && (
                      <div className="rounded-xl border border-border/40 bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                        <span className="font-bold text-foreground">🎧 Dialog matni (Script):</span>
                        <p className="mt-1 whitespace-pre-line font-serif">{m.script}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-rose-500">
                        ❌ Sizning javob: {m.userAnswer}
                      </span>
                      <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-600 dark:text-emerald-400">
                        ✅ To'g'ri javob: {m.correctAnswer}
                      </span>
                    </div>
                    {m.explanationUzbek && (
                      <p className="border-t border-border/40 pt-1 text-[11px] italic text-muted-foreground">
                        💡 {m.explanationUzbek}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top 3 Mistakes Section */}
      {report.top_3_mistakes.length > 0 && (
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3 text-base font-extrabold text-foreground">
            <AlertTriangle size={18} className="text-amber-500" />
            <span>📌 Asosiy Topilgan Xatolar Tahlili (Top 3)</span>
          </div>

          <div className="space-y-3">
            {report.top_3_mistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="space-y-1.5 rounded-2xl border border-border/60 bg-muted/40 p-4"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-rose-500">
                  <XCircle size={14} />
                  <span>{mistake.title}</span>
                </div>
                <p className="text-xs font-medium leading-relaxed text-foreground">
                  {mistake.explanation_uz}
                </p>
                <div className="mt-1 inline-block rounded-xl bg-emerald-500/10 p-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  💡 {mistake.correct_concept}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Actionable Recommendation Card */}
      <div className="space-y-2 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 p-5 text-white shadow-lg backdrop-blur-md sm:p-6">
        <div className="flex items-center gap-2 text-sm font-extrabold text-indigo-300">
          <Lightbulb size={18} className="text-amber-400" />
          <span>🤖 AI Coach Tavsiyasi</span>
        </div>
        <p className="text-xs font-medium leading-relaxed text-gray-200 sm:text-sm">
          {report.actionable_recommendation}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted/80"
        >
          <ArrowLeft size={14} />
          <span>JLPT Hub-ga qaytish</span>
        </button>

        <div className="flex items-center gap-3">
          {onViewCertificate && (
            <button
              onClick={onViewCertificate}
              className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-600 transition-all hover:bg-amber-500/20 dark:text-amber-400"
            >
              <Award size={14} />
              <span>Sertifikat</span>
            </button>
          )}

          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-purple-500"
          >
            <RefreshCw size={14} />
            <span>Qayta topshirish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
