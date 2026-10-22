import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { ExamImportHistoryService, ExamContentSnapshot } from '../ExamImportHistoryService';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const adminActor = { id: null, email: 'fsoyilov@gmail.com', name: 'Admin' };

const sampleBatch = {
  id: 'batch-1',
  exam_id: 'exam-1',
  section_id: 'section-1',
  mode: 'existing-exam',
  source_format: 'csv',
  status: 'applied',
  question_count: 2,
  imported_question_ids: ['q-1', 'q-2'],
  imported_by: null,
  imported_by_email: adminActor.email,
  imported_by_name: adminActor.name,
  metadata: {},
  rollback_reason: null,
  rolled_back_at: null,
  rolled_back_by: null,
  rolled_back_by_email: null,
  created_at: '2026-10-21T10:00:00Z',
  completed_at: '2026-10-21T10:00:01Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('ExamImportHistoryService', () => {
  it('creates a pending import batch with the admin actor', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'batch-1' }, error: null }),
      }),
    });
    (supabase.from as any).mockReturnValue({ insert });

    const batchId = await ExamImportHistoryService.createImportBatch({
      examId: 'exam-1',
      sectionId: 'section-1',
      mode: 'section',
      sourceFormat: 'json',
      actor: adminActor,
    });

    expect(batchId).toBe('batch-1');
    expect(supabase.from).toHaveBeenCalledWith('exam_import_batches');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        exam_id: 'exam-1',
        section_id: 'section-1',
        mode: 'section',
        source_format: 'json',
        status: 'pending',
        imported_by_email: adminActor.email,
      }),
    );
  });

  it('stores question snapshots for a batch', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert });

    await ExamImportHistoryService.appendBatchItems('batch-1', [
      { questionId: 'q-1', sectionId: 's-1', snapshot: { question_text: 'Q1' } },
    ]);

    expect(insert).toHaveBeenCalledWith([
      {
        batch_id: 'batch-1',
        question_id: 'q-1',
        section_id: 's-1',
        question_snapshot: { question_text: 'Q1' },
      },
    ]);
  });

  it('lists import batches for a specific exam', async () => {
    const eq = vi.fn().mockResolvedValue({ data: [sampleBatch], error: null });
    const limit = vi.fn().mockReturnValue({ eq });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    (supabase.from as any).mockReturnValue({ select });

    const batches = await ExamImportHistoryService.listImportBatches({ examId: 'exam-1' });

    expect(batches).toEqual([sampleBatch]);
    expect(eq).toHaveBeenCalledWith('exam_id', 'exam-1');
  });

  it('computes import stats including distinct admins and rollbacks', async () => {
    vi.spyOn(ExamImportHistoryService, 'listImportBatches').mockResolvedValue([
      sampleBatch,
      {
        ...sampleBatch,
        id: 'batch-2',
        status: 'rolled_back',
        question_count: 3,
        imported_by_email: 'other-admin@example.com',
      },
    ] as any);

    const stats = await ExamImportHistoryService.getImportStats('exam-1');

    expect(stats).toEqual({
      totalBatches: 2,
      totalQuestions: 5,
      lastImportAt: '2026-10-21T10:00:00Z',
      distinctAdmins: 2,
      rolledBackCount: 1,
    });
  });

  it('refuses rollback without explicit admin confirmation', async () => {
    await expect(
      ExamImportHistoryService.rollbackBatch('batch-1', { adminConfirmed: false }),
    ).rejects.toThrow(/admin tasdig'i/);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('refuses rollback from a non-admin actor', async () => {
    await expect(
      ExamImportHistoryService.rollbackBatch('batch-1', {
        adminConfirmed: true,
        actor: { id: null, email: 'student@example.com' },
      }),
    ).rejects.toThrow(/faqat admin/);
  });

  it('rolls back a batch by deleting only its imported questions', async () => {
    const batchUpdates: any[] = [];
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'exam_import_batches') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: sampleBatch, error: null }),
            }),
          }),
          update: (payload: any) => {
            batchUpdates.push(payload);
            return { eq: async () => ({ error: null }) };
          },
        };
      }
      if (table === 'exam_import_batch_items') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [{ question_id: 'q-1' }, { question_id: 'q-2' }],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'exam_questions') {
        return {
          delete: () => ({
            in: () => ({
              select: async () => ({
                data: [{ id: 'q-1' }, { id: 'q-2' }],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'exams') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await ExamImportHistoryService.rollbackBatch('batch-1', {
      adminConfirmed: true,
      reason: 'Noto‘g‘ri import',
      actor: adminActor,
    });

    expect(result).toEqual({ batchId: 'batch-1', deletedCount: 2, status: 'rolled_back' });
    expect(batchUpdates).toHaveLength(1);
    expect(batchUpdates[0]).toMatchObject({
      status: 'rolled_back',
      rollback_reason: 'Noto‘g‘ri import',
      rolled_back_by_email: adminActor.email,
    });
  });

  it('rolls back a full-exam import by deleting the created exam', async () => {
    const batchUpdates: any[] = [];
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'exam_import_batches') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { ...sampleBatch, mode: 'full-exam', section_id: null },
                error: null,
              }),
            }),
          }),
          update: (payload: any) => {
            batchUpdates.push(payload);
            return { eq: async () => ({ error: null }) };
          },
        };
      }
      if (table === 'exam_import_batch_items') {
        return {
          select: () => ({
            eq: () => ({ order: async () => ({ data: [], error: null }) }),
          }),
        };
      }
      if (table === 'exams') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          delete: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      return {};
    });

    const result = await ExamImportHistoryService.rollbackBatch('batch-1', {
      adminConfirmed: true,
      actor: adminActor,
    });

    expect(result.deletedCount).toBe(2);
    expect(batchUpdates[0].status).toBe('rolled_back');
  });

  it('reverts to the previous non-current version snapshot', async () => {
    vi.spyOn(ExamImportHistoryService, 'listVersions').mockResolvedValue([
      { id: 'v-3', version_number: 3, is_current: true },
      { id: 'v-2', version_number: 2, is_current: false },
      { id: 'v-1', version_number: 1, is_current: false },
    ] as any);
    const revertSpy = vi
      .spyOn(ExamImportHistoryService, 'revertToVersion')
      .mockResolvedValue({ examId: 'exam-1', versionNumber: 2, restoredQuestions: 4 });

    const result = await ExamImportHistoryService.revertToPreviousVersion('exam-1', {
      adminConfirmed: true,
      actor: adminActor,
    });

    expect(revertSpy).toHaveBeenCalledWith('v-2', {
      adminConfirmed: true,
      actor: adminActor,
    });
    expect(result).toEqual({ examId: 'exam-1', versionNumber: 2, restoredQuestions: 4 });
  });

  it('refuses to revert to a previous version when fewer than two versions exist', async () => {
    vi.spyOn(ExamImportHistoryService, 'listVersions').mockResolvedValue([
      { id: 'v-1', version_number: 1, is_current: true },
    ] as any);
    const revertSpy = vi.spyOn(ExamImportHistoryService, 'revertToVersion');

    await expect(
      ExamImportHistoryService.revertToPreviousVersion('exam-1', {
        adminConfirmed: true,
        actor: adminActor,
      }),
    ).rejects.toThrow(/oldingi versiya/);
    expect(revertSpy).not.toHaveBeenCalled();
  });

  describe('export', () => {
    const snapshot: ExamContentSnapshot = {
      exam: { id: 'exam-1', title: 'JLPT N3 Mock', type: 'N3' },
      sections: [
        {
          id: 's-1',
          exam_id: 'exam-1',
          title: 'Dokkai',
          type: 'reading',
          content: 'Passage matni',
          order_index: 0,
        },
      ],
      questions: [
        {
          id: 'q-1',
          section_id: 's-1',
          question_text: 'Savol, "quote" bilan',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Izoh',
          difficulty: 'hard',
          translation: 'Tarjima',
          order_index: 0,
        },
      ],
      passages: [],
      audios: [],
      capturedAt: '2026-10-21T10:00:00Z',
    };

    it('exports exam questions as JSON with preserved fields', async () => {
      vi.spyOn(ExamImportHistoryService, 'buildSnapshot').mockResolvedValue(snapshot);

      const json = await ExamImportHistoryService.exportExamAsJson('exam-1');
      const parsed = JSON.parse(json);

      expect(parsed.exam.title).toBe('JLPT N3 Mock');
      expect(parsed.sections[0].questions[0]).toMatchObject({
        question_text: 'Savol, "quote" bilan',
        correct_answer: 'A',
        translation: 'Tarjima',
        difficulty: 'hard',
        level: 'N3',
      });
    });

    it('exports exam questions as escaped CSV', async () => {
      vi.spyOn(ExamImportHistoryService, 'buildSnapshot').mockResolvedValue(snapshot);

      const csv = await ExamImportHistoryService.exportExamAsCsv('exam-1');

      expect(csv.split('\n')).toHaveLength(2);
      expect(csv).toContain('"Savol, ""quote"" bilan"');
      expect(csv).toContain('A,B,C,D');
      expect(csv).toContain('N3');
      expect(csv).toContain('hard');
    });
  });
});
