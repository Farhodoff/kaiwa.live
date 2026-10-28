import { describe, it, expect } from 'vitest';
import { CurriculumLessonResolver } from '../CurriculumLessonResolver';
import {
  ALL_CURRICULUM_LESSONS,
  getCurriculumLessonById,
} from '../../data/curriculum/curriculumLessons';

describe('CurriculumLessonResolver Unit Tests', () => {
  describe('Real curriculum resolution (Phase 19)', () => {
    it('1. resolves every real curriculum lesson to the lesson player', () => {
      for (const lesson of ALL_CURRICULUM_LESSONS) {
        const resolved = CurriculumLessonResolver.resolveLesson(lesson.id, lesson.language);
        expect(resolved.sourceType).toBe('lesson_player');
        expect(resolved.route).toBe(`/lesson/${lesson.id}`);
        expect(resolved.language).toBe(lesson.language);
        expect(resolved.level).toBe(lesson.level);
        expect(resolved.isAvailable).toBe(true);
        expect(resolved.title).toBeTruthy();
      }
    });

    it('2. no duplicate lesson IDs in the real registry', () => {
      const ids = ALL_CURRICULUM_LESSONS.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('2b. resolves retired N5/N4 IDs through canonical lessons', () => {
      const legacyN5 = getCurriculumLessonById('ja-n5-u1-l1');
      const legacyN4 = getCurriculumLessonById('ja-n4-u1-l1');

      expect(legacyN5?.id).toBe('ja-n5-u1-l1');
      expect(legacyN5?.title).toContain('Tanishuv');
      expect(legacyN4?.id).toBe('ja-n4-u1-l1');
      expect(legacyN4?.level).toBe('N4');
      expect(ALL_CURRICULUM_LESSONS).not.toContain(legacyN5);
      expect(ALL_CURRICULUM_LESSONS).not.toContain(legacyN4);
    });

    it('3. representative Japanese N5 and N3 lessons resolve with real titles', () => {
      const n5 = CurriculumLessonResolver.resolveLesson('ja-n5-u1-l1', 'ja');
      expect(n5.route).toBe('/lesson/ja-n5-u1-l1');
      expect(n5.level).toBe('N5');
      expect(n5.isAvailable).toBe(true);
      expect(n5.title).toContain('Tanishuv');

      const n3 = CurriculumLessonResolver.resolveLesson('ja-n3-u1-l1', 'ja');
      expect(n3.route).toBe('/lesson/ja-n3-u1-l1');
      expect(n3.level).toBe('N3');
      expect(n3.isAvailable).toBe(true);
    });

    it('4. provides safe fallback for unregistered IDs without crashing', () => {
      const resolved = CurriculumLessonResolver.resolveLesson('unknown-id-xyz', 'ja');
      expect(resolved.isAvailable).toBe(false);
      expect(resolved.route).toBe('/jlpt');
    });
  });
});
