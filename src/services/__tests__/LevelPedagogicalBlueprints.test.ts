import { describe, it, expect } from 'vitest';
import { getLevelPedagogicalDirectives } from '../PersonalLearningPlanEngine';
import { JLPT_READING_PASSAGES } from '../../data/jlptReadingData';
import { JLPT_LISTENING_QUESTIONS } from '../../data/jlpt/listening_data';

describe('Level Pedagogical Blueprints & Expanded Content', () => {
  it('provides distinct pedagogical directives for N5, N3, N1, and Kaiwa', () => {
    const n5Directives = getLevelPedagogicalDirectives('ja', 'jlpt', 'N5');
    expect(n5Directives).toContain('JLPT N5 PEDAGOGICAL BLUEPRINT');
    expect(n5Directives).toContain('Hiragana & Katakana');
    expect(n5Directives).toContain('100 base N5 Kanji');

    const n3Directives = getLevelPedagogicalDirectives('ja', 'jlpt', 'N3');
    expect(n3Directives).toContain('JLPT N3 PEDAGOGICAL BLUEPRINT');
    expect(n3Directives).toContain('Shinkanzen Bunpou');
    expect(n3Directives).toContain('600 Kanji');

    const n1Directives = getLevelPedagogicalDirectives('ja', 'jlpt', 'N1');
    expect(n1Directives).toContain('JLPT N1 PEDAGOGICAL BLUEPRINT');
    expect(n1Directives).toContain('2,000+ Kanji');

    const kaiwaDirectives = getLevelPedagogicalDirectives('ja', 'general_ja', 'N4');
    expect(kaiwaDirectives).toContain('JAPANESE KAIWA & DAILY COMMUNICATION');
    expect(kaiwaDirectives).toContain('/speaking-coach?lang=ja');
  });

  it('provides comprehensive directives for IELTS and General English', () => {
    const ieltsDirectives = getLevelPedagogicalDirectives('en', 'ielts', '7.0');
    expect(ieltsDirectives).toContain('IELTS TARGET DIRECTIVES');
    expect(ieltsDirectives).toContain('Speaking: Part 1 fluency');
    expect(ieltsDirectives).toContain('Listening: Focus on keyword prediction');
    expect(ieltsDirectives).not.toContain('/jlpt?tab=writing');

    const generalEnDirectives = getLevelPedagogicalDirectives('en', 'general_en', 'B2');
    expect(generalEnDirectives).toContain('GENERAL ENGLISH DIRECTIVES');
  });

  it('has expanded Dokkai reading passages covering all levels (N5-N1) with multiple passages', () => {
    const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
    levels.forEach((lvl) => {
      const passages = JLPT_READING_PASSAGES.filter((p) => p.level === lvl);
      expect(passages.length).toBeGreaterThanOrEqual(2);
      passages.forEach((p) => {
        expect(p.japaneseContent.length).toBeGreaterThan(30);
        expect(p.uzbekTranslation.length).toBeGreaterThan(20);
        expect(p.questions.length).toBeGreaterThanOrEqual(1);
        p.questions.forEach((q) => {
          expect(q.options.length).toBeGreaterThanOrEqual(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.explanation.length).toBeGreaterThan(10);
        });
      });
    });
  });

  it('has expanded Choukai listening questions covering all levels (N5-N1) with diverse types', () => {
    const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
    levels.forEach((lvl) => {
      const questions = JLPT_LISTENING_QUESTIONS.filter((q) => q.level === lvl);
      expect(questions.length).toBeGreaterThanOrEqual(2);
      questions.forEach((q) => {
        expect(q.script.length).toBeGreaterThan(20);
        expect(q.questionText.length).toBeGreaterThan(10);
        expect(q.options.length).toBeGreaterThanOrEqual(4);
        expect(q.explanationUzbek.length).toBeGreaterThan(15);
      });
    });
  });
});
