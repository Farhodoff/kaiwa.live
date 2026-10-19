import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'RPC';

export interface ApiLogEntry {
  id: string;
  timestamp: string; // ISO
  endpoint: string;
  method: HttpMethod;
  statusCode?: number;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  type: 'api' | 'system_metric';
}

export interface SystemMetricEntry {
  id: string;
  timestamp: string;
  metricName:
    | 'study_time_seconds'
    | 'study_time_minutes'
    | 'success_rate_percent'
    | 'active_sessions'
    | 'items_completed'
    | 'api_latency_ms';
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

export interface ApiMetricsSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number; // 0..100
  avgDurationMs: number;
  slowestDurationMs: number;
  callsByEndpoint: Record<string, { count: number; avgDurationMs: number; errors: number }>;
}

export interface SystemMetricsSummary {
  totalStudyTimeLoggedMinutes: number;
  averageSuccessRate: number;
  totalMetricsRecorded: number;
  recentSnapshots: { timestamp: string; studyTimeMinutes: number; successRatePercent: number }[];
}

const STORAGE_KEY_API_LOGS = 'nihongo_api_logs_v1';
const STORAGE_KEY_SYS_METRICS = 'nihongo_system_metrics_v1';
const MAX_LOG_BUFFER_SIZE = 200;
const MAX_METRIC_BUFFER_SIZE = 300;

export class ApiLoggingService {
  private static apiLogs: ApiLogEntry[] = [];
  private static systemMetrics: SystemMetricEntry[] = [];
  private static listeners: Set<(log: ApiLogEntry | SystemMetricEntry) => void> = new Set();
  private static isInitialized = false;

  private static initIfNeeded(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window === 'undefined') return;

    try {
      const rawApi = safeLocalStorage.getItem(STORAGE_KEY_API_LOGS);
      if (rawApi) {
        const parsed = JSON.parse(rawApi);
        if (Array.isArray(parsed)) {
          this.apiLogs = parsed.slice(-MAX_LOG_BUFFER_SIZE);
        }
      }
    } catch {
      this.apiLogs = [];
    }

    try {
      const rawMetrics = safeLocalStorage.getItem(STORAGE_KEY_SYS_METRICS);
      if (rawMetrics) {
        const parsed = JSON.parse(rawMetrics);
        if (Array.isArray(parsed)) {
          this.systemMetrics = parsed.slice(-MAX_METRIC_BUFFER_SIZE);
        }
      }
    } catch {
      this.systemMetrics = [];
    }
  }

  /**
   * Log an API request with endpoint, latency, status code, and success flag.
   */
  static logApiCall(entry: {
    endpoint: string;
    method?: HttpMethod;
    statusCode?: number;
    durationMs: number;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): ApiLogEntry {
    this.initIfNeeded();

    const id = `api_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const isSuccess = entry.success ?? (entry.statusCode ? entry.statusCode < 400 : true);

    const log: ApiLogEntry = {
      id,
      timestamp: new Date().toISOString(),
      endpoint: entry.endpoint,
      method: entry.method || 'POST',
      statusCode: entry.statusCode,
      durationMs: Math.max(0, Math.round(entry.durationMs)),
      success: isSuccess,
      errorMessage: entry.errorMessage,
      metadata: entry.metadata,
      type: 'api',
    };

    this.apiLogs.push(log);
    if (this.apiLogs.length > MAX_LOG_BUFFER_SIZE) {
      this.apiLogs.shift();
    }

    this.persistApiLogsDebounced();
    this.notifyListeners(log);

    return log;
  }

  /**
   * Log a system-level metric (e.g. study time, success rate, latency).
   */
  static logSystemMetric(metric: {
    metricName: SystemMetricEntry['metricName'];
    value: number;
    unit?: string;
    tags?: Record<string, string>;
  }): SystemMetricEntry {
    this.initIfNeeded();

    const id = `met_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const entry: SystemMetricEntry = {
      id,
      timestamp: new Date().toISOString(),
      metricName: metric.metricName,
      value: Number(metric.value.toFixed(2)),
      unit: metric.unit,
      tags: metric.tags,
    };

    this.systemMetrics.push(entry);
    if (this.systemMetrics.length > MAX_METRIC_BUFFER_SIZE) {
      this.systemMetrics.shift();
    }

    this.persistSystemMetricsDebounced();
    this.notifyListeners(entry);

    return entry;
  }

  /**
   * Subscribe to real-time logs and metrics updates.
   */
  static subscribe(listener: (entry: ApiLogEntry | SystemMetricEntry) => void): () => void {
    this.initIfNeeded();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(entry: ApiLogEntry | SystemMetricEntry): void {
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (err) {
        console.warn('[ApiLoggingService] Listener error:', err);
      }
    });
  }

  /**
   * Retrieve stored API logs with optional filtering.
   */
  static getApiLogs(options?: {
    limit?: number;
    endpoint?: string;
    onlyErrors?: boolean;
  }): ApiLogEntry[] {
    this.initIfNeeded();

    let result = [...this.apiLogs];

    if (options?.endpoint) {
      const q = options.endpoint.toLowerCase();
      result = result.filter((l) => l.endpoint.toLowerCase().includes(q));
    }

    if (options?.onlyErrors) {
      result = result.filter((l) => !l.success);
    }

    // Newest first
    result.reverse();

    if (options?.limit && options.limit > 0) {
      return result.slice(0, options.limit);
    }

    return result;
  }

  /**
   * Retrieve system metrics entries.
   */
  static getSystemMetrics(options?: {
    metricName?: SystemMetricEntry['metricName'];
    limit?: number;
  }): SystemMetricEntry[] {
    this.initIfNeeded();

    let result = [...this.systemMetrics];
    if (options?.metricName) {
      result = result.filter((m) => m.metricName === options.metricName);
    }

    result.reverse();

    if (options?.limit && options.limit > 0) {
      return result.slice(0, options.limit);
    }

    return result;
  }

  /**
   * Calculate aggregated API telemetry metrics.
   */
  static getApiMetricsSummary(): ApiMetricsSummary {
    this.initIfNeeded();

    const totalCalls = this.apiLogs.length;
    if (totalCalls === 0) {
      return {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        successRate: 100,
        avgDurationMs: 0,
        slowestDurationMs: 0,
        callsByEndpoint: {},
      };
    }

    let successfulCalls = 0;
    let failedCalls = 0;
    let totalDuration = 0;
    let slowestDurationMs = 0;
    const callsByEndpoint: Record<
      string,
      { count: number; totalDuration: number; avgDurationMs: number; errors: number }
    > = {};

    for (const log of this.apiLogs) {
      if (log.success) {
        successfulCalls++;
      } else {
        failedCalls++;
      }

      totalDuration += log.durationMs;
      if (log.durationMs > slowestDurationMs) {
        slowestDurationMs = log.durationMs;
      }

      const ep = log.endpoint || 'unknown';
      if (!callsByEndpoint[ep]) {
        callsByEndpoint[ep] = { count: 0, totalDuration: 0, avgDurationMs: 0, errors: 0 };
      }
      callsByEndpoint[ep].count += 1;
      callsByEndpoint[ep].totalDuration += log.durationMs;
      if (!log.success) {
        callsByEndpoint[ep].errors += 1;
      }
    }

    // Format callsByEndpoint with average
    const formattedEndpoints: ApiMetricsSummary['callsByEndpoint'] = {};
    for (const [ep, data] of Object.entries(callsByEndpoint)) {
      formattedEndpoints[ep] = {
        count: data.count,
        avgDurationMs: Math.round(data.totalDuration / data.count),
        errors: data.errors,
      };
    }

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: Math.round((successfulCalls / totalCalls) * 100),
      avgDurationMs: Math.round(totalDuration / totalCalls),
      slowestDurationMs,
      callsByEndpoint: formattedEndpoints,
    };
  }

  /**
   * Calculate aggregated system metrics summary (study time & success rate).
   */
  static getSystemMetricsSummary(): SystemMetricsSummary {
    this.initIfNeeded();

    const studyMetrics = this.systemMetrics.filter(
      (m) => m.metricName === 'study_time_minutes' || m.metricName === 'study_time_seconds',
    );
    const successMetrics = this.systemMetrics.filter(
      (m) => m.metricName === 'success_rate_percent',
    );

    let totalMinutes = 0;
    for (const m of studyMetrics) {
      if (m.metricName === 'study_time_minutes') totalMinutes += m.value;
      else if (m.metricName === 'study_time_seconds') totalMinutes += m.value / 60;
    }

    const avgSuccess =
      successMetrics.length > 0
        ? Math.round(successMetrics.reduce((acc, m) => acc + m.value, 0) / successMetrics.length)
        : 100;

    // Build recent snapshots from the last entries
    const recentSnapshots: SystemMetricsSummary['recentSnapshots'] = [];
    const limit = Math.min(10, Math.max(studyMetrics.length, successMetrics.length));

    for (let i = 0; i < limit; i++) {
      const sm = studyMetrics[studyMetrics.length - 1 - i];
      const sc = successMetrics[successMetrics.length - 1 - i];
      const ts = sm?.timestamp || sc?.timestamp || new Date().toISOString();
      const stMin = sm ? (sm.metricName === 'study_time_minutes' ? sm.value : sm.value / 60) : 0;
      const sr = sc ? sc.value : avgSuccess;

      recentSnapshots.push({
        timestamp: ts,
        studyTimeMinutes: Math.round(stMin),
        successRatePercent: Math.round(sr),
      });
    }

    return {
      totalStudyTimeLoggedMinutes: Math.round(totalMinutes),
      averageSuccessRate: avgSuccess,
      totalMetricsRecorded: this.systemMetrics.length,
      recentSnapshots,
    };
  }

  /**
   * Clear all stored logs and metrics safely.
   */
  static clearLogs(): void {
    this.apiLogs = [];
    this.systemMetrics = [];
    if (typeof window !== 'undefined') {
      safeLocalStorage.removeItem(STORAGE_KEY_API_LOGS);
      safeLocalStorage.removeItem(STORAGE_KEY_SYS_METRICS);
    }
  }

  /**
   * Export all logs and metrics as a JSON string for auditing or download.
   */
  static exportLogsAsJson(): string {
    this.initIfNeeded();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        apiLogs: this.apiLogs,
        systemMetrics: this.systemMetrics,
        summary: {
          api: this.getApiMetricsSummary(),
          system: this.getSystemMetricsSummary(),
        },
      },
      null,
      2,
    );
  }

  // Debounced persistence to avoid thrashing localStorage
  private static persistTimer: ReturnType<typeof setTimeout> | null = null;
  private static persistApiLogsDebounced(): void {
    if (typeof window === 'undefined') return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      try {
        safeLocalStorage.setItem(
          STORAGE_KEY_API_LOGS,
          JSON.stringify(this.apiLogs.slice(-MAX_LOG_BUFFER_SIZE)),
        );
      } catch {}
    }, 500);
  }

  private static metricPersistTimer: ReturnType<typeof setTimeout> | null = null;
  private static persistSystemMetricsDebounced(): void {
    if (typeof window === 'undefined') return;
    if (this.metricPersistTimer) clearTimeout(this.metricPersistTimer);
    this.metricPersistTimer = setTimeout(() => {
      try {
        safeLocalStorage.setItem(
          STORAGE_KEY_SYS_METRICS,
          JSON.stringify(this.systemMetrics.slice(-MAX_METRIC_BUFFER_SIZE)),
        );
      } catch {}
    }, 500);
  }
}
