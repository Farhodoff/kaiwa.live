import type { JlptExamMode } from './jlptExamTiming';

export type ListeningAudioPolicy = 'original' | 'synthetic_practice' | 'unavailable';

export function getListeningAudioPolicy(
  examMode: JlptExamMode,
  audioUrl?: string,
  script?: string,
): ListeningAudioPolicy {
  const hasOriginal = Boolean(audioUrl?.trim() && !audioUrl.includes('soundhelix.com'));
  if (hasOriginal) return 'original';
  if (examMode === 'practice' && script?.trim()) return 'synthetic_practice';
  return 'unavailable';
}
