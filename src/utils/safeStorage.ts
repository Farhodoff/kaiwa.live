/**
 * Safe localStorage wrapper with automatic error handling,
 * quota management, LRU eviction for temporary AI cache,
 * and safe JSON parsing/serialization.
 */

export const safeStorage = {
  /**
   * Safely get and parse JSON from localStorage
   */
  getItem<T = unknown>(key: string, defaultValue: T | null = null): T | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }
      const item = window.localStorage.getItem(key);
      if (item === null) return defaultValue;
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    } catch (e) {
      console.warn(`[safeStorage] Error getting key "${key}":`, e);
      return defaultValue;
    }
  },

  /**
   * Safely store data in localStorage with QuotaExceeded eviction
   */
  setItem(key: string, value: unknown): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (e: any) {
      console.warn(`[safeStorage] Quota or error setting key "${key}":`, e?.message || e);

      // If quota exceeded, try evicting temporary cache entries
      if (
        e?.name === 'QuotaExceededError' ||
        e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        e?.code === 22 ||
        e?.code === 1014
      ) {
        this.evictTemporaryCache();
        try {
          const serialized = typeof value === 'string' ? value : JSON.stringify(value);
          window.localStorage.setItem(key, serialized);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  },

  /**
   * Safely remove a key from localStorage
   */
  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[safeStorage] Error removing key "${key}":`, e);
      return false;
    }
  },

  /**
   * Evicts expired or old temporary cache keys (e.g. AI cache, temporary logs)
   */
  evictTemporaryCache(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const keysToRemove: string[] = [];

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;

        // Evict AI cache entries or temporary logs first
        if (
          key.startsWith('study_planner_ai_cache_') ||
          key.startsWith('tmp_') ||
          key.startsWith('cache_')
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch (e) {
      console.warn('[safeStorage] Error evicting temporary cache:', e);
    }
  },
};

export default safeStorage;
