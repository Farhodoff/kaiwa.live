/**
 * Task 17 — strict draft-only bulk import model.
 *
 * Guarantees verified here:
 *  - bulk import never publishes: exams stay status='draft' / is_published=false
 *    and every imported question is stored with status='draft'
 *  - publishing is only possible through ExamWorkflowService.transitionExamStatus
 *  - reviewers may import but can never publish
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/supabase', async () => {
  const mod = await import('../../../utils/fakeSupabase');
  return { supabase: mod.fakeSupabase };
});

import { fakeSupabase } from '../../../utils/fakeSupabase';
import { ExamBulkImportService, type ValidatedQuestion } from '../../ExamBulkImportService';
import { ExamWorkflowService } from '../../ExamWorkflowService';
import { ReadingPassageService } from '../../ReadingPassageService';
import { ListeningAudioService } from '../../ListeningAudioService';
import type { ImportActor } from '../../ExamImportHistoryService';
import {
  buildJsonPayload,
  buildListeningAudio,
  buildRawQuestions,
  buildReadingPassage,
  type Level,
} from '../task16/contentFixtures';

const ADMIN: ImportActor = { id: 'admin-1', email: 'fsoyilov@gmail.com', name: 'Admin' };
const REVIEWER: ImportActor = { id: 'reviewer-1', email: 'reviewer@example.com', name: 'Rev' };

function validated(level: Level): ValidatedQuestion[] {
  const result = ExamBulkImportService.parseAndValidate(buildJsonPayload(level), 'json', {
    defaultLevel: level,
  });
  expect(result.errorCount).toBe(0);
  return result.items
    .map((item) => item.validated)
    .filter((q): q is ValidatedQuestion => q !== null);
}

async function importFullExam(level: Level = 'N3') {
  const result = await ExamBulkImportService.importFullExamWithSections(
    {
      title: `JLPT ${level} Draft-only import`,
      level,
      questions: validated(level),
      copyrightConfirmed: true,
    },
    { actor: ADMIN, sourceFormat: 'json' },
  );
  return result;
}

beforeEach(() => {
  fakeSupabase.__reset();
  fakeSupabase.__setUser({
    id: 'admin-1',
    email: 'fsoyilov@gmail.com',
    user_metadata: { full_name: 'Admin' },
  });
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Task 17 · import is always draft-only', () => {
  it('full exam import creates a draft exam with draft questions', async () => {
    const res = await importFullExam('N3');

    const exam = fakeSupabase.__table('exams')[0];
    expect(exam.id).toBe(res.examId);
    expect(exam.status).toBe('draft');
    expect(exam.is_published).toBe(false);

    const questions = fakeSupabase.__table('exam_questions');
    expect(questions).toHaveLength(buildRawQuestions('N3').length);
    expect(questions.every((q) => q.status === 'draft')).toBe(true);
  });

  it('ignores an isPublished flag even if a caller passes one', async () => {
    const result = await ExamBulkImportService.importFullExamWithSections(
      {
        title: 'Should stay draft',
        level: 'N3',
        questions: validated('N3'),
        isPublished: true,
      } as any,
      { actor: ADMIN },
    );

    const exam = fakeSupabase.__table('exams').find((e) => e.id === result.examId);
    expect(exam?.is_published).toBe(false);
    expect(exam?.status).toBe('draft');
    expect(fakeSupabase.__table('exam_questions').every((q) => q.status === 'draft')).toBe(true);
  });

  it('section import demotes the parent exam to draft and stores draft questions', async () => {
    fakeSupabase.__seed('exams', [
      {
        id: 'exam-published',
        title: 'Old published exam',
        type: 'JLPT N3',
        status: 'published',
        is_published: true,
      },
    ]);
    fakeSupabase.__seed('exam_sections', [
      { id: 'section-1', exam_id: 'exam-published', title: 'knowledge', type: 'knowledge' },
    ]);

    const res = await ExamBulkImportService.importQuestionsToSection(
      'section-1',
      validated('N3').slice(0, 2),
      { actor: ADMIN },
    );

    expect(res.insertedCount).toBe(2);
    const exam = fakeSupabase.__table('exams')[0];
    expect(exam.is_published).toBe(false);
    expect(exam.status).toBe('draft');
    expect(fakeSupabase.__table('exam_questions').every((q) => q.status === 'draft')).toBe(true);
  });

  it('existing-exam import demotes the exam back to draft', async () => {
    fakeSupabase.__seed('exams', [
      {
        id: 'exam-live',
        title: 'Live exam',
        type: 'JLPT N2',
        status: 'published',
        is_published: true,
      },
    ]);
    fakeSupabase.__seed('exam_sections', [
      { id: 'section-9', exam_id: 'exam-live', title: 'knowledge', type: 'knowledge' },
    ]);

    const res = await ExamBulkImportService.importQuestionsToExistingExam(
      'exam-live',
      validated('N2').slice(0, 3),
      { actor: ADMIN },
    );

    expect(res.totalInserted).toBe(3);
    const exam = fakeSupabase.__table('exams')[0];
    expect(exam.is_published).toBe(false);
    expect(exam.status).toBe('draft');
    expect(fakeSupabase.__table('exam_questions').every((q) => q.status === 'draft')).toBe(true);

    // Task 19: published -> draft happens through two audited legal edges.
    const transitions = fakeSupabase
      .__table('exam_workflow_events')
      .map((e) => `${e.from_status}->${e.to_status}`);
    expect(transitions).toEqual(['published->archived', 'archived->draft']);
  });

  it('existing-exam import demotes a review exam via review -> draft', async () => {
    fakeSupabase.__seed('exams', [
      {
        id: 'exam-review',
        title: 'In review exam',
        type: 'JLPT N2',
        status: 'review',
        is_published: false,
      },
    ]);
    fakeSupabase.__seed('exam_sections', [
      { id: 'section-7', exam_id: 'exam-review', title: 'knowledge', type: 'knowledge' },
    ]);

    await ExamBulkImportService.importQuestionsToExistingExam(
      'exam-review',
      validated('N2').slice(0, 2),
      { actor: ADMIN },
    );

    expect(fakeSupabase.__table('exams')[0].status).toBe('draft');
    expect(
      fakeSupabase.__table('exam_workflow_events').map((e) => `${e.from_status}->${e.to_status}`),
    ).toEqual(['review->draft']);
  });

  it('rejects existing-exam import while the exam is approved', async () => {
    fakeSupabase.__seed('exams', [
      {
        id: 'exam-approved',
        title: 'Approved exam',
        type: 'JLPT N2',
        status: 'approved',
        is_published: false,
      },
    ]);
    fakeSupabase.__seed('exam_sections', [
      { id: 'section-8', exam_id: 'exam-approved', title: 'knowledge', type: 'knowledge' },
    ]);

    await expect(
      ExamBulkImportService.importQuestionsToExistingExam(
        'exam-approved',
        validated('N2').slice(0, 2),
        { actor: ADMIN },
      ),
    ).rejects.toThrow(/taqiqlangan/);

    expect(fakeSupabase.__table('exams')[0].status).toBe('approved');
  });

  it('never writes is_published = true during any import path', async () => {
    await importFullExam('N2');
    const publishedRows = fakeSupabase.__table('exams').filter((e) => e.is_published === true);
    expect(publishedRows).toHaveLength(0);
  });
});

describe('Task 17 · admin workflow: import → review → approve → publish', () => {
  it('walks the whole chain and publishes only through transitionExamStatus', async () => {
    const imported = await importFullExam('N3');

    // 1. import -> draft
    expect(fakeSupabase.__table('exams')[0].status).toBe('draft');
    expect(fakeSupabase.__table('exams')[0].is_published).toBe(false);

    // 2. review
    await ExamWorkflowService.transitionExamStatus(
      imported.examId,
      'review',
      ADMIN.email!,
      undefined,
      'superadmin',
    );
    expect(fakeSupabase.__table('exams')[0].status).toBe('review');
    expect(fakeSupabase.__table('exams')[0].is_published).toBe(false);

    // 3. review -> approve the questions (Task 19: draft -> approved is illegal)
    await ExamWorkflowService.bulkTransitionQuestions(
      imported.questionIds!,
      'review',
      ADMIN.email!,
    );
    await ExamWorkflowService.bulkTransitionQuestions(
      imported.questionIds!,
      'approved',
      ADMIN.email!,
    );
    expect(fakeSupabase.__table('exam_questions').every((q) => q.status === 'approved')).toBe(true);

    // 4. approve the exam
    await ExamWorkflowService.transitionExamStatus(
      imported.examId,
      'approved',
      ADMIN.email!,
      undefined,
      'superadmin',
    );
    expect(fakeSupabase.__table('exams')[0].status).toBe('approved');
    expect(fakeSupabase.__table('exams')[0].is_published).toBe(false);

    // 5. publish (admin only) — pre-publish validation still applies
    const passage = buildReadingPassage('N3');
    await ReadingPassageService.create(imported.examId, {
      title: passage.title,
      content: passage.content,
    });
    const audio = buildListeningAudio('N3');
    const createdAudio = await ListeningAudioService.create(imported.examId, {
      title: audio.title,
      transcript: audio.transcript,
      uz_translation: audio.uzTranslation,
    });
    await ListeningAudioService.update(createdAudio.id, { audio_url: audio.audioUrl });

    const published = await ExamWorkflowService.transitionExamStatus(
      imported.examId,
      'published',
      ADMIN.email!,
      undefined,
      'superadmin',
    );
    expect(published.success).toBe(true);
    const exam = fakeSupabase.__table('exams')[0];
    expect(exam.status).toBe('published');
    expect(exam.is_published).toBe(true);
  });
});

describe('Task 17 · reviewers can import but never publish', () => {
  it('blocks a reviewer publish attempt and keeps the exam unpublished', async () => {
    const imported = await importFullExam('N3');

    await expect(
      ExamWorkflowService.transitionExamStatus(
        imported.examId,
        'published',
        REVIEWER.email!,
        undefined,
        'reviewer',
      ),
    ).rejects.toThrow(/faqat admin/i);

    const exam = fakeSupabase.__table('exams')[0];
    expect(exam.is_published).toBe(false);
    expect(exam.status).toBe('draft');
  });

  it('blocks a reviewer publish attempt even without an explicit role', async () => {
    const imported = await importFullExam('N2');

    await expect(
      ExamWorkflowService.transitionExamStatus(imported.examId, 'published', REVIEWER.email!),
    ).rejects.toThrow(/faqat admin/i);

    expect(fakeSupabase.__table('exams')[0].is_published).toBe(false);
  });

  it('blocks an anonymous publish attempt', async () => {
    const imported = await importFullExam('N1');

    await expect(
      ExamWorkflowService.transitionExamStatus(imported.examId, 'published'),
    ).rejects.toThrow(/faqat admin/i);

    expect(fakeSupabase.__table('exams')[0].is_published).toBe(false);
  });

  it('still allows a reviewer to import and to send the exam to review', async () => {
    const result = await ExamBulkImportService.importFullExamWithSections(
      {
        title: 'Reviewer import',
        level: 'N3',
        questions: validated('N3').slice(0, 3),
        copyrightConfirmed: true,
      },
      { actor: REVIEWER },
    );

    expect(result.totalInserted).toBe(3);
    expect(fakeSupabase.__table('exams')[0].is_published).toBe(false);

    await ExamWorkflowService.transitionExamStatus(
      result.examId,
      'review',
      REVIEWER.email!,
      undefined,
      'reviewer',
    );
    expect(fakeSupabase.__table('exams')[0].status).toBe('review');
  });
});
