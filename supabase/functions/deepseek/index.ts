import { getCorsHeaders } from '../_shared/cors.ts';
// supabase/functions/deepseek/index.ts
// Supabase Edge Function (Deno Runtime) — Universal Secure DeepSeek AI Gateway

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. Health check route
  if (req.method === 'GET') {
    const rawKey = Deno.env.get('DEEPSEEK_API_KEY');
    const isConfigured = Boolean(rawKey && rawKey.trim().length > 10);
    return new Response(
      JSON.stringify({
        status: 'active',
        service: 'Supabase Edge DeepSeek Gateway',
        available: isConfigured,
        provider: 'DeepSeek',
        model: 'deepseek-chat',
        hint: isConfigured
          ? 'DeepSeek AI Gateway is active and configured.'
          : 'DEEPSEEK_API_KEY is missing in Supabase Edge Function Secrets.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Verify Server API Key
  const rawKey = Deno.env.get('DEEPSEEK_API_KEY');
  const serverKey = rawKey
    ? rawKey
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^Bearer\s+/i, '')
    : null;

  if (!serverKey || serverKey.length < 10) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'AI_NOT_CONFIGURED',
          message:
            'AI service is temporarily unavailable. DEEPSEEK_API_KEY is not configured in Supabase Secrets.',
        },
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    let payload: Record<string, any> = {};
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Sanitize and clamp payload
    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.messages)) {
        const rawMessages = payload.messages;
        const systemMessages = rawMessages.filter((m: any) => m && m.role === 'system');
        const nonSystemMessages = rawMessages.filter((m: any) => m && m.role !== 'system');

        // Keep last 20 conversational turns to avoid buffer bloat
        const trimmedNonSystem = nonSystemMessages.slice(-20).map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: typeof msg.content === 'string' ? msg.content : String(msg.content || ''),
        }));

        payload.messages = [...systemMessages.slice(0, 2), ...trimmedNonSystem];
      }

      if (typeof payload.max_tokens === 'number') {
        payload.max_tokens = Math.min(Math.max(Math.floor(payload.max_tokens), 1), 4096);
      }
      if (typeof payload.temperature === 'number') {
        payload.temperature = Math.min(Math.max(payload.temperature, 0), 2);
      }

      // JSON Mode compatibility: deepseek-reasoner does not support response_format
      if (payload.response_format && payload.response_format.type === 'json_object') {
        payload.model = 'deepseek-chat';
      }
      if (!payload.model || !['deepseek-chat', 'deepseek-reasoner'].includes(payload.model)) {
        payload.model = 'deepseek-chat';
      }
    }

    // 5. Dispatch to DeepSeek Official API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (
      payload.stream === true &&
      response.ok &&
      response.body &&
      response.headers.get('content-type')?.includes('text/event-stream')
    ) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }
    const resText = await response.text();
    let resJson;
    try {
      resJson = JSON.parse(resText);
    } catch {
      resJson = { raw: resText };
    }

    return new Response(JSON.stringify(resJson), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Supabase Edge DeepSeek Gateway error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'AI_UPSTREAM_ERROR',
          message: error?.message || 'Network error connecting to AI provider',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
