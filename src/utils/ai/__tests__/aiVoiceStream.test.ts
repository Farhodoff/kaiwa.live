import { describe, it, expect, vi } from 'vitest';
import { IncrementalReplyExtractor } from '../aiVoiceStream';

describe('IncrementalReplyExtractor', () => {
  it('incrementally extracts Japanese sentences at punctuation marks', () => {
    const emitted: string[] = [];
    const onSentence = vi.fn((sentence: string) => {
      emitted.push(sentence);
    });

    const extractor = new IncrementalReplyExtractor(true, onSentence);

    // Simulate streaming SSE tokens from DeepSeek
    const tokens = [
      '{"language":"ja",',
      '"reply": "',
      '初め',
      'まして！',
      '田中',
      'です。',
      'お名前を',
      '教えて',
      'ください。"',
      ',"romaji":"Hajimemashite! Tanaka desu."',
      ',"correction":{"hasError":false}',
      '}',
    ];

    for (const token of tokens) {
      extractor.feed(token);
    }
    extractor.flush();

    expect(emitted).toEqual(['初めまして！', '田中です。', 'お名前を教えてください。']);
    expect(onSentence).toHaveBeenCalledTimes(3);
  });

  it('incrementally extracts English sentences in real time', () => {
    const emitted: string[] = [];
    const onSentence = vi.fn((sentence: string) => {
      emitted.push(sentence);
    });

    const extractor = new IncrementalReplyExtractor(false, onSentence);

    const tokens = [
      '{"language":"en",',
      '"reply":"Hello there! ',
      'How are you ',
      'doing today? ',
      'I am your coach.',
      '"}',
    ];

    for (const token of tokens) {
      extractor.feed(token);
    }
    extractor.flush();

    expect(emitted).toEqual(['Hello there!', 'How are you doing today?', 'I am your coach.']);
  });

  it('handles non-JSON fallback raw text cleanly', () => {
    const emitted: string[] = [];
    const onSentence = vi.fn((sentence: string) => {
      emitted.push(sentence);
    });

    const extractor = new IncrementalReplyExtractor(true, onSentence);

    const rawTokens = ['はい、分かりました。', '続けて練習しましょう！'];

    for (const token of rawTokens) {
      extractor.feed(token);
    }
    extractor.flush();

    expect(emitted).toEqual(['はい、分かりました。', '続けて練習しましょう！']);
  });

  it('flushes incomplete sentence on stream end', () => {
    const emitted: string[] = [];
    const onSentence = vi.fn((sentence: string) => {
      emitted.push(sentence);
    });

    const extractor = new IncrementalReplyExtractor(true, onSentence);

    // Reply without trailing period
    extractor.feed('{"reply": "はい、行きましょう');
    extractor.flush();

    expect(emitted).toEqual(['はい、行きましょう']);
  });

  it('extracts long Japanese clauses at commas for sub-400ms time-to-first-audio', () => {
    const emitted: string[] = [];
    const onSentence = vi.fn((sentence: string) => {
      emitted.push(sentence);
    });

    const extractor = new IncrementalReplyExtractor(true, onSentence);

    const tokens = [
      '{"reply": "明日の会議の準備についてですが、',
      '資料はもう確認されましたか。"}',
    ];

    for (const token of tokens) {
      extractor.feed(token);
    }
    extractor.flush();

    expect(emitted).toEqual(['明日の会議の準備についてですが、', '資料はもう確認されましたか。']);
  });
});
