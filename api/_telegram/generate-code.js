import { setCorsHeaders } from '../_cors.js';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../_auth.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qmuimxnknxwarvnkpnlo.supabase.co';
const SERVICE_ROLE = process.env.SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

    // Check if already linked
    const { data: existing } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ error: 'Telegram allaqachon ulangan', linked: true, account: existing });
    }

    // Delete old unused codes
    await supabase.from('telegram_link_codes').delete().eq('user_id', userId).eq('used', false);

    // Generate and insert
    const code = generateCode();
    const { data, error } = await supabase
      .from('telegram_link_codes')
      .insert({ user_id: userId, code })
      .select()
      .maybeSingle();

    if (error || !data) {
      console.error('Code insert error:', error);
      return res.status(500).json({ error: 'Kod yaratishda xatolik', details: error?.message });
    }

    return res.status(200).json({ code: data.code, expires_at: data.expires_at });
  } catch (err) {
    console.error('generate-code error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
}
