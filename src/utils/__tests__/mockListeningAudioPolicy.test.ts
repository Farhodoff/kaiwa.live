import { describe, expect, it } from 'vitest';
import { getListeningAudioPolicy } from '../mockListeningAudioPolicy';

describe('mock listening audio policy', () => {
  it('keeps original audio as the only option for scored timed mocks', () => {
    expect(getListeningAudioPolicy('official_timed', undefined, '台本')).toBe('unavailable');
    expect(
      getListeningAudioPolicy('official_timed', 'https://example.test/audio.mp3', '台本'),
    ).toBe('original');
  });

  it('allows clearly labelled synthetic playback only in practice mode', () => {
    expect(getListeningAudioPolicy('practice', undefined, '台本')).toBe('synthetic_practice');
    expect(getListeningAudioPolicy('practice', undefined, undefined)).toBe('unavailable');
  });
});
