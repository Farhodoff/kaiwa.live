import { verifyAuth } from '../_auth.js';
import { checkRateLimit } from '../_rateLimit.js';
import { checkDailyQuota } from '../_quota.js';

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

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const rawBodyText = await req.text().catch(() => '');
  let body;
  try {
    body = JSON.parse(rawBodyText || '{}');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const serverKey = process.env.DEEPSEEK_API_KEY;
  if (!serverKey) {
    return new Response(JSON.stringify({
      error: 'AI_UNAVAILABLE',
      message: 'Serverda DeepSeek API kaliti sozlanmagan.',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const { user } = await verifyAuth(req);
  const authenticatedUserId = user?.id || null;

  if (authenticatedUserId) {
    const rateCheck = await checkRateLimit(req, authenticatedUserId);
    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({
        error: 'Too Many Requests',
        message: `So'rovlar tezligi oshdi. Iltimos ${rateCheck.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
        retryAfter: rateCheck.retryAfter,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': String(rateCheck.retryAfter),
        },
      });
    }

    const quotaCheck = await checkDailyQuota(authenticatedUserId, user.role, rawBodyText);
    if (!quotaCheck.allowed) {
      return new Response(JSON.stringify({
        error: 'Quota Exceeded',
        message: quotaCheck.reason,
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  const essay = typeof body.essay === 'string' ? body.essay.trim() : '';
  const level = body.level || 'N3';

  if (!essay) {
    return new Response(JSON.stringify({ error: 'Insho matni kiritilmagan.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const prompt = `Act as an expert Japanese Essay (Sakubun 作文) and Grammar Evaluator for JLPT level ${level}.
Evaluate this Japanese text:
"${essay}"

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
        Authorization: `Bearer ${serverKey}`,
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
      return new Response(JSON.stringify({ error: 'AI xizmati xatolik qaytardi', details: errText }), {
        status: deepSeekRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
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

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Kutilmagan xatolik' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
