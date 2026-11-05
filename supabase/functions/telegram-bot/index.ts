// @ts-expect-error: Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-expect-error: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getSupabaseSecretKey } from '../_shared/secretKey.ts';

declare const Deno: { env: { get(key: string): string | undefined } };

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  date: number;
  text?: string;
  entities?: unknown[];
}

interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  message?: TelegramMessage;
  inline_message_id?: string;
  chat_instance?: string;
  data?: string;
  game_short_name?: string;
}

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// Supabase Secret key (sb_secret_...) — legacy SUPABASE_SERVICE_ROLE_KEY emas
const SUPABASE_KEY = getSupabaseSecretKey();

console.log('Bot initializing...', {
  hasToken: !!BOT_TOKEN,
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_KEY,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// HTML escaping helper to prevent Telegram API parsing crashes
function escapeHTML(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Keyboard layout for commands
const defaultKeyboard = {
  keyboard: [
    [{ text: '📅 Bugungi reja' }, { text: '📋 Bajarilganlar' }],
    [{ text: '📊 Mening statistikam' }, { text: '🎯 Maqsadlarim' }],
    [{ text: '➕ Yangi vazifa' }, { text: 'ℹ️ Yordam' }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

// Send message to Telegram with optional keyboard markup
async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup: Record<string, unknown> | null = defaultKeyboard,
) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

// Answer callback query to dismiss loading state in Telegram client
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
  const body: Record<string, unknown> = {
    callback_query_id: callbackQueryId,
  };
  if (text) {
    body.text = text;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

// Edit message text in-place
async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup: Record<string, unknown> | null = null,
) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

// Handle /start command
async function handleStart(message: TelegramMessage) {
  const chatId = message.chat.id;
  const msgText = message.text || '';
  let args = msgText.split(' ')[1]?.trim(); // Get code after /start
  if (!args && msgText.trim().length === 6 && /^[A-Za-z0-9]{6}$/.test(msgText.trim())) {
    args = msgText.trim().toUpperCase();
  }

  const telegramId = message.from?.id;
  const username = message.from?.username;
  const firstName = message.from?.first_name;
  const lastName = message.from?.last_name;

  console.log('/start received:', { chatId, args, telegramId });

  // Check if user already linked
  if (!args) {
    const { data: existingLink } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (existingLink) {
      // Already linked - show status
      return sendMessage(
        chatId,
        `✅ Akkauntingiz allaqachon bog'langan!

👤 Ism: ${escapeHTML(existingLink.telegram_first_name || '')}
📱 Username: @${escapeHTML(existingLink.telegram_username || "yo'q")}

🔔 Xabarnomalar: ${existingLink.notifications_enabled ? 'Yoniq' : "O'chiq"}

📋 Nima qila olasiz:
• Vazifalar va maqsadlar haqida xabarnomalar olish
• Deadline eslatmalari (24h & 1h oldin)
• Kunlik xulosalar (9:00 va 20:00)

⚙️ Sozlamalar: <a href="https://kaiwa.live/settings">kaiwa.live/settings</a> sahifasida

Yordam: /help`,
      );
    }
  }

  if (args && telegramId) {
    // Code linking flow
    const cleanCode = (args || '').trim().toUpperCase();
    console.log('Checking code:', cleanCode);

    const { data: linkCode, error } = await supabase
      .from('telegram_link_codes')
      .select('*')
      .ilike('code', cleanCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !linkCode) {
      console.log('Invalid code:', error);
      return sendMessage(
        chatId,
        "Noto'g'ri yoki muddati o'tgan kod!\n\nIltimos, <a href=\"https://kaiwa.live/settings\">kaiwa.live/settings</a> sahifasidan yangi kod oling.",
      );
    }

    // Create or update link in telegram_users
    const { error: linkError } = await supabase.from('telegram_users').upsert(
      {
        user_id: linkCode.user_id,
        telegram_id: telegramId,
        telegram_username: username,
        telegram_first_name: firstName,
        telegram_last_name: lastName,
        chat_id: chatId,
        is_active: true,
        notifications_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id' },
    );

    if (linkError) {
      console.error('Link error:', linkError);
      return sendMessage(chatId, "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }

    // Mark code used
    await supabase.from('telegram_link_codes').update({ used: true }).eq('id', linkCode.id);

    console.log('Successfully linked!');
    return sendMessage(
      chatId,
      "Muvaffaqiyatli ulandi!\n\nAkkauntingiz Telegram bilan bog'landi.\nEndi vazifalar va maqsadlar haqida xabarnomalar olasiz.",
    );
  } else {
    // Welcome message - not linked yet
    return sendMessage(
      chatId,
      `Salom! kaiwa.live botiga xush kelibsiz!

Akkauntingizni bog'lash uchun:
1. <a href="https://kaiwa.live">kaiwa.live</a> saytiga kiring.
2. <b>Settings → Telegram</b> sahifasiga o'ting.
3. Kod oling va <code>/start KOD</code> ko'rinishida yuboring.

Yordam: /help`,
    );
  }
}

// Handle /help command
async function handleHelp(message: TelegramMessage) {
  const chatId = message.chat.id;
  return sendMessage(
    chatId,
    `Buyruqlar:

/start - Boshlash
/time HH:MM - Vaqtni sozlash (masalan /time 08:00)
/done yoki /qilingan - Bajarilgan vazifalarni ko'rish
/today - Bugungi rejalarni ko'rish
/stats - Mening statistikam (daraja, XP, streak)
/goals - Maqsadlarni ko'rish
/add Vazifa nomi - Yangi vazifa qo'shish

Menyudan tugmalar yordamida ham tezkor foydalana olasiz!`,
  );
}

// Handle /done command
async function handleDone(message: TelegramMessage) {
  const chatId = message.chat.id;
  const telegramId = message.from?.id;

  if (!telegramId) return;

  try {
    // 1. Get user_id from telegram_users
    const { data: userLink, error: linkError } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .single();

    if (linkError || !userLink) {
      return sendMessage(
        chatId,
        '❌ Akkauntingiz topilmadi. Iltimos, oldin <a href="https://kaiwa.live/settings">kaiwa.live/settings</a> sahifasi orqali bog\'lang (/start KOD).',
      );
    }

    const userId = userLink.user_id;

    // 2. Fetch completed tasks for this user
    // We will fetch tasks where status is 'done' or completed is true, ordered by latest
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('title, updated_at, status, completed')
      .eq('user_id', userId)
      .or('status.eq.done,completed.eq.true')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return sendMessage(chatId, '❌ Vazifalarni yuklashda xatolik yuz berdi.');
    }

    if (!tasks || tasks.length === 0) {
      return sendMessage(chatId, "📭 Hali bajarilgan vazifalar yo'q. Harakatni davom ettiring! 💪");
    }

    // 3. Format the tasks
    let responseText = '✅ <b>Oxirgi bajarilgan vazifalar:</b>\n\n';
    tasks.forEach((task: { title: string; updated_at: string }, index: number) => {
      const date = new Date(task.updated_at).toLocaleDateString('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tashkent',
      });
      responseText += `${index + 1}. ${escapeHTML(task.title)} <i>(${date})</i>\n`;
    });

    return sendMessage(chatId, responseText);
  } catch (err) {
    console.error('handleDone exception:', err);
    return sendMessage(chatId, '❌ Tizimda xatolik yuz berdi.');
  }
}

// Handle /today command or refresh callback
async function handleToday(message: TelegramMessage, editMessageId: number | null = null) {
  const chatId = message.chat.id;
  const telegramId = message.from?.id;

  if (!telegramId) return;

  try {
    const { data: userLink, error: linkError } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .single();

    if (linkError || !userLink) {
      const failText =
        "❌ Akkauntingiz topilmadi. Iltimos, oldin veb sayt orqali bog'lang (/start KOD).";
      if (editMessageId) {
        return editMessageText(chatId, editMessageId, failText);
      }
      return sendMessage(chatId, failText);
    }

    // Get today's date string YYYY-MM-DD in Asia/Tashkent timezone (GMT+5)
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const today = dateFormatter.format(new Date());

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority')
      .eq('user_id', userLink.user_id)
      .eq('completed', false)
      .or(`due_date.lte.${today},due_date.is.null`)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10);

    if (tasksError) {
      console.error('Error fetching today tasks:', tasksError);
      const failText = '❌ Bugungi rejalarni yuklashda xatolik yuz berdi.';
      if (editMessageId) {
        return editMessageText(chatId, editMessageId, failText);
      }
      return sendMessage(chatId, failText);
    }

    if (!tasks || tasks.length === 0) {
      const emptyText = '🎉 Bugungi barcha vazifalar bajarilgan yoki hali reja tuzilmagan!';
      const emptyKeyboard = {
        inline_keyboard: [[{ text: '🔄 Yangilash', callback_data: 'refresh_today' }]],
      };
      if (editMessageId) {
        return editMessageText(chatId, editMessageId, emptyText, emptyKeyboard);
      }
      return sendMessage(chatId, emptyText, emptyKeyboard);
    }

    let text = '📅 <b>Bugungi rejalar (Bajarilmagan):</b>\n\n';
    tasks.forEach((task: { priority: string; title: string; due_date?: string }, index: number) => {
      const priorityEmoji =
        task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
      const dateStr = task.due_date
        ? task.due_date === today
          ? ' <i>(Bugun)</i>'
          : " <i>(Muddati o'tgan)</i>"
        : ' <i>(Sanasiz)</i>';
      text += `${index + 1}. ${priorityEmoji} ${escapeHTML(task.title)}${dateStr}\n`;
    });
    text += '\n✍️ <i>Vazifani bajarish uchun quyidagi raqamlardan birini bosing!</i>\n';
    text += 'Batafsil boshqarish: <a href="https://kaiwa.live/tasks">kaiwa.live/tasks</a>';

    // Build inline keyboard
    const inlineKeyboard = {
      inline_keyboard: [
        // First row of task numbers
        tasks.map((task: { id: string }, index: number) => ({
          text: `${index + 1}️⃣`,
          callback_data: `complete:${task.id}`,
        })),
        // Second row with a refresh button
        [{ text: '🔄 Yangilash', callback_data: 'refresh_today' }],
      ],
    };

    if (editMessageId) {
      return editMessageText(chatId, editMessageId, text, inlineKeyboard);
    }
    return sendMessage(chatId, text, inlineKeyboard);
  } catch (err) {
    console.error('handleToday exception:', err);
    const failText = '❌ Tizimda xatolik yuz berdi.';
    if (editMessageId) {
      return editMessageText(chatId, editMessageId, failText);
    }
    return sendMessage(chatId, failText);
  }
}

// Handle /stats command
async function handleStats(message: TelegramMessage) {
  const chatId = message.chat.id;
  const telegramId = message.from?.id;

  if (!telegramId) return;

  try {
    const { data: userLink, error: linkError } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .single();

    if (linkError || !userLink) {
      return sendMessage(
        chatId,
        '❌ Akkauntingiz topilmadi. Iltimos, oldin <a href="https://kaiwa.live/settings">kaiwa.live/settings</a> sahifasi orqali bog\'lang (/start KOD).',
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_xp, level, current_streak')
      .eq('id', userLink.user_id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return sendMessage(chatId, "❌ Profil ma'lumotlarini yuklashda xatolik yuz berdi.");
    }

    const text =
      `📊 <b>Mening statistikam:</b>\n\n` +
      `⭐ <b>Daraja (Level):</b> ${profile.level}\n` +
      `✨ <b>Umumiy XP:</b> ${profile.total_xp}\n` +
      `🔥 <b>Kunlik faollik (Streak):</b> ${profile.current_streak} kun\n\n` +
      `Batafsil ko'rish: <a href="https://kaiwa.live">kaiwa.live</a> 🚀`;
    return sendMessage(chatId, text);
  } catch (err) {
    console.error('handleStats exception:', err);
    return sendMessage(chatId, '❌ Tizimda xatolik yuz berdi.');
  }
}

// Handle /goals command
async function handleGoals(message: TelegramMessage) {
  const chatId = message.chat.id;
  const telegramId = message.from?.id;

  if (!telegramId) return;

  try {
    const { data: userLink, error: linkError } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .single();

    if (linkError || !userLink) {
      return sendMessage(
        chatId,
        '❌ Akkauntingiz topilmadi. Iltimos, oldin <a href="https://kaiwa.live/settings">kaiwa.live/settings</a> sahifasi orqali bog\'lang (/start KOD).',
      );
    }

    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('title, progress, completed')
      .eq('user_id', userLink.user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      return sendMessage(chatId, '❌ Maqsadlarni yuklashda xatolik yuz berdi.');
    }

    if (!goals || goals.length === 0) {
      return sendMessage(
        chatId,
        '🎯 Hali maqsadlar qo\'yilmagan. <a href="https://kaiwa.live/goals">kaiwa.live/goals</a> sahifasi orqali o\'z maqsadingizni belgilang!',
      );
    }

    let text = '🎯 <b>Mening maqsadlarim (Oxirgi 5 ta):</b>\n\n';
    goals.forEach(
      (goal: { title: string; progress: number; completed: boolean }, index: number) => {
        const status = goal.completed ? '✅' : '⏳';
        text += `${index + 1}. ${status} <b>${escapeHTML(goal.title)}</b> - <code>${goal.progress}%</code> bajarildi\n`;
      },
    );
    return sendMessage(chatId, text);
  } catch (err) {
    console.error('handleGoals exception:', err);
    return sendMessage(chatId, '❌ Tizimda xatolik yuz berdi.');
  }
}

// Handle /add command
async function handleAddTask(message: TelegramMessage, taskTitle: string) {
  const chatId = message.chat.id;
  const telegramId = message.from?.id;

  if (!telegramId || !taskTitle) return;

  try {
    const { data: userLink, error: linkError } = await supabase
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .single();

    if (linkError || !userLink) {
      return sendMessage(
        chatId,
        '❌ Akkauntingiz topilmadi. Iltimos, oldin <a href="https://kaiwa.live/settings">kaiwa.live/settings</a> sahifasi orqali bog\'lang (/start KOD).',
      );
    }

    const { error: insertError } = await supabase.from('tasks').insert({
      user_id: userLink.user_id,
      title: taskTitle,
      completed: false,
      status: 'todo',
      priority: 'medium',
    });

    if (insertError) {
      console.error('Insert task error:', insertError);
      return sendMessage(chatId, "❌ Yangi vazifa qo'shishda xatolik yuz berdi.");
    }

    return sendMessage(
      chatId,
      `✅ <b>Yangi vazifa muvaffaqiyatli qo'shildi:</b>\n\n📌 "${escapeHTML(taskTitle)}"`,
    );
  } catch (err) {
    console.error('handleAddTask exception:', err);
    return sendMessage(chatId, '❌ Tizimda xatolik yuz berdi.');
  }
}

// Handle Telegram inline callback query
async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery) {
  const callbackQueryId = callbackQuery.id;
  const data = callbackQuery.data;
  const message = callbackQuery.message;
  if (!message) return;
  const messageId = message.message_id || 0;

  if (!data) return;

  try {
    if (data.startsWith('complete:')) {
      const taskId = data.split(':')[1];

      // Mark task as completed in Supabase
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ completed: true, status: 'completed' })
        .eq('id', taskId);

      if (updateError) {
        console.error('Update task error in callback:', updateError);
        await answerCallbackQuery(callbackQueryId, '❌ Vazifani bajarishda xatolik yuz berdi.');
        return;
      }

      // Successfully completed
      await answerCallbackQuery(callbackQueryId, '✅ Vazifa bajarildi! (+50 XP) 🎉');

      // Refresh/update the message list
      await handleToday(message, messageId);
    } else if (data === 'refresh_today') {
      await answerCallbackQuery(callbackQueryId, '🔄 Bugungi rejalar yangilandi!');
      await handleToday(message, messageId);
    } else if (data.startsWith('excuse_')) {
      const parts = data.split('_');
      const excuseType = parts[1];
      const date = parts[2];

      // Get user_id from telegram_id
      const { data: userLink } = await supabase
        .from('telegram_users')
        .select('user_id')
        .eq('telegram_id', callbackQuery.from.id)
        .single();

      if (!userLink) {
        await answerCallbackQuery(callbackQueryId, '❌ Foydalanuvchi topilmadi.');
        return;
      }

      let reasonText = '';
      if (excuseType === 'tired') reasonText = 'Charchadim';
      else if (excuseType === 'notime') reasonText = "Vaqtim bo'lmadi";
      else if (excuseType === 'distracted') reasonText = 'Rejadan chiqib ketdim';
      else if (excuseType === 'other') reasonText = 'Boshqa sabab';

      if (excuseType !== 'other') {
        // Insert directly
        await supabase.from('missed_study_logs').insert({
          user_id: userLink.user_id,
          missed_date: date,
          reason: reasonText,
        });

        await editMessageText(
          message.chat.id,
          messageId,
          `✅ <b>Sababingiz qabul qilindi:</b> ${reasonText}\n\nIltimos, bu holat takrorlanmasligiga harakat qiling. Siz bunga qodirsiz! 💪`,
          null,
        );
        await answerCallbackQuery(callbackQueryId, 'Sabab saqlandi!');
      } else {
        // For 'other', ask user to type
        await supabase.from('missed_study_logs').insert({
          user_id: userLink.user_id,
          missed_date: date,
          reason: "Boshqa sabab (ko'rsatilmagan)",
        });
        await editMessageText(
          message.chat.id,
          messageId,
          `✅ Sababingiz qabul qilindi. Ertaga harakatni davom ettiring!`,
          null,
        );
        await answerCallbackQuery(callbackQueryId, 'Boshqa sabab tanlandi');
      }
    }
  } catch (err) {
    console.error('Callback query exception:', err);
    await answerCallbackQuery(callbackQueryId, '❌ Xatolik yuz berdi.');
  }
}

// Main webhook handler
serve(async (req: Request) => {
  try {
    const url = new URL(req.url);

    // Health check
    if (req.method === 'GET' || url.pathname.includes('health')) {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Webhook
    if (req.method === 'POST') {
      // Webhook secret validation (Strict requirement)
      const webhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
      if (!webhookSecret) {
        console.error('CRITICAL: TELEGRAM_WEBHOOK_SECRET is not configured in environment!');
        return new Response('Server Configuration Error', { status: 500 });
      }

      const receivedToken = req.headers.get('x-telegram-bot-api-secret-token');
      if (receivedToken !== webhookSecret) {
        console.warn('Unauthorized webhook request blocked. Secret token mismatch.');
        return new Response('Unauthorized', { status: 403 });
      }

      const update = await req.json();
      console.log('Update received:', JSON.stringify(update));

      // Handle callback queries (inline buttons)
      const callbackQuery = update.callback_query;
      if (callbackQuery) {
        await handleCallbackQuery(callbackQuery);
        return new Response('OK', { status: 200 });
      }

      const message = update.message;
      if (!message) {
        return new Response('OK', { status: 200 });
      }

      const text = message.text || '';

      if (text.startsWith('/start')) {
        await handleStart(message);
      } else if (text.startsWith('/time') || text === '⏰ Vaqtni sozlash') {
        if (text === '⏰ Vaqtni sozlash') {
          await sendMessage(
            message.chat.id,
            '⏰ Eslatmalar vaqtini sozlash uchun iltimos <code>/time HH:MM</code> formatida yozib yuboring.\n\nMasalan: <code>/time 08:00</code> (har kuni ertalab 8 da eslatma olish uchun) yoki <code>/time 20:30</code> (kechqurun 20:30 da olish uchun).',
          );
        } else {
          const time = text.split(' ')[1]?.trim();
          const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

          if (!time || !timeRegex.test(time)) {
            await sendMessage(
              message.chat.id,
              "❌ Noto'g'ri format! \n\nIltimos, vaqtni <code>HH:MM</code> formatida kiriting.\nMasalan: <code>/time 07:00</code> yoki <code>/time 21:30</code>",
            );
            return new Response('OK', { status: 200 });
          }

          // Update user time
          const { error } = await supabase
            .from('telegram_users')
            .update({ notification_time: time })
            .eq('telegram_id', message.from.id);

          if (error) {
            console.error('Update time error:', error);
            await sendMessage(message.chat.id, "❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
          } else {
            await sendMessage(
              message.chat.id,
              `✅ Xabarnoma vaqti o'zgartirildi: <b>${time}</b> ga.\n\nEndi har kuni shu vaqtda xabar olasiz.`,
            );
          }
        }
      } else if (text.startsWith('/help') || text === 'ℹ️ Yordam') {
        await handleHelp(message);
      } else if (
        text.startsWith('/done') ||
        text.startsWith('/qilingan') ||
        text === '📋 Bajarilgan vazifalar' ||
        text === '📋 Bajarilganlar'
      ) {
        await handleDone(message);
      } else if (text.startsWith('/today') || text === '📅 Bugungi reja') {
        await handleToday(message);
      } else if (text.startsWith('/stats') || text === '📊 Mening statistikam') {
        await handleStats(message);
      } else if (text.startsWith('/goals') || text === '🎯 Maqsadlarim') {
        await handleGoals(message);
      } else if (text.startsWith('/add') || text === '➕ Yangi vazifa') {
        if (text === '➕ Yangi vazifa') {
          await sendMessage(
            message.chat.id,
            "➕ Yangi vazifa qo'shish uchun quyidagi formatda yuboring:\n\n<code>/add Vazifa nomi</code>\n\nMasalan: <code>/add Matematikadan masalalar yechish</code>\n\nBot buni avtomatik saytga qo'shadi! 📝",
          );
        } else {
          const taskTitle = text.replace('/add', '').trim();
          if (!taskTitle) {
            await sendMessage(message.chat.id, "❌ Vazifa nomi bo'sh bo'lmasligi kerak!");
          } else {
            await handleAddTask(message, taskTitle);
          }
        }
      } else if (text.trim().length === 6 && /^[A-Za-z0-9]{6}$/.test(text.trim())) {
        await handleStart(message);
      } else {
        await sendMessage(
          message.chat.id,
          'Tushunmadim. Quyidagi menyu tugmalaridan foydalanishingiz mumkin:',
        );
      }

      return new Response('OK', { status: 200 });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Error:', error);
    return new Response('OK', { status: 200 }); // Always return 200 to Telegram
  }
});

console.log('Bot started successfully');
