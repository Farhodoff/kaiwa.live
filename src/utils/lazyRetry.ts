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
      if (!module || (typeof module !== 'object' && typeof module !== 'function')) {
        throw new Error('Dynamically imported module is not an object or function');
      }
      sessionStorage.removeItem('chunk_retry_refreshed');
      return 'default' in module ? (module as { default: T }) : { default: module as T };
    } catch (error: any) {
      console.error('[lazyWithRetry] Dynamic import failed:', error);

      const errorMsg = String(error?.message || error || '');
      const isChunkError =
        errorMsg.includes('Failed to fetch dynamically imported module') ||
        errorMsg.includes('Importing a module script failed') ||
        errorMsg.includes('not an object') ||
        errorMsg.includes('not an Object') ||
        errorMsg.includes('loading chunk') ||
        error?.name === 'ChunkLoadError';

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
