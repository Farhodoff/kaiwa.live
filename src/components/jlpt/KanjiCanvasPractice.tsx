import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Trash2,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Undo2,
  CheckCircle2,
  Search,
  Award,
  PenTool,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useStudyData } from '../../context/StudyPlannerContext';
import { speakText } from '../../utils/audioTts';
import {
  KanjiPracticeService,
  JlptLevelFilter,
  KanjiStrokeData,
} from '../../services/KanjiPracticeService';
import { DailyQuestService } from '../../services/DailyQuestService';
import { useGamificationStore } from '../../stores/useGamificationStore';
import { ActivityLoggingService } from '../../services/ActivityLoggingService';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import type { JlptKanjiItem } from '../../data/jlptGrammarKanji';
import { LessonKanjiService } from '../../services/LessonKanjiService';
import {
  assessKanjiWriting,
  sampleKanjiPaths,
  type WritingAssessment,
} from '../../services/KanjiWritingEvaluator';
import { KanjiProgressPanel } from './KanjiProgressPanel';

interface DrawnStroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

interface KanjiCanvasPracticeProps {
  initialKanji?: string;
  lessonId?: string;
  hideProgressPanel?: boolean;
}

export const KanjiCanvasPractice: React.FC<KanjiCanvasPracticeProps> = ({
  initialKanji = '日',
  lessonId,
  hideProgressPanel = false,
}) => {
  const { language } = useLanguage();
  const isJa = language === 'ja';
  const { awardXP, user } = useStudyData();
  const { haptics } = useTelegramWebApp();

  // Filters & Selection
  const [level, setLevel] = useState<JlptLevelFilter>(
    () => KanjiPracticeService.getKanjiByChar(initialKanji)?.level || 'N5',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKanjiChar, setSelectedKanjiChar] = useState(initialKanji);
  const [reviewScope, setReviewScope] = useState({ kanji: initialKanji, lessonId });

  // Resolved Kanji & Stroke Data
  const activeKanji: JlptKanjiItem = useMemo(() => {
    return (
      KanjiPracticeService.getKanjiByChar(selectedKanjiChar) ||
      KanjiPracticeService.getKanjisByLevel('N5')[0]
    );
  }, [selectedKanjiChar]);

  const [strokeData, setStrokeData] = useState<KanjiStrokeData | null>(() => {
    return KanjiPracticeService.getStrokeData(activeKanji.kanji);
  });

  useEffect(() => {
    let isCancelled = false;
    const syncData = KanjiPracticeService.getStrokeData(activeKanji.kanji);
    if (syncData) {
      setStrokeData(syncData);
      return;
    }

    setStrokeData(null);
    KanjiPracticeService.getStrokeDataAsync(activeKanji.kanji)
      .then((data) => {
        if (!isCancelled) {
          setStrokeData(data);
        }
      })
      .catch(() => {
        if (!isCancelled) setStrokeData(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeKanji.kanji]);

  const totalStrokes = strokeData?.paths.length || activeKanji.strokeCount || 1;

  // Animation State
  const [isAnimPlaying, setIsAnimPlaying] = useState(false);
  const [animStep, setAnimStep] = useState(0); // 0 means show all or controlled step
  const [animSpeed, setAnimSpeed] = useState<number>(700); // ms
  const [showNumbers, setShowNumbers] = useState(true);

  // Canvas Practice State
  const [practiceMode, setPracticeMode] = useState<'ghost' | 'blind' | 'step'>('ghost');
  const [brushColor, setBrushColor] = useState<string>('#E8483A'); // Hanko vermillion by default
  const [brushSize, setBrushSize] = useState<number>(8);
  const [userStrokes, setUserStrokes] = useState<DrawnStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState(false);
  const [assessment, setAssessment] = useState<WritingAssessment | null>(null);
  const [feedback, setFeedback] = useState('');
  const submittedDrawing = useRef(false);
  const rewardedCharacters = useRef(new Set<string>());
  const compounds = useMemo(
    () => LessonKanjiService.getKanjiCompounds(selectedKanjiChar).slice(0, 6),
    [selectedKanjiChar],
  );
  const [revealedCompounds, setRevealedCompounds] = useState(false);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStrokePoints = useRef<{ x: number; y: number }[]>([]);

  // Filtered Kanjis for selector
  const availableKanjis = useMemo(() => {
    if (searchQuery.trim()) {
      return KanjiPracticeService.searchKanjis(searchQuery, level);
    }
    return KanjiPracticeService.getKanjisByLevel(level);
  }, [level, searchQuery]);

  const quickPills = useMemo(() => {
    return KanjiPracticeService.getQuickKanjis(level);
  }, [level]);

  // Redraw canvas with grid and all recorded user strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 300;
    const height = 300;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Japanese Practice Grid (田-grid / 十字格)
    ctx.save();
    ctx.strokeStyle = '#e2e8f0'; // light border
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, width, height);

    // Dashed center grid lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Faint diagonal guides
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    ctx.restore();

    // 2. Draw user strokes
    userStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, [userStrokes]);

  // Handle canvas sizing for Retina displays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = 300;

    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    // CSS size comes from responsive classes; internal space stays 300 units.

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    redrawCanvas();
  }, [redrawCanvas]);

  // Reset drawing and animation state when kanji changes
  useEffect(() => {
    setUserStrokes([]);
    currentStrokePoints.current = [];
    setIsAnimPlaying(false);
    setAnimStep(0);
    setCompletedSuccess(false);
    setAssessment(null);
    setFeedback('');
    setRevealedCompounds(false);
    submittedDrawing.current = false;
  }, [activeKanji.kanji, user?.id, reviewScope.lessonId]);

  // Animation timer
  useEffect(() => {
    let interval: any = null;
    if (isAnimPlaying && strokeData && strokeData.paths.length > 0) {
      interval = setInterval(() => {
        setAnimStep((prev) => {
          if (prev >= strokeData.paths.length) {
            setIsAnimPlaying(false);
            return strokeData.paths.length;
          }
          return prev + 1;
        });
      }, animSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnimPlaying, strokeData, animSpeed]);

  // Touch & Mouse Drawing Handlers
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    // Normalize to the internal 300-unit drawing space regardless of CSS size.
    const scaleX = 300 / (rect.width || 300);
    const scaleY = 300 / (rect.height || 300);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    setIsDrawing(true);
    setCompletedSuccess(false);
    setAssessment(null);
    setFeedback('');
    submittedDrawing.current = false;
    currentStrokePoints.current = [coords];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling on touch
    }
    const coords = getCoordinates(e);
    if (!coords) return;

    currentStrokePoints.current.push(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokePoints.current.length > 1) {
      // Capture before clearing the ref: React may run the state updater later.
      const points = [...currentStrokePoints.current];
      setUserStrokes((prev) => [
        ...prev,
        {
          points,
          color: brushColor,
          size: brushSize,
        },
      ]);
      currentStrokePoints.current = [];
      haptics.impact('light');
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.restore();
    }
  };

  const handleUndo = () => {
    submittedDrawing.current = false;
    setCompletedSuccess(false);
    setAssessment(null);
    setFeedback('');
    setUserStrokes((prev) => {
      const updated = prev.slice(0, -1);
      return updated;
    });
    haptics.impact('light');
  };

  const handleClear = () => {
    submittedDrawing.current = false;
    setCompletedSuccess(false);
    setAssessment(null);
    setFeedback('');
    setUserStrokes([]);
    currentStrokePoints.current = [];
    redrawCanvas();
    haptics.impact('medium');
  };

  // Completion Award
  const handleFinishPractice = () => {
    if (submittedDrawing.current || isDrawing) return;
    if (userStrokes.length === 0) {
      setFeedback('Avval kanjini yozing. Bo‘sh mashq baholanmaydi.');
      return;
    }
    const reference = sampleKanjiPaths(strokeData?.paths || []);
    const result =
      reference &&
      assessKanjiWriting(
        userStrokes.map((stroke) => stroke.points),
        reference,
      );
    if (!result) {
      setFeedback(
        'Bu kanji uchun yozuvni baholash hozir mavjud emas. Stroke tartibini kuzatib mashq qiling.',
      );
      return;
    }
    submittedDrawing.current = true;
    setAssessment(result);
    const progressScope =
      reviewScope.kanji === activeKanji.kanji && reviewScope.lessonId
        ? reviewScope.lessonId
        : `jlpt-${activeKanji.level}`;
    const progress = LessonKanjiService.recordWritingPractice(
      user?.id || 'guest',
      progressScope,
      activeKanji.kanji,
      result,
    );
    setFeedback(
      `Natija saqlandi. Keyingi takrorlash: ${new Date(progress.nextReviewAt!).toLocaleDateString('uz-UZ')}.`,
    );
    if (!result.passed) {
      haptics.notification('warning');
      return;
    }
    setCompletedSuccess(true);
    haptics.notification('success');
    const rewardKey = `${user?.id || 'guest'}:${activeKanji.kanji}`;
    if (rewardedCharacters.current.has(rewardKey)) return;
    rewardedCharacters.current.add(rewardKey);
    if (awardXP) awardXP(15);
    const currentUserId = user?.id || null;
    try {
      DailyQuestService.incrementMetaCounter(currentUserId, 'kanjiMastered', 1);
      useGamificationStore.getState().recordQuestProgress('kanji', 1);
      ActivityLoggingService.logActivity(
        {
          activityType: 'kanji',
          activityTitle: `${activeKanji.kanji} (${activeKanji.meaningUz}) Kanji Mashqi`,
          durationMinutes: 2,
          itemsCount: 1,
          xpEarned: 15,
          metadata: {
            kanji: activeKanji.kanji,
            level: activeKanji.level,
            meaning: activeKanji.meaningUz,
          },
        },
        currentUserId,
      );
    } catch {}
  };

  return (
    <div className="max-w-full space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-xs sm:p-6">
      {!hideProgressPanel && (
        <KanjiProgressPanel
          key={user?.id || 'guest'}
          userId={user?.id || 'guest'}
          level={level}
          onPractice={(item) => {
            setReviewScope({ kanji: item.kanji, lessonId: item.lessonId });
            setSelectedKanjiChar(item.kanji);
            if (item.level && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(item.level))
              setLevel(item.level as JlptLevelFilter);
            setSearchQuery('');
            handleClear();
            canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />
      )}
      {/* Header Banner */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary/10 text-xl text-primary">
            ✍️
          </div>
          <div>
            <h3 className="font-display text-base font-black text-foreground sm:text-lg">
              {isJa
                ? 'インタラクティブ漢字書き順トレーナー'
                : 'Interaktiv Kanji Canvas & Yozish Tartibi'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isJa
                ? '340字以上のJLPT漢字に対応。正確な筆順アニメーションと書き順ガイド付き。'
                : "340+ JLPT kanjilari bo'yicha haqiqiy chiziqlar animatsiyasi va qo'lda yozish mashqlari."}
            </p>
          </div>
        </div>

        {/* Audio Pronunciation Button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => speakText(activeKanji.kanji, 'ja-JP')}
            className="flex items-center gap-2 rounded-xl border border-border bg-muted/70 px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
          >
            <Volume2 size={16} className="text-primary" />
            <span>{isJa ? '発音' : 'Talaffuz'}</span>
          </Button>
        </div>
      </div>

      {/* Level Filters & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'] as JlptLevelFilter[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                if (!lessonId) setReviewScope({ kanji: '', lessonId: undefined });
                setLevel(lvl);
                const quicks = KanjiPracticeService.getQuickKanjis(lvl);
                if (quicks.length > 0 && !quicks.includes(selectedKanjiChar)) {
                  setSelectedKanjiChar(quicks[0]);
                }
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                level === lvl
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isJa ? '漢字・読み・意味で検索...' : "Kanji, o'qilishi yoki ma'nosi..."}
            className="focus:outline-hidden w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </div>

      {/* Quick Curated Kanji Chips Tray */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {(searchQuery.trim() ? availableKanjis.map((k) => k.kanji) : quickPills).map((char) => (
          <button
            key={char}
            onClick={() => {
              if (!lessonId) setReviewScope({ kanji: '', lessonId: undefined });
              setSelectedKanjiChar(char);
            }}
            className={`font-japanese flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-base font-black transition-all ${
              selectedKanjiChar === char
                ? 'scale-105 border-primary bg-primary text-primary-foreground shadow-xs'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {char}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Canvas & Controls | Right Info & Guides */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Canvas Practice & Stroke Order (7 cols) */}
        <div className="flex flex-col items-center space-y-4 lg:col-span-7">
          {/* Canvas Box with Grid & Guide Overlay */}
          <div className="relative aspect-square w-full max-w-[340px] select-none overflow-hidden rounded-3xl border-2 border-border bg-card shadow-inner">
            {/* Background Ghost / Tracing Template */}
            {practiceMode === 'ghost' && !strokeData && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
                <span className="font-japanese text-[190px] font-light text-foreground">
                  {activeKanji.kanji}
                </span>
              </div>
            )}

            {/* SVG Stroke Order Overlay (when animating or step mode) */}
            {strokeData && (animStep > 0 || practiceMode !== 'blind') && (
              <svg
                viewBox="0 0 109 109"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                {strokeData.paths.map((pathD, idx) => {
                  const strokeNum = idx + 1;
                  const isCurrent = strokeNum === animStep;
                  const isPast = animStep === 0 || strokeNum < animStep;

                  if (practiceMode === 'step' && animStep === 0) {
                    // In step mode with no animation active, highlight first stroke
                    return (
                      <path
                        key={idx}
                        d={pathD}
                        fill="none"
                        stroke={idx === userStrokes.length ? '#E8483A' : '#e2e8f0'}
                        strokeWidth={idx === userStrokes.length ? '4' : '2'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={idx === userStrokes.length ? 0.8 : 0.25}
                      />
                    );
                  }

                  if (!isPast && !isCurrent) return null;

                  return (
                    <path
                      key={idx}
                      d={pathD}
                      fill="none"
                      stroke={isCurrent ? '#E8483A' : '#1c1917'}
                      strokeWidth={isCurrent ? '5' : '3.5'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isCurrent ? 'animate-pulse' : ''}
                      opacity={
                        isCurrent ? 1 : animStep === 0 && practiceMode === 'ghost' ? 0.18 : 0.65
                      }
                    />
                  );
                })}

                {/* Stroke Numbers */}
                {showNumbers &&
                  strokeData.numbers.map((pt, idx) => {
                    const strokeNum = idx + 1;
                    if (animStep > 0 && strokeNum > animStep) return null;
                    return (
                      <g key={idx}>
                        <circle cx={pt.x} cy={pt.y} r="4.5" fill="#E8483A" opacity="0.9" />
                        <text
                          x={pt.x}
                          y={pt.y + 2.5}
                          textAnchor="middle"
                          fontSize="6"
                          fill="#ffffff"
                          fontWeight="bold"
                        >
                          {pt.num}
                        </text>
                      </g>
                    );
                  })}
              </svg>
            )}

            {/* Drawing HTML5 Canvas */}
            <canvas
              aria-label="Kanji yozish maydoni"
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 block h-full w-full cursor-crosshair touch-none"
            />
          </div>

          {/* Stroke Order Animation Toolbar */}
          <div className="shadow-2xs flex w-full max-w-[340px] items-center justify-between rounded-2xl border border-border bg-muted/40 p-2.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsAnimPlaying(false);
                  setAnimStep((prev) => Math.max(0, prev - 1));
                }}
                disabled={animStep <= 0}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
                title={isJa ? '前の画' : 'Oldingi chiziq'}
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={() => {
                  if (animStep >= totalStrokes) {
                    setAnimStep(1);
                    setIsAnimPlaying(true);
                  } else {
                    setIsAnimPlaying((prev) => !prev);
                  }
                }}
                className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-xs transition hover:bg-primary/90"
              >
                {isAnimPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>
                  {isAnimPlaying ? (isJa ? '一時停止' : 'Pauza') : isJa ? '再生' : 'Tartib'}
                </span>
              </button>

              <button
                onClick={() => {
                  setIsAnimPlaying(false);
                  setAnimStep((prev) => Math.min(totalStrokes, prev + 1));
                }}
                disabled={animStep >= totalStrokes}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
                title={isJa ? '次の画' : 'Keyingi chiziq'}
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => {
                  setIsAnimPlaying(false);
                  setAnimStep(0);
                }}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title={isJa ? 'リセット' : 'Qayta boshlash'}
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Step Counter & Speed */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
              <span>{animStep > 0 ? `${animStep} / ${totalStrokes}` : `${totalStrokes} 画`}</span>
              <button
                onClick={() =>
                  setAnimSpeed((prev) => (prev === 1200 ? 700 : prev === 700 ? 400 : 1200))
                }
                className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-black text-foreground"
                title="Tezlikni o'zgartirish"
              >
                {animSpeed === 1200 ? '0.5x' : animSpeed === 700 ? '1x' : '1.5x'}
              </button>
              <button
                onClick={() => setShowNumbers((prev) => !prev)}
                className={`rounded-md p-1 ${
                  showNumbers ? 'text-primary' : 'text-muted-foreground/50'
                }`}
                title={isJa ? '番号表示' : "Raqamlarni ko'rsatish"}
              >
                {showNumbers ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>

          {/* Canvas Tools Toolbar: Mode, Colors, Size, Undo, Clear */}
          <div className="flex w-full max-w-[340px] flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3">
            {/* Modes */}
            <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
              <button
                onClick={() => setPracticeMode('ghost')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition ${
                  practiceMode === 'ghost'
                    ? 'shadow-2xs bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isJa ? '手本' : 'Qolip'}
              </button>
              <button
                onClick={() => setPracticeMode('blind')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition ${
                  practiceMode === 'blind'
                    ? 'shadow-2xs bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isJa ? '記憶' : 'Xotira'}
              </button>
              <button
                onClick={() => setPracticeMode('step')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition ${
                  practiceMode === 'step'
                    ? 'shadow-2xs bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isJa ? '一画ずつ' : 'Qadam'}
              </button>
            </div>

            {/* Brush Colors */}
            <div className="flex items-center gap-1.5">
              {[
                { color: '#1c1917', name: 'Sumi' },
                { color: '#E8483A', name: 'Hanko' },
                { color: '#2563eb', name: 'Indigo' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setBrushColor(c.color)}
                  className={`h-5 w-5 rounded-full transition-transform ${
                    brushColor === c.color
                      ? 'scale-125 ring-2 ring-primary ring-offset-1'
                      : 'opacity-70'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>

            {/* Brush Sizes */}
            <div className="flex items-center gap-1">
              {[4, 8, 14].map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`flex h-6 w-6 items-center justify-center rounded-lg border text-[10px] font-bold ${
                    brushSize === size
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {size === 4 ? 'S' : size === 8 ? 'M' : 'L'}
                </button>
              ))}
            </div>

            {/* Undo & Clear */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUndo}
                disabled={userStrokes.length === 0}
                className="rounded-xl border border-border bg-muted/60 p-1.5 text-foreground transition hover:bg-muted disabled:opacity-30"
                title={isJa ? '元に戻す' : 'Oxirgi chiziqni bekor qilish'}
              >
                <Undo2 size={14} />
              </button>
              <button
                onClick={handleClear}
                className="rounded-xl border border-border bg-muted/60 p-1.5 text-foreground transition hover:bg-muted"
                title={isJa ? '全消去' : 'Tozalash'}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Educational Metadata, Readings & Vocabulary (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Main Info Card */}
          <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                  {activeKanji.level} JLPT
                </span>
                <h4 className="font-japanese mt-1 text-5xl font-black text-foreground">
                  {activeKanji.kanji}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-muted-foreground">
                  {isJa ? '総画数' : 'Chiziqlar soni'}
                </span>
                <p className="text-xl font-black text-foreground">{totalStrokes} 画</p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {isJa ? '意味' : "O'zbekcha Ma'nosi"}
              </span>
              <p className="text-sm font-black text-foreground">{activeKanji.meaningUz}</p>
            </div>

            {/* Readings */}
            <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-2.5">
              <div className="rounded-xl border border-border/60 bg-background/50 p-2.5">
                <span className="text-[10px] font-extrabold text-[#C9A961]">音読み (Onyomi)</span>
                <p className="font-japanese mt-0.5 text-xs font-bold text-foreground">
                  {activeKanji.onyomi || '—'}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/50 p-2.5">
                <span className="text-[10px] font-extrabold text-[#C9A961]">訓読み (Kunyomi)</span>
                <p className="font-japanese mt-0.5 text-xs font-bold text-foreground">
                  {activeKanji.kunyomi || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Example Words */}
          <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              {isJa ? '代表的な熟語・単語' : 'Misol So‘z Birikmalari'}
            </span>
            <button
              type="button"
              onClick={() => setRevealedCompounds((value) => !value)}
              className="ml-2 text-xs font-bold text-primary"
            >
              {revealedCompounds ? 'Javoblarni yashirish' : 'O‘qilishi va ma’nosini ko‘rsatish'}
            </button>
            <div className="space-y-2 pt-1">
              {compounds.length > 0 ? (
                compounds.map((ex, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2.5 transition hover:bg-muted/60"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-japanese text-base font-black text-foreground">
                          {ex.word}
                        </span>
                        {revealedCompounds && (
                          <span className="text-xs text-muted-foreground">({ex.reading})</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                        {revealedCompounds ? ex.meaningUz : 'O‘qilishi va ma’nosini eslab ko‘ring'}
                      </p>
                    </div>
                    <button
                      onClick={() => speakText(ex.word, 'ja-JP')}
                      className="rounded-lg p-1.5 text-muted-foreground transition hover:text-primary"
                      title="Eshitish"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isJa ? '例文準備中' : 'Misollar mavjud'}
                </p>
              )}
            </div>
          </div>

          {/* Practice Action / XP Reward */}
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground">
              Muvaffaqiyatli mashq uchun +15 XP (har bir kanjiga ushbu ochilgan mashqda bir marta).
            </p>
            <p className="text-xs text-muted-foreground">
              Taxminiy geometrik baho: shakl, chiziqlar ketma-ketligi va yo‘nalishi solishtiriladi.
              Bu rasmiy yozuv imtihoni emas.
            </p>
            {assessment && (
              <p role="status" className="text-sm font-bold">
                Yozish aniqligi: {assessment.writingAccuracy}% · Stroke-order:{' '}
                {assessment.strokeOrderPassed ? 'To‘g‘ri' : 'Qayta mashq qiling'} ·{' '}
                {assessment.drawnStrokes}/{assessment.expectedStrokes} chiziq
              </p>
            )}
            {feedback && (
              <p role="status" className="text-xs">
                {feedback}
              </p>
            )}
            {completedSuccess ? (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span className="text-xs font-black">
                    {isJa ? '練習完了！' : 'Ajoyib! Mashq yakunlandi'}
                  </span>
                </div>
                <Award size={18} />
              </div>
            ) : (
              <Button
                onClick={handleFinishPractice}
                disabled={isDrawing || assessment !== null}
                className="active:scale-98 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-xs transition hover:bg-primary/90"
              >
                <PenTool size={15} />
                <span>{isJa ? '書き練習を完了する' : 'Mashqni Yakunlash — tekshirish'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanjiCanvasPractice;
