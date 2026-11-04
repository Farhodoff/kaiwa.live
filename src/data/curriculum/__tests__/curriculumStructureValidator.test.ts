import { describe, expect, it } from 'vitest';
import n1Lessons from '../levels/n1/japaneseLessons.json';
import n2Lessons from '../levels/n2/japaneseLessons.json';
import n3Lessons from '../levels/n3/japaneseLessons.json';
import n4Lessons from '../levels/n4/minnaLessons.json';
import n5Lessons from '../levels/n5/minnaLessons.json';
import { validateCurriculum, validateCurriculumLesson } from '../validateCurriculumStructure';
import type { Lesson } from '../../../types/lesson';
import metadata from '../curriculumMetadata.json';

const asLessons = (value: unknown) => value as Lesson[];

describe('curriculum structure validator', () => {
  it.each([
    ['N5', asLessons(n5Lessons), 'N5_N4'],
    ['N4', asLessons(n4Lessons), 'N5_N4'],
    ['N3', asLessons(n3Lessons), 'N3_N2_N1'],
    ['N2', asLessons(n2Lessons), 'N3_N2_N1'],
    ['N1', asLessons(n1Lessons), 'N3_N2_N1'],
  ] as const)('validates canonical %s lessons', (_level, lessons, profile) => {
    const result = validateCurriculum(lessons, profile);
    expect(
      result.valid,
      result.issues.map((issue) => `${issue.lessonId}.${issue.path}: ${issue.message}`).join('\n'),
    ).toBe(true);
  });

  it('reports the exact lesson and field for malformed content', () => {
    const lessons = asLessons(n3Lessons);
    const malformed = structuredClone(lessons[0]);
    malformed.steps[1].practiceData!.exercises[0].id =
      malformed.steps[1].practiceData!.exercises[1].id;
    malformed.steps[2].testData!.questions[0].correctAnswerIndex = 99;

    const issues = validateCurriculumLesson(malformed, 'N3_N2_N1');

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lessonId: malformed.id,
          path: 'steps[1].practiceData.exercises[1].id',
          message: 'Duplicate exercise ID in lesson.',
        }),
        expect.objectContaining({
          lessonId: malformed.id,
          path: 'steps[2].testData.questions[0].correctAnswerIndex',
          message: 'Correct answer index is invalid.',
        }),
      ]),
    );
  });

  it('rejects a missing Mondai listening step in the N5/N4 profile', () => {
    const lesson = structuredClone(asLessons(n5Lessons)[0]);
    lesson.steps.pop();

    const issues = validateCurriculumLesson(lesson, 'N5_N4');

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lessonId: lesson.id,
          path: 'steps',
          message: expect.stringContaining('Expected 4 steps'),
        }),
      ]),
    );
  });

  it.each([
    ['N5', n5Lessons],
    ['N4', n4Lessons],
    ['N3', n3Lessons],
    ['N2', n2Lessons],
    ['N1', n1Lessons],
  ] as const)('keeps %s metadata ordered and consistent with loaded lessons', (level, data) => {
    const lessons = asLessons(data);
    const records = metadata.canonicalLessons.filter((lesson) => lesson.level === level);
    expect(records.map(({ id, title }) => ({ id, title }))).toEqual(
      lessons.map(({ id, title }) => ({ id, title })),
    );
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length);
  });

  it('does not reveal the target in the reviewed N4 completion prompts', () => {
    for (const id of ['ja-minna-l27-ex7', 'ja-minna-l42-ex4', 'ja-minna-l46-ex9']) {
      const exercise = asLessons(n4Lessons)
        .flatMap((lesson) => lesson.steps)
        .flatMap((step) => step.practiceData?.exercises ?? [])
        .find((item) => item.id === id);
      expect(exercise).toBeDefined();
      expect(exercise!.prompt).not.toContain(exercise!.options![exercise!.correctAnswer as number]);
    }
  });

  it('does not show the reading in N4 kanji-reading prompts', () => {
    const questions = asLessons(n4Lessons)
      .flatMap((lesson) => lesson.steps)
      .flatMap((step) => step.testData?.questions ?? [])
      .filter((question) => /読(?:\[よ\])?み方/.test(question.question));
    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) {
      const target = question.question.match(/「([^」]+)」/)?.[1];
      expect(target, question.id).toBeTruthy();
      expect(target, question.id).not.toMatch(/（|\[/);
    }
  });

  it('keeps the N1 review before the last unit without calling it graduation', () => {
    expect(n1Lessons[24].title).toMatch(/Review/);
    expect(n1Lessons[24].title).not.toMatch(/Graduation|Certification/i);
    expect(n1Lessons[29].lessonNumber).toBe(30);
  });
});
