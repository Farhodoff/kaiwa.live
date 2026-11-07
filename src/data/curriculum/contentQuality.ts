import type { Lesson, PracticeExercise, TestQuestion } from '../../types/lesson';

export type ContentQualitySeverity = 'error' | 'review';

export interface ContentQualityIssue {
  lessonId: string;
  itemId: string;
  path: string;
  code:
    | 'placeholder_option'
    | 'duplicate_option'
    | 'missing_explanation'
    | 'invalid_correct_answer'
    | 'duplicate_item_id'
    | 'duplicate_prompt';
  severity: ContentQualitySeverity;
  message: string;
}

export interface CurriculumContentQualityReport {
  generatedAt: string;
  levels: Record<
    string,
    { lessons: number; items: number; quarantined: number; issues: ContentQualityIssue[] }
  >;
  totals: { lessons: number; items: number; quarantined: number; issues: number };
  linguisticReviewRequired: true;
}

const PLACEHOLDER_OPTION =
  /^(文脈に合わない表現|文脈と無関係な文|本文にない情報である|文法的に不自然な表現|意味が異なる表現|意味の異なる文|文法の誤った文|反対の内容である|文法形式だけを述べた選択肢)$/;

const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ');

function exerciseIssues(
  lessonId: string,
  exercise: PracticeExercise,
  path: string,
): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const options = exercise.options ?? [];
  const normalized = options.map(normalize);
  if (options.some((option) => PLACEHOLDER_OPTION.test(normalize(option)))) {
    issues.push({
      lessonId,
      itemId: exercise.id,
      path,
      code: 'placeholder_option',
      severity: 'error',
      message: 'Options contain a generated explanatory placeholder.',
    });
  }
  if (new Set(normalized).size !== normalized.length) {
    issues.push({
      lessonId,
      itemId: exercise.id,
      path,
      code: 'duplicate_option',
      severity: 'error',
      message: 'Options must be unique.',
    });
  }
  const correct =
    typeof exercise.correctAnswer === 'number'
      ? options[exercise.correctAnswer]
      : exercise.correctAnswer;
  if (!correct || !options.includes(String(correct))) {
    issues.push({
      lessonId,
      itemId: exercise.id,
      path,
      code: 'invalid_correct_answer',
      severity: 'error',
      message: 'Correct answer must resolve to one option.',
    });
  }
  if (!exercise.explanation?.trim()) {
    issues.push({
      lessonId,
      itemId: exercise.id,
      path,
      code: 'missing_explanation',
      severity: 'review',
      message: 'Explanation is missing.',
    });
  }
  return issues;
}

function testIssues(lessonId: string, question: TestQuestion, path: string): ContentQualityIssue[] {
  const options = question.options ?? [];
  const issues: ContentQualityIssue[] = [];
  if (options.some((option) => PLACEHOLDER_OPTION.test(normalize(option)))) {
    issues.push({
      lessonId,
      itemId: question.id,
      path,
      code: 'placeholder_option',
      severity: 'error',
      message: 'Options contain a generated explanatory placeholder.',
    });
  }
  if (new Set(options.map(normalize)).size !== options.length) {
    issues.push({
      lessonId,
      itemId: question.id,
      path,
      code: 'duplicate_option',
      severity: 'error',
      message: 'Options must be unique.',
    });
  }
  if (
    !Number.isInteger(question.correctAnswerIndex) ||
    question.correctAnswerIndex < 0 ||
    question.correctAnswerIndex >= options.length
  ) {
    issues.push({
      lessonId,
      itemId: question.id,
      path,
      code: 'invalid_correct_answer',
      severity: 'error',
      message: 'Correct answer index is outside options.',
    });
  }
  if (!question.explanation?.trim()) {
    issues.push({
      lessonId,
      itemId: question.id,
      path,
      code: 'missing_explanation',
      severity: 'review',
      message: 'Explanation is missing.',
    });
  }
  return issues;
}

export function auditCurriculumContent(lessons: Lesson[]): CurriculumContentQualityReport {
  const levels: CurriculumContentQualityReport['levels'] = {};
  const ids = new Map<string, ContentQualityIssue>();
  const prompts = new Map<string, ContentQualityIssue>();
  for (const lesson of lessons) {
    const level = lesson.level.toUpperCase();
    const bucket = (levels[level] ??= { lessons: 0, items: 0, quarantined: 0, issues: [] });
    bucket.lessons++;
    for (const [stepIndex, step] of lesson.steps.entries()) {
      const items: Array<PracticeExercise | TestQuestion> =
        step.practiceData?.exercises ?? step.testData?.questions ?? [];
      for (const [itemIndex, item] of items.entries()) {
        bucket.items++;
        const path = `steps[${stepIndex}][${itemIndex}]`;
        const itemIssues =
          'prompt' in item
            ? exerciseIssues(lesson.id, item, path)
            : testIssues(lesson.id, item, path);
        const text = normalize('prompt' in item ? item.prompt : item.question);
        if (ids.has(item.id))
          itemIssues.push({
            ...ids.get(item.id)!,
            lessonId: lesson.id,
            itemId: item.id,
            path,
            code: 'duplicate_item_id',
            severity: 'error',
            message: 'Item ID is duplicated across the curriculum.',
          });
        else
          ids.set(item.id, {
            lessonId: lesson.id,
            itemId: item.id,
            path,
            code: 'duplicate_item_id',
            severity: 'error',
            message: '',
          });
        if (text && prompts.has(text))
          itemIssues.push({
            ...prompts.get(text)!,
            lessonId: lesson.id,
            itemId: item.id,
            path,
            code: 'duplicate_prompt',
            severity: 'review',
            message: 'Question prompt is repeated.',
          });
        else if (text)
          prompts.set(text, {
            lessonId: lesson.id,
            itemId: item.id,
            path,
            code: 'duplicate_prompt',
            severity: 'review',
            message: '',
          });
        if (itemIssues.some((issue) => issue.severity === 'error')) bucket.quarantined++;
        bucket.issues.push(...itemIssues);
      }
    }
  }
  const values = Object.values(levels);
  return {
    generatedAt: new Date().toISOString(),
    levels,
    totals: {
      lessons: values.reduce((sum, level) => sum + level.lessons, 0),
      items: values.reduce((sum, level) => sum + level.items, 0),
      quarantined: values.reduce((sum, level) => sum + level.quarantined, 0),
      issues: values.reduce((sum, level) => sum + level.issues.length, 0),
    },
    linguisticReviewRequired: true,
  };
}

export function quarantineInvalidExercises(lessons: Lesson[]): Lesson[] {
  const report = auditCurriculumContent(lessons);
  const invalidIds = new Set(
    Object.values(report.levels)
      .flatMap((level) => level.issues)
      .filter((issue) => issue.severity === 'error')
      .map((issue) => issue.itemId),
  );
  return lessons.map((lesson) => ({
    ...lesson,
    steps: lesson.steps.map((step) => {
      if (step.practiceData) {
        return {
          ...step,
          practiceData: {
            ...step.practiceData,
            exercises: step.practiceData.exercises.filter(
              (exercise) => !invalidIds.has(exercise.id),
            ),
          },
        };
      }
      if (step.testData) {
        return {
          ...step,
          testData: {
            ...step.testData,
            questions: step.testData.questions.filter((question) => !invalidIds.has(question.id)),
          },
        };
      }
      return step;
    }),
  }));
}
