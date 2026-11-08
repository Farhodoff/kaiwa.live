import { Lesson } from '../../types/lesson';
import rawData from './levels/n2/japaneseLessons.json';
import { quarantineInvalidExercises } from './contentQuality';

// Exercises that fail structural quality checks are quarantined until a
// Japanese-language reviewer replaces them with level-appropriate content.
export const JAPANESE_N2_LESSONS: Lesson[] = quarantineInvalidExercises(
  rawData as unknown as Lesson[],
);
export default JAPANESE_N2_LESSONS;
