export interface WritingPoint {
  x: number;
  y: number;
}
export interface WritingAssessment {
  writingAccuracy: number;
  strokeOrderPassed: boolean;
  passed: boolean;
  expectedStrokes: number;
  drawnStrokes: number;
}

const distance = (a: WritingPoint, b: WritingPoint) => Math.hypot(a.x - b.x, a.y - b.y);

function resample(points: WritingPoint[], count = 24): WritingPoint[] | null {
  if (points.length < 2 || points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y)))
    return null;
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(lengths[i - 1] + distance(points[i - 1], points[i]));
  const total = lengths[lengths.length - 1];
  if (total < 3) return null;
  let segment = 1;
  return Array.from({ length: count }, (_, index) => {
    const target = (total * index) / (count - 1);
    while (segment < lengths.length - 1 && lengths[segment] < target) segment++;
    const span = lengths[segment] - lengths[segment - 1];
    const t = span > 0 ? (target - lengths[segment - 1]) / span : 0;
    const a = points[segment - 1],
      b = points[segment];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  });
}

const meanDistance = (a: WritingPoint[], b: WritingPoint[]) =>
  a.reduce((sum, point, i) => sum + distance(point, b[i]), 0) / a.length;

/** Geometric practice feedback in a fixed 300-unit square, not handwriting recognition. */
export function assessKanjiWriting(
  drawn: WritingPoint[][],
  reference: WritingPoint[][],
): WritingAssessment | null {
  const expected = reference.map((points) => resample(points));
  if (!expected.length || expected.some((points) => !points)) return null;
  const actual = drawn.map((points) => resample(points));
  const refs = expected as WritingPoint[][];
  let shapeTotal = 0;
  let ordered = actual.length === refs.length;
  actual.forEach((stroke, index) => {
    if (!stroke || !refs[index]) {
      ordered = false;
      return;
    }
    const forward = refs.map((ref) => meanDistance(stroke, ref));
    const reversed = refs.map((ref) => meanDistance(stroke, [...ref].reverse()));
    const shapes = forward.map((score, i) => Math.min(score, reversed[i]));
    const nearest = shapes.indexOf(Math.min(...shapes));
    shapeTotal += Math.max(0, 100 * (1 - shapes[index] / 60));
    // Direction and sequence must both match; shape alone cannot verify stroke order.
    if (nearest !== index || forward[index] > 18 || forward[index] > reversed[index])
      ordered = false;
  });
  const accuracy = Math.round(shapeTotal / Math.max(actual.length, refs.length));
  return {
    writingAccuracy: accuracy,
    strokeOrderPassed: ordered,
    passed: ordered && accuracy >= 70,
    expectedStrokes: refs.length,
    drawnStrokes: actual.length,
  };
}

/** Sample KanjiVG's 109-unit paths using the browser's SVG geometry implementation. */
export function sampleKanjiPaths(paths: string[]): WritingPoint[][] | null {
  if (!paths.length || typeof document === 'undefined') return null;
  try {
    return paths.map((d) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      if (typeof path.getTotalLength !== 'function' || typeof path.getPointAtLength !== 'function')
        throw new Error('SVG geometry unavailable');
      const length = path.getTotalLength();
      if (!Number.isFinite(length) || length <= 0) throw new Error('Invalid reference path');
      return Array.from({ length: 48 }, (_, index) => {
        const point = path.getPointAtLength((length * index) / 47);
        return { x: (point.x * 300) / 109, y: (point.y * 300) / 109 };
      });
    });
  } catch {
    return null;
  }
}
