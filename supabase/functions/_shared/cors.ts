export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const headers: Record<string, string> = { Vary: 'Origin' };
  if (!origin) return headers;
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (local && Deno.env.get('KAIWA_ENV') !== 'development') return headers;
  try {
    const url = new URL(origin);
    const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((value) => value.trim());
    if (url.origin !== origin || (!local && url.protocol !== 'https:')) return headers;
    if (!local && origin !== 'https://kaiwa.live' && !allowed.includes(origin)) return headers;
    return {
      ...headers,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
  } catch {
    return headers;
  }
}
