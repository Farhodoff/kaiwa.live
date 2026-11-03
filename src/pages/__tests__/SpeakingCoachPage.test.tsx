import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SpeakingCoachPage from '../SpeakingCoachPage';
import { useSpeakingSessionOrchestrator } from '../../hooks/useSpeakingSessionOrchestrator';

vi.mock('../../hooks/useSpeakingSessionOrchestrator', () => ({
  useSpeakingSessionOrchestrator: vi.fn(),
}));
vi.mock('../../context/StudyPlannerContext', () => ({
  useStudyData: () => ({ flashcards: [], subjects: [], targetLevel: 'N5' }),
}));
vi.mock('../../hooks/useTelegramWebApp', () => ({
  useTelegramWebApp: () => ({ isTwa: false, haptics: { impact: vi.fn() } }),
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: vi.fn() }));
vi.mock('../../hooks/useAudioLevel', () => ({ useAudioLevel: () => 0 }));
vi.mock('../../components/character/ProjectOrb', () => ({ ProjectOrb: () => <span>Sensei</span> }));
vi.mock('../../services/ScenarioService', () => ({
  ScenarioService: { getImmediateScenarios: () => [] },
}));
vi.mock('../../services/SpeakingConversationHistoryService', () => ({
  SpeakingConversationHistoryService: { getSessions: () => [], saveSession: vi.fn() },
}));
vi.mock('../../components/speaking/SessionReportModal', () => ({ default: () => null }));
vi.mock('../../components/speaking/ScenarioReportModal', () => ({
  ScenarioReportModal: () => null,
}));
vi.mock('../../components/speaking/SpeakingHistoryModal', () => ({
  SpeakingHistoryModal: () => null,
}));
vi.mock('../../components/speaking/PitchAccentTrainer', () => ({ PitchAccentTrainer: () => null }));
vi.mock('../../components/speaking/PitchAccentModal', () => ({ PitchAccentModal: () => null }));

const renderPage = () => (
  <MemoryRouter>
    <SpeakingCoachPage />
  </MemoryRouter>
);
let state: any;
beforeEach(() => {
  state = {
    isLiveSession: false,
    isSpeaking: false,
    isThinking: false,
    isListening: false,
    isMuted: false,
    setIsMuted: vi.fn(),
    speechProvider: 'idle',
    isPreparingAudio: false,
    sessionSeconds: 0,
    chatHistory: [],
    setChatHistory: vi.fn(),
    accumulatedNewWords: [],
    currentTranscript: '',
    audioVolume: 0,
    isSupported: true,
    error: null,
    setError: vi.fn(),
    speechSpeed: 1,
    setSpeechSpeed: vi.fn(),
    voiceRecorder: {},
    startSession: vi.fn(),
    endSession: vi.fn().mockResolvedValue(undefined),
    toggleMic: vi.fn(),
    speakText: vi.fn(),
    stopSpeaking: vi.fn(),
    formatTimer: () => '00:00',
    handleAddVocabToFlashcards: vi.fn(),
  };
  vi.mocked(useSpeakingSessionOrchestrator).mockImplementation(() => ({ ...state }));
});
afterEach(cleanup);

describe('Speaking Coach session and controls', () => {
  it('opens settings before starting a session and closes with Escape', () => {
    render(renderPage());
    fireEvent.click(screen.getByRole('button', { name: 'Speaking sozlamalari' }));
    expect(screen.getByRole('dialog', { name: 'Speaking Coach Sozlamalari' })).toBeVisible();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(state.startSession).not.toHaveBeenCalled();
  });

  it('keeps a live session running across rerenders when callback identities change', () => {
    state.isLiveSession = true;
    const firstEnd = state.endSession;
    const view = render(renderPage());
    state.endSession = vi.fn().mockResolvedValue(undefined);
    state.sessionSeconds = 1;
    view.rerender(renderPage());
    expect(firstEnd).not.toHaveBeenCalled();
    expect(state.endSession).not.toHaveBeenCalled();
    view.unmount();
    expect(state.endSession).toHaveBeenCalledOnce();
    expect(state.endSession).toHaveBeenCalledWith({ skipEvaluation: true });
  });

  it('pauses the microphone and never labels an idle microphone as listening', () => {
    state.isLiveSession = true;
    const view = render(renderPage());
    expect(screen.queryByText('Tinglayapman...')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mikrofonni pauza qilish' }));
    expect(state.setIsMuted).toHaveBeenCalledWith(true);
    state.isMuted = true;
    view.rerender(renderPage());
    expect(screen.getByText('Mikrofon pauzada')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Mikrofonni yoqish' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

it('keeps a conversation alive when switching tabs', () => {
  state.isLiveSession = true;
  render(renderPage());
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  fireEvent(document, new Event('visibilitychange'));
  expect(state.endSession).not.toHaveBeenCalled();
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  fireEvent(document, new Event('visibilitychange'));
  expect(state.endSession).not.toHaveBeenCalled();
});
