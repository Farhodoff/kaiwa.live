import { idbGet, idbSet } from '../utils/storage/indexedDb';
import { supabase } from '../lib/supabase';
import { ErrorNotificationService } from './ErrorNotificationService';

const DATASET_CACHE_PREFIX = 'study_planner_dataset_';

export interface DatasetFetchOptions<T> {
  datasetKey: string;
  localPath?: string;
  supabaseBucket?: string;
  supabasePath?: string;
  fallbackLoader?: () => Promise<T>;
}

/**
 * DatasetStorageService:
 * Unified high-performance loader for large JSON datasets (Kanji VG strokes, JLPT Vocab, Curriculum Lessons).
 * Architecture:
 * 1. Checks fast local IndexedDB cache (instant offline load).
 * 2. Fetches from Supabase Storage / static CDN endpoint (/data/*.json).
 * 3. Saves to IndexedDB for offline resilience and reduced PWA precache overhead.
 * 4. Gracefully falls back to bundled loader if network is unavailable.
 */
export class DatasetStorageService {
  private static inMemoryCache = new Map<string, any>();

  /**
   * Loads dataset with offline-first IndexedDB caching and CDN/Supabase fallback
   */
  static async loadDataset<T>(options: DatasetFetchOptions<T>): Promise<T> {
    const { datasetKey, localPath, supabaseBucket, supabasePath, fallbackLoader } = options;

    // 1. In-memory cache hit
    if (this.inMemoryCache.has(datasetKey)) {
      return this.inMemoryCache.get(datasetKey) as T;
    }

    // 2. IndexedDB local storage check
    const cacheKey = `${DATASET_CACHE_PREFIX}${datasetKey}`;
    try {
      const cached = await idbGet<T>(cacheKey);
      if (cached) {
        this.inMemoryCache.set(datasetKey, cached);
        return cached;
      }
    } catch {
      // Non-blocking if IndexedDB is unavailable
    }

    // 3. Attempt CDN / Supabase Storage fetch with automatic retry
    let fetchedData: T | null = null;

    // 3A. Supabase Storage public bucket
    if (supabaseBucket && supabasePath) {
      try {
        const { data: publicUrlData } = supabase.storage
          .from(supabaseBucket)
          .getPublicUrl(supabasePath);

        if (publicUrlData?.publicUrl) {
          fetchedData = await ErrorNotificationService.withRetry(
            async () => {
              const res = await fetch(publicUrlData.publicUrl);
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return (await res.json()) as T;
            },
            { retries: 2, delayMs: 300, contextName: `dataset_supabase_${datasetKey}` },
          );
        }
      } catch (err) {
        console.warn(`[DatasetStorageService] Supabase fetch failed for ${datasetKey}:`, err);
      }
    }

    // 3B. Local static CDN endpoint (e.g. /data/*.json)
    const hasBrowserOrigin =
      typeof window !== 'undefined' &&
      Boolean(window.location?.origin && window.location.origin !== 'null');
    if (!fetchedData && localPath && hasBrowserOrigin && typeof window.fetch === 'function') {
      try {
        fetchedData = await ErrorNotificationService.withRetry(
          async () => {
            const res = await fetch(localPath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as T;
          },
          { retries: 2, delayMs: 300, contextName: `dataset_static_${datasetKey}` },
        );
      } catch (err) {
        console.warn(`[DatasetStorageService] Static fetch failed for ${datasetKey}:`, err);
      }
    }

    // 3C. Fallback loader (bundled dynamic import)
    if (!fetchedData && fallbackLoader) {
      try {
        fetchedData = await fallbackLoader();
      } catch (err) {
        console.error(`[DatasetStorageService] Fallback loader failed for ${datasetKey}:`, err);
      }
    }

    if (!fetchedData) {
      throw new Error(`[DatasetStorageService] Failed to load dataset: ${datasetKey}`);
    }

    // Cache in memory and persist in IndexedDB asynchronously
    this.inMemoryCache.set(datasetKey, fetchedData);
    try {
      await idbSet(cacheKey, fetchedData);
    } catch {
      // Silent error handling for storage quota limits
    }

    return fetchedData;
  }

  /**
   * Clear cache for a specific dataset or all datasets
   */
  static clearMemoryCache(datasetKey?: string): void {
    if (datasetKey) {
      this.inMemoryCache.delete(datasetKey);
    } else {
      this.inMemoryCache.clear();
    }
  }
}
