/**
 * audioUrl.ts
 * Utility to resolve audio URLs with optional CDN or cloud storage backing.
 * Falls back transparently to local relative paths (e.g. /audio/...).
 */

export function safeEncodeAudioPath(path: string): string {
  try {
    return encodeURI(decodeURI(path));
  } catch {
    return path;
  }
}

export function resolveAudioUrl(url?: string | null): string {
  if (!url) return '';
  let trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return safeEncodeAudioPath(trimmed);
  }

  if (!trimmed.startsWith('/')) {
    trimmed = `/${trimmed}`;
  }

  const cdnBase =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_AUDIO_CDN_URL
      : undefined;

  if (cdnBase && trimmed.startsWith('/audio/')) {
    const cleanBase = cdnBase.replace(/\/+$/, '');
    return safeEncodeAudioPath(`${cleanBase}${trimmed}`);
  }

  return safeEncodeAudioPath(trimmed);
}
