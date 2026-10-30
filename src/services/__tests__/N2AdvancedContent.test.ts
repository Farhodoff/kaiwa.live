import { describe, it, expect } from 'vitest';
import {
  N2_AUTHENTIC_READING_PASSAGES,
  N2_KEIGO_MATRIX,
  N2_COLLOCATIONS,
  N2_LISTENING_SCENARIOS,
} from '../../data/n2AdvancedContent';

describe('N2 Advanced Pedagogical Content Suite', () => {
  it('1. Authentic reading passages include business email, announcement and newspaper column', () => {
    expect(N2_AUTHENTIC_READING_PASSAGES.length).toBeGreaterThanOrEqual(3);

    const genres = N2_AUTHENTIC_READING_PASSAGES.map((p) => p.genre);
    expect(genres).toContain('business-email');
    expect(genres).toContain('official-announcement');
    expect(genres).toContain('newspaper-column');

    for (const passage of N2_AUTHENTIC_READING_PASSAGES) {
      expect(passage.japaneseContent.length).toBeGreaterThan(100);
      expect(passage.uzbekTranslation.length).toBeGreaterThan(50);
      expect(passage.vocabularyHighlights.length).toBeGreaterThanOrEqual(3);
      expect(passage.questions.length).toBeGreaterThanOrEqual(2);
      for (const q of passage.questions) {
        expect(q.options.length).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
        expect(q.explanation.length).toBeGreaterThan(10);
      }
    }
  });

  it('2. Keigo matrix covers standard N2 business verbs with sonkeigo, kenjougo, teineigo and scenarios', () => {
    expect(N2_KEIGO_MATRIX.length).toBeGreaterThanOrEqual(6);

    for (const item of N2_KEIGO_MATRIX) {
      expect(item.verb).toBeDefined();
      expect(item.sonkeigo).toBeDefined();
      expect(item.kenjougo).toBeDefined();
      expect(item.teineigo).toBeDefined();
      expect(item.businessScenarioUz).toBeDefined();
      expect(item.exampleSentence.length).toBeGreaterThan(10);
    }
  });

  it('3. Collocations provide authentic contextual usage and examples', () => {
    expect(N2_COLLOCATIONS.length).toBeGreaterThanOrEqual(6);

    for (const col of N2_COLLOCATIONS) {
      expect(col.phrase).toBeDefined();
      expect(col.reading).toBeDefined();
      expect(col.meaningUz).toBeDefined();
      expect(col.contextUz).toBeDefined();
      expect(col.exampleSentence.length).toBeGreaterThan(10);
    }
  });

  it('4. Real-speed listening scenarios provide multi-speaker dialogues, intentions, and inference questions', () => {
    expect(N2_LISTENING_SCENARIOS.length).toBeGreaterThanOrEqual(2);

    for (const scenario of N2_LISTENING_SCENARIOS) {
      expect(scenario.situation).toBeDefined();
      expect(scenario.speakers).toBeDefined();
      expect(scenario.japaneseScript.length).toBeGreaterThan(50);
      expect(scenario.uzbekTranslation.length).toBeGreaterThan(50);
      expect(scenario.question).toBeDefined();
      expect(scenario.options.length).toBe(4);
      expect(scenario.correctIndex).toBeGreaterThanOrEqual(0);
      expect(scenario.inferenceExplanation.length).toBeGreaterThan(10);
    }
  });
});
