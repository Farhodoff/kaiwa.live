import { describe, it, expect } from 'vitest';
import { buildCoachPrompts, extractSpeechAudioText } from '../../../utils/ai';
import { isAcousticEcho } from '../../../utils/echoFilter';
import { PERSONAS_BY_LANG } from '../speakingTypes';

describe('Realtime Roleplay Voice Chatbot & Audio Orchestration', () => {
  describe('Persona Prompts & JLPT Level Adaptations', () => {
    it('configures Oni Yuki-sensei strict roast persona in Japanese', () => {
      const { systemPrompt } = buildCoachPrompts('いいです。', [], 'ja', 'roast', null, 'N3');

      expect(systemPrompt).toContain('鬼の雪先生');
      expect(systemPrompt).toContain('妥協を一切許さない超激辛・毒舌指導官');
    });

    it('enforces simplified N5 dialogue rules when difficulty is N5', () => {
      const scenario = {
        id: 'convenience_store_n5',
        language: 'ja' as const,
        title_ja: 'コンビニでの買い物',
        title_uz: 'Konbini xaridi',
        emoji: '🏪',
        difficulty: 'N5' as const,
        category: 'daily' as const,
        description_uz: 'Oddiy xarid dialogi',
        context_prompt: 'コンビニの店員として客に対応してください。',
        key_phrases: ['これをお願いします', 'いくらですか'],
        is_custom: false,
      };

      const { systemPrompt } = buildCoachPrompts(
        'これをください。',
        [],
        'ja',
        'roast',
        scenario,
        'N5',
      );

      expect(systemPrompt).toContain('JLPT N5 初級会話ルール — 超シンプル化');
      expect(systemPrompt).toContain(
        '接客敬語・尊敬語・謙譲語（いらっしゃる、おっしゃる、申し上げる',
      );
      expect(systemPrompt).toContain('コンビニでの買い物');
    });

    it('provides all standard roleplay personas in Japanese and English dictionaries', () => {
      const personasJa = PERSONAS_BY_LANG.ja;
      const personasEn = PERSONAS_BY_LANG.en;

      expect(personasJa.roast).toBeDefined();
      expect(personasJa.gentle).toBeDefined();
      expect(personasJa.ielts).toBeDefined();
      expect(personasJa.interview).toBeDefined();
      expect(personasJa.travel).toBeDefined();
      expect(personasJa.casual).toBeDefined();

      expect(personasEn.roast).toBeDefined();
      expect(personasEn.gentle).toBeDefined();
    });
  });

  describe('Acoustic Echo and Device Speaker Filtering', () => {
    it('detects speaker loopback when user input echoes the coach utterance', () => {
      const coachLine = '明日の午前中に日本語のテストがありますよ。';
      const userEcho = '明日の午前中に日本語のテストがありますよ';

      expect(isAcousticEcho(userEcho, coachLine)).toBe(true);
    });

    it('allows genuine student responses that differ from coach speech', () => {
      const coachLine = '明日の午前中に日本語のテストがありますよ。準備はできましたか？';
      const studentAnswer = 'はい、昨晩しっかりと勉強しました。';

      expect(isAcousticEcho(studentAnswer, coachLine)).toBe(false);
    });
  });

  describe('Audio-Ready Speech Cleaning (extractSpeechAudioText)', () => {
    it('strips markdown asterisks, bracketed lecture notes, and emoji clutter', () => {
      const rawAiText = `
**雪先生:** こんにちは！😊
[補足: 挨拶はとても大切です]
今日は何を勉強したいですか？
      `.trim();

      const cleaned = extractSpeechAudioText(rawAiText);
      expect(cleaned).not.toContain('**');
      expect(cleaned).not.toContain('[補足:');
      expect(cleaned).toContain('こんにちは');
      expect(cleaned).toContain('今日は何を勉強したいですか');
    });
  });
});
