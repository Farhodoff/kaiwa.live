import { Lesson } from '../../types/lesson';
import rawData from './levels/n4/minnaLessons.json';

export const JAPANESE_N4_LESSONS: Lesson[] = rawData as unknown as Lesson[];
export default JAPANESE_N4_LESSONS;
