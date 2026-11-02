/**
 * Centralized CORS & Origin Protection Utility
 * Restricts cross-origin requests to trusted kaiwa.live domains, Telegram WebApp, and local dev.
 */

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(www\.)?kaiwa\.live$/,
  /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/,
  /^https:\/\/(web\.)?telegram\.org$/,
  /^capacitor:\/\/localhost$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

export function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  const cleanOrigin = origin.trim();
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(cleanOrigin));
}

export function extractOrigin(req) {
  if (!req) return '';
  if (typeof req.headers?.get === 'function') {
    return req.headers.get('origin') || req.headers.get('Origin') || '';
  }
  if (req.headers) {
    return req.headers['origin'] || req.headers['Origin'] || '';
  }
  return '';
}

export function setCorsHeaders(req, resOrHeaders) {
  const origin = extractOrigin(req);
  const allowOrigin = isAllowedOrigin(origin) ? origin : 'https://kaiwa.live';

  if (!resOrHeaders) return allowOrigin;

  if (typeof resOrHeaders.setHeader === 'function') {
    // Node.js Serverless (Vercel Node runtime)
    resOrHeaders.setHeader('Access-Control-Allow-Origin', allowOrigin);
    resOrHeaders.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    resOrHeaders.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
    resOrHeaders.setHeader('Vary', 'Origin');
  } else if (typeof resOrHeaders.set === 'function') {
    // Fetch Headers object (Edge runtime)
    resOrHeaders.set('Access-Control-Allow-Origin', allowOrigin);
    resOrHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    resOrHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
    resOrHeaders.set('Vary', 'Origin');
  } else if (typeof resOrHeaders === 'object') {
    // Plain object headers dictionary
    resOrHeaders['Access-Control-Allow-Origin'] = allowOrigin;
    resOrHeaders['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    resOrHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey';
    resOrHeaders['Vary'] = 'Origin';
  }

  return allowOrigin;
}
