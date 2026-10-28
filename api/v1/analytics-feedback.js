import { verifyAuth } from '../_auth.js';
import { checkRateLimit } from '../_rateLimit.js';

export const config = {
  runtime: 'edge',
};

function safeParseJson(rawContent, fallback = {}) {
  if (!rawContent || typeof rawContent !== 'string') return fallback;
  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    const match = rawContent.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return fallback;
  }
}

export default async function handler(req) {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // 2. Health check endpoint via GET
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'online',
        service: 'Real-time Analytics & AI Feedback Service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed. Use POST or GET.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 3. Optional auth check (authenticated or guest)
  let authUser = null;
  try {
    const { user } = await verifyAuth(req);
    if (user?.id) authUser = user;
  } catch {
    // Guest user allowed with tighter rate limits
  }

  // 4. Rate limiting check
  const rateLimit = await checkRateLimit(req, authUser?.id || null, 15);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Iltimos, ozroq kuting. Daqiqalik limitdan oshildi.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': String(rateLimit.retryAfter || 60),
        },
      },
    );
  }

  // 5. Parse request body
  const rawBodyText = await req.text().catch(() => '');
  let body;
  try {
    body = JSON.parse(rawBodyText || '{}');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const {
    metrics = {},
    language = 'uz',
    jlptLevel = 'N4',
    userName = "O'quvchi",
  } = body;

  const studyTime = Number(metrics.todayStudyTimeMinutes) || 0;
  const successRate = Math.min(100, Math.max(0, Number(metrics.overallSuccessRate) || 80));
  const weakestSkill = String(metrics.weakestSkill || 'Grammar');
  const strongestSkill = String(metrics.strongestSkill || 'Vocabulary');
  const streakDays = Number(metrics.streakDays) || 1;

  // 6. Check for AI API key (DeepSeek, etc.)
  const serverKey = process.env.DEEPSEEK_API_KEY;
  if (!serverKey) {
    // Return deterministic fallback
    const fallback = generateServerFallback(language, studyTime, successRate, weakestSkill, strongestSkill, streakDays, jlptLevel);
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 7. Invoke DeepSeek AI
  try {
    const systemPrompt = `You are an elite Japanese language mentor and learning analytics expert for the Nihongo Talk platform.
Analyze the student's real-time metrics and return ONLY a strict JSON object (no markdown fences) matching:
{
  "overallScore": <0-100>,
  "summary": "<concise 1-2 sentence overview>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areasForImprovement": ["<area 1>", "<area 2>"],
  "actionableRecommendations": [
    { "title": "<title>", "description": "<instruction>", "priority": "high", "actionUrl": "/decks" },
    { "title": "<title>", "description": "<instruction>", "priority": "medium", "actionUrl": "/focus" }
  ],
  "motivationalQuote": "<inspiring quote>",
  "studyPaceAdvice": "<guidance on study pace>"
}
Language: Generate in ${language === 'ja' ? 'Japanese (日本語)' : language === 'en' ? 'English' : "Uzbek (O'zbek tili)"}.`;

    const userPrompt = `Student: ${userName}
JLPT Level: ${jlptLevel}
Today Study Minutes: ${studyTime}
Success Rate: ${successRate}%
Streak: ${streakDays} days
Weakest Skill: ${weakestSkill}
Strongest Skill: ${strongestSkill}

Evaluate student and output strict JSON.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const apiRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!apiRes.ok) {
      throw new Error(`AI Provider HTTP ${apiRes.status}`);
    }

    const aiJson = await apiRes.json();
    const rawContent = aiJson?.choices?.[0]?.message?.content || '';
    const parsed = safeParseJson(rawContent, null);

    if (parsed && typeof parsed.overallScore !== 'undefined') {
      return new Response(
        JSON.stringify({
          ...parsed,
          id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          generatedAt: new Date().toISOString(),
          isHeuristicFallback: false,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    throw new Error('Invalid JSON format from AI');
  } catch (err) {
    // Return structured fallback
    const fallback = generateServerFallback(language, studyTime, successRate, weakestSkill, strongestSkill, streakDays, jlptLevel);
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

function generateServerFallback(lang, studyTime, successRate, weakestSkill, strongestSkill, streakDays, level) {
  const overallScore = Math.min(100, Math.max(40, Math.round(successRate * 0.7 + Math.min(30, studyTime))));

  if (lang === 'ja') {
    return {
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      generatedAt: new Date().toISOString(),
      overallScore,
      summary: `本日の学習時間は${studyTime}分、総合正答率は${successRate}%です。${level}合格に向けて着実に前進しています。`,
      strengths: [
        `${strongestSkill}の定着度が高く、安定した成果を出しています。`,
        `学習ストリークが${streakDays}日継続しており、良い学習習慣が形成されています。`,
      ],
      areasForImprovement: [
        `${weakestSkill}における誤答率をさらに下げるための復習が必要です。`,
        studyTime < 30 ? '目標とする1日30分の学習時間の確保を推奨します。' : '実践問題での応用力を磨きましょう。',
      ],
      actionableRecommendations: [
        {
          title: '弱点分野の単語・文法ドリル',
          description: `${weakestSkill}の復習セッションを15分間行いましょう。`,
          priority: 'high',
          actionUrl: '/decks',
        },
        {
          title: 'ポモドーロ集中学習',
          description: '25分間の集中タイマーを使って今日の学習目標を達成しましょう。',
          priority: 'medium',
          actionUrl: '/focus',
        },
      ],
      motivationalQuote: '「継続は力なり」日々の努力が大きな実を結びます！',
      studyPaceAdvice: studyTime >= 25 ? '現在の学習ペースは理想的です。' : 'あと15分学習時間を増やしてみましょう。',
      isHeuristicFallback: true,
    };
  }

  // Default: Uzbek
  return {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    generatedAt: new Date().toISOString(),
    overallScore,
    summary: `Bugun jami ${studyTime} daqiqa dars qilindi, umumiy to'g'ri javoblar ko'rsatkichi ${successRate}%. Siz ${level} darajasiga erishish yo'lida to'g'ri ketyapsiz.`,
    strengths: [
      `${strongestSkill} bo'yicha mustahkamlash darajasi yuqori va barqaror.`,
      `${streakDays} kunlik uzluksiz o'qish seriyasi saqlanib turibdi!`,
    ],
    areasForImprovement: [
      `${weakestSkill} bo'yicha ko'proq xatolar qayd etilmoqda, qayta takrorlash talab etiladi.`,
      studyTime < 25 ? "Kunlik 25-30 daqiqalik o'rganish me'yoriga yetkazish tavsiya qilinadi." : "Matnlar tahlili va eshitish (Choukai) mashqlariga e'tibor bering.",
    ],
    actionableRecommendations: [
      {
        title: "Xatolar ustida ishlash (SRS)",
        description: `${weakestSkill} bo'yicha kartochkalarni qayta yodlang.`,
        priority: 'high',
        actionUrl: '/decks',
      },
      {
        title: "Pomodoro diqqat seansi",
        description: "25 daqiqalik chalg'imasdan o'qish blokini yakunlang.",
        priority: 'medium',
        actionUrl: '/focus',
      },
    ],
    motivationalQuote: "Kichik qadamlar buyuk g'alabalarga olib boradi! 継続は力なり。",
    studyPaceAdvice: studyTime >= 25 ? "Kunlik o'rganish sur'atingiz me'yorda va rejadagidek bormoqda." : "Kuniga yana 10-15 daqiqa ajratib borishingizni tavsiya qilamiz.",
    isHeuristicFallback: true,
  };
}
