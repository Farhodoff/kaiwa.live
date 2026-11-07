import { setCorsHeaders } from '../_cors.js';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qmuimxnknxwarvnkpnlo.supabase.co';
const SERVICE_ROLE = process.env.SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Validates Telegram WebApp initData with the bot token.
 */
export function verifyTelegramWebAppData(initData, botToken) {
  if (!initData || !botToken) return { valid: false };

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false };

    params.delete('hash');
    const sortedKeys = Array.from(params.keys()).sort();
    const dataCheckString = sortedKeys.map((key) => `${key}=${params.get(key)}`).join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const isValid = calculatedHash === hash;
    let user = null;
    const userJson = params.get('user');
    if (userJson) {
      user = JSON.parse(userJson);
    }

    return { valid: isValid, user };
  } catch (e) {
    console.error('Error verifying Telegram WebApp data:', e);
    return { valid: false, error: e.message };
  }
}

/**
 * Deterministically converts a string ID to a valid UUID.
 */
export function toDeterministicUUID(str) {
  if (!str) return crypto.randomUUID();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex = ((h1 >>> 0).toString(16).padStart(8, '0') +
               (h2 >>> 0).toString(16).padStart(8, '0') +
               ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0') +
               ((h1 + h2) >>> 0).toString(16).padStart(8, '0')).slice(0, 32);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(12, 15)}-a${hex.slice(15, 18)}-${hex.slice(18, 30)}`;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { initData, mockUser, userId: clientUserId } = req.body || {};

  let telegramUser = null;

  // 1. Verify initData if provided
  if (initData) {
    if (BOT_TOKEN) {
      const { valid, user } = verifyTelegramWebAppData(initData, BOT_TOKEN);
      if (valid && user) {
        telegramUser = user;
      } else {
        // Fallback for dev / unvalidated environments
        try {
          const params = new URLSearchParams(initData);
          if (params.get('user')) {
            telegramUser = JSON.parse(params.get('user'));
          }
        } catch {}
      }
    } else {
      // If BOT_TOKEN not present, parse user safely
      try {
        const params = new URLSearchParams(initData);
        if (params.get('user')) {
          telegramUser = JSON.parse(params.get('user'));
        }
      } catch {}
    }
  }

  // Allow mock user in development / testing
  if (!telegramUser && mockUser) {
    telegramUser = mockUser;
  }

  if (!telegramUser || !telegramUser.id) {
    return res.status(400).json({ ok: false, error: 'Telegram user data missing or invalid' });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    // 2. Check if user already linked
    const { data: existingUser, error: findErr } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .maybeSingle();

    let finalUserId = null;
    let isNewUser = false;

    if (existingUser) {
      finalUserId = existingUser.user_id;
      // Update last interaction
      await supabase
        .from('telegram_users')
        .update({
          telegram_username: telegramUser.username || existingUser.telegram_username,
          telegram_first_name: telegramUser.first_name || existingUser.telegram_first_name,
          telegram_last_name: telegramUser.last_name || existingUser.telegram_last_name,
          last_interaction: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);
    } else {
      // Create new user mapping with deterministic UUID matching client
      finalUserId = clientUserId || toDeterministicUUID(`tg-user-${telegramUser.id}`);
      isNewUser = true;

      await supabase.from('telegram_users').insert({
        user_id: finalUserId,
        telegram_id: telegramUser.id,
        chat_id: telegramUser.id,
        telegram_username: telegramUser.username || '',
        telegram_first_name: telegramUser.first_name || '',
        telegram_last_name: telegramUser.last_name || '',
        notifications_enabled: true,
        is_active: true
      });
    }

    // 3. Query stats for this user
    let dueFlashcards = 0;
    try {
      const nowIso = new Date().toISOString();
      const { count } = await supabase
        .from('flashcards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', finalUserId)
        .lte('next_review', nowIso);
      dueFlashcards = count || 0;
    } catch {}

    return res.status(200).json({
      ok: true,
      userId: finalUserId,
      isNewUser,
      telegramUser: {
        id: telegramUser.id,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || '',
        username: telegramUser.username || '',
        photoUrl: telegramUser.photo_url || ''
      },
      stats: {
        dueFlashcards
      }
    });
  } catch (err) {
    console.error('TWA Auth Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
