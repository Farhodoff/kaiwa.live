import { supabase, supabaseAnonKey } from '../lib/supabase';

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

export type SpeechAuthState =
  'authenticated' | 'refreshing' | 'session_expired' | 'anonymous' | 'error';

export const SPEECH_SESSION_EXPIRED =
  'Sessiyangiz tugadi. Gapirish mashqini davom ettirish uchun qayta kiring.';
let authState: SpeechAuthState = 'error';
let cachedAuthorization: string | null = null;
let sessionGeneration = 0;
let requiresSignIn = false;

function expireSession(): null {
  requiresSignIn = true;
  cachedSpeechToken = null;
  authState = 'session_expired';
  lastConnectionError = SPEECH_SESSION_EXPIRED;
  return null;
}

function requestSpeechToken(accessToken: string, guest: boolean) {
  const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(15000) : undefined;
  return fetch(guest ? '/api/speech-token?mode=guest' : '/api/speech-token', {
    method: 'GET',
    credentials: 'omit',
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });
}

export const AzureSpeechService = {
  /**
   * Fetches an ephemeral Azure Speech authorization token valid for 10 minutes.
   * Caches for 9 minutes to guarantee freshness.
   */
  async getSpeechToken(forceRefresh = false): Promise<AzureSpeechToken | null> {
    if (tokenFetchPromise) return tokenFetchPromise;
    const generation = sessionGeneration;
    tokenFetchPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (generation !== sessionGeneration) return null;
        if (error) return expireSession();
        let accessToken = data.session?.access_token;
        const guest = !data.session;
        if (!guest && (!accessToken || accessToken === supabaseAnonKey)) return expireSession();
        if (guest && requiresSignIn) return expireSession();
        accessToken = accessToken || supabaseAnonKey;
        if (!guest) requiresSignIn = true;
        authState = guest ? 'anonymous' : 'authenticated';
        if (
          !forceRefresh &&
          cachedAuthorization === accessToken &&
          cachedSpeechToken &&
          cachedSpeechToken.expiresAt > Date.now() + 60000
        ) {
          return cachedSpeechToken;
        }

        let res = await requestSpeechToken(accessToken, guest);
        if (generation !== sessionGeneration) return null;
        if (res.status === 401 && !guest) {
          authState = 'refreshing';
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
          if (generation !== sessionGeneration) return null;
          const refreshedToken = refreshed.session?.access_token;
          if (
            refreshError ||
            !refreshedToken ||
            refreshedToken === accessToken ||
            refreshedToken === supabaseAnonKey ||
            refreshed.session?.user?.id !== data.session?.user?.id
          ) {
            return expireSession();
          }
          accessToken = refreshedToken;
          authState = 'authenticated';
          res = await requestSpeechToken(accessToken, false);
          if (generation !== sessionGeneration) return null;
          if (res.status === 401) return expireSession();
          authState = 'authenticated';
        }

        if (!res.ok) {
          authState = 'error';
          cachedSpeechToken = null;
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

        const issued = await res.json();
        if (generation !== sessionGeneration) return null;
        if (!issued?.token || !issued?.region) {
          authState = 'error';
          lastConnectionError = 'Azure token javobi yaroqsiz.';
          return null;
        }

        lastConnectionError = null;
        cachedAuthorization = accessToken;
        cachedSpeechToken = {
          token: issued.token,
          region: issued.region,
          expiresAt: Date.now() + (issued.expiresIn || 600) * 1000,
        };
        return cachedSpeechToken;
      } catch {
        if (generation !== sessionGeneration) return null;
        if (authState === 'refreshing') return expireSession();
        authState = 'error';
        lastConnectionError = 'Azure token serveriga ulanish uzildi.';
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
  getAuthState(): SpeechAuthState {
    return authState;
  },

  clearTokenCache(): void {
    sessionGeneration++;
    authState = 'error';
    cachedAuthorization = null;
    cachedSpeechToken = null;
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
