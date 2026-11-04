import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initErrorTracking,
  captureException,
  trackAITelemetry,
  trackTTSTelemetry,
  logBreadcrumb,
  getTelemetryBuffer,
  clearTelemetryBuffer,
  sanitizeContext,
  recordTelemetryEvent,
} from '../../lib/errorTracking';

describe('Production Observability & Telemetry System', () => {
  beforeEach(() => {
    clearTelemetryBuffer();
    vi.clearAllMocks();
  });

  it('initializes observability cleanly and remains idempotent', () => {
    expect(() => {
      initErrorTracking();
      initErrorTracking();
    }).not.toThrow();
  });

  it('records sanitized telemetry events in circular buffer capped at 50', () => {
    for (let i = 0; i < 60; i++) {
      recordTelemetryEvent('api', `Test event ${i}`);
    }

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(50);
    expect(buffer[buffer.length - 1].message).toBe('Test event 59');
    expect(buffer[0].message).toBe('Test event 10');
  });

  it('recursively scrubs sensitive fields from metadata in sanitizeContext', () => {
    const sensitiveData = {
      userId: 'user-123',
      apiKey: 'AIzaSyTestApiKey1234567890',
      password: 'secretPassword123',
      auth_token: 'Bearer eyJhbGciOiJIUzI1NiJ9.secret',
      nested: {
        deepKey: 'value',
        authorization: 'Bearer secret_token',
        errorMessage: 'DB connection postgresql://postgres:dbpass@db.supabase.co failed',
      },
    };

    const sanitized = sanitizeContext(sensitiveData);

    expect(sanitized.userId).toBe('user-123');
    expect(sanitized.apiKey).toBe('[REDACTED]');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.auth_token).toBe('[REDACTED]');
    expect(sanitized.nested.deepKey).toBe('value');
    expect(sanitized.nested.authorization).toBe('[REDACTED]');
    expect(sanitized.nested.errorMessage).toContain('[REDACTED_PASSWORD]');
    expect(sanitized.nested.errorMessage).not.toContain('dbpass');
  });

  it('tracks AI latency, provider, and error status safely', () => {
    trackAITelemetry({
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      durationMs: 450,
      success: true,
    });

    trackAITelemetry({
      provider: 'gemini',
      durationMs: 1200,
      success: false,
      error: 'Rate limit exceeded 429',
    });

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(2);
    expect(buffer[0].category).toBe('ai');
    expect(buffer[0].durationMs).toBe(450);
    expect(buffer[0].success).toBe(true);
    expect(buffer[1].category).toBe('ai');
    expect(buffer[1].success).toBe(false);
    expect(buffer[1].message).toContain('Rate limit');
  });

  it('tracks TTS audio playback duration and fallback errors', () => {
    trackTTSTelemetry({
      durationMs: 320,
      success: true,
    });

    trackTTSTelemetry({
      durationMs: 10000,
      success: false,
      error: 'TTS timeout 10s exceeded',
    });

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(2);
    expect(buffer[0].category).toBe('tts');
    expect(buffer[0].durationMs).toBe(320);
    expect(buffer[1].category).toBe('tts');
    expect(buffer[1].success).toBe(false);
  });

  it('captures exceptions with sanitized breadcrumbs and context', () => {
    captureException(new Error('Sensitive auth failure for key AIzaSyD9876543210'), {
      apiKey: 'AIzaSyD9876543210',
      userEmail: 'test@example.com',
    });

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(1);
    expect(buffer[0].category).toBe('api');
    expect(buffer[0].message).not.toContain('AIzaSyD9876543210');
    expect(buffer[0].message).toContain('AIzaSy[REDACTED]');
    expect(buffer[0].metadata?.apiKey).toBe('[REDACTED]');
    expect(buffer[0].metadata?.userEmail).toBe('test@example.com');
  });

  it('logs breadcrumbs with sanitized context', () => {
    logBreadcrumb('Navigated to Japanese coach with key AIzaSyD9876543210', 'navigation', {
      token: 'secretToken123',
    });

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(1);
    expect(buffer[0].message).toContain('AIzaSy[REDACTED]');
    expect(buffer[0].metadata?.token).toBe('[REDACTED]');
  });
});
