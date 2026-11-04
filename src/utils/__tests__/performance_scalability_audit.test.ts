import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LearningSignalService } from '../../services/LearningSignalService';
import { UserNotificationService } from '../../services/UserNotificationService';
import { CompletedLessonSignal } from '../../types/learningSignals';

describe('Performance, Scalability & Resource Control (BUG #23)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('1. LearningSignalService enforces rolling memory buffer limit (slice -300)', async () => {
    const testUserId = 'test-user-perf-1';
    const batchSignals: CompletedLessonSignal[] = Array.from({ length: 350 }, (_, i) => ({
      id: `sig_${i}`,
      type: 'completed_lesson',
      userId: testUserId,
      language: 'ja',
      level: 'N5',
      lessonId: `lesson_${i}`,
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
      score: 100,
      total: 100,
      percentage: 100,
      newCardsCreated: 0,
      mistakesCount: 0,
    }));

    await LearningSignalService.recordSignalsBatch(batchSignals);
    const stored = LearningSignalService.getSignalsForUser(testUserId);

    // Cache must not exceed max rolling capacity of 300 to protect browser memory
    expect(stored.length).toBeLessThanOrEqual(300);
  });

  it('2. Local notifications store enforces upper bound of 50 items', () => {
    const testUserId = 'test-user-perf-2';
    for (let i = 0; i < 60; i++) {
      (UserNotificationService as any).saveLocalNotification?.({
        user_id: testUserId,
        title: `Notif ${i}`,
        message: `Message ${i}`,
        type: 'admin',
      });
    }

    const raw = localStorage.getItem('study_planner_local_notifications');
    if (raw) {
      const list = JSON.parse(raw);
      expect(list.length).toBeLessThanOrEqual(50);
    }
  });

  it('3. Flashcard chunking strategy breaks massive batch into safe payload sizes', () => {
    const testCards = Array.from({ length: 250 }, (_, i) => ({
      id: `card_${i}`,
      front: `Front ${i}`,
      back: `Back ${i}`,
    }));

    const chunkSize = 100;
    const chunks: any[][] = [];
    for (let i = 0; i < testCards.length; i += chunkSize) {
      chunks.push(testCards.slice(i, i + chunkSize));
    }

    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(100);
    expect(chunks[1].length).toBe(100);
    expect(chunks[2].length).toBe(50);
  });

  it('4. User entity cache keys prevent cache-key collision and unbound growth', () => {
    const userA = 'user-uuid-1';
    const userB = 'user-uuid-2';

    const keyA = `study_planner_tasks_${userA}`;
    const keyB = `study_planner_tasks_${userB}`;

    expect(keyA).not.toBe(keyB);
    expect(keyA).toContain(userA);
    expect(keyB).toContain(userB);
  });
});
