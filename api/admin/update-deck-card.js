import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth, SUPABASE_ANON_KEY } from '../_auth.js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://qmuimxnknxwarvnkpnlo.supabase.co';
const SERVICE_ROLE = process.env.SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAILS = new Set([
  'fsoyilov@gmail.com',
  'admin@kaiwa.live',
  'admin@nihongo-talk.jp',
  'fsoyilovv@gmail.com',
  'xmprofile42@gmail.com',
]);

const DECK_FILE_MAP = {
  deck_minna_shokyu1: 'minna_shokyu1.json',
  minna_shokyu1: 'minna_shokyu1.json',
  deck_minna_shokyu2: 'minna_shokyu2.json',
  minna_shokyu2: 'minna_shokyu2.json',
  deck_jlpt_n5: 'jlpt_n5.json',
  jlpt_n5: 'jlpt_n5.json',
  deck_jlpt_n4: 'jlpt_n4.json',
  jlpt_n4: 'jlpt_n4.json',
  deck_jlpt_n3: 'jlpt_n3.json',
  jlpt_n3: 'jlpt_n3.json',
  deck_jlpt_n2: 'jlpt_n2.json',
  jlpt_n2: 'jlpt_n2.json',
  deck_jlpt_n1: 'jlpt_n1.json',
  jlpt_n1: 'jlpt_n1.json',
};

function normalizeKey(text) {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '')
    .replace(/[\[（(［「【].*?[\]）)］」】]/g, '');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Verify Authentication
  const { user, error: authError } = await verifyAuth(req);
  const userEmail = (user?.email || '').toLowerCase().trim();
  const userRole = user?.app_metadata?.role || user?.user_metadata?.role || user?.role;

  const isAdmin =
    ADMIN_EMAILS.has(userEmail) ||
    userRole === 'admin' ||
    userRole === 'superadmin' ||
    process.env.NODE_ENV === 'development';

  if (!isAdmin && authError) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { word, front, back, phonetic, example, deck_id, batch } = body || {};

    const itemsToProcess = Array.isArray(batch) && batch.length > 0
      ? batch
      : [{ word, front, back, phonetic, example, deck_id }];

    // 2. Persist to Supabase using service role if available or anon
    const client = createClient(SUPABASE_URL, SERVICE_ROLE || SUPABASE_ANON_KEY);

    for (const item of itemsToProcess) {
      const cleanWord = (item.word || item.front || '').trim();
      const cleanFront = (item.front || item.word || '').trim();
      const cleanBack = (item.back || '').trim();
      const cleanPhonetic = item.phonetic ? item.phonetic.trim() : '';
      const cleanExample = item.example ? item.example.trim() : '';

      if (!cleanWord || !cleanBack) continue;

      const payload = {
        word: cleanWord,
        front: cleanFront,
        phonetic: cleanPhonetic,
        back: cleanBack,
        example: cleanExample,
        deck_id: item.deck_id || null,
        updated_by: userEmail || 'admin',
        updated_at: new Date().toISOString(),
      };

      await client.from('global_flashcard_overrides').upsert(payload, { onConflict: 'word' });
    }

    // 3. If running in an environment where filesystem is writable, update JSON directly
    let fileUpdated = false;
    let targetFileName = null;
    try {
      const decksDir = path.resolve(process.cwd(), 'src', 'data', 'decks');
      if (fs.existsSync(decksDir)) {
        for (const item of itemsToProcess) {
          const targetWord = (item.word || item.front || '').trim();
          const normWord = normalizeKey(targetWord);
          const newFront = (item.front || targetWord).trim();
          const newBack = (item.back || '').trim();
          const newPhonetic = item.phonetic ? item.phonetic.trim() : undefined;
          const newExample = item.example ? item.example.trim() : undefined;

          const targetFile = item.deck_id ? DECK_FILE_MAP[item.deck_id] : null;
          const deckFiles = fs.readdirSync(decksDir).filter(f => f.endsWith('.json') && !f.includes('backups'));
          const filesToSearch = targetFile && deckFiles.includes(targetFile)
            ? [targetFile, ...deckFiles.filter(f => f !== targetFile)]
            : deckFiles;

          for (const df of filesToSearch) {
            const filePath = path.join(decksDir, df);
            const raw = fs.readFileSync(filePath, 'utf8');
            let cards = JSON.parse(raw);
            let matched = false;

            for (let i = 0; i < cards.length; i++) {
              const c = cards[i];
              const cFront = (c.front || '').trim();
              const cNorm = normalizeKey(cFront);

              if (
                cFront === targetWord ||
                cNorm === normWord ||
                cFront.toLowerCase() === targetWord.toLowerCase() ||
                (item.front && (cFront === item.front || cNorm === normalizeKey(item.front)))
              ) {
                cards[i] = {
                  ...c,
                  front: newFront,
                  back: newBack,
                  phonetic: newPhonetic !== undefined ? newPhonetic : c.phonetic,
                  example: newExample !== undefined ? newExample : c.example,
                };
                matched = true;
                break;
              }
            }

            if (matched) {
              fs.writeFileSync(filePath, JSON.stringify(cards, null, 2) + '\n', 'utf8');
              fileUpdated = true;
              targetFileName = df;
              break;
            }
          }
        }
      }
    } catch (fsErr) {
      console.warn('[update-deck-card] Notice: File update skipped:', fsErr.message);
    }

    return res.status(200).json({
      success: true,
      fileUpdated,
      targetFileName,
      message: "Flashcard o'zgarishi bazada va JSON fayllarda muvaffaqiyatli saqlandi.",
    });
  } catch (err) {
    console.error('[update-deck-card] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
