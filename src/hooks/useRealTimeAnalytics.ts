import { useState, useEffect, useCallback } from 'react';
import {
  RealTimeAnalyticsService,
  RealTimeMetricsSnapshot,
} from '../services/RealTimeAnalyticsService';
import {
  PersonalizedAiFeedbackService,
  PersonalizedAiFeedback,
  FeedbackGenerationOptions,
} from '../services/PersonalizedAiFeedbackService';
import {
  ApiLoggingService,
  ApiMetricsSummary,
  SystemMetricsSummary,
} from '../services/ApiLoggingService';
import { ActivityType } from '../services/ActivityLoggingService';
import { useLanguage } from '../context/LanguageContext';

export interface UseRealTimeAnalyticsReturn {
  metrics: RealTimeMetricsSnapshot;
  isSessionActive: boolean;
  startStudySession: (
    activityType: ActivityType,
    title: string,
    metadata?: Record<string, any>,
  ) => string;
  endStudySession: (
    itemsCount?: number,
    successCount?: number,
    metadata?: Record<string, any>,
  ) => void;
  recordActivityEvent: (event: {
    activityType: ActivityType;
    title: string;
    durationSeconds?: number;
    itemsCount?: number;
    successCount?: number;
    xpEarned?: number;
    metadata?: Record<string, any>;
  }) => void;
  latestFeedback: PersonalizedAiFeedback | null;
  isGeneratingFeedback: boolean;
  refreshFeedback: (options?: FeedbackGenerationOptions) => Promise<PersonalizedAiFeedback>;
  apiMetrics: ApiMetricsSummary;
  systemMetrics: SystemMetricsSummary;
  refreshApiMetrics: () => void;
}

export function useRealTimeAnalytics(): UseRealTimeAnalyticsReturn {
  const { language } = useLanguage();
  const [metrics, setMetrics] = useState<RealTimeMetricsSnapshot>(() =>
    RealTimeAnalyticsService.getMetricsSnapshot(),
  );
  const [latestFeedback, setLatestFeedback] = useState<PersonalizedAiFeedback | null>(() =>
    PersonalizedAiFeedbackService.getLatestFeedback(),
  );
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [apiMetrics, setApiMetrics] = useState<ApiMetricsSummary>(() =>
    ApiLoggingService.getApiMetricsSummary(),
  );
  const [systemMetrics, setSystemMetrics] = useState<SystemMetricsSummary>(() =>
    ApiLoggingService.getSystemMetricsSummary(),
  );

  // Subscribe to real-time analytics updates
  useEffect(() => {
    const unsubscribeAnalytics = RealTimeAnalyticsService.subscribe((updatedSnapshot) => {
      setMetrics(updatedSnapshot);
    });

    const unsubscribeApiLogs = ApiLoggingService.subscribe(() => {
      setApiMetrics(ApiLoggingService.getApiMetricsSummary());
      setSystemMetrics(ApiLoggingService.getSystemMetricsSummary());
    });

    return () => {
      unsubscribeAnalytics();
      unsubscribeApiLogs();
    };
  }, []);

  const refreshApiMetrics = useCallback(() => {
    setApiMetrics(ApiLoggingService.getApiMetricsSummary());
    setSystemMetrics(ApiLoggingService.getSystemMetricsSummary());
  }, []);

  const startStudySession = useCallback(
    (activityType: ActivityType, title: string, metadata?: Record<string, any>) => {
      return RealTimeAnalyticsService.startSession(activityType, title, metadata);
    },
    [],
  );

  const endStudySession = useCallback(
    (itemsCount: number = 0, successCount: number = 0, metadata?: Record<string, any>) => {
      RealTimeAnalyticsService.endSession(itemsCount, successCount, metadata);
      refreshApiMetrics();
    },
    [refreshApiMetrics],
  );

  const recordActivityEvent = useCallback(
    (event: {
      activityType: ActivityType;
      title: string;
      durationSeconds?: number;
      itemsCount?: number;
      successCount?: number;
      xpEarned?: number;
      metadata?: Record<string, any>;
    }) => {
      RealTimeAnalyticsService.recordActivity(event);
      refreshApiMetrics();
    },
    [refreshApiMetrics],
  );

  const refreshFeedback = useCallback(
    async (options?: FeedbackGenerationOptions): Promise<PersonalizedAiFeedback> => {
      setIsGeneratingFeedback(true);
      try {
        const feedback = await PersonalizedAiFeedbackService.generateFeedback({
          userLanguage: (language as 'uz' | 'ja' | 'en') || 'uz',
          forceRefresh: true,
          ...options,
        });
        setLatestFeedback(feedback);
        refreshApiMetrics();
        return feedback;
      } finally {
        setIsGeneratingFeedback(false);
      }
    },
    [language, refreshApiMetrics],
  );

  return {
    metrics,
    isSessionActive: metrics.isSessionActive,
    startStudySession,
    endStudySession,
    recordActivityEvent,
    latestFeedback,
    isGeneratingFeedback,
    refreshFeedback,
    apiMetrics,
    systemMetrics,
    refreshApiMetrics,
  };
}
