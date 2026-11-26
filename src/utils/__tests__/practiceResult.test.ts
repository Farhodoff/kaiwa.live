import { describe, expect, it } from 'vitest';
import { practiceResult } from '../practiceResult';
import type { MockExamItem } from '../../services/HistoryService';
const item = (score: number, totalQuestions: number, bandScore?: number): MockExamItem => ({
  id: 'test',
  examType: 'jlpt',
  createdAt: '2026-11-24',
  score,
  totalQuestions,
  bandScore,
});
describe('Mixed JLPT history score formats', () => {
  it('keeps raw quiz accuracy separate from mock exam scores', () => {
    expect(practiceResult(item(8, 10, 144))).toEqual({ label: '8/10', basis: 'answers:10' });
    expect(practiceResult(item(120, 25))).toEqual({ label: '120/180', basis: 'mock:180' });
  });
  it('does not invent a denominator for an ambiguous historical score', () => {
    expect(practiceResult(item(15, 25))).toEqual({ label: '15', basis: null });
    expect(practiceResult(item(0, 25))).toEqual({ label: '0', basis: null });
  });
});
