import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiEvaluationService } from '../aiEvaluationService';
import * as aiCore from '../../utils/ai/aiCore';

vi.mock('../../utils/ai/aiCore', () => ({
  callSelectedAIProvider: vi.fn(),
}));

describe('aiEvaluationService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. evaluateWriting should parse structured JSON evaluation response correctly', async () => {
    const mockResponse = JSON.stringify({
      score: 7.5,
      feedback: "Insho yaxshi yozilgan, akademik so'zlar to'g'ri qo'llanilgan.",
      criteriaScores: {
        vocabulary: 8.0,
        grammar: 7.0,
        taskAchievement: 7.5,
        coherence: 7.5,
      },
    });

    vi.mocked(aiCore.callSelectedAIProvider).mockResolvedValueOnce(mockResponse);

    const result = await aiEvaluationService.evaluateWriting(
      'IELTS',
      'Some people believe university education should be free.',
      'In my opinion, higher education brings immense value to society...',
    );

    expect(result.score).toBe(7.5);
    expect(result.feedback).toContain('akademik');
    expect(result.criteriaScores?.vocabulary).toBe(8.0);
    expect(aiCore.callSelectedAIProvider).toHaveBeenCalledTimes(1);
  });

  it('2. evaluateWriting should handle markdown wrapped json safely', async () => {
    const mockResponse =
      '```json\n{"score": 6.5, "feedback": "Grammatikaga e\'tibor bering."}\n```';
    vi.mocked(aiCore.callSelectedAIProvider).mockResolvedValueOnce(mockResponse);

    const result = await aiEvaluationService.evaluateWriting(
      'IELTS',
      'Describe a chart',
      'The chart illustrates the consumption of energy...',
    );

    expect(result.score).toBe(6.5);
    expect(result.feedback).toBe("Grammatikaga e'tibor bering.");
  });

  it('3. evaluateSpeakingTranscript should evaluate spoken transcript correctly', async () => {
    const mockResponse = JSON.stringify({
      score: 7.0,
      feedback: 'Talaffuz va ravonlik yaxshi darajada.',
      criteriaScores: {
        vocabulary: 7.0,
        grammar: 6.5,
        fluency: 7.5,
        pronunciation: 7.0,
      },
    });

    vi.mocked(aiCore.callSelectedAIProvider).mockResolvedValueOnce(mockResponse);

    const result = await aiEvaluationService.evaluateSpeakingTranscript(
      'IELTS',
      'Tell me about your hometown.',
      'Well, I come from Samarkand, which is a historic city...',
    );

    expect(result.score).toBe(7.0);
    expect(result.criteriaScores?.fluency).toBe(7.5);
  });

  it('4. should gracefully return fallback if AI returns unparsable text', async () => {
    vi.mocked(aiCore.callSelectedAIProvider).mockResolvedValueOnce(
      'Plaint text without json format.',
    );

    const result = await aiEvaluationService.evaluateWriting(
      'JLPT',
      'Writing prompt',
      'User essay',
    );

    expect(result.score).toBe(0);
    expect(result.feedback).toBe('Plaint text without json format.');
  });
});
