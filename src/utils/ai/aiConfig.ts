/// <reference types="vite/client" />
import { safeStorage } from '../safeStorage';

export type AIProvider = 'deepseek';

// Persistent cache to prevent duplicate requests across page reloads
const CACHE_PREFIX = 'study_planner_ai_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const aiCache = {
  has: (key: string): boolean => {
    const item = safeStorage.getItem<{ value: unknown; expiry: number }>(CACHE_PREFIX + key);
    if (!item) return false;
    if (Date.now() > item.expiry) {
      safeStorage.removeItem(CACHE_PREFIX + key);
      return false;
    }
    return true;
  },
  get: (key: string): unknown | undefined => {
    const item = safeStorage.getItem<{ value: unknown; expiry: number }>(CACHE_PREFIX + key);
    if (!item) return undefined;
    if (Date.now() > item.expiry) {
      safeStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    return item.value;
  },
  set: (key: string, value: unknown): void => {
    const item = {
      value,
      expiry: Date.now() + CACHE_TTL_MS,
    };
    safeStorage.setItem(CACHE_PREFIX + key, item);
  },
};

/**
 * Returns single DeepSeek AI configuration.
 * All requests route through /api/deepseek backend gateway.
 */
export const getAIConfig = () => {
  return {
    provider: 'deepseek' as AIProvider,
    deepseekModel: 'deepseek-chat' as const,
    deepseekThinkingMode: false,
    coachAiModel: 'deepseek' as AIProvider,
  };
};

/**
 * Checks if AI service is configured on platform.
 * Always true on client because server handles the central DEEPSEEK_API_KEY.
 */
export const isAIKeyConfigured = (): boolean => {
  return true;
};

export const getAIProvider = async (): Promise<AIProvider> => {
  return 'deepseek';
};

/**
 * Speech Recognition Safeguard Validator
 * Enforces minimum audio duration (>= 1200ms) and transcript length / word count
 * (spokenText.length >= 5 || words.length >= 2) before triggering AI calls.
 */
export const validateSpeechInput = (spokenText: string, durationMs?: number): boolean => {
  const trimmed = spokenText.trim();
  if (!trimmed) return false;

  if (durationMs !== undefined && durationMs < 1200) {
    return false;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  return trimmed.length >= 5 || words.length >= 2;
};

/**
 * Texnik AI xato xabarlarini foydalanuvchiga tushunarli O'zbek tilidagi xabarlarga aylantiradi.
 */
export const parseAIError = (error: unknown): string => {
  const err = error as { message?: string; status?: number };
  const msg = (err?.message || '').toLowerCase();

  if (msg.includes('503') || msg.includes('ai_unavailable') || msg.includes('unavailable')) {
    return "AI xizmati vaqtincha mavjud emas. Iltimos keyinroq qayta urinib ko'ring.";
  }

  if (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('quota')
  ) {
    return "AI so'rovlar limiti va tezligi oshdi (429 rate limit). Iltimos bir necha soniyadan so'ng qayta urinib ko'ring.";
  }

  if (msg.includes('404') || msg.includes('not found')) {
    return "AI model topilmadi yoki xizmat vaqtincha mavjud emas. Iltimos qayta urinib ko'ring.";
  }

  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('net::') ||
    msg.includes('connection refused')
  ) {
    return "Internet aloqasi yo'q yoki server javob bermayapti. Internet ulanishingizni tekshiring.";
  }

  if (
    msg.includes('494') ||
    msg.includes('431') ||
    msg.includes('header too large') ||
    msg.includes('cookie')
  ) {
    return "Brauzer xotirasi sarlavhalari to'ldi (HTTP 494). Iltimos sahifani yangilang (Ctrl+F5 / Cmd+Shift+R) va qayta urinib ko'ring.";
  }

  const sanitizedMsg = msg
    .replace(/(aizasy[a-z0-9_-]{33})/gi, 'AIzaSy[REDACTED]')
    .replace(/(sk-[a-z0-9_-]{20,})/gi, 'sk-[REDACTED]')
    .replace(/(bearer\s+[a-z0-9._-]+)/gi, 'Bearer [REDACTED]');
  return `AI xatoligi yuz berdi: ${sanitizedMsg.substring(0, 150)}`;
};
