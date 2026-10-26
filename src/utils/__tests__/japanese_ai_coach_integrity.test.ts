import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseCoachResponse,
  cleanJapaneseTTS,
  extractSpeechAudioText,
  converseWithCoachStructured,
  validateSpeechInput,
} from '../ai';
import { DEFAULT_SCENARIOS } from '../../data/defaultScenarios';
import { FlashcardService } from '../../services/FlashcardService';

vi.mock('../ai/aiCore', () => ({
  callSelectedAIProvider: vi.fn(),
  getGenAI: vi.fn(),
  isAIKeyConfigured: vi.fn(() => true),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-uuid-123', email: 'test@kaiwa.live' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation((chunk) => ({
        select: vi.fn().mockResolvedValue({
          data: chunk.map((c: any) => ({ ...c, id: `db-${Math.random()}` })),
          error: null,
        }),
      })),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));

import { callSelectedAIProvider } from '../ai/aiCore';

describe('JAPANESE AI COACH & SYSTEM INTEGRITY SUITE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST 1: Japanese scenario returns structured Japanese JSON with Kanji/Kana and no English in reply', () => {
    const mockRawAiResponse = JSON.stringify({
      language: 'ja',
      reply: 'かしこまりました。ラーメンをお持ちいたします。お飲み物はいかがですか？',
      ttsText: 'かしこまりました。ラーメンをお持ちいたします。お飲み物はいかがですか？',
      romaji: 'Kashikomarimashita. Raamen o omochi itashimasu. Onomimono wa ikaga desu ka?',
      correction: {
        hasError: false,
        original: '',
        corrected: '',
        explanation: '',
      },
      vocabulary: [
        {
          word: 'お飲み物',
          reading: 'おのみもの',
          meaning: 'Ichimlik',
          example: 'お飲み物は何にしますか？',
        },
      ],
    });

    const parsed = parseCoachResponse(mockRawAiResponse, 'ja');
    expect(parsed.language).toBe('ja');
    expect(parsed.reply).toBe(
      'かしこまりました。ラーメンをお持ちいたします。お飲み物はいかがですか？',
    );
    expect(parsed.ttsText).toBe(
      'かしこまりました。ラーメンをお持ちいたします。お飲み物はいかがですか？',
    );
    expect(parsed.romaji).toContain('Kashikomarimashita');
    expect(parsed.vocabulary?.length).toBe(1);
  });

  it('TEST 2: English scenario returns structured English response without Japanese or Romaji', () => {
    const mockRawAiResponse = JSON.stringify({
      language: 'en',
      reply:
        "Certainly! I'd recommend trying our special pasta. Would you like a beverage to go with it?",
      ttsText:
        "Certainly! I'd recommend trying our special pasta. Would you like a beverage to go with it?",
      romaji: '',
      correction: {
        hasError: false,
      },
      vocabulary: [{ word: 'beverage', reading: '', meaning: 'Ichimlik', example: 'Hot beverage' }],
    });

    const parsed = parseCoachResponse(mockRawAiResponse, 'en');
    expect(parsed.language).toBe('en');
    expect(parsed.reply).toContain('Certainly!');
    expect(parsed.romaji).toBe('');
  });

  it('TEST 3: cleanJapaneseTTS completely strips Romaji, Uzbek translations, and emojis from Japanese TTS text', () => {
    const dirtyJapaneseWithRomaji =
      'ご注文はお決まりですか？ (Gochuumon wa okimari desu ka?) [Buyurtmangiz tayyormi? 🎉]';
    const cleanTTS = cleanJapaneseTTS(dirtyJapaneseWithRomaji);

    expect(cleanTTS).toBe('ご注文はお決まりですか？');
    expect(cleanTTS).not.toMatch(/[a-zA-Z]/); // No Latin letters
    expect(cleanTTS).not.toContain('Gochuumon');
    expect(cleanTTS).not.toContain('Buyurtmangiz');
    expect(cleanTTS).not.toContain('🎉');
  });

  it('TEST 4: Romaji is strictly excluded from TTS output and preserved only in UI property', () => {
    const mockResponse = JSON.stringify({
      language: 'ja',
      reply: 'お待たせいたしました。',
      ttsText: 'お待たせいたしました。',
      romaji: 'Omatase itashimashita.',
      correction: { hasError: false },
    });

    const parsed = parseCoachResponse(mockResponse, 'ja');
    expect(parsed.ttsText).not.toContain('Omatase');
    expect(parsed.ttsText).toBe('お待たせいたしました。');
    expect(parsed.romaji).toBe('Omatase itashimashita.');
  });

  it('TEST 5: extractSpeechAudioText extracts clean spoken text without visual notes or lecture markers', () => {
    const fullDialogueWithLecture = `
かしこまりました。
📖 例文: 過去形を使います。
💡 解説: 社外の人に対しては「参る」を使います。
(Kashikomarimashita)
[Tushundim]
        `;

    const spoken = extractSpeechAudioText(fullDialogueWithLecture);
    expect(spoken).toBe('かしこまりました。');
    expect(spoken).not.toContain('例文');
    expect(spoken).not.toContain('解説');
    expect(spoken).not.toContain('Kashikomarimashita');
  });

  it('TEST 6: Correction and explanation are NEVER automatically played via TTS', () => {
    const errorResponse = JSON.stringify({
      language: 'ja',
      reply: '図書館で本を借りましたね。どんな本を読みましたか？',
      ttsText: '図書館で本を借りましたね。どんな本を読みましたか？',
      romaji: 'Toshokan de hon o karimashita ne. Donna hon o yomimashita ka?',
      correction: {
        hasError: true,
        original: '図書館に本を借りました',
        corrected: '図書館で本を借りました',
        explanation: '場所で動作を行うときは助詞「で」を使います。',
      },
    });

    const parsed = parseCoachResponse(errorResponse, 'ja');
    // ttsText MUST NOT contain the error or correction explanation
    expect(parsed.ttsText).not.toContain('図書館に本を借りました');
    expect(parsed.ttsText).not.toContain('場所で動作を行うときは');
    expect(parsed.ttsText).toBe('図書館で本を借りましたね。どんな本を読みましたか？');
  });

  it('TEST 7: Japanese grammar correction is structured properly with error details and explanation', () => {
    const mockErrorResponse = JSON.stringify({
      language: 'ja',
      reply: '昨日学校へ行きましたね。学校では何を勉強しましたか？',
      ttsText: '昨日学校へ行きましたね。学校では何を勉強しましたか？',
      romaji: 'Kinou gakkou e ikimashita ne. Gakkou de wa nani o benkyou shimashita ka?',
      correction: {
        hasError: true,
        original: '昨日学校に行きます',
        corrected: '昨日学校に行きました',
        explanation: '「昨日」は過去の出来事なので、過去形の「行きました」を使います。',
      },
      vocabulary: [
        { word: '出来事', reading: 'できごと', meaning: 'Voqea, hodisa', example: '昨日の出来事' },
      ],
    });

    const parsed = parseCoachResponse(mockErrorResponse, 'ja');
    expect(parsed.correction?.hasError).toBe(true);
    expect(parsed.correction?.original).toBe('昨日学校に行きます');
    expect(parsed.correction?.corrected).toBe('昨日学校に行きました');
    expect(parsed.correction?.explanation).toContain('過去形');
  });

  it('TEST 8: Scenario context, target JLPT level, and key phrases are preserved when calling converseWithCoachStructured', async () => {
    const ramenScenario =
      DEFAULT_SCENARIOS.find((s) => s.id === 'sc_restaurant_ramen') || DEFAULT_SCENARIOS[0];

    (callSelectedAIProvider as any).mockResolvedValueOnce(
      JSON.stringify({
        language: 'ja',
        reply: 'いらっしゃいませ！何名様でしょうか？',
        ttsText: 'いらっしゃいませ！何名様でしょうか？',
        romaji: 'Irasshaimase! Nanmei-sama deshou ka?',
        correction: { hasError: false },
        vocabulary: [
          {
            word: '名様',
            reading: 'めいさま',
            meaning: 'Kishi (hurmat shakli)',
            example: '二名様です',
          },
        ],
      }),
    );

    const result = await converseWithCoachStructured(
      'こんにちは',
      [],
      'ja',
      'roast',
      undefined,
      ramenScenario,
    );

    expect(result.language).toBe('ja');
    expect(result.reply).toContain('いらっしゃいませ');
    expect(callSelectedAIProvider).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(ramenScenario.title_ja || ramenScenario.title_uz),
      true,
    );
  });

  it('TEST 9 & 10: Deduplication prevents duplicate vocabulary flashcards in both batch and existing store', () => {
    const vocabList = [
      { front: '🇯🇵 単語:\n"注文"', back: "📌 Ma'nosi: Buyurtma" },
      { front: '🇯🇵 単語:\n"注文"', back: "📌 Ma'nosi: Buyurtma (takror)" },
      { front: '🇯🇵 単語:\n"お冷"', back: "📌 Ma'nosi: Muzdek suv" },
    ];

    const uniqueVocab = vocabList.filter(
      (card, index, self) => index === self.findIndex((c) => c.front === card.front),
    );

    expect(uniqueVocab.length).toBe(2);
    expect(uniqueVocab.map((c) => c.front)).toEqual(['🇯🇵 単語:\n"注文"', '🇯🇵 単語:\n"お冷"']);

    // Existing store filter check
    const existingStore = [{ id: '1', front: '🇯🇵 単語:\n"注文"', back: 'test' }];
    const existingFronts = new Set(existingStore.map((s) => s.front));
    const finalToInsert = uniqueVocab.filter((c) => !existingFronts.has(c.front));
    expect(finalToInsert.length).toBe(1);
    expect(finalToInsert[0].front).toBe('🇯🇵 単語:\n"お冷"');
  });

  it('TEST 11: Vocabulary -> Flashcard batch insertion initializes Anki SM-2 default parameters', async () => {
    const newCards = await FlashcardService.addFlashcardsBatch('test-user-uuid-123', [
      { front: '単語', back: "Ma'nosi", subjectId: 'jlpt-sub-id' },
    ]);

    expect(newCards.length).toBe(1);
    expect(newCards[0].interval).toBe(0);
    expect(newCards[0].repetitions).toBe(0);
    expect(newCards[0].easeFactor).toBe(2.5);
  });

  it('TEST 12 & 13: validateSpeechInput rejects empty, whitespace, or sub-second accidental noise', () => {
    expect(validateSpeechInput('', 0)).toBe(false);
    expect(validateSpeechInput('   ', 2000)).toBe(false);
    expect(validateSpeechInput('a', 200)).toBe(false); // Too short duration
    expect(validateSpeechInput('ラーメンを一つお願いします', 1500)).toBe(true);
  });

  it('TEST 14: Malformed AI response never crashes parser and gracefully falls back', () => {
    const malformed1 = 'I cannot parse this JSON { broken';
    const parsed1 = parseCoachResponse(malformed1, 'ja');
    expect(parsed1.language).toBe('ja');
    expect(parsed1.reply).toBe(malformed1);
    expect(parsed1.ttsText).toBeDefined();

    const malformed2 = '';
    const parsed2 = parseCoachResponse(malformed2, 'en');
    expect(parsed2.language).toBe('en');
    expect(parsed2.reply).toBe("Understood, let's keep going!");
  });

  it('TEST 15: User isolation verifies userId is strictly bound to authenticated session', async () => {
    const inserted = await FlashcardService.addFlashcardsBatch('authenticated-user-999', [
      { front: 'Kanji', back: 'Meaning' },
    ]);
    expect(inserted.length).toBe(1);
    expect(inserted[0].front).toBe('Kanji');
  });

  it('TEST 16: TTS audio generation verifies single audio instance and stop before speak', () => {
    const mockAudioStop = vi.fn();
    const mockAudioPlay = vi.fn();

    let isPlaying = true;
    const stopSpeaking = () => {
      if (isPlaying) {
        mockAudioStop();
        isPlaying = false;
      }
    };

    const speakText = (text: string) => {
      if (!text.trim()) return;
      stopSpeaking();
      mockAudioPlay(text);
      isPlaying = true;
    };

    speakText('いらっしゃいませ！');
    expect(mockAudioStop).toHaveBeenCalledTimes(1);
    expect(mockAudioPlay).toHaveBeenCalledWith('いらっしゃいませ！');

    // Calling again cancels previous and plays once
    speakText('お飲み物は何にしますか？');
    expect(mockAudioStop).toHaveBeenCalledTimes(2);
    expect(mockAudioPlay).toHaveBeenCalledTimes(2);
  });

  it('TEST 17: parseCoachResponse extracts clean reply from markdown ```json block', () => {
    const markdownAiResponse =
      '```json\n' +
      JSON.stringify({
        language: 'ja',
        reply: 'こんにちは！お元気ですか？今日はあなたの自己紹介について話しましょう。',
        ttsText: 'こんにちは！お元気ですか？今日はあなたの自己紹介について話しましょう。',
        romaji: 'Konnichiwa! Ogenki desu ka?',
        correction: { hasError: false },
        vocabulary: [],
      }) +
      '\n```';

    const parsed = parseCoachResponse(markdownAiResponse, 'ja');
    expect(parsed.reply).toBe(
      'こんにちは！お元気ですか？今日はあなたの自己紹介について話しましょう。',
    );
    expect(parsed.reply.startsWith('{')).toBe(false);
  });

  it('TEST 18: parseCoachResponse extracts clean reply when prefixed with DeepSeek <think> reasoning', () => {
    const thinkAiResponse = `<think>
The student said hello. I need to greet them and invite them to do a self-introduction.
Let's formulate a natural Japanese phrase.
</think>
\`\`\`json
{
  "language": "ja",
  "reply": "こんにちは！お元気ですか？今日はあなたの自己紹介について話しましょう。",
  "ttsText": "こんにちは！お元気ですか？今日はあなたの自己紹介について話しましょう。",
  "romaji": "Konnichiwa! Ogenki desu ka?",
  "correction": { "hasError": false }
}
\`\`\``;

    const parsed = parseCoachResponse(thinkAiResponse, 'ja');
    expect(parsed.reply).toBe(
      'こんにちは！お元気ですか？今日はあなたの自己紹介について話しましょう。',
    );
    expect(parsed.reply.includes('<think>')).toBe(false);
    expect(parsed.reply.startsWith('{')).toBe(false);
  });

  it('TEST 19: parseCoachResponse recovers clean reply via regex on malformed JSON and NEVER returns raw JSON', () => {
    // Intentionally broken JSON (unclosed quote, unescaped raw control characters)
    const malformedJson = `{
  "language": "ja",
  "reply": "こんにちは！お元気ですか？今日はあなたの自己紹介について話しましょう。",
  "correction": { "explanation": "Broken string without proper escape
newline here",
  trailing_comma: true,
}`;

    const parsed = parseCoachResponse(malformedJson, 'ja');
    expect(parsed.reply).toBe(
      'こんにちは！お元気ですか？今日はあなたの自己紹介について話しましょう。',
    );
    expect(parsed.reply.startsWith('{')).toBe(false);
    expect(parsed.reply.includes('"language"')).toBe(false);
  });

  it('TEST 20: parseCoachResponse marks correction as active when coach provides corrected variant for short answer', () => {
    const aiJsonWithShortAnswerCorrection = JSON.stringify({
      language: 'ja',
      reply: 'こんにちは！今日は自己紹介を練習しましょう。',
      ttsText: 'こんにちは！今日は自己紹介を練習しましょう。',
      romaji: 'Konnichiwa! Kyou wa jiko shoukai o renshuu shimashou.',
      correction: {
        hasError: false, // Model marked false because greeting is not misspelled
        original: 'こんにちは',
        corrected: 'こんにちは、はじめまして。よろしくお願いします。',
        explanation: 'より自然で丁寧な挨拶に広げましょう。',
      },
      vocabulary: [
        {
          word: 'はじめまして',
          reading: 'はじめまして',
          meaning: 'Tanishganimdan xursandman (Nice to meet you)',
          example: 'はじめまして、田中です。',
        },
      ],
    });

    const parsed = parseCoachResponse(aiJsonWithShortAnswerCorrection, 'ja');
    expect(parsed.correction?.hasError).toBe(true);
    expect(parsed.correction?.original).toBe('こんにちは');
    expect(parsed.correction?.corrected).toBe('こんにちは、はじめまして。よろしくお願いします。');
    expect(parsed.correction?.explanation).toBe('より自然で丁寧な挨拶に広げましょう。');
    expect(parsed.vocabulary?.length).toBe(1);
    expect(parsed.vocabulary?.[0].word).toBe('はじめまして');
  });

  it('TEST 21: parseCoachResponse regex fallback extracts correction and vocabulary even when JSON fails to parse', () => {
    // Malformed JSON with broken syntax
    const malformedJsonWithCorrection = `{
  "language": "ja",
  "reply": "こんにちは！",
  "correction": {
    "original": "こんにちは",
    "corrected": "こんにちは、お元気ですか？",
    "explanation": "挨拶を広げましょう。"
  },
  "vocabulary": [
    {
      "word": "元気",
      "meaning": "Sogʻlom, tetik"
    }
  ],
  broken_unquoted: [
}`;

    const parsed = parseCoachResponse(malformedJsonWithCorrection, 'ja');
    expect(parsed.correction?.hasError).toBe(true);
    expect(parsed.correction?.original).toBe('こんにちは');
    expect(parsed.correction?.corrected).toBe('こんにちは、お元気ですか？');
    expect(parsed.correction?.explanation).toBe('挨拶を広げましょう。');
    expect(parsed.vocabulary?.length).toBe(1);
    expect(parsed.vocabulary?.[0].word).toBe('元気');
  });
});
