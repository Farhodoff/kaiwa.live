/**
 * kaiwa.live — 22:00 Daily Telemetry & Dataset Cron Script
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_DATASET_BOT_TOKEN || process.env.TELEGRAM_VAULT_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_DATASET_CHAT_ID || process.env.TELEGRAM_VAULT_CHAT_ID || process.env.VITE_TELEGRAM_DATASET_CHAT_ID || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

function getTashkentDate() {
    const now = new Date();
    // UTC+5 for Tashkent
    const tashkentTime = new Date(now.getTime() + (5 * 60 * 60 * 1000));
    return tashkentTime.toISOString().split('T')[0];
}

function httpsRequest(fullUrl, options = {}, postData = null) {
    return new Promise((resolve, reject) => {
        const u = new URL(fullUrl);
        const reqOptions = {
            hostname: u.hostname,
            port: 443,
            path: u.pathname + u.search,
            method: options.method || (postData ? 'POST' : 'GET'),
            headers: options.headers || {}
        };

        if (postData) {
            reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = https.request(reqOptions, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch {
                    resolve(body);
                }
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function sendTelegramMessage(text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML'
    });

    return httpsRequest(url, {
        headers: { 'Content-Type': 'application/json' }
    }, payload);
}

async function sendTelegramDocument(filePath, filename, caption = '') {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileData = fs.readFileSync(filePath);

    let body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${CHAT_ID}\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/json\r\n\r\n`),
        fileData,
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
    return httpsRequest(url, {
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
    }, body);
}

async function main() {
    const today = getTashkentDate();
    console.log(`[kaiwa.live Cron 22:00] Starting daily telemetry dispatch for date: ${today}`);

    let sessions = [];
    try {
        const queryUrl = `${SUPABASE_URL}/rest/v1/speaking_sessions?select=*&created_at=gte.${today}T00:00:00.000Z&created_at=lte.${today}T23:59:59.999Z&order=created_at.desc`;
        const res = await httpsRequest(queryUrl, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (Array.isArray(res)) {
            sessions = res;
        }
    } catch (e) {
        console.error('Supabase query error:', e);
    }

    console.log(`Found ${sessions.length} speaking sessions for today.`);

    let totalDurationSec = 0;
    const userSet = new Set();
    const topicCounts = new Map();
    const mistakesMap = new Map();

    sessions.forEach(s => {
        const dur = s.duration_seconds || s.duration || 0;
        totalDurationSec += dur;
        const uId = s.user_email || s.user_id || 'Student';
        userSet.add(uId);

        const topic = s.persona_title || s.scenario_title || s.topic || 'Umumiy suhbat';
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);

        if (Array.isArray(s.grammar_corrections)) {
            s.grammar_corrections.forEach(c => {
                if (c.original && c.corrected) {
                    const key = `${c.original}->${c.corrected}`;
                    const count = (mistakesMap.get(key)?.count || 0) + 1;
                    mistakesMap.set(key, { mistake: c.original, correction: c.corrected, count });
                }
            });
        }
    });

    const topTopics = Array.from(topicCounts.entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const topMistakes = Array.from(mistakesMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const totalMinutes = Math.round(totalDurationSec / 60);

    // 1. Build Telegram Message
    let msg = `📊 <b>KAIWA.LIVE — KUNLIK 22:00 HISOBOTI (${today})</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🗣 <b>Jami Ovozli Suhbatlar:</b> ${sessions.length} ta\n`;
    msg += `⏱ <b>Umumiy Suhbat Vaqti:</b> ${totalMinutes} daqiqa\n`;
    msg += `👥 <b>Faol O'quvchilar:</b> ${userSet.size} nafar\n\n`;

    if (topTopics.length > 0) {
        msg += `🔥 <b>Eng ko'p gaplashilgan mavzular:</b>\n`;
        topTopics.forEach((t, i) => {
            msg += `  ${i + 1}. <b>${t.topic}</b> (${t.count}x)\n`;
        });
        msg += `\n`;
    }

    if (topMistakes.length > 0) {
        msg += `⚠️ <b>Eng ko'p uchragan xatolar (Grammar):</b>\n`;
        topMistakes.forEach((m, i) => {
            msg += `  ${i + 1}. <s>${m.mistake}</s> ➔ <b>${m.correction}</b> (${m.count}x)\n`;
        });
        msg += `\n`;
    }

    if (sessions.length > 0) {
        msg += `📝 <b>SO'NGGI TRANSKRIPTLAR (Namuna):</b>\n`;
        sessions.slice(0, 3).forEach((s) => {
            const topic = s.persona_title || s.scenario_title || s.topic || 'Suhbat';
            const lang = s.language || 'ja';
            msg += `\n━━━━━━━━━━━━━━━━\n`;
            msg += `👤 <b>${s.user_email || 'O\'quvchi'}</b> [${lang.toUpperCase()}] • ${topic} (${Math.round(s.duration_seconds || 0)}s, Ball: ${s.overall_score || 80}%)\n`;
            
            const transcript = Array.isArray(s.transcript) ? s.transcript : [];
            const userTurns = transcript.filter(t => t.role === 'user');
            userTurns.slice(0, 3).forEach(t => {
                msg += `🗣 <i>"${t.content}"</i>\n`;
            });
        });
    } else {
        msg += `<i>Bugun yangi ovozli suhbatlar qayd etilmadi. Barcha AI xizmatlari barqaror holatda.</i>\n`;
    }

    msg += `\n🤖 <i>kaiwa.live Telemetry Cron Engine (22:00 Dispatch)</i>`;

    console.log('Sending message to Telegram...');
    const result = await sendTelegramMessage(msg);
    console.log('Telegram send result:', result);

    // 2. If sessions exist, export dataset JSONL and send as document
    if (sessions.length > 0) {
        const jsonlLines = sessions.map(s => JSON.stringify({
            id: s.id,
            user_id: s.user_id,
            created_at: s.created_at,
            language: s.language,
            topic: s.persona_title || s.scenario_title || s.topic,
            duration: s.duration_seconds,
            score: s.overall_score,
            transcript: s.transcript
        })).join('\n');

        const tempFilePath = path.join(__dirname, `dataset_${today}.jsonl`);
        fs.writeFileSync(tempFilePath, jsonlLines, 'utf-8');

        console.log('Sending dataset document to Telegram...');
        await sendTelegramDocument(tempFilePath, `dataset_${today}.jsonl`, `📦 <b>Bugungi AI Training Dataset (${today})</b>`);
        fs.unlinkSync(tempFilePath);
        console.log('Dataset document sent successfully!');
    }
}

main().catch(err => {
    console.error('Fatal cron error:', err);
    process.exit(1);
});
