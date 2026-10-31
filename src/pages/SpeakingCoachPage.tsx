import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mic,
  ShieldAlert,
  X,
  ExternalLink,
  Square,
  Sparkles,
  Volume2,
  BookOpen,
  Home,
  Plane,
  Utensils,
  Briefcase,
  Check,
  Plus,
} from 'lucide-react';
import { useStudyData } from '../context/StudyPlannerContext';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { useSEO } from '../hooks/useSEO';
import SessionReportModal from '../components/speaking/SessionReportModal';
import {
  PERSONAS_BY_LANG,
  CoachPersona,
  CoachVocabularyItem,
} from '../components/speaking/speakingTypes';
import { ConversationScenario, ScenarioSessionResult } from '../components/speaking/scenarioTypes';
import { ScenarioService } from '../services/ScenarioService';
import { ScenarioReportModal } from '../components/speaking/ScenarioReportModal';
import { CoachTopBar } from '../components/speaking/CoachTopBar';
import { CoachSettingsModal } from '../components/speaking/CoachSettingsModal';
import { PitchAccentService, PitchAccentInfo } from '../services/PitchAccentService';
import { PitchAccentModal } from '../components/speaking/PitchAccentModal';
import { PitchAccentTrainer } from '../components/speaking/PitchAccentTrainer';
import { useSpeakingSessionOrchestrator } from '../hooks/useSpeakingSessionOrchestrator';
import { SpeakingScenarioBanner } from '../components/speaking/SpeakingScenarioBanner';
import { ProjectOrb, OrbState } from '../components/character/ProjectOrb';
import { useAudioLevel } from '../hooks/useAudioLevel';
import { SpeakingHistoryModal } from '../components/speaking/SpeakingHistoryModal';
import { SpeakingConversationHistoryService } from '../services/SpeakingConversationHistoryService';
import {
  PROMPT_SUGGESTIONS_BY_LANG,
  getCoachInitialGreeting,
} from '../components/speaking/speakingConstants';
import { SessionAnalysisReport } from '../utils/ai';
import { toast } from '../hooks/use-toast';

export { getCoachInitialGreeting };

const TOPIC_PRESETS = [
  { label: 'Kundalik hayot', icon: Home, id: 'daily_life' },
  { label: 'Sayohat', icon: Plane, id: 'travel' },
  { label: 'Restoran', icon: Utensils, id: 'restaurant' },
  { label: 'Ish', icon: Briefcase, id: 'work' },
];

const SpeakingCoachPage: React.FC = () => {
  useSEO({
    title: 'AI Yapon Tili Muloqot Murabbiyi (Speaking Sensei)',
    description:
      "Yapon tilida erkin gapirishni o'rganing. Real vaqtda faqat ovozli jonli muloqot, xatolar tahlili va interaktiv transkripsiya.",
    canonical: '/speaking-coach',
    keywords:
      "yapon tili speaking, yaponcha so'zlashuv, AI yapon tili suhbatdosh, Yuki sensei, yaponcha talaffuz, JLPT kaiwa, yapon tili muloqot",
  });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    user,
    subjects,
    addSubject,
    flashcards,
    updateFlashcard,
    addFlashcardsBatch,
    targetLevel,
    awardXP,
  } = useStudyData();
  const { isTwa, openLink, haptics } = useTelegramWebApp();

  // Clean up legacy flashcards
  const hasCleanedLegacyCardsRef = useRef(false);
  useEffect(() => {
    if (
      !hasCleanedLegacyCardsRef.current &&
      flashcards &&
      flashcards.length > 0 &&
      updateFlashcard
    ) {
      hasCleanedLegacyCardsRef.current = true;
      flashcards.forEach((card) => {
        if (card.back && card.back.includes('🎙️ Manba:')) {
          const cleanedBack = card.back.replace(/\n*🎙️\s*Manba:[^\n]*/gi, '').trim();
          updateFlashcard(card.id, { back: cleanedBack }).catch(() => {});
        }
      });
    }
  }, [flashcards, updateFlashcard]);

  const scenarioIdParam = searchParams.get('scenario');
  const language: 'en' | 'ja' = 'ja';

  const [activeScenario, setActiveScenario] = useState<ConversationScenario | null>(() => {
    if (!scenarioIdParam) return null;
    const normalizedParam = scenarioIdParam.trim().replace(/\s+/g, '_');
    const immediate = ScenarioService.getImmediateScenarios();
    return immediate.find((s) => s.id === scenarioIdParam || s.id === normalizedParam) || null;
  });

  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string | null>(null);

  const [persona] = useState<CoachPersona>('casual');
  const [targetJlptLevel, setTargetJlptLevel] = useState<'N5' | 'N4' | 'N3' | 'N2' | 'N1'>(() => {
    if (
      activeScenario?.difficulty &&
      ['N5', 'N4', 'N3', 'N2', 'N1'].includes(activeScenario.difficulty.toUpperCase())
    ) {
      return activeScenario.difficulty.toUpperCase() as any;
    }
    const raw = (targetLevel || '').toUpperCase();
    if (['N5', 'N4', 'N3', 'N2', 'N1'].includes(raw)) {
      return raw as any;
    }
    return 'N5';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState<number>(
    () => SpeakingConversationHistoryService.getSessions().length,
  );

  // Modals state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportData, setReportData] = useState<SessionAnalysisReport | null>(null);

  const [isScenarioReportOpen, setIsScenarioReportOpen] = useState(false);
  const [isScenarioEvalLoading, setIsScenarioEvalLoading] = useState(false);
  const [scenarioEvalResult, setScenarioEvalResult] = useState<ScenarioSessionResult | null>(null);

  const [inspectingPitch, setInspectingPitch] = useState<PitchAccentInfo | null>(null);
  const [isPitchTrainerOpen, setIsPitchTrainerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scenarioIntroSpokenRef = useRef<string | null>(null);

  const orchestrator = useSpeakingSessionOrchestrator({
    language,
    persona,
    targetJlptLevel,
    activeScenario,
    user,
    subjects,
    addSubject,
    flashcards,
    addFlashcardsBatch,
    onScenarioEvaluated: (result) => {
      setScenarioEvalResult(result);
      setIsScenarioReportOpen(true);
      setIsScenarioEvalLoading(false);
    },
    onSessionAnalyzed: (report) => {
      setReportData(report);
      setIsReportOpen(true);
      setIsReportLoading(false);
    },
  });

  const {
    isLiveSession,
    isSpeaking,
    isThinking,
    isListening,
    sessionSeconds,
    chatHistory,
    setChatHistory,
    accumulatedNewWords,
    currentTranscript,
    audioVolume,
    isSupported,
    error,
    setError,
    speechSpeed,
    setSpeechSpeed,
    voiceRecorder,
    startSession,
    endSession,
    toggleMic,
    unlockAudio,
    speakText,
    stopSpeaking,
    formatTimer,
    handleAddVocabToFlashcards,
  } = orchestrator;

  // Track latest state for event callbacks and unmount
  const isLiveSessionRef = useRef(isLiveSession);
  const sessionSecondsRef = useRef(sessionSeconds);
  const chatHistoryRef = useRef(chatHistory);
  const accumulatedNewWordsRef = useRef(accumulatedNewWords);
  const activeScenarioRef = useRef(activeScenario);
  const selectedTopicTitleRef = useRef(selectedTopicTitle);
  const wasInterruptedByTabSwitchRef = useRef(false);

  useEffect(() => {
    isLiveSessionRef.current = isLiveSession;
  }, [isLiveSession]);

  useEffect(() => {
    sessionSecondsRef.current = sessionSeconds;
  }, [sessionSeconds]);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    accumulatedNewWordsRef.current = accumulatedNewWords;
  }, [accumulatedNewWords]);

  useEffect(() => {
    activeScenarioRef.current = activeScenario;
  }, [activeScenario]);

  useEffect(() => {
    selectedTopicTitleRef.current = selectedTopicTitle;
  }, [selectedTopicTitle]);

  // Save session to history helper
  const endSessionAndSave = useCallback(
    (reason: 'manual' | 'visibility_hidden' | 'pagehide' | 'unmount') => {
      if (!isLiveSessionRef.current) return;

      const durSecs = sessionSecondsRef.current;
      const history = [...chatHistoryRef.current];
      const newWords = [...accumulatedNewWordsRef.current];
      const scenarioTitle =
        activeScenarioRef.current?.title_uz || selectedTopicTitleRef.current || 'Erkin suhbat';
      const scenarioId = activeScenarioRef.current?.id;

      // 1. Immediately shut off speech and cancel AI requests
      stopSpeaking();
      const skipEval = reason !== 'manual';
      endSession({ skipEvaluation: skipEval }).catch(() => {});

      // 2. Save only if user spoke
      const saved = SpeakingConversationHistoryService.saveSession({
        durationSeconds: durSecs,
        scenarioTitle,
        scenarioId,
        messages: history.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          corrected: m.corrected,
          explanation_uz: m.explanation_uz,
        })),
        newWords: newWords.map((w) => ({
          word: w.word,
          reading: w.reading,
          translation_uz: w.translation_uz,
        })),
      });

      if (saved) {
        setHistoryCount(SpeakingConversationHistoryService.getSessions().length);
        if (reason === 'visibility_hidden') {
          wasInterruptedByTabSwitchRef.current = true;
        } else if (reason === 'manual') {
          toast({
            title: 'Suhbat yakunlandi va tarixga saqlandi',
            description: `${durSecs} soniya davom etdi. Tarix bo'limidan ko'rishingiz mumkin.`,
          });
        }
      }
    },
    [stopSpeaking, endSession],
  );

  // Requirement 6 & 7: Auto-termination on visibilitychange, pagehide, and unmount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (isLiveSessionRef.current) {
          endSessionAndSave('visibility_hidden');
        }
      } else if (document.visibilityState === 'visible') {
        // User returned to tab
        if (wasInterruptedByTabSwitchRef.current) {
          wasInterruptedByTabSwitchRef.current = false;
          toast({
            title: 'Suhbat tugatildi va tarixga saqlandi',
            description:
              'Boshqa oynaga o‘tganingiz sababli suhbat avtomatik yakunlandi va saqlandi.',
          });
        }
      }
    };

    const handlePageHide = () => {
      if (isLiveSessionRef.current) {
        endSessionAndSave('pagehide');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      if (isLiveSessionRef.current) {
        endSessionAndSave('unmount');
      }
    };
  }, [endSessionAndSave]);

  // Scenario loading and greeting
  useEffect(() => {
    if (scenarioIdParam) {
      const normalizedParam = scenarioIdParam.trim().replace(/\s+/g, '_');
      if (scenarioIntroSpokenRef.current === normalizedParam) return;
      scenarioIntroSpokenRef.current = normalizedParam;

      const immediateList = ScenarioService.getImmediateScenarios();
      const immediateFound = immediateList.find(
        (s) => s.id === scenarioIdParam || s.id === normalizedParam,
      );

      const applyScenario = (scenario: ConversationScenario) => {
        setActiveScenario((prev) => (prev?.id === scenario.id ? prev : scenario));
        if (
          scenario.difficulty &&
          ['N5', 'N4', 'N3', 'N2', 'N1'].includes(scenario.difficulty.toUpperCase())
        ) {
          setTargetJlptLevel(scenario.difficulty.toUpperCase() as any);
        }
      };

      if (immediateFound) {
        applyScenario(immediateFound);
      } else {
        ScenarioService.getScenarios()
          .then((scenarios) => {
            const found = scenarios.find(
              (s) => s.id === scenarioIdParam || s.id === normalizedParam,
            );
            if (found) applyScenario(found);
          })
          .catch(console.error);
      }
    } else {
      scenarioIntroSpokenRef.current = null;
      setActiveScenario(null);
    }
  }, [scenarioIdParam]);

  // Fullscreen support
  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => setIsFullscreen((prev) => !prev));
    } else {
      document.exitFullscreen?.().catch(() => setIsFullscreen(false));
    }
  }, []);

  // Keyboard shortcut: Space toggles microphone or starts/stops
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);
      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isLiveSessionRef.current) {
          handleStartSession();
        } else {
          toggleMic();
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (isLiveSessionRef.current) {
          endSessionAndSave('manual');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMic, endSessionAndSave]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, currentTranscript, isThinking]);

  // Pitch Accent inspection
  const handleInspectPitch = useCallback((word: string, kanaHint?: string) => {
    const info = PitchAccentService.getPitchAccent(word, kanaHint);
    setInspectingPitch(info);
  }, []);

  const handleStartSession = () => {
    haptics.impact('medium');
    const topic = activeScenario?.title_uz || selectedTopicTitle || undefined;
    startSession(topic);
  };

  const handleStopSession = () => {
    haptics.impact('medium');
    endSessionAndSave('manual');
  };

  const handleToggleSession = () => {
    if (isLiveSession) {
      handleStopSession();
    } else {
      handleStartSession();
    }
  };

  // State calculation for ProjectOrb
  const orbState: OrbState = isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle';
  const audioLevel = useAudioLevel(audioVolume);

  const PERSONAS = PERSONAS_BY_LANG[language];
  const PROMPT_SUGGESTIONS = PROMPT_SUGGESTIONS_BY_LANG[language];
  const isMicPermissionError = !!error && /mikrofon/iu.test(error);

  return (
    <div
      ref={containerRef}
      onTouchStart={() => unlockAudio()}
      className={`pb-safe relative flex h-[100dvh] w-full select-none flex-col overflow-hidden bg-[#0a0b1f] text-slate-100 ${
        isFullscreen ? 'fixed inset-0 z-50 m-0 h-screen w-screen p-0' : ''
      }`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(7, 12, 24, 0.44), rgba(7, 12, 24, 0.72)), url('/images/speaking-japan-night.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background Ambient Tint */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80" />
      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-full w-full overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] animate-pulse rounded-full bg-primary/10 blur-[130px]" />
        <div
          className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[130px]"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Top Bar */}
      <CoachTopBar
        language={language}
        persona={persona}
        isLiveSession={isLiveSession}
        sessionSeconds={sessionSeconds}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyCount}
        activeScenario={activeScenario}
        formatTimer={formatTimer}
      />

      <SpeakingScenarioBanner
        activeScenario={activeScenario}
        onExitScenario={() => {
          setActiveScenario(null);
          navigate('/speaking-coach?lang=ja', { replace: true });
        }}
      />

      {/* Browser Speech API Warning if unsupported */}
      {!isSupported && (
        <div
          role="alert"
          aria-live="polite"
          className="mx-3 mb-2 flex flex-col justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 backdrop-blur-sm animate-in fade-in sm:flex-row sm:items-center md:mx-6"
        >
          <div className="flex items-start gap-2.5 sm:items-center">
            <span className="text-lg">🎙️</span>
            <div>
              <p className="font-semibold text-amber-300">
                Ovozli suhbat ushbu brauzerda cheklangan
              </p>
              <p className="text-[11px] text-amber-300/80">
                {isTwa
                  ? "Telegram ichki brauzerida Web Speech API cheklangan bo'lishi mumkin. Tashqi Chrome yoki Safari orqali to'liq foydalanishingiz mumkin."
                  : 'Eng yaxshi ovozli suhbat uchun Google Chrome yoki Microsoft Edge brauzeridan foydalaning.'}
              </p>
            </div>
          </div>
          {isTwa && (
            <button
              onClick={() => {
                haptics.impact('light');
                const targetUrl =
                  window.location.href.split('?')[0] || 'https://kaiwa.live/speaking';
                openLink(targetUrl);
              }}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 shadow transition-transform hover:bg-amber-400 active:scale-95"
            >
              <ExternalLink size={13} />
              <span>Brauzerda ochish</span>
            </button>
          )}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="mx-3 mb-2 rounded-xl border border-rose-500/20 bg-rose-500/15 px-3 py-2 text-xs text-rose-300 backdrop-blur-sm animate-in fade-in md:mx-6"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="shrink-0 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg hover:bg-rose-500/20"
              aria-label="Xatolik xabarini yopish"
            >
              <X size={16} />
            </button>
          </div>
          {isMicPermissionError && (
            <div className="mt-1 space-y-1.5 border-t border-rose-500/20 pt-1.5 text-[11px] text-rose-300">
              <p>Brauzer sozlamalarida mikrofonga ruxsat bering va qayta bosing.</p>
              <button
                onClick={() => {
                  setError(null);
                  toggleMic();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-rose-500"
              >
                <Mic size={13} />
                <span>Mikrofonni qayta so‘rash</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MAIN SINGLE VIEW CONTENT */}
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-3 py-2 sm:px-6">
        {/* UPPER HERO: ProjectOrb (KaiwaOrbCharacter) */}
        <div className="flex shrink-0 flex-col items-center justify-center pb-3 pt-1 text-center">
          {/* Clickable Orb triggers start/stop in same window without navigation */}
          <div
            onClick={handleToggleSession}
            className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title={isLiveSession ? 'Suhbatni yakunlash uchun bosing' : 'Gapirish uchun bosing'}
          >
            <ProjectOrb
              state={orbState}
              audioVolume={audioLevel}
              size={170}
              interactive={false}
              ariaLabel={
                !isLiveSession
                  ? 'Gapirish uchun bosing'
                  : isSpeaking
                    ? 'Murabbiy gapiryapti'
                    : isThinking
                      ? 'O‘ylayapman'
                      : 'Tinglayapman'
              }
            />
          </div>

          {/* Action / Status Pill (Requirement 1) */}
          <div className="mt-2 flex flex-col items-center gap-1">
            {!isLiveSession ? (
              <button
                type="button"
                onClick={handleStartSession}
                className="group inline-flex items-center gap-2 rounded-full border border-primary/50 bg-gradient-to-r from-rose-600 to-indigo-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-rose-600/25 backdrop-blur transition-all hover:scale-105 hover:opacity-95 active:scale-95"
              >
                <Mic size={14} className="text-white transition-transform group-hover:scale-110" />
                <span>Gapirish uchun bosing</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-1.5 text-xs font-medium backdrop-blur">
                  {isSpeaking ? (
                    <span className="flex items-center gap-2 font-bold text-amber-300">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                      Murabbiy gapiryapti
                    </span>
                  ) : isThinking ? (
                    <span className="flex items-center gap-2 font-bold text-purple-300">
                      <span className="h-2.5 w-2.5 animate-ping rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
                      O‘ylayapman...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 font-bold text-emerald-400">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                      Tinglayapman...
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleStopSession}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/20 px-3.5 py-1.5 text-xs font-bold text-rose-300 shadow transition hover:bg-rose-500/30 active:scale-95"
                  title="Suhbatni yakunlash va saqlash"
                >
                  <Square size={12} className="fill-current text-rose-400" />
                  <span>Suhbatni yakunlash</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TRANSKRIPSIYA (CHAT KO'RINISHIDA) */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shadow-inner backdrop-blur-md">
          <div
            ref={chatContainerRef}
            className="scrollbar-thin scrollbar-thumb-white/10 flex-1 space-y-3 overflow-y-auto p-3.5 sm:p-4"
          >
            {chatHistory.length === 0 && !currentTranscript && (
              <div className="flex h-full flex-col items-center justify-center py-6 text-center text-slate-400">
                <Sparkles size={28} className="mb-2 text-rose-400/80" />
                <p className="text-xs font-medium text-slate-200 sm:text-sm">
                  Suhbat transkripsiyasi shu yerda chiqadi
                </p>
                <p className="mt-1 max-w-xs text-[11px] text-slate-400">
                  Sharchani bosing va yapon tilida erkin so‘zlang. Xatolaringiz shu yerda yashil
                  rangda to‘g‘rilanadi.
                </p>
              </div>
            )}

            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-md transition-all sm:max-w-[75%] sm:text-sm ${
                    msg.role === 'user'
                      ? 'rounded-tr-xs border border-primary/40 bg-primary/25 text-white shadow-primary/10'
                      : 'rounded-tl-xs border border-white/10 bg-slate-900/90 text-slate-100'
                  }`}
                >
                  {/* Bubble Header */}
                  <div className="mb-1 flex items-center justify-between gap-2 text-[10px] opacity-75">
                    <span className="font-semibold">
                      {msg.role === 'user' ? 'Siz' : PERSONAS[persona].name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span>{msg.timestamp}</span>
                      {msg.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => speakText(msg.ttsText || msg.content)}
                          className="p-0.5 transition hover:text-primary"
                          title="Qayta tinglash"
                        >
                          <Volume2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Japanese Content */}
                  <p className="whitespace-pre-wrap font-medium leading-relaxed">{msg.content}</p>

                  {/* Romaji for Assistant if available */}
                  {msg.role === 'assistant' && msg.romaji && (
                    <p className="mt-1 font-mono text-[10px] italic text-slate-400">{msg.romaji}</p>
                  )}

                  {/* XATONI TUZATISH (Foydalanuvchi gapi tagida yashil rangda va 1 qator o'zbekcha izoh) */}
                  {msg.role === 'user' && msg.corrected && (
                    <div className="mt-2 space-y-0.5 border-t border-white/10 pt-2 text-[11px]">
                      <div className="flex items-start gap-1 font-semibold text-emerald-400">
                        <span>✓</span>
                        <span>{msg.corrected}</span>
                      </div>
                      {msg.explanation_uz && (
                        <div className="pl-3 text-[10px] italic text-slate-300">
                          {msg.explanation_uz}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Live recognized transcript while speaking */}
            {currentTranscript && (
              <div className="flex justify-end animate-in fade-in">
                <div className="rounded-tr-xs flex max-w-[85%] items-center gap-2 rounded-2xl border border-primary/50 bg-primary/20 p-3 text-xs italic text-white sm:text-sm">
                  <Mic size={14} className="shrink-0 animate-pulse text-primary" />
                  <span>{currentTranscript}</span>
                </div>
              </div>
            )}
          </div>

          {/* YANGI SO'ZLAR RO'YXATI (Transkripsiya pastida) */}
          {accumulatedNewWords.length > 0 && (
            <div className="border-t border-white/10 bg-slate-950/70 p-2.5 sm:p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-rose-300">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={13} />
                  <span>Yangi so&apos;zlar ({accumulatedNewWords.length})</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400">
                  Suhbat davomida to‘plangan
                </span>
              </div>
              <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                {accumulatedNewWords.map((wordItem, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-baseline gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleInspectPitch(wordItem.word, wordItem.reading)}
                      className="text-left font-bold text-white underline decoration-white/30 decoration-dotted transition hover:text-rose-400"
                      title="Pitch accentni ko‘rish"
                    >
                      {wordItem.word}
                    </button>
                    {wordItem.reading && (
                      <span className="text-[10px] text-rose-300">({wordItem.reading})</span>
                    )}
                    <span className="text-slate-400">—</span>
                    <span className="text-[11px] text-slate-300">{wordItem.translation_uz}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddVocabToFlashcards({
                          word: wordItem.word,
                          reading: wordItem.reading,
                          meaning: wordItem.translation_uz,
                        } as CoachVocabularyItem)
                      }
                      className="ml-1 text-slate-400 transition hover:text-emerald-400"
                      title="Lug‘at kartalariga qo‘shish"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SSENARIYLAR BLOKI (Joyida qoladi, tanlangan ssenariy suhbat mavzusi bo'ladi) */}
        <div className="mt-2.5 shrink-0 rounded-2xl border border-white/10 bg-slate-950/40 p-2.5 backdrop-blur-md sm:p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Ssenariylar
            </span>
            <span className="text-[11px] text-slate-400">
              {activeScenario
                ? `Mavzu: ${activeScenario.title_uz}`
                : 'Mavzuni tanlang yoki erkin gapiring'}
            </span>
          </div>

          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {TOPIC_PRESETS.map((preset, index) => {
              const promptTitle = PROMPT_SUGGESTIONS[index]?.title || preset.label;
              const isSelected =
                activeScenario?.title_uz === promptTitle ||
                activeScenario?.title_ja === promptTitle ||
                selectedTopicTitle === promptTitle;
              const PresetIcon = preset.icon;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTopicTitle(null);
                      setActiveScenario(null);
                    } else {
                      setSelectedTopicTitle(promptTitle);
                      const immediate = ScenarioService.getImmediateScenarios();
                      const match = immediate.find(
                        (s) =>
                          s.title_uz.toLowerCase().includes(preset.label.toLowerCase()) ||
                          s.id === preset.id,
                      );
                      if (match) {
                        setActiveScenario(match);
                      }
                    }
                  }}
                  className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition active:scale-95 ${
                    isSelected
                      ? 'border-primary/80 bg-primary/20 text-white shadow-md'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <PresetIcon
                    size={14}
                    className={isSelected ? 'text-primary' : 'text-slate-400'}
                  />
                  <span>{preset.label}</span>
                  {isSelected && <Check size={12} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* MODALS */}
      <SpeakingHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSpeakText={speakText}
      />

      <CoachSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        targetLevel={targetJlptLevel}
        onTargetLevelChange={(level) => setTargetJlptLevel(level as typeof targetJlptLevel)}
        speechSpeed={speechSpeed}
        onSpeechSpeedChange={setSpeechSpeed}
        onOpenPitchTrainer={() => setIsPitchTrainerOpen(true)}
        onToggleFullscreen={toggleFullscreen}
      />

      <SessionReportModal
        isOpen={isReportOpen}
        onClose={() => {
          setIsReportOpen(false);
          setChatHistory([]);
        }}
        report={reportData}
        isLoading={isReportLoading}
        personaTitle={PERSONAS[persona].name}
      />

      <ScenarioReportModal
        isOpen={isScenarioReportOpen}
        onClose={() => {
          setIsScenarioReportOpen(false);
          setChatHistory([]);
        }}
        result={scenarioEvalResult}
        isLoading={isScenarioEvalLoading}
        recordedUrl={voiceRecorder.recordedUrl}
        durationSeconds={voiceRecorder.durationSeconds}
        isPlayingRecorded={voiceRecorder.isPlaying}
        audioProgressRecorded={voiceRecorder.audioProgress}
        onPlayRecorded={voiceRecorder.playRecorded}
        onPauseRecorded={voiceRecorder.pauseRecorded}
        onRetry={() => handleStartSession()}
      />

      <PitchAccentModal
        isOpen={!!inspectingPitch}
        onClose={() => setInspectingPitch(null)}
        accentInfo={inspectingPitch}
      />

      <PitchAccentTrainer
        isOpen={isPitchTrainerOpen}
        onClose={() => setIsPitchTrainerOpen(false)}
        onAwardXP={awardXP}
      />
    </div>
  );
};

export default SpeakingCoachPage;
