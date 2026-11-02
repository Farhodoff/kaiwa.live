import { verifyAuth } from '../_auth.js';
import { checkRateLimit } from '../_rateLimit.js';
import { checkDailyQuota } from '../_quota.js';
import { validateFlashcardsResponse } from '../_validators.js';
import { setCorsHeaders } from '../_cors.js';

export const config = {
  runtime: 'edge',
};

function safeParseJson(rawContent, fallback = {}) {
  if (!rawContent || typeof rawContent !== 'string') return fallback;
  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const match = rawContent.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return fallback;
  }
}

function createJsonResponse(req, data, status = 200, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  setCorsHeaders(req, headers);
  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    const headers = {};
    setCorsHeaders(req, headers);
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  if (req.method !== 'POST') {
    return createJsonResponse(req, { error: 'Method Not Allowed. Use POST.' }, 405);
  }

  const rawBodyText = await req.text().catch(() => '');
  let body;
  try {
    body = JSON.parse(rawBodyText || '{}');
  } catch {
    return createJsonResponse(req, { error: 'Invalid JSON payload' }, 400);
  }

  const serverKey = process.env.DEEPSEEK_API_KEY;
  if (!serverKey) {
    return createJsonResponse(req, {
      error: 'AI_UNAVAILABLE',
      message: 'Serverda DeepSeek API kaliti sozlanmagan.',
    }, 503);
  }

  const effectiveApiKey = serverKey.trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '');
  let authenticatedUserId = null;

  const { user } = await verifyAuth(req);
  if (user && user.id) {
    authenticatedUserId = user.id;

    // Rate limiting for shared server API key
    const rateCheck = await checkRateLimit(req, authenticatedUserId);
    if (!rateCheck.allowed) {
      return createJsonResponse(req, {
        error: 'Too Many Requests',
        message: `Fleshkarta yaratish so'rovlari tezligi oshdi. Iltimos ${rateCheck.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
        retryAfter: rateCheck.retryAfter,
      }, 429, { 'Retry-After': String(rateCheck.retryAfter) });
    }

    // Daily quota & Request size check
    const quotaCheck = await checkDailyQuota(authenticatedUserId, user.role, rawBodyText, req);
    if (!quotaCheck.allowed) {
      return createJsonResponse(req, {
        error: 'Quota Exceeded',
        message: quotaCheck.reason,
      }, 403);
    }
  } else {
    // Guest IP rate limit
    const ipRate = await checkRateLimit(req, null);
    if (!ipRate.allowed) {
      return createJsonResponse(req, {
        error: 'Too Many Requests',
        message: `So'rovlar tezligi oshdi. Iltimos ${ipRate.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
        retryAfter: ipRate.retryAfter,
      }, 429, { 'Retry-After': String(ipRate.retryAfter) });
    }

    // Guest Daily Quota check by IP
    const guestQuota = await checkDailyQuota(null, 'guest', rawBodyText, req);
    if (!guestQuota.allowed) {
      return createJsonResponse(req, {
        error: 'Quota Exceeded',
        message: guestQuota.reason,
      }, 403);
    }
  }

  const { topic, language = 'uz', count = 5 } = body;

  if (!topic || typeof topic !== 'string') {
    return createJsonResponse(req, { error: 'Please specify a "topic" string.' }, 400);
  }

  const safeCount = Math.min(25, Math.max(1, count));
  const safeTopic = topic.substring(0, 500);

  const prompt = `Generate exactly ${safeCount} high-quality educational flashcards about: "${safeTopic}".
Target language for translations / explanations: ${language}.

Format strictly as raw JSON without markdown:
{
  "flashcards": [
    {
      "front": "Word or Question or Kanji",
      "back": "Translation and definition in ${language}",
      "example": "Sample sentence in context"
    }
  ]
}`;

  try {
    const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a flashcard generation API that outputs valid raw JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return createJsonResponse(req, { error: 'AI generation failed', details: errText }, 502);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    const rawParsed = safeParseJson(content, { flashcards: [] });
    const validatedCards = validateFlashcardsResponse(rawParsed);

    return createJsonResponse(req, { success: true, count: validatedCards.length, data: validatedCards }, 200);
  } catch (error) {
    return createJsonResponse(req, { error: 'Internal API Server Error', message: error?.message }, 500);
  }
}
