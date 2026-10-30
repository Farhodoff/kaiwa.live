import { describe, it, expect } from 'vitest';
import { CurriculumPrerequisiteValidatorService } from '../CurriculumPrerequisiteValidatorService';
import { CurriculumService } from '../CurriculumService';

describe('CurriculumPrerequisiteValidatorService', () => {
  it('validates the complete 140-lesson canonical curriculum graph with zero errors', () => {
    const result = CurriculumPrerequisiteValidatorService.validateCurriculumGraph();

    expect(result.isValid).toBe(true);
    expect(result.totalLessons).toBe(140);
    expect(result.issues).toEqual([]);
    expect(result.totalPrerequisiteEdges).toBeGreaterThan(130);

    // Verify all 5 levels are present
    expect(result.levelSummaries.N5).toBeDefined();
    expect(result.levelSummaries.N4).toBeDefined();
    expect(result.levelSummaries.N3).toBeDefined();
    expect(result.levelSummaries.N2).toBeDefined();
    expect(result.levelSummaries.N1).toBeDefined();

    expect(result.levelSummaries.N5.lessonCount).toBe(25);
    expect(result.levelSummaries.N4.lessonCount).toBe(25);
    expect(result.levelSummaries.N3.lessonCount).toBe(30);
    expect(result.levelSummaries.N2.lessonCount).toBe(30);
    expect(result.levelSummaries.N1.lessonCount).toBe(30);
  });

  it('guarantees each level has an entrypoint lesson with no prerequisites', () => {
    const result = CurriculumPrerequisiteValidatorService.validateCurriculumGraph();

    // Entrypoint lesson for each level has 0 prerequisites so placement tests work
    expect(result.levelSummaries.N5.entrypointLessonIds).toContain('ja-minna-l1');
    expect(result.levelSummaries.N4.entrypointLessonIds).toContain('ja-minna-l26');
    expect(result.levelSummaries.N3.entrypointLessonIds).toContain('ja-n3-u1-l1');
    expect(result.levelSummaries.N2.entrypointLessonIds).toContain('ja-n2-u1-l1');
    expect(result.levelSummaries.N1.entrypointLessonIds).toContain('ja-n1-u1-l1');

    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-minna-l1')).toEqual(
      [],
    );
    expect(
      CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-minna-l26'),
    ).toEqual([]);
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n3-u1-l1')).toEqual(
      [],
    );
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n2-u1-l1')).toEqual(
      [],
    );
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n1-u1-l1')).toEqual(
      [],
    );
  });

  it('correctly maps sequential prerequisite chains within levels', () => {
    // N5 L2 requires L1
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-minna-l2')).toEqual(
      ['ja-minna-l1'],
    );
    // N5 L25 requires L24
    expect(
      CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-minna-l25'),
    ).toEqual(['ja-minna-l24']);

    // N4 L27 requires L26
    expect(
      CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-minna-l27'),
    ).toEqual(['ja-minna-l26']);
    // N4 L50 requires L49
    expect(
      CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-minna-l50'),
    ).toEqual(['ja-minna-l49']);

    // N3 Unit 1 L2 requires Unit 1 L1
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n3-u1-l2')).toEqual(
      ['ja-n3-u1-l1'],
    );
    // N3 Unit 2 L1 requires Unit 1 L5
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n3-u2-l1')).toEqual(
      ['ja-n3-u1-l5'],
    );
    // N3 Unit 6 L5 requires Unit 6 L4
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n3-u6-l5')).toEqual(
      ['ja-n3-u6-l4'],
    );

    // N2 Unit 1 L2 requires Unit 1 L1
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n2-u1-l2')).toEqual(
      ['ja-n2-u1-l1'],
    );
    // N2 Unit 6 L5 requires Unit 6 L4
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n2-u6-l5')).toEqual(
      ['ja-n2-u6-l4'],
    );

    // N1 Unit 1 L2 requires Unit 1 L1
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n1-u1-l2')).toEqual(
      ['ja-n1-u1-l1'],
    );
    // N1 Unit 6 L5 requires Unit 6 L4
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n1-u6-l5')).toEqual(
      ['ja-n1-u6-l4'],
    );
  });

  it('resolves legacy and alternate lesson ID formats', () => {
    // minna-2 -> ja-minna-l1
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('minna-2')).toEqual([
      'ja-minna-l1',
    ]);
    // ja-n5-u1-l2 has explicit legacy alias mapping to ja-n5-u1-l1
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('ja-n5-u1-l2')).toEqual(
      ['ja-n5-u1-l1'],
    );
    // n3-u1-l2 -> ja-n3-u1-l2 -> ja-n3-u1-l1
    expect(CurriculumPrerequisiteValidatorService.getPrerequisitesForLesson('n3-u1-l2')).toEqual([
      'ja-n3-u1-l1',
    ]);
  });

  it('integrates seamlessly with CurriculumService.getLessonPrerequisites', () => {
    // Test that CurriculumService now returns valid prerequisites for all canonical lessons
    expect(CurriculumService.getLessonPrerequisites('ja-minna-l2')).toEqual(['ja-minna-l1']);
    expect(CurriculumService.getLessonPrerequisites('ja-minna-l50')).toEqual(['ja-minna-l49']);
    expect(CurriculumService.getLessonPrerequisites('ja-n3-u1-l2')).toEqual(['ja-n3-u1-l1']);
    expect(CurriculumService.getLessonPrerequisites('ja-n2-u2-l1')).toEqual(['ja-n2-u1-l5']);
    expect(CurriculumService.getLessonPrerequisites('ja-n1-u6-l5')).toEqual(['ja-n1-u6-l4']);

    // Also preserves English course prerequisites
    const enPrereqs = CurriculumService.getLessonPrerequisites('en-a1-u1-l2');
    expect(enPrereqs).toEqual(['en-a1-u1-l1']);
  });

  it('detects and flags simulated cycles or orphan prerequisites accurately', () => {
    const testMap = new Map<string, string[]>([
      ['node-a', ['node-b']],
      ['node-b', ['node-a']], // cycle
      ['node-c', ['nonexistent-node']], // orphan
    ]);

    const issues = CurriculumPrerequisiteValidatorService.validateCustomGraph(testMap, [
      'node-a',
      'node-b',
      'node-c',
    ]);
    expect(issues.some((i) => i.type === 'cyclic_dependency')).toBe(true);
    expect(issues.some((i) => i.type === 'orphan_prerequisite')).toBe(true);
  });
});
