import { supabase } from '../lib/supabase';
import { ErrorNotificationService } from './ErrorNotificationService';

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
 * 1. Checks the in-memory cache for the current session.
 * 2. Fetches from Supabase Storage / static CDN endpoint (/data/*.json).
 * 3. Falls back to the bundled loader when the network resource is unavailable.
 */
export class DatasetStorageService {
  private static inMemoryCache = new Map<string, any>();

  /**
   * Loads a dataset with in-memory caching and CDN/Supabase fallback
   */
  static async loadDataset<T>(options: DatasetFetchOptions<T>): Promise<T> {
    const { datasetKey, localPath, supabaseBucket, supabasePath, fallbackLoader } = options;

    // 1. In-memory cache hit
    if (this.inMemoryCache.has(datasetKey)) {
      return this.inMemoryCache.get(datasetKey) as T;
    }

    // 2. Attempt CDN / Supabase Storage fetch with automatic retry
    let fetchedData: T | null = null;

    // 2A. Supabase Storage public bucket
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

    // 2B. Local static CDN endpoint (e.g. /data/*.json)
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

    // 3. Fallback loader (bundled dynamic import)
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

    // Cache only for the current browser session.
    this.inMemoryCache.set(datasetKey, fetchedData);

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
