import { describe, it, expect } from 'vitest';
import n1Lessons from '../curriculum/levels/n1/japaneseLessons.json';
import n2Lessons from '../curriculum/levels/n2/japaneseLessons.json';
import n3Lessons from '../curriculum/levels/n3/japaneseLessons.json';
import n4Minna from '../curriculum/levels/n4/minnaLessons.json';
import n4MinnaQuiz from '../curriculum/levels/n4/minnaQuizDatabase.json';
import n5Minna from '../curriculum/levels/n5/minnaLessons.json';
import n5MinnaQuiz from '../curriculum/levels/n5/minnaQuizDatabase.json';

import n1Deck from '../decks/jlpt_n1.json';
import n2Deck from '../decks/jlpt_n2.json';
import n3Deck from '../decks/jlpt_n3.json';
import n4Deck from '../decks/jlpt_n4.json';
import n5Deck from '../decks/jlpt_n5.json';

import n1Vocab from '../vocab/jlptVocabN1.json';
import n2Vocab from '../vocab/jlptVocabN2.json';
import n3Vocab from '../vocab/jlptVocabN3.json';
import n4Vocab from '../vocab/jlptVocabN4.json';
import n5Vocab from '../vocab/jlptVocabN5.json';

import { CHOUKAI_AUDIO_LIBRARY } from '../choukaiAudioLibrary';

describe('Data Integrity Schema Verification', () => {
  describe('Curriculum Lessons Integrity', () => {
    const levelDatasets = [
      { name: 'N1 Lessons', data: n1Lessons },
      { name: 'N2 Lessons', data: n2Lessons },
      { name: 'N3 Lessons', data: n3Lessons },
      { name: 'N4 Minna Lessons', data: n4Minna },
      { name: 'N5 Minna Lessons', data: n5Minna },
    ];

    levelDatasets.forEach(({ name, data }) => {
      it(`validates structural schema for ${name}`, () => {
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        const seenIds = new Set<string>();

        data.forEach((lesson: any, index: number) => {
          expect(lesson.id, `Missing id at index ${index} in ${name}`).toBeDefined();
          expect(typeof lesson.id).toBe('string');
          expect(seenIds.has(lesson.id), `Duplicate lesson id: ${lesson.id} in ${name}`).toBe(
            false,
          );
          seenIds.add(lesson.id);

          expect(lesson.title, `Missing title in ${lesson.id}`).toBeDefined();
          expect(Array.isArray(lesson.steps), `steps must be an array in ${lesson.id}`).toBe(true);
          expect(lesson.steps.length, `steps cannot be empty in ${lesson.id}`).toBeGreaterThan(0);

          lesson.steps.forEach((step: any, stepIdx: number) => {
            expect(step.id, `Step id missing in ${lesson.id} step #${stepIdx}`).toBeDefined();
            expect(step.type, `Step type missing in ${lesson.id} step #${stepIdx}`).toBeDefined();
            expect(step.title, `Step title missing in ${lesson.id} step #${stepIdx}`).toBeDefined();
          });
        });
      });
    });

    it('validates Minna Quiz Databases schema', () => {
      [
        { name: 'N4 Quiz', data: n4MinnaQuiz },
        { name: 'N5 Quiz', data: n5MinnaQuiz },
      ].forEach(({ name, data }) => {
        expect(typeof data).toBe('object');
        const keys = Object.keys(data);
        expect(keys.length).toBeGreaterThan(0);

        keys.forEach((lessonKey) => {
          const quizGroup = (data as Record<string, any>)[lessonKey];
          const questions: any[] = Array.isArray(quizGroup)
            ? quizGroup
            : [...(quizGroup.practice || []), ...(quizGroup.test || [])];

          expect(questions.length, `${lessonKey} in ${name} has no quiz questions`).toBeGreaterThan(
            0,
          );

          questions.forEach((q: any, qIdx: number) => {
            expect(q.id, `Quiz item #${qIdx} in ${lessonKey} must have id`).toBeDefined();
            expect(
              q.prompt || q.question,
              `Quiz item #${qIdx} in ${lessonKey} must have prompt`,
            ).toBeDefined();
            expect(Array.isArray(q.options), `Quiz item #${qIdx} options must be array`).toBe(true);
            expect(
              q.options.length,
              `Quiz item #${qIdx} options must not be empty`,
            ).toBeGreaterThan(1);
          });
        });
      });
    });
  });

  describe('JLPT Decks Integrity', () => {
    const decks = [
      { name: 'N1 Deck', data: n1Deck },
      { name: 'N2 Deck', data: n2Deck },
      { name: 'N3 Deck', data: n3Deck },
      { name: 'N4 Deck', data: n4Deck },
      { name: 'N5 Deck', data: n5Deck },
    ];

    decks.forEach(({ name, data }) => {
      it(`validates flashcard integrity for ${name}`, () => {
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        data.forEach((card: any, idx: number) => {
          expect(card.front, `Card at index ${idx} in ${name} missing front`).toBeDefined();
          expect(card.back, `Card at index ${idx} in ${name} missing back`).toBeDefined();
          expect(card.level, `Card at index ${idx} in ${name} missing level`).toBeDefined();
        });
      });
    });
  });

  describe('JLPT Vocabulary Datasets Integrity', () => {
    const vocabList = [
      { name: 'N1 Vocab', data: n1Vocab },
      { name: 'N2 Vocab', data: n2Vocab },
      { name: 'N3 Vocab', data: n3Vocab },
      { name: 'N4 Vocab', data: n4Vocab },
      { name: 'N5 Vocab', data: n5Vocab },
    ];

    vocabList.forEach(({ name, data }) => {
      it(`validates vocabulary integrity for ${name}`, () => {
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        const seenIds = new Set<string>();
        const duplicates: string[] = [];

        data.forEach((item: any, idx: number) => {
          const word = item.word || item.kanji || item.term;
          expect(
            word,
            `Vocab item at index ${idx} in ${name} missing word/kanji/term`,
          ).toBeDefined();
          expect(
            item.reading,
            `Vocab item at index ${idx} in ${name} missing reading`,
          ).toBeDefined();
          const meaning = item.meaningUz || item.meaningEn || item.meaning || item.definition;
          expect(meaning, `Vocab item at index ${idx} in ${name} missing meaning`).toBeDefined();

          // Ensure examples array is non-empty
          expect(
            Array.isArray(item.examples) && item.examples.length > 0,
            `Vocab item "${word}" (${item.id}) in ${name} must have non-empty examples array`,
          ).toBe(true);

          const firstEx = item.examples[0];
          expect(firstEx.ja, `Example for "${word}" in ${name} missing Japanese`).toBeTruthy();
          expect(
            firstEx.uz,
            `Example for "${word}" in ${name} missing Uzbek translation`,
          ).toBeTruthy();

          if (seenIds.has(item.id)) {
            duplicates.push(item.id);
          }
          seenIds.add(item.id);
        });

        expect(duplicates, `Found duplicate IDs in ${name}: ${duplicates.join(', ')}`).toEqual([]);
      });
    });
  });

  describe('Choukai Audio Library Integrity', () => {
    it('verifies audio library tracks have valid paths and non-empty metadata', () => {
      expect(Array.isArray(CHOUKAI_AUDIO_LIBRARY)).toBe(true);
      expect(CHOUKAI_AUDIO_LIBRARY.length).toBeGreaterThan(0);

      CHOUKAI_AUDIO_LIBRARY.forEach((track, idx) => {
        expect(track.id, `Track at #${idx} missing id`).toBeDefined();
        expect(track.name, `Track at #${idx} missing name`).toBeDefined();
        expect(track.url, `Track at #${idx} missing url`).toBeDefined();
        expect(track.level, `Track at #${idx} missing level`).toBeDefined();
      });
    });
  });

  describe('Kanji Database Integrity & Uniqueness', () => {
    it('verifies all kanji items have unique IDs and required properties', async () => {
      const kanjiData = (await import('../kanji/jlptKanjiDatabase.json')).default;
      expect(Array.isArray(kanjiData)).toBe(true);
      expect(kanjiData.length).toBeGreaterThan(0);

      const seenIds = new Set<string>();
      const duplicateIds: string[] = [];

      kanjiData.forEach((item: any, idx: number) => {
        expect(item.id, `Kanji item at #${idx} missing id`).toBeDefined();
        expect(item.kanji, `Kanji item at #${idx} missing kanji character`).toBeDefined();
        expect(item.level, `Kanji item ${item.id} missing level`).toBeDefined();

        if (seenIds.has(item.id)) {
          duplicateIds.push(item.id);
        }
        seenIds.add(item.id);
      });

      expect(duplicateIds, `Found duplicate kanji IDs: ${duplicateIds.join(', ')}`).toEqual([]);
    });
  });
});
