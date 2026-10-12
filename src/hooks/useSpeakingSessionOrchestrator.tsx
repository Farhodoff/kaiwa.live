import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  streamCoachDialogue,
  converseWithCoachStructured,
  CoachStructuredResponse,
  CoachVocabularyItem,
  analyzeSpeakingSession,
  SessionAnalysisReport,
  translateTextToUzbek,
  parseMicroErrors,
  extractSpeechAudioText,
} from '../utils/ai';
import { evaluateScenarioSession } from '../utils/ai/aiScenarioEval';
import { ScenarioService } from '../services/ScenarioService';
import { ErrorVaultService } from '../services/ErrorVaultService';
import { MasteryEngine } from '../services/MasteryEngine';
import { SpeakingVocabularyService } from '../services/SpeakingVocabularyService';
import { AudioStorageService } from '../services/AudioStorageService';
import { ActivityLoggingService } from '../services/ActivityLoggingService';
import { HistoryService } from '../services/HistoryService';
import { getOrEnsureSpeakingDeck } from '../utils/subjectResolver';
import { playConversationChime } from '../utils/audioChime';
import { isAcousticEcho } from '../utils/echoFilter';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useTTS, fetchTTSAudioBlob } from './useTTS';
import { useVoiceRecorder } from './useVoiceRecorder';
import { toast } from './use-toast';
import { supabase } from '../lib/supabase';
import {
  CoachPersona,
  CoachChatMessage,
  PERSONAS_BY_LANG,
} from '../components/speaking/speakingTypes';
import { ConversationScenario, ScenarioSessionResult } from '../components/speaking/scenarioTypes';
import { ErrorTag } from '../components/speaking/RealtimeVoiceOverlay';
import { getCoachInitialGreeting } from '../components/speaking/speakingConstants';

export interface UseSpeakingSessionOrchestratorOptions {
  language?: 'en' | 'ja';
  persona: CoachPersona;
  targetJlptLevel?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  activeScenario: ConversationScenario | null;
  user: any;
  subjects: any[];
  addSubject: any;
  flashcards: any[];
  addFlashcardsBatch: any;
  onScenarioEvaluated?: (result: ScenarioSessionResult) => void;
  onSessionAnalyzed?: (report: SessionAnalysisReport) => void;
}

export function useSpeakingSessionOrchestrator({
  language = 'ja',
  persona,
  targetJlptLevel = 'N5',
  activeScenario,
  user,
  subjects,
  addSubject,
  flashcards,
  addFlashcardsBatch,
  onScenarioEvaluated,
  onSessionAnalyzed,
}: UseSpeakingSessionOrchestratorOptions) {
  const navigate = useNavigate();
  const voiceRecorder = useVoiceRecorder();

  const [isLiveSession, setIsLiveSession] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [chatHistory, setChatHistory] = useState<CoachChatMessage[]>([]);
  const [liveErrors, setLiveErrors] = useState<ErrorTag[]>([]);

  const activeScenarioRef = useRef(activeScenario);
  const isProcessingRef = useRef(false);
  const isLiveSessionRef = useRef(isLiveSession);
  const chatHistoryRef = useRef<CoachChatMessage[]>([]);
  const languageRef = useRef(language);
  const personaRef = useRef(persona);
  const targetJlptLevelRef = useRef(targetJlptLevel);
  const isSpeakingRef = useRef(isSpeaking);
  const lastCoachSpokenTextRef = useRef<string>('');
  const streamAbortControllerRef = useRef<AbortController | null>(null);
  const startListeningRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    activeScenarioRef.current = activeScenario;
  }, [activeScenario]);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    languageRef.current = language;
    personaRef.current = persona;
    targetJlptLevelRef.current = targetJlptLevel;
  }, [language, persona, targetJlptLevel]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isLiveSessionRef.current = isLiveSession;
  }, [isLiveSession]);

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isLiveSession) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveSession]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSpeakStart = useCallback(() => {
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    transcriptBufferRef.current = '';
    setCurrentTranscript('');
  }, []);

  const handleSpeakEnd = useCallback(() => {
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    isProcessingRef.current = false;
  }, []);

  const {
    speakText,
    stopSpeaking,
    unlockAudio,
    isPreparingAudio,
    enqueueStreamSentence,
    endStreamPlayback,
    speechSpeed,
    setSpeechSpeed,
  } = useTTS({
    language,
    isLiveSessionRef,
    isProcessingRef,
    onSpeakStart: handleSpeakStart,
    onSpeakEnd: handleSpeakEnd,
  });

  // Pre-cache active greeting
  useEffect(() => {
    if (!activeScenario) {
      const activeGreeting = getCoachInitialGreeting(language, persona);
      if (activeGreeting) {
        fetchTTSAudioBlob(activeGreeting, language)?.catch?.(() => {});
      }
    }
  }, [language, persona, activeScenario]);

  // Dynamically calibrate speech tempo based on Persona & JLPT Target Level
  useEffect(() => {
    try {
      const manualSpeed =
        typeof window !== 'undefined' ? localStorage.getItem('speaking_coach_manual_speed') : null;
      if (manualSpeed) return;

      let baseline = 0.95;
      if (persona === 'roast') {
        baseline = 1.05; // Sharp, brisk drill master tempo
      } else if (persona === 'gentle') {
        baseline = 0.85; // Relaxed, patient cadence
      } else if (persona === 'ielts' || persona === 'interview') {
        baseline = 0.95; // Balanced, professional cadence
      } else if (persona === 'travel') {
        baseline = 0.9; // Clear, friendly cadence
      } else if (persona === 'casual') {
        baseline = 1.0; // Everyday natural speed
      }

      // Gentle easing for beginner JLPT levels (N5/N4) so mora sounds are distinct
      if (targetJlptLevel === 'N5' && baseline > 0.88) {
        baseline = 0.88;
      } else if (targetJlptLevel === 'N4' && baseline > 0.92) {
        baseline = 0.92;
      }

      setSpeechSpeed(baseline);
    } catch {}
  }, [persona, targetJlptLevel, setSpeechSpeed]);

  const handleSendUserText = useCallback(
    async (text: string) => {
      const cleanText = (text || '').trim();
      if (!cleanText || cleanText.length < 2) return;

      const lastCoachText =
        lastCoachSpokenTextRef.current ||
        [...chatHistoryRef.current].reverse().find((m) => m.role === 'assistant')?.content ||
        '';
      if (isAcousticEcho(cleanText, lastCoachText)) {
        console.warn('[SpeakingCoach] Discarded acoustic speaker echo loopback:', cleanText);
        isProcessingRef.current = false;
        setIsThinking(false);
        setCurrentTranscript('');
        transcriptBufferRef.current = '';
        return;
      }

      isProcessingRef.current = true;
      setIsThinking(true);
      setError(null);

      stopSpeaking();
      setIsSpeaking(false);

      if (streamAbortControllerRef.current) {
        streamAbortControllerRef.current.abort();
        streamAbortControllerRef.current = null;
      }
      const abortController = new AbortController();
      streamAbortControllerRef.current = abortController;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsg: CoachChatMessage = { role: 'user', content: cleanText, timestamp: timeStr };
      const updatedHistory = [...chatHistoryRef.current, userMsg];

      setChatHistory(updatedHistory);
      chatHistoryRef.current = updatedHistory;

      try {
        let structured: CoachStructuredResponse;
        let streamedSentences = 0;
        let accumulatedSpeech = '';

        const scenarioDiff = activeScenarioRef.current?.difficulty?.toUpperCase();
        const effectiveDialogueLevel = (
          scenarioDiff && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(scenarioDiff)
            ? scenarioDiff
            : targetJlptLevelRef.current || 'N5'
        ) as 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

        try {
          structured = await streamCoachDialogue(
            cleanText,
            updatedHistory.map((h) => ({ role: h.role, content: h.content })),
            languageRef.current,
            personaRef.current,
            activeScenarioRef.current,
            (sentence, index) => {
              if (abortController.signal.aborted) return;
              streamedSentences++;
              accumulatedSpeech += (accumulatedSpeech ? ' ' : '') + sentence;
              lastCoachSpokenTextRef.current = accumulatedSpeech;
              if (index === 0) {
                setIsThinking(false);
                const liveAiMsg: CoachChatMessage = {
                  role: 'assistant',
                  content: sentence,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                };
                setChatHistory((prev) => {
                  const next = [...prev, liveAiMsg];
                  chatHistoryRef.current = next;
                  return next;
                });
              } else {
                setChatHistory((prev) => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  if (lastIdx >= 0 && copy[lastIdx].role === 'assistant') {
                    copy[lastIdx] = { ...copy[lastIdx], content: accumulatedSpeech };
                  }
                  chatHistoryRef.current = copy;
                  return copy;
                });
              }
              enqueueStreamSentence(sentence);
            },
            abortController.signal,
            effectiveDialogueLevel,
          );
          endStreamPlayback();
        } catch (streamErr: any) {
          if (abortController.signal.aborted || streamErr?.name === 'AbortError') {
            return;
          }
          console.warn(
            '[SpeakingCoach] Streaming dialogue failed, fallback to non-streaming:',
            streamErr,
          );
          stopSpeaking();
          structured = await converseWithCoachStructured(
            cleanText,
            updatedHistory.map((h) => ({ role: h.role, content: h.content })),
            languageRef.current,
            personaRef.current,
            undefined,
            activeScenarioRef.current,
            effectiveDialogueLevel,
          );
        }

        if (abortController.signal.aborted) {
          return;
        }

        let cleanReply = (structured.reply || '').trim();
        if (
          cleanReply.startsWith('{') &&
          (cleanReply.includes('"reply"') || cleanReply.includes('"language"'))
        ) {
          try {
            const parsed = JSON.parse(cleanReply);
            if (parsed && parsed.reply && typeof parsed.reply === 'string') {
              cleanReply = parsed.reply.trim();
            }
          } catch {
            const m = cleanReply.match(
              /"(?:reply|message|content|text)"\s*:\s*"((?:[^"\\]|\\.)*)"/i,
            );
            if (m) {
              cleanReply = m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
            }
          }
        }
        if (cleanReply.startsWith('{') && cleanReply.endsWith('}')) {
          cleanReply =
            languageRef.current === 'ja'
              ? 'はい、よく分かりました！続けて日本語でお話ししましょう。'
              : "Understood! Let's continue speaking practice.";
        }

        const aiMsg: CoachChatMessage = {
          role: 'assistant',
          content: cleanReply,
          romaji: structured.romaji,
          ttsText: structured.ttsText,
          correction: structured.correction,
          vocabulary: structured.vocabulary,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        if (
          structured.correction &&
          (structured.correction.hasError ||
            Boolean(
              structured.correction.corrected && structured.correction.corrected.trim().length > 0,
            )) &&
          structured.correction.corrected
        ) {
          const errorTag: ErrorTag = {
            id: Math.random().toString(36).substring(2, 9),
            type: 'grammar',
            originalText: structured.correction?.original || cleanText,
            correction: structured.correction?.corrected || '',
            explanation: structured.correction?.explanation || '',
          };
          setLiveErrors((prev) => [errorTag, ...prev].slice(0, 10));

          ErrorVaultService.logErrors([
            {
              verbatim: structured.correction.original || cleanText,
              correction: structured.correction.corrected,
              explanation: structured.correction.explanation || '',
              category: 'grammar',
              language: languageRef.current,
            },
          ]);

          const activeUserId = user?.id || 'default-user';
          MasteryEngine.recordEvidence(activeUserId, languageRef.current, {
            id: `ev_spk_err_${Date.now()}`,
            skill: 'speaking',
            timestamp: new Date().toISOString(),
            score: 40,
            activityType: 'speaking',
            details: `Speaking error corrected: ${structured.correction.corrected}`,
          });
        } else {
          const extractedErrs = parseMicroErrors(structured.rawText || structured.reply);
          if (extractedErrs.length > 0) {
            setLiveErrors((prev) => [...extractedErrs, ...prev].slice(0, 10));
          } else {
            const activeUserId = user?.id || 'default-user';
            MasteryEngine.recordEvidence(activeUserId, languageRef.current, {
              id: `ev_spk_turn_${Date.now()}`,
              skill: 'speaking',
              timestamp: new Date().toISOString(),
              score: 85,
              activityType: 'speaking',
              details: 'Fluent speaking turn without major grammatical errors',
            });
          }
        }

        if (streamedSentences === 0) {
          setChatHistory((prev) => [...prev, aiMsg]);
          chatHistoryRef.current = [...chatHistoryRef.current, aiMsg];
          const speechText =
            structured.ttsText ||
            (structured.vocabulary && structured.vocabulary.length > 0
              ? cleanReply.replace(/\b(?:Word|Meaning|Reading|Example):\s*/gi, '')
              : cleanReply);
          const cleanSpeech = extractSpeechAudioText(speechText);
          lastCoachSpokenTextRef.current = cleanSpeech;
          await speakText(cleanSpeech);
        } else {
          setChatHistory((prev) => {
            const copy = [...prev];
            const lastIdx = copy.length - 1;
            if (lastIdx >= 0 && copy[lastIdx].role === 'assistant') {
              copy[lastIdx] = {
                ...copy[lastIdx],
                romaji: structured.romaji,
                ttsText: structured.ttsText,
                correction: structured.correction,
                vocabulary: structured.vocabulary,
              };
            }
            chatHistoryRef.current = copy;
            return copy;
          });
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || abortController.signal.aborted) {
          return;
        }
        console.error('[SpeakingCoach] Dialogue error:', err);
        setError('Xatolik yuz berdi. Iltimos qaytadan urinib ko‘ring.');
      } finally {
        setIsThinking(false);
        isProcessingRef.current = false;
        setCurrentTranscript('');
        transcriptBufferRef.current = '';
      }
    },
    [speakText, stopSpeaking, enqueueStreamSentence, endStreamPlayback, user],
  );

  const {
    recognitionRef,
    isListening,
    currentTranscript,
    setCurrentTranscript,
    transcriptBufferRef,
    error,
    setError,
    isSupported,
    audioVolume,
    startListening,
    commitSpeechNow,
  } = useSpeechRecognition({
    language,
    isLiveSessionRef,
    isProcessingRef,
    isSpeaking,
    isSpeakingRef,
    isThinking,
    isMuted,
    onValidSpeech: (spokenText) => {
      handleSendUserText(spokenText);
    },
    onResumeListening: () => {},
  });

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const handleBargeIn = useCallback(() => {
    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
      streamAbortControllerRef.current = null;
    }
    if (isSpeaking) {
      playConversationChime('barge_in');
      stopSpeaking();
      setIsSpeaking(false);
      isProcessingRef.current = false;
      setTimeout(() => {
        startListening();
      }, 100);
    }
  }, [isSpeaking, stopSpeaking, startListening]);

  const toggleMic = useCallback(() => {
    unlockAudio();
    if (isSpeaking) {
      handleBargeIn();
      return;
    }
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    } else {
      startListening();
    }
  }, [unlockAudio, isSpeaking, handleBargeIn, isListening, startListening]);

  const handleAddVocabToFlashcards = async (vocab: CoachVocabularyItem): Promise<boolean> => {
    try {
      const isJa =
        language === 'ja' || /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(vocab.word);
      const activeLang = isJa ? 'ja' : 'en';

      let effectiveUserId = user?.id;
      if (!effectiveUserId || effectiveUserId === 'local_user' || effectiveUserId === 'guest') {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user?.id) effectiveUserId = data.session.user.id;
        } catch {}
      }
      const userId = effectiveUserId || 'local_user';
      const personaName = PERSONAS_BY_LANG[activeLang]?.[persona]?.name;
      const scenarioName = activeScenario
        ? activeScenario.title_uz || activeScenario.title_en || activeScenario.title_ja
        : undefined;
      await SpeakingVocabularyService.saveVocabulary(
        userId,
        vocab,
        activeLang,
        personaName || scenarioName || 'AI Speaking Coach',
      );

      const targetSubjectId = await getOrEnsureSpeakingDeck(
        subjects,
        addSubject,
        isJa ? 'ja' : 'en',
      );
      const targetDeckName = isJa ? "🎙️ AI Speaking Lug'atlari" : '🎙️ AI Speaking Vocabulary';

      let uzbekMeaning = '';
      let englishMeaning = '';
      const raw = (vocab.meaning || '').trim();
      const parenMatch = raw.match(/^(.*?)\s*[([](.*)[)\]]$/);
      const bulletMatch = raw.match(/^(.*?)\s*[•|/]\s*(.*)$/);

      if (parenMatch) {
        uzbekMeaning = parenMatch[1].trim();
        englishMeaning = parenMatch[2].trim();
      } else if (bulletMatch) {
        uzbekMeaning = bulletMatch[1].trim();
        englishMeaning = bulletMatch[2].trim();
      } else if (isJa) {
        const isPrimarilyEnglish = /^[a-zA-Z\s/,\-–.?!'"]+$/.test(raw);
        if (isPrimarilyEnglish) {
          englishMeaning = raw;
          try {
            uzbekMeaning = await translateTextToUzbek(raw);
          } catch {
            uzbekMeaning = raw;
          }
        } else {
          uzbekMeaning = raw;
        }
      } else {
        englishMeaning = raw;
      }

      const front = isJa
        ? vocab.reading
          ? `${vocab.word}\n【${vocab.reading}】`
          : vocab.word
        : vocab.word;

      let back = '';
      if (isJa) {
        if (uzbekMeaning && englishMeaning) {
          back = `📌 O'zbekcha: ${uzbekMeaning}\n🌐 English: ${englishMeaning}`;
        } else if (uzbekMeaning) {
          back = `📌 Ma'nosi: ${uzbekMeaning}`;
        } else {
          back = `📌 Ma'nosi: ${vocab.meaning}`;
        }
      } else {
        back = `📌 Ma'nosi: ${vocab.meaning}`;
      }

      if (vocab.example && vocab.example.trim()) {
        back += `\n\n💬 Misol: ${vocab.example.trim()}`;
      }

      const isAlreadyInDeck = flashcards?.some(
        (f: any) => f.subjectId === targetSubjectId && f.front.includes(vocab.word.trim()),
      );

      if (!isAlreadyInDeck) {
        await addFlashcardsBatch([
          {
            front,
            back,
            subjectId: targetSubjectId || undefined,
          },
        ]);
      }

      toast({
        title: '🎴 Fleshkartaga Saqlandi!',
        description: `"${vocab.word}" so'zi alohida "${targetDeckName}" albomiga muvaffaqiyatli saqlandi.`,
        action: (
          <button
            type="button"
            onClick={() => navigate(targetSubjectId ? `/decks?study=${targetSubjectId}` : '/decks')}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            Fleshkartani Ochish
          </button>
        ) as any,
      });
      return true;
    } catch (err) {
      console.error('handleAddVocabToFlashcards error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: "So'zni saqlashda xatolik yuz berdi.",
      });
      return false;
    }
  };

  const handleTranslateMessage = async (idx: number, optContent?: string) => {
    const targetMsg = chatHistory[idx];
    const textToTranslate = optContent || targetMsg?.content;
    if (!textToTranslate) return;

    setChatHistory((prev) => prev.map((m, i) => (i === idx ? { ...m, isTranslating: true } : m)));
    try {
      const trans = await translateTextToUzbek(textToTranslate);
      setChatHistory((prev) =>
        prev.map((m, i) =>
          i === idx ? { ...m, translation: trans, showTranslation: true, isTranslating: false } : m,
        ),
      );
    } catch (err) {
      console.error('Translation failed:', err);
      setChatHistory((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, isTranslating: false } : m)),
      );
    }
  };

  const handleResetChat = useCallback(() => {
    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
      streamAbortControllerRef.current = null;
    }
    stopSpeaking();
    setIsSpeaking(false);
    setIsThinking(false);
    isProcessingRef.current = false;
    setChatHistory([]);
    chatHistoryRef.current = [];
    setSessionSeconds(0);
    setCurrentTranscript('');
    transcriptBufferRef.current = '';
    setLiveErrors([]);
    setError(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
  }, [stopSpeaking]);

  const startSession = useCallback(
    (topicTitle?: unknown) => {
      unlockAudio();
      setIsLiveSession(true);
      isLiveSessionRef.current = true;
      setCurrentTranscript('');
      setError(null);

      if (isSpeakingRef.current) {
        return;
      }

      const currentScenario = activeScenarioRef.current;
      const cleanTopic =
        typeof topicTitle === 'string' &&
        topicTitle.trim().length > 0 &&
        !topicTitle.includes('[object')
          ? topicTitle.trim()
          : undefined;

      let greeting = getCoachInitialGreeting(language, persona);
      if (currentScenario) {
        greeting = currentScenario.opening_line_ja || 'こんにちは！会話を始めましょう。';
      } else if (cleanTopic) {
        greeting = `こんにちは！「${cleanTopic}」ですね。準備ができたら話しかけてください！`;
      }

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const initHistory: CoachChatMessage[] = [
        { role: 'assistant', content: greeting, timestamp: timeStr },
      ];

      setChatHistory(initHistory);
      chatHistoryRef.current = initHistory;

      const speechAudio = extractSpeechAudioText(greeting);
      lastCoachSpokenTextRef.current = speechAudio;
      speakText(speechAudio);
    },
    [language, persona, unlockAudio, speakText],
  );

  const endSession = useCallback(async () => {
    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
      streamAbortControllerRef.current = null;
    }
    const historyToAnalyze = [...chatHistoryRef.current];
    const durSecs = sessionSeconds;

    const audioBlob = await voiceRecorder.stopRecording();

    setIsLiveSession(false);
    isLiveSessionRef.current = false;
    isProcessingRef.current = false;
    setIsSpeaking(false);
    setIsThinking(false);
    setCurrentTranscript('');
    transcriptBufferRef.current = '';
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    stopSpeaking();

    const sessionUuid: string =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(16).padStart(8, '0')}-0000-4000-8000-000000000000`;

    let uploadedAudioPath: string | undefined;
    if (audioBlob && audioBlob.size > 0 && user?.id) {
      try {
        const uploadResult = await AudioStorageService.uploadSpeakingAudio(
          user.id,
          sessionUuid || `rec_${Date.now()}`,
          audioBlob,
        );
        if (uploadResult) {
          uploadedAudioPath = uploadResult;
        }
      } catch (storageErr) {
        console.warn('[SpeakingCoach] Audio upload skipped (non-blocking):', storageErr);
      }
    }

    const userSpoke = historyToAnalyze.some((h) => h.role === 'user');
    if (userSpoke) {
      if (activeScenarioRef.current) {
        try {
          const evalResult = await evaluateScenarioSession({
            scenario: activeScenarioRef.current,
            chatHistory: historyToAnalyze.map((h) => ({ role: h.role, content: h.content })),
            durationSeconds: durSecs,
            recordedUrl: voiceRecorder.recordedUrl,
          });

          evalResult.transcript = historyToAnalyze.map((h) => ({
            role: h.role,
            content: h.content,
            timestamp: h.timestamp,
            translation: h.translation,
          }));
          evalResult.audio_path = uploadedAudioPath;
          evalResult.audio_url = uploadedAudioPath;
          if (sessionUuid) {
            evalResult.id = sessionUuid;
          }

          if (onScenarioEvaluated) {
            onScenarioEvaluated(evalResult);
          }
          await ScenarioService.saveSessionResult(evalResult, user?.id);

          try {
            await HistoryService.saveSpeakingSession({
              language: languageRef.current,
              persona: evalResult.scenario_title || 'Ssenariy suhbati',
              durationSeconds: durSecs,
              fluencyScore: evalResult.fluency_score || 7.0,
              pronunciationScore: evalResult.pronunciation_score || 7.0,
              transcript: JSON.stringify(chatHistoryRef.current),
              feedback: JSON.stringify(evalResult),
            });
          } catch (e) {
            console.warn('[SpeakingOrchestrator] Save speaking session history warning:', e);
          }

          const { xp: scenarioXp, badge: scenarioBadge } =
            ActivityLoggingService.calculateSpeakingXP(durSecs, evalResult.fluency_score);
          await ActivityLoggingService.logActivity({
            id: sessionUuid,
            activityType: 'speaking',
            activityTitle: `AI Coach: ${evalResult.scenario_title || 'Ssenariy suhbati'}`,
            durationMinutes: Math.max(1, Math.round(durSecs / 60)),
            itemsCount: 1,
            xpEarned: scenarioXp,
            metadata: {
              scenarioId: evalResult.scenario_id,
              fluencyScore: evalResult.fluency_score,
              overallScore: evalResult.overall_score,
              badge: scenarioBadge,
            },
          });
        } catch (err) {
          console.error('Scenario evaluation error:', err);
        }
      } else {
        try {
          const report = await analyzeSpeakingSession(
            historyToAnalyze.map((h) => ({ role: h.role, content: h.content })),
            languageRef.current,
            personaRef.current,
          );

          if (report.grammar_corrections && report.grammar_corrections.length > 0) {
            ErrorVaultService.logErrors(
              report.grammar_corrections.map((c) => ({
                verbatim: c.original,
                correction: c.corrected,
                explanation: c.explanation || '',
                category: 'grammar',
                language: languageRef.current,
              })),
            );
          }

          if (onSessionAnalyzed) {
            onSessionAnalyzed(report);
          }

          try {
            await HistoryService.saveSpeakingSession({
              language: languageRef.current,
              persona:
                PERSONAS_BY_LANG[languageRef.current]?.[personaRef.current]?.name ||
                personaRef.current,
              durationSeconds: durSecs,
              fluencyScore: report.fluency_score || report.overall_score || 7.0,
              pronunciationScore: report.pronunciation_score || 7.0,
              transcript: JSON.stringify(chatHistoryRef.current),
              feedback: JSON.stringify(report),
            });
          } catch (e) {
            console.warn('[SpeakingOrchestrator] Save speaking session history warning:', e);
          }

          const { xp: sessionXp, badge: sessionBadge } = ActivityLoggingService.calculateSpeakingXP(
            durSecs,
            report.overall_score * 10,
          );
          await ActivityLoggingService.logActivity({
            id: sessionUuid,
            activityType: 'speaking',
            activityTitle: `AI Coach: ${PERSONAS_BY_LANG[languageRef.current]?.[personaRef.current]?.name || 'Suhbat'}`,
            durationMinutes: Math.max(1, Math.round(durSecs / 60)),
            itemsCount: 1,
            xpEarned: sessionXp,
            metadata: {
              overallBand: report.overall_score,
              badge: sessionBadge,
              correctionsCount: report.grammar_corrections?.length || 0,
            },
          });
        } catch (err) {
          console.error('Session analysis error:', err);
        }
      }
    }
  }, [sessionSeconds, user, voiceRecorder, onScenarioEvaluated, onSessionAnalyzed, stopSpeaking]);

  const toggleSession = useCallback(() => {
    if (isLiveSession) {
      endSession();
    } else {
      startSession();
    }
  }, [isLiveSession, endSession, startSession]);

  return {
    isLiveSession,
    setIsLiveSession,
    isSpeaking,
    isThinking,
    isListening,
    isMuted,
    setIsMuted,
    sessionSeconds,
    setSessionSeconds,
    chatHistory,
    setChatHistory,
    liveErrors,
    setLiveErrors,
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
    endSession,
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
  };
}
