import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Zap,
  Gauge,
  ChevronLeft,
  ChevronRight,
  Layers,
  Trophy,
  X,
  Target,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import FuriganaText, { FuriganaMode } from '../components/jlpt/FuriganaText';
import { JlptReadingPassage } from '../data/jlptReadingData';
import { CustomContentService } from '../services/CustomContentService';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { MasteryEngine } from '../services/MasteryEngine';
import { HistoryService } from '../services/HistoryService';
import { MistakeVaultService } from '../services/MistakeVaultService';
import { ActivityLoggingService } from '../services/ActivityLoggingService';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import {
  DokkaiSpeedReaderService,
  SokudokuMetrics,
  ReadingProgressRecord,
  JLPT_CPM_BENCHMARKS,
} from '../services/DokkaiSpeedReaderService';

export const JlptReadingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { awardXP, addSession, user } = useStudyData();
  const { haptics } = useTelegramWebApp();
  const { language } = useLanguage();
  const langKey = language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'uz';

  const urlLevel = (
    searchParams.get('level') ||
    (location.state as any)?.level ||
    (location.state as any)?.personalPlanTask?.level
  )?.toUpperCase();
  const initialLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(
    urlLevel,
  )
    ? (urlLevel as any)
    : 'N5';

  const [selectedLevel, setSelectedLevel] = useState<'N5' | 'N4' | 'N3' | 'N2' | 'N1'>(
    initialLevel,
  );
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);

  // Practice Modes: Standard vs Sokudoku (Speed-Reading Time-Pressure Drill)
  const [practiceMode, setPracticeMode] = useState<'standard' | 'sokudoku'>('standard');
  const [sokudokuPhase, setSokudokuPhase] = useState<'reading' | 'questions' | 'results'>(
    'reading',
  );
  const [speedDifficulty, setSpeedDifficulty] = useState<number>(1.0); // 1.0x, 0.8x, 0.6x
  const [readingTimeElapsed, setReadingTimeElapsed] = useState<number>(0);
  const [sokudokuMetrics, setSokudokuMetrics] = useState<SokudokuMetrics | null>(null);

  // Furigana & Paragraph Analysis Controls
  const [furiganaMode, setFuriganaMode] = useState<FuriganaMode>('hover');
  const [paragraphAnalysisMode, setParagraphAnalysisMode] = useState<boolean>(false);
  const [activeParagraphId, setActiveParagraphId] = useState<number | null>(null);

  // Passage Quick-List Modal
  const [isPassageListOpen, setIsPassageListOpen] = useState(false);
  const [passageHistory, setPassageHistory] = useState<Record<string, ReadingProgressRecord>>({});

  useEffect(() => {
    if (urlLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(urlLevel)) {
      setSelectedLevel(urlLevel as any);
      setCurrentPassageIndex(0);
    }
  }, [urlLevel]);

  useEffect(() => {
    setPassageHistory(DokkaiSpeedReaderService.getProgressHistory());
  }, []);

  const levelPassages = useMemo(
    () => CustomContentService.getMergedReadingPassages(selectedLevel),
    [selectedLevel],
  );
  const currentPassage: JlptReadingPassage | undefined =
    levelPassages[currentPassageIndex] || levelPassages[0];

  // User answers & state
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showTranslation, setShowTranslation] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Timer state
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const readingTimerRef = useRef<any>(null);

  // Reset state when passage changes
  useEffect(() => {
    setUserAnswers({});
    setIsSubmitted(false);
    setShowTranslation(false);
    setIsTimerActive(false);
    setSokudokuPhase('reading');
    setReadingTimeElapsed(0);
    setSokudokuMetrics(null);
    setActiveParagraphId(null);

    if (currentPassage) {
      const baseSeconds = Math.round(
        (currentPassage.recommendedTimeMinutes || 3) * 60 * speedDifficulty,
      );
      setTimeLeftSeconds(baseSeconds);
    }
  }, [selectedLevel, currentPassageIndex, speedDifficulty]);

  // General Countdown Timer
  useEffect(() => {
    let timer: any;
    if (isTimerActive && timeLeftSeconds > 0 && !isSubmitted) {
      timer = setTimeout(() => setTimeLeftSeconds((prev) => prev - 1), 1000);
    } else if (isTimerActive && timeLeftSeconds === 0 && !isSubmitted) {
      setIsSubmitted(true);
      if (practiceMode === 'sokudoku') {
        setSokudokuPhase('results');
      }
    }
    return () => clearTimeout(timer);
  }, [isTimerActive, timeLeftSeconds, isSubmitted, practiceMode]);

  // Sokudoku Reading Phase Stopwatch (counts up seconds spent actively reading)
  useEffect(() => {
    if (practiceMode === 'sokudoku' && sokudokuPhase === 'reading' && isTimerActive) {
      readingTimerRef.current = setInterval(() => {
        setReadingTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (readingTimerRef.current) clearInterval(readingTimerRef.current);
    }
    return () => {
      if (readingTimerRef.current) clearInterval(readingTimerRef.current);
    };
  }, [practiceMode, sokudokuPhase, isTimerActive]);

  // Parsed Paragraphs for Analysis
  const paragraphs = useMemo(() => {
    if (!currentPassage) return [];
    return DokkaiSpeedReaderService.splitIntoParagraphs(currentPassage.japaneseContent);
  }, [currentPassage]);

  const cleanCharCount = useMemo(() => {
    if (!currentPassage) return 0;
    return DokkaiSpeedReaderService.getCharacterCount(currentPassage.japaneseContent);
  }, [currentPassage]);

  // Live estimated CPM during reading
  const liveEstimatedCpm = useMemo(() => {
    if (readingTimeElapsed <= 1) return 0;
    return Math.round((cleanCharCount / readingTimeElapsed) * 60);
  }, [cleanCharCount, readingTimeElapsed]);

  const handleNextPassage = () => {
    if (currentPassageIndex < levelPassages.length - 1) {
      setCurrentPassageIndex((prev) => prev + 1);
    }
  };

  const handlePrevPassage = () => {
    if (currentPassageIndex > 0) {
      setCurrentPassageIndex((prev) => prev - 1);
    }
  };

  const handleFinishReadingAndOpenQuestions = () => {
    setSokudokuPhase('questions');
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    haptics.selection();
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!currentPassage || isSubmitted) return;
    setIsSubmitted(true);
    setIsTimerActive(false);

    // Calculate score
    let correctCount = 0;
    currentPassage.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const accuracy = Math.round((correctCount / (currentPassage.questions.length || 1)) * 100);
    if (accuracy >= 60) {
      haptics.notification('success');
    } else {
      haptics.notification('warning');
    }

    const readingDuration =
      practiceMode === 'sokudoku'
        ? Math.max(5, readingTimeElapsed)
        : Math.max(10, (currentPassage.recommendedTimeMinutes || 3) * 60 - timeLeftSeconds);

    // Calculate Sokudoku metrics
    const metrics = DokkaiSpeedReaderService.calculateMetrics({
      rawContent: currentPassage.japaneseContent,
      readingDurationSeconds: readingDuration,
      level: selectedLevel,
      correctAnswers: correctCount,
      totalQuestions: currentPassage.questions.length,
    });
    setSokudokuMetrics(metrics);
    setSokudokuPhase('results');

    // Save progress to DokkaiSpeedReaderService
    const progressRecord: ReadingProgressRecord = {
      passageId: currentPassage.id,
      level: selectedLevel,
      completedAt: new Date().toISOString(),
      score: correctCount,
      totalQuestions: currentPassage.questions.length,
      accuracy,
      durationSeconds: readingDuration,
      cpm: metrics.cpm,
      mode: practiceMode,
    };
    DokkaiSpeedReaderService.saveProgress(progressRecord);
    setPassageHistory(DokkaiSpeedReaderService.getProgressHistory());

    const earnedXp = correctCount * 20 + (metrics.speedRating !== 'slow' ? 15 : 0);
    if (correctCount > 0 && awardXP) {
      await awardXP(earnedXp);
    }

    if (addSession) {
      try {
        await addSession({
          duration: currentPassage.recommendedTimeMinutes || 5,
          type: 'focus',
          completed: true,
          startTime: new Date().toISOString(),
        });
      } catch (e) {}
    }

    // Persist attempt to ActivityLoggingService
    try {
      await ActivityLoggingService.logActivity(
        {
          activityType: 'quiz',
          activityTitle: `JLPT ${selectedLevel} Dokkai: ${currentPassage.title}`,
          durationMinutes: Math.max(1, Math.ceil(readingDuration / 60)),
          itemsCount: currentPassage.questions.length,
          xpEarned: earnedXp,
          metadata: {
            passageId: currentPassage.id,
            level: selectedLevel,
            accuracy,
            cpm: metrics.cpm,
            correctCount,
            totalQuestions: currentPassage.questions.length,
          },
        },
        user?.id,
      );
    } catch (e) {
      console.warn('Failed to log dokkai reading activity:', e);
    }

    // Persist attempt to HistoryService
    try {
      await HistoryService.saveMockExam({
        examType: 'jlpt',
        level: selectedLevel,
        score: correctCount,
        totalQuestions: currentPassage.questions.length,
        bandScore: Math.round((correctCount / (currentPassage.questions.length || 1)) * 180),
      });

      // Record evidence in MasteryEngine
      const activeUserId = user?.id || 'guest';
      MasteryEngine.recordEvidence(activeUserId, 'ja', {
        id: `jlpt_dokkai_${selectedLevel}_${Date.now()}`,
        skill: 'reading',
        score: accuracy,
        timestamp: new Date().toISOString(),
        details: `JLPT ${selectedLevel} Dokkai: ${correctCount}/${currentPassage.questions.length} to'g'ri (${accuracy}%) | ${metrics.cpm} CPM`,
        type: 'performance',
      });

      // Auto-capture reading mistakes in Mistake Vault
      const readingMistakes = currentPassage.questions
        .filter((q) => userAnswers[q.id] !== undefined && userAnswers[q.id] !== q.correctIndex)
        .map((q) => ({
          source: 'quiz' as const,
          level: selectedLevel,
          category: 'reading' as const,
          title: currentPassage.title,
          passageText: currentPassage.japaneseContent,
          questionText: q.questionText,
          options: q.options,
          userAnswer: userAnswers[q.id],
          correctAnswer: q.correctIndex,
          explanationUzbek:
            q.explanation ||
            currentPassage.uzbekTranslation ||
            "Matn mazmuniga ko'ra to'g'ri javobni tanlang.",
        }));

      if (readingMistakes.length > 0) {
        MistakeVaultService.recordBatch(readingMistakes, user?.id);
      }
    } catch (e) {
      console.warn('Failed to save JLPT reading score or mistakes:', e);
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPassageTypeLabel = (type?: string) => {
    switch (type) {
      case 'editorial':
        return {
          uz: 'Tahririyat / Shasetsu (社説)',
          ja: '社説・論説',
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        };
      case 'academic':
      case 'long':
        return {
          uz: 'Uzun / Ilmiy Matn (長文・論文)',
          ja: '長編・学術',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        };
      case 'medium':
        return {
          uz: "O'rta Matn (中文)",
          ja: '中編',
          color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        };
      case 'information_retrieval':
        return {
          uz: 'Axborot Qidirish (情報検索)',
          ja: '情報検索',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'short':
      default:
        return {
          uz: 'Qisqa Matn (短文)',
          ja: '短編',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5rem))] md:p-6 md:pb-8">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-xl md:p-6">
        <div className="flex items-center gap-3.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/jlpt')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-white md:text-2xl">
              📖 JLPT Dokkai (読解) Speed-Reader
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              Tezkor o'qish (速読), xatboshilar tahlili, WPM tezlik hisoblagichi va imtihon
              savollari
            </p>
          </div>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-950 p-1.5">
          {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setSelectedLevel(lvl);
                setCurrentPassageIndex(0);
              }}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-black transition-all active:scale-95 ${
                selectedLevel === lvl
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* N1 Advanced Hub Promo Callout */}
      {selectedLevel === 'N1' && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="text-xl">👑</span>
            <div>
              <div className="font-bold text-amber-300">
                N1 Oliy Daraja: Shasetsu, Rasmiy Biznes E-mail, Murakkab Keigo va Nozik Sinonimlar
              </div>
              <div className="mt-0.5 text-[11px] text-slate-300">
                Yaponiyaning yetakchi tahririyat maqolalari, ilmiy-falsafiy matnlar va rasmiy
                korporativ yozishmalar moduli.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/jlpt?tab=n1_mastery')}
            className="shrink-0 cursor-pointer rounded-xl bg-amber-500 px-3.5 py-2 font-black text-slate-950 shadow-xs transition-all hover:bg-amber-400 active:scale-95"
          >
            N1 Master Hubga o&apos;tish →
          </button>
        </div>
      )}

      {/* Mode Switcher & Carousel Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3.5 backdrop-blur-md">
        {/* Practice Mode Toggle */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => {
              setPracticeMode('standard');
              setSokudokuPhase('reading');
            }}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              practiceMode === 'standard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🧘 Standart Mutolaa
          </button>
          <button
            onClick={() => {
              setPracticeMode('sokudoku');
              setSokudokuPhase('reading');
              setIsTimerActive(true);
            }}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              practiceMode === 'sokudoku'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={14} className={practiceMode === 'sokudoku' ? 'text-amber-300' : ''} />
            <span>⚡ Sokudoku & Vaqt Bosimi</span>
          </button>
        </div>

        {/* Passage Navigation Carousel */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPassage}
            disabled={currentPassageIndex === 0}
            className="border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            <ChevronLeft size={16} />
          </Button>

          <button
            onClick={() => setIsPassageListOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-extrabold text-slate-200 transition-all hover:border-slate-700"
          >
            <Layers size={14} className="text-rose-500" />
            <span>
              Matn {currentPassageIndex + 1} / {levelPassages.length}
            </span>
            <span className="text-[10px] text-muted-foreground">▼</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPassage}
            disabled={currentPassageIndex >= levelPassages.length - 1}
            className="border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Sokudoku Speed-Reading Info Banner (When active) */}
      {practiceMode === 'sokudoku' && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/20 p-2 text-rose-400">
                <Gauge size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-300">
                  ⚡ Tezkor O'qish (速読 - Sokudoku) Drilli
                </h3>
                <p className="text-xs text-rose-200/80">
                  JLPT {selectedLevel} uchun me'yoriy tezlik:{' '}
                  <span className="font-bold text-white">
                    {JLPT_CPM_BENCHMARKS[selectedLevel].passingCpm} belgi/daqiqa
                  </span>
                  . Hozirgi matn hajmi:{' '}
                  <span className="font-bold text-white">{cleanCharCount} belgi</span>.
                </p>
              </div>
            </div>

            {/* Speed Multiplier */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-rose-300">Tezlik rejimi:</span>
              <div className="flex items-center rounded-lg border border-rose-500/30 bg-rose-950/60 p-0.5">
                {[
                  { mult: 1.0, label: "1.0x Me'yor" },
                  { mult: 0.8, label: '0.8x Sprint' },
                  { mult: 0.6, label: '0.6x Blitz' },
                ].map((s) => (
                  <button
                    key={s.mult}
                    onClick={() => setSpeedDifficulty(s.mult)}
                    className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-bold transition-all ${
                      speedDifficulty === s.mult
                        ? 'bg-rose-500 text-white'
                        : 'text-rose-300/70 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPassage ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Passage Content & Reading Phase */}
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 lg:col-span-7">
            {/* Passage Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${
                      getPassageTypeLabel(currentPassage.passageType).color
                    }`}
                  >
                    {getPassageTypeLabel(currentPassage.passageType).uz}
                  </span>
                  {passageHistory[currentPassage.id] && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 size={12} /> Bajarilgan ({passageHistory[currentPassage.id].cpm}{' '}
                      CPM)
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-white sm:text-xl">
                  <FuriganaText text={currentPassage.title} mode={furiganaMode} />
                </h2>
              </div>

              {/* Reading Tools: Furigana Mode, Paragraph Analysis, Translation */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Furigana Mode Selector */}
                <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-0.5">
                  <button
                    type="button"
                    onClick={() => setFuriganaMode('always')}
                    className={`cursor-pointer rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                      furiganaMode === 'always'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Barcha furiganalarni ko'rsatish"
                  >
                    振 ON
                  </button>
                  <button
                    type="button"
                    onClick={() => setFuriganaMode('hover')}
                    className={`cursor-pointer rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                      furiganaMode === 'hover'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Faqat sichqoncha borganda/teginganda ko'rsatish"
                  >
                    👁️ Hover
                  </button>
                  <button
                    type="button"
                    onClick={() => setFuriganaMode('never')}
                    className={`cursor-pointer rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                      furiganaMode === 'never'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Furiganani butunlay o'chirish"
                  >
                    🚫 OFF
                  </button>
                </div>

                {/* Paragraph Analysis Mode */}
                <button
                  onClick={() => {
                    setParagraphAnalysisMode(!paragraphAnalysisMode);
                    setActiveParagraphId(null);
                  }}
                  className={`flex cursor-pointer items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                    paragraphAnalysisMode
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                  title="Matnni xatboshilarga ajratib tahlil qilish"
                >
                  <Layers size={13} />
                  <span>Xatboshilar</span>
                </button>

                {/* Translation Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="border-slate-800 bg-slate-950 text-xs hover:bg-slate-800"
                >
                  {showTranslation ? (
                    <EyeOff size={13} className="mr-1" />
                  ) : (
                    <Eye size={13} className="mr-1" />
                  )}
                  <span>{showTranslation ? 'Yashirish' : 'Tarjima'}</span>
                </Button>
              </div>
            </div>

            {/* Paragraph Focus Reset Bar (if focused) */}
            {paragraphAnalysisMode && activeParagraphId !== null && (
              <div className="flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs text-indigo-300">
                <span className="font-bold">
                  🎯 {activeParagraphId}-xatboshi fokuslandi (
                  {paragraphs.find((p) => p.id === activeParagraphId)?.charCount} belgi)
                </span>
                <button
                  onClick={() => setActiveParagraphId(null)}
                  className="cursor-pointer text-[11px] font-bold text-indigo-400 underline hover:text-indigo-200"
                >
                  Barcha xatboshilarni ko'rish
                </button>
              </div>
            )}

            {/* Japanese Text Rendering Container */}
            <div className="min-h-[220px] space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950 p-6 text-lg font-medium leading-relaxed text-slate-100">
              {paragraphAnalysisMode
                ? // Paragraph-by-Paragraph Analysis View
                  paragraphs.map((p) => {
                    const isFocused = activeParagraphId === p.id;
                    const isDimmed = activeParagraphId !== null && !isFocused;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setActiveParagraphId(isFocused ? null : p.id)}
                        className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                          isFocused
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                            : isDimmed
                              ? 'border-slate-800/60 bg-slate-900/40 opacity-40 hover:opacity-80'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[10px] text-white">
                              {p.id}
                            </span>
                            <span>Xatboshi {p.id}</span>
                          </span>
                          <span className="text-slate-500">{p.charCount} belgi</span>
                        </div>
                        <p className="leading-relaxed">
                          <FuriganaText text={p.text} mode={furiganaMode} />
                        </p>
                      </div>
                    );
                  })
                : // Standard Fluid Reading View
                  paragraphs.map((p) => (
                    <p key={p.id} className="leading-relaxed">
                      <FuriganaText text={p.text} mode={furiganaMode} />
                    </p>
                  ))}
            </div>

            {/* Sokudoku Speed-Reading CTA (Phase 1: Reading completion) */}
            {practiceMode === 'sokudoku' && sokudokuPhase === 'reading' && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
                <div className="mb-3 flex items-center justify-center gap-3">
                  <div className="font-mono text-2xl font-black text-rose-400">
                    ⏱️ {formatTime(readingTimeElapsed)}
                  </div>
                  {liveEstimatedCpm > 0 && (
                    <span className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300">
                      ⚡ Taxminiy: ~{liveEstimatedCpm} CPM
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleFinishReadingAndOpenQuestions}
                  className="active:scale-98 w-full cursor-pointer rounded-2xl bg-rose-600 py-3.5 text-base font-extrabold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500"
                >
                  ⚡ Matnni O'qidim ➔ Savollarga O'tish ({readingTimeElapsed} soniya)
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Savollarga o'tganingizda o'qish tezligingiz qayd qilinadi va savollar ochiladi.
                </p>
              </div>
            )}

            {/* Uzbek Translation Drawer */}
            {showTranslation && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-relaxed text-amber-200/90 animate-in fade-in">
                <div className="mb-1 flex items-center gap-1.5 font-bold text-amber-400">
                  <span>🇺🇿 O'zbekcha Ma'no & Tarjima:</span>
                </div>
                <p>{currentPassage.uzbekTranslation}</p>
              </div>
            )}
          </div>

          {/* Right Column: Questions & Timer / Results */}
          <div className="space-y-6 lg:col-span-5">
            {/* Timer & Speed Metrics Card */}
            <div className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-2xl p-2.5 ${isTimerActive ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}
                >
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400">
                    {practiceMode === 'sokudoku' ? 'Qolgan Imtihon Vaqti' : 'Tavsiya Etilgan Vaqt'}
                  </div>
                  <div className="font-mono text-xl font-black text-white">
                    {formatTime(timeLeftSeconds)}
                  </div>
                </div>
              </div>

              {!isSubmitted && (
                <Button
                  variant={isTimerActive ? 'destructive' : 'secondary'}
                  size="sm"
                  onClick={() => setIsTimerActive(!isTimerActive)}
                  className="rounded-xl font-bold"
                >
                  {isTimerActive ? (
                    <Pause size={14} className="mr-1" />
                  ) : (
                    <Play size={14} className="mr-1" />
                  )}
                  {isTimerActive ? "To'xtatish" : 'Boshlash'}
                </Button>
              )}
            </div>

            {/* Sokudoku Result Summary (When Submitted) */}
            {isSubmitted && sokudokuMetrics && (
              <div className="space-y-4 rounded-3xl border border-rose-500/30 bg-slate-900 p-5 shadow-lg animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-black text-white">
                    <Trophy className="text-amber-400" size={18} />
                    <span>Sokudoku O'qish Natijalari</span>
                  </div>
                  <span className="rounded-lg border border-rose-500/30 bg-rose-500/20 px-2.5 py-0.5 text-xs font-extrabold text-rose-300">
                    {sokudokuMetrics.speedRatingLabel[langKey]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      O'qish Tezligi
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-black text-white">{sokudokuMetrics.cpm}</span>
                      <span className="text-[11px] text-slate-400">CPM</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      ~{sokudokuMetrics.wpm} WPM
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Aniqlik
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-black text-white">
                        {sokudokuMetrics.comprehensionAccuracy}%
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Savollar bo'yicha</span>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sarflangan Vaqt
                    </span>
                    <div className="mt-1 font-mono text-xl font-black text-white">
                      {sokudokuMetrics.readingDurationSeconds}s
                    </div>
                    <span className="text-[10px] text-muted-foreground">Matn mutolaasi</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs leading-relaxed text-slate-300">
                  <span className="font-bold text-rose-400">💡 Tahlil & Maslahat: </span>
                  {sokudokuMetrics.feedback[langKey]}
                </div>

                {currentPassageIndex < levelPassages.length - 1 && (
                  <Button
                    onClick={handleNextPassage}
                    className="w-full cursor-pointer rounded-2xl bg-rose-600 py-3 font-bold text-white hover:bg-rose-500"
                  >
                    Keyingi Matnga O'tish ➔
                  </Button>
                )}
              </div>
            )}

            {/* Questions List Container */}
            <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="flex items-center gap-2 text-base font-black text-white">
                  <HelpCircle className="h-4 w-4 text-sky-400" />
                  Matn Bo'yicha Savollar ({currentPassage.questions.length})
                </h3>
                {isSubmitted && (
                  <span className="text-xs font-bold text-slate-400">
                    To'g'ri:{' '}
                    {
                      currentPassage.questions.filter((q) => userAnswers[q.id] === q.correctIndex)
                        .length
                    }{' '}
                    / {currentPassage.questions.length}
                  </span>
                )}
              </div>

              {/* In Sokudoku Mode & Reading Phase: Hide questions to avoid premature peeking */}
              {practiceMode === 'sokudoku' && sokudokuPhase === 'reading' ? (
                <div className="space-y-3 rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center">
                  <Target className="mx-auto h-10 w-10 animate-pulse text-rose-500/60" />
                  <p className="text-sm font-bold text-slate-300">
                    Hozir faqat matnni tez o'qishga diqqat qarating!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Matnni o'qib bo'lgach, "Savollarga O'tish" tugmasini bosing va vaqt to'xtatilib
                    savollar ochiladi.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFinishReadingAndOpenQuestions}
                    className="border-slate-700 text-xs text-slate-300"
                  >
                    Savollarni ko'rsatish
                  </Button>
                </div>
              ) : (
                currentPassage.questions.map((q, qIdx) => {
                  const selectedOpt = userAnswers[q.id];
                  return (
                    <div key={q.id} className="space-y-3">
                      <div className="text-sm font-bold text-slate-200">
                        {qIdx + 1}. <FuriganaText text={q.questionText} mode={furiganaMode} />
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedOpt === oIdx;
                          const isCorrect = q.correctIndex === oIdx;

                          let btnStyle =
                            'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300';

                          if (isSubmitted) {
                            if (isCorrect) {
                              btnStyle =
                                'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-semibold';
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'border-rose-500/50 bg-rose-500/10 text-rose-300';
                            }
                          } else if (isSelected) {
                            btnStyle = 'border-rose-500 bg-rose-500/20 text-white font-medium';
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={isSubmitted}
                              onClick={() => handleSelectAnswer(q.id, oIdx)}
                              className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-left text-sm transition-all ${btnStyle}`}
                            >
                              <span>
                                <FuriganaText text={opt} mode={furiganaMode} />
                              </span>
                              {isSubmitted && isCorrect && (
                                <CheckCircle2 className="ml-2 h-4 w-4 shrink-0 text-emerald-400" />
                              )}
                              {isSubmitted && isSelected && !isCorrect && (
                                <XCircle className="ml-2 h-4 w-4 shrink-0 text-rose-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation when submitted */}
                      {isSubmitted && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                          <span className="font-semibold text-rose-400">Tushuntirish: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Action Buttons */}
              {practiceMode !== 'sokudoku' || sokudokuPhase !== 'reading' ? (
                !isSubmitted ? (
                  <Button
                    variant="default"
                    onClick={handleSubmit}
                    className="active:scale-98 w-full cursor-pointer rounded-2xl bg-rose-600 py-3.5 font-black text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500"
                  >
                    Javoblarni Tekshirish 🚀
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUserAnswers({});
                      setIsSubmitted(false);
                      setSokudokuPhase('reading');
                      setReadingTimeElapsed(0);
                      setSokudokuMetrics(null);
                      if (currentPassage) {
                        setTimeLeftSeconds(
                          Math.round(
                            (currentPassage.recommendedTimeMinutes || 3) * 60 * speedDifficulty,
                          ),
                        );
                      }
                    }}
                    className="w-full cursor-pointer rounded-2xl border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Qayta O'rinib Ko'rish
                  </Button>
                )
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
          <BookOpen className="mx-auto h-12 w-12 text-slate-600" />
          <p>Ushbu daraja uchun o'qish matnlari tez orada qo'shiladi.</p>
        </div>
      )}

      {/* Quick Passage Select Modal */}
      {isPassageListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="text-rose-500" size={20} />
                <h3 className="text-base font-black text-white">
                  JLPT {selectedLevel} Matnlar Katalogi ({levelPassages.length})
                </h3>
              </div>
              <button
                onClick={() => setIsPassageListOpen(false)}
                className="cursor-pointer rounded-xl p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {levelPassages.map((p, idx) => {
                const isCurrent = idx === currentPassageIndex;
                const record = passageHistory[p.id];
                const typeLabel = getPassageTypeLabel(p.passageType);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setCurrentPassageIndex(idx);
                      setIsPassageListOpen(false);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-all ${
                      isCurrent
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${typeLabel.color}`}
                        >
                          {typeLabel.uz}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {p.questions.length} savol • {p.recommendedTimeMinutes} daq
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white">
                        <FuriganaText text={p.title} mode="never" />
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {record ? (
                        <div className="text-right">
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <CheckCircle2 size={13} /> {record.accuracy}%
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {record.cpm} CPM
                          </span>
                        </div>
                      ) : (
                        <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                          Boshlash ➔
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JlptReadingPage;
