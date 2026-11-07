import { Lesson } from '../../types/lesson';
import rawData from './levels/n1/japaneseLessons.json';
import { quarantineInvalidExercises } from './contentQuality';

// Exercises that fail structural quality checks are quarantined until a
// Japanese-language reviewer replaces them with level-appropriate content.
export const JAPANESE_N1_LESSONS: Lesson[] = quarantineInvalidExercises(
  rawData as unknown as Lesson[],
);
export default JAPANESE_N1_LESSONS;
