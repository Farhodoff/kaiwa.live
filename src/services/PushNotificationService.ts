import { Event } from '../types';
import { subMinutes, isBefore, isEqual, isAfter, format } from 'date-fns';

export class PushNotificationService {
  private static checkInterval: number | null = null;
  private static inactivityInterval: number | null = null;
  /**
   * Checks if Notifications API is supported in current browser/device
   */
  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      (typeof Notification !== 'undefined' || 'Notification' in window)
    );
  }

  /**
   * Gets current notification permission status ('granted', 'denied', 'default')
   */
  public static getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Requests push notification permission from the user
   */
  public static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.error('Notification permission request error:', e);
      return 'denied';
    }
  }

  /**
   * Triggers a live Push Notification immediately (sync fallback)
   */
  public static sendNotification(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported() || this.getPermission() !== 'granted') {
      console.warn('Notifications not granted or supported.');
      return false;
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => {
            if (reg && 'showNotification' in reg) {
              reg.showNotification(title, {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                ...options,
              });
            }
          })
          .catch(() => {});
      }

      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (e) {
      console.error('Error triggering notification:', e);
      return false;
    }
  }

  /**
   * Triggers a live Push Notification asynchronously using Service Worker where possible
   */
  public static async sendNotificationAsync(
    title: string,
    options?: NotificationOptions,
  ): Promise<boolean> {
    if (!this.isSupported() || this.getPermission() !== 'granted') {
      return false;
    }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready.catch(() => null);
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            ...options,
          });
          return true;
        }
      }

      return this.sendNotification(title, options);
    } catch (e) {
      console.error('Error triggering async notification:', e);
      return false;
    }
  }

  /**
   * Triggers a Test Notification for user verification
   */
  public static sendTestNotification(): boolean {
    return this.sendNotification('kaiwa.live 🔔 Test Bildirishnomasi', {
      body: 'Tabriklaymiz! Mobil va brauzer bildirishnomalari muvaffaqiyatli ulindi. 🔥',
      tag: 'test-notification',
    });
  }

  /**
   * Sends Daily Streak Reminder (e.g. at 19:00)
   */
  public static sendStreakReminder(streakDays: number): boolean {
    return this.sendNotification("Kunlik O'quv Zanjiri (Streak) 🔥", {
      body: `Sizning joriy zanjiringiz: ${streakDays} kun! Bugungi darslaringizni bajarib zanjirni uzmang! 📚`,
      tag: 'streak-reminder',
    });
  }

  /**
   * Sends SRS Flashcards Due Reminder
   */
  public static sendFlashcardsDueReminder(dueCount: number): boolean {
    if (dueCount <= 0) return false;
    return this.sendNotification('Fleshkartalarni Takrorlash Vaqti 🧠', {
      body: `Sizda bugun takrorlash uchun ${dueCount} ta so'z tayyor turibdi. 5 daqiqa ajrating va esda saqlab qoling! ⚡`,
      tag: 'srs-due-reminder',
    });
  }

  /**
   * Sends Upcoming Task Reminder
   */
  public static sendTaskReminder(taskTitle: string, minutesLeft: number = 15): boolean {
    return this.sendNotification('⚠️ Yaqinlashayotgan Dars Eslatmasi', {
      body: `"${taskTitle}" topshirig'i boshlanishiga ${minutesLeft} daqiqa qoldi!`,
      tag: 'task-reminder',
    });
  }

  public static startMonitoring(events: Event[], updateEventCallback: (id: string) => void) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every 60 seconds
    this.checkInterval = window.setInterval(() => {
      this.checkEvents(events, updateEventCallback);
    }, 60000);

    // Initial check
    this.checkEvents(events, updateEventCallback);
  }

  private static checkEvents(events: Event[], updateEventCallback: (id: string) => void) {
    const now = new Date();

    events.forEach((event) => {
      if (event.isNotified) return;

      const eventTime = new Date(event.eventDate);
      const notifyTime = subMinutes(eventTime, event.notifyBeforeMinutes);

      // Check if we should notify (now is same or after notifyTime AND now is before eventTime)
      if ((isEqual(now, notifyTime) || isAfter(now, notifyTime)) && isBefore(now, eventTime)) {
        this.sendNotification(event.title, {
          body: `${event.description || ''}\n${format(eventTime, 'HH:mm')} da boshlanadi`,
          tag: event.id,
          requireInteraction: event.notifyBeforeMinutes >= 60,
        });

        // Mark as notified
        updateEventCallback(event.id);
      }
    });
  }

  public static startInactivityTracker(inactivityMinutes: number = 10) {
    if (typeof window === 'undefined') return;

    if (this.inactivityInterval) {
      clearInterval(this.inactivityInterval);
    }

    let lastActivityTime = Date.now();
    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    // Track user interactions
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Check inactivity every 2 minutes
    this.inactivityInterval = window.setInterval(() => {
      const idleTimeMinutes = (Date.now() - lastActivityTime) / (1000 * 60);

      // Check if user has been idle or hasn't started focus session
      if (idleTimeMinutes >= inactivityMinutes) {
        const messages = [
          'Hey! Dars qilmayapsan 📚 Focus taymerini yoqishni unutmang!',
          "Hoy o'quvchi! Yapon tili maqsadlaringiz sizni kutmoqda 🎯 Qani darsga!",
          "Vaqt o'tyapti! Bugungi rejadagi topshiriqlarni yakunlab qo'yaylik 🚀",
          'Ozroq diqqatni jamlab, 25 daqiqalik Pomodoro seansini boshlaymizmi? ⏱️',
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];

        this.sendNotification('Hey, dars qilmayapsan! 📚', {
          body: randomMsg,
          requireInteraction: true,
        });

        // Reset timer so it doesn't spam every minute
        lastActivityTime = Date.now();
      }
    }, 120000);
  }

  public static stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.inactivityInterval) {
      clearInterval(this.inactivityInterval);
      this.inactivityInterval = null;
    }
  }
}
