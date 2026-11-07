import { verifyAuth, getBearerToken, SUPABASE_ANON_KEY } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { checkDailyQuota, MAX_REQUEST_SIZE_BYTES } from './_quota.js';
import { setCorsHeaders } from './_cors.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-AI-Provider', 'azure-openai');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const key = (process.env.AZURE_OPENAI_API_KEY || '').trim();
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').trim().replace(/\/+$/, '');
  const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT || '').trim();
  if (!key || !endpoint || !deployment) {
    return res
      .status(503)
      .json({
        error: {
          code: 'AZURE_AI_NOT_CONFIGURED',
          message: 'Azure suhbat modeli hali sozlanmagan.',
        },
      });
  }
  let url;
  try {
    url = new URL(endpoint);
    if (
      url.protocol !== 'https:' ||
      !['.openai.azure.com', '.services.ai.azure.com'].some((suffix) =>
        url.hostname.endsWith(suffix),
      )
    )
      throw new Error('Invalid Azure endpoint');
  } catch {
    return res
      .status(503)
      .json({
        error: {
          code: 'AZURE_AI_NOT_CONFIGURED',
          message: 'Azure suhbat manzili noto‘g‘ri sozlangan.',
        },
      });
  }

  const { user, error } = await verifyAuth(req);
  const token = getBearerToken(req);
  if (token && token !== SUPABASE_ANON_KEY && (error || !user)) {
    return res
      .status(401)
      .json({ error: { code: 'SESSION_EXPIRED', message: 'Kirish sessiyasini yangilang.' } });
  }
  const rate = await checkRateLimit(req, user?.id || null);
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    return res
      .status(429)
      .json({ error: { code: 'RATE_LIMIT', message: 'Biroz kutib qayta urinib ko‘ring.' } });
  }
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0)
    return res.status(400).json({ error: 'Messages required' });
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_REQUEST_SIZE_BYTES) {
    return res.status(413).json({ error: { code: 'REQUEST_TOO_LARGE' } });
  }
  const quota = await checkDailyQuota(
    user?.id || null,
    user?.app_metadata?.role || user?.role || 'user',
    '',
    req,
  );
  if (!quota.allowed)
    return res.status(403).json({ error: { code: 'QUOTA_EXCEEDED', message: quota.reason } });

  const validMessages = body.messages.filter(
    (m) => m && ['system', 'user', 'assistant'].includes(m.role) && typeof m.content === 'string',
  );
  if (!validMessages.length) return res.status(400).json({ error: 'Valid messages required' });
  const messages = [
    ...validMessages.filter((m) => m.role === 'system').slice(0, 2),
    ...validMessages.filter((m) => m.role !== 'system').slice(-20),
  ].map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));
  const payload = {
    model: deployment,
    messages,
    stream: body.stream === true,
    max_tokens: Math.min(1024, Math.max(1, Number(body.max_tokens) || 1024)),
  };
  if (body.response_format?.type === 'json_object')
    payload.response_format = { type: 'json_object' };
  const base = endpoint.endsWith('/openai/v1') ? endpoint : `${endpoint}/openai/v1`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  let reader;
  try {
    const upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!upstream.ok) {
      // Keep provider details and credentials out of browser logs.
      console.error('[AzureCoach] Upstream rejection', upstream.status);
      return res
        .status(upstream.status === 401 || upstream.status === 403 ? 503 : upstream.status)
        .json({
          error: {
            code: 'AZURE_AI_UPSTREAM',
            message: 'Azure suhbat xizmati so‘rovni bajara olmadi.',
          },
        });
    }
    if (
      payload.stream &&
      upstream.body &&
      upstream.headers.get('content-type')?.includes('text/event-stream')
    ) {
      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      reader = upstream.body.getReader();
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (res.destroyed) {
          await reader.cancel();
          break;
        }
        if (!done) res.write(Buffer.from(chunk.value));
      }
      return res.end();
    }
    return res.status(200).json(await upstream.json());
  } catch {
    if (res.headersSent) return res.end();
    return res
      .status(controller.signal.aborted ? 504 : 502)
      .json({
        error: {
          code: 'AZURE_AI_UNAVAILABLE',
          message: 'Azure suhbat xizmatiga ulanish uzildi. Qayta urinib ko‘ring.',
        },
      });
  } finally {
    clearTimeout(timeout);
    reader?.releaseLock();
  }
}
