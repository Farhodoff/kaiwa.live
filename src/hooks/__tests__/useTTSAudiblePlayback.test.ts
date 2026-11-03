import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { clearTTSAudioCache, useTTS } from '../useTTS';

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
  supabaseAnonKey: 'public-test-key',
}));
vi.mock('../../lib/errorTracking', () => ({ trackTTSTelemetry: vi.fn() }));
vi.mock('../../utils/ai', () => ({ cleanJapaneseTTS: (text: string) => text }));
beforeEach(() => {
  clearTTSAudioCache();
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(new Blob(['audio'], { type: 'audio/mpeg' }), {
      headers: { 'Content-Type': 'audio/mpeg' },
    }),
  );
  vi.stubGlobal('AudioContext', undefined);
  vi.stubGlobal('webkitAudioContext', undefined);
  vi.stubGlobal('speechSynthesis', undefined);
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:coach-audio');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Audible coach playback', () => {
  it('does not pause a greeting when the earlier unlock promise resolves late', async () => {
    let unlockDone!: () => void;
    const priming = new Promise<void>((resolve) => {
      unlockDone = resolve;
    });
    const audio: any = {
      src: '',
      paused: true,
      volume: 1,
      currentTime: 0,
      load: vi.fn(),
      pause: vi.fn(),
      play: vi.fn().mockReturnValueOnce(priming).mockResolvedValue(undefined),
    };
    const { result } = renderHook(() =>
      useTTS({ language: 'ja', onSpeakStart: vi.fn(), onSpeakEnd: vi.fn() }),
    );
    result.current.audioPlayerRef.current = audio;
    let playback!: Promise<void>;
    await act(async () => {
      result.current.unlockAudio();
      playback = result.current.speakText('こんにちは。');
      await vi.waitFor(() => expect(audio.src).toBe('blob:coach-audio'));
    });
    const pauseCount = audio.pause.mock.calls.length;
    await act(async () => {
      unlockDone();
      await priming;
    });
    expect(audio.pause).toHaveBeenCalledTimes(pauseCount);
    expect(audio.volume).toBe(1);
    await act(async () => {
      audio.onended();
      await playback;
    });
  });

  it('reports playback failure instead of silently handing the turn to the user', async () => {
    const onSpeakError = vi.fn();
    const onSpeakEnd = vi.fn();
    const audio: any = {
      src: '',
      paused: true,
      volume: 1,
      currentTime: 0,
      load: vi.fn(),
      pause: vi.fn(),
      play: vi.fn().mockRejectedValue(new DOMException('Playback blocked', 'NotAllowedError')),
    };
    const { result } = renderHook(() =>
      useTTS({ language: 'ja', onSpeakStart: vi.fn(), onSpeakEnd, onSpeakError }),
    );
    result.current.audioPlayerRef.current = audio;
    await act(async () => {
      await result.current.speakText('こんにちは。');
    });
    expect(onSpeakError).toHaveBeenCalledOnce();
    expect(onSpeakError.mock.calls[0][0]).toContain('ijro qilib bo‘lmadi');
    expect(onSpeakEnd).toHaveBeenCalledOnce();
  });
});
