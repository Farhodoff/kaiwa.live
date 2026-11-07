import { afterEach, describe, expect, it } from 'vitest';
import { TimedSkillAssessmentService } from '../TimedSkillAssessmentService';

describe('TimedSkillAssessmentService', () => {
  afterEach(() => localStorage.clear());

  it('records accuracy, duration, skips and recent progress from actual attempts', () => {
    TimedSkillAssessmentService.record({
      level: 'N3',
      skill: 'grammar',
      questionId: 'a',
      correct: true,
      skipped: false,
      durationMs: 4000,
    });
    TimedSkillAssessmentService.record({
      level: 'N3',
      skill: 'grammar',
      questionId: 'b',
      correct: false,
      skipped: false,
      durationMs: 8000,
    });
    TimedSkillAssessmentService.record({
      level: 'N3',
      skill: 'grammar',
      questionId: 'c',
      correct: false,
      skipped: true,
      durationMs: 0,
    });
    const grammar = TimedSkillAssessmentService.summarize().find(
      (summary) => summary.skill === 'grammar',
    )!;
    expect(grammar).toMatchObject({
      attempts: 3,
      accuracy: 50,
      averageDurationMs: 6000,
      skipped: 1,
      recentAccuracy: 50,
    });
  });

  it('marks skills without attempts as insufficient data', () => {
    const reading = TimedSkillAssessmentService.summarize().find(
      (summary) => summary.skill === 'reading',
    )!;
    expect(reading.accuracy).toBeNull();
    expect(reading.averageDurationMs).toBeNull();
  });
});
