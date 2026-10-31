import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpeakingConversationHistoryService } from '../../../services/SpeakingConversationHistoryService';
import { parseCoachResponse } from '../../../utils/ai/aiCoach';

describe('Voice-Only Speaking Sensei Logic & History Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('SpeakingConversationHistoryService', () => {
    it('does not save empty sessions where user did not speak', () => {
      const emptyResult = SpeakingConversationHistoryService.saveSession({
        scenarioTitle: 'Kundalik hayot',
        durationSeconds: 15,
        messages: [
          {
            role: 'assistant',
            content: 'こんにちは！元気ですか？',
            timestamp: '12:00',
          },
        ],
        newWords: [],
      });

      expect(emptyResult).toBeNull();
      expect(SpeakingConversationHistoryService.getSessions().length).toBe(0);
    });

    it('saves a valid session when user spoke, records corrections and new words', () => {
      const saved = SpeakingConversationHistoryService.saveSession({
        scenarioTitle: 'Restoran',
        durationSeconds: 125,
        messages: [
          {
            role: 'assistant',
            content: 'いらっしゃいませ！何にしますか？',
            timestamp: '12:00',
          },
          {
            role: 'user',
            content: 'ラーメンをたべます。',
            timestamp: '12:01',
            corrected: 'ラーメンをお願いします。',
            explanation_uz: 'Buyurtma berganda "...o onegaishimasu" iborasi tabiiyroq eshitiladi.',
          },
          {
            role: 'assistant',
            content: 'かしこまりました。',
            timestamp: '12:01',
          },
        ],
        newWords: [
          { word: '注文', reading: 'ちゅうもん', translation_uz: 'buyurtma' },
          { word: 'おすすめ', reading: 'おすすめ', translation_uz: 'tavsiya' },
        ],
      });

      expect(saved).not.toBeNull();
      expect(saved?.scenarioTitle).toBe('Restoran');
      expect(saved?.durationFormatted).toBe('02:05');
      expect(saved?.errors.length).toBe(1);
      expect(saved?.newWords.length).toBe(2);

      const all = SpeakingConversationHistoryService.getSessions();
      expect(all.length).toBe(1);
      expect(all[0].id).toBe(saved?.id);

      // Delete session
      SpeakingConversationHistoryService.deleteSession(saved!.id);
      expect(SpeakingConversationHistoryService.getSessions().length).toBe(0);
    });
  });

  describe('AI Coach response parsing for corrections & new words', () => {
    it('parses valid JSON schema with corrected, explanation_uz, and new_words', () => {
      const jsonPayload = JSON.stringify({
        reply: 'いいですね！どんな本を読みましたか？',
        corrected: '週末に本を読みました。',
        explanation_uz: 'O‘tgan zamon uchun "yomimashita" shakli ishlatiladi.',
        new_words: [
          { word: '小説', reading: 'しょうせつ', translation_uz: 'roman' },
          { word: '作家', reading: 'さっか', translation_uz: 'yozuvchi' },
        ],
      });

      const parsed = parseCoachResponse(jsonPayload);
      expect(parsed.reply).toBe('いいですね！どんな本を読みましたか？');
      expect(parsed.corrected).toBe('週末に本を読みました。');
      expect(parsed.explanation_uz).toBe('O‘tgan zamon uchun "yomimashita" shakli ishlatiladi.');
      expect(parsed.new_words?.length).toBe(2);
      expect(parsed.new_words?.[0].word).toBe('小説');
      expect(parsed.new_words?.[0].reading).toBe('しょうせつ');
      expect(parsed.new_words?.[0].translation_uz).toBe('roman');
    });

    it('returns empty correction fields when user speech was accurate', () => {
      const jsonPayload = JSON.stringify({
        reply: '素晴らしい！私もその本が好きです。',
        new_words: [],
      });

      const parsed = parseCoachResponse(jsonPayload);
      expect(parsed.reply).toBe('素晴らしい！私もその本が好きです。');
      expect(parsed.corrected).toBeUndefined();
      expect(parsed.explanation_uz).toBeUndefined();
    });
  });
});
