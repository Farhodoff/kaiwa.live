import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReadingPassageService } from '../ReadingPassageService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('ReadingPassageService Unit Tests (Task 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listByExam fetches passages and maps linked question counts correctly', async () => {
    const mockPassages = [
      {
        id: 'p-1',
        exam_id: 'exam-1',
        title: 'Dokkai Short 1',
        content: 'Sample text 1',
        order_index: 0,
        created_at: '2026-10-21T00:00:00Z',
      },
      {
        id: 'p-2',
        exam_id: 'exam-1',
        title: 'Dokkai Medium 2',
        content: 'Sample text 2',
        order_index: 1,
        created_at: '2026-10-21T00:00:00Z',
      },
    ];

    const mockQuestions = [
      { id: 'q-1', question_text: 'Savol 1', passage_id: 'p-1' },
      { id: 'q-2', question_text: 'Savol 2', passage_id: 'p-1' },
      { id: 'q-3', question_text: 'Savol 3', passage_id: 'p-2' },
    ];

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'reading_passages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockPassages, error: null }),
            }),
          }),
        };
      }
      if (table === 'exam_questions') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: mockQuestions, error: null }),
          }),
        };
      }
      return {};
    });

    const result = await ReadingPassageService.listByExam('exam-1');
    expect(result.length).toBe(2);
    expect(result[0].linkedQuestionCount).toBe(2);
    expect(result[0].linkedQuestions?.length).toBe(2);
    expect(result[1].linkedQuestionCount).toBe(1);
  });

  it('create saves reading passage with section_id and order_index', async () => {
    const newPassage = {
      id: 'p-new',
      exam_id: 'exam-1',
      section_id: 'sec-reading-1',
      title: 'Yangi Dokkai',
      content: 'Japanese text...',
      order_index: 0,
      created_at: '2026-10-21T00:00:00Z',
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newPassage, error: null }),
        }),
      }),
    });

    const created = await ReadingPassageService.create('exam-1', {
      title: 'Yangi Dokkai',
      content: 'Japanese text...',
      section_id: 'sec-reading-1',
    });

    expect(created.id).toBe('p-new');
    expect(created.title).toBe('Yangi Dokkai');
  });

  it('delete throws HAS_LINKED_QUESTIONS if passage has questions attached', async () => {
    const mockPassage = {
      id: 'p-1',
      exam_id: 'exam-1',
      title: 'Passage With Questions',
      content: 'Content',
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'reading_passages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPassage, error: null }),
            }),
          }),
        };
      }
      if (table === 'exam_questions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'q-1', question_text: 'Savol 1' },
                { id: 'q-2', question_text: 'Savol 2' },
              ],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    await expect(ReadingPassageService.delete('p-1')).rejects.toMatchObject({
      code: 'HAS_LINKED_QUESTIONS',
      linkedCount: 2,
    });
  });

  it('delete with unlinkQuestions: true decouples linked questions before deleting', async () => {
    const mockPassage = { id: 'p-1', exam_id: 'exam-1' };
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'reading_passages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockPassage, error: null }),
            }),
          }),
          delete: mockDelete,
        };
      }
      if (table === 'exam_questions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: 'q-1', question_text: 'Savol 1' }],
              error: null,
            }),
          }),
          update: mockUpdate,
        };
      }
      return {};
    });

    await ReadingPassageService.delete('p-1', { unlinkQuestions: true });
    expect(mockUpdate).toHaveBeenCalledWith({ passage_id: null });
    expect(mockDelete).toHaveBeenCalled();
  });

  it('linkQuestion and linkQuestions update question passage_id', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
      in: vi.fn().mockResolvedValue({ error: null }),
    });

    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
    });

    await ReadingPassageService.linkQuestion('q-1', 'p-10');
    expect(mockUpdate).toHaveBeenCalledWith({ passage_id: 'p-10' });

    await ReadingPassageService.linkQuestions('p-20', ['q-1', 'q-2']);
    expect(mockUpdate).toHaveBeenCalledWith({ passage_id: 'p-20' });
  });
});
