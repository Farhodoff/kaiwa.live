import { verifyAuth } from '../_auth.js';
import { checkRateLimit } from '../_rateLimit.js';
import { checkDailyQuota } from '../_quota.js';
import { validateIeltsResponse } from '../_validators.js';
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
        message: `IELTS baholash so'rovlari tezligi oshdi. Iltimos ${rateCheck.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
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

  const { essay, topic = 'General IELTS Task', taskType = 'task2' } = body;

  if (!essay || typeof essay !== 'string' || essay.trim().length < 20) {
    return createJsonResponse(req, { error: 'Please provide an essay with at least 20 characters.' }, 400);
  }

  const safeTopic = String(topic).substring(0, 500);
  const prompt = `You are a certified IELTS Senior Examiner.
Evaluate the following IELTS ${taskType === 'task1' ? 'Task 1 Report' : 'Task 2 Essay'}.
Topic/Prompt: "${safeTopic}"
Student Essay:
"""
${essay.substring(0, 8000)}
"""

Provide your assessment strictly in the following JSON format without markdown fences:
{
  "overallBand": 7.0,
  "scores": {
    "taskAchievement": 7.0,
    "coherenceAndCohesion": 7.0,
    "lexicalResource": 7.5,
    "grammaticalRange": 6.5
  },
  "summary": "Brief overall commentary",
  "strengths": ["point 1", "point 2"],
  "improvements": ["point 1", "point 2"],
  "correctedEssay": "Full improved version of the essay with advanced vocabulary"
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
          { role: 'system', content: 'You are an IELTS examiner API that outputs valid raw JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return createJsonResponse(req, { error: 'AI evaluation failed', details: errText }, 502);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    const rawParsed = safeParseJson(content, {});
    const validatedData = validateIeltsResponse(rawParsed, essay);

    return createJsonResponse(req, { success: true, data: validatedData }, 200);
  } catch (error) {
    return createJsonResponse(req, { error: 'Internal API Server Error', message: error?.message }, 500);
  }
}
