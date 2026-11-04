import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractSpeechAudioText, parseMicroErrors } from '../../utils/ai';
import { ErrorVaultService } from '../ErrorVaultService';
import { MasteryEngine } from '../MasteryEngine';
import { playConversationChime } from '../../utils/audioChime';

describe('Speaking Coach E2E Hands-Free & Multi-Turn Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. cleans TTS text properly across Japanese and English without visual notes or romaji', () => {
    const jaSample = 'こんにちは！[Xush kelibsiz] (Konnichiwa) 今日はどんな練習をしますか？';
    const jaClean = extractSpeechAudioText(jaSample);
    expect(jaClean).toBe('こんにちは！ 今日はどんな練習をしますか？');
    expect(jaClean).not.toContain('Xush kelibsiz');
    expect(jaClean).not.toContain('Konnichiwa');

    const enSample = 'Hello! [Salom] Let us practice IELTS Speaking Part 2.';
    const enClean = extractSpeechAudioText(enSample);
    expect(enClean).toBe('Hello! Let us practice IELTS Speaking Part 2.');
    expect(enClean).not.toContain('Salom');
  });

  it('2. parses real-time micro-errors into categorized tags and logs evidence to ErrorVault & MasteryEngine', async () => {
    const aiResponseText = `
        Good effort! [GRAMMAR_ERR: I go to cinema -> I went to the cinema | Use past simple tense for completed past events]
        `;

    const errors = parseMicroErrors(aiResponseText);
    expect(errors.length).toBe(1);
    expect(errors[0].originalText).toBe('I go to cinema');
    expect(errors[0].correction).toBe('I went to the cinema');
    expect(errors[0].type).toBe('grammar');

    // Log evidence to ErrorVault
    ErrorVaultService.logErrors(
      errors.map((e) => ({
        verbatim: e.originalText,
        correction: e.correction,
        category: e.type,
        explanation: e.explanation,
        language: 'en',
      })),
    );

    const loggedErrors = ErrorVaultService.getErrors();
    expect(loggedErrors.length).toBeGreaterThanOrEqual(1);
    expect(loggedErrors[0].verbatim).toBe('I go to cinema');

    // Record evidence into MasteryEngine
    MasteryEngine.recordEvidence('test_user_handsfree', 'en', {
      id: `ev_spk_${Date.now()}`,
      userId: 'test_user_handsfree',
      language: 'en',
      skill: 'speaking',
      timestamp: new Date().toISOString(),
      score: 90,
      activityType: 'speaking',
      details: 'Hands-free multi-turn speaking turn',
    });

    const progress = MasteryEngine.getSkillMastery('test_user_handsfree', 'en', 'speaking');
    expect(progress.score).toBeGreaterThan(0);
    expect(progress.status).not.toBe('not_started');
  });

  it('3. verifies conversational audio cues do not block runtime execution', () => {
    expect(() => playConversationChime('listen_start')).not.toThrow();
    expect(() => playConversationChime('commit')).not.toThrow();
    expect(() => playConversationChime('barge_in')).not.toThrow();
  });
});
