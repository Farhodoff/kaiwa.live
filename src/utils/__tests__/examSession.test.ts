import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearExamDraft,
  countExamAnswers,
  examDraftKey,
  readExamDraft,
  saveExamDraft,
  secondsUntil,
  type ExamDraft,
} from '../examSession';
const makeDraft = (owner = 'student-a'): ExamDraft => ({
  version: 2,
  owner,
  exam: {
    id: 'random-n3',
    title: 'Saved variant',
    description: null,
    type: 'JLPT N3',
    level: 'N3',
    isFromDb: false,
    timeLimitSeconds: 60,
    questions: [
      {
        id: 7,
        section: 'knowledge',
        questionText: 'Original question',
        options: ['a', 'b'],
        correctAnswer: 1,
        explanationUzbek: 'Explanation',
      },
    ],
  },
  answers: {},
  flags: [7],
  activeSection: 'knowledge',
  sealedSections: [],
  mode: 'practice',
  fullTime: false,
  timingConfig: {},
  deadline: 200000,
  startedAt: 140000,
  sectionDuration: 60,
  syntheticListening: false,
});
describe('Exam session persistence and scoring', () => {
  beforeEach(() => localStorage.clear());
  it('saves before the first answer and retains the exact question snapshot', () => {
    const draft = makeDraft();
    expect(saveExamDraft(draft)).toBe(true);
    expect(readExamDraft('student-a')).toEqual(draft);
    draft.exam.questions[0].questionText = 'Regenerated question';
    expect(readExamDraft('student-a')?.exam.questions[0].questionText).toBe('Original question');
  });
  it('isolates accounts and does not adopt an unowned legacy draft', () => {
    saveExamDraft(makeDraft());
    localStorage.setItem('jlpt_mock_exam_draft_v1', JSON.stringify(makeDraft()));
    expect(readExamDraft('student-b')).toBeNull();
    saveExamDraft(makeDraft('student-b'));
    clearExamDraft('student-a');
    expect(readExamDraft('student-a')).toBeNull();
    expect(readExamDraft('student-b')?.owner).toBe('student-b');
  });
  it('rejects corrupted data and answer indexes outside the saved options', () => {
    localStorage.setItem(examDraftKey('student-a'), '{');
    expect(readExamDraft('student-a')).toBeNull();
    saveExamDraft({ ...makeDraft(), answers: { 7: 99 } });
    expect(readExamDraft('student-a')).toBeNull();
    localStorage.setItem(
      examDraftKey('student-a'),
      JSON.stringify({ ...makeDraft(), owner: 'other' }),
    );
    expect(readExamDraft('student-a')).toBeNull();
  });
  it('uses elapsed wall time, including time spent away and expired deadlines', () => {
    expect(secondsUntil(200000, 140000)).toBe(60);
    expect(secondsUntil(200000, 199100)).toBe(1);
    expect(secondsUntil(200000, 250000)).toBe(0);
  });
  it('separates correct, incorrect and unanswered responses without counting extra ids', () => {
    const questions = [1, 2, 3, 4].map((id) => ({ id, correctAnswer: 1, options: ['a', 'b'] }));
    expect(countExamAnswers(questions, { 1: 1, 2: 0, 3: 99, 999: 1 })).toEqual({
      correct: 1,
      wrong: 1,
      skipped: 2,
      total: 4,
    });
  });
});
