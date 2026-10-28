import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReadingPassageEditor } from '../ReadingPassageEditor';
import {
  ReadingPassageService,
  type ReadingPassage,
} from '../../../services/ReadingPassageService';

vi.mock('../../../services/ReadingPassageService', () => ({
  ReadingPassageService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ReadingPassageEditor Component Tests (Task 5)', () => {
  const mockPassage: ReadingPassage = {
    id: 'p-1',
    exam_id: 'exam-1',
    section_id: 'sec-1',
    title: 'Dokkai Qisqa Matn 1',
    content: '田中さんは毎日日本語を勉強しています。',
    order_index: 0,
    created_at: '2026-10-21T00:00:00Z',
    linkedQuestionCount: 2,
    linkedQuestions: [
      { id: 'q-1', question_text: 'Tanaka nima qiladi?' },
      { id: 'q-2', question_text: 'Qachon o‘qiydi?' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders passage title, content, and linked question badge', () => {
    render(<ReadingPassageEditor passage={mockPassage} onUpdate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Dokkai Qisqa Matn 1')).toBeInTheDocument();
    expect(screen.getByText('2 ta savol biriktirilgan')).toBeInTheDocument();
    expect(screen.getByText(/田中さんは毎日日本語を勉強しています/)).toBeInTheDocument();
  });

  it('toggles edit mode and saves updated content and title', async () => {
    const handleUpdate = vi.fn();
    (ReadingPassageService.update as any).mockResolvedValue(undefined);

    render(
      <ReadingPassageEditor passage={mockPassage} onUpdate={handleUpdate} onDelete={vi.fn()} />,
    );

    const editBtn = screen.getByTestId('edit-passage-btn');
    fireEvent.click(editBtn);

    const titleInput = screen.getByDisplayValue('Dokkai Qisqa Matn 1');
    fireEvent.change(titleInput, { target: { value: 'Dokkai Yangilangan Sarlavha' } });

    const saveBtn = screen.getByRole('button', { name: /Saqlash/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(ReadingPassageService.update).toHaveBeenCalledWith('p-1', {
        title: 'Dokkai Yangilangan Sarlavha',
        content: '田中さんは毎日日本語を勉強しています。',
      });
      expect(handleUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Dokkai Yangilangan Sarlavha' }),
      );
    });
  });

  it('opens warning modal when deleting passage with linked questions (Talab 7)', () => {
    render(<ReadingPassageEditor passage={mockPassage} onUpdate={vi.fn()} onDelete={vi.fn()} />);

    const deleteBtn = screen.getByTestId('delete-passage-btn');
    fireEvent.click(deleteBtn);

    // Warning modal should appear with details
    expect(screen.getByText(/Dokkai matnini o‘chirish/i)).toBeInTheDocument();
    expect(screen.getAllByText(/2 ta savol/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Ushbu matnga/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tanaka nima qiladi?')).toBeInTheDocument();
    expect(screen.getByText('Qachon o‘qiydi?')).toBeInTheDocument();
    expect(screen.getByText(/Bog‘lanishni uzish va faqat matnni o‘chirish/i)).toBeInTheDocument();
  });

  it('unlinks questions safely when selecting unlink option in delete warning modal', async () => {
    const handleDelete = vi.fn();
    (ReadingPassageService.delete as any).mockResolvedValue(undefined);

    render(
      <ReadingPassageEditor passage={mockPassage} onUpdate={vi.fn()} onDelete={handleDelete} />,
    );

    const deleteBtn = screen.getByTestId('delete-passage-btn');
    fireEvent.click(deleteBtn);

    const unlinkBtn = screen.getByRole('button', {
      name: /Bog‘lanishni uzish va faqat matnni o‘chirish/i,
    });
    fireEvent.click(unlinkBtn);

    await waitFor(() => {
      expect(ReadingPassageService.delete).toHaveBeenCalledWith('p-1', {
        unlinkQuestions: true,
        force: false,
      });
      expect(handleDelete).toHaveBeenCalledWith('p-1');
    });
  });

  it('displays empty state and allows creating first passage when passages array is empty', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Mavzu 1 Matni');
    (ReadingPassageService.create as any).mockResolvedValue({
      id: 'p-new',
      exam_id: 'exam-1',
      title: 'Mavzu 1 Matni',
      content: '',
      order_index: 0,
    });

    const handleUpdate = vi.fn();

    render(
      <ReadingPassageEditor
        passages={[]}
        examId="exam-1"
        sectionId="sec-1"
        onUpdate={handleUpdate}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(/Ushbu bo‘limda hali Dokkai matni mavjud emas/i)).toBeInTheDocument();
    const createBtn = screen.getByTestId('create-reading-passage-btn');
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(ReadingPassageService.create).toHaveBeenCalledWith('exam-1', {
        title: 'Mavzu 1 Matni',
        content: '',
        section_id: 'sec-1',
        order_index: 0,
      });
    });
  });
});
