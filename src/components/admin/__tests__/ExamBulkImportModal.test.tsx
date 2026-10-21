import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ExamBulkImportModal } from '../ExamBulkImportModal';
import { ExamBulkImportService } from '../../../services/ExamBulkImportService';
import { ExamAiExtractorService } from '../../../services/ExamAiExtractorService';

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: { id: 'mock-exam-1' }, error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          single: vi.fn().mockResolvedValue({ data: { exam_id: 'mock-exam-1' }, error: null }),
        }),
        single: vi.fn().mockResolvedValue({ data: { id: 'mock-sec-1' }, error: null }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  },
}));

// Mock toast
vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('ExamBulkImportModal (Task 3: Preview, Table View, Editing & Confirmation)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    mode: 'full-exam' as const,
    examLevel: 'N3' as const,
  };

  const sampleCsvContent = `question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,passage,level,section
彼女はいつも服を着ている,派手,地味,清潔,親切,派手,Izoh matni 1,,"N3",knowledge
読解問題の筆者の主張は何か,A,B,C,D,A,Izoh matni 2,科学技術の進歩は人間の生活を変えた。,"N3",reading`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal headers and switches between file and text input', () => {
    render(<ExamBulkImportModal {...defaultProps} />);

    expect(screen.getByText(/Ommaviy Imtihon Importi/i)).toBeInTheDocument();
    expect(screen.getByText(/Fayl yuklash/i)).toBeInTheDocument();

    // Click text tab
    const textTab = screen.getByRole('button', { name: /Matn ko‘rinishida kiritish/i });
    fireEvent.click(textTab);

    expect(screen.getByPlaceholderText(/CSV yoki JSON matnini/i)).toBeInTheDocument();
  });

  it('renders parsed questions in structured table view with columns and badges', () => {
    render(<ExamBulkImportModal {...defaultProps} />);

    // Switch to text mode and input sample CSV
    const textTab = screen.getByRole('button', { name: /Matn ko‘rinishida kiritish/i });
    fireEvent.click(textTab);

    const textarea = screen.getByPlaceholderText(/CSV yoki JSON matnini/i);
    fireEvent.change(textarea, { target: { value: sampleCsvContent } });

    // Table view headers
    const table = screen.getByRole('table');
    expect(within(table).getByText('Holat')).toBeInTheDocument();
    expect(within(table).getByText('Bo‘lim / Daraja')).toBeInTheDocument();
    expect(within(table).getByText('Savol va Passage')).toBeInTheDocument();
    expect(within(table).getByText('Variantlar & To‘g‘ri Javob')).toBeInTheDocument();
    expect(within(table).getByText('Amallar')).toBeInTheDocument();

    // Rows and contents inside the table
    expect(within(table).getByText(/彼女はいつも服を着ている/)).toBeInTheDocument();
    expect(within(table).getByText(/読解問題の筆者の主張は何か/)).toBeInTheDocument();

    // Passage button should exist for reading question
    expect(within(table).getByText(/Passage \(Matn\)/i)).toBeInTheDocument();
  });

  it('allows editing question, passage, options, correct answer, and explanation', () => {
    render(<ExamBulkImportModal {...defaultProps} />);

    // Switch to text mode and input sample CSV
    const textTab = screen.getByRole('button', { name: /Matn ko‘rinishida kiritish/i });
    fireEvent.click(textTab);

    const textarea = screen.getByPlaceholderText(/CSV yoki JSON matnini/i);
    fireEvent.change(textarea, { target: { value: sampleCsvContent } });

    // Find and click "Tahrirlash" on first question
    const editButtons = screen.getAllByRole('button', { name: /Tahrirlash/i });
    fireEvent.click(editButtons[0]);

    // Editing form opens
    expect(screen.getByText(/#1-savolni tahrirlash/i)).toBeInTheDocument();

    // Edit question text
    const questionInput = screen.getByPlaceholderText(/Savol matnini kiriting/i);
    fireEvent.change(questionInput, {
      target: { value: '彼女はいつも新しい靴を履いている' },
    });

    // Edit explanation
    const explanationInput = screen.getByPlaceholderText(/To'g'ri javob sababi va qoidasi/i);
    fireEvent.change(explanationInput, {
      target: { value: 'Yangilangan izoh matni' },
    });

    // Save edit
    const saveBtn = screen.getByRole('button', { name: /Saqlash va Qayta tekshirish/i });
    fireEvent.click(saveBtn);

    // Verify updated question is displayed in table
    const table = screen.getByRole('table');
    expect(within(table).getByText(/彼女はいつも新しい靴を履いている/)).toBeInTheDocument();
  });

  it('allows repairing an invalid question and converts it to valid', () => {
    // CSV with an error (empty question)
    const brokenCsv = `question_text,option_a,option_b,option_c,option_d,correct_answer,level,section
"",A,B,C,D,A,N3,knowledge`;

    render(<ExamBulkImportModal {...defaultProps} />);

    const textTab = screen.getByRole('button', { name: /Matn ko‘rinishida kiritish/i });
    fireEvent.click(textTab);

    const textarea = screen.getByPlaceholderText(/CSV yoki JSON matnini/i);
    fireEvent.change(textarea, { target: { value: brokenCsv } });

    // Status shows error
    const table = screen.getByRole('table');
    expect(within(table).getByText(/Xatolik/i)).toBeInTheDocument();

    // Click "Qayta tuzatish" button
    const fixButton = screen.getByRole('button', { name: /Qayta tuzatish/i });
    fireEvent.click(fixButton);

    // Enter a valid question text
    const questionInput = screen.getByPlaceholderText(/Savol matnini kiriting/i);
    fireEvent.change(questionInput, {
      target: { value: 'Tuzatilgan yangi savol matni' },
    });

    // Click save
    const saveBtn = screen.getByRole('button', { name: /Saqlash va Qayta tekshirish/i });
    fireEvent.click(saveBtn);

    // Error disappears, status becomes To'g'ri
    expect(screen.queryByText(/Xatolik: 1/i)).not.toBeInTheDocument();
    expect(within(table).getByText('Tuzatilgan yangi savol matni')).toBeInTheDocument();
  });

  it('allows deleting an invalid question so that blocking errors are eliminated', () => {
    const brokenCsv = `question_text,option_a,option_b,option_c,option_d,correct_answer,level,section
Valid savol matni birinchi,A,B,C,D,A,N3,knowledge
"",A,B,C,D,A,N3,knowledge`;

    render(<ExamBulkImportModal {...defaultProps} />);

    const textTab = screen.getByRole('button', { name: /Matn ko‘rinishida kiritish/i });
    fireEvent.click(textTab);

    const textarea = screen.getByPlaceholderText(/CSV yoki JSON matnini/i);
    fireEvent.change(textarea, { target: { value: brokenCsv } });

    // Initially blocking error exists
    expect(screen.getByText(/Xatolarni tuzating/i)).toBeInTheDocument();

    // Delete row 2 (which has error)
    const deleteButtons = screen.getAllByTitle(/O'chirish/i);
    fireEvent.click(deleteButtons[1]);

    // Row 2 is marked deleted, blocking error is resolved, "Tasdiqlash" becomes active
    expect(screen.getByRole('button', { name: /Tasdiqlash \(1\)/i })).toBeInTheDocument();
  });

  it('switches to Real Imtihon Preview and enables interactive answer simulation', () => {
    render(<ExamBulkImportModal {...defaultProps} />);

    const textTab = screen.getByRole('button', { name: /Matn ko‘rinishida kiritish/i });
    fireEvent.click(textTab);

    const textarea = screen.getByPlaceholderText(/CSV yoki JSON matnini/i);
    fireEvent.change(textarea, { target: { value: sampleCsvContent } });

    // Switch to preview mode
    const previewModeBtn = screen.getByRole('button', { name: /Real Imtihon Preview/i });
    fireEvent.click(previewModeBtn);

    // Official JLPT exam layout widgets
    expect(screen.getByText(/Haqiqiy talaba ko‘rinishi/i)).toBeInTheDocument();
    expect(screen.getByText(/01:45:00/)).toBeInTheDocument();
    expect(screen.getByText(/【問題本文 \/ Reading Passage】/i)).toBeInTheDocument();

    // Toggle answers visibility
    const toggleAnswersBtn = screen.getByRole('button', {
      name: /To‘g‘ri javoblarni ko‘rsatish/i,
    });
    fireEvent.click(toggleAnswersBtn);
    expect(screen.getByText(/Javoblar ko‘rsatilgan/i)).toBeInTheDocument();

    // Click simulation button
    const simBtn = screen.getByRole('button', { name: /Natijani hisoblash/i });
    fireEvent.click(simBtn);

    expect(screen.getByText(/Simulyatsiya Natijasi/i)).toBeInTheDocument();
  });

  it('triggers Draft saving with isPublished: false', async () => {
    const importFullSpy = vi
      .spyOn(ExamBulkImportService, 'importFullExamWithSections')
      .mockResolvedValue({ examId: 'new-exam-123', totalInserted: 2 });

    render(<ExamBulkImportModal {...defaultProps} />);

    const textTab = screen.getByRole('button', { name: /Matn ko‘rinishida kiritish/i });
    fireEvent.click(textTab);

    const textarea = screen.getByPlaceholderText(/CSV yoki JSON matnini/i);
    fireEvent.change(textarea, { target: { value: sampleCsvContent } });

    // Check copyright confirmation
    const copyrightCheckbox = screen.getByLabelText(/Mualliflik huquqi roziligi/i);
    fireEvent.click(copyrightCheckbox);

    // Draft save button
    const draftBtn = screen.getByRole('button', { name: /Draft sifatida saqlash \(2\)/i });
    fireEvent.click(draftBtn);

    await waitFor(() => {
      expect(importFullSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublished: false,
          copyrightConfirmed: true,
        }),
      );
    });
  });

  it('triggers Confirmation with isPublished: true', async () => {
    const importFullSpy = vi
      .spyOn(ExamBulkImportService, 'importFullExamWithSections')
      .mockResolvedValue({ examId: 'new-exam-123', totalInserted: 2 });

    render(<ExamBulkImportModal {...defaultProps} />);

    const textTab = screen.getByRole('button', { name: /Matn ko‘rinishida kiritish/i });
    fireEvent.click(textTab);

    const textarea = screen.getByPlaceholderText(/CSV yoki JSON matnini/i);
    fireEvent.change(textarea, { target: { value: sampleCsvContent } });

    // Check copyright confirmation
    const copyrightCheckbox = screen.getByLabelText(/Mualliflik huquqi roziligi/i);
    fireEvent.click(copyrightCheckbox);

    // Confirmation button
    const confirmBtn = screen.getByRole('button', { name: /Tasdiqlash \(2\)/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(importFullSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublished: true,
          copyrightConfirmed: true,
        }),
      );
    });
  });

  describe('Task 4: AI Extraction from PDF & Text with Retry, Recommendations & Draft Enforcing', () => {
    it('switches to AI extraction tab and loads demo text', () => {
      render(<ExamBulkImportModal {...defaultProps} />);

      const aiTabBtn = screen.getByRole('button', { name: /AI bilan ajratish/i });
      fireEvent.click(aiTabBtn);

      expect(screen.getByText(/AI Yordamida Savollarni Avtomatik Ajratish/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Namuna matnni yuklash/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Namuna matnni yuklash/i }));
      const textarea = screen.getByPlaceholderText(/Savollar matnini bu yerga joylashtiring/i);
      expect((textarea as HTMLTextAreaElement).value).toContain('JLPT N3 Sinov Savollari');
    });

    it('runs AI extraction, displays recommendations, and enforces Draft status', async () => {
      const mockResult = {
        recommendedLevel: 'N2' as const,
        recommendedSection: 'knowledge' as const,
        recommendedTitle: 'JLPT N2 Sinov Imtihoni',
        summary: '1 ta savol muvaffaqiyatli ajratildi.',
        isDraft: true as const,
        questions: [
          {
            id: 'ai-1',
            question_text: '彼女はいつも服を着ている。',
            passage: null,
            options: ['派手な', '地味な', '親切な', '清潔な'],
            correct_answer: '派手な',
            correct_index: 0,
            explanation: 'Izoh matni.',
            level: 'N2' as const,
            section_type: 'knowledge' as const,
            section_name: 'Gengo Chishiki',
            question_type: 'vocabulary',
            difficulty: 'medium' as const,
            is_published: false as const,
          },
        ],
      };

      const extractSpy = vi
        .spyOn(ExamAiExtractorService, 'extractQuestions')
        .mockResolvedValue(mockResult);

      render(<ExamBulkImportModal {...defaultProps} />);

      // Switch to AI tab
      fireEvent.click(screen.getByRole('button', { name: /AI bilan ajratish/i }));

      // Enter text
      const textarea = screen.getByPlaceholderText(/Savollar matnini bu yerga joylashtiring/i);
      fireEvent.change(textarea, {
        target: { value: '1. 彼女はいつも服を着ている。 1) 派手な 2) 地味な' },
      });

      // Click AI Extract button
      const extractBtn = screen.getByRole('button', { name: /AI bilan savollarni ajratish/i });
      fireEvent.click(extractBtn);

      await waitFor(() => {
        expect(extractSpy).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('1 ta savol muvaffaqiyatli ajratildi.')).toBeInTheDocument();
        expect(screen.getByText('彼女はいつも服を着ている。')).toBeInTheDocument();
      });

      // Retry button is available
      const retryBtn = screen.getByRole('button', { name: /Qayta ishlash/i });
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(extractSpy).toHaveBeenCalledTimes(2);
    });

    it('displays error message and allows retry when AI extraction fails', async () => {
      const extractSpy = vi
        .spyOn(ExamAiExtractorService, 'extractQuestions')
        .mockRejectedValue(new Error('AI tahlilida parser xatosi'));

      render(<ExamBulkImportModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /AI bilan ajratish/i }));
      const textarea = screen.getByPlaceholderText(/Savollar matnini bu yerga joylashtiring/i);
      fireEvent.change(textarea, { target: { value: 'Noto‘g‘ri formatdagi matn' } });

      const extractBtn = screen.getByRole('button', { name: /AI bilan savollarni ajratish/i });
      fireEvent.click(extractBtn);

      await waitFor(() => {
        expect(screen.getByText(/AI tahlilida parser xatosi/i)).toBeInTheDocument();
      });

      // Click retry
      const retryBtn = screen.getByRole('button', { name: /Qayta urinish/i });
      fireEvent.click(retryBtn);
      expect(extractSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Task 7: Source & License Metadata, Copyright and Restricted Warnings', () => {
    it('renders source, author, license fields and copyright checkbox', () => {
      render(<ExamBulkImportModal {...defaultProps} />);
      expect(screen.getByPlaceholderText(/JLPT Speed Master, So-matome/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ask Publishing/i)).toBeInTheDocument();
      expect(screen.getByText(/Litsenziya turi \(License Type\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mualliflik huquqi roziligi/i)).toBeInTheDocument();
    });

    it('blocks import when copyright is not confirmed', async () => {
      const importFullSpy = vi.spyOn(ExamBulkImportService, 'importFullExamWithSections');
      render(<ExamBulkImportModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /Matn ko‘rinishida kiritish/i }));
      fireEvent.change(screen.getByPlaceholderText(/CSV yoki JSON matnini/i), {
        target: { value: sampleCsvContent },
      });

      // Do NOT check copyright checkbox
      const draftBtn = screen.getByRole('button', { name: /Draft sifatida saqlash/i });
      fireEvent.click(draftBtn);

      expect(importFullSpy).not.toHaveBeenCalled();
    });

    it('displays warning banner when Restricted license is selected', () => {
      render(<ExamBulkImportModal {...defaultProps} />);
      const licenseSelect = screen.getByDisplayValue(/Original \(Platforma/i);
      fireEvent.change(licenseSelect, { target: { value: 'restricted' } });

      expect(screen.getByText(/Restricted Material/i)).toBeInTheDocument();
    });

    it('displays warning when isOfficialJlpt is checked without official source', () => {
      render(<ExamBulkImportModal {...defaultProps} />);
      const officialCheckbox = screen.getByLabelText(/Rasmiy JLPT Materiali/i);
      fireEvent.click(officialCheckbox);

      expect(screen.getByText(/Japan Foundation \/ JEES/i)).toBeInTheDocument();
    });
  });
});
