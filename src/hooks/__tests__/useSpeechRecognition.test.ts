import { describe, it, expect } from 'vitest';
import { isSentenceTerminal, isMidSentenceConjunction } from '../useSpeechRecognition';

describe('useSpeechRecognition Adaptive Silence & VAD Detection Tests', () => {
  describe('isSentenceTerminal', () => {
    it('detects Japanese terminal grammar forms', () => {
      expect(isSentenceTerminal('これは本です', 'ja')).toBe(true);
      expect(isSentenceTerminal('日本語を勉強します', 'ja')).toBe(true);
      expect(isSentenceTerminal('昨日は映画を見ました', 'ja')).toBe(true);
      expect(isSentenceTerminal('明日は来ますか', 'ja')).toBe(true);
      expect(isSentenceTerminal('美味しいですね', 'ja')).toBe(true);
      expect(isSentenceTerminal('頑張りましょう！', 'ja')).toBe(true);
      expect(isSentenceTerminal('どうでしょうか', 'ja')).toBe(true);
      expect(isSentenceTerminal('宿題を忘れませんでした', 'ja')).toBe(true);
      expect(isSentenceTerminal('ゆっくり話してください', 'ja')).toBe(true);
      expect(isSentenceTerminal('日本に行きたいです', 'ja')).toBe(true);
      expect(isSentenceTerminal('実はそうなんです', 'ja')).toBe(true);
    });

    it('returns false for incomplete Japanese phrases', () => {
      expect(isSentenceTerminal('私は東京に', 'ja')).toBe(false);
      expect(isSentenceTerminal('行って', 'ja')).toBe(false);
      expect(isSentenceTerminal('だから', 'ja')).toBe(false);
    });

    it('detects English sentence endings', () => {
      expect(isSentenceTerminal('Hello, nice to meet you.', 'en')).toBe(true);
      expect(isSentenceTerminal('Are you ready?', 'en')).toBe(true);
      expect(isSentenceTerminal('Thank you very much, right', 'en')).toBe(true);
    });
  });

  describe('isMidSentenceConjunction', () => {
    it('identifies mid-sentence connective Japanese particles and te-form', () => {
      expect(isMidSentenceConjunction('朝ごはんを食べて', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('友達と', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('図書館に行ってから', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('日本語は難しいけれど', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('雨が降ったら', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('雨が降っても', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('失礼ですが', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('忙しいので', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('ええと', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('あのー', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('えーと', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('まあ', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('うーん', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('なんか', 'ja')).toBe(true);
      expect(isMidSentenceConjunction('えっと', 'ja')).toBe(true);
    });

    it('returns false for completed terminal sentences', () => {
      expect(isMidSentenceConjunction('朝ごはんを食べました。', 'ja')).toBe(false);
      expect(isMidSentenceConjunction('日本語が好きです', 'ja')).toBe(false);
    });

    it('identifies mid-sentence English conjunctions and hesitation fillers', () => {
      expect(isMidSentenceConjunction('I wanted to go, but', 'en')).toBe(true);
      expect(isMidSentenceConjunction('Because', 'en')).toBe(true);
      expect(isMidSentenceConjunction('I was studying and', 'en')).toBe(true);
      expect(isMidSentenceConjunction('Well, you know, um', 'en')).toBe(true);
      expect(isMidSentenceConjunction('I think sort of', 'en')).toBe(true);
    });
  });
});
