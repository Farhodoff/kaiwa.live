import { Lesson } from '../../types/lesson';
import rawData from './levels/n3/japaneseLessons.json';

const GENERATED_PLACEHOLDER_OPTION =
  /^(文脈に合わない表現|文脈と無関係な文|本文にない情報である|文法的に不自然な表現|意味が異なる表現|意味の異なる文|文法の誤った文|反対の内容である|文法形式だけを述べた選択肢)$/;

// Placeholder choices such as “unrelated expression” are not valid N3
// practice. Keep authored exercises only until these generated items are
// replaced with level-appropriate questions.
export const JAPANESE_N3_LESSONS: Lesson[] = (rawData as unknown as Lesson[]).map((lesson) => ({
  ...lesson,
  steps: lesson.steps.map((step) => {
    if (!step.practiceData) return step;

    return {
      ...step,
      practiceData: {
        ...step.practiceData,
        exercises: step.practiceData.exercises.filter(
          (exercise) =>
            !exercise.options?.some((option) => GENERATED_PLACEHOLDER_OPTION.test(option)),
        ),
      },
    };
  }),
}));
export default JAPANESE_N3_LESSONS;
