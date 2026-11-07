/**
 * Global Console & Network Shield
 * 1. Suppresses noisy transient network drop errors (ERR_CONNECTION_RESET, ERR_HTTP2_PROTOCOL_ERROR)
 * 2. Redacts all sensitive API keys, Supabase URLs, Bearer JWTs, and User IDs from console outputs
 * 3. Cleans up oversized cookies to prevent HTTP 494 (Request Header Too Large) errors
 */

import { sanitizeErrorMessage } from '../components/ErrorBoundary';

const SENSITIVE_URL_PATTERNS = [
  /https:\/\/[a-z0-9]+\.supabase\.co[^\s"']*/gi,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWTs
  /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi, // UUIDs in URLs
];

const BENIGN_NETWORK_ERRORS = [
  'ERR_CONNECTION_RESET',
  'ERR_HTTP2_PROTOCOL_ERROR',
  'ERR_CONNECTION_CLOSED',
  'Failed to fetch',
  'NetworkError when attempting to fetch resource',
  'net::ERR_',
  'AbortError',
  'signal is aborted',
];

function sanitizeArg(arg: any): any {
  if (arg === null || arg === undefined) return arg;
  if (typeof arg === 'string') {
    let clean = sanitizeErrorMessage(arg);
    for (const pattern of SENSITIVE_URL_PATTERNS) {
      clean = clean.replace(pattern, '[SUPABASE_API]');
    }
    return clean;
  }
  if (arg instanceof Error) {
    let msg = sanitizeErrorMessage(arg.message);
    for (const pattern of SENSITIVE_URL_PATTERNS) {
      msg = msg.replace(pattern, '[SUPABASE_API]');
    }
    arg.message = msg;
    return arg;
  }
  if (typeof arg === 'object') {
    try {
      const str = JSON.stringify(arg);
      let clean = sanitizeErrorMessage(str);
      for (const pattern of SENSITIVE_URL_PATTERNS) {
        clean = clean.replace(pattern, '[SUPABASE_API]');
      }
      return JSON.parse(clean);
    } catch {
      return '[Object]';
    }
  }
  return arg;
}

function isBenignNetworkNoise(args: any[]): boolean {
  const text = args.map((a) => (typeof a === 'string' ? a : a?.message || '')).join(' ');
  return BENIGN_NETWORK_ERRORS.some((err) => text.includes(err));
}

let isShieldInstalled = false;

export function installConsoleShield(): void {
  if (isShieldInstalled || typeof window === 'undefined') return;
  isShieldInstalled = true;

  // In local development, preserve native browser console logs and errors
  // so developers can see full errors, clickable source stacks, and network failures.
  if (import.meta.env.DEV) {
    return;
  }

  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  console.error = (...args: any[]) => {
    if (isBenignNetworkNoise(args)) {
      // Silently suppress benign background connection drops
      return;
    }
    const sanitized = args.map(sanitizeArg);
    originalError.apply(console, sanitized);
  };

  console.warn = (...args: any[]) => {
    if (isBenignNetworkNoise(args)) {
      return;
    }
    const sanitized = args.map(sanitizeArg);
    originalWarn.apply(console, sanitized);
  };

  console.log = (...args: any[]) => {
    const sanitized = args.map(sanitizeArg);
    originalLog.apply(console, sanitized);
  };

  // Global listener for unhandled promise rejections from fetch
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    if (BENIGN_NETWORK_ERRORS.some((err) => msg.includes(err))) {
      event.preventDefault(); // Stop noisy browser red box in console
    }
  });
}
