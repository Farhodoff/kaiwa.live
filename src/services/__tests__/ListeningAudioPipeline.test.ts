import { describe, it, expect } from 'vitest';
import { resolveAudioUrl, safeEncodeAudioPath } from '../../utils/audioUrl';
import { ListeningAudioSyncService } from '../ListeningAudioSyncService';
import { DialogueLine } from '../../data/jlpt/listening_data';

describe('Choukai Audio & Listening Pipeline', () => {
  describe('Audio URL Sanitization & Encoding', () => {
    it('safely encodes audio paths with spaces without double encoding', () => {
      const rawPath = '/audio/choukai/n3/01 Track 1.mp3';
      const encoded = safeEncodeAudioPath(rawPath);
      expect(encoded).toBe('/audio/choukai/n3/01%20Track%201.mp3');

      // Idempotent test: encoding already encoded path does not produce %2520
      const reEncoded = safeEncodeAudioPath(encoded);
      expect(reEncoded).toBe('/audio/choukai/n3/01%20Track%201.mp3');
    });

    it('handles relative paths and prepends slash if needed', () => {
      expect(resolveAudioUrl('audio/choukai/n4/sample.mp3')).toBe('/audio/choukai/n4/sample.mp3');
      expect(resolveAudioUrl('/audio/choukai/n4/sample.mp3')).toBe('/audio/choukai/n4/sample.mp3');
    });

    it('preserves external CDN and HTTP/HTTPS URLs', () => {
      const cdnUrl = 'https://actions.google.com/sounds/v1/weather/rain.ogg';
      expect(resolveAudioUrl(cdnUrl)).toBe(cdnUrl);
      const httpUrl = 'http://example.com/audio/sample.mp3';
      expect(resolveAudioUrl(httpUrl)).toBe(httpUrl);
    });

    it('returns empty string for missing or whitespace-only inputs', () => {
      expect(resolveAudioUrl('')).toBe('');
      expect(resolveAudioUrl('   ')).toBe('');
      expect(resolveAudioUrl(undefined as any)).toBe('');
    });
  });

  describe('Multi-Speaker Script Parsing & Role Detection', () => {
    it('correctly parses complex Japanese dialogue with various speaker roles', () => {
      const script = `
女の人：明日の会議の準備はどうなっていますか。
課長：資料はもう印刷したよ。
男の学生：先生、質問があります。
チーフ：プロジェクトの進捗を確認しましょう。
専門家：この現象は非常に珍しいです。
医師：お薬は食後に飲んでください。
`;
      const dialogue = ListeningAudioSyncService.parseScriptToDialogue(script);
      expect(dialogue.length).toBe(6);

      // Check speaker roles and assigned genders
      expect(dialogue[0].speaker).toBe('女の人');
      expect(dialogue[0].gender).toBe('female');
      expect(dialogue[0].japanese).toBe('明日の会議の準備はどうなっていますか。');

      expect(dialogue[1].speaker).toBe('課長');
      expect(dialogue[1].gender).toBe('male');
      expect(dialogue[1].japanese).toBe('資料はもう印刷したよ。');

      expect(dialogue[2].speaker).toBe('男の学生');
      expect(dialogue[2].gender).toBe('male');
      expect(dialogue[2].japanese).toBe('先生、質問があります。');

      expect(dialogue[3].speaker).toBe('チーフ');
      expect(dialogue[3].gender).toBe('male');
      expect(dialogue[3].japanese).toBe('プロジェクトの進捗を確認しましょう。');

      expect(dialogue[4].speaker).toBe('専門家');
      expect(dialogue[4].gender).toBe('male');
      expect(dialogue[4].japanese).toBe('この現象は非常に珍しいです。');

      expect(dialogue[5].speaker).toBe('医師');
      expect(dialogue[5].gender).toBe('male');
      expect(dialogue[5].japanese).toBe('お薬は食後に飲んでください。');
    });

    it('falls back to narrator when no speaker colon is present', () => {
      const script = '次の問題を聞いて、正しい答えを選んでください。';
      const dialogue = ListeningAudioSyncService.parseScriptToDialogue(script);
      expect(dialogue.length).toBe(1);
      expect(dialogue[0].speaker).toBe('ナレーション');
      expect(dialogue[0].gender).toBe('neutral');
      expect(dialogue[0].japanese).toBe(script);
    });
  });

  describe('Audio-Lyric Timestamp Synchronization', () => {
    it('calculates proportional time segments based on character lengths', () => {
      const lines: DialogueLine[] = [
        { id: '1', speaker: '女', japanese: 'こんにちは。', gender: 'female' },
        {
          id: '2',
          speaker: '男',
          japanese: 'こんにちは、元気ですか。今日はいい天気ですね。',
          gender: 'male',
        },
      ];

      const duration = 10; // 10 seconds total audio duration
      const timedLines = ListeningAudioSyncService.calculateLineTimeSegments(lines, duration);

      expect(timedLines.length).toBe(2);
      expect(timedLines[0].start).toBeGreaterThanOrEqual(0);
      expect(timedLines[0].end).toBeLessThan(timedLines[1].end);
      expect(timedLines[1].end).toBeLessThanOrEqual(10);
    });

    it('identifies the active line index at different playback timestamps', () => {
      const timedLines: DialogueLine[] = [
        { id: '1', speaker: '女', japanese: 'Line 1', gender: 'female', startTime: 0, endTime: 3 },
        { id: '2', speaker: '男', japanese: 'Line 2', gender: 'male', startTime: 3, endTime: 7 },
        { id: '3', speaker: '女', japanese: 'Line 3', gender: 'female', startTime: 7, endTime: 10 },
      ];

      expect(ListeningAudioSyncService.getActiveLineIndex(timedLines, 1.5, 10)).toBe(0);
      expect(ListeningAudioSyncService.getActiveLineIndex(timedLines, 4.0, 10)).toBe(1);
      expect(ListeningAudioSyncService.getActiveLineIndex(timedLines, 8.5, 10)).toBe(2);
      expect(ListeningAudioSyncService.getActiveLineIndex(timedLines, 12.0, 10)).toBe(2);
    });

    it('returns null when lines are empty or invalid', () => {
      expect(ListeningAudioSyncService.getActiveLineIndex([], 5, 10)).toBeNull();
    });
  });
});
