import { describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  ContentAuditQuestionInput,
  ContentQualityAuditService,
} from '../ContentQualityAuditService';

const question = (
  overrides: Partial<ContentAuditQuestionInput> & Pick<ContentAuditQuestionInput, 'id' | 'level'>,
): ContentAuditQuestionInput => ({
  questionText: `Question ${overrides.id}`,
  options: ['A', 'B', 'C', 'D'],
  correctAnswer: 0,
  explanation: 'Izoh',
  status: 'draft',
  ...overrides,
});

describe('ContentQualityAuditService', () => {
  it('1. classifies vocabulary, grammar, kanji, reading and listening from type and section', () => {
    expect(ContentQualityAuditService.classifySkill({ rawType: 'vocabulary_meaning' })).toBe(
      'vocabulary',
    );
    expect(ContentQualityAuditService.classifySkill({ rawType: 'synonym_nuance' })).toBe(
      'vocabulary',
    );
    expect(ContentQualityAuditService.classifySkill({ rawType: 'kanji_reading' })).toBe('kanji');
    expect(ContentQualityAuditService.classifySkill({ rawType: 'grammar_fill_blank' })).toBe(
      'grammar',
    );
    expect(ContentQualityAuditService.classifySkill({ rawType: 'sentence_ordering' })).toBe(
      'grammar',
    );
    expect(ContentQualityAuditService.classifySkill({ rawType: 'reading_detail' })).toBe('reading');
    expect(ContentQualityAuditService.classifySkill({ rawType: 'listening_intention' })).toBe(
      'listening',
    );
    expect(
      ContentQualityAuditService.classifySkill({ sectionType: '聴解 (Listening)', rawType: null }),
    ).toBe('listening');
  });

  it('2. produces N3–N1 skill and workflow counts with published taking precedence', () => {
    const report = ContentQualityAuditService.buildReport(
      [
        question({
          id: 'q1',
          level: 'N3',
          skill: 'vocabulary',
          status: 'approved',
          examPublished: true,
        }),
        question({ id: 'q2', level: 'N3', skill: 'grammar', status: 'draft' }),
        question({
          id: 'q3',
          level: 'N3',
          skill: 'reading',
          status: 'review',
          passageText: 'matn',
        }),
        question({ id: 'q4', level: 'N2', skill: 'kanji', status: 'approved' }),
        question({
          id: 'q5',
          level: 'N1',
          skill: 'listening',
          status: 'rejected',
          audioUrl: '/a.mp3',
        }),
      ],
      [],
      { generatedAt: '2026-10-24T00:00:00.000Z' },
    );

    expect(report.levels.map((level) => level.level)).toEqual(['N3', 'N2', 'N1', 'N4', 'N5']);
    const n3 = report.levels.find((l) => l.level === 'N3')!;
    expect(n3.totalQuestions).toBe(3);
    expect(n3.skillCounts).toMatchObject({ vocabulary: 1, grammar: 1, reading: 1 });
    expect(n3.statusCounts).toMatchObject({
      draft: 1,
      review: 1,
      approved: 0,
      published: 1,
      rejected: 0,
    });
    expect(report.totals.statusCounts).toMatchObject({
      draft: 1,
      review: 1,
      approved: 1,
      published: 1,
      rejected: 1,
    });
    expect(report.totals.totalQuestions).toBe(5);
  });

  it('3. counts missing fields per level, including reading passage and listening audio requirements', () => {
    const report = ContentQualityAuditService.buildReport([
      question({
        id: 'missing-options',
        level: 'N3',
        skill: 'vocabulary',
        options: [],
        explanation: '',
      }),
      question({
        id: 'missing-passage',
        level: 'N3',
        skill: 'reading',
        passageText: '',
        passageId: null,
      }),
      question({
        id: 'missing-audio',
        level: 'N3',
        skill: 'listening',
        audioUrl: '',
        listeningAudioId: null,
      }),
      question({
        id: 'complete',
        level: 'N3',
        skill: 'grammar',
      }),
    ]);

    const n3 = report.levels[0];
    expect(n3.missingFields.options).toBe(1);
    expect(n3.missingFields.explanation).toBe(1);
    expect(n3.missingFields.passage).toBe(1);
    expect(n3.missingFields.audio).toBe(1);
    expect(n3.missingFieldTotal).toBe(3);
  });

  it('4. detects duplicate questions after normalizing punctuation and whitespace', () => {
    const report = ContentQualityAuditService.buildReport([
      question({ id: 'd1', level: 'N3', questionText: '「同じ」問題 を選んでください。' }),
      question({ id: 'd2', level: 'N3', questionText: '同じ 問題を選んでください' }),
      question({ id: 'd3', level: 'N3', questionText: 'まったく別の問題' }),
      question({ id: 'd4', level: 'N2', questionText: '「同じ」問題 を選んでください。' }),
    ]);

    const n3 = report.levels.find((level) => level.level === 'N3')!;
    expect(n3.duplicateGroups).toHaveLength(1);
    expect(n3.duplicateGroups[0].questionIds).toEqual(['d1', 'd2']);
    expect(n3.duplicateQuestionCount).toBe(2);
    expect(report.levels.find((level) => level.level === 'N2')!.duplicateQuestionCount).toBe(0);
  });

  it('5. reports listening audio availability separately per level', () => {
    const report = ContentQualityAuditService.buildReport([
      question({ id: 'a1', level: 'N3', skill: 'listening', audioUrl: '/audio/1.mp3' }),
      question({ id: 'a2', level: 'N3', skill: 'listening', audioUrl: '' }),
      question({ id: 'a3', level: 'N3', skill: 'listening', listeningAudioId: 'audio-1' }),
      question({ id: 'a4', level: 'N2', skill: 'listening', audioUrl: '/audio/2.mp3' }),
    ]);

    expect(report.levels[0].audio).toEqual({
      listeningTotal: 3,
      withAudio: 2,
      missingAudio: 1,
      availabilityPercent: 67,
    });
    expect(report.levels[1].audio.availabilityPercent).toBe(100);
  });

  it('6. computes skill coverage for every level', () => {
    const report = ContentQualityAuditService.buildReport([
      ...(['vocabulary', 'grammar', 'kanji', 'reading', 'listening'] as const).map((skill, i) =>
        question({
          id: `n3-${i}`,
          level: 'N3',
          skill,
          passageText: skill === 'reading' ? 'matn' : undefined,
          audioUrl: skill === 'listening' ? '/a.mp3' : undefined,
        }),
      ),
      question({ id: 'n2-1', level: 'N2', skill: 'grammar' }),
    ]);

    expect(report.levels[0].coveredSkills).toBe(5);
    expect(report.levels[0].coveragePercent).toBe(100);
    expect(report.levels[1].coveredSkills).toBe(1);
    expect(report.levels[1].coveragePercent).toBe(20);
    expect(report.levels[2].coveragePercent).toBe(0);
    expect(report.totals.coveragePercent).toBe(24);
  });

  it('7. ranks the most error-prone questions by wrong count and exposes level lists', () => {
    const report = ContentQualityAuditService.buildReport(
      [
        question({ id: 'q1', level: 'N3', skill: 'grammar', examTitle: 'JLPT N3 Mock' }),
        question({ id: 'q2', level: 'N2', skill: 'reading', passageText: 'matn' }),
        question({ id: 'q3', level: 'N1', skill: 'vocabulary' }),
      ],
      [
        { questionId: 'q1', isCorrect: false },
        { questionId: 'q1', isCorrect: false },
        { questionId: 'q1', isCorrect: true },
        { questionId: 'q2', isCorrect: false },
        { questionId: 'q2', isCorrect: true },
        { questionId: 'q2', isCorrect: true },
        { questionId: 'q3', isCorrect: true },
        { questionId: 'unknown', isCorrect: false },
      ],
      { errorStatsAvailable: true },
    );

    expect(report.topErrorQuestions).toHaveLength(2);
    expect(report.topErrorQuestions[0]).toMatchObject({
      questionId: 'q1',
      attempts: 3,
      wrongCount: 2,
      accuracy: 33,
      errorRate: 67,
      examTitle: 'JLPT N3 Mock',
    });
    expect(report.topErrorQuestions[1]).toMatchObject({
      questionId: 'q2',
      attempts: 3,
      wrongCount: 1,
      errorRate: 33,
    });
    expect(
      report.levels.find((l) => l.level === 'N3')?.topErrorQuestions.map((item) => item.questionId),
    ).toEqual(['q1']);
    expect(
      report.levels.find((l) => l.level === 'N2')?.topErrorQuestions.map((item) => item.questionId),
    ).toEqual(['q2']);
    expect(report.levels.find((l) => l.level === 'N1')?.topErrorQuestions).toEqual([]);
  });

  it('8. exports a complete JSON and CSV audit report', () => {
    const report = ContentQualityAuditService.buildReport(
      [
        question({
          id: 'export-1',
          level: 'N3',
          skill: 'listening',
          audioUrl: '',
          status: 'approved',
          questionText: '音声を聞いて答えてください',
        }),
      ],
      [{ questionId: 'export-1', isCorrect: false }],
    );

    const json = ContentQualityAuditService.toJSON(report);
    const parsed = JSON.parse(json);
    const n3Level = parsed.levels.find((l: any) => l.level === 'N3');
    expect(n3Level.level).toBe('N3');
    expect(n3Level.missingFields.audio).toBe(1);
    expect(parsed.topErrorQuestions[0].questionId).toBe('export-1');

    const csv = ContentQualityAuditService.toCSV(report);
    expect(csv).toContain('"Workflow holati","N3","approved","1"');
    expect(csv).toContain('"Missing field","N3","audio","1"');
    expect(csv).toContain('"Xato savol","N3","export-1"');
  });

  it('9. supports completeness tracking and truncation warning in buildReport', () => {
    const report = ContentQualityAuditService.buildReport(
      [question({ id: 'q1', level: 'N3', skill: 'vocabulary' })],
      [],
      {
        completeness: {
          questions: { fetched: 1000, total: 1500, isTruncated: true },
          exams: { fetched: 10, total: 10, isTruncated: false },
        },
        warnings: ['Savollar soni limitdan oshib ketdi'],
      },
    );

    expect(report.completeness?.questions.isTruncated).toBe(true);
    expect(report.completeness?.questions.total).toBe(1500);
    expect(report.warnings).toContain('Savollar soni limitdan oshib ketdi');
  });

  it('10. fetchPagedTable paginates through multiple chunks seamlessly', async () => {
    let callCount = 0;
    const mockFrom = vi.spyOn(supabase, 'from').mockImplementation(() => {
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockImplementation((from: number) => {
            callCount++;
            if (from === 0) {
              return Promise.resolve({
                data: Array.from({ length: 100 }, (_, i) => ({ id: `q-${i}` })),
                count: 150,
                error: null,
              });
            } else {
              return Promise.resolve({
                data: Array.from({ length: 50 }, (_, i) => ({ id: `q-${100 + i}` })),
                count: 150,
                error: null,
              });
            }
          }),
        }),
      } as any;
    });

    const result = await ContentQualityAuditService.fetchPagedTable('exam_questions', '*', {
      pageSize: 100,
      maxRows: 1000,
    });

    expect(callCount).toBe(2);
    expect(result.data.length).toBe(150);
    expect(result.totalCount).toBe(150);
    expect(result.isTruncated).toBe(false);
    expect(result.error).toBeNull();

    mockFrom.mockRestore();
  });

  it('11. fetchPagedTable marks isTruncated when totalCount exceeds maxRows limit', async () => {
    const mockFrom = vi.spyOn(supabase, 'from').mockImplementation(() => {
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockImplementation(() => {
            return Promise.resolve({
              data: Array.from({ length: 50 }, (_, i) => ({ id: `ans-${i}` })),
              count: 200,
              error: null,
            });
          }),
        }),
      } as any;
    });

    const result = await ContentQualityAuditService.fetchPagedTable('exam_answers', '*', {
      pageSize: 50,
      maxRows: 50, // Capped at 50
    });

    expect(result.data.length).toBe(50);
    expect(result.totalCount).toBe(200);
    expect(result.isTruncated).toBe(true);

    mockFrom.mockRestore();
  });
});
