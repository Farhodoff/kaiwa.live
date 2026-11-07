import {
  AzureSpeechService,
  AzureContinuousRecognizerController,
} from '../services/AzureSpeechService';

export type CoachSpeechProvider = 'idle' | 'connecting' | 'azure' | 'browser' | 'unavailable';

/** Adapts Azure's continuous results to the recognition events used by turn detection. */
export class CoachSpeechRecognition {
  lang = 'ja-JP';
  stream?: MediaStream;
  onstart?: () => void;
  onend?: () => void;
  onspeechstart?: () => void;
  onsoundstart?: () => void;
  onresult?: (event: any) => void;
  onerror?: (event: { error: string }) => void;
  private controller: AzureContinuousRecognizerController | null = null;
  private browser: any = null;
  private generation = 0;
  private running = false;
  private finalResults: any[] = [];
  private useBrowser = false;
  private fallbackReason = '';

  constructor(private onProvider: (provider: CoachSpeechProvider, reason?: string) => void) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.finalResults = [];
    const generation = ++this.generation;
    void this.startProvider(generation);
  }

  private emitResult(text: string, isFinal: boolean) {
    const result = Object.assign([{ transcript: text }], { isFinal });
    if (isFinal) this.finalResults.push(result);
    this.onresult?.({ results: isFinal ? [...this.finalResults] : [...this.finalResults, result] });
  }

  private async startProvider(generation: number) {
    this.onProvider('connecting');
    if (!this.useBrowser) {
      try {
        const controller = await AzureSpeechService.createContinuousRecognizer({
          language: this.lang,
          stream: this.stream,
          onRecognizing: (text) => {
            if (generation === this.generation && this.running) this.emitResult(text, false);
          },
          onRecognized: (text) => {
            if (generation === this.generation && this.running) this.emitResult(text, true);
          },
          onSessionStopped: () => {
            if (generation === this.generation && this.running) this.finish(false);
          },
          onError: () => {
            if (generation !== this.generation || !this.running) return;
            if (AzureSpeechService.getAuthState?.() === 'session_expired') {
              this.abort();
              this.onerror?.({ error: 'session-expired' });
              return;
            }
            this.useBrowser = true;
            this.fallbackReason = 'Azure bilan jonli nutq ulanishi uzildi.';
            this.abort();
            this.onend?.();
          },
        });
        if (generation !== this.generation || !this.running) {
          controller?.close();
          return;
        }
        if (controller) {
          this.controller = controller;
          await controller.start();
          if (generation !== this.generation || !this.running) {
            controller.close();
            return;
          }
          this.onProvider('azure');
          this.onstart?.();
          return;
        }
        this.fallbackReason =
          AzureSpeechService.getLastConnectionError?.() || 'Azure nutq xizmati ishga tushmadi.';
      } catch {
        this.fallbackReason = 'Azure nutq xizmati ishga tushmadi.';
        this.controller?.close();
        this.controller = null;
      }
    }
    if (generation !== this.generation || !this.running) return;
    if (AzureSpeechService.getAuthState?.() === 'session_expired') {
      this.abort();
      this.onerror?.({ error: 'session-expired' });
      return;
    }
    this.useBrowser = true;
    const win = window as any;
    const BrowserRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!BrowserRecognition) {
      this.running = false;
      this.onProvider('unavailable');
      this.onerror?.({ error: 'service-unavailable' });
      return;
    }
    const browser = new BrowserRecognition();
    this.browser = browser;
    browser.lang = this.lang;
    browser.continuous = true;
    browser.interimResults = true;
    browser.maxAlternatives = 3;
    const current = () => generation === this.generation && this.running;
    browser.onstart = () => {
      if (!current()) return;
      this.onProvider('browser', this.fallbackReason);
      this.onstart?.();
    };
    browser.onresult = (event: any) => {
      if (current()) this.onresult?.(event);
    };
    browser.onspeechstart = () => {
      if (current()) this.onspeechstart?.();
    };
    browser.onsoundstart = () => {
      if (current()) this.onsoundstart?.();
    };
    browser.onerror = (event: any) => {
      if (current()) this.onerror?.(event);
    };
    browser.onend = () => {
      if (current()) this.finish(false);
    };
    try {
      browser.start();
    } catch {
      this.abort();
      this.onProvider('unavailable');
      this.onerror?.({ error: 'service-unavailable' });
    }
  }

  stop() {
    if (!this.running) return;
    if (this.browser) {
      this.browser.stop();
      return;
    }
    const controller = this.controller;
    const generation = this.generation;
    if (controller) {
      void controller
        .stop()
        .catch(() => {})
        .finally(() => {
          if (generation === this.generation && this.running) this.finish(false);
        });
    } else {
      this.finish(false);
    }
  }

  abort() {
    this.finish(true);
  }

  resetProvider() {
    this.abort();
    this.useBrowser = false;
    this.fallbackReason = '';
    AzureSpeechService.clearTokenCache?.();
  }

  private finish(aborted: boolean) {
    const wasRunning = this.running;
    this.running = false;
    ++this.generation;
    this.controller?.close();
    this.controller = null;
    if (this.browser) {
      this.browser.onend = null;
      this.browser.abort();
      this.browser = null;
    }
    if (wasRunning && !aborted) this.onend?.();
  }
}
