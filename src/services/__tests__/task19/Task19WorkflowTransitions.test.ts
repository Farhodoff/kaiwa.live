/// <reference types="node" />
/**
 * Task 19 — strict workflow transitions at the service layer.
 *
 * Covers the complete exam and question transition matrices:
 *  - every allowed transition succeeds and is audited
 *  - every forbidden transition throws a precise error and writes nothing
 *  - role requirements (reviewer vs admin) are enforced
 *  - direct database bypass is blocked by SQL triggers / RLS
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

vi.mock('../../../lib/supabase', async () => {
  const mod = await import('../../../utils/fakeSupabase');
  return { supabase: mod.fakeSupabase };
});

import { fakeSupabase } from '../../../utils/fakeSupabase';
import { ExamWorkflowService } from '../../ExamWorkflowService';
import {
  EXAM_TRANSITIONS,
  QUESTION_TRANSITIONS,
  canTransitionExam,
  canTransitionQuestion,
  allowedExamTransitions,
  allowedQuestionTransitions,
  assertExamTransition,
  assertQuestionTransition,
  type ExamWorkflowStatus,
  type QuestionWorkflowStatus,
} from '../../../utils/examWorkflowTransitions';

const ADMIN = 'fsoyilov@gmail.com';
const REVIEWER = 'reviewer@example.com';

const EXAM_STATUSES: ExamWorkflowStatus[] = [
  'draft',
  'review',
  'approved',
  'published',
  'archived',
];
const QUESTION_STATUSES: QuestionWorkflowStatus[] = ['draft', 'review', 'approved', 'rejected'];

const ALLOWED_EXAM_PAIRS: Array<[ExamWorkflowStatus, ExamWorkflowStatus]> = [
  ['draft', 'review'],
  ['review', 'draft'],
  ['review', 'approved'],
  ['approved', 'published'],
  ['published', 'archived'],
  ['archived', 'draft'],
];

const ALLOWED_QUESTION_PAIRS: Array<[QuestionWorkflowStatus, QuestionWorkflowStatus]> = [
  ['draft', 'review'],
  ['review', 'approved'],
  ['review', 'rejected'],
  ['rejected', 'draft'],
];

const FORBIDDEN_EXAM_PAIRS = EXAM_STATUSES.flatMap((from) =>
  EXAM_STATUSES.filter((to) => to !== from).map((to) => [from, to] as const),
).filter(([from, to]) => !ALLOWED_EXAM_PAIRS.some(([f, t]) => f === from && t === to));

const FORBIDDEN_QUESTION_PAIRS = QUESTION_STATUSES.flatMap((from) =>
  QUESTION_STATUSES.filter((to) => to !== from).map((to) => [from, to] as const),
).filter(([from, to]) => !ALLOWED_QUESTION_PAIRS.some(([f, t]) => f === from && t === to));

function seedExam(status: ExamWorkflowStatus, isPublished = status === 'published'): string {
  const examId = 'exam-t19';
  fakeSupabase.__seed('exams', [
    {
      id: examId,
      title: 'Task 19 exam',
      type: 'JLPT N3',
      status,
      is_published: isPublished,
      license_type: 'original',
      copyright_confirmed: true,
      source_name: 'Kaiwa Live',
      source_url: null,
      author: 'Kaiwa Live',
      is_official_jlpt: false,
    },
  ]);
  fakeSupabase.__seed('exam_sections', [
    { id: 'sec-t19', exam_id: examId, title: 'knowledge', type: 'knowledge' },
  ]);
  fakeSupabase.__seed('exam_questions', [
    {
      id: 'q-t19',
      section_id: 'sec-t19',
      question_text: 'Task 19 savoli?',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'A',
      status: 'approved',
    },
  ]);
  fakeSupabase.__seed('exam_workflow_events', []);
  return examId;
}

function seedQuestion(status: QuestionWorkflowStatus, id = 'q-only'): string {
  fakeSupabase.__seed('exam_sections', [{ id: 'sec-only', exam_id: 'exam-only', title: 'k' }]);
  fakeSupabase.__seed('exam_questions', [
    {
      id,
      section_id: 'sec-only',
      question_text: 'Savol?',
      options: ['A', 'B'],
      correct_answer: 'A',
      status,
    },
  ]);
  fakeSupabase.__seed('exam_workflow_events', []);
  return id;
}

const currentExamStatus = () => fakeSupabase.__table('exams')[0].status;
const events = () => fakeSupabase.__table('exam_workflow_events');

beforeEach(() => {
  fakeSupabase.__reset();
  fakeSupabase.__setUser({
    id: 'admin-1',
    email: ADMIN,
    user_metadata: { full_name: 'Admin' },
  });
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Task 19 · transition matrix definitions', () => {
  it('defines exactly the six allowed exam transitions', () => {
    expect(EXAM_TRANSITIONS).toEqual({
      draft: ['review'],
      review: ['draft', 'approved'],
      approved: ['published'],
      published: ['archived'],
      archived: ['draft'],
    });
  });

  it('defines exactly the allowed question transitions', () => {
    expect(QUESTION_TRANSITIONS).toEqual({
      draft: ['review'],
      review: ['approved', 'rejected'],
      rejected: ['draft'],
      approved: [],
    });
  });

  it('allows every allowed exam pair and rejects every other pair', () => {
    for (const from of EXAM_STATUSES) {
      for (const to of EXAM_STATUSES) {
        const expected = ALLOWED_EXAM_PAIRS.some(([f, t]) => f === from && t === to);
        expect(canTransitionExam(from, to)).toBe(expected);
      }
    }
  });

  it('allows every allowed question pair and rejects every other pair', () => {
    for (const from of QUESTION_STATUSES) {
      for (const to of QUESTION_STATUSES) {
        const expected = ALLOWED_QUESTION_PAIRS.some(([f, t]) => f === from && t === to);
        expect(canTransitionQuestion(from, to)).toBe(expected);
      }
    }
  });

  it('assertExamTransition throws a precise message for each forbidden pair', () => {
    for (const [from, to] of FORBIDDEN_EXAM_PAIRS) {
      expect(() => assertExamTransition(from, to)).toThrow(
        new RegExp(`Noto‘g‘ri exam status o‘tishi: "${from}" → "${to}"`),
      );
    }
  });

  it('assertQuestionTransition throws a precise message for each forbidden pair', () => {
    for (const [from, to] of FORBIDDEN_QUESTION_PAIRS) {
      expect(() => assertQuestionTransition(from, to)).toThrow(
        new RegExp(`Noto‘g‘ri savol status o‘tishi: "${from}" → "${to}"`),
      );
    }
  });

  it('lists the allowed next states for dashboards', () => {
    expect(allowedExamTransitions('draft')).toEqual(['review']);
    expect(allowedExamTransitions('approved')).toEqual(['published']);
    expect(allowedQuestionTransitions('review')).toEqual(['approved', 'rejected']);
    expect(allowedQuestionTransitions('approved')).toEqual([]);
  });
});

describe('Task 19 · every allowed exam transition succeeds and is audited', () => {
  for (const [from, to] of ALLOWED_EXAM_PAIRS) {
    it(`${from} -> ${to}`, async () => {
      const examId = seedExam(from);
      const role =
        to === 'published' || to === 'archived' || from === 'archived' ? 'admin' : 'reviewer';
      const email = role === 'admin' ? ADMIN : REVIEWER;

      const res = await ExamWorkflowService.transitionExamStatus(
        examId,
        to,
        email,
        undefined,
        role,
      );

      expect(res.success).toBe(true);
      expect(currentExamStatus()).toBe(to);
      expect(fakeSupabase.__table('exams')[0].is_published).toBe(to === 'published');

      const logged = events().filter((e) => e.entity_type === 'exam');
      expect(logged).toHaveLength(1);
      expect(logged[0]).toMatchObject({
        entity_id: examId,
        from_status: from,
        to_status: to,
        actor_email: email,
        actor_role: role,
      });
    });
  }
});

describe('Task 19 · every forbidden exam transition is rejected', () => {
  for (const [from, to] of FORBIDDEN_EXAM_PAIRS) {
    it(`${from} -> ${to}`, async () => {
      const examId = seedExam(from);

      await expect(
        ExamWorkflowService.transitionExamStatus(examId, to, ADMIN, undefined, 'admin'),
      ).rejects.toThrow(new RegExp(`Noto‘g‘ri exam status o‘tishi: "${from}" → "${to}"`));

      expect(currentExamStatus()).toBe(from);
      expect(fakeSupabase.__table('exams')[0].is_published).toBe(from === 'published');
      expect(events()).toHaveLength(0);
    });
  }

  it('rejects a same-status no-op transition', async () => {
    const examId = seedExam('draft');
    await expect(
      ExamWorkflowService.transitionExamStatus(examId, 'draft', ADMIN, undefined, 'admin'),
    ).rejects.toThrow(/Noto‘g‘ri exam status o‘tishi/);
    expect(events()).toHaveLength(0);
  });

  it('rejects an unknown target status', async () => {
    const examId = seedExam('draft');
    await expect(
      ExamWorkflowService.transitionExamStatus(
        examId,
        'live' as ExamWorkflowStatus,
        ADMIN,
        undefined,
        'admin',
      ),
    ).rejects.toThrow(/Noma'lum exam maqsad holati/);
  });

  it('rejects a missing exam', async () => {
    fakeSupabase.__seed('exams', []);
    await expect(
      ExamWorkflowService.transitionExamStatus('missing', 'review', ADMIN, undefined, 'admin'),
    ).rejects.toThrow(/topilmadi/i);
  });
});

describe('Task 19 · exam role enforcement', () => {
  it('allows a reviewer to move draft -> review', async () => {
    const examId = seedExam('draft');
    await expect(
      ExamWorkflowService.transitionExamStatus(examId, 'review', REVIEWER, undefined, 'reviewer'),
    ).resolves.toMatchObject({ success: true });
  });

  it('allows a reviewer to approve a review', async () => {
    const examId = seedExam('review');
    await expect(
      ExamWorkflowService.transitionExamStatus(examId, 'approved', REVIEWER, undefined, 'reviewer'),
    ).resolves.toMatchObject({ success: true });
  });

  it('blocks a reviewer from archiving a published exam', async () => {
    const examId = seedExam('published');
    await expect(
      ExamWorkflowService.transitionExamStatus(examId, 'archived', REVIEWER, undefined, 'reviewer'),
    ).rejects.toThrow(/faqat admin uchun ruxsat etilgan/);
    expect(currentExamStatus()).toBe('published');
  });

  it('blocks a reviewer from restoring an archived exam', async () => {
    const examId = seedExam('archived');
    await expect(
      ExamWorkflowService.transitionExamStatus(examId, 'draft', REVIEWER, undefined, 'reviewer'),
    ).rejects.toThrow(/faqat admin uchun ruxsat etilgan/);
  });

  it('blocks an anonymous actor from any transition', async () => {
    const examId = seedExam('draft');
    await expect(
      ExamWorkflowService.transitionExamStatus(examId, 'review', undefined, undefined, undefined),
    ).rejects.toThrow(/reviewer yoki admin roli talab qilinadi/);
    expect(currentExamStatus()).toBe('draft');
    expect(events()).toHaveLength(0);
  });

  it('keeps the admin-only publish error even from a draft status', async () => {
    const examId = seedExam('draft');
    await expect(
      ExamWorkflowService.transitionExamStatus(
        examId,
        'published',
        REVIEWER,
        undefined,
        'reviewer',
      ),
    ).rejects.toThrow(/faqat admin/i);
  });
});

describe('Task 19 · question transitions', () => {
  for (const [from, to] of ALLOWED_QUESTION_PAIRS) {
    it(`allows ${from} -> ${to} and audits it`, async () => {
      const questionId = seedQuestion(from);
      const comment = to === 'rejected' ? 'Tuzatish kerak.' : undefined;

      const res = await ExamWorkflowService.transitionQuestionStatus(
        questionId,
        to,
        REVIEWER,
        comment,
        'reviewer',
      );

      expect(res.success).toBe(true);
      const q = fakeSupabase.__table('exam_questions')[0];
      expect(q.status).toBe(to);
      if (to === 'rejected') {
        expect(q.rejection_comment).toBe('Tuzatish kerak.');
      }

      const logged = events().filter((e) => e.entity_type === 'question');
      expect(logged).toHaveLength(1);
      expect(logged[0]).toMatchObject({
        entity_id: questionId,
        from_status: from,
        to_status: to,
        actor_email: REVIEWER,
      });
    });
  }

  for (const [from, to] of FORBIDDEN_QUESTION_PAIRS) {
    it(`rejects ${from} -> ${to}`, async () => {
      const questionId = seedQuestion(from);
      const comment = to === 'rejected' ? 'Sabab.' : undefined;

      await expect(
        ExamWorkflowService.transitionQuestionStatus(questionId, to, REVIEWER, comment, 'reviewer'),
      ).rejects.toThrow(new RegExp(`Noto‘g‘ri savol status o‘tishi: "${from}" → "${to}"`));

      expect(fakeSupabase.__table('exam_questions')[0].status).toBe(from);
      expect(events()).toHaveLength(0);
    });
  }

  it('treats approved as terminal at question level', () => {
    expect(allowedQuestionTransitions('approved')).toEqual([]);
  });

  it('requires a comment to reject', async () => {
    const questionId = seedQuestion('review');
    await expect(
      ExamWorkflowService.transitionQuestionStatus(
        questionId,
        'rejected',
        REVIEWER,
        '  ',
        'reviewer',
      ),
    ).rejects.toThrow(/izoh yozish majburiy/);
    expect(fakeSupabase.__table('exam_questions')[0].status).toBe('review');
  });

  it('requires reviewer/admin role', async () => {
    const questionId = seedQuestion('draft');
    await expect(
      ExamWorkflowService.transitionQuestionStatus(
        questionId,
        'review',
        'user@example.com',
        undefined,
        'user',
      ),
    ).rejects.toThrow(/reviewer yoki admin roli talab qilinadi/);
    expect(fakeSupabase.__table('exam_questions')[0].status).toBe('draft');
  });
});

describe('Task 19 · bulk question transitions', () => {
  it('moves a homogeneous batch and audits every question', async () => {
    fakeSupabase.__seed('exam_questions', [
      { id: 'q1', status: 'draft', section_id: 's' },
      { id: 'q2', status: 'draft', section_id: 's' },
    ]);
    fakeSupabase.__seed('exam_workflow_events', []);

    const res = await ExamWorkflowService.bulkTransitionQuestions(
      ['q1', 'q2'],
      'review',
      REVIEWER,
      undefined,
      'reviewer',
    );

    expect(res.count).toBe(2);
    expect(fakeSupabase.__table('exam_questions').every((q) => q.status === 'review')).toBe(true);
    expect(events()).toHaveLength(2);
  });

  it('rejects the whole batch when any question cannot transition', async () => {
    fakeSupabase.__seed('exam_questions', [
      { id: 'q1', status: 'draft', section_id: 's' },
      { id: 'q2', status: 'review', section_id: 's' },
    ]);
    fakeSupabase.__seed('exam_workflow_events', []);

    await expect(
      ExamWorkflowService.bulkTransitionQuestions(
        ['q1', 'q2'],
        'approved',
        REVIEWER,
        undefined,
        'reviewer',
      ),
    ).rejects.toThrow(/Noto'g'ri savol status o'tishi/);

    expect(fakeSupabase.__table('exam_questions').map((q) => q.status)).toEqual([
      'draft',
      'review',
    ]);
    expect(events()).toHaveLength(0);
  });

  it('rejects a batch with unknown question ids', async () => {
    fakeSupabase.__seed('exam_questions', [{ id: 'q1', status: 'draft', section_id: 's' }]);
    await expect(
      ExamWorkflowService.bulkTransitionQuestions(
        ['q1', 'missing'],
        'review',
        REVIEWER,
        undefined,
        'reviewer',
      ),
    ).rejects.toThrow(/topilmadi/i);
  });

  it('bulkApproveQuestions walks draft -> review -> approved using legal edges only', async () => {
    fakeSupabase.__seed('exam_questions', [
      { id: 'q1', status: 'draft', section_id: 's' },
      { id: 'q2', status: 'rejected', section_id: 's' },
      { id: 'q3', status: 'review', section_id: 's' },
      { id: 'q4', status: 'approved', section_id: 's' },
    ]);
    fakeSupabase.__seed('exam_workflow_events', []);

    const res = await ExamWorkflowService.bulkApproveQuestions(
      ['q1', 'q2', 'q3', 'q4'],
      ADMIN,
      'admin',
    );

    expect(res.count).toBe(4);
    expect(fakeSupabase.__table('exam_questions').every((q) => q.status === 'approved')).toBe(true);

    const transitions = events().map((e) => `${e.entity_id}:${e.from_status}->${e.to_status}`);
    expect(transitions).toContain('q1:draft->review');
    expect(transitions).toContain('q1:review->approved');
    expect(transitions).toContain('q2:rejected->draft');
    expect(transitions).toContain('q2:draft->review');
    expect(transitions).toContain('q2:review->approved');
    expect(transitions).toContain('q3:review->approved');
    expect(transitions.some((t) => t.startsWith('q4:'))).toBe(false);
  });
});

describe('Task 19 · archive / restore expose the matrix', () => {
  it('archiveExam only works from published', async () => {
    const examId = seedExam('published');
    const res = await ExamWorkflowService.archiveExam(examId, ADMIN, 'admin');
    expect(res.success).toBe(true);
    expect(currentExamStatus()).toBe('archived');
  });

  it('archiveExam rejects a draft exam', async () => {
    const examId = seedExam('draft');
    await expect(ExamWorkflowService.archiveExam(examId, ADMIN, 'admin')).rejects.toThrow(
      /Noto‘g‘ri exam status o‘tishi: "draft" → "archived"/,
    );
  });

  it('restoreExam only works from archived', async () => {
    const examId = seedExam('archived');
    const res = await ExamWorkflowService.restoreExam(examId, ADMIN, 'admin');
    expect(res.success).toBe(true);
    expect(currentExamStatus()).toBe('draft');
  });

  it('restoreExam rejects a published exam (published -> draft is forbidden)', async () => {
    const examId = seedExam('published');
    await expect(ExamWorkflowService.restoreExam(examId, ADMIN, 'admin')).rejects.toThrow(
      /Noto‘g‘ri exam status o‘tishi: "published" → "draft"/,
    );
  });
});

describe('Task 19 · database enforces the same rules', () => {
  const projectRoot = path.resolve(__dirname, '../../../..');
  const migration = readFileSync(
    path.join(
      projectRoot,
      'supabase/migrations/20261027000000_task19_workflow_transition_enforcement.sql',
    ),
    'utf-8',
  );

  it('declares every allowed exam transition in SQL', () => {
    expect(migration).toMatch(/\('draft', 'review'\)/);
    expect(migration).toMatch(/\('review', 'draft'\)/);
    expect(migration).toMatch(/\('review', 'approved'\)/);
    expect(migration).toMatch(/\('approved', 'published'\)/);
    expect(migration).toMatch(/\('published', 'archived'\)/);
    expect(migration).toMatch(/\('archived', 'draft'\)/);
  });

  it('declares every allowed question transition in SQL', () => {
    expect(migration).toMatch(/\('draft', 'review'\)/);
    expect(migration).toMatch(/\('review', 'approved'\)/);
    expect(migration).toMatch(/\('review', 'rejected'\)/);
    expect(migration).toMatch(/\('rejected', 'draft'\)/);
  });

  it('blocks direct updates with BEFORE UPDATE triggers', () => {
    expect(migration).toMatch(/CREATE TRIGGER trg_exams_workflow_transition/);
    expect(migration).toMatch(/BEFORE UPDATE ON public\.exams/);
    expect(migration).toMatch(/CREATE TRIGGER trg_exam_questions_workflow_transition/);
    expect(migration).toMatch(/BEFORE UPDATE ON public\.exam_questions/);
  });

  it('enforces reviewer/admin roles in SQL', () => {
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.is_reviewer\(\)/);
    expect(migration).toMatch(/insufficient_privilege/);
    expect(migration).toMatch(/faqat admin uchun ruxsat etilgan/);
  });

  it('keeps an append-only audit log with RLS', () => {
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS public\.exam_workflow_events/);
    expect(migration).toMatch(/ALTER TABLE public\.exam_workflow_events ENABLE ROW LEVEL SECURITY/);
    expect(migration).toMatch(/FOR INSERT/);
    expect(migration).not.toMatch(/FOR UPDATE/);
    expect(migration).not.toMatch(/FOR DELETE/);
  });
});
