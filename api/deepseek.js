import { verifyAuth } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { checkDailyQuota } from './_quota.js';
import { setCorsHeaders } from './_cors.js';

export const config = {
  maxDuration: 60,
};

// Forward SSE without collecting the entire answer before sending its first token.
async function forwardStream(response, res) {
  res.status(response.status);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (res.destroyed) {
        await reader.cancel();
        break;
      }
      res.write(Buffer.from(value));
    }
  } catch {
    // Headers are already sent; the client can retry without a second upstream generation.
  } finally {
    reader.releaseLock();
    res.end();
  }
}

export default async function handler(req, res) {
  // 1. Strict Origin-validated CORS
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Diagnostic GET route: allows checking AI gateway availability
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'Supabase Edge AI Gateway',
      available: true,
      provider: 'DeepSeek via Supabase Edge Function',
      model: 'deepseek-chat',
      hint: 'AI gateway is active and routed to Supabase Edge Function.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let payload = req.body || {};
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  }

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const rawServerKey = process.env.DEEPSEEK_API_KEY;

  let authenticatedUserId = null;
  let userRole = 'user';

  // 2. Verify Supabase JWT user for rate-limiting, role evaluation, and quota tracking
  const { user } = await verifyAuth(req);
  if (user && user.id) {
    authenticatedUserId = user.id;
    userRole = user.role || user.app_metadata?.role || 'user';

    const rateCheck = await checkRateLimit(req, authenticatedUserId);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfter));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `AI so'rovlar tezligi oshdi. Iltimos ${rateCheck.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
        retryAfter: rateCheck.retryAfter,
      });
    }

    const quotaCheck = await checkDailyQuota(authenticatedUserId, userRole, rawBody, req);
    if (!quotaCheck.allowed) {
      return res.status(403).json({
        error: 'Quota Exceeded',
        message: quotaCheck.reason,
      });
    }
  } else {
    // Anonymous / Guest IP rate limit
    const ipRate = await checkRateLimit(req, null);
    if (!ipRate.allowed) {
      res.setHeader('Retry-After', String(ipRate.retryAfter));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `So'rovlar tezligi oshdi. Iltimos ${ipRate.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
        retryAfter: ipRate.retryAfter,
      });
    }

    // Guest Daily Quota check by IP
    const guestQuota = await checkDailyQuota(null, 'guest', rawBody, req);
    if (!guestQuota.allowed) {
      return res.status(403).json({
        error: 'Quota Exceeded',
        message: guestQuota.reason,
      });
    }
  }

  // 3. SECURITY & BUFFER PROTECTION: clamp client-controlled parameters & trim conversation history
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.messages)) {
      const rawMessages = payload.messages;
      const systemMessages = rawMessages.filter((m) => m && m.role === 'system');
      const nonSystemMessages = rawMessages.filter((m) => m && m.role !== 'system');

      // Keep last 20 conversational turns to avoid buffer bloat & runaway tokens
      const trimmedNonSystem = nonSystemMessages.slice(-20).map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content:
          typeof msg.content === 'string'
            ? msg.content.substring(0, 8000)
            : String(msg.content || '').substring(0, 8000),
      }));

      payload.messages = [...systemMessages.slice(0, 2), ...trimmedNonSystem];
    }

    const tokenLimit = authenticatedUserId ? 4096 : 500;
    if (typeof payload.max_tokens === 'number') {
      payload.max_tokens = Math.min(Math.max(Math.floor(payload.max_tokens), 1), tokenLimit);
    } else {
      payload.max_tokens = Math.min(tokenLimit, 1024);
    }

    if (typeof payload.temperature === 'number') {
      payload.temperature = Math.min(Math.max(payload.temperature, 0), 2);
    }

    if (payload.model !== 'deepseek-chat' && payload.model !== 'deepseek-reasoner') {
      payload.model = 'deepseek-chat';
    }
    // Only authenticated users may invoke the reasoning model
    if (!authenticatedUserId && payload.model === 'deepseek-reasoner') {
      payload.model = 'deepseek-chat';
    }
  }

  // 4. Direct upstream to DeepSeek API if server key is configured in Vercel
  if (rawServerKey && rawServerKey.trim().length > 10) {
    try {
      const cleanKey = rawServerKey
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^Bearer\s+/i, '');
      const upstreamRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (
        payload.stream === true &&
        upstreamRes.ok &&
        upstreamRes.body &&
        upstreamRes.headers.get('content-type')?.includes('text/event-stream')
      ) {
        return await forwardStream(upstreamRes, res);
      }
      const upstreamData = await upstreamRes.json();
      return res.status(upstreamRes.status).json(upstreamData);
    } catch (upstreamErr) {
      console.warn('Direct DeepSeek upstream failed, trying Supabase Edge fallback:', upstreamErr);
    }
  }

  // 5. Authoritative Supabase Edge Function fallback
  try {
    const edgeUrl = process.env.VITE_SUPABASE_URL
      ? `${process.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1/deepseek`
      : 'https://qmuimxnknxwarvnkpnlo.supabase.co/functions/v1/deepseek';
    const anonKey =
      process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6g0Ei_1Cw46e1mJLKj_1Ug_sOmhlgoI';

    const edgeRes = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (
      payload.stream === true &&
      edgeRes.ok &&
      edgeRes.body &&
      edgeRes.headers.get('content-type')?.includes('text/event-stream')
    ) {
      return await forwardStream(edgeRes, res);
    }
    const edgeData = await edgeRes.json();
    return res.status(edgeRes.status).json(edgeData);
  } catch (edgeProxyErr) {
    console.error('Failed to proxy to Supabase Edge Function:', edgeProxyErr);
    return res.status(503).json({
      error: {
        code: 'AI_NOT_CONFIGURED',
        message: 'AI xizmati vaqtincha mavjud emas.',
      },
    });
  }
}
