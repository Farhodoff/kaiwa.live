export const JLPT_STUDY_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type StudyLevel = (typeof JLPT_STUDY_LEVELS)[number];
export type StudyTopic = 'goi' | 'kanji' | 'grammar';
export const JLPT_TOPIC_PATHS: Record<StudyTopic, string> = {
  goi: '/jlpt/vocabulary',
  kanji: '/jlpt/kanji',
  grammar: '/jlpt/grammar',
};
export function isStudyTopic(value: string): value is StudyTopic {
  return value === 'goi' || value === 'kanji' || value === 'grammar';
}
export function resolveStudyLevel(raw?: string | null, target?: string): StudyLevel {
  for (const value of [raw, target]) {
    const normalized = value?.toUpperCase();
    if (JLPT_STUDY_LEVELS.includes(normalized as StudyLevel)) return normalized as StudyLevel;
  }
  return 'N5';
}
export function studyAreaHref(
  area: string,
  level: StudyLevel,
  current = new URLSearchParams(),
): string {
  const params = new URLSearchParams(current);
  params.set('level', level);
  params.delete('mode');
  const topicPath = isStudyTopic(area) ? JLPT_TOPIC_PATHS[area] : null;
  if (topicPath) {
    params.delete('tab');
    return `${topicPath}?${params}`;
  }
  params.set('tab', area);
  return `/jlpt?${params}`;
}
