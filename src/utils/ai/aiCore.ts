import { callDeepSeek } from '../deepseek';
import { trackAITelemetry } from '../../lib/errorTracking';
import { parseAIError } from './aiConfig';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface CacheEntry {
  response: string;
  expiresAt: number;
}

// In-memory LRU / TTL Cache (30 min default TTL, 150 max items)
const AI_CACHE = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 150;
const DEFAULT_TTL_MS = 30 * 60 * 1000;

// In-flight Promise deduplication to avoid redundant concurrent requests
const PENDING_REQUESTS = new Map<string, Promise<string>>();

export const clearAICache = (): void => {
  AI_CACHE.clear();
  PENDING_REQUESTS.clear();
};

export const getAICacheStats = () => ({
  size: AI_CACHE.size,
  pending: PENDING_REQUESTS.size,
});

/**
 * Universal AI Dispatcher for kaiwa.live Platform.
 * Enhanced with LRU/TTL caching, in-flight deduplication, and exponential backoff retry.
 */
export const callAI = async (
  prompt: string,
  systemPrompt?: string,
  isJson: boolean = false,
  options?: { skipCache?: boolean; ttlMs?: number; maxRetries?: number },
): Promise<string> => {
  const normalizedKey = `[${isJson ? 'json' : 'text'}]::${(systemPrompt || '').trim()}::${prompt.trim()}`;

  // 1. Check in-memory cache if caching is not explicitly skipped
  if (!options?.skipCache) {
    const cached = AI_CACHE.get(normalizedKey);
    if (cached) {
      if (Date.now() < cached.expiresAt) {
        return cached.response;
      }
      AI_CACHE.delete(normalizedKey);
    }
  }

  // 2. Check in-flight promise deduplication
  if (PENDING_REQUESTS.has(normalizedKey)) {
    return PENDING_REQUESTS.get(normalizedKey)!;
  }

  const startTime = Date.now();
  const maxRetries = options?.maxRetries ?? 2;

  const executeRequest = async (): Promise<string> => {
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await callDeepSeek(
          prompt,
          systemPrompt,
          undefined,
          isJson,
          'deepseek-chat',
          false,
        );

        trackAITelemetry({
          provider: 'deepseek',
          model: 'deepseek-chat',
          durationMs: Date.now() - startTime,
          success: true,
        });

        // Store into LRU cache
        if (!options?.skipCache && result) {
          if (AI_CACHE.size >= MAX_CACHE_SIZE) {
            const oldestKey = AI_CACHE.keys().next().value;
            if (oldestKey) AI_CACHE.delete(oldestKey);
          }
          AI_CACHE.set(normalizedKey, {
            response: result,
            expiresAt: Date.now() + (options?.ttlMs ?? DEFAULT_TTL_MS),
          });
        }

        return result;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || '').toLowerCase();
        const isRateLimit =
          errMsg.includes('429') ||
          errMsg.includes('rate limit') ||
          errMsg.includes('too many requests');

        if (isRateLimit && attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(
            `[callAI] Rate limit encountered, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        trackAITelemetry({
          provider: 'deepseek',
          model: 'deepseek-chat',
          durationMs: Date.now() - startTime,
          success: false,
          error: err?.message,
        });
        throw err;
      }
    }
    throw lastError;
  };

  const pendingPromise = executeRequest().finally(() => {
    PENDING_REQUESTS.delete(normalizedKey);
  });

  PENDING_REQUESTS.set(normalizedKey, pendingPromise);
  return pendingPromise;
};

/**
 * Sequential batch runner to prevent hitting API burst rate limits (429).
 * Processes items sequentially with a courteous delay between calls.
 */
export async function batchSequentialAI<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  delayBetweenMs: number = 300,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i++) {
    const res = await worker(items[i], i);
    results.push(res);
    if (i < items.length - 1 && delayBetweenMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
    }
  }
  return results;
}

export const callSelectedAIProvider = callAI;
export const callDeepSeekAI = callAI;

/**
 * Detects user intent to provide accurate, helpful assistance without hallucinations.
 */
export function detectUserIntent(
  message: string,
): 'video_generation' | 'video_search' | 'video_prompt' | 'general' {
  const lower = message.toLowerCase();
  if (
    /video.*(qidir|topib|top|search|find|smotret|posmotret|qayerda)/i.test(lower) ||
    /(qidir|topib|top|search|find).*video/i.test(lower)
  ) {
    return 'video_search';
  }
  if (/prompt.*video|video.*prompt|storyboard|script.*video|video.*script/i.test(lower)) {
    return 'video_prompt';
  }
  if (
    /video.*(qil|yarat|tayyorla|generate|create|render|animatsiya|sdelat|sozdat)/i.test(lower) ||
    /(qil|yarat|tayyorla|generate|create|render|sozdat|sdelat).*video/i.test(lower)
  ) {
    return 'video_generation';
  }
  return 'general';
}

/**
 * Handles multi-turn chat with the AI, passing context about a specific subject.
 */
export const chatWithAI = async (
  message: string,
  history: ChatMessage[],
  contextContent: string,
  subjectName: string,
  _userKey?: string,
): Promise<string> => {
  const systemPrompt = `Siz kaiwa.live platformasidagi do'stona, professional va intellektual o'quv yordamchisisiz (AI Tutor & Assistant).

MUHIM QOIDALAR (STRICT CAPABILITY & LANGUAGE RULES):
1. LANGUAGE CONSISTENCY:
   - Foydalanuvchi qaysi tilda murojaat qilsa (O'zbekcha, English, Русский, 日本語 va h.k.), AYNAN O'SHA TILDA javob bering.
   - O'zbek tilidagi murojaatga ruscha yoki boshqa tilda javob bermang. Rus tilidagi murojaatga ruscha javob bering. Ingliz tilidagi murojaatga inglizcha javob bering.

2. CAPABILITY AWARENESS & NO HALLUCINATED LIMITATIONS:
   - Siz matnli AI yordamchisiz.
   - HECH QACHON "Bugun video yaratib bo'lmaydi", "Сегодня создать видео уже не получится", "Bugun limit tugadi", "Server band", "Keyinroq urinib ko'ring" kabi o'ylab topilgan vaqtinchalik bahonalar qilmang.
   - Agar foydalanuvchi video yoki animatsiya yaratishni so'rasa:
     * To'g'ridan-to'g'ri MP4 video faylini chatda render qilib bo'lmasligini 1 ta qisqa jumlada ayting.
     * DARHOL foydalanuvchiga amaliy va foydali yechim taqdim eting: AI Video vositalari (Runway Gen-3, Midjourney, Luma Dream Machine, Sora, Pika) uchun tayyor Promptlar, Sahna ko'rinishlari (Storyboard), Dialog va Ovozli matn (Voiceover Script) yozib bering.
   - Agar foydalanuvchi video qidirishni so'rasa: aniq qidiruv kalit so'zlari, YouTube/ta'lim kanallari va mavzu bo'yicha tavsiyalarni bering.
   - Agar foydalanuvchi video prompt so'rasa: to'g'ridan-to'g'ri batafsil video promptlarini taqdim eting.
   - Dars, grammatika, IELTS, JLPT, fan konspektlari, rejalashtirish yoki dasturlash bo'yicha so'rovlarga to'liq, amaliy va aniq javob bering.

3. CONTEXT & PEDAGOGY:
   - Mavzu/Fan nomi: "${subjectName || 'Umumiy'}"
   - Talabaning ushbu fanga oid konspekt va ma'lumotlari:
"""
${contextContent ? contextContent.substring(0, 10000) : 'Foydalanuvchi hali bu fan uchun konspekt kiritmagan.'}
"""
   - Agar konspekt mavjud bo'lsa, undan foydalaning. Agar yo'q bo'lsa, umumiy bilimlaringiz asosida javob bering.
   - Javoblarni chiroyli Markdown formatida taqdim eting.
`;

  try {
    const conversation = history
      .slice(-5)
      .map((h) => `${h.role === 'user' ? 'Student' : 'AI'}: ${h.text}`)
      .join('\n');
    const prompt = `Suhbat tarixi:\n${conversation}\n\nStudent: ${message}\nAI:`;
    const text = await callAI(prompt, systemPrompt, false);
    return text.trim();
  } catch (e) {
    console.error('AI Chat Error', e);
    throw new Error(parseAIError(e));
  }
};

/**
 * Safely extract JSON from any raw AI response (handling markdown fences, conversational prefix/suffix)
 */
export function extractJsonFromAiResponse<T = any>(raw: string): T {
  if (!raw || typeof raw !== 'string') {
    throw new Error("Bo'sh AI javobi.");
  }

  let cleaned = raw.trim();
  // Remove markdown code fences if present
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }

  // Find the boundary of first { or [ to matching last } or ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let startIndex = -1;
  let isObject = false;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    isObject = true;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    isObject = false;
  }

  if (startIndex !== -1) {
    const lastIndex = isObject ? cleaned.lastIndexOf('}') : cleaned.lastIndexOf(']');
    if (lastIndex !== -1 && lastIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, lastIndex + 1);
    }
  }

  return JSON.parse(cleaned);
}

export const generateAIResponse = async (
  messages: { role: 'system' | 'user'; content: string }[],
  optionsOrUserKey?: boolean | string | null | { isJson?: boolean; modelName?: string },
): Promise<string> => {
  try {
    let prompt = '';
    let systemPrompt = '';
    let isJson = false;

    if (typeof optionsOrUserKey === 'boolean') {
      isJson = optionsOrUserKey;
    } else if (optionsOrUserKey && typeof optionsOrUserKey === 'object') {
      isJson = Boolean(optionsOrUserKey.isJson);
    }

    messages.forEach((m) => {
      if (m.role === 'system') {
        systemPrompt += m.content + '\n';
      } else {
        prompt += `[${m.role.toUpperCase()}]: ${m.content}\n`;
      }
    });

    // Automatically detect if JSON output is requested in messages
    if (!isJson) {
      const combined = (systemPrompt + prompt).toLowerCase();
      if (
        combined.includes('json') ||
        combined.includes('valid json') ||
        combined.includes('json object') ||
        combined.includes('json format') ||
        combined.includes('json response') ||
        combined.includes('structure:')
      ) {
        isJson = true;
      }
    }

    const response = await callAI(prompt, systemPrompt || undefined, isJson);
    return response || '';
  } catch (error) {
    console.error('AI Error:', error);
    throw new Error(parseAIError(error));
  }
};

export interface AiTutorExplanation {
  questionNumber: string | number;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export const generateAiTutorExplanations = async (
  examTitle: string,
  wrongAnswers: {
    questionNumber: string | number;
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
  }[],
): Promise<AiTutorExplanation[]> => {
  if (wrongAnswers.length === 0) return [];

  const prompt = `
      Siz Tajribali O'qituvchi / AI Tutorsiz.
      Talaba "${examTitle}" imtihonida quyidagi savollardan xato qildi.
      
      Har bir xato qilingan savol uchun:
      1. Nega talabaning javobi xato ekanligini o'zbek tilida tushuntiring.
      2. Nega to'g'ri javob to'g'riligini aniq misol yoki qoida bilan ko'rsating.
      
      Xatolar ro'yxati:
      ${JSON.stringify(wrongAnswers, null, 2)}

      Javobni FAQAT QUYIDAGI JSON FORMATIDA qaytaring (hech qanday qo'shimcha matnsiz):
      [
        {
          "questionNumber": 1,
          "studentAnswer": "xato javob",
          "correctAnswer": "to'g'ri javob",
          "explanation": "Tushuntirish matni..."
        }
      ]
    `;

  try {
    const text = await callAI(prompt, undefined, true);
    return extractJsonFromAiResponse<AiTutorExplanation[]>(text);
  } catch (err) {
    console.error('AI Tutor Explanations Error:', err);
    return wrongAnswers.map((wa) => ({
      questionNumber: wa.questionNumber,
      studentAnswer: wa.studentAnswer,
      correctAnswer: wa.correctAnswer,
      explanation: `Ushbu savol bo'yicha to'g'ri javob: "${wa.correctAnswer}". Tahlil vaqtida xatolik yuz berdi.`,
    }));
  }
};
