import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Enhanced React.lazy wrapper that handles chunk mismatch errors after new deployments.
 * If a dynamically imported chunk fails (HTTP 404 / network mismatch), it triggers a
 * one-time clean page reload to fetch the latest index.html and assets.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | T>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    const hasRefreshed = sessionStorage.getItem('chunk_retry_refreshed') === 'true';

    try {
      const module = await factory();
      sessionStorage.removeItem('chunk_retry_refreshed');
      return 'default' in module ? module : { default: module };
    } catch (error: any) {
      console.error('[lazyWithRetry] Dynamic import failed:', error);

      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('loading chunk');

      if (isChunkError && !hasRefreshed) {
        sessionStorage.setItem('chunk_retry_refreshed', 'true');
        console.warn('[lazyWithRetry] Reloading page to fetch latest deployment bundle...');
        window.location.reload();
        // Return a temporary empty component while reloading
        return { default: (() => null) as unknown as T };
      }

      throw error;
    }
  });
}
