import { supabase, supabaseAnonKey } from '../lib/supabase';
import { purgeOversizedCookies } from '../lib/consoleFilter';
import { AIServiceError } from './aiServiceError';

export const streamChatTokens = async (
  messages: { role: string; content: string }[],
  onToken: (token: string) => void,
  isJson: boolean = false,
  signal?: AbortSignal,
  gateway = '/api/deepseek',
): Promise<string> => {
  purgeOversizedCookies();

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
    ...(gateway === '/api/deepseek' ? { model: 'deepseek-chat' } : {}),
    messages,
    stream: true,
  };

  if (isJson) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch(gateway, {
    method: 'POST',
    // Auth is sent below; unrelated localhost cookies can cause HTTP 431.
    credentials: 'omit',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new AIServiceError(response.status);
  }

  let accumulated = '';
  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:') || trimmed === 'data: [DONE]') return;
    let parsed;
    try {
      parsed = JSON.parse(trimmed.slice(5).trimStart());
    } catch {
      return;
    }
    if (parsed.error) throw new Error('AI stream returned an upstream error.');
    const delta = parsed.choices?.[0]?.delta?.content || '';
    if (delta) {
      accumulated += delta;
      onToken(delta);
    }
  };

  // Decode each network chunk immediately, preserving split UTF-8 characters and SSE lines.
  if (response.headers.get('content-type')?.includes('text/event-stream') && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    let completed = false;
    try {
      while (!completed) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        const { done, value } = await reader.read();
        if (done) {
          pending += decoder.decode();
          if (pending.trim()) consumeLine(pending);
          completed = true;
          break;
        }
        pending += decoder.decode(value, { stream: true });
        const lines = pending.split('\n');
        pending = lines.pop() || '';
        lines.forEach(consumeLine);
      }
    } finally {
      if (!completed) await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  } else {
    // Compatibility with older gateways that wrap SSE in { raw: "data: ..." }.
    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      /* Raw SSE response. */
    }
    const sseText = typeof data?.raw === 'string' ? data.raw : rawText;
    if (sseText.includes('data:')) {
      sseText.split('\n').forEach(consumeLine);
    } else {
      accumulated = data?.choices?.[0]?.message?.content || data?.reply || '';
      if (accumulated) onToken(accumulated);
    }
  }
  if (!accumulated.trim()) throw new Error('AI_EMPTY_RESPONSE: AI returned no dialogue.');
  return accumulated;
};
