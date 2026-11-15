import { supabase, supabaseAnonKey } from '../lib/supabase';
import { AIServiceError } from './aiServiceError';
import { streamChatTokens } from './chatStream';
import { captureException } from '../lib/errorTracking';

/** Azure-only conversation path. No external-provider fallback. */
export const streamCoachTokens = (
  messages: { role: string; content: string }[],
  onToken: (token: string) => void,
  isJson = false,
  signal?: AbortSignal,
) => streamChatTokens(messages, onToken, isJson, signal, '/api/coach');

export async function callCoachAI(
  prompt: string,
  systemPrompt?: string,
  isJson = false,
): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ];
  let response = await fetch('/api/coach', {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data?.session?.access_token || supabaseAnonKey}`,
    },
    body: JSON.stringify({
      messages,
      ...(isJson ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (
    !response.ok &&
    (response.status === 401 || response.status === 403) &&
    data?.session?.access_token
  ) {
    console.warn('[callCoachAI] User token rejected, retrying with anonKey...');
    response = await fetch('/api/coach', {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        messages,
        ...(isJson ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(45000),
    });
  }

  if (!response.ok) {
    console.error(`[callCoachAI] Coach API returned HTTP ${response.status}`);
    captureException(new Error(`[callCoachAI] Coach API returned HTTP ${response.status}`), {
      status: response.status,
    });
    throw new AIServiceError(response.status);
  }
  const body = await response.json();
  const text = body.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('Azure AI returned no reply.');
  return text;
}
