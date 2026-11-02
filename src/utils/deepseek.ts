import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { purgeOversizedCookies } from '../lib/consoleFilter';

export interface DeepSeekRequestOptions {
  systemPrompt?: string;
  isJson?: boolean;
  modelName?: 'deepseek-chat' | 'deepseek-reasoner' | string;
  thinkingEnabled?: boolean;
}

/**
 * Universal DeepSeek AI Dispatcher.
 *
 * ARCHITECTURE INVARIANTS:
 * - Single AI Provider: DeepSeek.
 * - NO API keys on frontend / browser bundle.
 * - NO localStorage / sessionStorage / user settings API key / BYOK.
 * - All AI requests route strictly through POST /api/deepseek (Serverless Gateway).
 */
export const callDeepSeek = async (
  prompt: string,
  systemPromptOrOptions?: string | DeepSeekRequestOptions | null,
  systemPromptParam?: string,
  isJson: boolean = false,
  modelName: string = 'deepseek-chat',
  thinkingEnabled: boolean = false,
): Promise<string> => {
  let effectiveSystemPrompt: string | undefined = undefined;
  let effectiveIsJson = isJson;
  let effectiveModel = modelName;
  let effectiveThinking = thinkingEnabled;

  if (systemPromptOrOptions && typeof systemPromptOrOptions === 'object') {
    effectiveSystemPrompt = systemPromptOrOptions.systemPrompt;
    effectiveIsJson = Boolean(systemPromptOrOptions.isJson);
    effectiveModel = systemPromptOrOptions.modelName || 'deepseek-chat';
    effectiveThinking = Boolean(systemPromptOrOptions.thinkingEnabled);
  } else if (typeof systemPromptOrOptions === 'string') {
    effectiveSystemPrompt = systemPromptOrOptions;
  } else if (systemPromptParam) {
    effectiveSystemPrompt = systemPromptParam;
  }

  let actualModel = 'deepseek-chat';
  if (
    !effectiveIsJson &&
    (effectiveModel === 'deepseek-reasoner' ||
      effectiveModel.includes('reasoner') ||
      effectiveThinking)
  ) {
    actualModel = 'deepseek-reasoner';
  }

  const messages: { role: string; content: string }[] = [];
  if (effectiveSystemPrompt) {
    messages.push({ role: 'system', content: effectiveSystemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const payload: Record<string, unknown> = {
    model: actualModel,
    messages: messages,
  };

  if (effectiveIsJson) {
    payload.model = 'deepseek-chat';
    payload.response_format = { type: 'json_object' };
  }

  // Helper to format DeepSeek errors transparently
  const formatDeepSeekError = (status: number, errObj: any): string => {
    const rawMsg =
      errObj?.error?.message ||
      errObj?.message ||
      (typeof errObj?.error === 'string' ? errObj.error : null) ||
      '';
    const lower = rawMsg.toLowerCase();

    const errorCode =
      errObj?.error?.code || (typeof errObj?.error === 'string' ? errObj.error : null);
    if (
      status === 401 ||
      lower.includes('invalid api key') ||
      lower.includes('authentication fails') ||
      lower.includes('authentication') ||
      lower.includes('unauthorized')
    ) {
      return "AI_UNAVAILABLE: DeepSeek API kaliti noto'g'ri sozlangan yoki muddati o'tgan (Authentication Fails). Iltimos Vercel Dashboard → Settings → Environment Variables bo'limida DEEPSEEK_API_KEY kalitini yangilang.";
    }
    if (
      status === 503 ||
      errorCode === 'AI_UNAVAILABLE' ||
      errorCode === 'AI_NOT_CONFIGURED' ||
      lower.includes('unavailable') ||
      lower.includes('not configured')
    ) {
      return "AI_UNAVAILABLE: AI xizmati vaqtincha mavjud emas. Iltimos birozdan so'ng qayta urinib ko'ring.";
    }
    if (status === 429 || lower.includes('rate limit') || lower.includes('too many requests')) {
      return "AI_RATE_LIMITED: AI so'rovlar tezligi oshdi (429). Iltimos bir necha soniyadan so'ng qayta urinib ko'ring.";
    }
    if (status === 408 || lower.includes('timeout')) {
      return "AI_TIMEOUT: AI xizmati javob berish vaqti tugadi (Timeout). Iltimos qayta urinib ko'ring.";
    }
    if (
      status === 494 ||
      status === 431 ||
      lower.includes('header too large') ||
      lower.includes('cookie')
    ) {
      purgeOversizedCookies();
      return "AI_UNAVAILABLE: Brauzer xotirasi sarlavhalari to'ldi (HTTP 494). Kesh avtomatik tozalandi, iltimos sahifani yangilab qayta urinib ko'ring.";
    }
    if (lower.includes('balance') || lower.includes('insufficient')) {
      return "AI_UNAVAILABLE: DeepSeek hisobingizda mablag' (balans) tugagan. Iltimos DeepSeek hisobini to'ldiring.";
    }
    if (rawMsg) {
      return `AI_ERROR (${status}): ${rawMsg}`;
    }
    return `AI_ERROR: AI xizmatida xatolik yuz berdi (HTTP ${status}). Iltimos qayta urinib ko'ring.`;
  };

  const directUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/deepseek`;
  const anonKey = supabaseAnonKey;
  let bearerToken = anonKey;
  try {
    const sessionRes = await supabase.auth.getSession();
    if (sessionRes.data?.session?.access_token) {
      bearerToken = sessionRes.data.session.access_token;
    }
  } catch {
    // Keep anonKey fallback
  }

  // 1. Primary Direct Route: Supabase Edge Function (Low latency, authoritative)
  try {
    purgeOversizedCookies();
    const response = await fetch(directUrl, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal:
        typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
          ? AbortSignal.timeout(45000)
          : undefined,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.error) {
        const status =
          (data as any)?.status || (data.error?.code === 'AI_NOT_CONFIGURED' ? 503 : 400);
        throw new Error(formatDeepSeekError(status, data));
      }
      const text =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.message?.reasoning_content ||
        data.choices?.[0]?.text ||
        data.reply ||
        '';
      if (text && text.trim().length > 0) return text;
      throw new Error("AI_EMPTY_RESPONSE: AI xizmati bo'sh javob qaytardi.");
    } else {
      const errData = await response.json().catch(() => ({}));
      const errMsg = formatDeepSeekError(response.status, errData);
      if (
        response.status === 401 ||
        response.status === 429 ||
        response.status === 503 ||
        response.status === 402
      ) {
        console.warn('[DeepSeek Edge Direct] Status:', response.status, errMsg);
      }
    }
  } catch (directErr: any) {
    console.warn(
      '[DeepSeek Edge Direct] Notice, trying supabase.functions.invoke fallback:',
      directErr?.message,
    );
  }

  // 2. Secondary Route: Supabase SDK Function Invoke
  try {
    const { data, error } = await supabase.functions.invoke('deepseek', {
      body: payload,
    });

    if (!error && data) {
      if (data.error) {
        const status =
          (data as any)?.status || (data.error?.code === 'AI_NOT_CONFIGURED' ? 503 : 400);
        throw new Error(formatDeepSeekError(status, data));
      }
      const text =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.message?.reasoning_content ||
        data.choices?.[0]?.text ||
        data.reply ||
        '';
      if (text && text.trim().length > 0) return text;
      throw new Error("AI_EMPTY_RESPONSE: AI xizmati bo'sh javob qaytardi.");
    } else if (error) {
      console.warn('[DeepSeek Supabase SDK] Error:', error.message);
    }
  } catch (sdkErr: any) {
    console.warn('[DeepSeek Supabase SDK] Exception:', sdkErr?.message);
  }

  // 3. Fallback Route: Vercel Serverless Gateway (/api/deepseek)
  try {
    const serverlessResponse = await fetch('/api/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(payload),
      signal:
        typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
          ? AbortSignal.timeout(35000)
          : undefined,
    });

    if (serverlessResponse.ok) {
      const data = await serverlessResponse.json();
      if (data.error) {
        const status =
          (data as any)?.status || (data.error?.code === 'AI_NOT_CONFIGURED' ? 503 : 400);
        throw new Error(formatDeepSeekError(status, data));
      }
      const text =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.message?.reasoning_content ||
        data.choices?.[0]?.text ||
        data.reply ||
        '';
      if (text && text.trim().length > 0) return text;
    } else {
      const errData = await serverlessResponse.json().catch(() => ({}));
      const errMsg = formatDeepSeekError(serverlessResponse.status, errData);
      console.warn('[DeepSeek Vercel Gateway] Status:', serverlessResponse.status, errMsg);
    }
  } catch (gatewayErr: any) {
    console.warn('[DeepSeek Vercel Gateway] Exception:', gatewayErr?.message);
  }

  throw new Error(
    "AI_UNAVAILABLE: AI xizmati vaqtincha mavjud emas. Iltimos qayta urinib ko'ring.",
  );
};

/**
 * Streams tokens directly from DeepSeek via the Supabase Edge Function SSE stream.
 * Invokes onToken callback immediately as each token delta arrives.
 */
export const streamDeepSeekTokens = async (
  messages: { role: string; content: string }[],
  onToken: (token: string) => void,
  isJson: boolean = false,
  signal?: AbortSignal,
): Promise<string> => {
  purgeOversizedCookies();

  const directUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/deepseek`;
  const anonKey = supabaseAnonKey;
  let bearerToken = anonKey;
  try {
    const sessionRes = await supabase.auth.getSession();
    if (sessionRes.data?.session?.access_token) {
      bearerToken = sessionRes.data.session.access_token;
    }
  } catch {
    // Keep anonKey fallback
  }

  const payload: Record<string, unknown> = {
    model: 'deepseek-chat',
    messages,
    stream: true,
  };

  if (isJson) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch(directUrl, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Streaming failed (${response.status}): ${errText}`);
  }

  let accumulated = '';
  const rawText = await response.text();

  // 1. Check if Supabase wrapped the SSE in a JSON object: {"raw": "data: ...\n\ndata: ..."}
  let sseString = '';
  try {
    const parsedObj = JSON.parse(rawText);
    if (parsedObj && typeof parsedObj.raw === 'string') {
      sseString = parsedObj.raw;
    } else if (parsedObj?.choices?.[0]?.message?.content) {
      const fullContent = parsedObj.choices[0].message.content;
      accumulated = fullContent;
      onToken(fullContent);
      return accumulated;
    }
  } catch {
    // Not a JSON object, raw SSE text
    sseString = rawText;
  }

  if (!sseString && rawText.includes('data: ')) {
    sseString = rawText;
  }

  if (sseString) {
    const lines = sseString.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':') || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            accumulated += delta;
            onToken(delta);
          }
        } catch {}
      }
    }
  }

  if (!accumulated && rawText) {
    try {
      const fallbackObj = JSON.parse(rawText);
      accumulated =
        fallbackObj.reply ||
        fallbackObj.choices?.[0]?.text ||
        fallbackObj.choices?.[0]?.message?.content ||
        '';
      if (accumulated) {
        onToken(accumulated);
      }
    } catch {}
  }

  return accumulated;
};
