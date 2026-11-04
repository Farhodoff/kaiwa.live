import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PushNotificationService } from '../PushNotificationService';

describe('PushNotificationService PWA & Web Push', () => {
  let originalNotification: any;

  beforeEach(() => {
    vi.clearAllMocks();

    originalNotification = (globalThis as any).Notification;
    const MockNotification = vi.fn(function (this: any, title: string, options?: any) {
      this.title = title;
      this.options = options;
      this.close = vi.fn();
      this.onclick = null;
    }) as any;
    MockNotification.permission = 'granted';
    MockNotification.requestPermission = vi.fn().mockResolvedValue('granted');

    (globalThis as any).Notification = MockNotification;
    (window as any).Notification = MockNotification;
  });

  afterEach(() => {
    (globalThis as any).Notification = originalNotification;
    (window as any).Notification = originalNotification;
  });

  it('identifies notification support and granted permissions', () => {
    expect(PushNotificationService.isSupported()).toBe(true);
    expect(PushNotificationService.getPermission()).toBe('granted');
  });

  it('requests user permission successfully', async () => {
    const permission = await PushNotificationService.requestPermission();
    expect(permission).toBe('granted');
    expect((globalThis as any).Notification.requestPermission).toHaveBeenCalled();
  });

  it('sends sync notification and sets tag for OS deduplication', () => {
    const sent = PushNotificationService.sendNotification('Test Title', { tag: 'test-tag' });
    expect(sent).toBe(true);
    expect((globalThis as any).Notification).toHaveBeenCalledWith(
      'Test Title',
      expect.objectContaining({
        tag: 'test-tag',
        icon: '/icons/icon-192x192.png',
      }),
    );
  });

  it('sends streak reminder and SRS flashcards due reminder with deduplication tags', () => {
    const streakSent = PushNotificationService.sendStreakReminder(7);
    expect(streakSent).toBe(true);
    expect((globalThis as any).Notification).toHaveBeenCalledWith(
      expect.stringContaining('Streak'),
      expect.objectContaining({ tag: 'streak-reminder' }),
    );

    const srsSent = PushNotificationService.sendFlashcardsDueReminder(15);
    expect(srsSent).toBe(true);
    expect((globalThis as any).Notification).toHaveBeenCalledWith(
      expect.stringContaining('Fleshkartalarni Takrorlash'),
      expect.objectContaining({ tag: 'srs-due-reminder' }),
    );
  });

  it('sends notification asynchronously via Service Worker showNotification if available', async () => {
    const mockShowNotification = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({ showNotification: mockShowNotification }),
      },
      writable: true,
      configurable: true,
    });

    const asyncSent = await PushNotificationService.sendNotificationAsync('Async Title', {
      tag: 'async-tag',
    });
    expect(asyncSent).toBe(true);
    expect(mockShowNotification).toHaveBeenCalledWith(
      'Async Title',
      expect.objectContaining({ tag: 'async-tag' }),
    );
  });
});
