/**
 * Task 26 — Atomic and failure-safe exam bulk import test suite.
 *
 * Verifies all 9 requirements:
 * 1. Section or question insert failure never continues.
 * 2. All section/import errors are accumulated and batch ends with status='failed'.
 * 3. Partial import is never finalized as success.
 * 4. Newly created exam, sections, and questions are rolled back on failure.
 * 5. createVersionSnapshot error is never swallowed; snapshot is mandatory.
 * 6. Database transaction or atomic client rollback mechanism is enforced.
 * 7. Result is strictly either full success or clear failure with rollback status.
 * 8. Comprehensive tests for section insert failure, question insert failure,
 *    snapshot failure, and rollback failure.
 * 9. totalInserted !== expectedCount never succeeds and triggers rollback.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/supabase', async () => {
  const mod = await import('../../../utils/fakeSupabase');
  return { supabase: mod.fakeSupabase };
});

import { fakeSupabase } from '../../../utils/fakeSupabase';
import {
  ExamBulkImportService,
  ExamImportAtomicError,
  type ValidatedQuestion,
} from '../../ExamBulkImportService';
import { ExamImportHistoryService, type ImportActor } from '../../ExamImportHistoryService';

const ADMIN: ImportActor = { id: 'admin-1', email: 'fsoyilov@gmail.com', name: 'Admin User' };

function createSampleQuestions(count = 3): ValidatedQuestion[] {
  return Array.from({ length: count }, (_, idx) => ({
    question_text: `Test savol matni ${idx + 1} (JLPT N3)?`,
    type: 'multiple_choice' as const,
    question_type: 'vocabulary_meaning' as const,
    question_payload: {},
    options: ['Variant A', 'Variant B', 'Variant C', 'Variant D'],
    correct_answer: 'Variant A',
    correct_index: 0,
    explanation: 'Test tushuntirish',
    translation: 'Test tarjima',
    level: 'N3' as const,
    difficulty: 'medium' as const,
    section_name: idx < 2 ? "Lug'at Bo'limi" : "Grammatika Bo'limi",
    section_type: 'knowledge' as const,
    source_name: 'Platforma Test',
    license_type: 'original' as const,
    copyright_confirmed: true,
  }));
}

beforeEach(() => {
  fakeSupabase.__reset();
  fakeSupabase.__setUser({
    id: 'admin-1',
    email: 'fsoyilov@gmail.com',
    user_metadata: { full_name: 'Admin User' },
  });
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Task 26 · Atomic and failure-safe exam bulk import', () => {
  describe('Full success', () => {
    it('successfully imports full exam when all sections, questions, and snapshot succeed', async () => {
      const questions = createSampleQuestions(3);
      const res = await ExamBulkImportService.importFullExamWithSections(
        {
          title: 'JLPT N3 To‘liq Muvaffaqiyatli Imtihon',
          level: 'N3',
          questions,
          copyrightConfirmed: true,
        },
        { actor: ADMIN, sourceFormat: 'json' },
      );

      expect(res.success).toBe(true);
      expect(res.totalInserted).toBe(3);
      expect(res.expectedCount).toBe(3);
      expect(res.examId).toBeDefined();

      // Check exam was created with draft status
      const exam = fakeSupabase.__table('exams').find((e) => e.id === res.examId);
      expect(exam).toBeDefined();
      expect(exam?.status).toBe('draft');
      expect(exam?.is_published).toBe(false);

      // Check batch was finalized as applied
      const batch = fakeSupabase.__table('exam_import_batches').find((b) => b.id === res.batchId);
      expect(batch).toBeDefined();
      expect(batch?.status).toBe('applied');
      expect(batch?.question_count).toBe(3);

      // Check version snapshot was created
      const version = fakeSupabase
        .__table('exam_content_versions')
        .find((v) => v.exam_id === res.examId);
      expect(version).toBeDefined();
      expect(version?.is_current).toBe(true);
    });
  });

  describe('Section insert failure', () => {
    it('aborts without continuing, rolls back created exam, and marks batch as failed', async () => {
      const questions = createSampleQuestions(3);

      // Spy on fakeSupabase from to fail when inserting into exam_sections
      const origFrom = fakeSupabase.from.bind(fakeSupabase);
      vi.spyOn(fakeSupabase, 'from').mockImplementation((table: string) => {
        const builder = origFrom(table);
        if (table === 'exam_sections') {
          builder.insert = () => {
            (builder as any).finish = () => ({
              data: null,
              error: { message: 'Database error: foreign key or check constraint violation' },
            });
            return builder;
          };
        }
        return builder;
      });

      let caughtError: any = null;
      try {
        await ExamBulkImportService.importFullExamWithSections(
          {
            title: 'JLPT N3 Section Error Test',
            level: 'N3',
            questions,
            copyrightConfirmed: true,
          },
          { actor: ADMIN },
        );
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ExamImportAtomicError);
      expect(caughtError.success).toBe(false);
      expect(caughtError.rollbackStatus).toBe('success');
      expect(caughtError.accumulatedErrors.length).toBeGreaterThan(0);
      expect(caughtError.message).toMatch(/Bo'lim yaratishda xatolik/);

      // Verify created exam was rolled back
      expect(fakeSupabase.__table('exams')).toHaveLength(0);
      expect(fakeSupabase.__table('exam_sections')).toHaveLength(0);
      expect(fakeSupabase.__table('exam_questions')).toHaveLength(0);

      // Verify batch ended with failed status
      const batches = fakeSupabase.__table('exam_import_batches');
      expect(batches).toHaveLength(1);
      expect(batches[0].status).toBe('failed');
      expect(batches[0].rollback_reason).toMatch(/Bo'lim yaratishda xatolik/);
      expect(batches[0].metadata?.rollback_status).toBe('success');
    });
  });

  describe('Question insert failure', () => {
    it('aborts on question insert error, rolls back exam and sections, and marks batch as failed', async () => {
      const questions = createSampleQuestions(3);

      // Spy on fakeSupabase from to fail when inserting questions
      const origFrom = fakeSupabase.from.bind(fakeSupabase);
      vi.spyOn(fakeSupabase, 'from').mockImplementation((table: string) => {
        const builder = origFrom(table);
        if (table === 'exam_questions') {
          builder.insert = () => {
            (builder as any).finish = () => ({
              data: null,
              error: { message: 'Database insert failure on exam_questions' },
            });
            return builder;
          };
        }
        return builder;
      });

      let caughtError: any = null;
      try {
        await ExamBulkImportService.importFullExamWithSections(
          {
            title: 'JLPT N3 Question Error Test',
            level: 'N3',
            questions,
            copyrightConfirmed: true,
          },
          { actor: ADMIN },
        );
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ExamImportAtomicError);
      expect(caughtError.success).toBe(false);
      expect(caughtError.rollbackStatus).toBe('success');
      expect(caughtError.message).toMatch(/Savollarni saqlashda xatolik/);

      // Verify exam, sections, and questions were all rolled back
      expect(fakeSupabase.__table('exams')).toHaveLength(0);
      expect(fakeSupabase.__table('exam_sections')).toHaveLength(0);
      expect(fakeSupabase.__table('exam_questions')).toHaveLength(0);

      // Verify batch ended with status failed
      const batch = fakeSupabase.__table('exam_import_batches')[0];
      expect(batch).toBeDefined();
      expect(batch.status).toBe('failed');
    });
  });

  describe('Snapshot failure (Requirement 5)', () => {
    it('does NOT swallow snapshot failure, triggers rollback, and fails the batch', async () => {
      const questions = createSampleQuestions(2);

      // Mock createVersionSnapshot to throw an error
      vi.spyOn(ExamImportHistoryService, 'createVersionSnapshot').mockRejectedValue(
        new Error('Snapshot storage crashed: disk full or network partition'),
      );

      let caughtError: any = null;
      try {
        await ExamBulkImportService.importFullExamWithSections(
          {
            title: 'JLPT N3 Snapshot Failure Test',
            level: 'N3',
            questions,
            copyrightConfirmed: true,
          },
          { actor: ADMIN },
        );
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ExamImportAtomicError);
      expect(caughtError.success).toBe(false);
      expect(caughtError.rollbackStatus).toBe('success');
      expect(caughtError.message).toMatch(/Snapshot storage crashed/);

      // Verify batch was NOT finalized as applied
      const batch = fakeSupabase.__table('exam_import_batches')[0];
      expect(batch).toBeDefined();
      expect(batch.status).toBe('failed');
      expect(batch.status).not.toBe('applied');

      // Verify newly created exam was rolled back
      expect(fakeSupabase.__table('exams')).toHaveLength(0);
      expect(fakeSupabase.__table('exam_sections')).toHaveLength(0);
      expect(fakeSupabase.__table('exam_questions')).toHaveLength(0);
    });
  });

  describe('Rollback failure handling', () => {
    it('captures rollback failure details in metadata and error when rollback delete fails', async () => {
      const questions = createSampleQuestions(2);

      let sectionCallCount = 0;
      const origFrom = fakeSupabase.from.bind(fakeSupabase);
      vi.spyOn(fakeSupabase, 'from').mockImplementation((table: string) => {
        const builder = origFrom(table);
        if (table === 'exam_sections') {
          sectionCallCount++;
          // Fail on section insert
          builder.insert = () => {
            (builder as any).finish = () => ({
              data: null,
              error: { message: 'Section creation failed intentionally' },
            });
            return builder;
          };
        }
        if (table === 'exams') {
          // If delete is called, simulate rollback failure
          const origDelete = builder.delete.bind(builder);
          builder.delete = () => {
            origDelete();
            (builder as any).finish = () => ({
              data: null,
              error: { message: 'Critical error: cannot delete exam during rollback' },
            });
            return builder;
          };
        }
        return builder;
      });

      let caughtError: any = null;
      try {
        await ExamBulkImportService.importFullExamWithSections(
          {
            title: 'JLPT N3 Rollback Error Test',
            level: 'N3',
            questions,
            copyrightConfirmed: true,
          },
          { actor: ADMIN },
        );
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ExamImportAtomicError);
      expect(caughtError.rollbackStatus).toBe('failed');
      expect(caughtError.rollbackError).toMatch(/Critical error/);
      expect(caughtError.message).toMatch(/DIQQAT: Rollback xatoga uchradi/);

      // Verify batch recorded rollback failure
      const batch = fakeSupabase.__table('exam_import_batches')[0];
      expect(batch).toBeDefined();
      expect(batch.status).toBe('failed');
      expect(batch.metadata?.rollback_status).toBe('failed');
      expect(batch.metadata?.rollback_error).toMatch(/Critical error/);
    });
  });

  describe('Question count mismatch (Requirement 9)', () => {
    it('prevents success and triggers rollback if totalInserted !== expectedCount', async () => {
      const questions = createSampleQuestions(3);

      // Simulate partial insert: low-level insert returns only 2 of 3 questions
      vi.spyOn(ExamBulkImportService as any, 'insertQuestionsToSection').mockResolvedValue({
        insertedCount: 1, // Only 1 inserted instead of the questions in section
        questionIds: ['q-partial-1'],
        insertedRows: [{ id: 'q-partial-1', question_text: 'Partial Q' }],
      });

      let caughtError: any = null;
      try {
        await ExamBulkImportService.importFullExamWithSections(
          {
            title: 'JLPT N3 Count Mismatch Test',
            level: 'N3',
            questions,
            copyrightConfirmed: true,
          },
          { actor: ADMIN },
        );
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ExamImportAtomicError);
      expect(caughtError.message).toMatch(/Import to'liq amalga oshmadi/);
      expect(caughtError.rollbackStatus).toBe('success');

      // Verify rollback executed
      expect(fakeSupabase.__table('exams')).toHaveLength(0);

      // Verify batch was NOT applied
      const batch = fakeSupabase.__table('exam_import_batches')[0];
      expect(batch.status).toBe('failed');
    });
  });

  describe('Existing exam atomic import', () => {
    it('rolls back newly added questions and sections on failure without deleting the existing exam', async () => {
      // Seed existing exam with 1 section and 1 question
      fakeSupabase.__seed('exams', [
        {
          id: 'existing-exam-1',
          title: 'Mavjud Imtihon',
          type: 'JLPT N3',
          status: 'draft',
          is_published: false,
        },
      ]);
      fakeSupabase.__seed('exam_sections', [
        {
          id: 'existing-sec-1',
          exam_id: 'existing-exam-1',
          title: "Mavjud Bo'lim",
          type: 'reading',
          order_index: 0,
        },
      ]);

      const newQuestions: ValidatedQuestion[] = [
        {
          question_text: 'Yangi savol matni?',
          type: 'multiple_choice',
          question_type: 'vocabulary_meaning',
          question_payload: {},
          options: ['A', 'B'],
          correct_answer: 'A',
          correct_index: 0,
          explanation: '',
          level: 'N3',
          difficulty: 'medium',
          section_name: "Yangi Bo'lim", // Requires creating a new section
          section_type: 'knowledge',
          copyright_confirmed: true,
        },
      ];

      // Fail snapshot on existing exam
      vi.spyOn(ExamImportHistoryService, 'createVersionSnapshot').mockRejectedValue(
        new Error('Snapshot failed on existing exam'),
      );

      let caughtError: any = null;
      try {
        await ExamBulkImportService.importQuestionsToExistingExam('existing-exam-1', newQuestions, {
          actor: ADMIN,
        });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ExamImportAtomicError);
      expect(caughtError.rollbackStatus).toBe('success');

      // The pre-existing exam MUST still exist!
      const existingExam = fakeSupabase.__table('exams').find((e) => e.id === 'existing-exam-1');
      expect(existingExam).toBeDefined();

      // But newly created section and questions should be deleted
      expect(
        fakeSupabase
          .__table('exam_sections')
          .filter((s) => s.exam_id === 'existing-exam-1' && s.title === "Yangi Bo'lim"),
      ).toHaveLength(0);

      // Batch is marked failed
      const batch = fakeSupabase.__table('exam_import_batches')[0];
      expect(batch.status).toBe('failed');
    });
  });

  describe('Safe helper wrapper (Requirement 7)', () => {
    it('importFullExamAtomicSafe returns failure result object on error without throwing', async () => {
      vi.spyOn(ExamImportHistoryService, 'createVersionSnapshot').mockRejectedValue(
        new Error('Unexpected snapshot error'),
      );

      const questions = createSampleQuestions(2);
      const result = await ExamBulkImportService.importFullExamAtomicSafe(
        {
          title: 'JLPT N3 Safe Wrapper Test',
          level: 'N3',
          questions,
          copyrightConfirmed: true,
        },
        { actor: ADMIN },
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.rollbackStatus).toBe('success');
        expect(result.error).toMatch(/Unexpected snapshot error/);
        expect(result.accumulatedErrors.length).toBeGreaterThan(0);
      }
    });
  });
});
