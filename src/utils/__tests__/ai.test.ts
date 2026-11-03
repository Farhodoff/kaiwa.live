import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFlashcardsFromNote, validateSpeechInput, converseWithCoach } from '../ai';
import * as deepseekModule from '../deepseek';
import { callCoachAI } from '../coachAI';
vi.mock('../coachAI', () => ({ callCoachAI: vi.fn(), streamCoachTokens: vi.fn() }));

vi.mock('../deepseek', () => ({
  callDeepSeek: vi.fn(),
}));

describe('kaiwa.live — Feature AI provider routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('generates flashcards via DeepSeek without client keys or fallbacks', async () => {
    vi.mocked(deepseekModule.callDeepSeek).mockResolvedValueOnce(
      JSON.stringify([{ front: 'What is kaiwa.live?', back: 'Continuous improvement' }]),
    );

    const cards = await generateFlashcardsFromNote('Continuous improvement principles', 1);
    expect(cards).toEqual([{ front: 'What is kaiwa.live?', back: 'Continuous improvement' }]);
    expect(deepseekModule.callDeepSeek).toHaveBeenCalledTimes(1);
  });

  it('returns response from Azure in converseWithCoach', async () => {
    vi.mocked(callCoachAI).mockResolvedValueOnce('Azure response from coach');
    const response = await converseWithCoach('Hello coach', []);
    expect(response).toBe('Azure response from coach');
    expect(callCoachAI).toHaveBeenCalledTimes(1);
    expect(deepseekModule.callDeepSeek).not.toHaveBeenCalled();
  });
});

describe('Realtime Speech Recognition Safeguards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('rejects audio duration shorter than 1200ms', () => {
    expect(validateSpeechInput('Hello world', 1000)).toBe(false);
    expect(validateSpeechInput('Hello world', 1199)).toBe(false);
  });

  it('rejects transcripts shorter than 5 chars and under 2 words', () => {
    expect(validateSpeechInput('hi', 1500)).toBe(false);
    expect(validateSpeechInput('a', 2000)).toBe(false);
    expect(validateSpeechInput('   ', 2000)).toBe(false);
  });

  it('accepts audio duration >= 1200ms when transcript length >= 5', () => {
    expect(validateSpeechInput('Hello', 1200)).toBe(true);
    expect(validateSpeechInput('Speaking test', 1500)).toBe(true);
  });

  it('accepts audio duration >= 1200ms when word count >= 2', () => {
    expect(validateSpeechInput('go on', 1200)).toBe(true);
    expect(validateSpeechInput('we talk', 1300)).toBe(true);
  });
});
