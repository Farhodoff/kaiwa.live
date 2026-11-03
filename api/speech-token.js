import { verifyAuth, getBearerToken, SUPABASE_ANON_KEY } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { checkDailyQuota } from './_quota.js';
import { setCorsHeaders } from './_cors.js';

export const config = {
  runtime: 'edge',
};

function jsonResponse(req, data, status = 200, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    ...extraHeaders,
  };
  setCorsHeaders(req, headers);
  return new Response(JSON.stringify(data), { status, headers });
}

export default async function handler(req) {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    const headers = {};
    setCorsHeaders(req, headers);
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse(req, {
      error: 'Method Not Allowed',
      message: "Faqat GET yoki POST so'rovlari qo'llab-quvvatlanadi.",
    }, 405);
  }

  // 2. Authentication: strictly verify Supabase JWT or Anon Key
  const token = getBearerToken(req);
  if (!token) {
    return jsonResponse(req, {
      error: 'Unauthorized',
      message: 'Autentifikatsiya talab qilinadi. Authorization Bearer token yuborilishi shart.',
    }, 401);
  }

  let authenticatedUserId = null;
  let userRole = 'user';

  if (token === SUPABASE_ANON_KEY) {
    authenticatedUserId = null;
    userRole = 'user';
  } else {
    const { user, error: authError } = await verifyAuth(req);
    if (authError || !user) {
      return jsonResponse(req, {
        error: 'Unauthorized',
        message: "Yaroqsiz yoki muddati o'tgan autentifikatsiya sessiyasi.",
        details: authError,
      }, 401);
    }
    authenticatedUserId = user.id;
    userRole = user.role || 'user';
  }

  // 3. Distributed Rate Limiter (30 token requests/min per client)
  const rateCheck = await checkRateLimit(req, authenticatedUserId, 30);
  if (!rateCheck.allowed) {
    return jsonResponse(req, {
      error: 'Too Many Requests',
      message: `Speech token so'rovlar tezligi oshdi. Iltimos ${rateCheck.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
      retryAfter: rateCheck.retryAfter,
    }, 429, { 'Retry-After': String(rateCheck.retryAfter) });
  }

  // 4. Daily quota check (evaluated per-user or per-client IP for guest)
  const quotaCheck = await checkDailyQuota(authenticatedUserId, userRole, '', req);
  if (!quotaCheck.allowed) {
    return jsonResponse(req, {
      error: 'Quota Exceeded',
      message: quotaCheck.reason || 'Kunlik so‘rovlar limiti tugadi.',
      remainingQuota: quotaCheck.remainingQuota ?? 0,
    }, 403);
  }

  // 5. Azure Speech Credentials Verification
  const azureKey = (process.env.AZURE_SPEECH_KEY || '').trim();
  const azureRegion = (process.env.AZURE_SPEECH_REGION || 'swedencentral').trim();
  const configuredEndpoint = (process.env.AZURE_SPEECH_ENDPOINT || '').trim().replace(/\/+$/, '');

  if (!azureKey) {
    return jsonResponse(req, {
      error: 'Service Unavailable',
      message: 'Azure Speech xizmati sozlanmagan.',
    }, 503);
  }

  // 6. Fetch Ephemeral Token from Azure Cognitive Services STS
  try {
    const stsUrl = `${configuredEndpoint || `https://${azureRegion}.api.cognitive.microsoft.com`}/sts/v1.0/issueToken`;
    const stsResponse = await fetch(stsUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Length': '0',
      },
    });

    if (!stsResponse.ok) {
      const errText = await stsResponse.text().catch(() => '');
      console.error('[speech-token] Azure STS failed:', stsResponse.status, errText);
      return jsonResponse(req, {
        error: 'Bad Gateway',
        message: 'Azure Speech tokenini olishda xatolik yuz berdi.',
      }, 502);
    }

    const speechToken = await stsResponse.text();
    if (!speechToken || speechToken.trim().length === 0) {
      throw new Error('Azure STS returned empty token');
    }

    return jsonResponse(req, {
      token: speechToken.trim(),
      region: azureRegion,
      expiresIn: 600, // Azure STS tokens are valid for 10 minutes (600s)
    }, 200, {
      'X-Speech-Provider': 'azure',
    });
  } catch (err) {
    console.error('[speech-token] Unexpected error:', err);
    return jsonResponse(req, {
      error: 'Internal Server Error',
      message: 'Azure Speech xizmatiga ulanishda kutilmagan xatolik yuz berdi.',
    }, 500);
  }
}
