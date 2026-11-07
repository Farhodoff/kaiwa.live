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
    const { data } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return res.status(200).json({ linked: !!data, account: data });
  } catch (err) {
    console.error('check-link error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
