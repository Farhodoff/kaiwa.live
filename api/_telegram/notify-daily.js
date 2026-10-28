import { createClient } from '@supabase/supabase-js';
import { getDailyKanji, getDailyVocab } from './daily-content.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qmuimxnknxwarvnkpnlo.supabase.co';
const SERVICE_ROLE = process.env.SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://kaiwa.live').replace(/\/+$/, '');

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { ok: false, error: 'No bot token' };
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Security check for cron secret if configured
  if (CRON_SECRET) {
    const authHeader = req.headers['authorization'] || '';
    const cronHeader = req.headers['x-cron-secret'] || '';
    const isSecretValid = cronHeader === CRON_SECRET || authHeader === `Bearer ${CRON_SECRET}`;
    if (!isSecretValid) {
      return res.status(401).json({ error: 'Unauthorized: invalid cron secret' });
    }
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Fetch all users with enabled notifications
    const { data: users, error: userErr } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('notifications_enabled', true);

    if (userErr || !users || users.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: 'No notification targets found' });
    }

    let sentCount = 0;

    for (const u of users) {
      if (!u.chat_id) continue;

      // 1. Fetch user's pending tasks
      let { data: tasks } = await supabase
        .from('tasks')
        .select('title, status, completed')
        .eq('user_id', u.user_id)
        .neq('status', 'done')
        .limit(5);

      if (!tasks || tasks.length === 0) {
        const { data: fallbackTasks } = await supabase
          .from('tasks')
          .select('title, status, completed')
          .eq('user_id', u.user_id)
          .eq('completed', false)
          .limit(5);
        tasks = fallbackTasks || [];
      }

      // 2. Fetch due flashcards count (SRS)
      const nowIso = new Date().toISOString();
      let dueCardsCount = 0;
      try {
        const { count } = await supabase
          .from('flashcards')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', u.user_id)
          .lte('next_review', nowIso);
        dueCardsCount = count || 0;
      } catch (e) {
        console.warn('Could not query due flashcards:', e?.message);
      }

      // 3. Check today's speaking sessions (10-minute habit)
      const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(new Date());
      let todaySpeakingCount = 0;
      try {
        const { count } = await supabase
          .from('speaking_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', u.user_id)
          .gte('created_at', `${todayDateStr}T00:00:00`);
        todaySpeakingCount = count || 0;
      } catch (e) {
        console.warn('Could not query speaking sessions:', e?.message);
      }

      // 4. Fetch user streak
      let streak = 1;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('streak, total_xp')
          .eq('id', u.user_id)
          .maybeSingle();
        if (profile?.streak) streak = profile.streak;
      } catch (e) {
        console.warn('Could not query profile streak:', e?.message);
      }

      let habitStatus = '';
      if (todaySpeakingCount > 0) {
        habitStatus = `✅ <b>Speaking Coach:</b> Bugungi muloqot bajarildi (${todaySpeakingCount} ta sessiya)! 👏`;
      } else {
        habitStatus = `🎙 <b>Speaking Coach:</b> Bugun hali 10 daqiqalik suhbat qilmadingiz!\n<i>🔥 ${streak} kunlik streakingizni saqlab qolish uchun hoziroq gapiring.</i>`;
      }

      let flashcardStatus = '';
      if (dueCardsCount > 0) {
        flashcardStatus = `\n📚 <b>Anki SRS Fleshkartalar:</b> Bugun <b>${dueCardsCount} ta</b> so'zni takrorlash kerak.`;
      }

      let taskSummary = '';
      if (tasks && tasks.length > 0) {
        taskSummary = '\n📌 <b>Kutilayotgan vazifalar:</b>\n' + tasks.map((t, i) => `${i + 1}. ⏳ ${escapeHTML(t.title)}`).join('\n');
      }

      const dailyKanji = getDailyKanji();
      const dailyVocab = getDailyVocab();

      const dailyBite =
        `\n\n🈁 <b>Bugungi Kanji:</b> 「${dailyKanji.kanji}」 (${dailyKanji.level}) — ${dailyKanji.meaning}\n` +
        `   └ <i>${dailyKanji.onyomi} / ${dailyKanji.kunyomi}</i>\n` +
        `📝 <b>Bugungi So'z:</b> 「${dailyVocab.word}」 [${dailyVocab.reading}] — ${dailyVocab.meaning}\n` +
        `   └ <i>${dailyVocab.exampleUzbek}</i>`;

      const messageText =
        `🌙 <b>Xayrli oqshom, ${escapeHTML(u.telegram_first_name || 'talaba')}!</b>\n\n` +
        `${habitStatus}${flashcardStatus}${taskSummary}${dailyBite}\n\n` +
        `🚀 <b>Darslarni bajarish:</b>\n👉 <a href="${APP_URL}/speaking">Speaking Coach</a> | <a href="${APP_URL}/decks">Fleshkartalar</a>`;

      const notificationMarkup = {
        inline_keyboard: [
          [{ text: '🎲 Bugungi Quiz (1 daq)', callback_data: 'quiz_0' }],
          [{ text: '🚀 Telegram Mini App', web_app: { url: `${APP_URL}/` } }],
        ],
      };

      await sendTelegramMessage(u.chat_id, messageText, notificationMarkup);
      sentCount++;
    }

    return res.status(200).json({ success: true, sentCount });
  } catch (err) {
    console.error('notify-daily error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
}
