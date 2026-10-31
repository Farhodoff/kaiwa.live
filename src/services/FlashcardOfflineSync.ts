import { idbGet, idbSet, idbDelete } from '../utils/storage/indexedDb';
import { supabase } from '../lib/supabase';
import { toast } from '../hooks/use-toast';

export interface QueuedFlashcardUpdate {
  id: string;
  updates: Record<string, any>;
  timestamp: number;
  retryCount?: number;
  nextRetryTime?: number;
  lastError?: string;
}

const BACKOFF_SCHEDULE = [2000, 5000, 15000, 60000]; // 2s, 5s, 15s, 60s
const calculateBackoff = (retryCount: number): number => {
  const index = Math.min(Math.max(0, retryCount - 1), BACKOFF_SCHEDULE.length - 1);
  return Date.now() + BACKOFF_SCHEDULE[index];
};

const OFFLINE_QUEUE_KEY = 'study_planner_flashcard_offline_queue';
let isSyncing = false;
let isListenerInitialized = false;

export const FlashcardOfflineSync = {
  /**
   * Enqueues an offline flashcard mutation into IndexedDB.
   */
  async enqueueUpdate(id: string, updates: Record<string, any>): Promise<void> {
    try {
      const queue = (await idbGet<QueuedFlashcardUpdate[]>(OFFLINE_QUEUE_KEY)) || [];
      // Replace existing update for the same card ID or push new
      const existingIdx = queue.findIndex((item) => item.id === id);
      if (existingIdx >= 0) {
        queue[existingIdx] = {
          id,
          updates: { ...queue[existingIdx].updates, ...updates },
          timestamp: Date.now(),
        };
      } else {
        queue.push({ id, updates, timestamp: Date.now() });
      }
      await idbSet(OFFLINE_QUEUE_KEY, queue);
    } catch (e) {
      console.warn('[FlashcardOfflineSync] Failed to enqueue offline update:', e);
    }
  },

  /**
   * Retrieves pending offline updates count.
   */
  async getPendingCount(): Promise<number> {
    try {
      const queue = await idbGet<QueuedFlashcardUpdate[]>(OFFLINE_QUEUE_KEY);
      return queue ? queue.length : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Retrieves all pending offline updates.
   */
  async getPendingUpdates(): Promise<QueuedFlashcardUpdate[]> {
    try {
      const queue = await idbGet<QueuedFlashcardUpdate[]>(OFFLINE_QUEUE_KEY);
      return queue && Array.isArray(queue) ? queue : [];
    } catch {
      return [];
    }
  },

  /**
   * Clears the offline queue (primarily for test resets).
   */
  async clearQueue(): Promise<void> {
    try {
      await idbDelete(OFFLINE_QUEUE_KEY);
    } catch {}
  },

  /**
   * Syncs all queued updates to Supabase when network is restored.
   */
  async syncPending(forceManual = false): Promise<{ synced: number; failed: number }> {
    if (isSyncing) return { synced: 0, failed: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const queue = (await idbGet<QueuedFlashcardUpdate[]>(OFFLINE_QUEUE_KEY)) || [];
      if (queue.length === 0) {
        isSyncing = false;
        return { synced: 0, failed: 0 };
      }

      const remaining: QueuedFlashcardUpdate[] = [];
      const now = Date.now();

      for (const item of queue) {
        if (!forceManual && item.nextRetryTime && now < item.nextRetryTime) {
          remaining.push(item);
          continue;
        }

        try {
          const { error } = await supabase
            .from('flashcards')
            .update(item.updates)
            .eq('id', item.id);
          if (error) {
            item.retryCount = (item.retryCount || 0) + 1;
            item.nextRetryTime = calculateBackoff(item.retryCount);
            item.lastError = error.message;
            remaining.push(item);
            failed++;
          } else {
            synced++;
          }
        } catch (e: any) {
          item.retryCount = (item.retryCount || 0) + 1;
          item.nextRetryTime = calculateBackoff(item.retryCount);
          item.lastError = e?.message || 'Network error';
          remaining.push(item);
          failed++;
        }
      }

      await idbSet(OFFLINE_QUEUE_KEY, remaining);

      if (synced > 0 && typeof window !== 'undefined') {
        try {
          toast({
            title: '✅ Sinxronlash muvaffaqiyatli',
            description: `${synced} ta oflayn takrorlangan kartochka saqlandi.`,
          });
        } catch {}
      }
    } catch (e) {
      console.warn('[FlashcardOfflineSync] Sync error:', e);
    } finally {
      isSyncing = false;
    }

    return { synced, failed };
  },

  /**
   * Attaches automatic online reconnection listener.
   */
  initAutoSync(): void {
    if (isListenerInitialized || typeof window === 'undefined') return;
    isListenerInitialized = true;

    window.addEventListener('online', () => {
      FlashcardOfflineSync.syncPending();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        FlashcardOfflineSync.syncPending();
      }
    });

    // Also trigger immediately if online
    if (navigator.onLine) {
      FlashcardOfflineSync.syncPending();
    }
  },

  // ─── Full Deck Cache (IndexedDB) ─────────────────────────────────

  /**
   * Caches the full flashcard deck to IndexedDB for offline access.
   * Called after every successful Supabase fetch to keep the cache fresh.
   */
  async cacheDeck(userId: string, cards: import('../types').Flashcard[]): Promise<void> {
    try {
      await idbSet(`study_planner_deck_cache_${userId}`, {
        cards,
        cachedAt: Date.now(),
        version: 1,
      });
    } catch (e) {
      console.warn('[FlashcardOfflineSync] Failed to cache deck to IDB:', e);
    }
  },

  /**
   * Retrieves the cached deck from IndexedDB for offline use.
   * Returns null if no cached deck exists.
   */
  async getCachedDeck(
    userId: string,
  ): Promise<{ cards: import('../types').Flashcard[]; cachedAt: number } | null> {
    try {
      const cached = await idbGet<{
        cards: import('../types').Flashcard[];
        cachedAt: number;
        version: number;
      }>(`study_planner_deck_cache_${userId}`);
      if (cached && cached.cards && cached.cards.length > 0) {
        return { cards: cached.cards, cachedAt: cached.cachedAt };
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Returns the offline status summary for the UI indicator.
   */
  async getOfflineStatus(userId?: string): Promise<{
    pendingReviews: number;
    cachedCards: number;
    lastCachedAt: number | null;
    isOnline: boolean;
  }> {
    const pendingReviews = await this.getPendingCount();
    let cachedCards = 0;
    let lastCachedAt: number | null = null;

    if (userId) {
      const cached = await this.getCachedDeck(userId);
      if (cached) {
        cachedCards = cached.cards.length;
        lastCachedAt = cached.cachedAt;
      }
    }

    return {
      pendingReviews,
      cachedCards,
      lastCachedAt,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
  },
};
