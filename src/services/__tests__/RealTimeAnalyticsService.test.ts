import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealTimeAnalyticsService } from '../RealTimeAnalyticsService';
import { ApiLoggingService } from '../ApiLoggingService';

describe('RealTimeAnalyticsService', () => {
  beforeEach(() => {
    RealTimeAnalyticsService.resetAll();
    ApiLoggingService.clearLogs();
  });

  it('starts a real-time study session and tracks active duration', () => {
    const sessionId = RealTimeAnalyticsService.startSession('quiz', 'N4 Vocabulary Quiz');
    expect(sessionId).toBeDefined();

    let snapshot = RealTimeAnalyticsService.getMetricsSnapshot();
    expect(snapshot.isSessionActive).toBe(true);
    expect(snapshot.activeSessionType).toBe('quiz');
    expect(snapshot.activeSessionTitle).toBe('N4 Vocabulary Quiz');

    // Heartbeat tick
    RealTimeAnalyticsService.heartbeat(5);
    snapshot = RealTimeAnalyticsService.getMetricsSnapshot();
    expect(snapshot.activeSessionSeconds).toBe(5);
  });

  it('ends study session, calculates success rate, and logs system metrics', () => {
    RealTimeAnalyticsService.startSession('flashcards', 'JLPT N5 Core Vocab');
    RealTimeAnalyticsService.heartbeat(60); // 60 seconds

    const event = RealTimeAnalyticsService.endSession(10, 8); // 8/10 correct = 80%

    expect(event).toBeDefined();
    expect(event?.activityType).toBe('flashcards');
    expect(event?.itemsCount).toBe(10);
    expect(event?.successCount).toBe(8);
    expect(event?.accuracyPercent).toBe(80);
    expect(event?.xpEarned).toBeGreaterThan(0);

    const snapshot = RealTimeAnalyticsService.getMetricsSnapshot();
    expect(snapshot.isSessionActive).toBe(false);
    expect(snapshot.overallSuccessRate).toBe(80);
    expect(snapshot.totalItemsAttempted).toBe(10);
    expect(snapshot.totalItemsSuccessful).toBe(8);
    expect(snapshot.skillBreakdown.flashcards.itemsCount).toBe(10);
    expect(snapshot.skillBreakdown.flashcards.accuracyPercent).toBe(80);
  });

  it('accurately aggregates multiple events and identifies strongest and weakest skills', () => {
    // Event 1: Kanji with 100% accuracy
    RealTimeAnalyticsService.recordActivity({
      activityType: 'kanji',
      title: 'Kanji Grade 1 Practice',
      durationSeconds: 120,
      itemsCount: 10,
      successCount: 10,
    });

    // Event 2: Grammar Quiz with 40% accuracy
    RealTimeAnalyticsService.recordActivity({
      activityType: 'quiz',
      title: 'Minna Lesson 15 Grammar',
      durationSeconds: 180,
      itemsCount: 10,
      successCount: 4,
    });

    const snapshot = RealTimeAnalyticsService.getMetricsSnapshot();

    expect(snapshot.totalItemsAttempted).toBe(20);
    expect(snapshot.totalItemsSuccessful).toBe(14);
    expect(snapshot.overallSuccessRate).toBe(70); // 14/20 = 70%

    expect(snapshot.skillBreakdown.kanji.accuracyPercent).toBe(100);
    expect(snapshot.skillBreakdown.quiz.accuracyPercent).toBe(40);

    expect(snapshot.strongestSkill).toBe('kanji');
    expect(snapshot.weakestSkill).toBe('quiz');
  });

  it('notifies subscribers immediately when state changes', () => {
    const listener = vi.fn();
    const unsubscribe = RealTimeAnalyticsService.subscribe(listener);

    // Initial subscriber call
    expect(listener).toHaveBeenCalledTimes(1);

    RealTimeAnalyticsService.recordActivity({
      activityType: 'speaking',
      title: 'Roleplay at Coffee Shop',
      durationSeconds: 60,
      itemsCount: 3,
      successCount: 3,
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0].totalItemsAttempted).toBe(3);

    unsubscribe();
  });
});
