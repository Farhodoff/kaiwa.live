import type { PracticeExercise } from '../types/lesson';

export function practiceAnswerCorrect(
  exercise: PracticeExercise,
  selected: string | number | undefined,
): boolean {
  if (selected === undefined) return false;
  if (exercise.type === 'sentence-order') return selected === 'correct';
  const actual =
    typeof selected === 'number' && exercise.options ? exercise.options[selected] : selected;
  const expected =
    typeof exercise.correctAnswer === 'number' && exercise.options
      ? exercise.options[exercise.correctAnswer]
      : exercise.correctAnswer;
  const normalize = (value: unknown) =>
    String(value ?? '')
      .normalize('NFKC')
      .trim()
      .toLowerCase();
  return (
    actual !== undefined && expected !== undefined && normalize(actual) === normalize(expected)
  );
}
