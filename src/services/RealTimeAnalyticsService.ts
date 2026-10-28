import { safeLocalStorage } from '../utils/storage/safeLocalStorage';
import { ActivityLoggingService, ActivityType } from './ActivityLoggingService';
import { ApiLoggingService } from './ApiLoggingService';
import { generateUUID } from '../utils/uuid';
import { format } from 'date-fns';

export interface RealTimeActivityEvent {
  id: string;
  timestamp: string; // ISO string
  activityType: ActivityType;
  title: string;
  durationSeconds: number;
  itemsCount: number;
  successCount: number;
  accuracyPercent: number; // 0..100
  xpEarned: number;
  metadata?: Record<string, any>;
}

export interface SkillPerformance {
  activityType: ActivityType;
  itemsCount: number;
  successCount: number;
  accuracyPercent: number;
  durationMinutes: number;
}

export interface RealTimeMetricsSnapshot {
  todayStudyTimeMinutes: number;
  todayStudyTimeSeconds: number;
  activeSessionSeconds: number;
  isSessionActive: boolean;
  activeSessionType?: ActivityType;
  activeSessionTitle?: string;
  activeSessionStartedAt?: string;
  overallSuccessRate: number; // 0..100
  totalItemsAttempted: number;
  totalItemsSuccessful: number;
  skillBreakdown: Record<ActivityType, SkillPerformance>;
  performanceTrend: 'improving' | 'stable' | 'needs_attention';
  weakestSkill: string;
  strongestSkill: string;
  recentEvents: RealTimeActivityEvent[];
  streakDays: number;
  lastActiveTimestamp: string;
}

const STORAGE_KEY_EVENTS = 'nihongo_rt_analytics_events_v1';
const STORAGE_KEY_ACTIVE_SESSION = 'nihongo_rt_active_session_v1';
const MAX_EVENTS_IN_MEMORY = 100;

export class RealTimeAnalyticsService {
  private static events: RealTimeActivityEvent[] = [];
  private static activeSession: {
    id: string;
    startedAt: number; // timestamp ms
    activityType: ActivityType;
    title: string;
    accumulatedSeconds: number;
    metadata?: Record<string, any>;
  } | null = null;

  private static tickerTimer: ReturnType<typeof setInterval> | null = null;
  private static listeners: Set<(snapshot: RealTimeMetricsSnapshot) => void> = new Set();
  private static isInitialized = false;

  private static initIfNeeded(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window === 'undefined') return;

    // 1. Load cached events
    try {
      const rawEvents = safeLocalStorage.getItem(STORAGE_KEY_EVENTS);
      if (rawEvents) {
        const parsed = JSON.parse(rawEvents);
        if (Array.isArray(parsed)) {
          this.events = parsed.slice(-MAX_EVENTS_IN_MEMORY);
        }
      }
    } catch {
      this.events = [];
    }

    // 2. Restore any unfinished active session
    try {
      const rawSession = safeLocalStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        // If session was saved within the last 2 hours, keep it alive
        if (parsed?.startedAt && Date.now() - parsed.startedAt < 2 * 60 * 60 * 1000) {
          const elapsedSec = Math.max(0, Math.floor((Date.now() - parsed.startedAt) / 1000));
          this.activeSession = {
            ...parsed,
            accumulatedSeconds: parsed.accumulatedSeconds || elapsedSec,
          };
          this.startTicker();
        } else {
          safeLocalStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
        }
      }
    } catch {
      this.activeSession = null;
    }
  }

  /**
   * Start a real-time study session (e.g. starting a quiz, flashcard review, speaking practice, or focus timer).
   */
  static startSession(
    activityType: ActivityType,
    title: string,
    metadata?: Record<string, any>,
  ): string {
    this.initIfNeeded();

    // If an existing session is running, finalize it before starting a new one
    if (this.activeSession) {
      this.endSession(0, 0, { autoClosed: true });
    }

    const sessionId = generateUUID();
    this.activeSession = {
      id: sessionId,
      startedAt: Date.now(),
      activityType,
      title: title || `${activityType.toUpperCase()} Session`,
      accumulatedSeconds: 0,
      metadata,
    };

    this.persistActiveSession();
    this.startTicker();
    this.emitUpdate();

    return sessionId;
  }

  /**
   * Record a heartbeat tick for the currently active session.
   */
  static heartbeat(deltaSeconds: number = 1): void {
    if (!this.activeSession) return;
    this.activeSession.accumulatedSeconds += Math.max(1, Math.round(deltaSeconds));
    this.persistActiveSession();
    this.emitUpdate();
  }

  /**
   * End the current active session, compute metrics, award XP, and log to system.
   */
  static endSession(
    itemsCount: number = 0,
    successCount: number = 0,
    additionalMetadata?: Record<string, any>,
  ): RealTimeActivityEvent | null {
    this.initIfNeeded();

    if (!this.activeSession) return null;

    const session = this.activeSession;
    const durationSeconds = Math.max(
      session.accumulatedSeconds,
      Math.floor((Date.now() - session.startedAt) / 1000),
    );
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

    const safeItems = Math.max(0, itemsCount);
    const safeSuccess = Math.min(safeItems, Math.max(0, successCount));
    const accuracyPercent = safeItems > 0 ? Math.round((safeSuccess / safeItems) * 100) : 100;

    // Calculate base XP
    let xpEarned = Math.max(5, durationMinutes * 2);
    if (session.activityType === 'speaking') {
      const calc = ActivityLoggingService.calculateSpeakingXP(durationSeconds, accuracyPercent);
      xpEarned = calc.xp;
    } else if (session.activityType === 'flashcards') {
      const milestone = ActivityLoggingService.calculateFlashcardMilestoneXP(safeItems);
      xpEarned = Math.max(xpEarned, safeSuccess + milestone.milestoneXp);
    } else if (session.activityType === 'quiz' || session.activityType === 'exam') {
      xpEarned = safeSuccess * 3 + (accuracyPercent >= 80 ? 20 : 5);
    }

    const event: RealTimeActivityEvent = {
      id: session.id,
      timestamp: new Date().toISOString(),
      activityType: session.activityType,
      title: session.title,
      durationSeconds,
      itemsCount: safeItems,
      successCount: safeSuccess,
      accuracyPercent,
      xpEarned,
      metadata: {
        ...(session.metadata || {}),
        ...(additionalMetadata || {}),
      },
    };

    this.events.push(event);
    if (this.events.length > MAX_EVENTS_IN_MEMORY) {
      this.events.shift();
    }

    // Persist to ActivityLoggingService (Supabase & LocalStorage)
    ActivityLoggingService.logActivity({
      id: event.id,
      activityType: event.activityType,
      activityTitle: event.title,
      durationMinutes,
      itemsCount: safeItems,
      xpEarned,
      metadata: event.metadata,
      createdAt: event.timestamp,
    }).catch((err) => console.warn('[RealTimeAnalytics] Failed to log activity:', err));

    // Log system metric to ApiLoggingService
    ApiLoggingService.logSystemMetric({
      metricName: 'study_time_minutes',
      value: durationMinutes,
      unit: 'minutes',
      tags: { activityType: event.activityType },
    });

    if (safeItems > 0) {
      ApiLoggingService.logSystemMetric({
        metricName: 'success_rate_percent',
        value: accuracyPercent,
        unit: 'percent',
        tags: { activityType: event.activityType },
      });
    }

    // Clear active session
    this.stopTicker();
    this.activeSession = null;
    safeLocalStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    this.persistEvents();
    this.emitUpdate();

    return event;
  }

  /**
   * Record a fine-grained instant activity event without managing a prolonged session.
   * Useful for quick quizzes, single flashcard review, or audio practice.
   */
  static recordActivity(eventInput: {
    activityType: ActivityType;
    title: string;
    durationSeconds?: number;
    itemsCount?: number;
    successCount?: number;
    xpEarned?: number;
    metadata?: Record<string, any>;
  }): RealTimeActivityEvent {
    this.initIfNeeded();

    const durationSeconds = Math.max(0, eventInput.durationSeconds || 30);
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
    const itemsCount = Math.max(1, eventInput.itemsCount || 1);
    const successCount = Math.min(itemsCount, Math.max(0, eventInput.successCount ?? itemsCount));
    const accuracyPercent = Math.round((successCount / itemsCount) * 100);
    const xpEarned = eventInput.xpEarned ?? successCount * 2 + (accuracyPercent >= 80 ? 5 : 0);

    const event: RealTimeActivityEvent = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      activityType: eventInput.activityType,
      title: eventInput.title,
      durationSeconds,
      itemsCount,
      successCount,
      accuracyPercent,
      xpEarned,
      metadata: eventInput.metadata,
    };

    this.events.push(event);
    if (this.events.length > MAX_EVENTS_IN_MEMORY) {
      this.events.shift();
    }

    // Persist
    ActivityLoggingService.logActivity({
      id: event.id,
      activityType: event.activityType,
      activityTitle: event.title,
      durationMinutes,
      itemsCount,
      xpEarned,
      metadata: event.metadata,
      createdAt: event.timestamp,
    }).catch((err) => console.warn('[RealTimeAnalytics] Error logging activity:', err));

    // Log metrics
    ApiLoggingService.logSystemMetric({
      metricName: 'study_time_minutes',
      value: durationMinutes,
      unit: 'minutes',
      tags: { activityType: event.activityType },
    });

    ApiLoggingService.logSystemMetric({
      metricName: 'success_rate_percent',
      value: accuracyPercent,
      unit: 'percent',
      tags: { activityType: event.activityType },
    });

    this.persistEvents();
    this.emitUpdate();

    return event;
  }

  /**
   * Get the real-time aggregated metrics snapshot.
   */
  static getMetricsSnapshot(): RealTimeMetricsSnapshot {
    this.initIfNeeded();

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Filter events for today
    const todayEvents = this.events.filter((e) => e.timestamp.startsWith(todayStr));

    // Calculate today's study time
    let todayStudySeconds = todayEvents.reduce((acc, e) => acc + e.durationSeconds, 0);

    // Add current live session seconds if running
    const activeSec = this.activeSession?.accumulatedSeconds || 0;
    todayStudySeconds += activeSec;

    const todayStudyMinutes = Math.round(todayStudySeconds / 60);

    // Calculate overall success rate
    let totalAttempted = 0;
    let totalSuccessful = 0;

    const skillMap: Record<ActivityType, SkillPerformance> = {
      flashcards: {
        activityType: 'flashcards',
        itemsCount: 0,
        successCount: 0,
        accuracyPercent: 100,
        durationMinutes: 0,
      },
      speaking: {
        activityType: 'speaking',
        itemsCount: 0,
        successCount: 0,
        accuracyPercent: 100,
        durationMinutes: 0,
      },
      focus: {
        activityType: 'focus',
        itemsCount: 0,
        successCount: 0,
        accuracyPercent: 100,
        durationMinutes: 0,
      },
      lesson: {
        activityType: 'lesson',
        itemsCount: 0,
        successCount: 0,
        accuracyPercent: 100,
        durationMinutes: 0,
      },
      quiz: {
        activityType: 'quiz',
        itemsCount: 0,
        successCount: 0,
        accuracyPercent: 100,
        durationMinutes: 0,
      },
      exam: {
        activityType: 'exam',
        itemsCount: 0,
        successCount: 0,
        accuracyPercent: 100,
        durationMinutes: 0,
      },
      kanji: {
        activityType: 'kanji',
        itemsCount: 0,
        successCount: 0,
        accuracyPercent: 100,
        durationMinutes: 0,
      },
      listening: {
        activityType: 'listening',
        itemsCount: 0,
        successCount: 0,
        accuracyPercent: 100,
        durationMinutes: 0,
      },
    };

    // Aggregate over recent events (last 50)
    for (const ev of this.events) {
      totalAttempted += ev.itemsCount;
      totalSuccessful += ev.successCount;

      const skill = skillMap[ev.activityType];
      if (skill) {
        skill.itemsCount += ev.itemsCount;
        skill.successCount += ev.successCount;
        skill.durationMinutes += Math.round(ev.durationSeconds / 60);
      }
    }

    // Recompute accuracy % per skill
    for (const skill of Object.values(skillMap)) {
      if (skill.itemsCount > 0) {
        skill.accuracyPercent = Math.round((skill.successCount / skill.itemsCount) * 100);
      }
    }

    const overallSuccessRate =
      totalAttempted > 0 ? Math.round((totalSuccessful / totalAttempted) * 100) : 100;

    // Detect weakest and strongest areas
    let weakestSkill = 'Grammar & Quizzes';
    let minAcc = 101;
    let strongestSkill = 'General Study';
    let maxAcc = -1;

    for (const [type, data] of Object.entries(skillMap)) {
      if (data.itemsCount > 0) {
        if (data.accuracyPercent < minAcc) {
          minAcc = data.accuracyPercent;
          weakestSkill = type;
        }
        if (data.accuracyPercent > maxAcc) {
          maxAcc = data.accuracyPercent;
          strongestSkill = type;
        }
      }
    }

    // Determine performance trend (comparing last 5 events to previous 10)
    let performanceTrend: 'improving' | 'stable' | 'needs_attention' = 'stable';
    if (this.events.length >= 6) {
      const recentSlice = this.events.slice(-3);
      const olderSlice = this.events.slice(-8, -3);

      const recentAcc =
        recentSlice.reduce((a, b) => a + b.accuracyPercent, 0) / (recentSlice.length || 1);
      const olderAcc =
        olderSlice.reduce((a, b) => a + b.accuracyPercent, 0) / (olderSlice.length || 1);

      if (recentAcc >= olderAcc + 5) {
        performanceTrend = 'improving';
      } else if (recentAcc <= olderAcc - 10) {
        performanceTrend = 'needs_attention';
      }
    }

    // Calculate streak
    const uniqueDays = new Set(this.events.map((e) => e.timestamp.split('T')[0]));
    const streakDays = Math.max(1, uniqueDays.size);

    return {
      todayStudyTimeMinutes: todayStudyMinutes,
      todayStudyTimeSeconds: todayStudySeconds,
      activeSessionSeconds: activeSec,
      isSessionActive: Boolean(this.activeSession),
      activeSessionType: this.activeSession?.activityType,
      activeSessionTitle: this.activeSession?.title,
      activeSessionStartedAt: this.activeSession
        ? new Date(this.activeSession.startedAt).toISOString()
        : undefined,
      overallSuccessRate,
      totalItemsAttempted: totalAttempted,
      totalItemsSuccessful: totalSuccessful,
      skillBreakdown: skillMap,
      performanceTrend,
      weakestSkill,
      strongestSkill,
      recentEvents: [...this.events].reverse().slice(0, 20),
      streakDays,
      lastActiveTimestamp:
        this.events[this.events.length - 1]?.timestamp || new Date().toISOString(),
    };
  }

  /**
   * Subscribe to real-time analytics updates.
   */
  static subscribe(listener: (snapshot: RealTimeMetricsSnapshot) => void): () => void {
    this.initIfNeeded();
    this.listeners.add(listener);

    // Initial trigger
    try {
      listener(this.getMetricsSnapshot());
    } catch {}

    return () => {
      this.listeners.delete(listener);
    };
  }

  private static emitUpdate(): void {
    const snapshot = this.getMetricsSnapshot();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.warn('[RealTimeAnalytics] Listener dispatch error:', err);
      }
    });
  }

  private static startTicker(): void {
    if (this.tickerTimer) return;
    this.tickerTimer = setInterval(() => {
      if (this.activeSession) {
        this.activeSession.accumulatedSeconds += 1;
        this.emitUpdate();
      }
    }, 1000);
  }

  private static stopTicker(): void {
    if (this.tickerTimer) {
      clearInterval(this.tickerTimer);
      this.tickerTimer = null;
    }
  }

  private static persistActiveSession(): void {
    if (typeof window === 'undefined') return;
    try {
      if (this.activeSession) {
        safeLocalStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(this.activeSession));
      } else {
        safeLocalStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
      }
    } catch {}
  }

  private static persistEvents(): void {
    if (typeof window === 'undefined') return;
    try {
      safeLocalStorage.setItem(
        STORAGE_KEY_EVENTS,
        JSON.stringify(this.events.slice(-MAX_EVENTS_IN_MEMORY)),
      );
    } catch {}
  }

  /**
   * Clear recorded analytics state (for testing or profile reset).
   */
  static resetAll(): void {
    this.stopTicker();
    this.activeSession = null;
    this.events = [];
    if (typeof window !== 'undefined') {
      safeLocalStorage.removeItem(STORAGE_KEY_EVENTS);
      safeLocalStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    }
    this.emitUpdate();
  }
}
