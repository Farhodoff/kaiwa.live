import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Sparkles,
  Volume2,
  Square,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Plus,
  HelpCircle,
  Copy,
  Check,
  Languages,
  Target,
  Briefcase,
  GraduationCap,
  Home,
  Coffee,
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { useStudyData } from '../context/StudyPlannerContext';
import {
  MonologueService,
  MonologueTopic,
  MonologueCategory,
  MonologueLevel,
  MonologueAnalysisResult,
  MONOLOGUE_CATEGORIES,
} from '../services/MonologueService';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

export const MonologuePage: React.FC = () => {
  useSEO({
    title: 'Monolog — AI Ovozli Yapon Tili Murabbiysi & Mensetsu',
    description:
      'JLPT N5-N1 darajalari, Mensetsu (ish suhbati) va Ryuugaku (o‘qish) mavzularida erkin gapiring. AI ovozingizni tinglaydi va kanjilarni o‘qilishi bilan tabiiy yapon tiliga aylantiradi.',
    canonical: '/monologue',
    keywords:
      'monolog yapon tili, mensetsu yaponcha, speech polisher, furigana monologue, jlpt kaiwa',
  });

  const { addFlashcardsBatch } = useStudyData();

  // Filters state
  const [selectedLevel, setSelectedLevel] = useState<MonologueLevel>('N3');
  const [selectedCategory, setSelectedCategory] = useState<MonologueCategory>('mensetsu');

  // Topics state
  const [topics, setTopics] = useState<MonologueTopic[]>(() =>
    MonologueService.getPresetTopics('mensetsu', 'N3'),
  );
  const [currentTopic, setCurrentTopic] = useState<MonologueTopic>(() => {
    const list = MonologueService.getPresetTopics('mensetsu', 'N3');
    return list[0];
  });
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [showTopicSelector, setShowTopicSelector] = useState(false);

  // Speech Recognition & Recording state
  const voiceRecorder = useVoiceRecorder();
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MonologueAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Audio Playback / TTS
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [addedWords, setAddedWords] = useState<Record<string, boolean>>({});

  // When Level or Category changes, update available presets
  useEffect(() => {
    const matching = MonologueService.getPresetTopics(selectedCategory, selectedLevel);
    setTopics(matching);
    if (matching.length > 0 && (!currentTopic || currentTopic.category !== selectedCategory)) {
      setCurrentTopic(matching[0]);
      setAnalysisResult(null);
      setLiveTranscript('');
    }
  }, [selectedCategory, selectedLevel]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';

      recognition.onresult = (event: any) => {
        let fullText = '';
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript;
        }
        setLiveTranscript(fullText);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition status:', err.error);
      };

      recognition.onend = () => {
        setIsRecognizing(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Handle Start Recording
  const handleStartRecording = useCallback(async () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setLiveTranscript('');

    try {
      await voiceRecorder.startRecording();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecognizing(true);
        } catch (e) {
          console.warn('Speech recognition start error:', e);
        }
      }
    } catch (err) {
      console.error('Mic start error:', err);
    }
  }, [voiceRecorder]);

  // Handle Stop Recording
  const handleStopRecording = useCallback(async () => {
    try {
      await voiceRecorder.stopRecording();
      if (recognitionRef.current && isRecognizing) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsRecognizing(false);
    } catch (err) {
      console.error('Stop recording error:', err);
    }
  }, [voiceRecorder, isRecognizing]);

  // Handle Submit to AI
  const handleAnalyze = async () => {
    const textToAnalyze = liveTranscript.trim();
    if (!textToAnalyze) {
      setAnalysisError(
        'Iltimos, avval mikrofon orqali gapiring yoki matn maydoniga yaponcha yozing.',
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await MonologueService.analyzeMonologueSpeech(currentTopic, textToAnalyze);
      setAnalysisResult(result);
    } catch (err: any) {
      setAnalysisError(err?.message || "Tahlil qilishda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate a new dynamic topic for current level & category
  const handleGenerateAiTopic = async () => {
    setIsGeneratingTopic(true);
    try {
      const newTopic = await MonologueService.generateDynamicTopic(selectedLevel, selectedCategory);
      setCurrentTopic(newTopic);
      setAnalysisResult(null);
      setLiveTranscript('');
      voiceRecorder.clearRecording();
      setShowTopicSelector(false);
    } catch (err) {
      console.error('Topic gen error:', err);
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  // Speak polished Japanese via TTS
  const handlePlayPolishedTTS = () => {
    if (
      !analysisResult?.polishedJapanese ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    if (isPlayingTTS) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(analysisResult.polishedJapanese);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find((v) => v.lang.includes('ja') || v.lang.includes('JP'));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    utterance.onend = () => setIsPlayingTTS(false);
    utterance.onerror = () => setIsPlayingTTS(false);

    setIsPlayingTTS(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Add word to user Flashcards
  const handleSaveWordToFlashcard = async (vocab: {
    kanji: string;
    reading: string;
    meaningUz: string;
  }) => {
    if (addedWords[vocab.kanji]) return;

    try {
      if (addFlashcardsBatch) {
        await addFlashcardsBatch([
          {
            front: vocab.kanji,
            back: `${vocab.reading}\n\n${vocab.meaningUz}`,
            phonetic: vocab.reading,
            example: `${vocab.kanji} (${vocab.reading}) - ${vocab.meaningUz}`,
          },
        ]);
        setAddedWords((prev) => ({ ...prev, [vocab.kanji]: true }));
      }
    } catch (e) {
      console.error('Failed to add flashcard:', e);
    }
  };

  // Reset session
  const handleReset = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setLiveTranscript('');
    voiceRecorder.clearRecording();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTTS(false);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const levels: MonologueLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  const getCategoryIcon = (cat: MonologueCategory) => {
    switch (cat) {
      case 'mensetsu':
        return <Briefcase className="h-4 w-4 text-amber-400" />;
      case 'ryuugaku':
        return <GraduationCap className="h-4 w-4 text-indigo-400" />;
      case 'visa_seikatsu':
        return <Home className="h-4 w-4 text-emerald-400" />;
      case 'daily_kaiwa':
        return <Coffee className="h-4 w-4 text-rose-400" />;
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-5xl bg-slate-950 px-4 pb-20 pt-4 text-slate-100 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
              <Sparkles className="h-3.5 w-3.5" />
              AI Monolog & Mensetsu Murabbiy
            </span>
            <span className="text-xs text-slate-400">| Diktofon, Furigana & Tahrir</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Monolog{' '}
            <span className="text-lg font-normal text-rose-400 sm:text-xl">(モノローグ)</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Ish intervyusi (Mensetsu), o‘qish yoki kundalik mavzuda erkin gapiring. AI nutqingizni
            tahlil qilib, to‘g‘ri yaponcha va qavsda o‘qilishi bilan qaytaradi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTopicSelector(!showTopicSelector)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700/80 sm:text-sm"
          >
            <BookOpen className="h-4 w-4 text-rose-400" />
            Mavzular ({topics.length})
          </button>
          <button
            onClick={handleGenerateAiTopic}
            disabled={isGeneratingTopic}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:from-rose-600 hover:to-indigo-700 disabled:opacity-50 sm:text-sm"
          >
            <Sparkles className={`h-4 w-4 ${isGeneratingTopic ? 'animate-spin' : ''}`} />
            {isGeneratingTopic ? 'Tuzilmoqda...' : 'Yangi Savol Olish (AI)'}
          </button>
        </div>
      </div>

      {/* Control Filters: JLPT Level & Practice Purpose */}
      <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:flex-row md:items-center">
        {/* Level selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Target className="h-3.5 w-3.5 text-rose-400" /> Daraja:
          </span>
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setSelectedLevel(lvl);
                handleReset();
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedLevel === lvl
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Category selector */}
        <div className="scrollbar-hide flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {MONOLOGUE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                handleReset();
              }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === cat.id
                  ? 'border border-indigo-500/40 bg-indigo-600/30 text-indigo-300 shadow-sm'
                  : 'border border-transparent bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title={cat.desc}
            >
              <span>{cat.icon}</span>
              <span>{cat.labelJa}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preset Topics Selector Dropdown */}
      {showTopicSelector && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl duration-200 animate-in fade-in">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {MONOLOGUE_CATEGORIES.find((c) => c.id === selectedCategory)?.labelUz} — Mavzular:
            </h3>
            <span className="text-xs font-medium text-rose-400">JLPT {selectedLevel}</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setCurrentTopic(t);
                  setShowTopicSelector(false);
                  handleReset();
                }}
                className={`rounded-xl border p-3 text-left transition ${
                  currentTopic.id === t.id
                    ? 'border-rose-500/40 bg-rose-500/10 text-white'
                    : 'border-slate-700/40 bg-slate-800/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-400">{t.title}</span>
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {t.level}
                  </span>
                </div>
                <div className="line-clamp-1 text-xs text-slate-400">{t.titleUz}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Question Banner (Silent / Text Prompt) */}
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-6 shadow-xl">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-rose-500/5 blur-3xl" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 rounded border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                {getCategoryIcon(currentTopic.category)}
                JLPT {currentTopic.level} • {currentTopic.title}
              </span>
              <span className="text-xs text-slate-400">| Rasmiy Savol:</span>
            </div>

            {/* Japanese Question */}
            <h2 className="text-xl font-bold tracking-wide text-white sm:text-2xl">
              {currentTopic.promptQuestionJa}
            </h2>

            {/* Uzbek Meaning */}
            <p className="mt-1.5 text-sm font-medium text-rose-300/90 sm:text-base">
              💬 {currentTopic.promptQuestionUz}
            </p>

            {/* Answer Guidance (PREP Rule: how to answer in detail) */}
            {currentTopic.answerGuidance && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="text-xs leading-relaxed text-amber-200/90">
                  <span className="mb-0.5 block font-semibold text-amber-300">
                    💡 Qanday javob berish kerak? (PREP yo‘riqnomasi):
                  </span>
                  {currentTopic.answerGuidance}
                </div>
              </div>
            )}

            {/* Hints / keywords */}
            {currentTopic.hints && currentTopic.hints.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  Yordamchi iboralar:
                </span>
                {currentTopic.hints.map((h, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dictaphone / Voice Recorder Studio */}
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 text-center">
        {/* Animated Visualizer Circle */}
        <div className="relative mb-5 flex items-center justify-center">
          {voiceRecorder.isRecording && (
            <>
              <div className="absolute h-28 w-28 animate-ping rounded-full bg-rose-500/20" />
              <div className="absolute h-36 w-36 animate-pulse rounded-full bg-rose-500/10" />
            </>
          )}

          <button
            onClick={voiceRecorder.isRecording ? handleStopRecording : handleStartRecording}
            className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
              voiceRecorder.isRecording
                ? 'scale-105 bg-rose-600 text-white shadow-rose-600/50 hover:bg-rose-700'
                : 'bg-gradient-to-tr from-rose-500 to-indigo-600 text-white shadow-rose-500/30 hover:scale-105'
            }`}
            title={voiceRecorder.isRecording ? "Yozishni to'xtatish" : 'Ovoz yozishni boshlash'}
          >
            {voiceRecorder.isRecording ? (
              <Square className="h-8 w-8 fill-current" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>
        </div>

        {/* Timer & Status */}
        <div className="mb-4">
          <div className="font-mono text-xl font-bold tracking-wider text-white">
            {formatSeconds(voiceRecorder.durationSeconds)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {voiceRecorder.isRecording ? (
              <span className="flex animate-pulse items-center justify-center gap-1.5 font-medium text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Diktofon yozmoqda... 3-4 gapda batafsil gapirib bering
              </span>
            ) : liveTranscript ? (
              <span className="font-medium text-emerald-400">
                ✓ Ovoz yozildi. Matnni tekshirib AIga yuboring
              </span>
            ) : (
              <span>Mikrofon tugmasini bosing va fikringizni yapon tilida erkin bayon qiling</span>
            )}
          </div>
        </div>

        {/* Recorded Audio Playback */}
        {voiceRecorder.recordedUrl && !voiceRecorder.isRecording && (
          <div className="mb-4 flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-800/60 p-2.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Volume2 className="h-4 w-4 text-rose-400" />
              Sizning yozilgan ovozingiz:
            </span>
            <audio src={voiceRecorder.recordedUrl} controls className="h-8 max-w-[200px]" />
          </div>
        )}

        {/* Live / Editable Transcript Area */}
        <div className="w-full text-left">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Siz gapirgan matn (Asl transkripsiya):
          </label>
          <div className="relative">
            <textarea
              value={liveTranscript}
              onChange={(e) => setLiveTranscript(e.target.value)}
              placeholder="Yozish tugmasini bosganingizda gaplaringiz shu yerda avtomatik paydo bo'ladi (yoki qo'lda ham yozishingiz mumkin)..."
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
            {liveTranscript && (
              <button
                onClick={() => setLiveTranscript('')}
                className="absolute right-2 top-2 rounded p-1 text-xs text-slate-500 hover:text-slate-300"
                title="Tozalash"
              >
                Tozalash
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !liveTranscript.trim() || voiceRecorder.isRecording}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <Sparkles className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'AI tahlil qilmoqda...' : 'AI ga Tahlilga Yuborish'}
          </button>

          {(liveTranscript || analysisResult) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              Qayta urinish
            </button>
          )}
        </div>

        {analysisError && (
          <div className="mt-4 w-full rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-left text-xs text-rose-400">
            ⚠️ {analysisError}
          </div>
        )}
      </div>

      {/* AI Analysis Result Showcase */}
      {analysisResult && (
        <div className="mt-8 space-y-6 duration-300 animate-in fade-in slide-in-from-bottom-4">
          {/* Header Score & Encouragement */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-rose-500/20">
                {analysisResult.accuracyScore}%
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Boshlang'ich ifoda aniqligi
                </div>
                <div className="text-sm font-medium text-slate-200">
                  {analysisResult.encouragement}
                </div>
              </div>
            </div>

            <button
              onClick={handlePlayPolishedTTS}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
                isPlayingTTS
                  ? 'animate-pulse bg-amber-500 text-slate-950'
                  : 'border border-rose-500/30 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
              }`}
            >
              <Volume2 className="h-4 w-4" />
              {isPlayingTTS ? "To'xtatish" : "To'g'ri talaffuzni tinglash"}
            </button>
          </div>

          {/* Polished Japanese Card with Furigana in Parentheses */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                  To'g'rilangan & Tabiiy Yaponcha Variant:
                </h3>
              </div>
              <button
                onClick={() => handleCopy(analysisResult.polishedJapanese)}
                className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-white"
                title="Nusxa olish"
              >
                {copiedText ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Nusxalandi</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Nusxa olish</span>
                  </>
                )}
              </button>
            </div>

            {/* Reading with Furigana in parentheses */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4 text-lg font-medium leading-relaxed tracking-wide text-white sm:text-xl">
              {analysisResult.readingWithFurigana}
            </div>

            {/* Clean Kanji representation */}
            <div className="mt-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Standart yozilishi: </span>
              {analysisResult.polishedJapanese}
            </div>

            {/* Uzbek Translation */}
            <div className="mt-4 border-t border-slate-800/80 pt-4">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                O'zbekcha to'liq tarjimasi:
              </span>
              <p className="text-sm font-medium text-rose-200/90 sm:text-base">
                {analysisResult.uzbekTranslation}
              </p>
            </div>
          </div>

          {/* Coach Advice / Additional Thoughts ("Qo'shimcha fikr") */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg">
            <div className="mb-3 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                AI Murabbiy Mulohazasi & Maslahati (Qo'shimcha fikr):
              </h3>
            </div>
            <div className="whitespace-pre-line rounded-xl border border-slate-800/60 bg-slate-950/50 p-4 text-sm leading-relaxed text-slate-300">
              {analysisResult.coachFeedback}
            </div>
          </div>

          {/* Grammar & Vocabulary Sections */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Grammar Points */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Asosiy Grammatik Qoidalar
                </h4>
              </div>
              <div className="space-y-3">
                {analysisResult.keyGrammarPoints.map((g, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs"
                  >
                    <div className="mb-1 text-sm font-bold text-rose-400">{g.structure}</div>
                    <div className="mb-1.5 text-slate-300">{g.meaningUz}</div>
                    {g.exampleReading && (
                      <div className="rounded border border-slate-800 bg-slate-900/80 p-2 font-mono text-[11px] text-slate-400">
                        💡 Misol: {g.exampleReading}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Vocabulary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Languages className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Foydali So'zlar & Lug'at
                </h4>
              </div>
              <div className="space-y-2.5">
                {analysisResult.suggestedVocab.map((v, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">
                        {v.kanji}{' '}
                        <span className="text-xs font-normal text-slate-400">({v.reading})</span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-300">{v.meaningUz}</div>
                    </div>

                    <button
                      onClick={() => handleSaveWordToFlashcard(v)}
                      disabled={addedWords[v.kanji]}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        addedWords[v.kanji]
                          ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                          : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {addedWords[v.kanji] ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Saqlandi
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 text-rose-400" /> Flashcard
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Steps / Re-practice */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
            <span className="text-xs text-slate-400">
              Ushbu to'g'rilangan variantni ovoz chiqarib 3 marta o'qing va talaffuzni
              mustahkamlang!
            </span>
            <button
              onClick={handleGenerateAiTopic}
              className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300"
            >
              Keyingi savolga o'tish <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonologuePage;
