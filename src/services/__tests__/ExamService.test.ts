import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamService } from '../ExamService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('ExamService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes every legacy standalone exam for the common runner', async () => {
    for (const level of ['n5', 'n4', 'n3', 'n2', 'n1']) {
      const exam = await ExamService.getExamWithQuestions(`exam_jlpt_${level}_1`);
      expect(exam.level).toBe(level.toUpperCase());
      expect(exam.questions.length).toBeGreaterThan(0);
      expect(
        exam.questions.every((q) => q.correctAnswer >= 0 && q.correctAnswer < q.options.length),
      ).toBe(true);
    }
    expect(supabase.from).not.toHaveBeenCalled();
  });
  it('does not silently replace an unavailable selected exam with N5', async () => {
    (supabase.from as any).mockReturnValue({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: new Error('offline') }) }),
      }),
    });
    await expect(ExamService.getExamWithQuestions('missing-exam', 'N1')).rejects.toThrow(
      'Tanlangan imtihonni',
    );
  });
  it('preserves linked reading and listening content in the shared question model', async () => {
    (supabase.from as any).mockImplementation((table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { id: 'linked', title: 'Linked exam', type: 'JLPT N3' },
            error: null,
          }),
          order: async () => ({
            data: [
              { id: 'reading', type: 'Reading' },
              { id: 'listening', type: 'Listening' },
            ],
            error: null,
          }),
        }),
        in: async () => ({
          data:
            table === 'reading_passages'
              ? [{ id: 'passage', content: 'Linked passage text' }]
              : [
                  {
                    id: 'audio',
                    audio_url: 'https://example.com/track.mp3',
                    transcript: 'Linked transcript',
                  },
                ],
          error: null,
        }),
      }),
    }));
    // Questions require ordering after filtering, unlike linked asset lookups.
    const original = (supabase.from as any).getMockImplementation();
    (supabase.from as any).mockImplementation((table: string) =>
      table === 'exam_questions'
        ? {
            select: () => ({
              in: () => ({
                order: async () => ({
                  data: [
                    {
                      id: 'q-read',
                      section_id: 'reading',
                      question_text: 'Read',
                      options: ['A', 'B'],
                      correct_answer: 'B',
                      passage_id: 'passage',
                    },
                    {
                      id: 'q-listen',
                      section_id: 'listening',
                      question_text: 'Listen',
                      options: ['A', 'B'],
                      correct_answer: 'A',
                      listening_audio_id: 'audio',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }
        : original(table),
    );
    const exam = await ExamService.getExamWithQuestions('linked');
    expect(exam.questions[0].passageText).toBe('Linked passage text');
    expect(exam.questions[1].audioUrl).toBe('https://example.com/track.mp3');
    expect(exam.questions[1].script).toBe('Linked transcript');
  });

  it('parseLevelFromType correctly identifies JLPT levels', () => {
    expect(ExamService.parseLevelFromType('JLPT N1')).toBe('N1');
    expect(ExamService.parseLevelFromType('jlpt n2 advanced')).toBe('N2');
    expect(ExamService.parseLevelFromType('N3')).toBe('N3');
    expect(ExamService.parseLevelFromType('JLPT N4')).toBe('N4');
    expect(ExamService.parseLevelFromType("Boshlang'ich N5")).toBe('N5');
    expect(ExamService.parseLevelFromType(undefined)).toBe('N5');
  });

  it('returns fallback exams when Supabase call fails or returns empty', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ilike: vi.fn().mockRejectedValue(new Error('Network error')),
          }),
        }),
      }),
    });

    const exams = await ExamService.getPublishedJlptExams('N5');
    expect(exams.length).toBe(4);
    expect(exams[0].level).toBe('N5');
    expect(exams[0].title).toContain('JLPT N5');
    expect(exams[1].id).toBe('builtin_n5_set2');
    expect(exams[2].id).toBe('builtin_n5_set3');
    expect(exams[2].title).toContain("3-to'plam");
    expect(exams[3].id).toBe('builtin_n5_random');
  });

  it('fetches and maps published exams from Supabase successfully', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ilike: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'exam-1',
                  title: 'JLPT N2 2026 Test',
                  description: 'Desc',
                  type: 'JLPT N2',
                  is_published: true,
                  created_at: '2026-08-01T00:00:00Z',
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    });

    const exams = await ExamService.getPublishedJlptExams('N2');
    expect(exams.length).toBe(1);
    expect(exams[0].id).toBe('exam-1');
    expect(exams[0].level).toBe('N2');
    expect(exams[0].title).toBe('JLPT N2 2026 Test');
  });

  it('handles builtin_ slugs directly without database query', async () => {
    const exam1 = await ExamService.getExamWithQuestions('builtin_n3');
    expect(exam1.level).toBe('N3');
    expect(exam1.questions.length).toBe(25);
    expect(exam1.isFromDb).toBe(false);

    const exam2 = await ExamService.getExamWithQuestions('builtin_n3_set2');
    expect(exam2.level).toBe('N3');
    expect(exam2.title).toContain("2-to'plam");
    expect(exam2.questions.length).toBe(25);
    expect(exam2.isFromDb).toBe(false);

    const exam3 = await ExamService.getExamWithQuestions('builtin_n3_set3');
    expect(exam3.level).toBe('N3');
    expect(exam3.title).toContain("3-to'plam");
    expect(exam3.questions.length).toBe(25);
    expect(exam3.isFromDb).toBe(false);
  });

  it('normalizes DB exam sections and questions correctly with matching option index', async () => {
    const mockExam = {
      id: 'mock-exam-uuid',
      title: 'JLPT N5 Real Test',
      type: 'JLPT N5',
      description: 'Test desc',
    };

    const mockSections = [
      {
        id: 'sec-read-1',
        exam_id: 'mock-exam-uuid',
        title: '読解 (Reading)',
        type: 'Reading',
        content: 'Reading passage content here.',
        order_index: 1,
      },
    ];

    const mockQuestions = [
      {
        id: 'q-1',
        section_id: 'sec-read-1',
        question_text: 'Savol matni?',
        options: ['Javob A', 'Javob B', 'Javob C', 'Javob D'],
        correct_answer: 'Javob B', // exact string matching
        explanation: "Javob B to'g'ri.",
        order_index: 1,
      },
    ];

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'exams') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockExam, error: null }),
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
      return {};
    });

    const result = await ExamService.getExamWithQuestions('mock-exam-uuid');
    expect(result.id).toBe('mock-exam-uuid');
    expect(result.level).toBe('N5');
    expect(result.isFromDb).toBe(true);
    expect(result.questions.length).toBe(1);
    expect(result.questions[0].section).toBe('reading');
    expect(result.questions[0].passageText).toBe('Reading passage content here.');
    expect(result.questions[0].correctAnswer).toBe(1); // 'Javob B' is index 1 in options
    expect(result.questions[0].explanationUzbek).toBe("Javob B to'g'ri.");
  });
});
