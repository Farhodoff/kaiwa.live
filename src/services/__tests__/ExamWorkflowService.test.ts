import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ExamWorkflowService,
  EXAM_STATUS_CONFIG,
  QUESTION_STATUS_CONFIG,
} from '../ExamWorkflowService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

function mockWorkflowTables(
  opts: {
    examStatus?: string;
    questionStatus?: string;
    questionRows?: Array<{ id: string; status: string }>;
  } = {},
) {
  const examUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  const questionUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
    in: vi.fn().mockResolvedValue({ error: null }),
  });
  const eventsInsert = vi.fn().mockResolvedValue({ error: null });

  (supabase.from as any).mockImplementation((table: string) => {
    if (table === 'exams') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'exam-1', status: opts.examStatus ?? 'approved' },
              error: null,
            }),
          }),
        }),
        update: examUpdate,
      };
    }
    if (table === 'exam_questions') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'q-1', status: opts.questionStatus ?? 'review' },
              error: null,
            }),
          }),
          in: vi.fn().mockResolvedValue({
            data:
              opts.questionRows ??
              ['q-1', 'q-2', 'q-3'].map((id) => ({
                id,
                status: opts.questionStatus ?? 'review',
              })),
            error: null,
          }),
        }),
        update: questionUpdate,
      };
    }
    if (table === 'exam_workflow_events') {
      return { insert: eventsInsert };
    }
    return {};
  });

  return { examUpdate, questionUpdate, eventsInsert };
}

describe('ExamWorkflowService Unit Tests (Task 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Task 17: restore spies so queued one-time mocks cannot leak into the
    // next test when a publish attempt is rejected before validation runs.
    vi.restoreAllMocks();
  });

  describe('Status Configurations', () => {
    it('defines meta for all exam statuses', () => {
      expect(EXAM_STATUS_CONFIG.draft.label).toContain('Qoralama');
      expect(EXAM_STATUS_CONFIG.review.label).toContain("Ko'rib chiqilmoqda");
      expect(EXAM_STATUS_CONFIG.approved.label).toContain('Tasdiqlangan');
      expect(EXAM_STATUS_CONFIG.published.label).toContain('Nashr qilingan');
      expect(EXAM_STATUS_CONFIG.archived.label).toContain('Arxivlangan');
    });

    it('defines meta for question statuses', () => {
      expect(QUESTION_STATUS_CONFIG.draft.label).toBe('Qoralama');
      expect(QUESTION_STATUS_CONFIG.review.label).toBe("Ko'rib chiqishda");
      expect(QUESTION_STATUS_CONFIG.approved.label).toBe('Tasdiqlangan');
      expect(QUESTION_STATUS_CONFIG.rejected.label).toContain('Rad etilgan');
    });
  });

  describe('Pre-publish Validation (validateForPublish)', () => {
    it('returns error when exam is not found in database', async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'exams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await ExamWorkflowService.validateForPublish('non-existent');
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('topilmadi');
    });

    it('returns error when exam has no sections', async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'exams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'exam-1', title: 'Test Exam', status: 'approved' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'exam_sections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === 'reading_passages' || table === 'listening_audios') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {};
      });

      const res = await ExamWorkflowService.validateForPublish('exam-1');
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes("kamida bitta bo'lim"))).toBe(true);
      expect(res.errors.some((e) => e.includes('kamida 1 ta savol'))).toBe(true);
    });

    it('blocks publication when questions are not in approved status (e.g. draft, review, rejected)', async () => {
      const mockSections = [
        {
          id: 'sec-1',
          exam_id: 'exam-1',
          title: 'Dokkai Section',
          type: 'Reading',
          content: 'Sample text passage',
        },
      ];
      const mockQuestions = [
        {
          id: 'q-1',
          section_id: 'sec-1',
          question_text: 'Question 1',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          status: 'draft', // Not approved
        },
        {
          id: 'q-2',
          section_id: 'sec-1',
          question_text: 'Question 2',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'B',
          status: 'rejected', // Rejected
          rejection_comment: 'Fix option typo',
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'exams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'exam-1', title: 'Test Exam', status: 'approved' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'exam_sections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSections, error: null }),
              }),
            }),
          };
        }
        if (table === 'exam_questions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockQuestions, error: null }),
              }),
            }),
          };
        }
        if (table === 'reading_passages' || table === 'listening_audios') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {};
      });

      const res = await ExamWorkflowService.validateForPublish('exam-1');
      expect(res.isValid).toBe(false);
      expect(res.summary.totalQuestions).toBe(2);
      expect(res.summary.draftCount).toBe(1);
      expect(res.summary.rejectedCount).toBe(1);
      expect(res.summary.approvedCount).toBe(0);
      expect(res.errors.some((e) => e.includes('Savol #1') && e.includes('tasdiqlanmagan'))).toBe(
        true,
      );
      expect(res.errors.some((e) => e.includes('Savol #2') && e.includes('tasdiqlanmagan'))).toBe(
        true,
      );
    });

    it('blocks publication when listening section has no audio files', async () => {
      const mockSections = [
        {
          id: 'sec-2',
          exam_id: 'exam-1',
          title: 'Choukai Section',
          type: 'Listening',
          audio_url: null,
        },
      ];
      const mockQuestions = [
        {
          id: 'q-1',
          section_id: 'sec-2',
          question_text: 'Listening question 1',
          options: ['1', '2', '3', '4'],
          correct_answer: '1',
          status: 'approved',
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'exams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'exam-1', title: 'JLPT N3', status: 'approved' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'exam_sections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSections, error: null }),
              }),
            }),
          };
        }
        if (table === 'exam_questions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockQuestions, error: null }),
              }),
            }),
          };
        }
        if (table === 'reading_passages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === 'listening_audios') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }), // No audio track
            }),
          };
        }
        return {};
      });

      const res = await ExamWorkflowService.validateForPublish('exam-1');
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('audio fayl biriktirilmagan'))).toBe(true);
    });

    it('succeeds when all questions are approved, options and correct_answers exist, and audio is provided', async () => {
      const mockSections = [
        {
          id: 'sec-1',
          exam_id: 'exam-1',
          title: 'Dokkai Section',
          type: 'Reading',
          content: 'Long passage text here...',
        },
        {
          id: 'sec-2',
          exam_id: 'exam-1',
          title: 'Choukai Section',
          type: 'Listening',
          audio_url: 'https://example.com/audio.mp3',
        },
      ];
      const mockQuestions = [
        {
          id: 'q-1',
          section_id: 'sec-1',
          question_text: 'Reading question 1',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          status: 'approved',
        },
        {
          id: 'q-2',
          section_id: 'sec-2',
          question_text: 'Listening question 2',
          options: ['1', '2', '3', '4'],
          correct_answer: '1',
          status: 'approved',
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'exams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'exam-1',
                    title: 'JLPT N2 Mock',
                    status: 'approved',
                    license_type: 'original',
                    copyright_confirmed: true,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'exam_sections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSections, error: null }),
              }),
            }),
          };
        }
        if (table === 'exam_questions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockQuestions, error: null }),
              }),
            }),
          };
        }
        if (table === 'reading_passages' || table === 'listening_audios') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {};
      });

      const res = await ExamWorkflowService.validateForPublish('exam-1');
      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.summary.approvedCount).toBe(2);
      expect(res.summary.totalQuestions).toBe(2);
    });
  });

  describe('Exam Status Transitions & Safe Publishing (transitionExamStatus)', () => {
    it('throws error and prevents publishing if validation fails', async () => {
      // Mock validation returning errors
      vi.spyOn(ExamWorkflowService, 'validateForPublish').mockResolvedValueOnce({
        isValid: false,
        errors: ['Savol #1 tasdiqlanmagan.'],
        warnings: [],
        summary: {
          totalSections: 1,
          totalQuestions: 1,
          approvedCount: 0,
          reviewCount: 1,
          draftCount: 0,
          rejectedCount: 0,
        },
      });

      mockWorkflowTables({ examStatus: 'approved' });

      await expect(
        ExamWorkflowService.transitionExamStatus(
          'exam-1',
          'published',
          'fsoyilov@gmail.com',
          undefined,
          'superadmin',
        ),
      ).rejects.toThrow('Nashr qilish rad etildi!');
    });

    it('sets is_published: true when targetStatus is published and validation passes', async () => {
      vi.spyOn(ExamWorkflowService, 'validateForPublish').mockResolvedValueOnce({
        isValid: true,
        errors: [],
        warnings: [],
        summary: {
          totalSections: 1,
          totalQuestions: 1,
          approvedCount: 1,
          reviewCount: 0,
          draftCount: 0,
          rejectedCount: 0,
        },
      });

      const { examUpdate: mockUpdate } = mockWorkflowTables({ examStatus: 'approved' });

      const res = await ExamWorkflowService.transitionExamStatus(
        'exam-1',
        'published',
        'admin@kaiwa.live',
        undefined,
        'admin',
      );

      expect(res.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          is_published: true,
          reviewed_by: 'admin@kaiwa.live',
        }),
      );
    });

    it('Task 17: blocks publishing when the actor is a reviewer', async () => {
      const validateSpy = vi.spyOn(ExamWorkflowService, 'validateForPublish');

      await expect(
        ExamWorkflowService.transitionExamStatus(
          'exam-1',
          'published',
          'reviewer@example.com',
          undefined,
          'reviewer',
        ),
      ).rejects.toThrow(/faqat admin/i);

      // Publishing is rejected before any validation or DB write happens.
      expect(validateSpy).not.toHaveBeenCalled();
    });

    it('sets is_published: false and archived_at when targetStatus is archived', async () => {
      const { examUpdate: mockUpdate } = mockWorkflowTables({ examStatus: 'published' });

      const res = await ExamWorkflowService.transitionExamStatus(
        'exam-1',
        'archived',
        'fsoyilov@gmail.com',
        undefined,
        'admin',
      );

      expect(res.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'archived',
          is_published: false,
          archived_at: expect.any(String),
        }),
      );
    });
  });

  describe('Archive and Restore (archiveExam / restoreExam)', () => {
    it('archiveExam sets status to archived and is_published to false', async () => {
      const { examUpdate: mockUpdate } = mockWorkflowTables({ examStatus: 'published' });

      const res = await ExamWorkflowService.archiveExam('exam-1', 'fsoyilov@gmail.com', 'admin');
      expect(res.success).toBe(true);
      expect(res.message).toContain('arxivga');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'archived',
          is_published: false,
          archived_at: expect.any(String),
        }),
      );
    });

    it('restoreExam returns archived exam to draft status', async () => {
      const { examUpdate: mockUpdate } = mockWorkflowTables({ examStatus: 'archived' });

      const res = await ExamWorkflowService.restoreExam('exam-1', 'fsoyilov@gmail.com', 'admin');
      expect(res.success).toBe(true);
      expect(res.message).toContain('qoralama');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft',
          is_published: false,
          archived_at: null,
        }),
      );
    });
  });

  describe('Safe Exam Deletion (canDeleteExam & deleteExamSafely)', () => {
    it('canDeleteExam returns false for published exams', () => {
      expect(ExamWorkflowService.canDeleteExam('published', true)).toBe(false);
      expect(ExamWorkflowService.canDeleteExam('published', false)).toBe(false);
      expect(ExamWorkflowService.canDeleteExam('draft', true)).toBe(false);
    });

    it('canDeleteExam returns true for draft or archived exams', () => {
      expect(ExamWorkflowService.canDeleteExam('draft', false)).toBe(true);
      expect(ExamWorkflowService.canDeleteExam('archived', false)).toBe(true);
    });

    it('deleteExamSafely throws error when exam is published', async () => {
      await expect(
        ExamWorkflowService.deleteExamSafely('exam-1', 'published', true),
      ).rejects.toThrow("to'g'ridan-to'g'ri o'chirib bo'lmaydi");
    });

    it('deleteExamSafely allows deletion of draft or archived exam', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      (supabase.from as any).mockReturnValue({ delete: mockDelete });

      const res = await ExamWorkflowService.deleteExamSafely('exam-1', 'draft', false);
      expect(res.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('Question Review Workflow (transitionQuestionStatus)', () => {
    it('requires a rejection comment when rejecting a question', async () => {
      await expect(
        ExamWorkflowService.transitionQuestionStatus('q-1', 'rejected', 'reviewer@test.com', ''),
      ).rejects.toThrow('izoh yozish majburiy');

      await expect(
        ExamWorkflowService.transitionQuestionStatus('q-1', 'rejected', 'reviewer@test.com', '   '),
      ).rejects.toThrow('izoh yozish majburiy');
    });

    it('successfully rejects question and saves rejection comment', async () => {
      const { questionUpdate: mockUpdate } = mockWorkflowTables({ questionStatus: 'review' });

      const res = await ExamWorkflowService.transitionQuestionStatus(
        'q-1',
        'rejected',
        'reviewer@test.com',
        "3-variantda noto'g'ri kanji ishlatilgan.",
        'reviewer',
      );

      expect(res.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          rejection_comment: "3-variantda noto'g'ri kanji ishlatilgan.",
          reviewed_by: 'reviewer@test.com',
        }),
      );
    });

    it('successfully approves question and clears rejection comment', async () => {
      const { questionUpdate: mockUpdate } = mockWorkflowTables({ questionStatus: 'review' });

      const res = await ExamWorkflowService.transitionQuestionStatus(
        'q-1',
        'approved',
        'reviewer@test.com',
        undefined,
        'reviewer',
      );

      expect(res.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          rejection_comment: null,
          reviewed_by: 'reviewer@test.com',
        }),
      );
    });

    it('bulkTransitionQuestions updates multiple questions', async () => {
      const { questionUpdate: mockUpdate } = mockWorkflowTables({
        questionStatus: 'review',
      });

      const res = await ExamWorkflowService.bulkTransitionQuestions(
        ['q-1', 'q-2', 'q-3'],
        'approved',
        'reviewer@test.com',
        undefined,
        'reviewer',
      );

      expect(res.count).toBe(3);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          rejection_comment: null,
          reviewed_by: 'reviewer@test.com',
        }),
      );
    });
  });

  describe('Task 7: Source and License Metadata Validation & Management', () => {
    it('Task 18: blocks publishing when the license is restricted', async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'exams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'exam-restricted',
                    title: 'Restricted Material Exam',
                    license_type: 'restricted',
                    copyright_confirmed: true,
                    is_official_jlpt: false,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'exam_sections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 'sec-1', type: 'knowledge', title: 'Goi' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'exam_questions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'q-1',
                      status: 'approved',
                      question_text: 'Test question',
                      options: ['A', 'B', 'C', 'D'],
                      correct_answer: '0',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const res = await ExamWorkflowService.validateForPublish('exam-restricted');
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('restricted'))).toBe(true);
      expect(res.legalGates?.some((g) => g.id === 'restricted_license' && g.blocking)).toBe(true);
    });

    it('Task 18: blocks publishing when copyright is not confirmed', async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'exams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'exam-unconfirmed',
                    title: 'Unconfirmed Exam',
                    license_type: 'cc-by',
                    copyright_confirmed: false,
                    is_official_jlpt: false,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'exam_sections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 'sec-1', type: 'knowledge', title: 'Goi' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'exam_questions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'q-1',
                      status: 'approved',
                      question_text: 'Test question',
                      options: ['A', 'B', 'C', 'D'],
                      correct_answer: '0',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const res = await ExamWorkflowService.validateForPublish('exam-unconfirmed');
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('Mualliflik huquqi tasdiqlanmagan'))).toBe(true);
      expect(res.legalGates?.some((g) => g.id === 'copyright_not_confirmed' && g.blocking)).toBe(
        true,
      );
    });

    it('blocks publication with error if exam is falsely claimed as Official JLPT', async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'exams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'exam-false-official',
                    title: 'Unofficial Practice Exam',
                    license_type: 'original',
                    copyright_confirmed: true,
                    is_official_jlpt: true,
                    source_name: 'Third-party Publisher',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'exam_sections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 'sec-1', type: 'knowledge', title: 'Goi' }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'exam_questions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'q-1',
                      status: 'approved',
                      question_text: 'Test question',
                      options: ['A', 'B', 'C', 'D'],
                      correct_answer: '0',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const res = await ExamWorkflowService.validateForPublish('exam-false-official');
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('Japan Foundation / JEES'))).toBe(true);
    });

    it('updateExamSourceLicense updates source and license in database', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      (supabase.from as any).mockReturnValue({ update: mockUpdate });

      await ExamWorkflowService.updateExamSourceLicense('exam-1', {
        sourceName: 'The Japan Foundation',
        sourceUrl: 'https://www.jlpt.jp',
        author: 'JEES Team',
        licenseType: 'restricted',
        copyrightConfirmed: true,
        isOfficialJlpt: true,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        source_name: 'The Japan Foundation',
        source_url: 'https://www.jlpt.jp',
        author: 'JEES Team',
        license_type: 'restricted',
        copyright_confirmed: true,
        is_official_jlpt: true,
      });
    });
  });
});
