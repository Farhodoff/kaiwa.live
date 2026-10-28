import { Lesson } from '../../types/lesson';
import metadata from './curriculumMetadata.json';

export const ALL_ENGLISH_LESSONS: Lesson[] = [];

/**
 * Canonical Japanese curriculum:
 * - N5: 25 comprehensive Minna no Nihongo lessons (ja-minna-l1 to ja-minna-l25)
 * - N4: 25 comprehensive Minna no Nihongo lessons (ja-minna-l26 to ja-minna-l50)
 * - N3: 30 structured JLPT N3 lessons (ja-n3-u1-l1 to ja-n3-u6-l5)
 * - N2: 30 structured JLPT N2 lessons (ja-n2-u1-l1 to ja-n2-u6-l5)
 * - N1: 30 structured JLPT N1 lessons (ja-n1-u1-l1 to ja-n1-u6-l5)
 * Total: 140 canonical high-quality lessons (zero duplicate tracks).
 */
let fullLessons: Lesson[] = metadata.canonicalLessons as unknown as Lesson[];

if (!import.meta.env.PROD) {
  try {
    const [n5, n4, n3, n2, n1] = await Promise.all([
      import('./levels/n5/minnaLessons.json'),
      import('./levels/n4/minnaLessons.json'),
      import('./levels/n3/japaneseLessons.json'),
      import('./levels/n2/japaneseLessons.json'),
      import('./levels/n1/japaneseLessons.json'),
    ]);
    fullLessons = [
      ...n5.default,
      ...n4.default,
      ...n3.default,
      ...n2.default,
      ...n1.default,
    ] as unknown as Lesson[];
  } catch (_) {}
}

/**
 * Dynamic level loaders for code-splitting curriculum by level (N5, N4, N3, N2, N1).
 * In production, each level is loaded on-demand when user enters that level or lesson.
 */
export const LEVEL_LOADERS: Record<string, () => Promise<Lesson[]>> = {
  N5: () => import('./levels/n5/minnaLessons.json').then((m) => m.default as unknown as Lesson[]),
  N4: () => import('./levels/n4/minnaLessons.json').then((m) => m.default as unknown as Lesson[]),
  N3: () =>
    import('./levels/n3/japaneseLessons.json').then((m) => m.default as unknown as Lesson[]),
  N2: () =>
    import('./levels/n2/japaneseLessons.json').then((m) => m.default as unknown as Lesson[]),
  N1: () =>
    import('./levels/n1/japaneseLessons.json').then((m) => m.default as unknown as Lesson[]),
};

export async function loadCurriculumLevel(level: string): Promise<Lesson[]> {
  const norm = level.toUpperCase();
  const loader = LEVEL_LOADERS[norm];
  if (!loader) return [];
  const lessons = await loader();
  lessons.forEach((l) => CURRICULUM_LESSONS_BY_ID.set(l.id, l));
  return lessons;
}

export async function loadCurriculumLessonById(id: string): Promise<Lesson | undefined> {
  const existing = CURRICULUM_LESSONS_BY_ID.get(id);
  if (existing && existing.steps && existing.steps.length > 0) {
    return existing;
  }
  let level = existing?.level;
  if (!level) {
    if (id.startsWith('ja-minna-l')) {
      const num = parseInt(id.replace('ja-minna-l', ''), 10);
      level = num <= 25 ? 'N5' : 'N4';
    } else {
      level = id.split('-')[1]?.toUpperCase() || 'N5';
    }
  }
  await loadCurriculumLevel(level);
  return getCurriculumLessonById(id) || existing;
}

export const ALL_JAPANESE_LESSONS: Lesson[] = fullLessons;
export const ALL_CURRICULUM_LESSONS: Lesson[] = ALL_JAPANESE_LESSONS;

export const CURRICULUM_LESSONS_BY_ID: Map<string, Lesson> = new Map([
  ...ALL_CURRICULUM_LESSONS.map((l) => [l.id, l] as [string, Lesson]),
]);

function getCanonicalLessonId(id: string): string | undefined {
  const n5Match = id.match(/^ja-n5-u\d+-l(\d+)$/);
  if (n5Match) {
    const lessonNumber = Number(n5Match[1]);
    return lessonNumber >= 1 && lessonNumber <= 25 ? `ja-minna-l${lessonNumber}` : undefined;
  }

  const n4Match = id.match(/^ja-n4-u\d+-l(\d+)$/);
  if (n4Match) {
    const lessonNumber = Number(n4Match[1]);
    return lessonNumber >= 1 && lessonNumber <= 25 ? `ja-minna-l${lessonNumber + 25}` : undefined;
  }

  return undefined;
}

export function getCurriculumLessonById(id: string): Lesson | undefined {
  const lesson = CURRICULUM_LESSONS_BY_ID.get(id);
  if (lesson) return lesson;

  const canonicalId = getCanonicalLessonId(id);
  const canonicalLesson = canonicalId ? CURRICULUM_LESSONS_BY_ID.get(canonicalId) : undefined;

  return canonicalLesson ? { ...canonicalLesson, id } : undefined;
}

export function getCurriculumLessonsByLanguage(language: 'en' | 'ja'): Lesson[] {
  return language === 'en' ? ALL_ENGLISH_LESSONS : ALL_JAPANESE_LESSONS;
}

export function getCurriculumLessonsByLevel(language: 'en' | 'ja', level: string): Lesson[] {
  const list = getCurriculumLessonsByLanguage(language);
  return list.filter((lesson) => lesson.level.toUpperCase() === level.toUpperCase());
}
