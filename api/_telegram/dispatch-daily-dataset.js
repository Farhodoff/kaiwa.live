import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qmuimxnknxwarvnkpnlo.supabase.co';
const SERVICE_ROLE = process.env.SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

function toAnonymousUserId(userIdOrEmail) {
    if (!userIdOrEmail) return 'anon_user';
    if (userIdOrEmail.includes('-') && userIdOrEmail.length >= 8) {
        return `user_${userIdOrEmail.split('-')[0]}`;
    }
    let hash = 0;
    for (let i = 0; i < userIdOrEmail.length; i++) {
        hash = ((hash << 5) - hash) + userIdOrEmail.charCodeAt(i);
        hash |= 0;
    }
    return `user_${Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8)}`;
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
        if (!isSecretValid && req.headers['host']?.includes('localhost') === false) {
            return res.status(401).json({ error: 'Unauthorized: invalid cron secret' });
        }
    }

    const body = req.body || {};
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_VAULT_BOT_TOKEN || process.env.TELEGRAM_DATASET_BOT_TOKEN;
    const targetChatId = body.chatId || process.env.TELEGRAM_VAULT_CHAT_ID || process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_DATASET_CHAT_ID;

    if (!botToken || !targetChatId) {
        return res.status(500).json({ 
            success: false, 
            error: 'Telegram Bot Token or Vault Chat ID is not configured in environment variables or request.' 
        });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
        // Explicitly format target date for Asia/Tashkent timezone (UTC+5)
        const todayStr = body.date || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(new Date());

        let messageText = body.message || '';
        let formattedSessions = [];

        if (!messageText) {
            // 1. Fetch speaking sessions for today (covering full 24h cycle)
            const { data: rawSessions, error: sessionErr } = await supabase
                .from('speaking_sessions')
                .select('*')
                .gte('created_at', `${todayStr}T00:00:00`)
                .lte('created_at', `${todayStr}T23:59:59.999Z`)
                .order('created_at', { ascending: false });

            if (sessionErr) {
                console.error('[Daily Speech Cron] Error fetching sessions:', sessionErr.message);
                return res.status(500).json({ success: false, error: sessionErr.message });
            }

            const sessions = rawSessions || [];
        let totalDurationSec = 0;
        const userSet = new Set();
        const topicCounts = new Map();
        const mistakesMap = new Map();

        const formattedSessions = sessions.map(s => {
            const dur = s.duration_seconds || s.duration || 0;
            totalDurationSec += dur;
            const anonUid = toAnonymousUserId(s.user_id || s.user_email);
            userSet.add(anonUid);

            const topic = s.persona_title || s.scenario_title || s.topic || 'Umumiy suhbat';
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);

            return {
                id: s.id,
                anonymousUserId: anonUid,
                language: s.language || 'ja',
                topic,
                durationSeconds: dur,
                score: s.overall_score || 80,
                audioPath: s.audio_path || s.audio_url,
                transcript: Array.isArray(s.transcript) ? s.transcript : []
            };
        });

        // 2. Build Telegram Message
        let messageText = `📊 <b>kaiwa.live — 22:00 KUNLIK OVOZLI SUHBATLAR HISOBOTI (${todayStr})</b>\n`;
        messageText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        messageText += `🗣 <b>Bugungi suhbatlar:</b> ${formattedSessions.length} ta\n`;
        messageText += `⏱ <b>Umumiy suhbat vaqti:</b> ${Math.round(totalDurationSec / 60)} daqiqa\n`;
        messageText += `👥 <b>Faol foydalanuvchilar:</b> ${userSet.size} nafar\n\n`;

        const topTopics = Array.from(topicCounts.entries())
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        if (topTopics.length > 0) {
            messageText += `🔥 <b>Eng ko'p gaplashilgan mavzular:</b>\n`;
            topTopics.forEach((t, i) => {
                messageText += `  ${i + 1}. <b>${t.topic}</b> (${t.count} ta)\n`;
            });
            messageText += `\n`;
        }

        if (formattedSessions.length > 0) {
            messageText += `📝 <b>SO'NGGI TRANSKRIPTLAR (Namuna):</b>\n`;
            formattedSessions.slice(0, 3).forEach((s) => {
                messageText += `\n━━━━━━━━━━━━━━━━\n`;
                messageText += `👤 <b>${s.anonymousUserId}</b> [${s.language.toUpperCase()}] • ${s.topic} (${Math.round(s.durationSeconds)}s, Ball: ${s.score}%)\n`;
                const userTurns = s.transcript.filter(t => t.role === 'user');
                userTurns.slice(0, 3).forEach(t => {
                    messageText += `🗣 <i>"${t.content}"</i>\n`;
                });
            });
        } else {
            messageText += `<i>Bugun hali yangi suhbatlar yozilmadi.</i>\n`;
        }

        messageText += `\n🤖 <i>kaiwa.live Automated Vault Engine (22:00 Auto-Purge)</i>`;
        }

        // 3. Dispatch to Telegram Bot API
        const telegramResp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: targetChatId,
                text: messageText,
                parse_mode: 'HTML'
            })
        });

        const telegramResult = await telegramResp.json();

        // 4. CRITICAL: Safe Audio Purge ONLY IF Telegram dispatch succeeded
        if (telegramResult && telegramResult.ok === true) {
            console.log('[Daily Speech Cron] ✅ Telegram message delivered successfully. Starting safe audio purge...');

            // Find all session audio paths for today
            const audioPathsToDelete = [];
            const sessionIdsWithAudio = [];

            for (const s of formattedSessions) {
                if (s.audioPath && typeof s.audioPath === 'string' && s.audioPath.trim().length > 0) {
                    audioPathsToDelete.push(s.audioPath.trim());
                    sessionIdsWithAudio.push(s.id);
                }
            }

            let deletedAudioCount = 0;
            if (audioPathsToDelete.length > 0) {
                // Delete from Supabase Storage
                const { data: removeData, error: removeErr } = await supabase.storage
                    .from('speaking_audios')
                    .remove(audioPathsToDelete);

                if (removeErr) {
                    console.warn('[Daily Speech Cron] Storage remove notice:', removeErr.message);
                } else {
                    deletedAudioCount = Array.isArray(removeData) ? removeData.length : audioPathsToDelete.length;
                    console.log(`[Daily Speech Cron] 🗑️ Deleted ${deletedAudioCount} audio files from speaking_audios storage.`);
                }

                // Update database rows to set audio_path = NULL (DO NOT DELETE ROWS)
                const { error: updateErr } = await supabase
                    .from('speaking_sessions')
                    .update({ audio_path: null, audio_url: null })
                    .in('id', sessionIdsWithAudio);

                if (updateErr) {
                    console.warn('[Daily Speech Cron] Database audio_path nullify notice:', updateErr.message);
                }
            }

            return res.status(200).json({
                success: true,
                message: `Daily report sent to Telegram. Audio files purged: ${deletedAudioCount}. All session records and transcripts preserved in DB.`,
                totalSessions: formattedSessions.length,
                audioPurgedCount: deletedAudioCount
            });
        } else {
            console.error('[Daily Speech Cron] ❌ Telegram dispatch failed:', telegramResult);
            return res.status(502).json({
                success: false,
                error: 'Telegram API returned error. Audio files were NOT deleted.',
                telegramResponse: telegramResult
            });
        }
    } catch (err) {
        console.error('[Daily Speech Cron] Unexpected error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
