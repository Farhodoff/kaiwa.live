import { getCorsHeaders } from '../_shared/cors.ts';
// @ts-expect-error: Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-expect-error: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getSupabaseSecretKey } from '../_shared/secretKey.ts';

const BOT_TOKEN =
  Deno.env.get('TELEGRAM_BOT_TOKEN') || Deno.env.get('TELEGRAM_DATASET_BOT_TOKEN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// Supabase Secret key (sb_secret_...) — legacy SUPABASE_SERVICE_ROLE_KEY emas.
// Admin JWT yo'li bilan birga trusted server-to-server bearer solishtirishda ham ishlatiladi.
const SUPABASE_KEY = getSupabaseSecretKey();

// Mirrors public.is_admin() from the database (profiles.role OR owner email).
async function isAuthorizedAdmin(supabase: any, token: string): Promise<boolean> {
  // Server-to-server (cron) calls pass the service role key as the bearer.
  if (token === SUPABASE_KEY) return true;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return false;
  return (
    profile.role === 'admin' ||
    profile.role === 'superadmin' ||
    profile.email === 'fsoyilov@gmail.com'
  );
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // SECURITY: previously the body userId was trusted with no caller
    // authentication, letting anyone message any user's Telegram chat.
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    if (!(await isAuthorizedAdmin(supabase, token))) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const body = await req.json();
    const { userId, message, text, chatId, parse_mode } = body;
    const effectiveMessage = message || text;

    if (!effectiveMessage) {
      return new Response(JSON.stringify({ error: 'message or text is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!BOT_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN is not configured on server' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }

    let targetChatId: string | number | null = null;

    if (chatId) {
      // Authorized admin direct dispatch to a specific channel/group
      targetChatId = chatId;
    } else if (userId) {
      // 1. Get user's chat_id and verify notifications are enabled
      const { data: userLink, error: userError } = await supabase
        .from('telegram_users')
        .select('chat_id, notifications_enabled, is_active')
        .eq('user_id', userId)
        .single();

      if (userError || !userLink) {
        console.warn(`No linked Telegram user found for user: ${userId}`);
        return new Response(
          JSON.stringify({ success: false, error: 'User not linked to Telegram' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        );
      }

      if (!userLink.notifications_enabled || !userLink.is_active) {
        console.info(`User ${userId} has disabled notifications or is inactive`);
        return new Response(JSON.stringify({ success: false, error: 'Notifications disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      targetChatId = userLink.chat_id;
    } else {
      return new Response(JSON.stringify({ error: 'Either userId or chatId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. Send message via Telegram Bot API
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: effectiveMessage,
        parse_mode: parse_mode || 'HTML',
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error(`Telegram API Error:`, data);
      return new Response(JSON.stringify({ success: false, error: data.description }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, result: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Unexpected error in send-telegram-notification:', error);
    const err = error as { message?: string };
    return new Response(JSON.stringify({ error: err.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
