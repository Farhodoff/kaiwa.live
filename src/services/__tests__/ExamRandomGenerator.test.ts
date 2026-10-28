import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExamService } from '../ExamService';
import type { ExamQuestion } from '../../data/jlptMockExamData';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const NOW = 1_800_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

const makeQuestion = (
  originalId: string,
  section: ExamQuestion['section'],
  id: number = 1,
): ExamQuestion => ({
  id,
  originalId,
  section,
  questionText: `${section} ${originalId}`,
  options: ['A', 'B', 'C', 'D'],
  correctAnswer: 0,
  explanationUzbek: 'Izoh',
});

describe('ExamService randomized mock exam generator', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps original IDs stable while assigning separate display numbers', async () => {
    const exam = await ExamService.getExamWithQuestions('builtin_n5');

    expect(exam.questions.length).toBeGreaterThan(0);
    expect(exam.questions[0].originalId).toBe('101');
    expect(exam.questions[0].displayNumber).toBe(1);
    expect(exam.questions[0].id).toBe(1);
    expect(exam.questions[1].originalId).toBe('102');
    expect(exam.questions[1].displayNumber).toBe(2);
  });

  it('builds a full 25-question exam from the bundled sets without warnings', () => {
    const exam = ExamService.buildRandomizedExam('N5', {
      noRepeatPeriodDays: 0,
      random: () => 0.5,
    });

    const originalIds = exam.questions.map((question) => question.originalId);
    expect(exam.questions).toHaveLength(25);
    expect(new Set(originalIds).size).toBe(25);
    expect(exam.questions.map((question) => question.displayNumber)).toEqual(
      Array.from({ length: 25 }, (_, idx) => idx + 1),
    );
    expect(exam.generationWarnings).toEqual([]);
  });

  it('never produces duplicate original IDs inside one randomized exam', () => {
    const pool = [
      makeQuestion('dup-1', 'knowledge', 1),
      makeQuestion('dup-1', 'knowledge', 2),
      makeQuestion('unique-2', 'knowledge', 3),
    ];

    const exam = ExamService.buildRandomizedExam('N5', {
      questionPool: pool,
      noRepeatPeriodDays: 0,
      random: () => 0.5,
      targetCounts: { knowledge: 5, reading: 0, listening: 0 },
    });

    const originalIds = exam.questions.map((question) => question.originalId);
    expect(originalIds).toEqual(['dup-1', 'unique-2']);
    expect(new Set(originalIds).size).toBe(originalIds.length);
    expect(exam.generationWarnings?.join(' ')).toContain('takroriy savol');
  });

  it('avoids questions answered inside the configured no-repeat period', () => {
    const pool = Array.from({ length: 10 }, (_, idx) =>
      makeQuestion(`knowledge-${idx + 1}`, 'knowledge', idx + 1),
    );
    const recentAnswered = Array.from({ length: 5 }, (_, idx) => ({
      originalId: `knowledge-${idx + 1}`,
      answeredAt: NOW - DAY_MS,
    }));

    const exam = ExamService.buildRandomizedExam('N5', {
      questionPool: pool,
      recentAnswered,
      now: NOW,
      noRepeatPeriodDays: 30,
      random: () => 0.5,
      targetCounts: { knowledge: 5, reading: 0, listening: 0 },
    });

    expect(exam.questions.map((question) => question.originalId).sort()).toEqual([
      'knowledge-10',
      'knowledge-6',
      'knowledge-7',
      'knowledge-8',
      'knowledge-9',
    ]);
    expect(exam.generationWarnings?.join(' ')).not.toContain('so‘nggi');
    expect(exam.generationWarnings?.join(' ')).not.toContain("so'nggi");
  });

  it('starts reusing questions once the configurable no-repeat period has passed', () => {
    const pool = Array.from({ length: 5 }, (_, idx) =>
      makeQuestion(`old-${idx + 1}`, 'knowledge', idx + 1),
    );
    const recentAnswered = Array.from({ length: 5 }, (_, idx) => ({
      originalId: `old-${idx + 1}`,
      answeredAt: NOW - 40 * DAY_MS,
    }));

    const outsidePeriod = ExamService.buildRandomizedExam('N5', {
      questionPool: pool,
      recentAnswered,
      now: NOW,
      noRepeatPeriodDays: 30,
      random: () => 0.5,
      targetCounts: { knowledge: 5, reading: 0, listening: 0 },
    });
    expect(outsidePeriod.generationWarnings?.join(' ')).not.toContain("so'nggi");

    const insidePeriod = ExamService.buildRandomizedExam('N5', {
      questionPool: pool,
      recentAnswered,
      now: NOW,
      noRepeatPeriodDays: 60,
      random: () => 0.5,
      targetCounts: { knowledge: 5, reading: 0, listening: 0 },
    });
    expect(insidePeriod.generationWarnings?.join(' ')).toContain("so'nggi 60 kun");
  });

  it('warns clearly when there are not enough questions to build the exam', () => {
    const pool = [makeQuestion('only-1', 'knowledge', 1), makeQuestion('only-2', 'reading', 2)];

    const exam = ExamService.buildRandomizedExam('N5', {
      questionPool: pool,
      noRepeatPeriodDays: 0,
      random: () => 0.5,
      targetCounts: { knowledge: 3, reading: 2, listening: 1 },
    });

    expect(exam.questions).toHaveLength(2);
    const warnings = exam.generationWarnings?.join(' ') || '';
    expect(warnings).toContain('6 ta savol kerak edi');
    expect(warnings).toContain('faqat 2 ta mavjud');
    expect(warnings).toContain('knowledge: 1/3');
    expect(warnings).toContain('listening: 0/1');
  });

  it('records answered questions by original ID, never by display number', () => {
    ExamService.recordAnsweredQuestions(['db-uuid-1', 'db-uuid-2']);

    const records = ExamService.getAnsweredQuestionRecords();
    expect(records.map((record) => record.originalId).sort()).toEqual(['db-uuid-1', 'db-uuid-2']);
    expect(localStorage.getItem('jlpt_answered_questions_v2')).toContain('db-uuid-1');
    expect(localStorage.getItem('jlpt_recent_answered_qids')).toBeNull();
  });

  it('migrates legacy numeric answer history into original-ID records', () => {
    localStorage.setItem('jlpt_recent_answered_qids', JSON.stringify([101, 102]));

    const records = ExamService.getAnsweredQuestionRecords(NOW);
    expect(records.map((record) => record.originalId).sort()).toEqual(['101', '102']);
    expect(localStorage.getItem('jlpt_recent_answered_qids')).toBeNull();
  });
});
