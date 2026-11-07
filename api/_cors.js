const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  if (origin === 'https://kaiwa.live') return true;
  if (LOCAL_ORIGIN.test(origin)) {
    return process.env.VERCEL_ENV
      ? process.env.VERCEL_ENV === 'development'
      : process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  }
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.origin === origin &&
      (process.env.ALLOWED_ORIGINS || '').split(',').some((entry) => entry.trim() === origin);
  } catch {
    return false;
  }
}

export function extractOrigin(req) {
  if (typeof req?.headers?.get === 'function') return req.headers.get('origin') || '';
  return req?.headers?.origin || req?.headers?.Origin || '';
}

export function setCorsHeaders(req, target) {
  const origin = extractOrigin(req);
  const allowed = isAllowedOrigin(origin);
  if (!target) return allowed ? origin : undefined;
  const set = typeof target.setHeader === 'function'
    ? target.setHeader.bind(target)
    : typeof target.set === 'function'
      ? target.set.bind(target)
      : (name, value) => { target[name] = value; };
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
