export interface JlptLevelPassMark {
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  totalPassMark: number;
  maxScore: number;
  sectionalThreshold: number;
}

export const JLPT_PASS_MARKS: Record<string, JlptLevelPassMark> = {
  N5: { level: 'N5', totalPassMark: 80, maxScore: 180, sectionalThreshold: 19 },
  N4: { level: 'N4', totalPassMark: 90, maxScore: 180, sectionalThreshold: 19 },
  N3: { level: 'N3', totalPassMark: 95, maxScore: 180, sectionalThreshold: 19 },
  N2: { level: 'N2', totalPassMark: 90, maxScore: 180, sectionalThreshold: 19 },
  N1: { level: 'N1', totalPassMark: 100, maxScore: 180, sectionalThreshold: 19 },
};
