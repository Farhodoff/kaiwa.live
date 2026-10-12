import { useRef, useState, useEffect, useCallback } from 'react';
import { playConversationChime } from '../utils/audioChime';

interface UseSpeechRecognitionOptions {
  language: 'en' | 'ja';
  isLiveSessionRef: React.MutableRefObject<boolean>;
  isProcessingRef: React.MutableRefObject<boolean>;
  isSpeaking: boolean;
  isSpeakingRef?: React.MutableRefObject<boolean>;
  isThinking: boolean;
  isMuted: boolean;
  onValidSpeech: (text: string) => void;
  onResumeListening: () => void;
}

export interface UseSpeechRecognitionReturn {
  recognitionRef: React.MutableRefObject<any>;
  isListening: boolean;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
  currentTranscript: string;
  setCurrentTranscript: React.Dispatch<React.SetStateAction<string>>;
  transcriptBufferRef: React.MutableRefObject<string>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  isSupported: boolean;
  audioVolume: number;
  startListening: () => void;
  commitSpeechNow: () => void;
}

/**
 * Checks if transcript ends with mid-sentence connective particle or unfinished conjunction
 * where the user is clearly mid-sentence and needs comfortable thinking time.
 */
export function isMidSentenceConjunction(text: string, lang: 'en' | 'ja'): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (lang === 'ja') {
    // Te-form, connective particles, conditionals, polite and casual connectors, hesitation markers & thinking fillers
    return /(て|で|から|ので|けど|けれど|けれども|が|たら|なら|ば|のに|し|とか|たり|と|に|を|は|ても|でも|たりして|かな|かしら|というか|じゃなくて|ですが|ですから|なので|だけど|てさ|でさ|ええと|えーと|あのー|あの|そのー|その|まあ|うーん|えっと|なんか|ほら|じゃあ|えー)$/.test(
      trimmed,
    );
  }

  // English: conjunctions, prepositions, or hesitation fillers at end of sentence
  return /\b(and|or|but|because|so|although|if|when|while|to|for|with|um|uh|like|well|you know|i mean|sort of|kind of)$/i.test(
    trimmed,
  );
}

/**
 * Checks if transcript ends with terminal punctuation or sentence-ending grammar pattern
 */
export function isSentenceTerminal(text: string, lang: 'en' | 'ja'): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (lang === 'ja') {
    return (
      /[。！？\n]$/.test(trimmed) ||
      /(です|ます|した|でした|ません|ね|よ|か|よね|ですよ|ですね|ましたね|ましたよ|ませんね|ませんでした|てください|てくださいね|てくれますか|てほしい|ましょう|たいです|なんです|わけです|はずです|つもりです|でしょうか|とおもいます|とおもいました|だ|だった|んだ)$/.test(
        trimmed,
      )
    );
  }

  return (
    /[.!?\n]$/.test(trimmed) || /\b(right|please|thank you|thanks|you know|so yeah)$/i.test(trimmed)
  );
}

export const useSpeechRecognition = ({
  language,
  isLiveSessionRef,
  isProcessingRef,
  isSpeaking,
  isSpeakingRef: externalSpeakingRef,
  isThinking,
  isMuted,
  onValidSpeech,
  onResumeListening,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn => {
  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);
  const isSilenceTimeoutRef = useRef<boolean>(false);

  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const audioVolumeRef = useRef<number>(0);
  const lastVolumeUpdateRef = useRef<number>(0);
  const lastReportedVolumeRef = useRef<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopMicrophoneStream = useCallback(() => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => {
          if (t.readyState === 'live') t.stop();
        });
      } catch {}
      mediaStreamRef.current = null;
    }
  }, []);

  const stopVolumeMeter = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    analyserRef.current = null;
    audioVolumeRef.current = 0;
    setAudioVolume((prev) => (prev === 0 ? prev : 0));
  }, []);

  const startVolumeMeter = useCallback((stream: MediaStream) => {
    try {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      analyserRef.current = null;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.4;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        // Keep real-time value in ref for silence & VAD checks
        audioVolumeRef.current = normalized;

        // Throttle React state updates to ~12-14fps (every 75ms) and only on significant volume shifts
        const now = Date.now();
        if (
          now - lastVolumeUpdateRef.current >= 75 &&
          (Math.abs(normalized - lastReportedVolumeRef.current) >= 5 ||
            (normalized === 0 && lastReportedVolumeRef.current !== 0))
        ) {
          lastVolumeUpdateRef.current = now;
          lastReportedVolumeRef.current = normalized;
          setAudioVolume(normalized);
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch {
      // Volume meter fallback
    }
  }, []);

  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Stable references for callbacks
  const localSpeakingRef = useRef(isSpeaking);
  const isSpeakingRef = externalSpeakingRef || localSpeakingRef;
  isSpeakingRef.current = isSpeaking;
  const isThinkingRef = useRef(isThinking);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
    if (isSpeaking) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      transcriptBufferRef.current = '';
      setCurrentTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setIsListening(false);
    }
  }, [isSpeaking, isSpeakingRef]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
    if (isThinking) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      transcriptBufferRef.current = '';
      setCurrentTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setIsListening(false);
    }
  }, [isThinking]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const onValidSpeechRef = useRef(onValidSpeech);
  const onResumeListeningRef = useRef(onResumeListening);
  useEffect(() => {
    onValidSpeechRef.current = onValidSpeech;
  }, [onValidSpeech]);
  useEffect(() => {
    onResumeListeningRef.current = onResumeListening;
  }, [onResumeListening]);

  const commitSpeechNow = useCallback(() => {
    if (isProcessingRef.current || isSpeakingRef.current || isThinkingRef.current) return;
    const text = transcriptBufferRef.current.trim();
    if (!text) return;

    playConversationChime('commit');
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    isSilenceTimeoutRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.debug('Recognition stop failed:', e);
      }
    }
  }, [isProcessingRef]);

  const startListening = useCallback(() => {
    if (
      !isLiveSessionRef.current ||
      isMutedRef.current ||
      isSpeakingRef.current ||
      isThinkingRef.current
    )
      return;

    // Reset processing flags to unblock microphone
    isProcessingRef.current = false;
    transcriptBufferRef.current = '';
    setCurrentTranscript('');
    setError(null);
    isSilenceTimeoutRef.current = false;
    lastSpeechTimeRef.current = Date.now();

    const startRecognitionInstance = () => {
      if (
        recognitionRef.current &&
        isLiveSessionRef.current &&
        !isSpeakingRef.current &&
        !isThinkingRef.current
      ) {
        try {
          recognitionRef.current.lang = languageRef.current === 'ja' ? 'ja-JP' : 'en-US';
          recognitionRef.current.start();
        } catch (e) {
          // Recognition might already be running
        }
      }
    };

    // Re-use active media stream if audio tracks are already live (prevents audio pops and echo)
    const existingStream = mediaStreamRef.current;
    const hasLiveTracks =
      existingStream &&
      existingStream.getTracks().some((t) => t.kind === 'audio' && t.readyState === 'live');

    if (hasLiveTracks && existingStream) {
      startVolumeMeter(existingStream);
      startRecognitionInstance();
      return;
    }

    // Ensure browser mic permission is requested with hardware Acoustic Echo Cancellation (AEC)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const audioConstraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      navigator.mediaDevices
        .getUserMedia(audioConstraints)
        .catch(() => navigator.mediaDevices.getUserMedia({ audio: true }))
        .then((stream) => {
          mediaStreamRef.current = stream;
          startVolumeMeter(stream);
          startRecognitionInstance();
        })
        .catch((err) => {
          console.warn('[useSpeechRecognition] getUserMedia error:', err);
          stopVolumeMeter();
          stopMicrophoneStream();
          setError(
            'Mikrofon ruxsati berilmadi. Iltimos brauzeringiz sozlamalaridan mikrofonga ruxsat bering.',
          );
        });
    } else if (recognitionRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
      try {
        recognitionRef.current.lang = languageRef.current === 'ja' ? 'ja-JP' : 'en-US';
        recognitionRef.current.start();
      } catch (e) {
        console.debug('Recognition start failed:', e);
      }
    }
  }, [isLiveSessionRef, isProcessingRef, startVolumeMeter, stopVolumeMeter, stopMicrophoneStream]);

  // Auto-resume audioContext when coming back to foreground
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError(
        'Brauzeringizda avtomatik ovoz tanish (Web Speech) mavjud emas. Matn kiritish orqali ham muloqotni davom ettirishingiz mumkin.',
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      if (isSpeakingRef.current || isThinkingRef.current) {
        try {
          recognition.abort();
        } catch {}
        setIsListening(false);
        stopVolumeMeter();
        return;
      }
      transcriptBufferRef.current = '';
      setCurrentTranscript('');
      speechStartTimeRef.current = Date.now();
      lastSpeechTimeRef.current = Date.now();
      setIsListening(true);
      setError(null);
      playConversationChime('listen_start');
    };

    recognition.onspeechstart = () => {
      if (isSpeakingRef.current || isThinkingRef.current) return;
      if (!speechStartTimeRef.current) {
        speechStartTimeRef.current = Date.now();
      }
      lastSpeechTimeRef.current = Date.now();
    };

    recognition.onsoundstart = () => {
      if (isSpeakingRef.current || isThinkingRef.current) return;
      if (!speechStartTimeRef.current) {
        speechStartTimeRef.current = Date.now();
      }
      lastSpeechTimeRef.current = Date.now();
    };

    recognition.onresult = (event: any) => {
      if (isMutedRef.current || isSpeakingRef.current || isThinkingRef.current) {
        return;
      }
      if (!speechStartTimeRef.current) {
        speechStartTimeRef.current = Date.now();
      }

      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptChunk + ' ';
        } else {
          interimTranscript += transcriptChunk;
        }
      }
      const cleanText = (finalTranscript + interimTranscript).replace(/\s+/g, ' ').trim();

      if (cleanText) {
        setCurrentTranscript(cleanText);
        transcriptBufferRef.current = cleanText;
        lastSpeechTimeRef.current = Date.now();
      }

      // COMFORTABLE ADAPTIVE SPEECH PAUSE TIMEOUT
      const userCustomDelay =
        typeof window !== 'undefined'
          ? parseInt(localStorage.getItem('speaking_coach_pause_delay') || '0', 10)
          : 0;
      const isTerminal = isSentenceTerminal(cleanText, languageRef.current);
      const isMidConjunction = isMidSentenceConjunction(cleanText, languageRef.current);

      // Adaptive Smart Silence Delay:
      // - Clearly complete terminal sentences: 1100ms (fast conversational turn)
      // - Mid-sentence clause / connective particle: 2400ms (comfortable thinking time)
      // - General neutral pause: 1700ms
      let silenceThreshold = 1700;
      if (userCustomDelay > 0) {
        silenceThreshold = userCustomDelay;
      } else if (isMidConjunction) {
        silenceThreshold = 2400;
      } else if (isTerminal) {
        silenceThreshold = 1100;
      }

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // Acoustic VAD check: if user is still vocalizing or breathing actively (volume > 18),
        // give an additional 600ms grace period to prevent cutting off mid-speech
        if (audioVolumeRef.current > 18) {
          silenceTimerRef.current = setTimeout(() => {
            if (
              isLiveSessionRef.current &&
              !isProcessingRef.current &&
              transcriptBufferRef.current.trim().length > 0
            ) {
              isSilenceTimeoutRef.current = true;
              try {
                recognition.stop();
              } catch (e) {
                console.debug('Recognition stop failed:', e);
              }
            }
          }, 600);
          return;
        }

        if (
          isLiveSessionRef.current &&
          !isProcessingRef.current &&
          transcriptBufferRef.current.trim().length > 0
        ) {
          isSilenceTimeoutRef.current = true;
          try {
            recognition.stop();
          } catch (e) {
            console.debug('Recognition stop failed:', e);
          }
        }
      }, silenceThreshold);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setError(
          'Mikrofon ruxsati berilmadi. Iltimos brauzeringiz sozlamalaridan mikrofonga ruxsat bering.',
        );
        setIsListening(false);
        stopVolumeMeter();
        stopMicrophoneStream();
      } else if (event.error === 'network') {
        console.warn('Speech recognition network timeout, checking reconnect...');
        setError('Nutqni aniqlash serveri bilan aloqa sekinlashdi. Qayta ulanmoqda...');
        setTimeout(() => {
          if (
            isLiveSessionRef.current &&
            !isSpeakingRef.current &&
            !isProcessingRef.current &&
            !isMutedRef.current
          ) {
            try {
              recognition.lang = languageRef.current === 'ja' ? 'ja-JP' : 'en-US';
              recognition.start();
              setError(null);
            } catch {}
          }
        }, 1200);
      } else if (event.error === 'audio-capture') {
        setError(
          'Mikrofondan ovoz olinmadi. Mikrofon ulanganini va boshqa dastur tomonidan band qilinmaganini tekshiring.',
        );
        setIsListening(false);
        stopVolumeMeter();
      } else if (event.error !== 'no-speech') {
        console.warn('Speech recognition status:', event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      const spokenText = transcriptBufferRef.current.trim();
      if (spokenText.length >= 1) {
        stopVolumeMeter();
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        isSilenceTimeoutRef.current = false;
        speechStartTimeRef.current = 0;
        lastSpeechTimeRef.current = 0;

        // Always clear buffers upon submission
        transcriptBufferRef.current = '';
        setCurrentTranscript('');

        if (
          isLiveSessionRef.current &&
          !isProcessingRef.current &&
          !isMutedRef.current &&
          !isSpeakingRef.current &&
          !isThinkingRef.current
        ) {
          onValidSpeechRef.current(spokenText);
        }
      } else if (
        isLiveSessionRef.current &&
        !isProcessingRef.current &&
        !isMutedRef.current &&
        !isSpeakingRef.current &&
        !isThinkingRef.current
      ) {
        // Continuous listening auto-recovery: keep listening active with slight backoff
        setTimeout(() => {
          if (
            isLiveSessionRef.current &&
            !isProcessingRef.current &&
            !isMutedRef.current &&
            !isSpeakingRef.current &&
            !isThinkingRef.current
          ) {
            try {
              recognition.lang = languageRef.current === 'ja' ? 'ja-JP' : 'en-US';
              recognition.start();
              setIsListening(true);
            } catch (e) {
              // Recognition may already be starting or active
            }
          }
        }, 150);
      } else {
        stopVolumeMeter();
      }
    };

    return () => {
      stopVolumeMeter();
      stopMicrophoneStream();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.stop();
      } catch (e) {
        console.debug('Cleanup recognition stop failed:', e);
      }
    };
  }, [stopVolumeMeter, stopMicrophoneStream]);

  return {
    recognitionRef,
    isListening,
    setIsListening,
    currentTranscript,
    setCurrentTranscript,
    transcriptBufferRef,
    error,
    setError,
    isSupported,
    audioVolume,
    startListening,
    commitSpeechNow,
  };
};
