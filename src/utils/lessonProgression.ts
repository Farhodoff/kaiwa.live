import type { Lesson, LessonStep, LessonStepResult, UserLessonProgress } from '../types/lesson';

export function lessonStepTotal(step: LessonStep): number {
  return step.type === 'test'
    ? step.testData?.questions.length || 0
    : step.type === 'practice'
      ? step.practiceData?.exercises.length || 0
      : 0;
}

export function lessonPassingScore(step: LessonStep): number {
  return step.type === 'practice' ? 70 : (step.testData?.passingScorePercentage ?? 75);
}

export function validStepResult(step: LessonStep, result?: LessonStepResult): boolean {
  if (!result || result.type !== step.type) return false;
  if (step.type === 'learn') return result.passed === true;
  const total = lessonStepTotal(step);
  return (
    total > 0 &&
    result.total === total &&
    Number.isInteger(result.score) &&
    result.score >= 0 &&
    result.score <= total &&
    result.passed === true &&
    (result.score / total) * 100 >= lessonPassingScore(step)
  );
}

/** Only a continuous prefix of verified steps unlocks subsequent work. */
export function completedLessonSteps(
  lesson: Lesson,
  progress?: UserLessonProgress | null,
): string[] {
  const ids: string[] = [];
  for (const step of lesson.steps) {
    if (!validStepResult(step, progress?.stepResults?.[step.id])) break;
    ids.push(step.id);
  }
  return ids;
}

export function unlockedLessonStep(lesson: Lesson, progress?: UserLessonProgress | null): number {
  return Math.min(
    completedLessonSteps(lesson, progress).length,
    Math.max(0, lesson.steps.length - 1),
  );
}

export function lessonAggregateScore(lesson: Lesson, progress: UserLessonProgress) {
  let score = 0;
  let total = 0;
  for (const step of lesson.steps) {
    if (step.type === 'learn') continue;
    const result = progress.stepResults?.[step.id];
    if (!result || !validStepResult(step, result)) continue;
    score += result.score;
    total += result.total;
  }
  return { score, total, percentage: total ? Math.round((score / total) * 100) : 0 };
}

export function recordLessonStep(
  lesson: Lesson,
  progress: UserLessonProgress,
  index: number,
  score = 0,
  total = 0,
): UserLessonProgress {
  const step = lesson.steps[index];
  if (!step || index > unlockedLessonStep(lesson, progress))
    throw new Error('Avval oldingi bosqichni yakunlang.');
  if (
    step.type !== 'learn' &&
    (total !== lessonStepTotal(step) ||
      total <= 0 ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > total)
  )
    throw new Error('Bosqich natijasi savollar soniga mos emas.');
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const result: LessonStepResult = {
    type: step.type,
    score,
    total,
    percentage,
    passed: step.type === 'learn' || (score / total) * 100 >= lessonPassingScore(step),
    completedAt: new Date().toISOString(),
  };
  // Reviewing an already passed step must not revoke previously earned progress.
  const stepResults = {
    ...progress.stepResults,
    [step.id]:
      result.passed || !validStepResult(step, progress.stepResults?.[step.id])
        ? result
        : progress.stepResults![step.id],
  };
  const next = {
    ...progress,
    stepResults,
    progressionVersion: 1 as const,
    lastAttemptedAt: new Date().toISOString(),
  };
  next.completedStepIds = completedLessonSteps(lesson, next);
  next.quizScore = lessonAggregateScore(lesson, next);
  return next;
}

export function verifiedLessonCompletion(
  lesson: Lesson,
  progress?: UserLessonProgress | null,
): boolean {
  return (
    !!progress &&
    lesson.steps.length > 0 &&
    completedLessonSteps(lesson, progress).length === lesson.steps.length
  );
}
