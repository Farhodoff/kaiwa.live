import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Volume2,
  CheckCircle2,
  Award,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  BookOpen,
  Sparkles,
  CheckCircle,
  Headphones,
  Repeat,
  Eye,
  EyeOff,
  User,
  HelpCircle,
  Languages,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { FuriganaText, FuriganaMode } from '../components/jlpt/FuriganaText';
import {
  JLPT_LISTENING_QUESTIONS,
  JlptListeningQuestion,
  DialogueLine,
  parseScriptIntoDialogueLines,
} from '../data/jlpt/listening_data';
import { CustomContentService } from '../services/CustomContentService';
import {
  ListeningAudioSyncService,
  SpeakerGender,
  SequentialPlaybackController,
} from '../services/ListeningAudioSyncService';
import { HistoryService } from '../services/HistoryService';
import { MasteryEngine } from '../services/MasteryEngine';
import { DailyQuestService } from '../services/DailyQuestService';
import { useGamificationStore } from '../stores/useGamificationStore';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from '../hooks/use-toast';
import { ErrorNotificationService } from '../services/ErrorNotificationService';
import { resolveAudioUrl } from '../utils/audioUrl';

const DRAFT_CHOUKAI_STORAGE_KEY = 'jlpt_choukai_draft_v1';

export const JlptListeningMockPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { awardXP, addSession, addFlashcardsBatch, user } = useStudyData();
  const { language } = useLanguage();

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

  const [level, setLevel] = useState<'N5' | 'N4' | 'N3' | 'N2' | 'N1'>(initialLevel);
  const [step, setStep] = useState<'intro' | 'test' | 'report'>('intro');
  const [mode, setMode] = useState<'exam' | 'sync'>('exam');

  useEffect(() => {
    if (urlLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(urlLevel)) {
      setLevel(urlLevel as any);
    }
    // Background sync authentic Choukai questions from Supabase
    CustomContentService.syncFromSupabase().catch(() => {});
  }, [urlLevel]);

  // Timer & Status
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Questions State
  const [activeQuestions, setActiveQuestions] = useState<JlptListeningQuestion[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string | number, number>>({});
  const [score, setScore] = useState(0);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Audio Sync & Subtitles State
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [isLoopingCurrentLine, setIsLoopingCurrentLine] = useState(false);
  const [showScriptInExam, setShowScriptInExam] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [furiganaMode, setFuriganaMode] = useState<FuriganaMode>('hover');
  const syncControllerRef = useRef<SequentialPlaybackController | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active line into view smoothly during playback
  useEffect(() => {
    if (currentLineIndex !== null && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentLineIndex]);

  // TTS Engine State
  const [isUsingTts, setIsUsingTts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExported, setIsExported] = useState(false);

  // Timer Effect
  useEffect(() => {
    let timer: any;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      handleSubmitTest();
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Predictive background audio preloading for the next 2 questions
  useEffect(() => {
    if (step !== 'test' || activeQuestions.length === 0) return;
    const candidates = [currentQIdx + 1, currentQIdx + 2];
    candidates.forEach((idx) => {
      if (idx < activeQuestions.length) {
        const nextQ = activeQuestions[idx];
        if (nextQ?.audioUrl && !nextQ.audioUrl.includes('soundhelix.com')) {
          const preAudio = new Audio();
          preAudio.preload = 'auto';
          preAudio.src = resolveAudioUrl(nextQ.audioUrl);
        }
      }
    });
  }, [step, currentQIdx, activeQuestions]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTrackTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-save active Choukai draft to localStorage in real-time
  useEffect(() => {
    if (step === 'test' && Object.keys(userAnswers).length > 0) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(
            DRAFT_CHOUKAI_STORAGE_KEY,
            JSON.stringify({
              level,
              currentQIdx,
              userAnswers,
              timeLeft,
              timestamp: Date.now(),
            }),
          );
        }
      } catch {}
    }
  }, [step, level, currentQIdx, userAnswers, timeLeft]);

  // --- Start JLPT Listening Test ---
  const handleStartTest = () => {
    const allQuestions = CustomContentService.mergeChoukaiQuestions(JLPT_LISTENING_QUESTIONS);
    let filtered = allQuestions.filter((q) => q.level === level);
    if (filtered.length === 0) {
      filtered = allQuestions.filter((q) => q.level === 'N5');
    }

    stopAudio();
    setActiveQuestions(filtered);

    // Check for existing valid draft
    let restoredAnswers: Record<string | number, number> = {};
    let restoredIdx = 0;
    let restoredTime = 1800;

    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(DRAFT_CHOUKAI_STORAGE_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          const isFresh = Date.now() - (draft.timestamp || 0) < 4 * 60 * 60 * 1000;
          if (
            isFresh &&
            draft.level === level &&
            draft.userAnswers &&
            Object.keys(draft.userAnswers).length > 0
          ) {
            restoredAnswers = draft.userAnswers;
            if (typeof draft.currentQIdx === 'number' && draft.currentQIdx < filtered.length) {
              restoredIdx = draft.currentQIdx;
            }
            if (typeof draft.timeLeft === 'number' && draft.timeLeft > 0) {
              restoredTime = draft.timeLeft;
            }
            toast({
              title: 'Qoralama tiklandi',
              description: `${Object.keys(restoredAnswers).length} ta belgilangan javobingiz muvaffaqiyatli tiklandi.`,
            });
          }
        }
      }
    } catch {}

    setCurrentQIdx(restoredIdx);
    setUserAnswers(restoredAnswers);
    setIsExported(false);
    setStep('test');
    setIsTimerRunning(true);
    setTimeLeft(restoredTime);
    setShowScriptInExam(mode === 'sync');
  };

  // --- Audio Control Methods ---
  const stopAudio = () => {
    setIsPlaying(false);
    setCurrentLineIndex(null);

    if (syncControllerRef.current) {
      syncControllerRef.current.stop();
      syncControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handlePlayPause = () => {
    const activeQ = activeQuestions[currentQIdx];
    if (!activeQ) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (syncControllerRef.current) {
        syncControllerRef.current.pause();
        setIsPlaying(false);
      } else {
        stopAudio();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else if (syncControllerRef.current) {
        syncControllerRef.current.resume();
        setIsPlaying(true);
      } else {
        playAudio(activeQ);
      }
    }
  };

  const playAudio = async (q: JlptListeningQuestion) => {
    stopAudio();
    setIsPlaying(true);

    // If authentic audio file URL exists and is not a placeholder music link, play native audio element
    const hasAuthenticAudio =
      q.audioUrl && q.audioUrl.trim() !== '' && !q.audioUrl.includes('soundhelix.com');

    if (hasAuthenticAudio) {
      setIsUsingTts(false);
      const audio = new Audio(resolveAudioUrl(q.audioUrl));
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;

      const lines =
        q.dialogueLines && q.dialogueLines.length > 0
          ? q.dialogueLines
          : parseScriptIntoDialogueLines(q.script);

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        if (lines.length > 0) {
          const activeIdx = ListeningAudioSyncService.getActiveLineIndex(
            lines,
            audio.currentTime,
            audio.duration || 0,
          );
          if (activeIdx !== null) {
            setCurrentLineIndex(activeIdx);
          }
        }
      };
      audio.onloadedmetadata = () => {
        setDuration(audio.duration || 0);
      };
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentLineIndex(null);
      };
      audio.onerror = () => {
        console.warn('[Choukai] Audio load failed, falling back to TTS dialogue synthesis');
        playTtsDialogue(q);
      };
      audio.play().catch((err: any) => {
        if (err?.name === 'AbortError') return;
        console.warn(
          '[Choukai] Audio playback rejected, falling back to TTS dialogue synthesis:',
          err,
        );
        playTtsDialogue(q);
      });
      return;
    }

    // Fallback to sequential multi-speaker TTS dialogue synthesis
    playTtsDialogue(q);
  };

  const playTtsDialogue = (q: JlptListeningQuestion) => {
    const lines =
      q.dialogueLines && q.dialogueLines.length > 0
        ? q.dialogueLines
        : parseScriptIntoDialogueLines(q.script);

    if (lines.length === 0) {
      setIsPlaying(false);
      toast({
        title: 'Skript mavjud emas',
        description: 'Ushbu savol uchun audio skript topilmadi.',
      });
      return;
    }

    setIsUsingTts(true);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(lines.length);

    const controller = ListeningAudioSyncService.startSequentialPlayback(lines, {
      startIndex: currentLineIndex ?? 0,
      speed: playbackSpeed,
      isLoopingLine: isLoopingCurrentLine,
      onLineStart: (idx) => {
        setCurrentLineIndex(idx);
        setCurrentTime(idx + 1);
      },
      onStateChange: (playing) => {
        setIsPlaying(playing);
      },
      onComplete: () => {
        setIsPlaying(false);
        setCurrentLineIndex(null);
        setCurrentTime(0);
      },
    });

    syncControllerRef.current = controller;
  };

  const handleSeekToLine = (idx: number) => {
    const q = activeQuestions[currentQIdx];
    if (!q) return;

    const lines = currentDialogueLines;
    if (idx < 0 || idx >= lines.length) return;

    const lineStartTime = ListeningAudioSyncService.getLineStartTime(
      lines,
      idx,
      audioRef.current?.duration || duration || 0,
    );

    // If native audio element is already active
    if (audioRef.current && !isUsingTts) {
      audioRef.current.currentTime = lineStartTime;
      setCurrentTime(lineStartTime);
      setCurrentLineIndex(idx);
      if (!isPlaying) {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
      return;
    }

    const hasAuthenticAudio =
      q.audioUrl && q.audioUrl.trim() !== '' && !q.audioUrl.includes('soundhelix.com');

    if (hasAuthenticAudio) {
      setIsUsingTts(false);
      setIsPlaying(true);
      const audio = new Audio(resolveAudioUrl(q.audioUrl));
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        if (lines.length > 0) {
          const activeIdx = ListeningAudioSyncService.getActiveLineIndex(
            lines,
            audio.currentTime,
            audio.duration || 0,
          );
          if (activeIdx !== null) {
            setCurrentLineIndex(activeIdx);
          }
        }
      };
      audio.onloadedmetadata = () => {
        setDuration(audio.duration || 0);
        audio.currentTime = lineStartTime;
        setCurrentTime(lineStartTime);
        setCurrentLineIndex(idx);
      };
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentLineIndex(null);
      };
      audio.onerror = () => {
        const line = lines[idx];
        if (line) handlePlaySpecificLine(line, idx);
      };
      audio.play().catch(() => {
        const line = lines[idx];
        if (line) handlePlaySpecificLine(line, idx);
      });
      return;
    }

    const line = lines[idx];
    if (line) handlePlaySpecificLine(line, idx);
  };

  const handlePlaySpecificLine = (line: DialogueLine, idx: number) => {
    // If native audio is actively playing, jump directly to that line's start time in authentic audio!
    if (audioRef.current && !isUsingTts && isPlaying) {
      const lineStartTime = ListeningAudioSyncService.getLineStartTime(
        currentDialogueLines,
        idx,
        audioRef.current.duration || duration || 0,
      );
      audioRef.current.currentTime = lineStartTime;
      setCurrentTime(lineStartTime);
      setCurrentLineIndex(idx);
      return;
    }

    stopAudio();
    setCurrentLineIndex(idx);
    setIsPlaying(true);

    ListeningAudioSyncService.playLine(
      line,
      playbackSpeed,
      () => setIsPlaying(true),
      () => {
        setIsPlaying(false);
        if (!isLoopingCurrentLine) {
          setCurrentLineIndex(null);
        } else {
          setTimeout(() => {
            handlePlaySpecificLine(line, idx);
          }, 300);
        }
      },
      () => {
        setIsPlaying(false);
        setCurrentLineIndex(null);
      },
    );
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    if (syncControllerRef.current) {
      syncControllerRef.current.setSpeed(speed);
    }
  };

  const skipTime = (amount: number) => {
    if (audioRef.current) {
      let next = audioRef.current.currentTime + amount;
      if (next < 0) next = 0;
      if (audioRef.current.duration && next > audioRef.current.duration) {
        next = audioRef.current.duration;
      }
      audioRef.current.currentTime = next;
      setCurrentTime(next);
    } else if (syncControllerRef.current) {
      if (amount < 0) {
        syncControllerRef.current.prevLine();
      } else {
        syncControllerRef.current.nextLine();
      }
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else if (syncControllerRef.current) {
      const targetIdx = Math.max(0, Math.floor(newTime) - 1);
      syncControllerRef.current.jumpToLine(targetIdx);
      setCurrentTime(targetIdx + 1);
    }
  };

  const handleToggleLoop = () => {
    const nextVal = !isLoopingCurrentLine;
    setIsLoopingCurrentLine(nextVal);
    if (syncControllerRef.current) {
      syncControllerRef.current.setLooping(nextVal);
    }
  };

  const handleOptionSelect = (optionIdx: number) => {
    const activeQ = activeQuestions[currentQIdx];
    if (!activeQ) return;
    setUserAnswers((prev) => ({ ...prev, [activeQ.id]: optionIdx }));
  };

  const handleNext = () => {
    stopAudio();
    setCurrentTime(0);
    setDuration(0);
    setIsUsingTts(false);

    if (currentQIdx < activeQuestions.length - 1) {
      setCurrentQIdx((prev) => prev + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handleSubmitTest = async () => {
    stopAudio();
    setIsTimerRunning(false);

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(DRAFT_CHOUKAI_STORAGE_KEY);
      }
    } catch {}

    let correctCount = 0;
    activeQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setStep('report');

    // Award XP (25 XP per correct question)
    try {
      if (awardXP && correctCount > 0) {
        await awardXP(correctCount * 25);
      }
      DailyQuestService.incrementMetaCounter(
        user?.id,
        'listeningQuestionsCompleted',
        activeQuestions.length || 1,
      );
      useGamificationStore.getState().recordQuestProgress('listening', 1);
    } catch {
      // Ignore XP award failure
    }

    // Add study session to public.study_sessions
    if (addSession) {
      try {
        await addSession({
          duration: 20,
          type: 'focus',
          completed: true,
          startTime: new Date().toISOString(),
        });
      } catch {
        // Ignore session saving failure
      }
    }

    // Save mock exam to history
    try {
      await HistoryService.saveMockExam({
        examType: 'jlpt',
        level: level,
        score: correctCount,
        totalQuestions: activeQuestions.length,
        bandScore: Math.round((correctCount / (activeQuestions.length || 1)) * 180),
      });

      // Record evidence in MasteryEngine
      const activeUserId = user?.id || 'guest';
      const accuracy = Math.round((correctCount / (activeQuestions.length || 1)) * 100);
      MasteryEngine.recordEvidence(activeUserId, 'ja', {
        id: `jlpt_choukai_${level}_${Date.now()}`,
        skill: 'listening',
        score: accuracy,
        timestamp: new Date().toISOString(),
        details: `JLPT ${level} Choukai: ${correctCount}/${activeQuestions.length} to'g'ri (${accuracy}%)`,
        type: 'performance',
      });
    } catch (e) {
      console.error('Failed to save JLPT score:', e);
    }
  };

  const handleExportMistakes = async () => {
    const wrongQs = activeQuestions.filter((q) => userAnswers[q.id] !== q.correctAnswer);
    if (wrongQs.length === 0) return;
    setIsExporting(true);
    try {
      const cards = wrongQs.map((q) => ({
        front: `🎧 JLPT ${level} Tinglash Savoli (CHOUKAI):\n\n${q.questionText}\n\n台本 (Audio Skript):\n${q.script}`,
        back: `✅ To'g'ri javob: ${q.options[q.correctAnswer]}\n\n❌ Sizning javob: ${
          userAnswers[q.id] !== undefined ? q.options[userAnswers[q.id]] : 'Javob berilmagan'
        }\n\n💡 Izoh: ${q.explanationUzbek}`,
      }));
      await addFlashcardsBatch(cards);
      setIsExported(true);
      toast({
        title: '🎴 Fleshkartalarga Saqlandi!',
        description: `${cards.length} ta tinglash savoli Anki SRS fleshkartalar to'plamiga qo'shildi.`,
      });
    } catch (err) {
      console.error('[Choukai] Export flashcards error:', err);
      ErrorNotificationService.notifyError({
        title: 'Fleshkartalarga saqlashda xatolik',
        message: "Xatolarni Anki SRS fleshkartalar bazasiga yozib bo'lmadi. Qayta urinib ko'ring.",
        error: err,
        retryAction: () => handleExportMistakes(),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getSpeakerBadgeStyle = (gender?: SpeakerGender) => {
    switch (gender) {
      case 'male':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-500';
      case 'female':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-500';
      default:
        return 'border-amber-500/30 bg-amber-500/10 text-amber-500';
    }
  };

  const currentQuestion = activeQuestions[currentQIdx];
  const currentDialogueLines = currentQuestion
    ? currentQuestion.dialogueLines && currentQuestion.dialogueLines.length > 0
      ? currentQuestion.dialogueLines
      : parseScriptIntoDialogueLines(currentQuestion.script)
    : [];

  const lineSegments = useMemo(() => {
    return ListeningAudioSyncService.calculateLineTimeSegments(
      currentDialogueLines,
      duration || (audioRef.current?.duration ?? 0),
    );
  }, [currentDialogueLines, duration]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5rem))] md:p-8 md:pb-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <button
          onClick={() => {
            stopAudio();
            navigate('/jlpt');
          }}
          className="cursor-pointer rounded-xl border border-border p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          title="Chiqish / Orqaga"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-extrabold text-rose-600 dark:text-rose-400">
            🎌{' '}
            {language === 'ja'
              ? 'JLPT ちょうかい（きく）れんしゅう'
              : 'JLPT Listening Practice (聴解)'}
          </span>
          <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary sm:inline-flex">
            Audio Sync & Subtitles
          </span>
        </div>
      </div>

      {/* STEP 1: INTRO LEVEL & MODE SELECTION */}
      {step === 'intro' && (
        <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-6 text-center shadow-xl duration-200 animate-in fade-in sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 shadow-md">
            <Volume2 size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {language === 'ja'
                ? 'JLPT ちょうかい（きく）れんしゅう'
                : 'JLPT Choukai (聴解) Practice'}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {language === 'ja'
                ? 'N5からN1までの ちょうかい れんしゅうもんだい。おんせいと スクリプトが じつじかんで どうきします。'
                : "N5 dan N1 gacha bo'lgan barcha darajalar bo'yicha Yapon tili tinglab tushunish savollari, ko'p ovozli talaffuz va real-vaqt sinxron skript."}
            </p>
          </div>

          {/* Level Buttons Grid */}
          <div className="space-y-2">
            <span className="block text-left text-xs font-bold uppercase tracking-wider text-muted-foreground sm:text-center">
              Darajani tanlang:
            </span>
            <div className="grid grid-cols-5 gap-2">
              {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`cursor-pointer rounded-2xl border py-3 text-xs font-black transition-all ${
                    level === lvl
                      ? 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/20 ring-1 ring-rose-500'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Practice Mode Selector */}
          <div className="space-y-2 pt-2">
            <span className="block text-left text-xs font-bold uppercase tracking-wider text-muted-foreground sm:text-center">
              Mashq Rejimini Tanlang:
            </span>
            <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode('exam')}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  mode === 'exam'
                    ? 'border-rose-500 bg-rose-500/10 text-foreground ring-1 ring-rose-500'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-black text-rose-500">
                  <Clock size={16} />
                  <span>🎯 Haqiqiy Imtihon (Mock Exam)</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  30 daqiqalik taymer, skript yashiringan, audio tabiiy o&apos;ynaladi va yakunda
                  JLPT baholash hisoboti beriladi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('sync')}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  mode === 'sync'
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-black text-primary">
                  <Headphones size={16} />
                  <span>🎧 Audio Sync & Shadowing</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Skript karaoke uslubida yoritiladi, har bir gapni alohida bosib eshitish,
                  takrorlash va o&apos;zbekcha tarjimasini ko&apos;rish mumkin.
                </p>
              </button>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full rounded-2xl bg-rose-500 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 active:scale-95 sm:text-base"
            onClick={handleStartTest}
          >
            {language === 'ja' ? 'れんしゅうを スタート 🎌' : 'Boshlash 🎌'}
          </Button>

          {/* Minna no Nihongo Mondai Listening Banner */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-left">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 dark:text-rose-400">
                  <Headphones size={14} />
                  <span>Minna no Nihongo Shokyu 1 (1–25 Darslar)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Darslikning har bir darsi oxiridagi haqiqiy CD audiolari bo'yicha Mondai (聴解)
                  testlarini mashq qiling.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/jlpt?tab=lessons&level=n5')}
                className="shrink-0 cursor-pointer rounded-xl bg-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-rose-600 active:scale-95"
              >
                Darslar Bo'yicha Mashq Qilish →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ACTIVE TEST */}
      {step === 'test' && currentQuestion && (
        <div className="space-y-6 duration-200 animate-in fade-in">
          {/* Progress Bar & Timer Header */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-rose-500">
                {level} Tinglash · Savol {currentQIdx + 1} / {activeQuestions.length}
              </span>
              {currentQuestion.titleUz && (
                <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">
                  • {currentQuestion.titleUz}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3.5 py-1 font-mono text-xs font-extrabold text-rose-600 dark:text-rose-400">
              <Clock size={14} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* LEFT COLUMN: Audio Player & Interactive Subtitles (7 cols on desktop) */}
            <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-foreground sm:text-sm">
                    {currentQuestion.type === 'task' && '課題理解 (Vazifa tushunish)'}
                    {currentQuestion.type === 'point' && 'ポイント理解 (Kalit nuqtalar)'}
                    {currentQuestion.type === 'quick' && '即時応答 (Tezkor javob)'}
                    {currentQuestion.type === 'summary' && '概要理解 (Umumiy mazmun)'}
                  </h3>
                  {currentQuestion.audioUrl && (
                    <span className="hidden items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 sm:inline-flex">
                      Studio CD
                    </span>
                  )}
                </div>

                {/* Script Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => setShowScriptInExam(!showScriptInExam)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1 text-[11px] font-bold transition-all ${
                    showScriptInExam
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                  title="Audio skriptni ko'rsatish/yashirish"
                >
                  {showScriptInExam ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showScriptInExam ? 'Skriptni yashirish' : 'Audio Skript (台本)'}</span>
                </button>
              </div>

              {/* Audio Status Card & Visualizer Wave */}
              <div className="relative overflow-hidden rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/80 via-background to-rose-100/30 p-4 text-center dark:border-rose-900/40 dark:from-rose-950/20 dark:via-background dark:to-rose-900/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-left">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all ${
                        isPlaying
                          ? 'animate-pulse bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-4 ring-rose-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      <Volume2 size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-foreground sm:text-sm">
                          Listening Audio Track
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            isUsingTts
                              ? 'border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isUsingTts ? '🤖 AI Sinxron Nutq' : '🎧 Studiya Audiosi'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {isPlaying
                          ? isUsingTts
                            ? 'AI suxandonlar dialogi ijro etilmoqda...'
                            : 'Haqiqiy studiya audiosi ijro etilmoqda...'
                          : 'Tinglash uchun Ijro etish (Play) tugmasini bosing'}
                      </p>
                    </div>
                  </div>

                  {/* Active playing indicator badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                      isPlaying
                        ? 'border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'border border-border bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${isPlaying ? 'animate-ping bg-rose-500' : 'bg-muted-foreground/40'}`}
                    />
                    {isPlaying ? 'Ijro' : 'To‘xtatilgan'}
                  </span>
                </div>

                {/* Progress / Timeline Scrubber */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-11 text-right font-mono text-[11px] font-bold text-muted-foreground">
                      {isUsingTts ? `Gap ${currentTime}` : formatTrackTime(currentTime)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration > 0 ? duration : 100}
                      step={isUsingTts ? 1 : 0.1}
                      value={duration > 0 ? currentTime : 0}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted-foreground/20 accent-rose-500 transition-all hover:bg-muted-foreground/30"
                      title="Audio vaqtini surish (Scrubber)"
                    />
                    <span className="w-11 text-left font-mono text-[11px] font-bold text-muted-foreground">
                      {isUsingTts ? `/${duration}` : formatTrackTime(duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Audio Controls Bar */}
              <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Left: Rewind -5s, Play/Pause, Forward +5s */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => skipTime(-5)}
                      className="group flex cursor-pointer items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-2 text-xs font-bold text-muted-foreground transition-all hover:border-rose-500/40 hover:bg-card hover:text-foreground active:scale-95"
                      title="5 soniya orqaga (-5s)"
                    >
                      <RotateCcw
                        size={15}
                        className="transition-transform group-hover:-rotate-45"
                      />
                      <span className="font-mono text-[11px]">-5s</span>
                    </button>

                    <Button
                      onClick={handlePlayPause}
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-rose-600 text-white shadow-md shadow-rose-600/30 transition-all hover:scale-105 hover:bg-rose-700 active:scale-95"
                      title={isPlaying ? "To'xtatish" : 'Ijro etish'}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </Button>

                    <button
                      onClick={() => skipTime(5)}
                      className="group flex cursor-pointer items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-2 text-xs font-bold text-muted-foreground transition-all hover:border-rose-500/40 hover:bg-card hover:text-foreground active:scale-95"
                      title="5 soniya oldinga (+5s)"
                    >
                      <span className="font-mono text-[11px]">+5s</span>
                      <RotateCw size={15} className="transition-transform group-hover:rotate-45" />
                    </button>
                  </div>

                  {/* Center: Loop Button */}
                  <button
                    type="button"
                    onClick={handleToggleLoop}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                      isLoopingCurrentLine
                        ? 'border-rose-500 bg-rose-500 text-white shadow-xs ring-1 ring-rose-500'
                        : 'border-border bg-card text-muted-foreground hover:bg-card hover:text-foreground'
                    }`}
                    title="Hozirgi gap yoki trekni takrorlash (Loop)"
                  >
                    <Repeat size={13} className={isLoopingCurrentLine ? 'animate-spin' : ''} />
                    <span>Loop {isLoopingCurrentLine ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Right: Speed Selector Pills */}
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
                    {[0.8, 1.0, 1.2, 1.5].map((speed) => {
                      const isActive = Math.abs(playbackSpeed - speed) < 0.05;
                      return (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`cursor-pointer rounded-lg px-2 py-1 text-[11px] font-black transition-all ${
                            isActive
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                          title={`Tezlik: ${speed}x`}
                        >
                          {speed}x
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Script Section */}
              {!showScriptInExam ? (
                /* Hidden Script Banner in Exam mode */
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                  <div className="rounded-full bg-muted p-3 text-muted-foreground">
                    <EyeOff size={22} />
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-foreground">
                    Audio Skript (台本) yashirilgan
                  </h4>
                  <p className="mt-1 max-w-sm text-[11px] text-muted-foreground">
                    Haqiqiy JLPT imtihonida bo‘lgani kabi faqat eshitish orqali javob toping. Zarur
                    bo‘lsa, skriptni istalgan payt ochishingiz mumkin.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowScriptInExam(true)}
                    className="mt-3.5 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-600 transition-all hover:bg-rose-500 hover:text-white dark:text-rose-400"
                  >
                    <Eye size={13} />
                    <span>Skriptni ko‘rish (台本)</span>
                  </button>
                </div>
              ) : (
                /* Synchronized Dialogue Lines (Karaoke Subtitles) */
                <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5 duration-200 animate-in fade-in sm:p-4">
                  {/* Subtitles Header & Furigana / Translation Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                      <Headphones size={14} className="text-primary" />
                      <span>Sinxron Subtitrlar (Dialog):</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Furigana Mode Pills: ON, Hover, OFF */}
                      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-0.5 text-[10px] font-bold">
                        <span className="px-1.5 text-muted-foreground">Furigana:</span>
                        <button
                          type="button"
                          onClick={() => setFuriganaMode('always')}
                          className={`cursor-pointer rounded-lg px-2 py-0.5 transition-all ${
                            furiganaMode === 'always'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title="Furigana doimo ko'rinadi"
                        >
                          振 ON
                        </button>
                        <button
                          type="button"
                          onClick={() => setFuriganaMode('hover')}
                          className={`cursor-pointer rounded-lg px-2 py-0.5 transition-all ${
                            furiganaMode === 'hover'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title="Cursor olib kelinganda / bosilganda ko'rinadi"
                        >
                          👁️ Hover
                        </button>
                        <button
                          type="button"
                          onClick={() => setFuriganaMode('never')}
                          className={`cursor-pointer rounded-lg px-2 py-0.5 transition-all ${
                            furiganaMode === 'never'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title="Furigana o'chirilgan"
                        >
                          🚫 OFF
                        </button>
                      </div>

                      {/* Translation Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowTranslations(!showTranslations)}
                        className={`flex cursor-pointer items-center gap-1 rounded-xl border px-2.5 py-1 text-[10px] font-bold transition-all ${
                          showTranslations
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                        }`}
                        title="O'zbekcha tarjimalarni ko'rsatish/yashirish"
                      >
                        <Languages size={12} />
                        <span>Tarjima</span>
                      </button>
                    </div>
                  </div>

                  {/* Lines list with interactive Furigana, Karaoke time-sync & Shadowing */}
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {currentDialogueLines.map((line, idx) => {
                      const isActive = currentLineIndex === idx;
                      const badgeStyle = getSpeakerBadgeStyle(line.gender);
                      const lineStart = lineSegments[idx]?.start ?? 0;

                      return (
                        <div
                          key={line.id || idx}
                          ref={isActive ? activeLineRef : undefined}
                          onClick={() => handlePlaySpecificLine(line, idx)}
                          className={`group flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition-all ${
                            isActive
                              ? 'border-rose-500 bg-rose-500/10 shadow-sm ring-2 ring-rose-500/30'
                              : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/50'
                          }`}
                          title="Faqat shu gapni eshitish uchun bosing"
                        >
                          <div className="flex shrink-0 flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-black ${badgeStyle}`}
                            >
                              <User size={10} />
                              {line.speaker}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSeekToLine(idx);
                              }}
                              className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold transition-all ${
                                isActive
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'bg-muted/70 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-600'
                              }`}
                              title="Audioni ayni shu vaqtdan boshlash (Seek)"
                            >
                              ⏱ {ListeningAudioSyncService.formatTime(lineStart)}
                            </button>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-xs leading-relaxed transition-all ${
                                isActive
                                  ? 'font-black text-foreground'
                                  : 'font-medium text-foreground/90'
                              }`}
                            >
                              <FuriganaText
                                text={line.japanese}
                                mode={furiganaMode}
                                rubyClassName="text-[10px] text-rose-500 dark:text-rose-400 font-bold"
                              />
                            </div>
                            {showTranslations && line.uzbek && (
                              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                                {line.uzbek}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlaySpecificLine(line, idx);
                            }}
                            className={`shrink-0 rounded-lg p-1.5 transition-all ${
                              isActive
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'text-muted-foreground opacity-60 group-hover:text-rose-500 group-hover:opacity-100'
                            }`}
                            title={isActive ? 'Ijroda...' : 'Tinglash'}
                          >
                            <Play size={12} className={isActive ? 'animate-pulse' : ''} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Question Text & 4 Multiple Choice Options (5 cols on desktop) */}
            <div className="space-y-4 lg:col-span-5">
              <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
                <div>
                  <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Savol matni:
                  </span>
                  <h4 className="text-sm font-black leading-snug text-foreground sm:text-base">
                    {currentQuestion.questionText}
                  </h4>
                  {currentQuestion.questionTextUz && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {currentQuestion.questionTextUz}
                    </p>
                  )}
                </div>

                {/* 4 Options */}
                <div className="space-y-2.5 pt-2">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = userAnswers[currentQuestion.id] === idx;
                    const optUz = currentQuestion.optionsUz?.[idx];

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-3.5 text-left text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-rose-500 bg-rose-500/15 text-rose-600 shadow-xs ring-1 ring-rose-500 dark:text-rose-400'
                            : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                              isSelected
                                ? 'bg-rose-500 text-white'
                                : 'border border-border bg-card text-muted-foreground'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <span className="block font-bold text-foreground">{opt}</span>
                            {optUz && (
                              <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
                                {optUz}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={16} className="ml-2 shrink-0 text-rose-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleNext}
                className="active:scale-98 w-full cursor-pointer rounded-2xl bg-rose-600 py-4 text-sm font-extrabold text-white shadow-lg transition-all hover:bg-rose-700"
              >
                {currentQIdx === activeQuestions.length - 1
                  ? "Natijani Ko'rish 🎯"
                  : 'Keyingi Savol ➔'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: REPORT & SCRIPT EXPLANATIONS */}
      {step === 'report' && (
        <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-border bg-card p-6 text-center shadow-xl duration-200 animate-in fade-in sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 shadow-sm">
            <Award size={36} />
          </div>

          <div>
            <span className="block text-xs font-extrabold uppercase tracking-wider text-rose-500">
              JLPT {level} Tinglab Tushunish Natijasi
            </span>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {score} / {activeQuestions.length} To&apos;g&apos;ri
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Natijangiz shaxsiy o&apos;quv rejangizga va monitoring statistikasiga muvaffaqiyatli
              saqlandi.
            </p>
          </div>

          {/* Export mistakes to flashcards banner */}
          {activeQuestions.some((q) => userAnswers[q.id] !== q.correctAnswer) && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-left sm:flex-row">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-rose-500/20 p-2 text-rose-500">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-foreground">
                    Xato savollarni fleshkartaga saqlash
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Tinglashda xato qilgan savollaringizni to&apos;liq audio skripti bilan birga
                    Anki SRS to&apos;plamiga yuklang.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportMistakes}
                disabled={isExporting || isExported}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  isExported
                    ? 'bg-emerald-600 text-white'
                    : 'cursor-pointer bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:scale-95'
                }`}
              >
                {isExported ? (
                  <>
                    <CheckCircle size={14} />
                    <span>Saqlandi (Anki SRS)</span>
                  </>
                ) : (
                  <>
                    <BookOpen size={14} />
                    <span>{isExporting ? 'Saqlanmoqda...' : 'Fleshkartaga saqlash'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Detailed Question Review with Audio */}
          <div className="space-y-4 border-t border-border pt-5 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground sm:text-sm">
                <BookOpen size={16} className="text-rose-500" />
                <span>Savollar va Skript Tahlili:</span>
              </h4>

              {/* Furigana selector for review */}
              <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-0.5 text-[10px] font-bold">
                <span className="px-1.5 text-muted-foreground">Furigana:</span>
                <button
                  type="button"
                  onClick={() => setFuriganaMode('always')}
                  className={`cursor-pointer rounded-lg px-2 py-0.5 transition-all ${
                    furiganaMode === 'always'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Furigana doimo ko'rinadi"
                >
                  振 ON
                </button>
                <button
                  type="button"
                  onClick={() => setFuriganaMode('hover')}
                  className={`cursor-pointer rounded-lg px-2 py-0.5 transition-all ${
                    furiganaMode === 'hover'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Cursor olib kelinganda ko'rinadi"
                >
                  👁️ Hover
                </button>
                <button
                  type="button"
                  onClick={() => setFuriganaMode('never')}
                  className={`cursor-pointer rounded-lg px-2 py-0.5 transition-all ${
                    furiganaMode === 'never'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Furigana o'chirilgan"
                >
                  🚫 OFF
                </button>
              </div>
            </div>

            {activeQuestions.map((q, idx) => {
              const isCorrect = userAnswers[q.id] === q.correctAnswer;
              const qLines =
                q.dialogueLines && q.dialogueLines.length > 0
                  ? q.dialogueLines
                  : parseScriptIntoDialogueLines(q.script);

              return (
                <div
                  key={q.id}
                  className={`space-y-3 rounded-2xl border p-4 text-xs transition-all sm:p-5 ${
                    isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-rose-500/30 bg-rose-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 font-bold text-foreground">
                    <span className="text-sm font-black">
                      Savol {idx + 1}. {q.questionText}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isCorrect ? "To'g'ri" : 'Xato'}
                    </span>
                  </div>

                  {/* Interactive Dialogue Script */}
                  <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/40 p-3">
                    <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-muted-foreground">
                      <span>Audio Skript (台本):</span>
                      <span className="text-[10px] opacity-75">
                        Gapni tinglash uchun ustiga bosing
                      </span>
                    </div>
                    {qLines.map((line, lIdx) => (
                      <div
                        key={lIdx}
                        onClick={() => handlePlaySpecificLine(line, lIdx)}
                        className="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 text-[11px] transition-all hover:bg-card/70"
                      >
                        <span className="shrink-0 font-bold text-rose-600 dark:text-rose-400">
                          {line.speaker}:
                        </span>
                        <div className="flex-1 text-foreground">
                          <FuriganaText
                            text={line.japanese}
                            mode={furiganaMode}
                            rubyClassName="text-[9px] text-rose-500 dark:text-rose-400 font-bold"
                          />
                        </div>
                        <Play
                          size={10}
                          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>To&apos;g&apos;ri javob:</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400">
                      {q.options[q.correctAnswer]}
                    </span>
                  </div>

                  <div className="space-y-1 rounded-xl border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <HelpCircle size={14} className="text-primary" />
                      <span>O&apos;zbekcha tushuntirish:</span>
                    </div>
                    <p className="leading-relaxed">{q.explanationUzbek}</p>
                    {q.tipUzbek && (
                      <p className="pt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        💡 <b>Imtihon maslahati:</b> {q.tipUzbek}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            onClick={() => {
              setStep('intro');
            }}
            className="w-full cursor-pointer rounded-2xl bg-rose-600 py-4 text-sm font-extrabold text-white shadow-lg hover:bg-rose-700"
          >
            Qayta topshirish 🔄
          </Button>
        </div>
      )}
    </div>
  );
};

export default JlptListeningMockPage;
