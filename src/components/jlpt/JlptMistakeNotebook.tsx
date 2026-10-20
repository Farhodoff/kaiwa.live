import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  BookOpen,
  Trash2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  MistakeVaultService,
  JlptMistakeItem,
  MistakeLevel,
  MistakeCategory,
} from '../../services/MistakeVaultService';
import { useStudyData } from '../../context/StudyPlannerContext';
import { useLanguage } from '../../context/LanguageContext';
import { FuriganaText } from './FuriganaText';
import { getOrEnsureLanguageSubject } from '../../utils/subjectResolver';
import { toast } from '../../hooks/use-toast';
import { ActivityLoggingService } from '../../services/ActivityLoggingService';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';

export const JlptMistakeNotebook: React.FC = () => {
  const { user, addFlashcardsBatch, subjects, addSubject, awardXP } = useStudyData();
  const { haptics } = useTelegramWebApp();
  const { language } = useLanguage();

  const [mistakes, setMistakes] = useState<JlptMistakeItem[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<MistakeLevel | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<MistakeCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'unresolved' | 'mastered' | 'all'>('unresolved');

  // Interactive Re-test mode state
  const [isDrillMode, setIsDrillMode] = useState<boolean>(false);
  const [drillIndex, setDrillIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | string | null>(null);
  const [isDrillSubmitted, setIsDrillSubmitted] = useState<boolean>(false);
  const [drillScore, setDrillScore] = useState<number>(0);
  const [isDrillFinished, setIsDrillFinished] = useState<boolean>(false);

  const reloadMistakes = () => {
    const list = MistakeVaultService.getMistakes(user?.id);
    setMistakes(list);
  };

  useEffect(() => {
    reloadMistakes();
  }, [user?.id]);

  // Filtered mistakes
  const filteredMistakes = useMemo(() => {
    return mistakes.filter((item) => {
      const matchLevel = selectedLevel === 'ALL' || item.level === selectedLevel;
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unresolved' && item.status === 'unresolved') ||
        (statusFilter === 'mastered' && item.status === 'mastered');
      return matchLevel && matchCategory && matchStatus;
    });
  }, [mistakes, selectedLevel, selectedCategory, statusFilter]);

  // Overall Stats
  const stats = useMemo(() => {
    return MistakeVaultService.getStats(user?.id);
  }, [mistakes, user?.id]);

  const masteryPercentage = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  // Start Re-test drill
  const handleStartDrill = () => {
    const drillQuestions = filteredMistakes.filter((m) => m.status === 'unresolved');
    if (drillQuestions.length === 0) {
      toast({
        title: "Xatolar yo'q",
        description: "Ushbu filtr bo'yicha qayta yechish uchun faol xatolar mavjud emas.",
      });
      return;
    }
    setIsDrillMode(true);
    setDrillIndex(0);
    setSelectedOption(null);
    setIsDrillSubmitted(false);
    setDrillScore(0);
    setIsDrillFinished(false);
  };

  // Re-test Question
  const activeDrillQuestions = useMemo(() => {
    return filteredMistakes.filter((m) => m.status === 'unresolved');
  }, [filteredMistakes]);

  const currentDrillItem = activeDrillQuestions[drillIndex];

  const handleDrillSubmit = () => {
    if (selectedOption === null || isDrillSubmitted || !currentDrillItem) return;
    setIsDrillSubmitted(true);

    const isCorrect =
      typeof currentDrillItem.correctAnswer === 'number'
        ? selectedOption === currentDrillItem.correctAnswer
        : String(selectedOption).trim().toLowerCase() ===
          String(currentDrillItem.correctAnswer).trim().toLowerCase();

    if (isCorrect) {
      haptics.notification('success');
      setDrillScore((prev) => prev + 1);
      MistakeVaultService.markAsMastered(currentDrillItem.id, user?.id);
      if (awardXP) awardXP(20);
    } else {
      haptics.notification('warning');
    }
  };

  const handleNextDrill = () => {
    if (drillIndex < activeDrillQuestions.length - 1) {
      setDrillIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsDrillSubmitted(false);
    } else {
      setIsDrillFinished(true);
      haptics.notification('success');
      reloadMistakes();
      try {
        ActivityLoggingService.logActivity(
          {
            activityType: 'quiz',
            activityTitle: 'Xatolar Daftarchasi: Qayta Mashq',
            durationMinutes: Math.max(1, Math.ceil(activeDrillQuestions.length * 0.75)),
            itemsCount: activeDrillQuestions.length,
            xpEarned: drillScore * 20,
            metadata: {
              totalQuestions: activeDrillQuestions.length,
              correctCount: drillScore,
            },
          },
          user?.id,
        );
      } catch {}
    }
  };

  const handleExitDrill = () => {
    setIsDrillMode(false);
    reloadMistakes();
  };

  // 1-Click Export to Anki SRS
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const handleExportToFlashcards = async () => {
    if (filteredMistakes.length === 0) return;
    setIsExporting(true);
    try {
      const subjectId = await getOrEnsureLanguageSubject(subjects, addSubject, 'ja');
      const cards = filteredMistakes.map((m) => {
        const correctText =
          typeof m.correctAnswer === 'number' && m.options[m.correctAnswer]
            ? m.options[m.correctAnswer]
            : String(m.correctAnswer);

        return {
          subjectId,
          front: `[${m.level} ${m.category.toUpperCase()} XATO TAHLILI]\n\n❓ Savol:\n${m.questionText}`,
          back: `✅ To‘g‘ri javob:\n${correctText}\n\n💡 Tushuntirish:\n${m.explanationUzbek || 'Tushuntirish mavjud emas.'}`,
          interval: 1,
          repetitions: 0,
          easeFactor: 2.5,
        };
      });

      await addFlashcardsBatch(cards);
      haptics.notification('success');
      toast({
        title: "🎴 Fleshkartalarga Qo'shildi!",
        description: `${cards.length} ta xato savol SRS takrorlash ro‘yxatiga muvaffaqiyatli kiritildi.`,
      });
    } catch (e) {
      toast({
        title: 'Eksportda xatolik',
        description: "Fleshkartalarga qo'shishda xatolik yuz berdi.",
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Clear single mistake
  const handleDeleteMistake = (id: string) => {
    haptics.impact('light');
    MistakeVaultService.deleteMistake(id, user?.id);
    reloadMistakes();
  };

  // Clear all mastered
  const handleClearMastered = () => {
    haptics.impact('medium');
    MistakeVaultService.clearMastered(user?.id);
    reloadMistakes();
    toast({
      title: 'Tozalandi',
      description: "O'zlashtirilgan xatolar ro'yxatdan o'chirildi.",
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 duration-200 animate-in fade-in">
      {/* Top Banner & Stats Bar */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-rose-500/5 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <BookOpen size={20} />
              </span>
              <h2 className="text-xl font-black text-foreground sm:text-2xl">
                {language === 'ja' ? '弱点克服・誤答ノート' : 'Xatolar Daftari (Zaif Nuqtalar)'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Darslar, testlar va rasmiy mock imtihonlarda yo‘l qo‘yilgan xatolar markazi. Zaif
              mavzularni qayta yechib mustahkamlang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStartDrill}
              disabled={stats.unresolved === 0}
              className="flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition-all hover:bg-rose-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play size={14} className="fill-current" />
              <span>Qayta Yechish ({stats.unresolved})</span>
            </button>
            <button
              onClick={handleExportToFlashcards}
              disabled={filteredMistakes.length === 0 || isExporting}
              className="flex items-center gap-2 rounded-2xl border border-border bg-muted/60 px-3.5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={14} />
              <span>Fleshkartaga ({filteredMistakes.length})</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Badges */}
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-6">
          <div className="space-y-1 rounded-2xl border border-border bg-muted/20 p-3 text-center sm:p-4">
            <div className="text-[11px] font-bold text-muted-foreground">Faol Xatolar</div>
            <div className="text-lg font-black text-rose-600 dark:text-rose-400 sm:text-2xl">
              {stats.unresolved} <span className="text-xs font-bold">ta</span>
            </div>
          </div>
          <div className="space-y-1 rounded-2xl border border-border bg-muted/20 p-3 text-center sm:p-4">
            <div className="text-[11px] font-bold text-muted-foreground">O‘zlashtirildi</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 sm:text-2xl">
              {stats.mastered} <span className="text-xs font-bold">ta</span>
            </div>
          </div>
          <div className="space-y-1 rounded-2xl border border-border bg-muted/20 p-3 text-center sm:p-4">
            <div className="text-[11px] font-bold text-muted-foreground">Mustahkamlik</div>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400 sm:text-2xl">
              {masteryPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* RE-TEST DRILL OVERLAY VIEW */}
      {isDrillMode ? (
        <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-md animate-in zoom-in-95 md:p-8">
          {!isDrillFinished && currentDrillItem ? (
            <>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    {currentDrillItem.level}
                  </span>
                  <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-bold uppercase text-primary">
                    {currentDrillItem.category}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Savol {drillIndex + 1} / {activeDrillQuestions.length}
                  </span>
                </div>
                <button
                  onClick={handleExitDrill}
                  className="rounded-xl border border-border px-3 py-1 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Chiqish ✕
                </button>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                {currentDrillItem.passageText && (
                  <div className="rounded-2xl border border-border bg-muted/30 p-4 font-serif text-xs leading-relaxed text-foreground">
                    <FuriganaText text={currentDrillItem.passageText} />
                  </div>
                )}

                <h3 className="font-japanese text-lg font-bold leading-relaxed text-foreground sm:text-xl">
                  <FuriganaText text={currentDrillItem.questionText} />
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentDrillItem.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect =
                    idx === currentDrillItem.correctAnswer ||
                    String(idx) === String(currentDrillItem.correctAnswer);

                  let btnStyle =
                    'border-border bg-muted/30 text-foreground hover:border-primary/40 hover:bg-muted';

                  if (isDrillSubmitted) {
                    if (isCorrect) {
                      btnStyle =
                        'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold';
                    } else if (isSelected) {
                      btnStyle =
                        'border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold';
                    } else {
                      btnStyle = 'border-border bg-muted/20 text-muted-foreground/50';
                    }
                  } else if (isSelected) {
                    btnStyle = 'border-primary bg-primary/10 text-primary font-bold';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!isDrillSubmitted) {
                          setSelectedOption(idx);
                          haptics.selection();
                        }
                      }}
                      disabled={isDrillSubmitted}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition-all ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span>
                          <FuriganaText text={opt} />
                        </span>
                      </div>
                      {isDrillSubmitted && isCorrect && (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      )}
                      {isDrillSubmitted && isSelected && !isCorrect && (
                        <XCircle size={18} className="text-rose-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submit or Next Button */}
              {!isDrillSubmitted ? (
                <button
                  onClick={handleDrillSubmit}
                  disabled={selectedOption === null}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-40"
                >
                  <span>Tekshirish</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs">
                    <span className="font-bold text-foreground">💡 Tushuntirish:</span>{' '}
                    <span className="text-muted-foreground">
                      {currentDrillItem.explanationUzbek ||
                        'Ushbu savol uchun tushuntirish mavjud.'}
                    </span>
                  </div>
                  <button
                    onClick={handleNextDrill}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
                  >
                    <span>Keyingi Savol</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Drill Complete Summary */
            <div className="space-y-5 py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl font-bold text-emerald-500">
                🎉
              </div>
              <h3 className="text-2xl font-black text-foreground">Mashq Yakunlandi!</h3>
              <p className="text-sm text-muted-foreground">
                Siz {activeDrillQuestions.length} ta xatodan{' '}
                <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                  {drillScore} tasini
                </strong>{' '}
                to‘g‘ri yechib, o‘zlashtirilganlar qatoriga o‘tkazdingiz. (+{drillScore * 20} XP)
              </p>
              <button
                onClick={handleExitDrill}
                className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90"
              >
                Xatolar Daftariga Qaytish
              </button>
            </div>
          )}
        </div>
      ) : (
        /* NORMAL MISTAKE LIST VIEW */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
            {/* Status Switcher: Unresolved vs Mastered */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 p-1">
                <button
                  onClick={() => setStatusFilter('unresolved')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    statusFilter === 'unresolved'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ⚠️ Zaif Nuqtalar ({stats.unresolved})
                </button>
                <button
                  onClick={() => setStatusFilter('mastered')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    statusFilter === 'mastered'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ✅ O‘zlashtirildi ({stats.mastered})
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    statusFilter === 'all'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Barchasi ({stats.total})
                </button>
              </div>

              {stats.mastered > 0 && (
                <button
                  onClick={handleClearMastered}
                  className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-rose-600"
                >
                  <Trash2 size={13} />
                  <span>O‘zlashtirilganlarni tozalash</span>
                </button>
              )}
            </div>

            {/* Level & Category Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-muted-foreground">Daraja:</span>
              {(['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    selectedLevel === lvl
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {lvl}
                </button>
              ))}

              <div className="mx-1 h-4 w-px bg-border" />

              <span className="text-[11px] font-bold text-muted-foreground">Bo‘lim:</span>
              {(
                [
                  { id: 'ALL', label: 'Barchasi' },
                  { id: 'grammar', label: '✍️ Grammatika' },
                  { id: 'kanji', label: '⛩️ Kanji' },
                  { id: 'vocab', label: '📖 Lug‘at' },
                  { id: 'reading', label: '📰 O‘qish' },
                  { id: 'listening', label: '🎧 Tinglash' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          {filteredMistakes.length === 0 ? (
            <div className="space-y-3 rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
              <div className="text-4xl">🎉</div>
              <h3 className="text-base font-bold text-foreground">
                Ushbu filtr bo‘yicha xatolar topilmadi!
              </h3>
              <p className="text-xs text-muted-foreground">
                Siz dars va testlarda yangi savollarni yechganingiz sari adashgan savollaringiz shu
                yerda jamlanadi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMistakes.map((item) => {
                const correctText =
                  typeof item.correctAnswer === 'number' && item.options[item.correctAnswer]
                    ? item.options[item.correctAnswer]
                    : String(item.correctAnswer);

                const userText =
                  typeof item.userAnswer === 'number' && item.options[item.userAnswer]
                    ? item.options[item.userAnswer]
                    : String(item.userAnswer);

                return (
                  <div
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-xs font-black text-rose-600 dark:text-rose-400">
                          {item.level}
                        </span>
                        <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-bold uppercase text-foreground">
                          {item.category}
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {item.source === 'mock_exam'
                            ? '🎯 Mock Imtihon'
                            : item.source === 'lesson'
                              ? '📚 Darslik'
                              : '📝 Test'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === 'mastered' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={12} /> O‘zlashtirildi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={12} /> Zaif nuqta
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteMistake(item.id)}
                          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-rose-500"
                          title="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Broken Rule Identifier Badge */}
                    <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      <span>⚖️ Buzilgan Qoida:</span>
                      <span className="font-extrabold">
                        {MistakeVaultService.inferRuleBroken(item)}
                      </span>
                    </div>

                    {/* Question Prompt */}
                    <div className="font-japanese text-sm font-bold leading-relaxed text-foreground sm:text-base">
                      <FuriganaText text={item.questionText} />
                    </div>

                    {/* Comparison: Wrong vs Correct */}
                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-700 dark:text-rose-300">
                        <XCircle size={15} className="shrink-0 text-rose-500" />
                        <div>
                          <span className="font-bold opacity-75">Sizning javobingiz:</span>{' '}
                          <span className="font-japanese font-semibold">{userText}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                        <div>
                          <span className="font-bold opacity-75">To‘g‘ri javob:</span>{' '}
                          <span className="font-japanese font-semibold">{correctText}</span>
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    {item.explanationUzbek && (
                      <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">💡 Asosiy Tushuntirish:</span>{' '}
                        {item.explanationUzbek}
                      </div>
                    )}

                    {/* Distractor Analysis (Why other options are wrong) */}
                    {item.options && item.options.length > 1 && (
                      <div className="space-y-1.5 rounded-2xl border border-border/80 bg-muted/20 p-3.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                          🔍 Noto‘g‘ri variantlar tahlili (Distractor Analysis):
                        </span>
                        <div className="space-y-1.5 pt-1">
                          {MistakeVaultService.getDistractorAnalysis(item)
                            .filter((d) => !d.isCorrect)
                            .map((dist, dIdx) => (
                              <div
                                key={dIdx}
                                className="flex items-start gap-2 rounded-xl border border-border/60 bg-card/60 p-2 text-xs leading-relaxed"
                              >
                                <span className="font-japanese shrink-0 font-black text-rose-600 dark:text-rose-400">
                                  {dist.option}:
                                </span>
                                <span className="text-muted-foreground">{dist.reasonUzbek}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JlptMistakeNotebook;
