import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateSpeechInput,
  generateFlashcardsWithAI,
  analyzeSpeech,
  converseWithCoach,
} from '../ai';
import * as deepseekModule from '../deepseek';
import { callCoachAI } from '../coachAI';
vi.mock('../coachAI', () => ({ callCoachAI: vi.fn(), streamCoachTokens: vi.fn() }));

vi.mock('../deepseek', () => ({
  callDeepSeek: vi.fn(),
}));

describe('EMPIRICAL CHALLENGE 1: Speech Safeguards Boundary & Stress Testing', () => {
  it('discards duration strictly below 1200ms regardless of text length', () => {
    expect(validateSpeechInput('This is a very long sentence with many words', 0)).toBe(false);
    expect(validateSpeechInput('This is a very long sentence with many words', 1199)).toBe(false);
    expect(validateSpeechInput('Super long text test', -100)).toBe(false);
  });

  it('discards transcripts with length < 5 and word count < 2 even if duration >= 1200ms', () => {
    expect(validateSpeechInput('', 1500)).toBe(false);
    expect(validateSpeechInput('   ', 1500)).toBe(false);
    expect(validateSpeechInput('a', 2000)).toBe(false);
    expect(validateSpeechInput('hi', 2000)).toBe(false);
    expect(validateSpeechInput(' hey ', 2000)).toBe(false);
  });

  it('accepts valid duration (>= 1200ms) with character length >= 5', () => {
    expect(validateSpeechInput('Hello', 1200)).toBe(true);
    expect(validateSpeechInput('12345', 1200)).toBe(true);
    expect(validateSpeechInput(' Uzbek ', 1500)).toBe(true);
  });

  it('accepts valid duration (>= 1200ms) with word count >= 2 (even if length < 5)', () => {
    expect(validateSpeechInput('go on', 1200)).toBe(true); // length 5, words 2
    expect(validateSpeechInput('a b', 1200)).toBe(true); // length 3, words 2
    expect(validateSpeechInput('  x  y  ', 1300)).toBe(true); // length 3 trimmed, words 2
  });
});

describe('EMPIRICAL CHALLENGE 2: DeepSeek AI Execution & Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('generates flashcards via DeepSeek successfully', async () => {
    vi.mocked(deepseekModule.callDeepSeek).mockResolvedValueOnce(
      JSON.stringify([{ front: 'Empirical Front', back: 'Empirical Back' }]),
    );

    const cards = await generateFlashcardsWithAI('Math', 1);
    expect(cards).toEqual([{ front: 'Empirical Front', back: 'Empirical Back' }]);
  });

  it('throws parsed error when Azure API errors in analyzeSpeech', async () => {
    vi.mocked(callCoachAI).mockRejectedValueOnce(new Error('Azure 500 Internal Server Error'));
    await expect(analyzeSpeech('Empirical speech test input', 'English')).rejects.toThrow();
  });

  it('returns coach conversation response via Azure', async () => {
    vi.mocked(callCoachAI).mockResolvedValueOnce('Azure coach response');
    const reply = await converseWithCoach('Hello coach', []);
    expect(reply).toBe('Azure coach response');
  });
});
