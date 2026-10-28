import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeakingSessionOrchestrator } from '../useSpeakingSessionOrchestrator';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../utils/ai', () => ({
  streamCoachDialogue: vi.fn(),
  converseWithCoachStructured: vi.fn(),
  analyzeSpeakingSession: vi.fn(),
  translateTextToUzbek: vi.fn(),
  parseMicroErrors: vi.fn(() => []),
  extractSpeechAudioText: vi.fn((t) => t),
}));

vi.mock('../useTTS', () => ({
  useTTS: () => ({
    speakText: vi.fn(),
    stopSpeaking: vi.fn(),
    unlockAudio: vi.fn(),
    isPreparingAudio: false,
    enqueueStreamSentence: vi.fn(),
    endStreamPlayback: vi.fn(),
    speechSpeed: 1,
    setSpeechSpeed: vi.fn(),
  }),
  fetchTTSAudioBlob: vi.fn().mockResolvedValue(null),
}));

vi.mock('../useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    recognitionRef: { current: null },
    isListening: false,
    currentTranscript: '',
    setCurrentTranscript: vi.fn(),
    transcriptBufferRef: { current: '' },
    error: null,
    setError: vi.fn(),
    isSupported: true,
    audioVolume: 0,
    startListening: vi.fn(),
    commitSpeechNow: vi.fn(),
  }),
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

describe('useSpeakingSessionOrchestrator', () => {
  const defaultProps = {
    language: 'ja' as const,
    persona: 'roast' as const,
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

  it('initializes with expected default values', () => {
    const { result } = renderHook(() => useSpeakingSessionOrchestrator(defaultProps));

    expect(result.current.isLiveSession).toBe(false);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isThinking).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.chatHistory).toEqual([]);
    expect(result.current.sessionSeconds).toBe(0);
  });

  it('formats session timer correctly', () => {
    const { result } = renderHook(() => useSpeakingSessionOrchestrator(defaultProps));

    expect(result.current.formatTimer(0)).toBe('00:00');
    expect(result.current.formatTimer(65)).toBe('01:05');
    expect(result.current.formatTimer(720)).toBe('12:00');
  });

  it('starts session with Japanese coach greeting', () => {
    const { result } = renderHook(() => useSpeakingSessionOrchestrator(defaultProps));

    act(() => {
      result.current.startSession();
    });

    expect(result.current.isLiveSession).toBe(true);
    expect(result.current.chatHistory.length).toBe(1);
    expect(result.current.chatHistory[0].role).toBe('assistant');
    expect(result.current.chatHistory[0].content).toContain('こんにちは！調子はどうですか？');
  });

  it('resets chat cleanly when handleResetChat is triggered', () => {
    const { result } = renderHook(() => useSpeakingSessionOrchestrator(defaultProps));

    act(() => {
      result.current.startSession();
    });
    expect(result.current.chatHistory.length).toBe(1);

    act(() => {
      result.current.handleResetChat();
    });

    expect(result.current.chatHistory).toEqual([]);
    expect(result.current.sessionSeconds).toBe(0);
    expect(result.current.liveErrors).toEqual([]);
  });

  it('toggles session on and off', async () => {
    const { result } = renderHook(() => useSpeakingSessionOrchestrator(defaultProps));

    expect(result.current.isLiveSession).toBe(false);

    act(() => {
      result.current.toggleSession();
    });
    expect(result.current.isLiveSession).toBe(true);

    await act(async () => {
      await result.current.toggleSession();
    });
    expect(result.current.isLiveSession).toBe(false);
  });
});
