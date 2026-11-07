import { supabase, supabaseAnonKey } from '../lib/supabase';
import { purgeOversizedCookies } from '../lib/consoleFilter';

export interface AzurePronunciationWord {
  word: string;
  accuracyScore: number;
  errorType?: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
}

export interface AzurePronunciationResult {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronScore: number;
  words?: AzurePronunciationWord[];
}

export interface AzureSpeechToken {
  token: string;
  region: string;
  expiresAt: number;
}

export interface AzureContinuousRecognizerOptions {
  language?: 'ja-JP' | 'en-US' | 'uz-UZ' | string;
  stream?: MediaStream;
  onSessionStopped?: () => void;
  onRecognizing?: (partialText: string) => void;
  onRecognized?: (finalText: string) => void;
  onError?: (errorMessage: string) => void;
}

export interface AzureContinuousRecognizerController {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  close: () => void;
  isRecognizing: () => boolean;
}

let lastConnectionError: string | null = null;
let cachedSpeechToken: AzureSpeechToken | null = null;
let tokenFetchPromise: Promise<AzureSpeechToken | null> | null = null;

async function getClientAuthToken(): Promise<string> {
  try {
    if (typeof supabase?.auth?.getSession === 'function') {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        return data.session.access_token;
      }
    }
  } catch {
    // Fall back to anon key if session retrieval fails
  }
  return supabaseAnonKey;
}

export const AzureSpeechService = {
  /**
   * Fetches an ephemeral Azure Speech authorization token valid for 10 minutes.
   * Caches for 9 minutes to guarantee freshness.
   */
  async getSpeechToken(forceRefresh = false): Promise<AzureSpeechToken | null> {
    const now = Date.now();
    if (!forceRefresh && cachedSpeechToken && cachedSpeechToken.expiresAt > now + 60000) {
      return cachedSpeechToken;
    }

    if (tokenFetchPromise && !forceRefresh) {
      return tokenFetchPromise;
    }

    tokenFetchPromise = (async () => {
      try {
        // Telegram WebView/browser sessions can accumulate cookies after app
        // startup. Clear browser-readable cookies immediately before this
        // sensitive request so the local proxy does not reject it with HTTP 431.
        purgeOversizedCookies();
        const authToken = await getClientAuthToken();
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        let res = await fetch('/api/speech-token', {
          method: 'GET',
          credentials: 'omit',
          headers,
        });

        // A stale browser session must not block an otherwise public, rate-limited
        // speech-token request. Retry once with the project anon key instead.
        if (res.status === 401 && supabaseAnonKey && authToken !== supabaseAnonKey) {
          res = await fetch('/api/speech-token', {
            method: 'GET',
            credentials: 'omit',
            headers: { Authorization: `Bearer ${supabaseAnonKey}` },
          });
        }

        if (!res.ok) {
          lastConnectionError =
            res.status === 401
              ? 'Azure uchun kirish sessiyasi tasdiqlanmadi.'
              : res.status === 403
                ? 'Azure nutqni tanish so‘rovlari limiti tugagan.'
                : res.status === 429
                  ? 'Azure so‘rovlari juda tez yuborildi. Biroz kuting.'
                  : res.status === 431
                    ? 'Brauzer sessiyasi haddan tashqari katta. Sahifani yangilang; davom etsa, localhost sayt ma’lumotlarini tozalang.'
                    : 'Azure tokenini olib bo‘lmadi. Xizmat ulanishini tekshirish kerak.';
          console.warn(`[AzureSpeechService] Failed to obtain speech token: HTTP ${res.status}`);
          return null;
        }

        const data = await res.json();
        if (!data?.token || !data?.region) {
          lastConnectionError = 'Azure token javobi yaroqsiz.';
          return null;
        }

        lastConnectionError = null;
        cachedSpeechToken = {
          token: data.token,
          region: data.region,
          expiresAt: Date.now() + (data.expiresIn || 600) * 1000,
        };
        return cachedSpeechToken;
      } catch (err) {
        lastConnectionError = 'Azure token serveriga ulanish uzildi.';
        console.warn('[AzureSpeechService] Network error fetching speech token:', err);
        return null;
      } finally {
        tokenFetchPromise = null;
      }
    })();

    return tokenFetchPromise;
  },

  /**
   * Quick verification whether Azure Speech services are ready and configured.
   */
  getLastConnectionError(): string | null {
    return lastConnectionError;
  },

  async isAzureSpeechAvailable(): Promise<boolean> {
    const tokenData = await this.getSpeechToken();
    return Boolean(tokenData?.token && tokenData?.region);
  },

  /**
   * Clears the cached speech token (e.g. upon user logout or authentication error).
   */
  clearTokenCache(): void {
    cachedSpeechToken = null;
    tokenFetchPromise = null;
    lastConnectionError = null;
  },

  /**
   * Dynamically loads the official Microsoft Cognitive Services Speech SDK.
   * Keeps main initial bundle light by only loading when microphone or speech coach opens.
   */
  async getSDK() {
    return await import('microsoft-cognitiveservices-speech-sdk');
  },

  /**
   * Creates a continuous Speech Recognizer using microphone audio stream and Azure Neural STT.
   */
  async createContinuousRecognizer(
    options: AzureContinuousRecognizerOptions = {},
  ): Promise<AzureContinuousRecognizerController | null> {
    const tokenData = await this.getSpeechToken();
    if (!tokenData) {
      return null;
    }

    const SpeechSDK = await this.getSDK();
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
      tokenData.token,
      tokenData.region,
    );
    speechConfig.speechRecognitionLanguage = options.language || 'ja-JP';

    // Enable detailed profanity and casing handling
    speechConfig.setProfanity(SpeechSDK.ProfanityOption.Raw);

    let audioConfig: any;
    try {
      audioConfig = options.stream
        ? SpeechSDK.AudioConfig.fromStreamInput(options.stream)
        : SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    } catch (micErr) {
      console.warn('[AzureSpeechService] Microphone input configuration error:', micErr);
      options.onError?.('Mikrofonga ulanishda xatolik yuz berdi.');
      return null;
    }

    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    let active = false;
    let closed = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const clearRefreshTimer = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = null;
    };
    const refreshAuthorization = async (forceRefresh = false) => {
      const freshToken = await this.getSpeechToken(forceRefresh);
      if (closed) return;
      if (!freshToken) throw new Error('Azure Speech tokenini yangilab bo‘lmadi.');
      recognizer.authorizationToken = freshToken.token;
    };
    const scheduleRefresh = () => {
      clearRefreshTimer();
      refreshTimer = setTimeout(
        async () => {
          if (!active || closed) return;
          try {
            await refreshAuthorization(true);
            if (active && !closed) scheduleRefresh();
          } catch {
            options.onError?.('Azure Speech bilan aloqa uzildi. Qayta urinib ko‘ring.');
          }
        },
        8 * 60 * 1000,
      );
    };

    recognizer.recognizing = (_sender: any, event: any) => {
      if (event?.result?.text) {
        options.onRecognizing?.(event.result.text);
      }
    };

    recognizer.recognized = (_sender: any, event: any) => {
      if (event?.result?.text && event.result.text.trim()) {
        options.onRecognized?.(event.result.text.trim());
      }
    };

    recognizer.sessionStopped = () => {
      active = false;
      clearRefreshTimer();
      if (!closed) options.onSessionStopped?.();
    };

    recognizer.canceled = (_sender: any, event: any) => {
      active = false;
      clearRefreshTimer();
      if (event?.errorDetails) {
        console.warn('[AzureSpeechService] Recognizer canceled/error:', event.errorDetails);
        options.onError?.(event.errorDetails);
      }
    };

    return {
      start: async () => {
        if (active || closed) return;
        await refreshAuthorization();
        if (closed) return;
        return new Promise<void>((resolve, reject) => {
          recognizer.startContinuousRecognitionAsync(
            () => {
              active = true;
              scheduleRefresh();
              resolve();
            },
            (err: any) => {
              active = false;
              reject(err);
            },
          );
        });
      },
      stop: async () => {
        clearRefreshTimer();
        if (!active) return;
        return new Promise<void>((resolve, reject) => {
          recognizer.stopContinuousRecognitionAsync(
            () => {
              active = false;
              resolve();
            },
            (err: any) => {
              reject(err);
            },
          );
        });
      },
      close: () => {
        closed = true;
        clearRefreshTimer();
        try {
          if (active) {
            recognizer.stopContinuousRecognitionAsync();
          }
          recognizer.close();
        } catch {
          // Ignore close cleanup errors
        }
        active = false;
      },
      isRecognizing: () => active,
    };
  },

  /**
   * Evaluates Japanese or target language pronunciation against a reference sentence.
   * Returns Accuracy, Fluency, Completeness, and Overall Pronunciation scores (0-100).
   */
  async assessPronunciation(
    referenceText: string,
    language = 'ja-JP',
  ): Promise<AzurePronunciationResult | null> {
    const tokenData = await this.getSpeechToken();
    if (!tokenData) return null;

    const SpeechSDK = await this.getSDK();
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
      tokenData.token,
      tokenData.region,
    );
    speechConfig.speechRecognitionLanguage = language;

    // Pronunciation Assessment configuration
    const pronConfig = new SpeechSDK.PronunciationAssessmentConfig(
      referenceText,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Word,
      true, // enable miscue detection
    );

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    pronConfig.applyTo(recognizer);

    return new Promise((resolve) => {
      recognizer.recognizeOnceAsync(
        (result: any) => {
          try {
            if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
              const pronResult = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
              const jsonDetails = JSON.parse(
                result.properties.getProperty(
                  SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult,
                ) || '{}',
              );

              const wordsList: AzurePronunciationWord[] =
                jsonDetails?.NBest?.[0]?.Words?.map((w: any) => ({
                  word: w.Word,
                  accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
                  errorType: w.PronunciationAssessment?.ErrorType ?? 'None',
                })) || [];

              resolve({
                accuracyScore: Math.round(pronResult.accuracyScore || 0),
                fluencyScore: Math.round(pronResult.fluencyScore || 0),
                completenessScore: Math.round(pronResult.completenessScore || 0),
                pronScore: Math.round(pronResult.pronunciationScore || 0),
                words: wordsList,
              });
            } else {
              resolve(null);
            }
          } catch (e) {
            console.warn('[AzureSpeechService] Error parsing pronunciation assessment:', e);
            resolve(null);
          } finally {
            recognizer.close();
          }
        },
        (err: any) => {
          console.warn('[AzureSpeechService] Pronunciation assessment failed:', err);
          recognizer.close();
          resolve(null);
        },
      );
    });
  },
};
