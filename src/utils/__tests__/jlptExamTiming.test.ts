import { describe, it, expect } from 'vitest';
import {
  JLPT_SECTION_SPECS,
  getSectionDurationSeconds,
  getOrderedSections,
  getSectionIndex,
  getNextSectionKey,
  getNextTimingBlock,
  getTimingBlockForSection,
  getTotalExamSeconds,
  canOpenSectionInOfficialMode,
  getDefaultTimingConfig,
  resolveTimingSpecs,
  JlptLevel,
  SectionKey,
  JlptTimingConfig,
} from '../jlptExamTiming';

describe('jlptExamTiming', () => {
  const levels: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  it('defines specs for all 5 JLPT levels with correct block counts', () => {
    levels.forEach((lvl) => {
      expect(JLPT_SECTION_SPECS[lvl]).toBeDefined();
      expect(JLPT_SECTION_SPECS[lvl].length).toBe(lvl === 'N2' || lvl === 'N1' ? 2 : 3);
    });
  });

  it('models N2/N1 Language Knowledge + Reading as one 105/110 minute block', () => {
    const n2 = getTimingBlockForSection('N2', 'knowledge');
    const n2Reading = getTimingBlockForSection('N2', 'reading');
    expect(n2?.block).toBe('language_reading');
    expect(n2?.sections).toEqual(['knowledge', 'reading']);
    expect(n2Reading?.block).toBe('language_reading');
    expect(n2?.officialMinutes).toBe(105);
    expect(n2?.simulationSeconds).toBe(45 * 60);

    const n1 = getTimingBlockForSection('N1', 'reading');
    expect(n1?.block).toBe('language_reading');
    expect(n1?.sections).toEqual(['knowledge', 'reading']);
    expect(n1?.officialMinutes).toBe(110);
  });

  it('keeps N3-N5 sections as separate timing blocks', () => {
    ['N5', 'N4', 'N3'].forEach((lvl) => {
      const ordered = getOrderedSections(lvl as JlptLevel);
      expect(ordered.map((s) => s.block)).toEqual(['knowledge', 'reading', 'listening']);
      expect(ordered[0].order).toBe(1);
      expect(ordered[1].order).toBe(2);
      expect(ordered[2].order).toBe(3);
    });
  });

  it('returns the same combined duration for N2/N1 knowledge and reading', () => {
    expect(getSectionDurationSeconds('N2', 'knowledge', true)).toBe(105 * 60);
    expect(getSectionDurationSeconds('N2', 'reading', true)).toBe(105 * 60);
    expect(getSectionDurationSeconds('N2', 'knowledge', false)).toBe(45 * 60);
    expect(getSectionDurationSeconds('N2', 'reading', false)).toBe(45 * 60);

    expect(getSectionDurationSeconds('N1', 'knowledge', true)).toBe(110 * 60);
    expect(getSectionDurationSeconds('N1', 'reading', true)).toBe(110 * 60);
    expect(getSectionDurationSeconds('N1', 'listening', true)).toBe(60 * 60);
  });

  it('correctly calculates simulation and official seconds for N5', () => {
    expect(getSectionDurationSeconds('N5', 'knowledge', false)).toBe(15 * 60);
    expect(getSectionDurationSeconds('N5', 'knowledge', true)).toBe(20 * 60);
    expect(getSectionDurationSeconds('N5', 'reading', false)).toBe(20 * 60);
    expect(getSectionDurationSeconds('N5', 'reading', true)).toBe(40 * 60);
    expect(getSectionDurationSeconds('N5', 'listening', false)).toBe(15 * 60);
    expect(getSectionDurationSeconds('N5', 'listening', true)).toBe(30 * 60);
  });

  it('returns fallback seconds if unknown section is passed', () => {
    expect(getSectionDurationSeconds('N5', 'unknown' as unknown as SectionKey)).toBe(1200);
  });

  it('calculates block indices and next block transitions', () => {
    expect(getSectionIndex('N3', 'knowledge')).toBe(0);
    expect(getSectionIndex('N3', 'reading')).toBe(1);
    expect(getSectionIndex('N3', 'listening')).toBe(2);
    expect(getSectionIndex('N2', 'knowledge')).toBe(0);
    expect(getSectionIndex('N2', 'reading')).toBe(0);
    expect(getSectionIndex('N2', 'listening')).toBe(1);

    expect(getNextSectionKey('N4', 'knowledge')).toBe('reading');
    expect(getNextSectionKey('N4', 'reading')).toBe('listening');
    expect(getNextSectionKey('N4', 'listening')).toBeNull();
    expect(getNextSectionKey('N2', 'knowledge')).toBe('listening');
    expect(getNextSectionKey('N2', 'reading')).toBe('listening');
  });

  it('returns the next timing block, not a section inside the same block', () => {
    expect(getNextTimingBlock('N2', 'knowledge')?.block).toBe('listening');
    expect(getNextTimingBlock('N2', 'reading')?.block).toBe('listening');
    expect(getNextTimingBlock('N2', 'listening')).toBeNull();
    expect(getNextTimingBlock('N3', 'knowledge')?.block).toBe('reading');
  });

  it('prevents reopening sealed or future blocks in official mode', () => {
    expect(canOpenSectionInOfficialMode('N2', 'reading', 'knowledge', [])).toBe(true);
    expect(canOpenSectionInOfficialMode('N2', 'listening', 'knowledge', [])).toBe(false);
    expect(
      canOpenSectionInOfficialMode('N2', 'knowledge', 'listening', ['knowledge', 'reading']),
    ).toBe(false);
    expect(canOpenSectionInOfficialMode('N3', 'knowledge', 'reading', ['knowledge'])).toBe(false);
  });

  it('applies admin timing overrides to both combined sections', () => {
    const config: JlptTimingConfig = {
      N2: [{ block: 'language_reading', officialMinutes: 90, simulationMinutes: 30 }],
    };
    const ordered = resolveTimingSpecs('N2', config);
    expect(ordered[0].officialMinutes).toBe(90);
    expect(getSectionDurationSeconds('N2', 'knowledge', true, config)).toBe(90 * 60);
    expect(getSectionDurationSeconds('N2', 'reading', false, config)).toBe(30 * 60);
    expect(getTotalExamSeconds('N2', true, config)).toBe((90 + 50) * 60);
  });

  it('exposes default admin configs for every level', () => {
    expect(getDefaultTimingConfig('N2')).toEqual([
      { block: 'language_reading', officialMinutes: 105, simulationMinutes: 45 },
      { block: 'listening', officialMinutes: 50, simulationMinutes: 20 },
    ]);
    expect(getDefaultTimingConfig('N1')[0].officialMinutes).toBe(110);
    expect(getDefaultTimingConfig('N5')).toHaveLength(3);
  });

  it('computes full official exam totals', () => {
    expect(getTotalExamSeconds('N2', true)).toBe((105 + 50) * 60);
    expect(getTotalExamSeconds('N1', true)).toBe((110 + 60) * 60);
    expect(getTotalExamSeconds('N5', true)).toBe((20 + 40 + 30) * 60);
  });
});
