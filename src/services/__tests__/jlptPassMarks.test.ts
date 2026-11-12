import { describe, it, expect } from 'vitest';
import { JLPT_PASS_MARKS } from '../../constants/jlptPassMarks';

describe('JLPT Pass Mark Criteria', () => {
  it('defines correct N5 pass threshold of 80 points', () => {
    expect(JLPT_PASS_MARKS.N5.totalPassMark).toBe(80);
    expect(JLPT_PASS_MARKS.N5.maxScore).toBe(180);
    expect(JLPT_PASS_MARKS.N5.sectionalThreshold).toBe(19);
  });

  it('defines N1 pass mark of 100 points', () => {
    expect(JLPT_PASS_MARKS.N1.totalPassMark).toBe(100);
  });
});
