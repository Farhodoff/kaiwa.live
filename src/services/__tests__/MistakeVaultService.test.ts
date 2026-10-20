import { describe, it, expect, beforeEach } from 'vitest';
import { MistakeVaultService } from '../MistakeVaultService';

describe('MistakeVaultService', () => {
  const testUserId = 'user-mistake-test';

  beforeEach(() => {
    localStorage.clear();
  });

  it('records a new mistake with default unresolved status', () => {
    const item = MistakeVaultService.recordMistake(
      {
        source: 'quiz',
        level: 'N5',
        category: 'grammar',
        questionText: 'これは何____ですか。',
        options: ['に', 'で', 'の', 'を'],
        userAnswer: 0,
        correctAnswer: 2,
        explanationUzbek: 'Tegishli yuklama "の" bo\'ladi.',
      },
      testUserId,
    );

    expect(item.id).toBeDefined();
    expect(item.status).toBe('unresolved');
    expect(item.reviewCount).toBe(0);

    const list = MistakeVaultService.getMistakes(testUserId);
    expect(list).toHaveLength(1);
    expect(list[0].questionText).toBe('これは何____ですか。');
  });

  it('increments reviewCount on duplicate mistake recording', () => {
    const data = {
      source: 'quiz' as const,
      level: 'N5' as const,
      category: 'grammar' as const,
      questionText: 'これは何____ですか。',
      options: ['に', 'で', 'の', 'を'],
      userAnswer: 0,
      correctAnswer: 2,
      explanationUzbek: 'Tegishli yuklama "の" bo\'ladi.',
    };

    const first = MistakeVaultService.recordMistake(data, testUserId);
    expect(first.reviewCount).toBe(0);

    const second = MistakeVaultService.recordMistake(data, testUserId);
    expect(second.id).toBe(first.id);
    expect(second.reviewCount).toBe(1);

    const list = MistakeVaultService.getMistakes(testUserId);
    expect(list).toHaveLength(1);
  });

  it('records multiple mistakes in batch without duplicate creation', () => {
    const batch = [
      {
        source: 'quiz' as const,
        level: 'N4' as const,
        category: 'kanji' as const,
        questionText: '漢字１',
        options: ['A', 'B'],
        userAnswer: 0,
        correctAnswer: 1,
        explanationUzbek: 'Izoh 1',
      },
      {
        source: 'quiz' as const,
        level: 'N4' as const,
        category: 'kanji' as const,
        questionText: '漢字２',
        options: ['A', 'B'],
        userAnswer: 0,
        correctAnswer: 1,
        explanationUzbek: 'Izoh 2',
      },
    ];

    MistakeVaultService.recordBatch(batch, testUserId);
    const list = MistakeVaultService.getMistakes(testUserId);
    expect(list).toHaveLength(2);

    const stats = MistakeVaultService.getStats(testUserId);
    expect(stats.total).toBe(2);
    expect(stats.unresolved).toBe(2);
    expect(stats.mastered).toBe(0);
  });

  it('marks a mistake as mastered and computes updated stats', () => {
    const item = MistakeVaultService.recordMistake(
      {
        source: 'mock_exam',
        level: 'N3',
        category: 'reading',
        questionText: '読解問題１',
        options: ['1', '2', '3', '4'],
        userAnswer: 0,
        correctAnswer: 3,
        explanationUzbek: "To'g'ri javob 4",
      },
      testUserId,
    );

    const success = MistakeVaultService.markAsMastered(item.id, testUserId);
    expect(success).toBe(true);

    const stats = MistakeVaultService.getStats(testUserId);
    expect(stats.mastered).toBe(1);
    expect(stats.unresolved).toBe(0);
  });

  it('deletes specific mistake and clears all mastered', () => {
    const m1 = MistakeVaultService.recordMistake(
      {
        source: 'quiz',
        level: 'N5',
        category: 'vocab',
        questionText: 'Q1',
        options: ['A', 'B'],
        userAnswer: 0,
        correctAnswer: 1,
        explanationUzbek: 'Ex1',
      },
      testUserId,
    );

    const m2 = MistakeVaultService.recordMistake(
      {
        source: 'quiz',
        level: 'N5',
        category: 'vocab',
        questionText: 'Q2',
        options: ['A', 'B'],
        userAnswer: 0,
        correctAnswer: 1,
        explanationUzbek: 'Ex2',
      },
      testUserId,
    );

    MistakeVaultService.markAsMastered(m1.id, testUserId);

    // Delete single
    MistakeVaultService.deleteMistake(m2.id, testUserId);
    let list = MistakeVaultService.getMistakes(testUserId);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(m1.id);

    // Clear mastered
    MistakeVaultService.clearMastered(testUserId);
    list = MistakeVaultService.getMistakes(testUserId);
    expect(list).toHaveLength(0);
  });

  it('infers broken grammar rules and generates per-option distractor analysis', () => {
    const item = MistakeVaultService.recordMistake(
      {
        source: 'quiz',
        level: 'N5',
        category: 'grammar',
        questionText: 'ここでタバコを吸っては____。',
        options: ['いいです', 'いけません', 'かまいません', '大丈夫です'],
        userAnswer: 0,
        correctAnswer: 1,
        explanationUzbek: '〜てはいけない taqiqlash qoidasi: chekish taqiqlangan.',
      },
      testUserId,
    );

    const rule = MistakeVaultService.inferRuleBroken(item);
    expect(rule).toContain('〜てはいけない');

    const distractors = MistakeVaultService.getDistractorAnalysis(item);
    expect(distractors).toHaveLength(4);

    const correctDistractor = distractors.find((d) => d.isCorrect);
    expect(correctDistractor).toBeDefined();
    expect(correctDistractor?.option).toBe('いけません');

    const wrongDistractor = distractors.find((d) => d.option === 'いいです');
    expect(wrongDistractor?.isCorrect).toBe(false);
    expect(wrongDistractor?.reasonUzbek).toContain('Siz tanlagan chalg‘ituvchi variant');

    const drill = MistakeVaultService.generateRemedialDrill(item);
    expect(drill.id).toContain('drill_');
    expect(drill.ruleBroken).toContain('〜てはいけない');
    expect(drill.distractorAnalysis).toHaveLength(4);
  });
});
