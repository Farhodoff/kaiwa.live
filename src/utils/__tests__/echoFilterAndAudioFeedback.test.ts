import { describe, it, expect } from 'vitest';
import { isAcousticEcho } from '../echoFilter';

describe('Acoustic Echo and Speaker Feedback Detection', () => {
  it('detects Japanese exact and partial speaker echo loopbacks', () => {
    const coachUtterance = 'こんにちは！ 鬼先生です。遠慮せずに 日本語で話してください！';

    // Exact repetition picked up by microphone
    expect(
      isAcousticEcho(
        'こんにちは！ 鬼先生です。遠慮せずに 日本語で話してください！',
        coachUtterance,
      ),
    ).toBe(true);

    // Substring echo (e.g. mic opened mid-sentence)
    expect(isAcousticEcho('鬼先生です 遠慮せずに 日本語で話してください', coachUtterance)).toBe(
      true,
    );
    expect(isAcousticEcho('遠慮せずに 日本語で話してください', coachUtterance)).toBe(true);
    expect(isAcousticEcho('こんにちは 鬼先生です', coachUtterance)).toBe(true);
  });

  it('detects English speaker echo loopbacks', () => {
    const coachUtterance = 'Hello! Welcome to your IELTS Speaking test practice. Shall we begin?';

    expect(
      isAcousticEcho('Hello! Welcome to your IELTS Speaking test practice.', coachUtterance),
    ).toBe(true);
    expect(isAcousticEcho('Welcome to your IELTS Speaking test practice', coachUtterance)).toBe(
      true,
    );
    expect(isAcousticEcho('Shall we begin', coachUtterance)).toBe(true);
  });

  it('does NOT filter genuine student answers in Japanese', () => {
    const coachUtterance = 'こんにちは！ 鬼先生です。遠慮せずに 日本語で話してください！';

    // Real user responses
    expect(isAcousticEcho('はじめまして、私はファルホドです。', coachUtterance)).toBe(false);
    expect(isAcousticEcho('日本のIT企業で働きたいです。', coachUtterance)).toBe(false);
    expect(isAcousticEcho('最近、東京に旅行に行きました。', coachUtterance)).toBe(false);
    expect(isAcousticEcho('趣味はプログラミングと読書です。', coachUtterance)).toBe(false);
  });

  it('does NOT filter genuine student answers in English', () => {
    const coachUtterance =
      'Good day! Welcome to your IELTS Speaking test. Tell me about your hometown.';

    expect(isAcousticEcho('I come from Samarkand, which is a historic city.', coachUtterance)).toBe(
      false,
    );
    expect(
      isAcousticEcho('My hometown is known for its beautiful architecture.', coachUtterance),
    ).toBe(false);
    expect(isAcousticEcho('Yes, I am ready to start the test.', coachUtterance)).toBe(false);
  });

  it('handles empty or short strings safely', () => {
    expect(isAcousticEcho('', 'Hello')).toBe(false);
    expect(isAcousticEcho('Hi', 'Hello')).toBe(false);
    expect(isAcousticEcho('a', 'abc')).toBe(false);
  });
});
