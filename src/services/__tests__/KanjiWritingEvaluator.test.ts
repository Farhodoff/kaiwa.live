import { afterEach, describe, expect, it, vi } from 'vitest';
import { assessKanjiWriting, sampleKanjiPaths } from '../KanjiWritingEvaluator';

const reference = [
  [
    { x: 50, y: 40 },
    { x: 250, y: 40 },
  ],
  [
    { x: 50, y: 200 },
    { x: 250, y: 200 },
  ],
];

afterEach(() => vi.restoreAllMocks());

describe('KanjiWritingEvaluator', () => {
  it('accepts matching ordered strokes regardless of drawing sample density', () => {
    const drawn = reference.map(([a, b]) => [a, { x: 150, y: a.y }, b]);
    expect(assessKanjiWriting(drawn, reference)).toMatchObject({
      writingAccuracy: 100,
      strokeOrderPassed: true,
      passed: true,
    });
  });
  it('detects swapped strokes independently of their count', () => {
    expect(assessKanjiWriting([...reference].reverse(), reference)?.strokeOrderPassed).toBe(false);
  });
  it('retains shape accuracy but rejects reversed drawing direction', () => {
    expect(
      assessKanjiWriting(
        reference.map((stroke) => [...stroke].reverse()),
        reference,
      ),
    ).toMatchObject({ writingAccuracy: 100, strokeOrderPassed: false, passed: false });
  });
  it('rejects blank, missing, additional, misplaced, and dot-only strokes', () => {
    for (const drawn of [
      [],
      [reference[0]],
      [...reference, reference[0]],
      reference.map((stroke) => stroke.map((p) => ({ x: p.x, y: p.y + 90 }))),
      [[{ x: 1, y: 1 }]],
    ]) {
      expect(assessKanjiWriting(drawn, reference)?.passed).toBe(false);
    }
    expect(assessKanjiWriting([], reference)?.writingAccuracy).toBe(0);
  });
  it('handles repeated points without producing NaN or changing a valid score', () => {
    const drawn = reference.map(([a, b]) => [a, a, b, b]);
    expect(assessKanjiWriting(drawn, reference)).toMatchObject({
      writingAccuracy: 100,
      passed: true,
    });
  });

  it('rejects near-stationary strokes as writing and refuses degenerate references', () => {
    const tinyStroke = [
      { x: 50, y: 40 },
      { x: 51, y: 40 },
    ];
    expect(assessKanjiWriting([tinyStroke, reference[1]], reference)?.passed).toBe(false);
    expect(assessKanjiWriting(reference, [tinyStroke])).toBeNull();
  });

  it('rejects non-finite coordinates in a drawing without returning a non-finite score', () => {
    const result = assessKanjiWriting(
      [
        [
          { x: Infinity, y: 0 },
          { x: 250, y: 40 },
        ],
        reference[1],
      ],
      reference,
    );
    expect(result?.passed).toBe(false);
    expect(Number.isFinite(result?.writingAccuracy)).toBe(true);
  });

  it('samples each SVG path at 48 positions and converts 109-unit geometry to canvas coordinates', () => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const getPointAtLength = vi.fn((length: number) => ({ x: length, y: length / 2 }));
    Object.defineProperties(path, {
      getTotalLength: { value: () => 109 },
      getPointAtLength: { value: getPointAtLength },
    });
    vi.spyOn(document, 'createElementNS').mockReturnValue(path);
    const sampled = sampleKanjiPaths(['M0 0 L109 54.5']);
    expect(path.getAttribute('d')).toBe('M0 0 L109 54.5');
    expect(sampled).toHaveLength(1);
    expect(sampled?.[0]).toHaveLength(48);
    expect(sampled?.[0][0]).toEqual({ x: 0, y: 0 });
    expect(sampled?.[0][47]).toEqual({ x: 300, y: 150 });
    expect(getPointAtLength).toHaveBeenCalledTimes(48);
  });

  it.each([0, -1, NaN, Infinity])('rejects invalid SVG path length %s', (length) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const getPointAtLength = vi.fn();
    Object.defineProperties(path, {
      getTotalLength: { value: () => length },
      getPointAtLength: { value: getPointAtLength },
    });
    vi.spyOn(document, 'createElementNS').mockReturnValue(path);
    expect(sampleKanjiPaths(['M0 0 L10 10'])).toBeNull();
    expect(getPointAtLength).not.toHaveBeenCalled();
  });

  it('fails safely if the SVG geometry implementation throws', () => {
    vi.spyOn(document, 'createElementNS').mockImplementation(() => {
      throw new Error('SVG unavailable');
    });
    expect(sampleKanjiPaths(['M0 0 L10 10'])).toBeNull();
  });

  it('reports unavailable references rather than inventing a successful score', () => {
    expect(assessKanjiWriting(reference, [])).toBeNull();
    expect(assessKanjiWriting(reference, [[{ x: NaN, y: 0 }]])).toBeNull();
    expect(sampleKanjiPaths([])).toBeNull();
    expect(sampleKanjiPaths(['M0 0 L10 10'])).toBeNull(); // jsdom has no SVG geometry implementation
  });
});
