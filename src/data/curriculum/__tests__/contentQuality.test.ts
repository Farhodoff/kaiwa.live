import { describe, expect, it } from 'vitest';
import { auditCurriculumContent, quarantineInvalidExercises } from '../contentQuality';
import { JAPANESE_N1_LESSONS } from '../japaneseN1';
import { JAPANESE_N2_LESSONS } from '../japaneseN2';
import { JAPANESE_N3_LESSONS } from '../japaneseN3';
import type { Lesson } from '../../../types/lesson';

describe('curriculum content quality', () => {
  it('quarantines generated placeholder distractors without discarding valid exercises', () => {
    const lessons: Lesson[] = [
      {
        id: 'fixture',
        courseId: 'ja',
        unitId: 'u1',
        unitTitle: 'Fixture',
        language: 'ja',
        level: 'N3',
        lessonNumber: 1,
        title: 'Fixture',
        description: 'Fixture',
        estimatedDurationMinutes: 5,
        steps: [
          {
            id: 'practice',
            title: 'Practice',
            type: 'practice',
            estimatedMinutes: 5,
            practiceData: {
              instructions: 'Choose.',
              exercises: [
                {
                  id: 'valid',
                  type: 'multiple-choice',
                  prompt: '正しい文を選んでください。',
                  options: ['正しい文です。', '誤った文です。'],
                  correctAnswer: 0,
                  explanation: '文脈に合っています。',
                },
                {
                  id: 'placeholder',
                  type: 'multiple-choice',
                  prompt: '受け身を選んでください。',
                  options: ['褒められました。', '文脈に合わない表現'],
                  correctAnswer: 0,
                  explanation: '受け身です。',
                },
              ],
            },
          },
        ],
      },
    ];
    const report = auditCurriculumContent(lessons);
    expect(report.totals.quarantined).toBe(1);
    expect(report.levels.N3.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'placeholder_option' })]),
    );
    expect(
      quarantineInvalidExercises(lessons)[0].steps[0].practiceData?.exercises.map(
        (item) => item.id,
      ),
    ).toEqual(['valid']);
  });

  it('keeps published advanced lessons free of quarantined practice items', () => {
    for (const lessons of [JAPANESE_N3_LESSONS, JAPANESE_N2_LESSONS, JAPANESE_N1_LESSONS]) {
      expect(auditCurriculumContent(lessons).totals.quarantined).toBe(0);
    }
  });
});
