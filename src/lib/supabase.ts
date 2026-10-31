import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { toast } from '../hooks/use-toast';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url?: string) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const DEFAULT_SUPABASE_URL = 'https://qmuimxnknxwarvnkpnlo.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_6g0Ei_1Cw46e1mJLKj_1Ug_sOmhlgoI';

export const isValidAnonKey = (key?: string | null): boolean => {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (
    trimmed === '[SENSITIVE]' ||
    trimmed.includes('placeholder') ||
    trimmed.includes('your_supabase') ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === ''
  ) {
    return false;
  }
  // Modern Supabase publishable key format: sb_publishable_...
  if (trimmed.startsWith('sb_publishable_') && trimmed.length > 25) {
    return true;
  }
  // Legacy Supabase JWT format: eyJ... (3 base64 parts)
  if (trimmed.startsWith('eyJ') && trimmed.split('.').length === 3 && trimmed.length > 50) {
    return true;
  }
  return false;
};

export const supabaseUrl = isValidUrl(rawUrl) ? rawUrl!.trim() : DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = isValidAnonKey(rawKey) ? rawKey!.trim() : DEFAULT_SUPABASE_ANON_KEY;

if (!isValidUrl(rawUrl) || !isValidAnonKey(rawKey)) {
  logger.warn(
    'SupabaseClient',
    'Initialized with default or fallback credentials. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set for production.',
  );
}

// Concurrency queue — prevent socket flooding while keeping response fast
let activeRequests = 0;
const MAX_CONCURRENT = 6;
const requestQueue: Array<() => void> = [];

const acquireSlot = async (): Promise<void> => {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return;
  }
  return new Promise<void>((resolve) => {
    requestQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
};

const releaseSlot = () => {
  activeRequests--;
  if (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const next = requestQueue.shift();
    if (next) next();
  }
};

// In-flight GET request deduplication map to prevent redundant concurrent fetches to the same endpoint
const inFlightGetMap = new Map<string, Promise<Response>>();

// Helper to retry fetch — reduced to 1 retry; connection resets are NOT retried (they indicate server overload)
const fetchWithRetry = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries = 1,
): Promise<Response> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Device is offline');
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err: any) {
      // Aborted requests must never be retried
      if (err?.name === 'AbortError') throw err;
      if (typeof navigator !== 'undefined' && !navigator.onLine) throw err;
      // Connection resets mean server overload — retrying makes it WORSE
      const msg = String(err?.message || '');
      if (
        msg.includes('ERR_CONNECTION_RESET') ||
        msg.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
        msg.includes('ERR_CONNECTION_CLOSED')
      ) {
        throw err;
      }
      const isLast = attempt === maxRetries;
      if (isLast) throw err;
      const delay = 300 * Math.pow(2, attempt) + Math.floor(Math.random() * 100);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Fetch failed after retries');
};

// Structured error logger for Supabase HTTP responses
const logSupabaseError = (method: string, url: string, response: Response) => {
  if (response.ok) return;
  try {
    response
      .clone()
      .text()
      .then((bodyText) => {
        let parsed: any = null;
        try {
          parsed = JSON.parse(bodyText);
        } catch {}
        const code = parsed?.code || parsed?.error_code || response.statusText || 'ERROR';
        const msg = parsed?.message || parsed?.hint || parsed?.msg || bodyText.slice(0, 200);
        logger.warn(
          'SupabaseClient',
          `[HTTP ${response.status}] ${method} ${url} -> Code: ${code} | Message: ${msg}`,
        );
      })
      .catch(() => {});
  } catch {}
};

// Debounced notification when session expires and refresh fails
let lastAuthToastTime = 0;
const notifyAuthExpired = () => {
  const now = Date.now();
  if (now - lastAuthToastTime < 30000) return; // at most once every 30s
  lastAuthToastTime = now;
  try {
    toast({
      variant: 'destructive',
      title: '🔒 Sessiya muddati tugadi',
      description: 'Natijalar serverga sinxronlanishi uchun iltimos hisobingizga qayta kiring.',
    });
  } catch {}
};

// Sign-out state tracker to prevent resurrecting sessions or retrying during logout
let isSigningOut = false;

export const setSigningOut = (val: boolean) => {
  isSigningOut = val;
  if (val) {
    refreshSessionPromise = null;
    inFlightGetMap.clear();
  }
};

export const getIsSigningOut = () => isSigningOut;

// Singleton promise to prevent concurrent duplicate session refresh requests
let refreshSessionPromise: Promise<string | null> | null = null;
const attemptTokenRefresh = async (): Promise<string | null> => {
  if (isSigningOut) {
    logger.info('SupabaseClient', 'Sign-out in progress. Skipping token refresh.');
    return null;
  }
  if (refreshSessionPromise) return refreshSessionPromise;

  refreshSessionPromise = (async () => {
    try {
      if (isSigningOut) return null;
      logger.info(
        'SupabaseClient',
        'Access token expired (401). Attempting automatic session refresh...',
      );
      const { data, error } = await supabase.auth.refreshSession();
      if (isSigningOut || error || !data?.session?.access_token) {
        if (!isSigningOut) {
          logger.warn(
            'SupabaseClient',
            `Session refresh failed: ${error?.message || 'No active session found'}`,
          );
          notifyAuthExpired();
        }
        return null;
      }
      logger.info('SupabaseClient', 'Session successfully refreshed with new access token.');
      return data.session.access_token;
    } catch (err) {
      if (!isSigningOut) {
        logger.error('SupabaseClient', 'Session refresh exception:', err);
        notifyAuthExpired();
      }
      return null;
    } finally {
      refreshSessionPromise = null;
    }
  })();

  return refreshSessionPromise;
};

// Custom fetch wrapper that handles network offline/AdBlocker/Connection Reset fetch errors gracefully
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request)?.url || '';

  // Prevent sending malformed undefined/null queries to Supabase
  if (urlStr.includes('=eq.undefined') || urlStr.includes('=eq.null')) {
    return new Response(JSON.stringify([]), {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const method = (init?.method || 'GET').toUpperCase();
  const isGet = method === 'GET' || method === 'HEAD';
  const isMutation =
    method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';
  const isAuth = urlStr.includes('/auth/v1');
  const isRpc = urlStr.includes('/rpc/');

  // Already-aborted signals go straight to the fallback path — fetching with a
  // dead signal only produces an immediate AbortError rejection.
  if (init?.signal?.aborted) {
    return isAuth || isRpc || isMutation
      ? new Response(
          JSON.stringify({
            message: 'Request aborted',
            code: 'PGRST_ABORTED',
            details: 'The operation was aborted by the client.',
          }),
          {
            status: 499,
            statusText: 'Client Closed Request',
            headers: { 'Content-Type': 'application/json' },
          },
        )
      : new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
  }

  // Helper to safely extract header value from Headers instance, object, or array
  const getHeaderVal = (hdrs: any, name: string): string => {
    if (!hdrs) return '';
    try {
      if (typeof hdrs.get === 'function') {
        return hdrs.get(name) || hdrs.get(name.toLowerCase()) || '';
      }
      if (Array.isArray(hdrs)) {
        const item = hdrs.find(([k]) => String(k).toLowerCase() === name.toLowerCase());
        return item ? item[1] : '';
      }
      if (typeof hdrs === 'object') {
        const keys = Object.keys(hdrs);
        const match = keys.find((k) => k.toLowerCase() === name.toLowerCase());
        return match ? hdrs[match] : '';
      }
    } catch {}
    return '';
  };

  // In-flight GET deduplication: If an identical GET query is already running, share the response
  const authHeader =
    getHeaderVal(init?.headers, 'Authorization') || getHeaderVal(init?.headers, 'apikey');
  const dedupeKey = isGet ? `${urlStr}::${authHeader}` : '';

  if (isGet && inFlightGetMap.has(dedupeKey)) {
    try {
      const existingRes = await inFlightGetMap.get(dedupeKey)!;
      return existingRes.clone();
    } catch {
      // If in-flight failed, proceed to try fresh
      inFlightGetMap.delete(dedupeKey);
    }
  }

  const executeFetch = async (): Promise<Response> => {
    await acquireSlot();
    try {
      const res = await fetchWithRetry(input, init, 1);
      if (res.status === 401 && !isAuth) {
        if (isSigningOut) {
          return res;
        }
        logSupabaseError(method, urlStr, res);
        const newAccessToken = await attemptTokenRefresh();
        if (newAccessToken) {
          const cleanHeaders = new Headers(
            init?.headers || (input instanceof Request ? input.headers : {}),
          );
          cleanHeaders.set('Authorization', `Bearer ${newAccessToken}`);
          cleanHeaders.set('apikey', supabaseAnonKey);
          const reqUrl =
            typeof input === 'string'
              ? input
              : input instanceof Request
                ? input.url
                : input.toString();
          const retryInit = { ...init, headers: cleanHeaders };
          const retryRes = await fetchWithRetry(reqUrl, retryInit, 1);
          if (!retryRes.ok) {
            logSupabaseError(method, reqUrl, retryRes);
          }
          return retryRes;
        }

        return res;
      }

      if (!res.ok) {
        logSupabaseError(method, urlStr, res);
      }
      return res;
    } catch (err: unknown) {
      if (isAuth) {
        throw err;
      }

      // For mutations (POST, PATCH, PUT, DELETE) and RPCs, NEVER return fake 200 OK — that causes
      // silent data loss and pollutes state with corrupt mock IDs (e.g. { id: 1 }).
      // Returning a 503 PostgREST-compatible error allows callers (TaskService, FlashcardService, etc.)
      // to detect the failure and trigger offline caching / local UUID fallbacks.
      if (isMutation || isRpc) {
        return new Response(
          JSON.stringify({
            message:
              err instanceof Error ? err.message : 'Network connection failed or device is offline',
            code: 'PGRST_NETWORK_ERROR',
            details: 'The network request could not reach the Supabase server.',
            hint: 'Check network connectivity or retry the operation.',
          }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // For idempotent read queries (GET/HEAD), return a safe empty array to prevent UI hard crashes
      return new Response(JSON.stringify([]), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      releaseSlot();
    }
  };

  if (isGet) {
    const fetchPromise = executeFetch();
    inFlightGetMap.set(dedupeKey, fetchPromise);
    try {
      const res = await fetchPromise;
      return res.clone();
    } finally {
      // Clean up from dedupe map after brief window
      setTimeout(() => {
        inFlightGetMap.delete(dedupeKey);
      }, 50);
    }
  }

  return executeFetch();
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    timeout: 15000,
  },
  global: {
    fetch: customFetch,
  },
});
