import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, ShieldAlert, X, ExternalLink } from 'lucide-react';
import { useStudyData } from '../context/StudyPlannerContext';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { useSEO } from '../hooks/useSEO';
import SessionReportModal from '../components/speaking/SessionReportModal';
import { PERSONAS_BY_LANG, CoachPersona } from '../components/speaking/speakingTypes';
import { ConversationScenario, ScenarioSessionResult } from '../components/speaking/scenarioTypes';
import { ScenarioService } from '../services/ScenarioService';
import { ScenarioReportModal } from '../components/speaking/ScenarioReportModal';
import { CoachTopBar } from '../components/speaking/CoachTopBar';
import { CoachWelcomeScreen } from '../components/speaking/CoachWelcomeScreen';
import { CoachChatArea } from '../components/speaking/CoachChatArea';
import { CoachControlBar } from '../components/speaking/CoachControlBar';
import { CoachSettingsModal } from '../components/speaking/CoachSettingsModal';
import { RealtimeVoiceOverlay } from '../components/speaking/RealtimeVoiceOverlay';
import { PitchAccentService, PitchAccentInfo } from '../services/PitchAccentService';
import { PitchAccentModal } from '../components/speaking/PitchAccentModal';
import { PitchAccentTrainer } from '../components/speaking/PitchAccentTrainer';
import { useSpeakingSessionOrchestrator } from '../hooks/useSpeakingSessionOrchestrator';
import { SpeakingScenarioBanner } from '../components/speaking/SpeakingScenarioBanner';
import {
  PROMPT_SUGGESTIONS_BY_LANG,
  getCoachInitialGreeting,
} from '../components/speaking/speakingConstants';
import { extractSpeechAudioText } from '../utils/ai';
import { SessionAnalysisReport } from '../utils/ai';

export { getCoachInitialGreeting };

const SpeakingCoachPage: React.FC = () => {
  useSEO({
    title: 'AI Yapon Tili Muloqot Murabbiyi (Speaking Sensei)',
    description:
      "Yapon tilida erkin gapirishni o'rganing. Real vaqtda ovozli muloqot, talaffuz tekshirish, xatolar tahlili va interaktiv hayotiy dialoglar.",
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    setIsLiveSession,
    isSpeaking,
    isThinking,
    isListening,
    isMuted,
    setIsMuted,
    sessionSeconds,
    chatHistory,
    setChatHistory,
    liveErrors,
    currentTranscript,
    audioVolume,
    isSupported,
    error,
    setError,
    isPreparingAudio,
    speechSpeed,
    setSpeechSpeed,
    voiceRecorder,
    startSession,
    toggleSession,
    handleResetChat,
    handleSendUserText,
    toggleMic,
    handleBargeIn,
    commitSpeechNow,
    unlockAudio,
    speakText,
    stopSpeaking,
    formatTimer,
    handleAddVocabToFlashcards,
    handleTranslateMessage,
  } = orchestrator;

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
        setIsLiveSession(true);

        const greeting = scenario.opening_line_ja || 'こんにちは！会話を始めましょう。';
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const freshHistory = [
          { role: 'assistant' as const, content: greeting, timestamp: timeStr },
        ];
        setChatHistory(freshHistory);

        const speechAudio = extractSpeechAudioText(greeting);
        stopSpeaking();
        unlockAudio();
        speakText(speechAudio);
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
  }, [scenarioIdParam, unlockAudio, speakText, stopSpeaking, setIsLiveSession, setChatHistory]);

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

  // Keyboard shortcuts
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
        toggleMic();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (isSpeaking) {
          handleBargeIn();
        }
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleResetChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMic, handleBargeIn, handleResetChat, isSpeaking]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isThinking]);

  // Pitch Accent
  const handleInspectPitch = useCallback((word: string, kanaHint?: string) => {
    const info = PitchAccentService.getPitchAccent(word, kanaHint);
    setInspectingPitch(info);
  }, []);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const PERSONAS = PERSONAS_BY_LANG[language];
  const PROMPT_SUGGESTIONS = PROMPT_SUGGESTIONS_BY_LANG[language];
  const currentPersona = PERSONAS[persona];
  const isMicPermissionError = !!error && /mikrofon/iu.test(error);

  return (
    <div
      ref={containerRef}
      onTouchStart={() => unlockAudio()}
      className={`pb-safe relative flex h-[100dvh] w-full select-none flex-col overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 m-0 h-screen w-screen bg-background p-0' : ''
      }`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(7, 12, 24, 0.34), rgba(7, 12, 24, 0.42)), url('/images/speaking-japan-night.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/25 via-transparent to-slate-950/65" />
      {isLiveSession && (
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${currentPersona.gradientBg} transition-all duration-1000`}
        />
      )}
      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-full w-full overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] animate-pulse rounded-full bg-primary/10 blur-[120px]" />
        <div
          className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#C9A961]/10 blur-[120px]"
          style={{ animationDelay: '2s' }}
        />
        {isLiveSession && (
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary/5 blur-[150px]" />
        )}
      </div>

      <CoachTopBar
        language={language}
        persona={persona}
        isLiveSession={isLiveSession}
        sessionSeconds={sessionSeconds}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeScenario={activeScenario}
        formatTimer={formatTimer}
      />

      <SpeakingScenarioBanner
        activeScenario={activeScenario}
        onExitScenario={() => navigate('/scenarios?lang=ja')}
      />

      {!isSupported && (
        <div
          role="alert"
          aria-live="polite"
          className="mx-3 mb-2 flex flex-col justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200 backdrop-blur-sm animate-in fade-in sm:flex-row sm:items-center md:mx-5"
        >
          <div className="flex items-start gap-2.5 sm:items-center">
            <span className="text-lg">🎙️</span>
            <div>
              <p className="font-semibold text-amber-300">
                Ovozli suhbat ushbu brauzerda cheklangan
              </p>
              <p className="text-[11px] text-amber-300/80">
                {isTwa
                  ? "Telegram ichki brauzerida Web Speech API cheklangan bo'lishi mumkin. To'liq ovozli suhbat uchun tashqi brauzerda ochishingiz mumkin. Matnli suhbat esa to'liq faol."
                  : 'Eng yaxshi tajriba uchun Google Chrome yoki Microsoft Edge brauzeridan foydalaning. Matn orqali suhbatlashish faol.'}
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

      {error && (
        <div
          role="alert"
          className="mx-3 mb-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 backdrop-blur-sm animate-in fade-in dark:text-rose-400 md:mx-5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              aria-label="Xatolik xabarini yopish"
            >
              <X size={16} />
            </button>
          </div>
          {isMicPermissionError && (
            <div className="mt-1 space-y-2 border-t border-rose-500/20 pt-2 text-rose-600 dark:text-rose-400">
              <ol className="list-decimal space-y-0.5 pl-5 leading-relaxed">
                <li>Brauzer manzil satri yonidagi 🔒 yoki ⚙️ belgini bosing</li>
                <li>Sayt sozlamalarida Mikrofon ga ruxsat bering</li>
                <li>Sahifani yangilab, pastdagi tugmani bosing</li>
              </ol>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setError(null);
                    toggleMic();
                  }}
                  className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-rose-500 active:scale-95"
                >
                  <Mic size={14} />
                  <span>Mikrofonni qayta so‘rash</span>
                </button>
                <span className="text-[11px] opacity-80">
                  Yoki pastdagi yozish maydonidan matn bilan davom eting
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 mx-3 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden md:mx-5">
        {chatHistory.length === 0 && !isLiveSession ? (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <CoachWelcomeScreen
              promptSuggestions={PROMPT_SUGGESTIONS}
              onStartSession={(topicTitle) => startSession(topicTitle)}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-2.5 overflow-hidden sm:gap-4">
            <RealtimeVoiceOverlay
              isRecording={isListening}
              isAiSpeaking={isSpeaking}
              audioVolume={audioVolume}
              transcript={currentTranscript}
              errors={liveErrors}
              activeJlptLevel={targetJlptLevel}
              onBargeIn={handleBargeIn}
              onToggleRecording={toggleMic}
              onCommitNow={commitSpeechNow}
              onSpeakText={speakText}
            />
            <CoachChatArea
              chatHistory={chatHistory}
              isLiveSession={isLiveSession}
              currentPersona={currentPersona}
              currentTranscript={currentTranscript}
              isListening={isListening}
              isThinking={isThinking}
              copiedIndex={copiedIndex}
              chatContainerRef={chatContainerRef}
              handleTranslateMessage={handleTranslateMessage}
              copyToClipboard={copyToClipboard}
              speakText={speakText}
              setChatHistory={setChatHistory}
              onAddVocabulary={handleAddVocabToFlashcards}
              onInspectPitch={handleInspectPitch}
              activeScenario={activeScenario}
              onSelectHint={handleSendUserText}
            />
          </div>
        )}
      </div>

      <CoachControlBar
        isLiveSession={isLiveSession}
        isSpeaking={isSpeaking}
        isThinking={isThinking}
        isListening={isListening}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        sessionSeconds={sessionSeconds}
        chatHistoryLength={chatHistory.length}
        toggleSession={toggleSession}
        onClearHistory={handleResetChat}
        formatTimer={formatTimer}
        onForceStartListening={toggleMic}
        onBargeIn={handleBargeIn}
        isPreparingAudio={isPreparingAudio}
        onSendText={handleSendUserText}
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
        onRetry={() => startSession()}
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
