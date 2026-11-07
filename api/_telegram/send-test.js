import { setCorsHeaders } from '../_cors.js';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../_auth.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qmuimxnknxwarvnkpnlo.supabase.co';
const SERVICE_ROLE = process.env.SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: userId must come from the verified JWT only. Never accept a
  // body-supplied userId — it allowed acting on arbitrary users' accounts.
  const { user, error: authError } = await verifyAuth(req);
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', details: authError || 'Authentication required' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { text } = req.body || {};

    const { data: account } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!account || !account.chat_id) {
      return res.status(404).json({ error: 'Telegram akkaunt topilmadi' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Bot token sozlanmagan' });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: account.chat_id,
        text: text || '🔔 Test xabarnomasi: Telegram bot ulanishi muvaffaqiyatli!',
        parse_mode: 'HTML',
      }),
    });
    const result = await response.json();
    return res.status(200).json({ ok: result.ok });
  } catch (err) {
    console.error('send-test error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
}
