import { verifyAuth, getBearerToken, SUPABASE_ANON_KEY } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';
import { checkDailyQuota } from './_quota.js';
import { setCorsHeaders } from './_cors.js';

export const config = {
  runtime: 'edge',
};

const ALLOWED_LANGUAGES = new Set([
  'uz',
  'ja',
  'en',
  'ru',
  'ko',
  'zh',
  'es',
  'fr',
  'de',
  'tr',
  'ar',
  'it',
  'pt',
  'hi',
  'id',
  'vi',
  'th',
]);

const AZURE_VOICE_MAP = {
  ja: { voice: 'ja-JP-NanamiNeural', locale: 'ja-JP' },
  en: { voice: 'en-US-JennyNeural', locale: 'en-US' },
  uz: { voice: 'uz-UZ-MadinaNeural', locale: 'uz-UZ' },
  ru: { voice: 'ru-RU-SvetlanaNeural', locale: 'ru-RU' },
  ko: { voice: 'ko-KR-SunHiNeural', locale: 'ko-KR' },
  zh: { voice: 'zh-CN-XiaoxiaoNeural', locale: 'zh-CN' },
  es: { voice: 'es-ES-ElviraNeural', locale: 'es-ES' },
  fr: { voice: 'fr-FR-DeniseNeural', locale: 'fr-FR' },
  de: { voice: 'de-DE-KatjaNeural', locale: 'de-DE' },
  tr: { voice: 'tr-TR-EmelNeural', locale: 'tr-TR' },
  it: { voice: 'it-IT-ElsaNeural', locale: 'it-IT' },
  pt: { voice: 'pt-BR-FranciscaNeural', locale: 'pt-BR' },
  hi: { voice: 'hi-IN-SwaraNeural', locale: 'hi-IN' },
  id: { voice: 'id-ID-GadisNeural', locale: 'id-ID' },
  vi: { voice: 'vi-VN-HoaiMyNeural', locale: 'vi-VN' },
  th: { voice: 'th-TH-PremwadeeNeural', locale: 'th-TH' },
  ar: { voice: 'ar-SA-ZariyahNeural', locale: 'ar-SA' },
};

function normalizeAndValidateLanguage(langInput) {
  if (!langInput) return 'en';
  if (typeof langInput !== 'string') return null;

  const cleanLang = langInput.trim().toLowerCase();
  if (ALLOWED_LANGUAGES.has(cleanLang)) {
    return cleanLang;
  }

  // Support locale format like "ja-JP", "en-US", "uz-UZ"
  const primaryTag = cleanLang.split(/[-_]/)[0];
  if (ALLOWED_LANGUAGES.has(primaryTag)) {
    return primaryTag;
  }

  return null;
}

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function jsonResponse(req, data, status = 200, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  setCorsHeaders(req, headers);
  return new Response(JSON.stringify(data), { status, headers });
}

async function synthesizeWithAzure(text, lang, key, region, signal) {
  const voiceConfig = AZURE_VOICE_MAP[lang] || { voice: 'ja-JP-NanamiNeural', locale: 'ja-JP' };
  const ssml = `<speak version='1.0' xml:lang='${voiceConfig.locale}'>` +
    `<voice xml:lang='${voiceConfig.locale}' name='${voiceConfig.voice}'>` +
    escapeXml(text) +
    `</voice></speak>`;

  const configuredEndpoint = (process.env.AZURE_SPEECH_ENDPOINT || '').trim().replace(/\/+$/, '');
  const endpoint = configuredEndpoint
    ? `${configuredEndpoint}/cognitiveservices/v1`
    : `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key.trim(),
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'kaiwa-live-tts',
    },
    body: ssml,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Azure TTS responded with HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Azure TTS returned empty audio buffer');
  }
  return buffer;
}

async function synthesizeWithGoogle(text, lang, signal) {
  const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
  const response = await fetch(gUrl, {
    signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Google TTS responded with HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (
    !contentType.includes('audio') &&
    !contentType.includes('mpeg') &&
    !contentType.includes('octet-stream')
  ) {
    throw new Error('TTS provayderi yaroqsiz formatdagi javob qaytardi.');
  }

  const buffer = await response.arrayBuffer();
  if (!buffer || buffer.byteLength === 0) {
    throw new Error("TTS provayderi bo'sh audio qaytardi.");
  }
  return buffer;
}

export default async function handler(req) {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    const headers = {};
    setCorsHeaders(req, headers);
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'HEAD') {
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

  // 3. Distributed Rate Limiter (80 req/min for conversational dialogue chunk streaming)
  const rateCheck = await checkRateLimit(req, authenticatedUserId, 80);
  if (!rateCheck.allowed) {
    return jsonResponse(req, {
      error: 'Too Many Requests',
      message: `TTS so'rovlar tezligi oshdi. Iltimos ${rateCheck.retryAfter} soniyadan so'ng qayta urinib ko'ring.`,
      retryAfter: rateCheck.retryAfter,
    }, 429, { 'Retry-After': String(rateCheck.retryAfter) });
  }

  // 4. Input Extraction & Request Size Limit
  let rawText = '';
  let rawLang = 'en';
  let payloadForQuota = '';

  if (req.method === 'POST') {
    let body;
    try {
      payloadForQuota = await req.text();
      body = JSON.parse(payloadForQuota || '{}');
    } catch {
      return jsonResponse(req, { error: 'Bad Request', message: 'Yaroqsiz JSON formati.' }, 400);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse(req, { error: 'Bad Request', message: "Request body ob'ekt bo'lishi shart." }, 400);
    }

    rawText = body.text;
    rawLang = body.lang || 'en';
  } else {
    const url = new URL(req.url);
    rawText = url.searchParams.get('text');
    rawLang = url.searchParams.get('lang') || 'en';
    payloadForQuota = rawText || '';
  }

  // 5. Daily AI/TTS Quota Check (evaluated before hitting upstream provider)
  const quotaCheck = await checkDailyQuota(authenticatedUserId, userRole, payloadForQuota, req);
  if (!quotaCheck.allowed) {
    return jsonResponse(req, {
      error: 'Quota Exceeded',
      message: quotaCheck.reason,
    }, 403);
  }

  // 6. Strict Input Validation
  if (typeof rawText !== 'string') {
    return jsonResponse(req, {
      error: 'Bad Request',
      message: "Matn (text) maydoni satr (string) bo'lishi shart.",
    }, 400);
  }

  if (rawText.length > 200) {
    return jsonResponse(req, {
      error: 'Bad Request',
      message: 'Matn uzunligi maksimal 200 belgidan oshmasligi kerak.',
    }, 400);
  }

  const cleanText = rawText
    .replace(/[*_#`~[\]()（）]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleanText.length === 0) {
    return jsonResponse(req, { error: 'Bad Request', message: "Bo'sh matnni ovozlashtirib bo'lmaydi." }, 400);
  }

  if (cleanText.length > 200) {
    return jsonResponse(req, {
      error: 'Bad Request',
      message: 'Matn uzunligi maksimal 200 belgidan oshmasligi kerak.',
    }, 400);
  }

  const validatedLang = normalizeAndValidateLanguage(rawLang);
  if (!validatedLang) {
    return jsonResponse(req, {
      error: 'Bad Request',
      message: `Qo'llab-quvvatlanmaydigan til: "${String(rawLang).substring(0, 20)}". Ruxsat etilgan tillar: ${Array.from(ALLOWED_LANGUAGES).join(', ')}`,
    }, 400);
  }

  // 7. Resilient Multi-Provider Speech Synthesis (Primary: Azure Neural TTS, Fallback: Google TTS)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION || 'swedencentral';

  let audioBuffer = null;
  let activeProvider = 'google-tts';

  try {
    // 7A. Primary: Azure Neural TTS
    if (azureKey && azureKey.trim().length > 10) {
      try {
        audioBuffer = await synthesizeWithAzure(cleanText, validatedLang, azureKey, azureRegion, controller.signal);
        activeProvider = 'azure-neural';
      } catch (azureError) {
        if (controller.signal.aborted) {
          throw azureError;
        }
        console.warn('[TTS] Azure Neural synthesis failed, falling back to Google TTS:', azureError?.message);
      }
    }

    // 7B. Secondary / Fallback: Google TTS
    if (!audioBuffer) {
      audioBuffer = await synthesizeWithGoogle(cleanText, validatedLang, controller.signal);
      activeProvider = 'google-tts';
    }

    clearTimeout(timeoutId);

    const headers = {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audioBuffer.byteLength),
      'Cache-Control': 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
      'X-TTS-Provider': activeProvider,
    };
    setCorsHeaders(req, headers);

    return new Response(audioBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      return jsonResponse(req, {
        error: 'Gateway Timeout',
        message: 'TTS provayderi belgilangan vaqt ichida javob bermadi (10s timeout).',
      }, 504);
    }

    const isBadGateway =
      error?.message?.includes('HTTP') ||
      error?.message?.includes('format') ||
      error?.message?.includes('empty') ||
      error?.message?.includes('bo\'sh');

    if (isBadGateway) {
      return jsonResponse(req, {
        error: 'Bad Gateway',
        message: "TTS provayderidan audio qabul qilib bo'lmadi.",
      }, 502);
    }

    return jsonResponse(req, {
      error: 'Internal Server Error',
      message: 'Audio sintez jarayonida server xatoligi yuz berdi.',
    }, 500);
  }
}
