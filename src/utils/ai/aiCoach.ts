import { parseAIError } from './aiConfig';
import { callSelectedAIProvider } from './aiCore';
import { ErrorVaultService } from '../../services/ErrorVaultService';
import { ConversationScenario } from '../../components/speaking/scenarioTypes';

export interface SpeechAnalysisResult {
  grammar_corrections: string[];
  better_vocabulary: { original: string; suggested: string }[];
  fluency_score: number;
  overall_feedback: string;
}

export const analyzeSpeech = async (
  transcript: string,
  topic: string = 'General Conversation',
  _userKey?: string,
): Promise<SpeechAnalysisResult> => {
  const prompt = `
      Act as an expert English language Speaking Coach (like an IELTS examiner).
      The user was asked to talk about: "${topic}".
      Here is the exact transcript of what they said:
      "${transcript}"
      
      Task: Analyze the transcript and provide feedback.
      Output Format: A VALID JSON object with the following keys exactly:
      - "grammar_corrections": An array of strings, pointing out grammar mistakes and how to fix them.
      - "better_vocabulary": An array of objects with "original" and "suggested" keys to improve their word choice.
      - "fluency_score": A number out of 9.0 (IELTS band scale) estimating their fluency based on the text coherence.
      - "overall_feedback": A short, encouraging paragraph summarizing their performance and areas to improve.

      Constraint: ONLY return the JSON object. Do not include any markdown formatting, preamble, or explanation.
    `;

  try {
    const text = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleanedText);
  } catch (error: any) {
    throw new Error(parseAIError(error));
  }
};

export interface CoachCorrection {
  hasError: boolean;
  original?: string;
  corrected?: string;
  explanation?: string;
}

export interface CoachVocabularyItem {
  word: string;
  reading?: string;
  meaning: string;
  example?: string;
}

export interface CoachStructuredResponse {
  language: 'ja' | 'en';
  reply: string;
  ttsText: string;
  romaji?: string;
  correction?: CoachCorrection | null;
  vocabulary?: CoachVocabularyItem[];
  rawText?: string;
}

export const cleanJapaneseTTS = (text: string): string => {
  if (!text) return '';

  // 1. Remove micro-error tags [GRAMMAR_ERR: ...]
  let clean = text.replace(/\[(GRAMMAR_ERR|VOCAB_ERR|PRON_ERR):[^\]]+\]/gi, '');

  // 2. Remove markdown formatting (*, _, `, ~, #)
  clean = clean.replace(/[*_#`~]/g, '');

  // 3. Remove bracketed & parenthesized text e.g. (Konnichiwa), （Konnichiwa）, [Hello], [xush kelibsiz]
  clean = clean.replace(/\[[^\]]*\]/g, '');
  clean = clean.replace(/\([^)]*\)/g, '');
  clean = clean.replace(/（[^）]*）/g, '');
  clean = clean.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

  // 4. If text contains Japanese characters (Hiragana, Katakana, Kanji):
  const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(clean);
  if (hasJapanese) {
    // Split by lines. If a line does NOT contain Japanese (e.g. Romaji "Hai, konnichiwa" or English "Hello"), filter it out
    const lines = clean.split('\n');
    const japaneseLines = lines.filter((l) =>
      /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(l.trim()),
    );
    if (japaneseLines.length > 0) {
      clean = japaneseLines.join(' ');
    }
    // Strip any remaining Latin letters (a-z, A-Z) so Romaji words are never spoken by TTS
    clean = clean.replace(/[a-zA-Z]/g, '');
  }

  return clean.replace(/\s+/g, ' ').trim();
};

export const parseCoachResponse = (
  raw: string,
  fallbackLang: 'en' | 'ja' = 'ja',
): CoachStructuredResponse => {
  if (!raw || typeof raw !== 'string') {
    const jaFallbacks = [
      'はい、よく分かりました！続けてお話ししましょう。',
      'なるほど、いいですね！もっと詳しく日本語で教えてください。',
      '面白いですね！では、次の質問をどうぞ。',
    ];
    const defaultReply =
      fallbackLang === 'ja'
        ? jaFallbacks[Math.floor(Math.random() * jaFallbacks.length)]
        : "Understood, let's keep going!";
    return {
      language: fallbackLang,
      reply: defaultReply,
      ttsText: defaultReply,
      romaji: fallbackLang === 'ja' ? 'Hai, yoku wakarimashita! Tsudukete ohanashi shimashou.' : '',
      correction: { hasError: false },
      vocabulary: [],
      rawText: raw || '',
    };
  }

  try {
    // 1. Strip DeepSeek Reasoner <think>...</think> blocks
    let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 2. Strip markdown code fences anywhere in the string
    cleaned = cleaned
      .replace(/```(?:json)?/gi, '')
      .replace(/```/g, '')
      .trim();

    // 3. Isolate outer JSON block
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try fixing common LLM JSON syntax issues: trailing commas and raw control characters
      try {
        const sanitized = cleaned
          .replace(/,\s*([}\]])/g, '$1')
          .split('')
          .filter((ch) => {
            const code = ch.charCodeAt(0);
            return code >= 32 || code === 10 || code === 13 || code === 9;
          })
          .join('');
        parsed = JSON.parse(sanitized);
      } catch {}
    }

    if (parsed && typeof parsed === 'object') {
      let lang: 'en' | 'ja' =
        parsed.language === 'en' || parsed.language === 'ja' ? parsed.language : fallbackLang;
      let reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';

      // Search other possible keys if reply was not present
      if (!reply) {
        const candidates = [
          parsed.response,
          parsed.message,
          parsed.content,
          parsed.text,
          parsed.japanese,
          parsed.conversation,
          parsed.dialogue,
          parsed.answer,
        ];
        for (const cand of candidates) {
          if (typeof cand === 'string' && cand.trim().length > 0) {
            reply = cand.trim();
            break;
          }
        }
      }

      // If reply is accidentally a stringified JSON, unwrap it
      if (reply.startsWith('{') && (reply.includes('"reply"') || reply.includes('"language"'))) {
        try {
          const inner = JSON.parse(reply);
          if (inner && inner.reply && typeof inner.reply === 'string') {
            reply = inner.reply.trim();
          }
        } catch {
          const m = reply.match(/"(?:reply|message|content|text)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
          if (m) {
            reply = m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
          }
        }
      }

      // If still empty, look for ANY string in the object values
      if (!reply && fallbackLang === 'ja') {
        for (const val of Object.values(parsed)) {
          if (typeof val === 'string' && /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(val)) {
            reply = val.trim();
            break;
          }
        }
      }

      let correction: CoachCorrection = { hasError: false };
      if (parsed.correction && typeof parsed.correction === 'object') {
        if (Array.isArray(parsed.correction.errors) && parsed.correction.errors.length > 0) {
          const firstErr = parsed.correction.errors[0];
          correction = {
            hasError: true,
            original: firstErr.original || '',
            corrected: firstErr.corrected || '',
            explanation: firstErr.explanation || '',
          };
        } else {
          const corrected =
            typeof parsed.correction.corrected === 'string'
              ? parsed.correction.corrected.trim()
              : '';
          const original =
            typeof parsed.correction.original === 'string' ? parsed.correction.original.trim() : '';
          const explanation =
            typeof parsed.correction.explanation === 'string'
              ? parsed.correction.explanation.trim()
              : '';
          const hasErr =
            parsed.correction.hasError === true ||
            parsed.correction.hasError === 'true' ||
            Boolean(corrected && corrected.length > 0 && corrected !== original);

          correction = {
            hasError: hasErr,
            original,
            corrected,
            explanation,
          };
        }
      }

      // If reply is empty or raw JSON, fallback to correction advice or clean greeting
      if (!reply || reply.startsWith('{')) {
        if (correction.hasError) {
          reply = correction.explanation || correction.corrected || '';
        }
      }

      if (!reply || reply.startsWith('{')) {
        reply =
          lang === 'ja'
            ? 'はい、よく分かりました！続けて日本語でお話ししましょう。'
            : "Understood! Let's continue speaking practice.";
      }

      let ttsText = typeof parsed.ttsText === 'string' ? parsed.ttsText.trim() : '';
      if (!ttsText || ttsText.startsWith('{')) {
        if (reply && !reply.startsWith('{')) {
          ttsText = extractSpeechAudioText(reply);
        } else if (correction.hasError) {
          ttsText = correction.explanation
            ? `${correction.explanation} ${correction.corrected || ''}`
            : correction.corrected || '';
        }
      }

      let romaji = typeof parsed.romaji === 'string' ? parsed.romaji.trim() : '';
      if (
        !romaji &&
        parsed.reading &&
        typeof parsed.reading === 'string' &&
        /[a-zA-Z]/.test(parsed.reading)
      ) {
        romaji = parsed.reading.trim();
      }

      if (lang === 'ja') {
        ttsText = cleanJapaneseTTS(ttsText);
      }

      const vocabulary: CoachVocabularyItem[] = Array.isArray(parsed.vocabulary)
        ? parsed.vocabulary
            .map((v: any) => ({
              word: String(v.word || ''),
              reading: String(v.reading || v.romaji || ''),
              meaning: String(v.meaning || ''),
              example: String(v.example || ''),
            }))
            .filter((v: CoachVocabularyItem) => v.word.trim().length > 0)
        : [];

      return {
        language: lang,
        reply,
        ttsText,
        romaji,
        correction,
        vocabulary,
        rawText: raw,
      };
    }
  } catch {
    // Fallback for non-JSON or malformed strings
  }

  // --- RESILIENT REGEX EXTRACTION FALLBACK ---
  // When JSON.parse fails completely, extract human-readable text rather than raw JSON!
  const replyMatch = raw.match(
    /"(?:reply|message|content|text|japanese|dialogue)"\s*:\s*"((?:[^"\\]|\\.)*)"/i,
  );
  let extractedReply = replyMatch
    ? replyMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t').trim()
    : '';

  if (!extractedReply) {
    const multiMatch = raw.match(
      /"(?:reply|message|content|text|japanese|dialogue)"\s*:\s*"([\s\S]*?)"\s*,\s*"/i,
    );
    if (multiMatch) {
      extractedReply = multiMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
    }
  }

  const isJapanese =
    fallbackLang === 'ja' ||
    /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(extractedReply || raw);
  const lang: 'en' | 'ja' = isJapanese ? 'ja' : 'en';

  // NEVER allow raw JSON to be the reply shown to the user
  let finalReply = extractedReply || raw.trim();
  if (
    finalReply.startsWith('{') &&
    (finalReply.includes('"reply"') ||
      finalReply.includes('"language"') ||
      finalReply.includes('"vocabulary"'))
  ) {
    finalReply =
      lang === 'ja'
        ? 'はい、よく分かりました！続けて日本語でお話ししましょう。'
        : "Understood! Let's continue speaking practice.";
  } else if (finalReply.startsWith('{') && finalReply.endsWith('}')) {
    finalReply =
      lang === 'ja'
        ? 'はい、よく分かりました！続けて日本語でお話ししましょう。'
        : "Understood! Let's continue speaking practice.";
  }

  let extractedRomaji = '';
  const romajiMatch = raw.match(/"romaji"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
  if (romajiMatch) {
    extractedRomaji = romajiMatch[1].replace(/\\"/g, '"').trim();
  } else {
    const parenRomaji = raw.match(/\(([^)]*[a-zA-Z]{3,}[^)]*)\)/);
    if (parenRomaji && isJapanese) {
      extractedRomaji = parenRomaji[1].replace(/romaji/gi, '').trim();
    }
  }

  const ttsText = extractSpeechAudioText(finalReply);

  // Extract correction block from raw JSON string via regex
  let fallbackCorrection: CoachCorrection = { hasError: false };
  const corrBlockMatch = raw.match(/"correction"\s*:\s*\{([^}]+)\}/);
  if (corrBlockMatch) {
    const block = corrBlockMatch[1];
    const origM = block.match(/"original"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
    const corrM = block.match(/"corrected"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
    const expM = block.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
    const hasErrM = block.match(/"hasError"\s*:\s*(true|false)/i);

    const corrected = corrM ? corrM[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim() : '';
    const original = origM ? origM[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim() : '';
    const explanation = expM ? expM[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim() : '';
    const hasError = hasErrM ? hasErrM[1].toLowerCase() === 'true' : Boolean(corrected);

    if (corrected || hasError) {
      fallbackCorrection = {
        hasError: hasError || Boolean(corrected),
        original,
        corrected,
        explanation,
      };
    }
  } else {
    const extractedErrors = parseMicroErrors(raw);
    if (extractedErrors.length > 0) {
      fallbackCorrection = {
        hasError: true,
        original: extractedErrors[0].originalText,
        corrected: extractedErrors[0].correction,
        explanation: extractedErrors[0].explanation,
      };
    }
  }

  // Extract vocabulary from raw JSON string via regex
  const fallbackVocab: CoachVocabularyItem[] = [];
  const vocabBlockMatch = raw.match(/"vocabulary"\s*:\s*\[([\s\S]*?)\]/);
  if (vocabBlockMatch) {
    const itemRegex =
      /\{\s*"word"\s*:\s*"((?:[^"\\]|\\.)*)"(?:[\s\S]*?"reading"\s*:\s*"((?:[^"\\]|\\.)*)")?(?:[\s\S]*?"meaning"\s*:\s*"((?:[^"\\]|\\.)*)")?(?:[\s\S]*?"example"\s*:\s*"((?:[^"\\]|\\.)*)")?[\s\S]*?\}/gi;
    let vMatch: RegExpExecArray | null;
    while ((vMatch = itemRegex.exec(vocabBlockMatch[1])) !== null) {
      const word = vMatch[1].replace(/\\"/g, '"').trim();
      if (word) {
        fallbackVocab.push({
          word,
          reading: (vMatch[2] || '').replace(/\\"/g, '"').trim(),
          meaning: (vMatch[3] || '').replace(/\\"/g, '"').trim(),
          example: (vMatch[4] || '').replace(/\\"/g, '"').trim(),
        });
      }
    }
  }

  return {
    language: lang,
    reply: finalReply,
    ttsText,
    romaji: extractedRomaji,
    correction: fallbackCorrection,
    vocabulary: fallbackVocab,
    rawText: raw,
  };
};

export function getJlptLevelPromptBoundary(
  level: string = 'N3',
  language: 'en' | 'ja' = 'ja',
  persona: string = 'roast',
): string {
  if (language === 'en') {
    const norm = (level || 'B1').toUpperCase();
    if (norm === 'A1' || norm === 'A2' || norm === 'N5') {
      return `
      CRITICAL CEFR A1/A2 (BEGINNER) BOUNDARY:
      - Vocabulary: Ultra-simple basic English only (everyday routines, family, hobbies, food).
      - Grammar: Present simple, past simple, "can", "want to". NO complex idioms, passive voice, or conditionals.
      - Sentences: 1-2 short sentences (max 10-12 words per sentence). Exactly ONE simple, clear question at the end.
      ${
        persona === 'roast'
          ? '- Roast style: Sarcastic but gently tease basic beginner mistakes (missing third-person "s", confusing do/does, single-word answers). Do NOT demand Band 8 idioms!'
          : ''
      }
      `;
    }
    return `
      CEFR LEVEL BOUNDARY (${norm}):
      - Calibrate vocabulary and grammar naturally to ${norm} CEFR level.
      - Keep responses conversational, concise (1-2 sentences), with exactly one engaging follow-up question.
    `;
  }

  // Japanese JLPT calibration
  const normLevel = (level || 'N3').toUpperCase();
  if (normLevel === 'N5') {
    return `
    🚨 CRITICAL PEDAGOGICAL LAW — JLPT N5 (BEGINNER / 初級1) STRICT BOUNDARY:
    The student is an absolute beginner (JLPT N5 level, Minna no Nihongo Lessons 1-25).
    You MUST STRICTLY ADHERE TO THESE LINGUISTIC CONSTRAINTS:
    1. GRAMMAR WHITELIST (YOU MUST ONLY USE THESE BASIC FORMS):
       - Polite present & past: 〜です, 〜じゃありません, 〜でした, 〜じゃありませんでした.
       - Polite verbs: 〜ます, 〜ません, 〜ました, 〜ませんでした.
       - Requests: 〜てください (simple requests only, e.g. 食べてください, 来てください).
       - Desires: 〜たいです, 〜たくないです.
       - Invitations: 〜ましょう, 〜ましょうか.
       - Permission: 〜てもいいですか.
       - Existence: 〜があります, 〜がいます.
       - Basic question: 〜か.
    2. STRICTLY FORBIDDEN IN YOUR RESPONSE:
       - NO Keigo / Sonkeigo / Kenjougo (FORBIDDEN: いらっしゃる, おっしゃる, なさる, 申す, 参る, いただく, ご利用になります, お決まりでしょうか, 〜ていただけますか). ONLY simple です/ます.
       - NO complex grammatical patterns (FORBIDDEN: 〜わけにはいかない, 〜にあたって, 〜ざるを得ない, 〜ことになっている, 〜べき, 〜ほど, 〜おかげで, 〜せいで, 〜とおりに, 〜ば/たら/なら complex hypotheticals).
       - NO relative subordinate clauses or nested sentences.
    3. PARTICLES:
       - ONLY basic particles: は, が, を, に, で, へ, と, も, から, まで, ね, よ.
    4. VOCABULARY & KANJI:
       - Use ONLY basic N5 words (food, numbers, days of the week, family, everyday verbs like 食べる, 飲む, 行く, 来る, 見る, 聞く, 話す, 勉強する).
       - Write unfamiliar words, adverbs, and adjectives in HIRAGANA (e.g. write どこ, なに, どう, たくさん, おいしい, きれい, ゆっくり). Only use basic N5 kanji (日, 月, 火, 水, 木, 金, 土, 年, 人, 私, 本, 何, 行, 食, 飲, 見, 学, 校).
    5. LENGTH & TURN STRUCTURE:
       - MAXIMUM 1 to 2 very short sentences (max 10-12 words per sentence).
       - End with EXACTLY ONE simple, direct question (e.g. 「きのう 何を しましたか？」「すきな たべものは 何ですか？」).
    ${
      persona === 'roast'
        ? `6. N5 ROAST STYLE (鬼の雪先生・初級編):
       - DO NOT demand N2/N1 grammar or difficult words!
       - Instead, roast basic N5 beginner errors with playful strictness (e.g. forgetting です/ます, dropping particles を/に/で, using English words, confusing は and が).
       - Example roast:「『私 りんご 食べる』？助詞の『を』を忘れていますよ！『私は りんごを 食べます』でしょう！もう一度言ってください！」`
        : ''
    }
    `;
  }

  if (normLevel === 'N4') {
    return `
    🚨 JLPT N4 (UPPER BEGINNER / 初級2) BOUNDARY:
    The student is at JLPT N4 level (Minna no Nihongo Lessons 26-50).
    1. GRAMMAR SCOPE:
       - Basic conjunctions: 〜てもいいですか, 〜てはいけません, 〜なければなりません, 〜たことがあります.
       - Action lists & conditionals: 〜たり〜たりします, 〜たら, 〜なら, 〜ので, 〜のに, 〜し.
       - Potential & helpers: 〜ことができます, 〜すぎます, 〜やすい, 〜にくい, 〜てみる, 〜てしまう.
       - NO advanced N2/N1 patterns or formal business Keigo.
    2. VOCABULARY:
       - Elementary and lower-intermediate everyday vocabulary.
       - Keep sentences concise (1-2 moderate sentences). Exactly one engaging follow-up question.
    ${
      persona === 'roast'
        ? `3. N4 ROAST STYLE:
       - Call out N4 mistakes: improper Te-form conjugations, mixing up 〜たら and 〜なら, forgetting 〜なければなりません.
       - Keep critiques strictly accessible to an N4 learner.`
        : ''
    }
    `;
  }

  if (normLevel === 'N3') {
    return `
    JLPT N3 (INTERMEDIATE / 中級) BOUNDARY:
    - Target natural intermediate conversational Japanese.
    - Grammar: 〜ようにする, 〜ようになる, 〜わけだ, 〜はずだ, 〜てごらん, 〜に違いない, standard casual/polite mix.
    - Encourage explaining reasons, opinions, and feelings in 2-3 natural sentences.
    `;
  }

  // N2 or N1
  return `
    JLPT ${normLevel} (ADVANCED / 上級) BOUNDARY:
    - Advanced native Japanese, business Keigo (尊敬語・謙譲語), nuanced particles, idioms, and sophisticated vocabulary.
    - Challenge the student with analytical questions, abstract topics, and professional discourse.
  `;
}

export const buildCoachPrompts = (
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  language: 'en' | 'ja' = 'en',
  persona: string = 'roast',
  scenario?: ConversationScenario | null,
  level: string = 'N3',
): { systemPrompt: string; userPrompt: string } => {
  // Keep last 6 messages to optimize token usage & ensure fast responses
  const recentHistory = history.slice(-6);
  const historyText = recentHistory
    .map((h) => `${h.role === 'user' ? 'Student' : 'Coach'}: ${h.content}`)
    .join('\n');

  // Determine effective level: if scenario specifies a JLPT level (e.g. N5), respect scenario unless level is explicitly set
  const effectiveLevel = (
    scenario?.difficulty && scenario.difficulty.toUpperCase().startsWith('N')
      ? scenario.difficulty
      : level || 'N3'
  ).toUpperCase();

  const levelBoundary = getJlptLevelPromptBoundary(effectiveLevel, language, persona);

  let personaPrompt = '';

  if (scenario) {
    const isJa = (scenario.language || (scenario.title_en ? 'en' : 'ja')) === 'ja';
    const scenarioTitle = isJa
      ? `${scenario.title_ja || scenario.title_uz} (${scenario.title_uz})`
      : `${scenario.title_en || scenario.title_uz} (${scenario.title_uz})`;
    const difficultyLabel = isJa ? `JLPT ${effectiveLevel}` : `CEFR / ${effectiveLevel}`;

    if (isJa) {
      const levelRoleplayDirective =
        effectiveLevel === 'N5'
          ? `【🚨 絶対遵守: JLPT N5 初級会話ルール — 超シンプル化】
相手は日本語を学び始めたばかりの初学者（N5レベル）です！
店員・受付・友達など、いかなる配役であっても【接客敬語・尊敬語・謙譲語（いらっしゃる、おっしゃる、申し上げる、〜でしょうか、〜ていただけますか、ご案内いたします等）は絶対禁止】です！
必ずN5レベルの超シンプルな「です・ます」調（1発話につき1〜2文、10語以内）のみで話してください。
質問は1つずつ、子どもや留学生に話すようにやさしく平易に聞いてください。`
          : effectiveLevel === 'N4'
            ? `【🚨 絶対遵守: JLPT N4 初級会話ルール】
相手はJLPT N4学習者です。難解な敬語や複雑な慣用句は避け、N4レベル（〜てください、〜てもいいですか、〜たらどうですか等）のわかりやすい日本語で話してください。1発話につき1〜2文で簡潔に保ってください。`
            : '';

      personaPrompt = `IDENTITY: あなたは【${scenarioTitle}】の会話シナリオに登場するネイティブキャラクターです。
           ROLE CONTEXT: ${scenario.context_prompt}
           TARGET DIFFICULTY: ${difficultyLabel}
           ${levelRoleplayDirective}
           KEY PHRASES TO ENCOURAGE: ${scenario.key_phrases.join(', ')}`;
    } else {
      personaPrompt = `IDENTITY: You are an authentic roleplay character for the scenario: "${scenarioTitle}".
           ROLE CONTEXT: ${scenario.context_prompt}
           TARGET DIFFICULTY: ${difficultyLabel}
           KEY PHRASES TO ENCOURAGE & TEST: ${scenario.key_phrases.join(', ')}
           INSTRUCTION: Strictly stay in character, respond naturally, ask realistic follow-up questions, and evaluate user's responses.`;
    }
  } else if (language === 'ja') {
    switch (persona) {
      case 'keigo':
        personaPrompt = `IDENTITY: 敬語・ビジネス日本語マスター教師。ビジネスシーンに相応しい尊敬語・謙譲語・丁寧語を指導します。`;
        break;
      case 'interview':
        personaPrompt = `IDENTITY: 日本企業の採用面接官。PREP法に基づく自己紹介・志望動機・経験を面接形式で指導します。`;
        break;
      case 'examiner':
      case 'ielts':
        personaPrompt = `IDENTITY: JLPT会話試験官「雪先生（ゆきせんせい、Yuki-sensei）」。助詞や語彙の正確性を中立的・公正に評価し、JLPT（${effectiveLevel}）合格に必要な的確なアドバイスを行います。`;
        break;
      case 'gentle':
        personaPrompt = `IDENTITY: 優しく忍耐強い日本語教師「雪先生（ゆきせんせい、Yuki-sensei）」。丁寧語（です・ます）で温かく生徒を励まし、間違いがあっても優しく導き自信を育てます。`;
        break;
      case 'travel':
        personaPrompt = `IDENTITY: 旅行会話コーチ「雪先生（ゆきせんせい、Yuki-sensei）」（空港・ホテル・駅・レストラン等）。旅行で役立つ実践的で自然な日本語を指導します。`;
        break;
      case 'casual':
        personaPrompt = `IDENTITY: 東京在住の親しい友達「ユキ（Yuki）」。自然な日常会話とタメ口（カジュアル表現）でリアルな日本語を教えます。`;
        break;
      default: // 'roast' -> 鬼の雪先生 (Strict Drill Master Oni Yuki-sensei)
        personaPrompt = `IDENTITY: 妥協を一切許さない超激辛・毒舌指導官「鬼の雪先生（おにのゆきせんせい、Oni Yuki-sensei）」。
                PERSONALITY & ROAST PHILOSOPHY:
                1. 徹底的な激辛指導（Deep Roast）: 学生の短い手抜き返答（「いいです」「はい」「どうです」等）、助詞の乱れ、不自然な表現を容赦なく辛辣に指摘します。
                2. 厳しいツッコミ例:
                   - 短すぎる返答に対して:「『いいです』？それだけですか！もっと詳しく理由を話しなさい！」
                   - 助詞・文法ミスに対して:「助詞の使い方がおかしいですよ！聞いているこちらが恥ずかしくなります！」
                3. 教育的熱意: 単なる悪口ではなく、必ず学生のレベル（${effectiveLevel}）に合った正しい表現を提示し、次の返答を促す鋭い質問を投げかけてください。`;
        break;
    }
  } else {
    // English
    switch (persona) {
      case 'ielts':
        personaPrompt = `IDENTITY: Official Senior IELTS Speaking Examiner. Direct, academic, and criteria-driven.`;
        break;
      case 'interview':
        personaPrompt = `IDENTITY: Tech Hiring Manager. STAR framework based behavioral and technical interviews.`;
        break;
      case 'gentle':
        personaPrompt = `IDENTITY: Sarah, kind and encouraging ESL tutor. Builds confidence warmly.`;
        break;
      case 'travel':
        personaPrompt = `IDENTITY: Travel Concierge and customs/hotel roleplayer. High-utility travel English.`;
        break;
      case 'casual':
        personaPrompt = `IDENTITY: Alex, friendly native speaker buddy. Phrasal verbs, idioms, and natural daily chatter.`;
        break;
      default: // 'roast' -> Gordon, Deep Savage Band 9 Drill Coach
        personaPrompt = `IDENTITY: Gordon, an uncompromisingly brutal, razor-sharp English Speaking Drill Master (the "Gordon Ramsay of Language Coaching").
                PERSONALITY & ROAST PHILOSOPHY:
                1. Deep Savage Critique: Ruthlessly call out lazy, single-clause answers ("It's good", "Fine", "I like it"), elementary vocabulary, filler hesitations ("um, like"), and weak repetitive phrases.
                2. Sarcastic & Fiery Delivery: Roast their laziness with sharp wit (e.g. "Is that your entire vocabulary or did the rest take a vacation?").
                3. High-Standard Force: Demand appropriate sentences suited to their target level (${effectiveLevel}), and hit them with tough, analytical follow-up questions that force elaboration.`;
        break;
    }
  }

  const weakItemsSnippet = ErrorVaultService.getWeakItemsPromptSnippet(language);

  const jsonContract =
    language === 'ja'
      ? `STRICT JSON OUTPUT CONTRACT:
You MUST respond with a VALID JSON object matching this schema exactly:
{
  "language": "ja",
  "reply": "自然な日本語での返答と次の質問1つ（漢字・ひらがな・カタカナのみ。1〜2文）",
  "ttsText": "音声読み上げ用の純粋な日本語テキスト（replyと同一または簡潔な日本語。ローマ字・英語・記号不可）",
  "romaji": "replyのローマ字表記（画面表示用）",
  "correction": {
    "hasError": true/false,
    "original": "学生が間違えた表現（なければ空文字）",
    "corrected": "自然な正しい日本語（なければ空文字）",
    "explanation": "助詞や文法の短い解説（なければ空文字）"
  },
  "vocabulary": [
    {
      "word": "単語（漢字・かな）",
      "reading": "読み",
      "meaning": "意味（ウズベク語と英語を併記。例: 『Ishga topshirish maqsadi (Reason for applying)』のように、必ずウズベク語の意味を第一に記載すること）",
      "example": "短い例文"
    }
  ]
}`
      : `STRICT JSON OUTPUT CONTRACT:
You MUST respond with a VALID JSON object matching this schema exactly:
{
  "language": "en",
  "reply": "Natural conversational response with exactly 1 follow-up question (1-2 sentences)",
  "ttsText": "Clean English text for audio reading (identical to reply)",
  "romaji": "",
  "correction": {
    "hasError": true/false,
    "original": "Student mistake if any",
    "corrected": "Correct natural English",
    "explanation": "Brief grammar or vocabulary explanation"
  },
  "vocabulary": [
    {
      "word": "Useful word or collocation",
      "reading": "",
      "meaning": "Meaning in Uzbek language (O'zbekcha tarjimasi). Example: 'Qaror qabul qilmoq (To make a decision)'",
      "example": "Contextual example sentence"
    }
  ]
}
`;

  const systemPrompt = `
      ${personaPrompt}
      Target Language: ${language === 'ja' ? 'Japanese (日本語)' : 'English'}
      Target Level: ${effectiveLevel}
      ${levelBoundary}
      ${weakItemsSnippet}

      ${jsonContract}

      PEDAGOGICAL & DIALOGUE RULES:
      1. ONLY return a valid JSON object matching the contract. Do not include any text, preamble, or markdown outside the JSON.
      2. Keep responses brief (1-2 sentences maximum, strictly adhering to ${effectiveLevel} linguistic and sentence length limits). Act as an active conversation partner and coach. Always encourage the student to speak more by asking a natural, relevant follow-up question strictly within their level. Even in realistic roleplays (waiter, clerk, station staff, friend), NEVER escalate vocabulary or use business Keigo above ${effectiveLevel}.
      3. For Japanese: "reply" and "ttsText" MUST be 100% Japanese (Kanji/Kana). NEVER mix Romaji or English into reply or ttsText. Romaji goes ONLY in "romaji" field for UI display.
      4. For English: "reply" and "ttsText" MUST be 100% English. "romaji" must be an empty string.
      5. Error Correction & Critique Policy:
         ${
           persona === 'roast'
             ? `ROAST MODE IS ACTIVE: Call out errors with playful strictness and witty sarcasm calibrated strictly to ${effectiveLevel}. If the student gives an overly short answer, drops particles, or makes a grammar slip, roast them sharply using vocabulary and explanations suited for ${effectiveLevel}. Do NOT demand grammar or words beyond ${effectiveLevel}!`
             : `Correct ONLY meaningful mistakes matching ${effectiveLevel} expectations (incorrect particles は/が/に/で/を, wrong verb/adjective forms, incorrect tenses, or unnatural vocabulary). Do NOT nitpick minor stylistic variations. If the student made no mistake, set "hasError": false. Keep explanations concise (1 short sentence).`
         }
      6. Vocabulary Engine: Provide 1 to 3 truly useful, contextual words or collocations with reading, meaning, and contextual example.
         CRITICAL REQUIREMENT FOR "meaning" FIELD:
         The student is studying this language and speaks Uzbek. Therefore, the "meaning" field MUST ALWAYS be provided in Uzbek language (O'zbekcha tarjimasi / ma'nosi), optionally followed by English in parentheses, e.g. "Ishga topshirish maqsadi (Reason for applying)" or "Qaror qabul qilish (Decision making)". The Uzbek translation is required for every single vocabulary item so the student immediately understands it.
      7. Scenario & Topic Adherence: Stay in character and context throughout the dialogue.
    `;

  const userPrompt = `
      Conversation History:
      ${historyText}

      Student's current message:
      "${message}"
    `;

  return { systemPrompt, userPrompt };
};

export const converseWithCoachStructured = async (
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  language: 'en' | 'ja' = 'en',
  persona: string = 'roast',
  _userKey?: string,
  scenario?: ConversationScenario | null,
  level: string = 'N3',
): Promise<CoachStructuredResponse> => {
  const { systemPrompt, userPrompt } = buildCoachPrompts(
    message,
    history,
    language,
    persona,
    scenario,
    level,
  );

  const dsResult = await callSelectedAIProvider(userPrompt, systemPrompt, true);
  if (!dsResult || dsResult.trim().length === 0) {
    throw new Error(
      "AI_EMPTY_RESPONSE: AI xizmati bo'sh javob qaytardi. Iltimos qaytadan gapiring.",
    );
  }
  return parseCoachResponse(dsResult, language);
};

export const converseWithCoach = async (
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  language: 'en' | 'ja' = 'en',
  persona: string = 'roast',
  userKey?: string,
  scenario?: ConversationScenario | null,
  level: string = 'N3',
): Promise<string> => {
  const structured = await converseWithCoachStructured(
    message,
    history,
    language,
    persona,
    userKey,
    scenario,
    level,
  );
  return structured.reply || structured.rawText || '';
};

export interface SessionAnalysisReport {
  lexical_score: number;
  grammar_score: number;
  fluency_score: number;
  pronunciation_score: number;
  overall_score: number;
  user_level_eng?: string;
  user_level_jp?: string;
  pronunciation_feedback: string;
  pronunciation_errors: { word: string; correctionHelp: string }[];
  grammar_corrections: { original: string; corrected: string; explanation: string }[];
  better_vocabulary: { original: string; suggested: string; context: string }[];
  overall_feedback: string;
  strengths: string[];
  areas_to_improve: string[];
}

export const calculateWeightedOverallScore = (
  lexical: number,
  grammar: number,
  fluency: number,
  pronunciation: number,
): number => {
  const overall = 0.3 * lexical + 0.3 * grammar + 0.25 * fluency + 0.15 * pronunciation;
  return Math.round(overall * 2) / 2; // Round to nearest 0.5
};

export const getCEFRLevelFromScore = (score: number): string => {
  if (score >= 8.5) return 'CEFR C2 (IELTS Band 8.5 - 9.0)';
  if (score >= 7.5) return 'CEFR C1 (IELTS Band 7.5 - 8.0)';
  if (score >= 6.0) return 'CEFR B2 (IELTS Band 6.0 - 7.0)';
  if (score >= 5.0) return 'CEFR B1 (IELTS Band 5.0 - 5.5)';
  return 'CEFR A1/A2 (Basic / Elementary)';
};

export const getJLPTLevelFromScore = (score: number): string => {
  if (score >= 8.5) return 'JLPT N1 (超上級 - Expert)';
  if (score >= 7.5) return 'JLPT N2 (上級 - Advanced)';
  if (score >= 6.0) return 'JLPT N3 (中級 - Intermediate)';
  if (score >= 5.0) return 'JLPT N4 (初級 - Pre-Intermediate)';
  return 'JLPT N5 (入門 - Beginner)';
};

export const analyzeSpeakingSession = async (
  history: { role: 'user' | 'assistant'; content: string }[],
  language: 'en' | 'ja' = 'en',
  persona: string = 'roast',
): Promise<SessionAnalysisReport> => {
  const userMessages = history.filter((h) => h.role === 'user').map((h) => h.content);
  if (userMessages.length === 0) {
    return {
      lexical_score: 0,
      grammar_score: 0,
      fluency_score: 0,
      pronunciation_score: 0,
      overall_score: 0,
      user_level_eng: "Boshlang'ich (A1)",
      user_level_jp: "Boshlang'ich (N5)",
      pronunciation_feedback: 'Talaffuz tahlili uchun suhbatda gaplar aytilishi lozim.',
      pronunciation_errors: [],
      grammar_corrections: [],
      better_vocabulary: [],
      overall_feedback: 'Suhbatda hali hech qanday gap aytilmadi.',
      strengths: ['Suhbatni boshlashga urindingiz!'],
      areas_to_improve: ["Ovozli suhbatni sinab ko'rish uchun ko'proq gapiring."],
    };
  }

  // Limit to the most recent 30 turns to avoid token limit exhaustion during long sessions
  const recentHistory = history.length > 30 ? history.slice(-30) : history;
  const conversationText = recentHistory
    .map((h) => `${h.role === 'user' ? 'Student' : 'Coach'}: ${h.content}`)
    .join('\n');

  const prompt = `
      Act as an expert ${language === 'ja' ? 'Japanese (日本語)' : 'English'} Language Examiner & Speaking Analyst.
      The student just completed a speaking session in the scenario/persona: "${persona}".
      
      Full Conversation Transcript:
      ${conversationText}

      Task: Perform a FORMAL MULTI-DIMENSIONAL LINGUISTIC ASSESSMENT using 4 weighted pillars:
      1. Lexical Resource (30%): Analyze vocabulary depth, idioms, kanji/keigo or C1/C2 terms used.
      2. Grammatical Range & Accuracy (30%): Sentence complexity ratio & error density.
      3. Fluency & Coherence (25%): Turn length & logical connectors used.
      4. Pronunciation & Intonation (15%): Pitch accent, stress, and clarity.

      Provide JSON feedback in natural Uzbek (O'zbek tilida).

      Output Format (STRICT VALID JSON ONLY):
      {
        "lexical_score": 7.5,
        "grammar_score": 7.0,
        "fluency_score": 7.5,
        "pronunciation_score": 8.0,
        "user_level_eng": "CEFR B2 (IELTS Band 6.5)",
        "user_level_jp": "JLPT N3 (中級 - Intermediate)",
        "pronunciation_feedback": "Intonatsiya, nutq tempi va urg'u bo'yicha chuqur tahlil (O'zbek tilida)...",
        "pronunciation_errors": [
          {
            "word": "miss-pronounced word or phrase",
            "correctionHelp": "O'zbek tilida urg'u yoki to'g'ri aytish bo'yicha yordam"
          }
        ],
        "grammar_corrections": [
          {
            "original": "Student's flawed sentence from transcript",
            "corrected": "Corrected native sentence",
            "explanation": "O'zbek tilida grammatik tushuntirish"
          }
        ],
        "better_vocabulary": [
          {
            "original": "simple word used by student",
            "suggested": "native or Band 8+ word",
            "context": "Context or example sentence in Uzbek"
          }
        ],
        "overall_feedback": "Studentning suhbatini to'liq sarhisob qiluvchi chuqur tahliliy fikr (O'zbek tilida).",
        "strengths": ["Suhbatdagi 2-3 ta eng kuchli tomonlari (O'zbek tilida)"],
        "areas_to_improve": ["Kelgusida ishlash kerak bo'lgan 2-3 ta yo'nalish (O'zbek tilida)"]
      }

      Constraint: Return ONLY valid JSON without markdown fences.
    `;

  try {
    const response = await callSelectedAIProvider(prompt, undefined, true);
    const cleanedText = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const data = JSON.parse(cleanedText);

    const lexical = typeof data.lexical_score === 'number' ? data.lexical_score : 7.0;
    const grammar = typeof data.grammar_score === 'number' ? data.grammar_score : 7.0;
    const fluency = typeof data.fluency_score === 'number' ? data.fluency_score : 7.0;
    const pronunciation =
      typeof data.pronunciation_score === 'number' ? data.pronunciation_score : 7.5;
    const overall = calculateWeightedOverallScore(lexical, grammar, fluency, pronunciation);

    return {
      lexical_score: lexical,
      grammar_score: grammar,
      fluency_score: fluency,
      pronunciation_score: pronunciation,
      overall_score: overall,
      user_level_eng: data.user_level_eng || getCEFRLevelFromScore(overall),
      user_level_jp: data.user_level_jp || getJLPTLevelFromScore(overall),
      pronunciation_feedback:
        data.pronunciation_feedback || "Talaffuzingiz yaxshi, urg'uga biroz e'tibor bering.",
      pronunciation_errors: Array.isArray(data.pronunciation_errors)
        ? data.pronunciation_errors
        : [],
      grammar_corrections: Array.isArray(data.grammar_corrections) ? data.grammar_corrections : [],
      better_vocabulary: Array.isArray(data.better_vocabulary) ? data.better_vocabulary : [],
      overall_feedback:
        data.overall_feedback || 'Yaxshi harakat qildingiz, mashq qilishni davom eting!',
      strengths: Array.isArray(data.strengths) ? data.strengths : ['Faol ishtirok etdingiz'],
      areas_to_improve: Array.isArray(data.areas_to_improve)
        ? data.areas_to_improve
        : ['Grammatikani oshirish'],
    };
  } catch (err) {
    console.error('Session Analysis Error:', err);
    const totalWords = userMessages.join(' ').split(/\s+/).length;
    const baseScore = Math.min(9.0, Math.max(5.0, 5.0 + Math.floor(totalWords / 20) * 0.5));
    const overall = calculateWeightedOverallScore(baseScore, baseScore, baseScore, baseScore);

    return {
      lexical_score: baseScore,
      grammar_score: baseScore,
      fluency_score: baseScore,
      pronunciation_score: baseScore,
      overall_score: overall,
      user_level_eng: getCEFRLevelFromScore(overall),
      user_level_jp: getJLPTLevelFromScore(overall),
      pronunciation_feedback:
        "Sessiyadagi so'zlashuv tempi va grammatik bog'liqlik asosida avtomatik daraja baholandi.",
      pronunciation_errors: [],
      grammar_corrections: [],
      better_vocabulary: [],
      overall_feedback:
        "Suhbat yakunlandi. Yana ko'proq muloqot qilish orqali darajangizni oshirishingiz mumkin!",
      strengths: ['Suhbatda faol gapirdingiz'],
      areas_to_improve: ["Murakkabroq so'z birikmalarini ishlatish"],
    };
  }
};

export const translateTextToUzbek = async (text: string): Promise<string> => {
  if (!text || typeof text !== 'string' || !text.trim()) return '';

  const cleanInput = text.trim();

  // 1. Instant dictionary lookup for standard coach greetings & phrases
  const knownPhrases: Record<string, string> = {
    'こんにちは！鬼先生です。遠慮せずに日本語で話してください！':
      "Salom! Men Oni-senseiman (Qattiqqo'l ustoz). Tortinmasdan yapon tilida gapiring!",
    'こんにちは！日本語の先生です。いつでもお話ししてくださいね。':
      "Salom! Men yapon tili o'qituvchisiman. Istalgan vaqtda gaplashishingiz mumkin.",
    'こんにちは！JLPTスピーキングの練習を始めましょう！':
      'Salom! Keling, JLPT Speaking mashqini boshlaymiz!',
    'こんにちは。本日のIT面接を担当いたします。自己紹介をお願いします。':
      "Assalomu alaykum. Bugungi IT intervyuni men olib boraman. O'zingizni tanishtiring.",
    'いらっしゃいませ！成田空港へようこそ。どのようなご要件でしょうか？':
      'Xush kelibsiz! Narita aeroportiga xush kelibsiz. Qanday yordam bera olaman?',
    'やあ！元気？今日は何について話そうか！': 'Salom! Qalaysan? Bugun nima haqida gaplashamiz!',
    '何をもたもたしているのですか！遠慮せずに、もっと自信を持って日本語で話してください！最近の勉強はどうですか？':
      "Nega ikkilanib turibsiz! Tortinmasdan, o'zingizga ko'proq ishonch bilan yapon tilida gapiring! So'nggi paytlarda o'qishingiz qanday ketmoqda?",
    '何をもたもたしているのですか！遠慮せずに、もっとしっかり日本語で話してください！最近の勉強はどうですか？':
      "Nega ikkilanib turibsiz! Tortinmasdan, dadilroq yapon tilida gapiring! O'qishingiz qanday ketmoqda?",
    'はい、よく分かりました！続けて日本語でお話ししましょう。最近はどうですか？':
      "Ha, juda yaxshi tushundim! Yapon tilida gaplashishda davom etaylik. So'nggi paytlarda ishlaringiz qanday?",
  };

  if (knownPhrases[cleanInput]) {
    return knownPhrases[cleanInput];
  }

  const isJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(cleanInput);

  const prompt = `
      Translate the following ${isJapanese ? 'Japanese' : 'English'} text into natural, fluent Uzbek (O'zbek tili).
      
      STRICT REQUIREMENTS:
      1. Return ONLY the translated Uzbek text.
      2. Do NOT return the original ${isJapanese ? 'Japanese' : 'English'} text.
      3. Do NOT add quotes, markdown, explanations, or Romanization.
      4. Ensure natural Uzbek phrasing with correct suffixes (-da, -ga, -ni, -dan).

      Text to translate:
      "${cleanInput}"
    `;

  try {
    const dsResult = await callSelectedAIProvider(
      prompt,
      'You are an expert real-time translator from Japanese and English to Uzbek. Translate accurately into Uzbek. Output only the pure Uzbek translation.',
      false,
    );
    if (dsResult && dsResult.trim().length > 0) {
      const clean = dsResult
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/```/g, '')
        .trim();
      if (clean !== cleanInput && !/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(clean)) {
        return clean;
      }
    }
  } catch (err) {
    console.error('Translation Error:', err);
  }

  return cleanInput;
};

/**
 * Dynamically builds a system prompt for adaptive CEFR / JLPT conversation tutoring
 */
export const buildAdaptiveSystemPrompt = (
  mode: 'eng' | 'jp' = 'eng',
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'B2',
  jlptLevel?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1',
): string => {
  if (mode === 'jp') {
    return `You are Sakamoto-sensei, an expert Japanese Kaiwa coach. Target JLPT Level: ${jlptLevel || 'N3'}. Adapt vocabulary and kanji usage dynamically. If user makes a grammar error, append micro-feedback format: [GRAMMAR_ERR: original -> correction | explanation].`;
  }
  return `You are Alex, an expert IELTS Examiner and adaptive CEFR Coach. Current Target CEFR Level: ${cefrLevel}. Adapt vocabulary, speed, and question depth. If user makes a grammar/vocab error, append micro-feedback format: [GRAMMAR_ERR: original -> correction | explanation].`;
};

/**
 * Parses micro-error tags from AI streaming or text output
 */
export const parseMicroErrors = (text: string) => {
  const errorRegex = /\[(GRAMMAR_ERR|VOCAB_ERR|PRON_ERR):\s*([^->]+)->([^|]+)\|\s*([^\]]+)\]/gi;
  const errors: {
    id: string;
    type: 'grammar' | 'vocabulary' | 'pronunciation';
    originalText: string;
    correction: string;
    explanation: string;
  }[] = [];

  let match;
  while ((match = errorRegex.exec(text)) !== null) {
    const typeTag = match[1].toUpperCase();
    errors.push({
      id: Math.random().toString(36).substring(2, 9),
      type: typeTag.includes('VOCAB')
        ? 'vocabulary'
        : typeTag.includes('PRON')
          ? 'pronunciation'
          : 'grammar',
      originalText: match[2].trim(),
      correction: match[3].trim(),
      explanation: match[4].trim(),
    });
  }

  return errors;
};

/**
 * Extracts clean, natural conversational text for TTS voice playback.
 * Removes visual grammar notes, emojis, PREP analysis, bracketed translations, and lecture sections so voice audio remains concise and natural (5-10 seconds max).
 */
export const extractSpeechAudioText = (fullText: string): string => {
  if (!fullText) return '';

  // 1. Remove micro-error tags [GRAMMAR_ERR: ...]
  const text = fullText.replace(/\[(GRAMMAR_ERR|VOCAB_ERR|PRON_ERR):[^\]]+\]/gi, '');

  // 2. Check if text contains Japanese characters (Hiragana/Katakana/Kanji)
  const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);

  if (hasJapanese) {
    const lines = text.split('\n');
    const spokenLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (
        /^(?:📖|📝|📋|✍️|📊|💡|🎯|🔍|🌱)/u.test(line) ||
        /^(解説|正しい文|Grammar Note|Note|ヒント|アドバイス):/i.test(line)
      ) {
        break;
      }
      spokenLines.push(line);
    }

    const joined = spokenLines.join(' ');
    const cleanedJa = cleanJapaneseTTS(joined);
    if (cleanedJa.length > 0) return cleanedJa;

    return cleanJapaneseTTS(text);
  }

  // English text cleaning:
  const lines = text.split('\n');
  const spokenLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (
      /^(?:📖|📝|📋|✍️|📊|💡|🎯|🔍|🌱)/u.test(line) ||
      /^(Grammar Note|Note|Feedback|Analysis|Tip):/i.test(line)
    ) {
      break;
    }
    spokenLines.push(line);
  }

  let spokenText = spokenLines.join(' ');
  spokenText = spokenText.replace(/\[[^\]]*\]/g, '');
  spokenText = spokenText.replace(/\([^)]*\)/g, '');
  spokenText = spokenText.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
    '',
  );

  return spokenText.replace(/\s+/g, ' ').trim();
};
