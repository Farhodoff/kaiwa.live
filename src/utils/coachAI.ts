import { supabase, supabaseAnonKey } from '../lib/supabase';
import { AIServiceError } from './aiServiceError';
import { streamChatTokens } from './chatStream';

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
  const response = await fetch('/api/coach', {
    method: 'POST',
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
  if (!response.ok) throw new AIServiceError(response.status);
  const body = await response.json();
  const text = body.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('Azure AI returned no reply.');
  return text;
}
