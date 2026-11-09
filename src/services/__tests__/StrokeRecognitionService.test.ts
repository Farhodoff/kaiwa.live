import { describe, expect, it } from 'vitest';
import { StrokeRecognitionService, UserStroke } from '../StrokeRecognitionService';

describe('StrokeRecognitionService', () => {
  it('returns empty result when no strokes drawn', () => {
    const result = StrokeRecognitionService.evaluate([], 4);
    expect(result.score).toBe(0);
    expect(result.isAccepted).toBe(false);
    expect(result.badgeUz).toContain('Chizishni boshlang');
  });

  it('tolerates small touch finger stroke deviations (+/- 1 stroke) gracefully', () => {
    // 4 expected strokes (e.g. 日), user drew 3 connected strokes
    const strokes: UserStroke[] = [
      {
        points: [
          { x: 100, y: 50 },
          { x: 100, y: 200 },
        ],
      },
      {
        points: [
          { x: 100, y: 50 },
          { x: 200, y: 50 },
          { x: 200, y: 200 },
        ],
      },
      {
        points: [
          { x: 100, y: 125 },
          { x: 200, y: 125 },
        ],
      },
    ];

    const result = StrokeRecognitionService.evaluate(strokes, 4);
    expect(result.isAccepted).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.strokeCountScore).toBe(85);
  });

  it('accepts perfectly drawn strokes with high score and encouraging feedback', () => {
    // 2 expected strokes (e.g. い or 人)
    const strokes: UserStroke[] = [
      {
        points: [
          { x: 150, y: 60 },
          { x: 100, y: 220 },
        ],
      },
      {
        points: [
          { x: 130, y: 130 },
          { x: 210, y: 220 },
        ],
      },
    ];

    const result = StrokeRecognitionService.evaluate(strokes, 2);
    expect(result.isAccepted).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.badgeUz).toContain('Mukammal');
  });

  it('rejects incomplete dots or tiny scribbles that do not cover the grid', () => {
    const tinyStrokes: UserStroke[] = [
      {
        points: [
          { x: 150, y: 150 },
          { x: 152, y: 152 },
        ],
      },
    ];

    const result = StrokeRecognitionService.evaluate(tinyStrokes, 5);
    expect(result.isAccepted).toBe(false);
    expect(result.score).toBeLessThan(55);
  });
});
