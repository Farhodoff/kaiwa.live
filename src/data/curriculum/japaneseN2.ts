import { Lesson } from '../../types/lesson';
import rawData from './levels/n2/japaneseLessons.json';

const GENERATED_PLACEHOLDER_OPTION =
  /^(文脈に合わない表現|文脈と無関係な文|本文にない情報である|文法的に不自然な表現|意味が異なる表現|意味の異なる文|文法の誤った文|反対の内容である|文法形式だけを述べた選択肢)$/;

// These generated drills have label-style answers instead of Japanese practice.
// Keep the authored exercises and omit only invalid items until they are rewritten.
export const JAPANESE_N2_LESSONS: Lesson[] = (rawData as unknown as Lesson[]).map((lesson) => ({
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
export default JAPANESE_N2_LESSONS;
