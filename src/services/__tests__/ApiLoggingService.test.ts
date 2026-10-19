import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiLoggingService } from '../ApiLoggingService';

describe('ApiLoggingService', () => {
  beforeEach(() => {
    ApiLoggingService.clearLogs();
  });

  it('logs an API call and retrieves it with correct properties', () => {
    const entry = ApiLoggingService.logApiCall({
      endpoint: '/api/v1/analytics-feedback',
      method: 'POST',
      statusCode: 200,
      durationMs: 145,
      success: true,
      metadata: { userId: 'user-123' },
    });

    expect(entry).toBeDefined();
    expect(entry.id).toContain('api_');
    expect(entry.endpoint).toBe('/api/v1/analytics-feedback');
    expect(entry.method).toBe('POST');
    expect(entry.durationMs).toBe(145);
    expect(entry.success).toBe(true);

    const logs = ApiLoggingService.getApiLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].id).toBe(entry.id);
  });

  it('accurately computes summary metrics for mixed success and error calls', () => {
    ApiLoggingService.logApiCall({
      endpoint: '/api/deepseek',
      method: 'POST',
      statusCode: 200,
      durationMs: 100,
      success: true,
    });

    ApiLoggingService.logApiCall({
      endpoint: '/api/deepseek',
      method: 'POST',
      statusCode: 200,
      durationMs: 200,
      success: true,
    });

    ApiLoggingService.logApiCall({
      endpoint: '/api/tts',
      method: 'POST',
      statusCode: 500,
      durationMs: 300,
      success: false,
      errorMessage: 'Network timeout',
    });

    const summary = ApiLoggingService.getApiMetricsSummary();
    expect(summary.totalCalls).toBe(3);
    expect(summary.successfulCalls).toBe(2);
    expect(summary.failedCalls).toBe(1);
    expect(summary.successRate).toBe(67); // Math.round(2/3 * 100)
    expect(summary.avgDurationMs).toBe(200); // (100+200+300)/3
    expect(summary.slowestDurationMs).toBe(300);

    expect(summary.callsByEndpoint['/api/deepseek']).toBeDefined();
    expect(summary.callsByEndpoint['/api/deepseek'].count).toBe(2);
    expect(summary.callsByEndpoint['/api/deepseek'].avgDurationMs).toBe(150);
    expect(summary.callsByEndpoint['/api/deepseek'].errors).toBe(0);

    expect(summary.callsByEndpoint['/api/tts']).toBeDefined();
    expect(summary.callsByEndpoint['/api/tts'].count).toBe(1);
    expect(summary.callsByEndpoint['/api/tts'].errors).toBe(1);
  });

  it('logs system metrics and computes study time and success rate summary', () => {
    ApiLoggingService.logSystemMetric({
      metricName: 'study_time_minutes',
      value: 25,
      unit: 'minutes',
      tags: { activity: 'quiz' },
    });

    ApiLoggingService.logSystemMetric({
      metricName: 'study_time_minutes',
      value: 15,
      unit: 'minutes',
      tags: { activity: 'flashcards' },
    });

    ApiLoggingService.logSystemMetric({
      metricName: 'success_rate_percent',
      value: 80,
      unit: 'percent',
    });

    ApiLoggingService.logSystemMetric({
      metricName: 'success_rate_percent',
      value: 90,
      unit: 'percent',
    });

    const sysSummary = ApiLoggingService.getSystemMetricsSummary();
    expect(sysSummary.totalStudyTimeLoggedMinutes).toBe(40);
    expect(sysSummary.averageSuccessRate).toBe(85);
    expect(sysSummary.totalMetricsRecorded).toBe(4);
    expect(sysSummary.recentSnapshots.length).toBeGreaterThan(0);
  });

  it('notifies subscribers in real-time when new logs arrive', () => {
    const listener = vi.fn();
    const unsubscribe = ApiLoggingService.subscribe(listener);

    ApiLoggingService.logApiCall({
      endpoint: '/api/v1/srs',
      method: 'POST',
      durationMs: 50,
      success: true,
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].endpoint).toBe('/api/v1/srs');

    unsubscribe();

    ApiLoggingService.logApiCall({
      endpoint: '/api/v1/srs',
      method: 'POST',
      durationMs: 60,
      success: true,
    });

    expect(listener).toHaveBeenCalledTimes(1); // not called again
  });

  it('exports logs as valid formatted JSON', () => {
    ApiLoggingService.logApiCall({
      endpoint: '/api/test',
      durationMs: 20,
      success: true,
    });

    const jsonStr = ApiLoggingService.exportLogsAsJson();
    const parsed = JSON.parse(jsonStr);

    expect(parsed.apiLogs).toBeDefined();
    expect(parsed.apiLogs.length).toBe(1);
    expect(parsed.summary).toBeDefined();
    expect(parsed.summary.api.totalCalls).toBe(1);
  });
});
