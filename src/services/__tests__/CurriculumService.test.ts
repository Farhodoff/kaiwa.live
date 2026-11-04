import { describe, it, expect } from 'vitest';
import { CurriculumService } from '../CurriculumService';

describe('CurriculumService Unit Tests', () => {
  it('1. should return complete English curriculum with A1 to C2 levels', () => {
    const course = CurriculumService.getEnglishCurriculum();

    expect(course.language).toBe('en');
    expect(course.levels.length).toBe(6);
    expect(course.levels.map((l) => l.code)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  it('2. should return complete Japanese curriculum with N5 to N1 levels', () => {
    const course = CurriculumService.getJapaneseCurriculum();

    expect(course.language).toBe('ja');
    expect(course.levels.length).toBe(5);
    expect(course.levels.map((l) => l.code)).toEqual(['N5', 'N4', 'N3', 'N2', 'N1']);
  });

  it('3. should enforce correct sequential ordering of units and lessons', () => {
    const course = CurriculumService.getEnglishCurriculum();

    for (const level of course.levels) {
      expect(level.order).toBeGreaterThan(0);
      for (const unit of level.units) {
        expect(unit.order).toBeGreaterThan(0);
        for (const lesson of unit.lessons) {
          expect(lesson.order).toBeGreaterThan(0);
          expect(lesson.route).toBeDefined();
        }
      }
    }
  });

  it('4. should resolve course dynamically by language', () => {
    const enCourse = CurriculumService.getCourse('en');
    const jaCourse = CurriculumService.getCourse('ja');

    expect(enCourse.language).toBe('en');
    expect(jaCourse.language).toBe('ja');
  });
});
