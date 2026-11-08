const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const STATIC_ALLOWED = new Set([
  'https://kaiwa.live',
  'https://www.kaiwa.live',
  'https://web.telegram.org',
  'capacitor://localhost',
]);

export function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  const clean = origin.trim();

  // 1. Static trusted production origins
  if (STATIC_ALLOWED.has(clean)) return true;

  // 2. Localhost origins (permitted in development or test, blocked if VERCEL_ENV is preview/production)
  if (LOCAL_ORIGIN.test(clean)) {
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'development') {
      return false;
    }
    return (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test' ||
      !process.env.VERCEL_ENV
    );
  }

  // 3. Explicitly configured ALLOWED_ORIGINS environment variable
  const envAllowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (envAllowed.includes(clean)) return true;

  // 4. Project-specific Vercel preview deployments (e.g. https://kaiwa-preview-123.vercel.app)
  // Rejects arbitrary untrusted *.vercel.app subdomains while permitting kaiwa-* deployments.
  if (/^https:\/\/kaiwa(-[a-zA-Z0-9_-]+)?\.vercel\.app$/.test(clean)) {
    if (process.env.VERCEL_ENV === 'preview' && envAllowed.length > 0) {
      return envAllowed.includes(clean);
    }
    return true;
  }

  return false;
}

export function extractOrigin(req) {
  if (typeof req?.headers?.get === 'function') return req.headers.get('origin') || '';
  return req?.headers?.origin || req?.headers?.Origin || '';
}

export function setCorsHeaders(req, target) {
  const origin = extractOrigin(req);
  const allowed = isAllowedOrigin(origin);
  if (!target) return allowed ? origin : undefined;
  const set =
    typeof target.setHeader === 'function'
      ? target.setHeader.bind(target)
      : typeof target.set === 'function'
        ? target.set.bind(target)
        : (name, value) => {
            target[name] = value;
          };
  const vary = target.getHeader?.('Vary') ?? target.get?.('Vary') ?? target.Vary;
  if (!String(vary ?? '').split(',').some((value) => /^(origin|\*)$/i.test(value.trim()))) {
    set('Vary', vary ? `${vary}, Origin` : 'Origin');
  }
  if (!allowed) return undefined;
  set('Access-Control-Allow-Origin', origin);
  set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  return origin;
}

