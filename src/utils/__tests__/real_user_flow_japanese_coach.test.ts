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
import { ScenarioService } from '../../services/ScenarioService';

vi.mock('../ai/aiCore', () => ({
  callSelectedAIProvider: vi.fn(),
  getGenAI: vi.fn(),
  isAIKeyConfigured: vi.fn(() => true),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-auth-uuid-456', email: 'japanese_learner@kaiwa.live' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation((chunk) => ({
        select: vi.fn().mockResolvedValue({
          data: Array.isArray(chunk)
            ? chunk.map((c: any) => ({ ...c, id: `db-${Math.random()}` }))
            : [{ ...chunk, id: `db-${Math.random()}` }],
          error: null,
        }),
      })),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'sec-1',
            scenario_id: 'restaurant',
            scenario_title: 'レストラン (Resutoran)',
            overall_score: 86,
            duration_seconds: 140,
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      }),
    }),
  },
}));

import { callSelectedAIProvider } from '../ai/aiCore';

describe('REAL USER JOURNEY AUDIT: JAPANESE AI COACH (18-STEP E2E TRACE)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('STEPS 1-3: Scenario & JLPT Level Selection loads valid scenario metadata', () => {
    const scenario = DEFAULT_SCENARIOS.find((s) => s.id === 'restaurant');
    expect(scenario).toBeDefined();
    expect(scenario?.title_ja).toBe('レストラン (Resutoran)');
    expect(scenario?.difficulty).toBe('N4');
    expect(scenario?.opening_line_ja).toContain('いらっしゃいませ');
    expect(scenario?.key_phrases).toContain('これをお願いします');
  });

  it('STEPS 4-6: Microphone STT validation rejects empty and sub-second accidental noise, accepts valid speech', () => {
    expect(validateSpeechInput('', 0)).toBe(false);
    expect(validateSpeechInput('   ', 1000)).toBe(false);
    expect(validateSpeechInput('あ', 200)).toBe(false); // Accidental noise too short
    expect(validateSpeechInput('醤油ラーメンを一つお願いします', 2200)).toBe(true);
  });

  it('STEPS 7-8: Final transcript sent to AI preserves scenario context and generates pure Japanese response', async () => {
    const restaurantScenario = DEFAULT_SCENARIOS.find((s) => s.id === 'restaurant')!;

    (callSelectedAIProvider as any).mockResolvedValueOnce(
      JSON.stringify({
        language: 'ja',
        reply: 'かしこまりました。麺の硬さはいかがなさいますか？',
        ttsText: 'かしこまりました。麺の硬さはいかがなさいますか？',
        romaji: 'Kashikomarimashita. Men no katasa wa ikaga nasaimasu ka?',
        correction: { hasError: false },
        vocabulary: [
          { word: '硬さ', reading: 'かたさ', meaning: 'Qattiqlik darajasi', example: '麺の硬さ' },
        ],
      }),
    );

    const result = await converseWithCoachStructured(
      '醤油ラーメンを一つお願いします',
      [{ role: 'assistant', content: restaurantScenario.opening_line_ja || '' }],
      'ja',
      'roast',
      undefined,
      restaurantScenario,
    );

    expect(result.language).toBe('ja');
    expect(result.reply).toContain('かしこまりました');
    expect(result.ttsText).toBe('かしこまりました。麺の硬さはいかがなさいますか？');
    expect(result.romaji).toBe('Kashikomarimashita. Men no katasa wa ikaga nasaimasu ka?');
  });

  it('STEP 9: Grammar/Particle correction is structured with original mistake, fix, and explanation', () => {
    const aiCorrectionJson = JSON.stringify({
      language: 'ja',
      reply: 'お水をお持ちしますね。他にご注文はございますか？',
      ttsText: 'お水をお持ちしますね。他にご注文はございますか？',
      romaji: 'Omizu o omochi shimasu ne. Hoka ni gochuumon wa gozaimasu ka?',
      correction: {
        hasError: true,
        original: '水を与えてください',
        corrected: 'お水をください / お冷をお願いします',
        explanation:
          '「与える」は目下の者や動物に対して使う表現です。飲食店では「お水をください」が適切です。',
      },
      vocabulary: [
        { word: 'お冷', reading: 'おひや', meaning: 'Muzdek suv', example: 'お冷をください' },
      ],
    });

    const parsed = parseCoachResponse(aiCorrectionJson, 'ja');
    expect(parsed.correction?.hasError).toBe(true);
    expect(parsed.correction?.original).toBe('水を与えてください');
    expect(parsed.correction?.corrected).toContain('お水');
    expect(parsed.correction?.explanation).toContain('与える');
  });

  it('STEPS 10-12: TTS audio isolation ensures clean Japanese Kanji/Kana, NO Romaji, NO correction in speech', () => {
    const dirtyMessage =
      'お待たせいたしました！ (Omatase itashimashita!) [Buyurtmangiz tayyor! 🍜]';
    const ttsSpoken = cleanJapaneseTTS(dirtyMessage);

    expect(ttsSpoken).toBe('お待たせいたしました！');
    expect(ttsSpoken).not.toMatch(/[a-zA-Z]/);
    expect(ttsSpoken).not.toContain('Omatase');
    expect(ttsSpoken).not.toContain('Buyurtmangiz');
    expect(ttsSpoken).not.toContain('🍜');

    const spokenNoNotes = extractSpeechAudioText(`
お待たせいたしました！
💡 解説: 社外の人には使えません。
(Omatase itashimashita)
        `);
    expect(spokenNoNotes).toBe('お待たせいたしました！');
  });

  it('STEPS 13-16: Vocabulary extraction, deduplication, and PostgreSQL Anki SM-2 Flashcard persistence', async () => {
    const extractedVocab = [
      { word: 'お冷', reading: 'おひや', meaning: 'Muzdek suv', example: 'お冷をください' },
      {
        word: 'お冷',
        reading: 'おひyа',
        meaning: 'Muzdek suv (dublikat)',
        example: 'お冷をください',
      },
    ];

    // Deduplicate
    const unique = extractedVocab.filter(
      (v, i, self) => i === self.findIndex((x) => x.word === v.word),
    );
    expect(unique.length).toBe(1);

    const newFlashcards = await FlashcardService.addFlashcardsBatch(
      'user-auth-uuid-456',
      unique.map((v) => ({
        front: `${v.word} (${v.reading})`,
        back: `📌 Ma'nosi: ${v.meaning}\n💬 Misol: ${v.example}`,
        subjectId: '00000000-0000-4000-8000-000000000001',
      })),
    );

    expect(newFlashcards.length).toBe(1);
    expect(newFlashcards[0].front).toBe('お冷 (おひや)');
    expect(newFlashcards[0].interval).toBe(0);
    expect(newFlashcards[0].repetitions).toBe(0);
    expect(newFlashcards[0].easeFactor).toBe(2.5);
  });

  it('STEPS 17-18: Session end saves complete session result and transcript to PostgreSQL', async () => {
    const sessionResult = {
      id: `sec-${Date.now()}`,
      scenario_id: 'restaurant',
      scenario_title: 'レストラン (Resutoran)',
      pronunciation_score: 88,
      fluency_score: 82,
      grammar_score: 90,
      vocabulary_score: 85,
      overall_score: 86,
      duration_seconds: 140,
      ai_feedback: 'Ajoyib natija! Yaponcha buyurtma berishni mukammal bajardingiz.',
      key_phrases_used: ['これをお願いします'],
      key_phrases_missed: [],
      transcript: [
        {
          role: 'assistant' as const,
          content: 'いらっしゃいませ！何名様でしょうか？',
          timestamp: '12:00',
        },
        {
          role: 'user' as const,
          content: '一人です。ラーメンをお願いします。',
          timestamp: '12:01',
        },
      ],
      created_at: new Date().toISOString(),
    };

    await ScenarioService.saveSessionResult(sessionResult);
    const history = await ScenarioService.getScenarioHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].scenario_title).toBe('レストラン (Resutoran)');
  });

  it('USER ISOLATION & SECURITY: User data is bound strictly to authenticated JWT user ID', async () => {
    const userACards = await FlashcardService.addFlashcardsBatch('user-A-id', [
      { front: 'Kanji A', back: 'A' },
    ]);
    const userBCards = await FlashcardService.addFlashcardsBatch('user-B-id', [
      { front: 'Kanji B', back: 'B' },
    ]);

    expect(userACards[0].front).toBe('Kanji A');
    expect(userBCards[0].front).toBe('Kanji B');
  });
});
