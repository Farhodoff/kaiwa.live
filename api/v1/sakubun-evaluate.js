import { verifyAuth } from '../_auth.js';
import { checkRateLimit } from '../_rateLimit.js';
import { checkDailyQuota } from '../_quota.js';
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
  } catch {
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
  // CORS preflight
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

  const cleanKey = serverKey.trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '');
  const { user } = await verifyAuth(req);
  const authenticatedUserId = user?.id || null;

  if (authenticatedUserId) {
    const rateCheck = await checkRateLimit(req, authenticatedUserId);
    if (!rateCheck.allowed) {
      return createJsonResponse(req, {
        error: 'Too Many Requests',
        message: `So'rovlar tezligi oshdi. Iltimos ${rateCheck.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
        retryAfter: rateCheck.retryAfter,
      }, 429, { 'Retry-After': String(rateCheck.retryAfter) });
    }

    const quotaCheck = await checkDailyQuota(authenticatedUserId, user.role, rawBodyText, req);
    if (!quotaCheck.allowed) {
      return createJsonResponse(req, {
        error: 'Quota Exceeded',
        message: quotaCheck.reason,
      }, 403);
    }
  } else {
    // Guest IP rate limit & daily quota
    const ipRate = await checkRateLimit(req, null);
    if (!ipRate.allowed) {
      return createJsonResponse(req, {
        error: 'Too Many Requests',
        message: `So'rovlar tezligi oshdi. Iltimos ${ipRate.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
        retryAfter: ipRate.retryAfter,
      }, 429, { 'Retry-After': String(ipRate.retryAfter) });
    }

    const guestQuota = await checkDailyQuota(null, 'guest', rawBodyText, req);
    if (!guestQuota.allowed) {
      return createJsonResponse(req, {
        error: 'Quota Exceeded',
        message: guestQuota.reason,
      }, 403);
    }
  }

  const essay = typeof body.essay === 'string' ? body.essay.trim() : '';
  const level = String(body.level || 'N3').substring(0, 10);

  if (!essay) {
    return createJsonResponse(req, { error: 'Insho matni kiritilmagan.' }, 400);
  }

  const safeEssay = essay.substring(0, 5000);
  const prompt = `Act as an expert Japanese Essay (Sakubun 作文) and Grammar Evaluator for JLPT level ${level}.
Evaluate this Japanese text:
"${safeEssay}"

Output ONLY a JSON response in Uzbek:
{
  "score": <number between 0 and 100>,
  "kanjiRating": "<A'lo / Qoniqarli / Ko'proq Kanji ishlatish kerak>",
  "grammarFeedback": "<Desu/Masu va grammatik shakllar haqida batafsil o'zbekcha baho>",
  "correctedText": "<Tog'rilangan ideal yaponcha shakli Furigana bilan>",
  "suggestions": ["<Tavsiya 1>", "<Tavsiya 2>"]
}`;

  try {
    const deepSeekRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!deepSeekRes.ok) {
      const errText = await deepSeekRes.text();
      return createJsonResponse(req, { error: 'AI xizmati xatolik qaytardi', details: errText }, deepSeekRes.status);
    }

    const dsData = await deepSeekRes.json();
    const content = dsData.choices?.[0]?.message?.content || '{}';
    const parsed = safeParseJson(content, {
      score: 80,
      kanjiRating: "Qoniqarli",
      grammarFeedback: "Matn yaxshi yozilgan.",
      correctedText: essay,
      suggestions: ["Davom eting."],
    });

    return createJsonResponse(req, { success: true, data: parsed }, 200);
  } catch (err) {
    return createJsonResponse(req, { error: err.message || 'Kutilmagan xatolik' }, 500);
  }
}
