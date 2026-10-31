import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeakingSessionOrchestrator } from '../useSpeakingSessionOrchestrator';
import { SpeakingConversationHistoryService } from '../../services/SpeakingConversationHistoryService';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../utils/ai', () => ({
  streamCoachDialogue: vi.fn(async (_text, _history, _lang, _persona, _scenario, onSentence) => {
    onSentence('はい、よく分かりました！', 0);
    return {
      reply: 'はい、よく分かりました！',
      corrected: undefined,
      explanation_uz: undefined,
      new_words: [],
    };
  }),
  converseWithCoachStructured: vi.fn(),
  analyzeSpeakingSession: vi.fn(async () => ({
    overall_score: 85,
    grammar_corrections: [],
    vocabulary_feedback: [],
    fluency_score: 80,
    pronunciation_score: 85,
  })),
  translateTextToUzbek: vi.fn(),
  parseMicroErrors: vi.fn(() => []),
  extractSpeechAudioText: vi.fn((t) => t),
}));

let mockOnSpeakStart: (() => void) | null = null;
let mockOnSpeakEnd: (() => void) | null = null;

vi.mock('../useTTS', () => ({
  useTTS: ({ onSpeakStart, onSpeakEnd }: any) => {
    mockOnSpeakStart = onSpeakStart;
    mockOnSpeakEnd = onSpeakEnd;
    return {
      speakText: vi.fn(async () => {
        onSpeakStart();
      }),
      stopSpeaking: vi.fn(() => {
        onSpeakEnd();
      }),
      unlockAudio: vi.fn(),
      isPreparingAudio: false,
      enqueueStreamSentence: vi.fn(),
      endStreamPlayback: vi.fn(),
      speechSpeed: 1,
      setSpeechSpeed: vi.fn(),
      ttsAudioVolume: 70,
    };
  },
  fetchTTSAudioBlob: vi.fn().mockResolvedValue(null),
}));

let mockOnValidSpeech: ((text: string) => void) | null = null;
let mockOnBargeIn: (() => void) | null = null;

vi.mock('../useSpeechRecognition', () => ({
  useSpeechRecognition: ({ onValidSpeech, onBargeIn }: any) => {
    mockOnValidSpeech = onValidSpeech;
    mockOnBargeIn = onBargeIn;
    return {
      recognitionRef: { current: null },
      isListening: true,
      currentTranscript: '',
      setCurrentTranscript: vi.fn(),
      transcriptBufferRef: { current: '' },
      error: null,
      setError: vi.fn(),
      isSupported: true,
      audioVolume: 30,
      startListening: vi.fn(),
      commitSpeechNow: vi.fn(),
    };
  },
}));

vi.mock('../useVoiceRecorder', () => ({
  useVoiceRecorder: () => ({
    isRecording: false,
    recordedUrl: null,
    durationSeconds: 0,
    isPlaying: false,
    audioProgress: 0,
    startRecording: vi.fn(),
    stopRecording: vi.fn().mockResolvedValue(null),
    playRecorded: vi.fn(),
    pauseRecorded: vi.fn(),
  }),
}));

describe('Speaking Coach Hands-Free 5-Turn Real-Time Simulation', () => {
  const defaultProps = {
    language: 'ja' as const,
    persona: 'casual' as const,
    activeScenario: null,
    user: { id: 'test-user', email: 'user@example.com' },
    subjects: [],
    addSubject: vi.fn(),
    flashcards: [],
    addFlashcardsBatch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs 5 consecutive hands-free dialogue turns, barge-in interruption, and saves history upon completion', async () => {
    const { result } = renderHook(() => useSpeakingSessionOrchestrator(defaultProps));

    // Step 1: User clicks Orb ONCE to initiate session
    act(() => {
      result.current.startSession();
    });

    expect(result.current.isLiveSession).toBe(true);
    // Sensei starts in AI_SPEAKING with Japanese greeting
    expect(result.current.chatHistory.length).toBe(1);
    expect(result.current.chatHistory[0].role).toBe('assistant');
    expect(result.current.isSpeaking).toBe(true);

    // Audio finish triggers turn to LISTENING automatically
    act(() => {
      mockOnSpeakEnd?.();
    });
    expect(result.current.isSpeaking).toBe(false);

    // Turn 1: User speaks "こんにちは、元気ですか？"
    await act(async () => {
      await mockOnValidSpeech?.('こんにちは、元気ですか？');
    });
    expect(result.current.chatHistory.length).toBe(3); // Greeting + User 1 + AI 1

    act(() => {
      mockOnSpeakEnd?.();
    });
    expect(result.current.isSpeaking).toBe(false);

    // Turn 2: User speaks "今日の天気はどうですか？"
    await act(async () => {
      await mockOnValidSpeech?.('今日の天気はどうですか？');
    });
    expect(result.current.chatHistory.length).toBe(5); // + User 2 + AI 2

    act(() => {
      mockOnSpeakEnd?.();
    });

    // Turn 3: User speaks "週末に旅行に行きたいです。"
    await act(async () => {
      await mockOnValidSpeech?.('週末に旅行に行きたいです。');
    });
    expect(result.current.chatHistory.length).toBe(7); // + User 3 + AI 3

    act(() => {
      mockOnSpeakEnd?.();
    });

    // Turn 4: User speaks "京都のおすすめはどこですか？"
    await act(async () => {
      await mockOnValidSpeech?.('京都のおすすめはどこですか？');
    });
    expect(result.current.chatHistory.length).toBe(9); // + User 4 + AI 4

    act(() => {
      mockOnSpeakEnd?.();
    });
    expect(result.current.isSpeaking).toBe(false);

    // Turn 5: User speaks, coach begins replying (AI_SPEAKING)
    await act(async () => {
      await mockOnValidSpeech?.('清水寺はどうやって行きますか？');
    });
    expect(result.current.chatHistory.length).toBe(11);

    // Now while Coach is actively speaking (AI_SPEAKING), User triggers BARGE-IN!
    act(() => {
      mockOnSpeakStart?.();
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      mockOnBargeIn?.();
    });
    // Coach speech is immediately silenced! State transitions back to LISTENING
    expect(result.current.isSpeaking).toBe(false);

    // Step 2: User ends session
    await act(async () => {
      await result.current.endSession();
    });

    expect(result.current.isLiveSession).toBe(false);
    expect(result.current.isSpeaking).toBe(false);

    // Verify history service save format
    const saved = SpeakingConversationHistoryService.saveSession({
      durationSeconds: 120,
      scenarioTitle: 'Erkin suhbat',
      messages: result.current.chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
      newWords: [],
    });

    expect(saved).toBeTruthy();
    expect(saved?.id).toBeTruthy();
    const sessions = SpeakingConversationHistoryService.getSessions();
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0].messages.length).toBe(11);
  });
});
