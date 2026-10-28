import type { Lesson, LessonStep, PracticeExercise, TestQuestion } from '../../types/lesson';

export type CurriculumValidationProfile = 'N5_N4' | 'N3_N2_N1';

export interface CurriculumValidationIssue {
  lessonId: string;
  path: string;
  message: string;
}

export interface CurriculumValidationResult {
  valid: boolean;
  issues: CurriculumValidationIssue[];
}

interface CurriculumProfileConfig {
  expectedLessonCount?: number;
  expectedStepTypes: readonly string[];
  minimumPracticeExercises: number;
  minimumTestQuestions: number;
  requiresListeningStep: boolean;
}

const PROFILE_CONFIG: Record<CurriculumValidationProfile, CurriculumProfileConfig> = {
  N5_N4: {
    expectedStepTypes: ['learn', 'practice', 'test', 'test'],
    minimumPracticeExercises: 2,
    minimumTestQuestions: 4,
    requiresListeningStep: true,
  },
  N3_N2_N1: {
    expectedStepTypes: ['learn', 'practice', 'test'],
    minimumPracticeExercises: 2,
    minimumTestQuestions: 4,
    requiresListeningStep: false,
  },
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isFiniteNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

function addIssue(
  issues: CurriculumValidationIssue[],
  lessonId: string,
  path: string,
  message: string,
): void {
  issues.push({ lessonId, path, message });
}

function validatePracticeExercise(
  lessonId: string,
  stepIndex: number,
  exercise: PracticeExercise,
  exerciseIndex: number,
  issues: CurriculumValidationIssue[],
): void {
  const path = `steps[${stepIndex}].practiceData.exercises[${exerciseIndex}]`;

  if (!isNonEmptyString(exercise.id)) {
    addIssue(issues, lessonId, `${path}.id`, 'Exercise ID is required.');
  }
  if (!isNonEmptyString(exercise.prompt)) {
    addIssue(issues, lessonId, `${path}.prompt`, 'Exercise prompt is required.');
  }
  if (
    !['multiple-choice', 'true-false', 'fill-in-blank', 'sentence-order'].includes(exercise.type)
  ) {
    addIssue(issues, lessonId, `${path}.type`, `Unsupported exercise type "${exercise.type}".`);
  }
  if (exercise.correctAnswer === undefined || exercise.correctAnswer === null) {
    addIssue(issues, `${lessonId}`, `${path}.correctAnswer`, 'Correct answer is required.');
  }
  if (exercise.type === 'multiple-choice') {
    if (!Array.isArray(exercise.options) || exercise.options.length < 2) {
      addIssue(
        issues,
        lessonId,
        `${path}.options`,
        'Multiple-choice exercises need at least 2 options.',
      );
    } else if (
      typeof exercise.correctAnswer === 'number' &&
      (exercise.correctAnswer < 0 || exercise.correctAnswer >= exercise.options.length)
    ) {
      addIssue(
        issues,
        lessonId,
        `${path}.correctAnswer`,
        'Correct answer index is outside the options.',
      );
    }
  }
  if (exercise.type === 'sentence-order') {
    if (!Array.isArray(exercise.fragments) || exercise.fragments.length < 2) {
      addIssue(
        issues,
        lessonId,
        `${path}.fragments`,
        'Sentence-order exercises need at least 2 fragments.',
      );
    }
    if (!Array.isArray(exercise.correctOrder) || exercise.correctOrder.length < 2) {
      addIssue(
        issues,
        lessonId,
        `${path}.correctOrder`,
        'Sentence-order exercises need a valid order.',
      );
    }
  }
}

function validateTestQuestion(
  lessonId: string,
  stepIndex: number,
  question: TestQuestion,
  questionIndex: number,
  issues: CurriculumValidationIssue[],
): void {
  const path = `steps[${stepIndex}].testData.questions[${questionIndex}]`;

  if (!isNonEmptyString(question.id)) {
    addIssue(issues, lessonId, `${path}.id`, 'Question ID is required.');
  }
  if (!isNonEmptyString(question.question)) {
    addIssue(issues, lessonId, `${path}.question`, 'Question text is required.');
  }
  if (!Array.isArray(question.options) || question.options.length < 2) {
    addIssue(issues, lessonId, `${path}.options`, 'Test questions need at least 2 options.');
  } else if (
    !Number.isInteger(question.correctAnswerIndex) ||
    question.correctAnswerIndex < 0 ||
    question.correctAnswerIndex >= question.options.length
  ) {
    addIssue(issues, lessonId, `${path}.correctAnswerIndex`, 'Correct answer index is invalid.');
  }
  if (!isNonEmptyString(question.explanation)) {
    addIssue(issues, lessonId, `${path}.explanation`, 'Question explanation is required.');
  }
}

function validateStep(
  lesson: Lesson,
  step: LessonStep,
  stepIndex: number,
  profile: CurriculumProfileConfig,
  issues: CurriculumValidationIssue[],
): void {
  const path = `steps[${stepIndex}]`;

  if (!isNonEmptyString(step.id)) {
    addIssue(issues, lesson.id, `${path}.id`, 'Step ID is required.');
  }
  if (!isNonEmptyString(step.title)) {
    addIssue(issues, lesson.id, `${path}.title`, 'Step title is required.');
  }
  if (!isFiniteNonNegativeNumber(step.estimatedMinutes)) {
    addIssue(
      issues,
      lesson.id,
      `${path}.estimatedMinutes`,
      'Step duration must be a non-negative number.',
    );
  }

  if (step.type === 'learn') {
    const data = step.learnData;
    if (!data) {
      addIssue(issues, lesson.id, `${path}.learnData`, 'Learn data is required.');
      return;
    }
    if (!isNonEmptyString(data.title)) {
      addIssue(issues, lesson.id, `${path}.learnData.title`, 'Learn title is required.');
    }
    if (!isNonEmptyString(data.explanation)) {
      addIssue(
        issues,
        lesson.id,
        `${path}.learnData.explanation`,
        'Learn explanation is required.',
      );
    }
    if (!Array.isArray(data.grammarRules) || data.grammarRules.length === 0) {
      addIssue(
        issues,
        lesson.id,
        `${path}.learnData.grammarRules`,
        'At least one grammar rule is required.',
      );
    }
    if (!Array.isArray(data.vocabulary) || data.vocabulary.length === 0) {
      addIssue(
        issues,
        lesson.id,
        `${path}.learnData.vocabulary`,
        'At least one vocabulary item is required.',
      );
    }
    for (const [index, rule] of (data.grammarRules ?? []).entries()) {
      if (!isNonEmptyString(rule.pattern) || !isNonEmptyString(rule.meaning)) {
        addIssue(
          issues,
          lesson.id,
          `${path}.learnData.grammarRules[${index}]`,
          'Grammar pattern and meaning are required.',
        );
      }
      if (!Array.isArray(rule.examples) || rule.examples.length === 0) {
        addIssue(
          issues,
          lesson.id,
          `${path}.learnData.grammarRules[${index}].examples`,
          'Grammar rule needs at least one example.',
        );
      }
    }
    for (const [index, item] of (data.vocabulary ?? []).entries()) {
      if (!isNonEmptyString(item.term) || !isNonEmptyString(item.meaning)) {
        addIssue(
          issues,
          lesson.id,
          `${path}.learnData.vocabulary[${index}]`,
          'Vocabulary term and meaning are required.',
        );
      }
    }
  }

  if (step.type === 'practice') {
    const data = step.practiceData;
    if (!data) {
      addIssue(issues, lesson.id, `${path}.practiceData`, 'Practice data is required.');
      return;
    }
    if (!isNonEmptyString(data.instructions)) {
      addIssue(
        issues,
        lesson.id,
        `${path}.practiceData.instructions`,
        'Practice instructions are required.',
      );
    }
    if (
      !Array.isArray(data.exercises) ||
      data.exercises.length < profile.minimumPracticeExercises
    ) {
      addIssue(
        issues,
        lesson.id,
        `${path}.practiceData.exercises`,
        `At least ${profile.minimumPracticeExercises} practice exercises are required.`,
      );
      return;
    }
    const ids = new Set<string>();
    for (const [index, exercise] of data.exercises.entries()) {
      validatePracticeExercise(lesson.id, stepIndex, exercise, index, issues);
      if (isNonEmptyString(exercise.id)) {
        if (ids.has(exercise.id)) {
          addIssue(
            issues,
            lesson.id,
            `${path}.practiceData.exercises[${index}].id`,
            'Duplicate exercise ID in lesson.',
          );
        }
        ids.add(exercise.id);
      }
    }
  }

  if (step.type === 'test') {
    const data = step.testData;
    if (!data) {
      addIssue(issues, lesson.id, `${path}.testData`, 'Test data is required.');
      return;
    }
    if (!isNonEmptyString(data.instructions)) {
      addIssue(
        issues,
        lesson.id,
        `${path}.testData.instructions`,
        'Test instructions are required.',
      );
    }
    if (
      !Number.isFinite(data.passingScorePercentage) ||
      data.passingScorePercentage < 0 ||
      data.passingScorePercentage > 100
    ) {
      addIssue(
        issues,
        lesson.id,
        `${path}.testData.passingScorePercentage`,
        'Passing score must be between 0 and 100.',
      );
    }
    const minimumQuestions =
      profile.requiresListeningStep && stepIndex === 3 ? 1 : profile.minimumTestQuestions;
    if (!Array.isArray(data.questions) || data.questions.length < minimumQuestions) {
      addIssue(
        issues,
        lesson.id,
        `${path}.testData.questions`,
        `At least ${minimumQuestions} test questions are required.`,
      );
      return;
    }
    const ids = new Set<string>();
    for (const [index, question] of data.questions.entries()) {
      validateTestQuestion(lesson.id, stepIndex, question, index, issues);
      if (isNonEmptyString(question.id)) {
        if (ids.has(question.id)) {
          addIssue(
            issues,
            lesson.id,
            `${path}.testData.questions[${index}].id`,
            'Duplicate question ID in lesson.',
          );
        }
        ids.add(question.id);
      }
    }
    if (profile.requiresListeningStep && stepIndex === 3) {
      const audioQuestions = data.questions.filter((question) =>
        isNonEmptyString(question.audioUrl),
      );
      if (audioQuestions.length !== data.questions.length) {
        addIssue(
          issues,
          lesson.id,
          `${path}.testData.questions`,
          'Every listening question needs an audioUrl.',
        );
      }
    }
  }
}

export function validateCurriculumLesson(
  lesson: Lesson,
  profile: CurriculumValidationProfile,
): CurriculumValidationIssue[] {
  const issues: CurriculumValidationIssue[] = [];
  const config = PROFILE_CONFIG[profile];

  if (!isNonEmptyString(lesson.id))
    addIssue(issues, lesson.id || '<unknown>', 'id', 'Lesson ID is required.');
  if (!isNonEmptyString(lesson.title))
    addIssue(issues, lesson.id, 'title', 'Lesson title is required.');
  if (!isNonEmptyString(lesson.description))
    addIssue(issues, lesson.id, 'description', 'Lesson description is required.');
  if (lesson.language !== 'ja')
    addIssue(issues, lesson.id, 'language', 'Canonical Japanese lessons must use language "ja".');
  if (!isNonEmptyString(lesson.level))
    addIssue(issues, lesson.id, 'level', 'Lesson level is required.');
  if (!Number.isInteger(lesson.lessonNumber) || lesson.lessonNumber < 1) {
    addIssue(issues, lesson.id, 'lessonNumber', 'Lesson number must be a positive integer.');
  }
  if (
    !isFiniteNonNegativeNumber(lesson.estimatedDurationMinutes) ||
    lesson.estimatedDurationMinutes <= 0
  ) {
    addIssue(
      issues,
      lesson.id,
      'estimatedDurationMinutes',
      'Lesson duration must be greater than zero.',
    );
  }
  if (!Array.isArray(lesson.steps) || lesson.steps.length !== config.expectedStepTypes.length) {
    addIssue(
      issues,
      lesson.id,
      'steps',
      `Expected ${config.expectedStepTypes.length} steps, received ${lesson.steps?.length ?? 0}.`,
    );
    return issues;
  }

  const stepIds = new Set<string>();
  const actualTypes = lesson.steps.map((step) => step.type);
  if (actualTypes.join('|') !== config.expectedStepTypes.join('|')) {
    addIssue(
      issues,
      lesson.id,
      'steps',
      `Expected step flow ${config.expectedStepTypes.join(' -> ')}, received ${actualTypes.join(' -> ')}.`,
    );
  }

  for (const [index, step] of lesson.steps.entries()) {
    validateStep(lesson, step, index, config, issues);
    if (isNonEmptyString(step.id)) {
      if (stepIds.has(step.id)) {
        addIssue(issues, lesson.id, `steps[${index}].id`, 'Duplicate step ID in lesson.');
      }
      stepIds.add(step.id);
    }
  }

  const durationTotal = lesson.steps.reduce((total, step) => total + step.estimatedMinutes, 0);
  if (
    Number.isFinite(lesson.estimatedDurationMinutes) &&
    Math.abs(durationTotal - lesson.estimatedDurationMinutes) > 0.001
  ) {
    addIssue(
      issues,
      lesson.id,
      'estimatedDurationMinutes',
      `Lesson duration ${lesson.estimatedDurationMinutes} does not equal step total ${durationTotal}.`,
    );
  }

  return issues;
}

export function validateCurriculum(
  lessons: Lesson[],
  profile: CurriculumValidationProfile,
): CurriculumValidationResult {
  const issues: CurriculumValidationIssue[] = [];
  const lessonIds = new Set<string>();
  const titles = new Set<string>();
  const lessonNumbers = new Set<number>();

  for (const lesson of lessons) {
    const lessonIssues = validateCurriculumLesson(lesson, profile);
    issues.push(...lessonIssues);

    if (isNonEmptyString(lesson.id)) {
      if (lessonIds.has(lesson.id)) {
        addIssue(issues, lesson.id, 'id', 'Duplicate lesson ID.');
      }
      lessonIds.add(lesson.id);
    }
    if (isNonEmptyString(lesson.title)) {
      if (titles.has(lesson.title)) {
        addIssue(issues, lesson.id, 'title', 'Duplicate lesson title.');
      }
      titles.add(lesson.title);
    }
    if (Number.isInteger(lesson.lessonNumber)) {
      if (lessonNumbers.has(lesson.lessonNumber)) {
        addIssue(issues, lesson.id, 'lessonNumber', 'Duplicate lesson number.');
      }
      lessonNumbers.add(lesson.lessonNumber);
    }
  }

  return { valid: issues.length === 0, issues };
}
