import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachSpeechRecognition } from '../coachSpeechRecognition';
import {
  AzureSpeechService,
  AzureContinuousRecognizerOptions,
  AzureContinuousRecognizerController,
} from '../../services/AzureSpeechService';

vi.mock('../../services/AzureSpeechService', () => ({
  AzureSpeechService: { createContinuousRecognizer: vi.fn() },
}));

describe('Coach speech recognition provider integration', () => {
  let options: AzureContinuousRecognizerOptions;
  let controller: AzureContinuousRecognizerController;
  beforeEach(() => {
    vi.clearAllMocks();
    controller = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
      isRecognizing: vi.fn().mockReturnValue(true),
    };
    vi.mocked(AzureSpeechService.createContinuousRecognizer).mockImplementation(async (opts) => {
      options = opts!;
      return controller;
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses Azure even when browser recognition is absent and combines partial/final results', async () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const provider = vi.fn();
    const recognition = new CoachSpeechRecognition(provider);
    recognition.stream = {} as MediaStream;
    recognition.onresult = vi.fn();
    recognition.onstart = vi.fn();
    recognition.start();
    await vi.waitFor(() => expect(recognition.onstart).toHaveBeenCalledOnce());
    expect(options.stream).toBe(recognition.stream);
    expect(provider).toHaveBeenLastCalledWith('azure');
    options.onRecognized?.('こんにちは。');
    options.onRecognizing?.('今日は');
    const results = vi.mocked(recognition.onresult).mock.calls.at(-1)![0].results;
    expect(results.map((r: any) => r[0].transcript)).toEqual(['こんにちは。', '今日は']);
    expect(results.map((r: any) => r.isFinal)).toEqual([true, false]);
    recognition.abort();
  });

  it('stops exactly once and releases Azure resources', async () => {
    const recognition = new CoachSpeechRecognition(vi.fn());
    recognition.onstart = vi.fn();
    recognition.onend = vi.fn();
    recognition.start();
    await vi.waitFor(() => expect(recognition.onstart).toHaveBeenCalled());
    recognition.stop();
    await vi.waitFor(() => expect(recognition.onend).toHaveBeenCalledOnce());
    options.onSessionStopped?.();
    expect(recognition.onend).toHaveBeenCalledOnce();
    expect(controller.close).toHaveBeenCalledOnce();
  });

  it('does not restart or emit results after abort during Azure initialization', async () => {
    let resolve!: (value: typeof controller) => void;
    vi.mocked(AzureSpeechService.createContinuousRecognizer).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const recognition = new CoachSpeechRecognition(vi.fn());
    recognition.onstart = vi.fn();
    recognition.onend = vi.fn();
    recognition.start();
    recognition.abort();
    resolve(controller);
    await vi.waitFor(() => expect(controller.close).toHaveBeenCalledOnce());
    expect(controller.start).not.toHaveBeenCalled();
    expect(recognition.onstart).not.toHaveBeenCalled();
    expect(recognition.onend).not.toHaveBeenCalled();
  });

  it('explicitly reports browser fallback when Azure is unavailable', async () => {
    vi.mocked(AzureSpeechService.createContinuousRecognizer).mockResolvedValue(null);
    class BrowserRecognition {
      onstart?: () => void;
      onend?: () => void;
      start() {
        this.onstart?.();
      }
      abort() {}
    }
    vi.stubGlobal('SpeechRecognition', BrowserRecognition);
    const provider = vi.fn();
    const recognition = new CoachSpeechRecognition(provider);
    recognition.start();
    await vi.waitFor(() =>
      expect(provider).toHaveBeenLastCalledWith('browser', expect.any(String)),
    );
    recognition.abort();
  });

  it('reports unavailable without a restart loop when neither provider works', async () => {
    vi.mocked(AzureSpeechService.createContinuousRecognizer).mockResolvedValue(null);
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const provider = vi.fn();
    const recognition = new CoachSpeechRecognition(provider);
    recognition.onerror = vi.fn();
    recognition.onend = vi.fn();
    recognition.start();
    await vi.waitFor(() =>
      expect(recognition.onerror).toHaveBeenCalledWith({ error: 'service-unavailable' }),
    );
    expect(provider).toHaveBeenLastCalledWith('unavailable');
    expect(recognition.onend).not.toHaveBeenCalled();
  });
});
