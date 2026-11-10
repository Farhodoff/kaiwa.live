import React, { useState, useRef, useMemo } from 'react';
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
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Check,
  ArrowRight,
} from 'lucide-react';
import { ExamDiagnosticReport, ExamQuestionAnswer } from '../../utils/ai/examEvaluator';
import { JlptScoreReport } from '../../utils/jlptScoring';
import { useStudyData } from '../../context/StudyPlannerContext';
import { toast } from '../../hooks/use-toast';
import {
  MistakeVaultService,
  MistakeLevel,
  MistakeCategory,
} from '../../services/MistakeVaultService';

interface JlptExamResultCardProps {
  report: ExamDiagnosticReport;
  level: string;
  mistakes?: ExamQuestionAnswer[];
  jlptReport?: JlptScoreReport;
  onRetry: () => void;
  onBackToHub: () => void;
  onViewCertificate?: () => void;
}

export const JlptExamResultCard: React.FC<JlptExamResultCardProps> = ({
  report,
  level,
  mistakes = [],
  jlptReport: propJlptReport,
  onRetry,
  onBackToHub,
  onViewCertificate,
}) => {
  const { addFlashcardsBatch, user } = useStudyData();
  const [isExporting, setIsExporting] = useState(false);
  const [isExported, setIsExported] = useState(false);
  const [showAllMistakes, setShowAllMistakes] = useState(false);

  // Interactive Drill State
  const [isDrilling, setIsDrilling] = useState(false);
  const [drillIndex, setDrillIndex] = useState(0);
  const [selectedDrillOption, setSelectedDrillOption] = useState<string | null>(null);
  const [isDrillSubmitted, setIsDrillSubmitted] = useState(false);
  const [drillMasteredCount, setDrillMasteredCount] = useState(0);
  const [isDrillFinished, setIsDrillFinished] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlayingAudio(null);
      audio.onerror = () => setPlayingAudio(null);
      audio.play().catch(() => setPlayingAudio(null));
      setPlayingAudio(url);
    }
  };

  const handleNavigateMistakes = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/jlpt?tab=mistakes';
    }
  };

  const currentMistake = mistakes[drillIndex] || null;

  const drillOptions = useMemo(() => {
    if (!currentMistake) return [];
    if (currentMistake.options && currentMistake.options.length > 0) {
      return currentMistake.options;
    }
    const set = new Set<string>();
    if (currentMistake.correctAnswer) set.add(currentMistake.correctAnswer);
    if (currentMistake.userAnswer && currentMistake.userAnswer !== 'Javob berilmagan') {
      set.add(currentMistake.userAnswer);
    }
    return Array.from(set);
  }, [currentMistake]);

  const displayedMistakes = useMemo(() => {
    if (sectionFilter === 'ALL') return mistakes;
    return mistakes.filter((m) => {
      const sec = (m.section || '').toLowerCase();
      if (sectionFilter === 'knowledge') {
        return (
          sec.includes('knowledge') ||
          sec.includes('vocab') ||
          sec.includes('moji') ||
          sec.includes('grammar') ||
          sec.includes('bunpou')
        );
      }
      if (sectionFilter === 'reading') return sec.includes('reading') || sec.includes('dokkai');
      if (sectionFilter === 'listening')
        return sec.includes('listening') || sec.includes('choukai');
      return true;
    });
  }, [mistakes, sectionFilter]);

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

      // Ensure all mistakes are recorded into MistakeVaultService
      try {
        const mapSection = (sec?: string): MistakeCategory => {
          if (sec === 'choukai' || sec === 'listening') return 'listening';
          if (sec === 'dokkai' || sec === 'reading') return 'reading';
          if (sec === 'moji_goi' || sec === 'vocab') return 'vocab';
          return 'grammar';
        };
        MistakeVaultService.recordBatch(
          mistakes.map((q) => ({
            source: 'mock_exam',
            level: (level || 'N5') as MistakeLevel,
            category: mapSection(q.section),
            title: `JLPT ${level} Mock — ${q.section || 'General'}`,
            questionText: q.questionText,
            passageText: q.script || undefined,
            audioUrl: q.audioUrl,
            options:
              q.options && q.options.length > 0
                ? q.options
                : [q.correctAnswer, q.userAnswer].filter(Boolean),
            userAnswer: q.userAnswer,
            correctAnswer: q.correctAnswer,
            explanationUzbek: q.explanationUzbek || '',
          })),
          user?.id,
        );
      } catch {}

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

      {/* Targeted Remediation */}
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
            </div>

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

      {/* Interactive Mistake Drill Mode View */}
      {mistakes.length > 0 && isDrilling && currentMistake && (
        <div className="space-y-5 rounded-3xl border border-primary/40 bg-card p-5 shadow-lg sm:p-7">
          <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  🎯 Xatolar Ustida Interaktiv Mashq
                </h3>
                <p className="text-xs text-muted-foreground">
                  Imtihon xatolarini birma-bir qayta ishlab, mustahkamlang ({drillIndex + 1}/
                  {mistakes.length})
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDrilling(false)}
              className="flex items-center gap-1.5 self-end rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground sm:self-auto"
            >
              <span>Mashqdan chiqish</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>
                Savol {drillIndex + 1} / {mistakes.length}
              </span>
              <span className="font-black text-primary">
                {drillMasteredCount} ta o'zlashtirildi
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.round(((drillIndex + 1) / mistakes.length) * 100)}%` }}
              />
            </div>
          </div>

          {isDrillFinished ? (
            <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <Award size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-foreground">
                  🎉 Barakalla! Barcha xatolar qayta ko'rib chiqildi!
                </h4>
                <p className="text-xs text-muted-foreground">
                  Jami {mistakes.length} ta savoldan {drillMasteredCount} tasini muvaffaqiyatli
                  to'g'irlab o'zlashtirdingiz.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setDrillIndex(0);
                    setSelectedDrillOption(null);
                    setIsDrillSubmitted(false);
                    setDrillMasteredCount(0);
                    setIsDrillFinished(false);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-muted"
                >
                  <RotateCcw size={14} />
                  <span>Qaytadan boshlash</span>
                </button>
                <button
                  onClick={() => setIsDrilling(false)}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Check size={14} />
                  <span>Natijalarga qaytish</span>
                </button>
                <button
                  onClick={handleNavigateMistakes}
                  className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400"
                >
                  <BookOpen size={14} />
                  <span>Xatolar daftarini ochish</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary">
                  {currentMistake.section || 'Savol'}
                </span>
                {currentMistake.audioUrl && (
                  <button
                    onClick={() => toggleAudio(currentMistake.audioUrl!)}
                    className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/20"
                  >
                    {playingAudio === currentMistake.audioUrl ? (
                      <>
                        <Pause size={13} />
                        <span>To'xtatish</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} className="fill-current" />
                        <span>Audioni tinglash</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="font-serif text-base font-bold leading-relaxed text-foreground sm:text-lg">
                {currentMistake.questionText}
              </div>

              {/* Listening Script toggle if exists */}
              {currentMistake.script && (
                <div className="rounded-xl border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">🎧 Matn (Script):</span>
                  <p className="mt-1 whitespace-pre-line font-serif">{currentMistake.script}</p>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2 pt-2">
                {drillOptions.map((opt, oIdx) => {
                  const isSelected = selectedDrillOption === opt;
                  const isCorrect = opt === currentMistake.correctAnswer;
                  let optStyle = 'border-border/80 bg-card hover:bg-muted/80 text-foreground';

                  if (isDrillSubmitted) {
                    if (isCorrect) {
                      optStyle =
                        'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold';
                    } else if (isSelected && !isCorrect) {
                      optStyle =
                        'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold';
                    } else {
                      optStyle = 'border-border/40 opacity-50 text-muted-foreground';
                    }
                  } else if (isSelected) {
                    optStyle = 'border-primary bg-primary/10 text-primary font-bold shadow-xs';
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isDrillSubmitted}
                      onClick={() => setSelectedDrillOption(opt)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-all sm:text-sm ${optStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-[11px] font-bold">
                          {oIdx + 1}
                        </span>
                        <span className="font-serif">{opt}</span>
                      </div>
                      {isDrillSubmitted && isCorrect && (
                        <Check size={16} className="text-emerald-500" />
                      )}
                      {isDrillSubmitted && isSelected && !isCorrect && (
                        <XCircle size={16} className="text-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submitted Feedback & Explanation */}
              {isDrillSubmitted && (
                <div
                  className={`space-y-2 rounded-2xl border p-4 text-xs animate-in fade-in ${
                    selectedDrillOption === currentMistake.correctAnswer
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-100'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-black">
                    {selectedDrillOption === currentMistake.correctAnswer ? (
                      <>
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        <span>To'g'ri topdingiz! Barakalla.</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} className="text-rose-500" />
                        <span>
                          Noto'g'ri. To'g'ri javob:{' '}
                          <strong className="underline">{currentMistake.correctAnswer}</strong>
                        </span>
                      </>
                    )}
                  </div>
                  {currentMistake.explanationUzbek && (
                    <p className="border-t border-border/40 pt-2 text-[11px] leading-relaxed opacity-90">
                      💡 {currentMistake.explanationUzbek}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons: Check / Next */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {!isDrillSubmitted ? (
                  <button
                    disabled={!selectedDrillOption}
                    onClick={() => {
                      if (!selectedDrillOption) return;
                      setIsDrillSubmitted(true);
                      if (selectedDrillOption === currentMistake.correctAnswer) {
                        setDrillMasteredCount((c) => c + 1);
                        try {
                          MistakeVaultService.markAsMastered(
                            String(currentMistake.questionId || currentMistake.questionText),
                            user?.id,
                          );
                        } catch {}
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:opacity-50"
                  >
                    <span>Tekshirish</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (drillIndex + 1 < mistakes.length) {
                        setDrillIndex(drillIndex + 1);
                        setSelectedDrillOption(null);
                        setIsDrillSubmitted(false);
                      } else {
                        setIsDrillFinished(true);
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
                  >
                    <span>
                      {drillIndex + 1 < mistakes.length ? 'Keyingi savol' : 'Natijani yakunlash'}
                    </span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mistakes to Flashcards and Interactive Drill Actions */}
      {mistakes.length > 0 && (
        <div className="space-y-4 rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 p-5 shadow-xs sm:p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-500/20 p-2.5 text-rose-500 dark:text-rose-400">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  Xatolarni Fleshkartaga Saqlash va Mashq Qilish ({mistakes.length} ta savol)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Xato qilingan savollarni interaktiv qayta yeching, Anki kartalariga yuklang yoki
                  daftarda tahlil qiling.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Primary Interactive Drill Button */}
              <button
                onClick={() => {
                  setDrillIndex(0);
                  setSelectedDrillOption(null);
                  setIsDrillSubmitted(false);
                  setDrillMasteredCount(0);
                  setIsDrillFinished(false);
                  setIsDrilling(true);
                }}
                className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95"
              >
                <Play size={14} className="fill-current" />
                <span>Xatolarni mashq qilish</span>
              </button>

              {/* Flashcards Batch Export */}
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

              {/* Open Mistake Notebook Button */}
              <button
                onClick={handleNavigateMistakes}
                className="flex items-center gap-1.5 rounded-2xl border border-border bg-card/80 px-3.5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
              >
                <BookOpen size={14} className="text-primary" />
                <span>Xatolar daftari</span>
              </button>
            </div>
          </div>

          {/* Expandable list of all mistakes */}
          <div className="border-t border-border/50 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
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
                <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                  {(['ALL', 'knowledge', 'reading', 'listening'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setSectionFilter(filterKey)}
                      className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                        sectionFilter === filterKey
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {filterKey === 'ALL'
                        ? 'Barchasi'
                        : filterKey === 'knowledge'
                          ? 'Til bilimi'
                          : filterKey === 'reading'
                            ? "O'qish"
                            : 'Tinglash'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showAllMistakes && (
              <div className="mt-2 max-h-96 space-y-2.5 overflow-y-auto pr-1">
                {displayedMistakes.map((m, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 rounded-2xl border border-border/60 bg-background/80 p-3.5 text-xs transition-all hover:border-border"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">Savol #{idx + 1}</span>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                          {m.section || 'Umumiy'}
                        </span>
                        {(m.section === 'listening' || m.section === 'choukai') && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                            <Headphones size={12} /> Tinglash savoli
                          </span>
                        )}
                      </div>
                      {m.audioUrl && (
                        <button
                          type="button"
                          onClick={() => toggleAudio(m.audioUrl!)}
                          className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/20"
                        >
                          {playingAudio === m.audioUrl ? (
                            <>
                              <Pause size={11} />
                              <span>To'xtatish</span>
                            </>
                          ) : (
                            <>
                              <Play size={11} className="fill-current" />
                              <span>Audio eshitish</span>
                            </>
                          )}
                        </button>
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
                      <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 font-medium text-rose-500">
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
