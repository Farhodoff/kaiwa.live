import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../_auth.js';
import { setCorsHeaders } from '../_cors.js';

const protectedEmails = new Set(['fsoyilov@gmail.com', 'admin@kaiwa.live']);
const role = (user) => user.app_metadata?.role;

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user } = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Kirish sessiyasi talab qilinadi.' });
  if (
    role(user) !== 'superadmin' &&
    !(user.email_confirmed_at && user.email?.toLowerCase() === 'fsoyilov@gmail.com')
  ) {
    return res.status(403).json({ error: 'Super admin ruxsati talab qilinadi.' });
  }

  const { userId } = req.body || {};
  if (
    typeof userId !== 'string' ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(userId)
  ) {
    return res.status(400).json({ error: 'Hisob ID raqami yaroqsiz.' });
  }
  if (userId.toLowerCase() === user.id.toLowerCase()) {
    return res.status(403).json({ error: 'O‘z hisobingizni bu yerda o‘chira olmaysiz.' });
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE;
  if (!url || !key) return res.status(503).json({ error: 'O‘chirish xizmati sozlanmagan.' });

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.admin.getUserById(userId);
    if (error || !data?.user) {
      return res
        .status(error?.status === 404 ? 404 : 502)
        .json({ error: 'Hisobni tekshirib bo‘lmadi.' });
    }
    const target = data.user;
    const profile = await client.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (profile.error) return res.status(502).json({ error: 'Hisob rolini tekshirib bo‘lmadi.' });
    if (
      protectedEmails.has(target.email?.toLowerCase()) ||
      [role(target), profile.data?.role].some(
        (value) => value === 'admin' || value === 'superadmin',
      )
    ) {
      return res.status(403).json({ error: 'Admin hisobini bu yerda o‘chirib bo‘lmaydi.' });
    }

    const deletion = await client.auth.admin.deleteUser(userId);
    if (deletion.error) {
      return res.status(502).json({ error: 'Hisobni bazadan o‘chirib bo‘lmadi.' });
    }
    return res.status(200).json({ success: true });
  } catch {
    return res.status(502).json({ error: 'Hisobni bazadan o‘chirib bo‘lmadi.' });
  }
}
