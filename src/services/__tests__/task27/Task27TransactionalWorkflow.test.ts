/**
 * Task 27 — Transactional exam status update and audit logging test suite.
 *
 * Verifies all requirements:
 * 1. Exam status update succeeds only when audit event is written.
 * 2. If audit event fails, status update is rolled back.
 * 3. Actor ID/email and role are resolved from server-side session/JWT.
 * 4. Client-supplied actorRole or reviewerEmail cannot spoof/escalate authorization.
 * 5. Full integration coverage for Publish, Archive, Restore, and Reject transitions.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/supabase', async () => {
  const mod = await import('../../../utils/fakeSupabase');
  return { supabase: mod.fakeSupabase };
});

import { fakeSupabase } from '../../../utils/fakeSupabase';
import { ExamWorkflowService, type ExamWorkflowStatus } from '../../ExamWorkflowService';

const ADMIN_EMAIL = 'fsoyilov@gmail.com';
const REVIEWER_EMAIL = 'reviewer@example.com';
const STUDENT_EMAIL = 'student@example.com';

function seedTestExam(status: ExamWorkflowStatus, isPublished = status === 'published'): string {
  const examId = `exam-${status}`;
  fakeSupabase.__seed('exams', [
    {
      id: examId,
      title: 'Task 27 Integration Test Exam',
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
    {
      id: `sec-${examId}`,
      exam_id: examId,
      title: 'knowledge',
      type: 'knowledge',
      content: 'Sample content',
      order_index: 0,
    },
  ]);
  fakeSupabase.__seed('exam_questions', [
    {
      id: `q-${examId}`,
      section_id: `sec-${examId}`,
      question_text: 'Task 27 savol matni?',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'A',
      status: 'approved',
      order_index: 0,
    },
  ]);
  fakeSupabase.__seed('exam_workflow_events', []);
  return examId;
}

beforeEach(() => {
  fakeSupabase.__reset();
  fakeSupabase.__setUser({
    id: 'admin-uuid-1',
    email: ADMIN_EMAIL,
    user_metadata: { full_name: 'Admin User' },
    app_metadata: { role: 'admin' },
  });
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Task 27 · Transactional exam status update and audit logging', () => {
  describe('Publish transition (approved -> published)', () => {
    it('atomically updates exam status to published and records audit event', async () => {
      const examId = seedTestExam('approved');

      const res = await ExamWorkflowService.transitionExamStatus(
        examId,
        'published',
        ADMIN_EMAIL,
        undefined,
        'admin',
      );

      expect(res.success).toBe(true);

      // Verify exam status in database
      const exam = fakeSupabase.__table('exams').find((e) => e.id === examId);
      expect(exam?.status).toBe('published');
      expect(exam?.is_published).toBe(true);

      // Verify audit event was written
      const events = fakeSupabase.__table('exam_workflow_events');
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        entity_type: 'exam',
        entity_id: examId,
        from_status: 'approved',
        to_status: 'published',
        actor_email: ADMIN_EMAIL,
      });
    });

    it('rolls back exam status to approved if audit event writing fails', async () => {
      const examId = seedTestExam('approved');

      // Spy on supabase.from to simulate audit log failure
      const origFrom = fakeSupabase.from.bind(fakeSupabase);
      vi.spyOn(fakeSupabase, 'from').mockImplementation((table: string) => {
        const builder = origFrom(table);
        if (table === 'exam_workflow_events') {
          builder.insert = () => {
            (builder as any).finish = () => ({
              data: null,
              error: { message: 'Audit database disk write error or timeout' },
            });
            return builder;
          };
        }
        return builder;
      });

      await expect(
        ExamWorkflowService.transitionExamStatus(
          examId,
          'published',
          ADMIN_EMAIL,
          undefined,
          'admin',
        ),
      ).rejects.toThrow(/Workflow audit log yozishda xatolik/);

      // CRITICAL GUARANTEE: Exam status must be rolled back to approved and is_published=false!
      const exam = fakeSupabase.__table('exams').find((e) => e.id === examId);
      expect(exam?.status).toBe('approved');
      expect(exam?.is_published).toBe(false);

      // Audit table should have no committed events
      expect(fakeSupabase.__table('exam_workflow_events')).toHaveLength(0);
    });
  });

  describe('Archive transition (published -> archived)', () => {
    it('atomically updates exam status to archived and records audit event', async () => {
      const examId = seedTestExam('published');

      const res = await ExamWorkflowService.archiveExam(examId, ADMIN_EMAIL, 'admin');
      expect(res.success).toBe(true);

      const exam = fakeSupabase.__table('exams').find((e) => e.id === examId);
      expect(exam?.status).toBe('archived');
      expect(exam?.is_published).toBe(false);
      expect(exam?.archived_at).toBeDefined();

      const events = fakeSupabase.__table('exam_workflow_events');
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        entity_type: 'exam',
        entity_id: examId,
        from_status: 'published',
        to_status: 'archived',
      });
    });

    it('rolls back exam status to published if audit event writing fails', async () => {
      const examId = seedTestExam('published');

      const origFrom = fakeSupabase.from.bind(fakeSupabase);
      vi.spyOn(fakeSupabase, 'from').mockImplementation((table: string) => {
        const builder = origFrom(table);
        if (table === 'exam_workflow_events') {
          builder.insert = () => {
            (builder as any).finish = () => ({
              data: null,
              error: { message: 'Audit write failed during archive' },
            });
            return builder;
          };
        }
        return builder;
      });

      await expect(ExamWorkflowService.archiveExam(examId, ADMIN_EMAIL, 'admin')).rejects.toThrow(
        /Workflow audit log yozishda xatolik/,
      );

      // Rollback check: Exam must remain published!
      const exam = fakeSupabase.__table('exams').find((e) => e.id === examId);
      expect(exam?.status).toBe('published');
      expect(exam?.is_published).toBe(true);
    });
  });

  describe('Restore transition (archived -> draft)', () => {
    it('atomically updates exam status from archived to draft and records audit event', async () => {
      const examId = seedTestExam('archived');

      const res = await ExamWorkflowService.restoreExam(examId, ADMIN_EMAIL, 'admin');
      expect(res.success).toBe(true);

      const exam = fakeSupabase.__table('exams').find((e) => e.id === examId);
      expect(exam?.status).toBe('draft');
      expect(exam?.is_published).toBe(false);

      const events = fakeSupabase.__table('exam_workflow_events');
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        entity_type: 'exam',
        entity_id: examId,
        from_status: 'archived',
        to_status: 'draft',
      });
    });

    it('rolls back exam status to archived if audit event writing fails', async () => {
      const examId = seedTestExam('archived');

      const origFrom = fakeSupabase.from.bind(fakeSupabase);
      vi.spyOn(fakeSupabase, 'from').mockImplementation((table: string) => {
        const builder = origFrom(table);
        if (table === 'exam_workflow_events') {
          builder.insert = () => {
            (builder as any).finish = () => ({
              data: null,
              error: { message: 'Audit write failed during restore' },
            });
            return builder;
          };
        }
        return builder;
      });

      await expect(ExamWorkflowService.restoreExam(examId, ADMIN_EMAIL, 'admin')).rejects.toThrow(
        /Workflow audit log yozishda xatolik/,
      );

      const exam = fakeSupabase.__table('exams').find((e) => e.id === examId);
      expect(exam?.status).toBe('archived');
    });
  });

  describe('Reject transition (review -> draft with comment)', () => {
    it('atomically demotes exam to draft, stores rejection comment, and records audit event', async () => {
      const examId = seedTestExam('review');
      const rejectionComment = "3-savolda variantlar noto'g'ri kiritilgan. Iltimos tuzating.";

      const res = await ExamWorkflowService.transitionExamStatus(
        examId,
        'draft',
        ADMIN_EMAIL,
        rejectionComment,
        'admin',
      );

      expect(res.success).toBe(true);

      const exam = fakeSupabase.__table('exams').find((e) => e.id === examId);
      expect(exam?.status).toBe('draft');
      expect(exam?.rejection_comment).toBe(rejectionComment);

      const events = fakeSupabase.__table('exam_workflow_events');
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        entity_type: 'exam',
        entity_id: examId,
        from_status: 'review',
        to_status: 'draft',
        comment: rejectionComment,
      });
    });

    it('rolls back exam status to review if audit event writing fails on rejection', async () => {
      const examId = seedTestExam('review');

      const origFrom = fakeSupabase.from.bind(fakeSupabase);
      vi.spyOn(fakeSupabase, 'from').mockImplementation((table: string) => {
        const builder = origFrom(table);
        if (table === 'exam_workflow_events') {
          builder.insert = () => {
            (builder as any).finish = () => ({
              data: null,
              error: { message: 'Audit write failed during reject' },
            });
            return builder;
          };
        }
        return builder;
      });

      await expect(
        ExamWorkflowService.transitionExamStatus(
          examId,
          'draft',
          ADMIN_EMAIL,
          'Qaytarish sababi',
          'admin',
        ),
      ).rejects.toThrow(/Workflow audit log yozishda xatolik/);

      // Rollback verification: Exam status must remain review!
      const exam = fakeSupabase.__table('exams').find((e) => e.id === examId);
      expect(exam?.status).toBe('review');
      expect(exam?.rejection_comment).toBeNull();
    });
  });

  describe('Server-side JWT / session authorization (Requirement 3 & 4)', () => {
    it('blocks non-admin session user even if client passes actorRole: admin', async () => {
      const examId = seedTestExam('approved');

      // Set authenticated user to ordinary student/user in session
      fakeSupabase.__setUser({
        id: 'student-uuid-123',
        email: STUDENT_EMAIL,
        user_metadata: { full_name: 'Student User' },
        app_metadata: { role: 'user' },
      });

      // Attacker attempts client-side privilege escalation by sending actorRole: 'admin'
      await expect(
        ExamWorkflowService.transitionExamStatus(
          examId,
          'published',
          'fsoyilov@gmail.com', // Client attempts to spoof admin email
          undefined,
          'admin', // Client attempts to spoof admin role
        ),
      ).rejects.toThrow(/Nashr qilish \(publish\) faqat admin uchun ruxsat etilgan/);

      // Exam must remain approved
      const exam = fakeSupabase.__table('exams').find((e) => e.id === examId);
      expect(exam?.status).toBe('approved');
      expect(exam?.is_published).toBe(false);
    });

    it('blocks ordinary user from reviewer transition even if client claims actorRole: reviewer', async () => {
      const examId = seedTestExam('draft');

      fakeSupabase.__setUser({
        id: 'student-uuid-123',
        email: STUDENT_EMAIL,
        user_metadata: { full_name: 'Student User' },
        app_metadata: { role: 'user' },
      });

      await expect(
        ExamWorkflowService.transitionExamStatus(
          examId,
          'review',
          REVIEWER_EMAIL,
          undefined,
          'reviewer', // Spoofed client role
        ),
      ).rejects.toThrow(/reviewer yoki admin roli talab qilinadi/);

      const exam = fakeSupabase.__table('exams').find((e) => e.id === examId);
      expect(exam?.status).toBe('draft');
    });

    it('extracts actor ID and email from server session for audit events', async () => {
      const examId = seedTestExam('draft');

      fakeSupabase.__setUser({
        id: 'admin-verified-id',
        email: ADMIN_EMAIL,
        user_metadata: { full_name: 'Admin Boss' },
        app_metadata: { role: 'admin' },
      });

      await ExamWorkflowService.transitionExamStatus(
        examId,
        'review',
        ADMIN_EMAIL,
        undefined,
        'admin',
      );

      const events = fakeSupabase.__table('exam_workflow_events');
      expect(events).toHaveLength(1);
      expect(events[0].actor_id).toBe('admin-verified-id');
      expect(events[0].actor_email).toBe(ADMIN_EMAIL);
    });
  });
});
