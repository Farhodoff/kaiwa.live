import * as Sentry from '@sentry/react';
import { sanitizeErrorMessage } from '../components/ErrorBoundary';
import { ApiLoggingService } from '../services/ApiLoggingService';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const ENV = import.meta.env.MODE || 'development';

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  category:
    | 'unhandled'
    | 'promise'
    | 'api'
    | 'ai'
    | 'tts'
    | 'stt'
    | 'auth'
    | 'supabase'
    | 'webrtc'
    | 'perf';
  message: string;
  durationMs?: number;
  success?: boolean;
  metadata?: Record<string, any>;
}

// In-memory circular buffer for last 50 diagnostic events (zero memory leak risk)
const MAX_TELEMETRY_EVENTS = 50;
const telemetryBuffer: TelemetryEvent[] = [];

/**
 * Recursively redacts sensitive keys from objects before telemetry storage or logging
 */
export function sanitizeContext(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return sanitizeErrorMessage(data);
  if (typeof data === 'number' || typeof data === 'boolean') return data;
  if (Array.isArray(data)) return data.map(sanitizeContext);

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    const sensitiveKeys =
      /api_?key|password|token|bearer|auth|secret|credential|cookie|private_?key/i;

    for (const [k, v] of Object.entries(data)) {
      if (sensitiveKeys.test(k)) {
        sanitized[k] = '[REDACTED]';
      } else {
        sanitized[k] = sanitizeContext(v);
      }
    }
    return sanitized;
  }
  return String(data);
}

/**
 * Records a sanitized telemetry event into the in-memory buffer
 */
export const recordTelemetryEvent = (
  category: TelemetryEvent['category'],
  message: string,
  options?: { durationMs?: number; success?: boolean; metadata?: Record<string, any> },
): TelemetryEvent => {
  const event: TelemetryEvent = {
    id: `tel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    category,
    message: sanitizeErrorMessage(message),
    durationMs: options?.durationMs,
    success: options?.success ?? true,
    metadata: options?.metadata ? sanitizeContext(options.metadata) : undefined,
  };

  telemetryBuffer.push(event);
  if (telemetryBuffer.length > MAX_TELEMETRY_EVENTS) {
    telemetryBuffer.shift();
  }

  return event;
};

export const getTelemetryBuffer = (): TelemetryEvent[] => {
  return [...telemetryBuffer];
};

export const clearTelemetryBuffer = (): void => {
  telemetryBuffer.length = 0;
};

let isObservabilityInitialized = false;

export const initErrorTracking = () => {
  if (isObservabilityInitialized) return;
  isObservabilityInitialized = true;

  // Attach global unhandled browser error listener
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      const rawMsg = event?.message || event?.error?.message || 'Unhandled window error';
      recordTelemetryEvent('unhandled', rawMsg, {
        metadata: {
          filename: event?.filename,
          lineno: event?.lineno,
          colno: event?.colno,
        },
      });
    });

    // Attach global unhandled promise rejection listener
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event?.reason;
      const rawMsg =
        reason?.message || (typeof reason === 'string' ? reason : 'Unhandled Promise Rejection');
      recordTelemetryEvent('promise', rawMsg, {
        metadata: {
          stack: reason?.stack?.slice(0, 300),
        },
      });
    });
  }

  if (!SENTRY_DSN) {
    if (ENV === 'development') {
      console.info(
        'ℹ️ Sentry DSN topilmadi. Telemetriya va xatoliklar mahalliy xavfsiz buferda saqlanadi.',
      );
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENV,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      tracesSampleRate: 1.0,
      tracePropagationTargets: ['localhost', /^\//],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event) {
        // Scrub sensitive data before sending to Sentry
        if (event.exception?.values) {
          event.exception.values.forEach((v) => {
            if (v.value) v.value = sanitizeErrorMessage(v.value);
          });
        }
        return event;
      },
    });
    console.log('🚀 Sentry xatoliklarni kuzatish tizimi muvaffaqiyatli ishga tushdi.');
  } catch (e) {
    console.warn('⚠️ Sentry-ni ishga tushirishda xatolik yuz berdi:', e);
  }
};

/**
 * Capture and log an exception manually to Sentry and sanitized buffer
 */
export const captureException = (error: any, context?: Record<string, any>) => {
  const rawMessage = error?.message || (typeof error === 'string' ? error : 'Unknown error');
  const safeMsg = sanitizeErrorMessage(rawMessage);
  const safeCtx = sanitizeContext(context);

  recordTelemetryEvent('api', safeMsg, {
    success: false,
    metadata: safeCtx,
  });

  if (ENV === 'development') {
    console.error('❌ [Kuzatilgan Xatolik]:', safeMsg, safeCtx || '');
  }

  if (SENTRY_DSN) {
    Sentry.captureException(new Error(safeMsg), {
      extra: safeCtx,
    });
  }
};

/**
 * Track specialized AI telemetry events
 */
export const trackAITelemetry = (data: {
  provider: string;
  model?: string;
  durationMs: number;
  success: boolean;
  error?: string;
}) => {
  recordTelemetryEvent(
    'ai',
    data.success
      ? `AI call (${data.provider}) success`
      : `AI call (${data.provider}) failed: ${data.error || ''}`,
    {
      durationMs: data.durationMs,
      success: data.success,
      metadata: {
        provider: data.provider,
        model: data.model,
      },
    },
  );

  try {
    ApiLoggingService.logApiCall({
      endpoint: `/api/ai/${data.provider}${data.model ? `/${data.model}` : ''}`,
      method: 'POST',
      durationMs: data.durationMs,
      success: data.success,
      errorMessage: data.error,
      metadata: {
        provider: data.provider,
        model: data.model,
      },
    });
  } catch {}
};

/**
 * Track specialized TTS / Audio telemetry events
 */
export const trackTTSTelemetry = (data: {
  durationMs: number;
  success: boolean;
  error?: string;
}) => {
  recordTelemetryEvent(
    'tts',
    data.success ? 'TTS synthesis success' : `TTS failed: ${data.error || ''}`,
    {
      durationMs: data.durationMs,
      success: data.success,
    },
  );

  try {
    ApiLoggingService.logApiCall({
      endpoint: '/api/tts',
      method: 'POST',
      durationMs: data.durationMs,
      success: data.success,
      errorMessage: data.error,
    });
  } catch {}
};

/**
 * Capture custom breadcrumb or info logs
 */
export const logBreadcrumb = (message: string, category?: string, data?: Record<string, any>) => {
  const safeMsg = sanitizeErrorMessage(message);
  const safeData = sanitizeContext(data);

  recordTelemetryEvent((category as any) || 'api', safeMsg, {
    metadata: safeData,
  });

  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({
      category: category || 'app',
      message: safeMsg,
      data: safeData,
      level: 'info',
    });
  }
};
