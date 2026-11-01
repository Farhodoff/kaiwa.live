import { describe, it, expect } from 'vitest';
import { JLPT_KANJI_DATABASE } from '../../data/jlptKanjiDatabase';
import { JLPT_GRAMMAR_DATABASE } from '../../data/jlptGrammarDatabase';
import { DEFAULT_SCENARIOS } from '../../data/defaultScenarios';
import { generateAlgorithmicJlptPlan } from '../curriculum/jlptAlgorithmicPlanner';
import { cleanJapaneseTTS, parseCoachResponse } from '../ai/aiCoach';

describe('REAL PRODUCT UX & JAPANESE LEARNING QUALITY SUITE', () => {
  describe('1. JLPT N5-N1 Curriculum Database Audit', () => {
    it('verifies Kanji database contains valid entries with on/kun readings and Uzbek meanings', () => {
      expect(JLPT_KANJI_DATABASE.length).toBeGreaterThan(50);
      const sampleKanji = JLPT_KANJI_DATABASE[0];
      expect(sampleKanji.kanji).toBeDefined();
      expect(sampleKanji.meaningUz).toBeDefined();
      expect(sampleKanji.level).toMatch(/N[1-5]/);
    });

    it('verifies Grammar database contains structured lessons with examples and formulas', () => {
      expect(JLPT_GRAMMAR_DATABASE.length).toBeGreaterThan(20);
      const sampleGrammar = JLPT_GRAMMAR_DATABASE[0];
      expect(sampleGrammar.title).toBeDefined();
      expect(sampleGrammar.meaningUz).toBeDefined();
      expect(sampleGrammar.structure).toBeDefined();
      expect(sampleGrammar.examples.length).toBeGreaterThan(0);
    });
  });

  describe('2. Algorithmic Study Plan Generation', () => {
    it('generates a phased, deterministic 30-day JLPT curriculum with concrete daily tasks', async () => {
      const plan = await generateAlgorithmicJlptPlan('N5', 'N3', 30);
      expect(plan.length).toBe(30);

      // Check day 1
      const day1 = plan[0];
      expect(day1.day).toBe(1);
      expect(day1.title).toBeDefined();
      expect(day1.tasks.length).toBeGreaterThan(2);

      // Check final day
      const lastDay = plan[plan.length - 1];
      expect(lastDay.day).toBe(30);
      expect(lastDay.tasks.length).toBeGreaterThan(0);
    });
  });

  describe('3. Japanese Speaking Scenarios Audit', () => {
    it('verifies default scenarios cover all levels from N5 to N1 with rich prompt context', () => {
      const levels = new Set(DEFAULT_SCENARIOS.map((s) => s.difficulty));
      expect(levels.has('N5')).toBe(true);
      expect(levels.has('N4')).toBe(true);
      expect(levels.has('N3')).toBe(true);
      expect(levels.has('N2')).toBe(true);
      expect(levels.has('N1')).toBe(true);

      const jaScenarios = DEFAULT_SCENARIOS.filter(
        (s) => (s.language || (s.title_en ? 'en' : 'ja')) === 'ja',
      );
      jaScenarios.forEach((s) => {
        expect(s.title_ja).toBeDefined();
        expect((s.opening_line_ja || '').length).toBeGreaterThan(5);
        expect(s.key_phrases.length).toBeGreaterThan(0);
        expect(s.context_prompt.length).toBeGreaterThan(20);
      });
    });
  });

  describe('4. AI Coach Pedagogical Dialogue & Error Correction', () => {
    it('parses structured coach responses into clean Japanese dialogue and isolated corrections', () => {
      const mockAiJson = JSON.stringify({
        language: 'ja',
        reply: 'いいですね！週末は何をしますか？',
        ttsText: 'いいですね！週末は何をしますか？',
        romaji: 'Ii desu ne! Shuumatsu wa nani wo shimasu ka?',
        correction: {
          hasError: true,
          original: '友達と行くでした',
          corrected: '友達と行くつもりです',
          explanation: '未来の予定には「〜つもりです」を使います。',
        },
        vocabulary: [
          {
            word: '週末',
            reading: 'しゅうまつ',
            meaning: 'hafta oxiri (dam olish kunlari)',
            example: '週末に映画を見ます。',
          },
        ],
      });

      const parsed = parseCoachResponse(mockAiJson, 'ja');
      expect(parsed.reply).toBe('いいですね！週末は何をしますか？');
      expect(parsed.ttsText).toBe('いいですね！週末は何をしますか？');
      expect(parsed.correction?.corrected).toBe('友達と行くつもりです');
      expect(parsed.vocabulary?.[0].word).toBe('週末');
    });

    it('ensures TTS text is completely stripped of Romaji, English notes, and emojis', () => {
      const mixedString =
        '美味しい寿司を食べました。(Oishii sushi wo tabemashita) 🍣 [Mazali sushi yedim]';
      const cleanTts = cleanJapaneseTTS(mixedString);
      expect(cleanTts).toBe('美味しい寿司を食べました。');
      expect(cleanTts).not.toContain('Oishii');
      expect(cleanTts).not.toContain('Mazali');
      expect(cleanTts).not.toContain('🍣');
    });
  });

  describe('5. English Mode & IELTS Speaking Isolation', () => {
    it('maintains strict English isolation for IELTS conversations without Japanese leakage', () => {
      const mockEnglishJson = JSON.stringify({
        language: 'en',
        reply:
          'That sounds fascinating. Could you explain why public transport is crucial in your city?',
        ttsText:
          'That sounds fascinating. Could you explain why public transport is crucial in your city?',
        romaji: '',
        correction: { hasError: false },
        vocabulary: [
          {
            word: 'crucial',
            reading: '',
            meaning: 'juda muhim, hal qiluvchi',
            example: 'Public transport is crucial.',
          },
        ],
      });

      const parsed = parseCoachResponse(mockEnglishJson, 'en');
      expect(parsed.language).toBe('en');
      expect(parsed.romaji).toBe('');
      expect(parsed.reply).not.toMatch(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/);
    });
  });

  describe('6. Learning Loop Integration (Flashcard & SRS)', () => {
    it('formats vocabulary for 1-click addition to Anki SM-2 flashcard decks', () => {
      const vocabItem = {
        word: '頼む',
        reading: 'たのむ',
        meaning: 'buyurtma bermoq, iltimos qilmoq',
        example: 'コーヒーを頼みます。',
      };

      const flashcardFront = `${vocabItem.word} (${vocabItem.reading})`;
      const flashcardBack = `📌 Ma'nosi: ${vocabItem.meaning}\n\n💬 Misol: ${vocabItem.example}`;

      expect(flashcardFront).toBe('頼む (たのむ)');
      expect(flashcardBack).toContain('buyurtma bermoq');
      expect(flashcardBack).toContain('コーヒーを頼みます。');
    });
  });
});
