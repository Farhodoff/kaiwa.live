import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExamImportHistoryModal } from '../ExamImportHistoryModal';
import { ExamImportHistoryService } from '../../../services/ExamImportHistoryService';

vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const batch = {
  id: '12345678-abcd-1234-abcd-123456789012',
  exam_id: 'exam-1',
  section_id: 'section-1',
  mode: 'existing-exam',
  source_format: 'csv',
  status: 'applied',
  question_count: 2,
  imported_question_ids: ['q-1', 'q-2'],
  imported_by: null,
  imported_by_email: 'admin@example.com',
  imported_by_name: 'Admin',
  metadata: {},
  rollback_reason: null,
  rolled_back_at: null,
  rolled_back_by: null,
  rolled_back_by_email: null,
  created_at: '2026-10-21T10:00:00Z',
  completed_at: '2026-10-21T10:00:01Z',
};

describe('ExamImportHistoryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.spyOn(ExamImportHistoryService, 'listImportBatches').mockResolvedValue([batch as any]);
    vi.spyOn(ExamImportHistoryService, 'listVersions').mockResolvedValue([
      {
        id: 'v-2',
        exam_id: 'exam-1',
        version_number: 2,
        is_current: true,
        label: 'Versiya 2',
        created_at: '2026-10-21T10:00:00Z',
        created_by_email: 'admin@example.com',
      },
      {
        id: 'v-1',
        exam_id: 'exam-1',
        version_number: 1,
        is_current: false,
        label: 'Versiya 1',
        created_at: '2026-10-20T10:00:00Z',
        created_by_email: 'admin@example.com',
      },
    ] as any);
  });

  it('shows batch author, date, mode and question count', async () => {
    render(
      <ExamImportHistoryModal isOpen onClose={vi.fn()} examId="exam-1" examTitle="JLPT N3 Mock" />,
    );

    expect(await screen.findByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Mavjud imtihonga')).toBeInTheDocument();
    expect(screen.getByText('2 savol')).toBeInTheDocument();
    expect(screen.getByText('Qo‘llangan')).toBeInTheDocument();
  });

  it('requires explicit admin confirmation before rollback', async () => {
    const rollbackSpy = vi
      .spyOn(ExamImportHistoryService, 'rollbackBatch')
      .mockResolvedValue({ batchId: batch.id, deletedCount: 2, status: 'rolled_back' });
    const onChanged = vi.fn();

    render(
      <ExamImportHistoryModal isOpen onClose={vi.fn()} examId="exam-1" onChanged={onChanged} />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /Rollback/i }));
    expect(rollbackSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Import batchni rollback qilish/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Sabab/i), {
      target: { value: 'Noto‘g‘ri savollar' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Admin sifatida tasdiqlash/i }));

    await waitFor(() => {
      expect(rollbackSpy).toHaveBeenCalledWith(batch.id, {
        adminConfirmed: true,
        reason: 'Noto‘g‘ri savollar',
      });
    });
    expect(onChanged).toHaveBeenCalled();
  });

  it('downloads JSON export from the history panel', async () => {
    const exportSpy = vi.spyOn(ExamImportHistoryService, 'downloadExamExport').mockResolvedValue();

    render(<ExamImportHistoryModal isOpen onClose={vi.fn()} examId="exam-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /JSON eksport/i }));

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledWith('exam-1', 'json');
    });
  });

  it('shows previous version revert action in versions tab', async () => {
    render(<ExamImportHistoryModal isOpen onClose={vi.fn()} examId="exam-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /Versiyalar \(2\)/i }));

    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Oldingi versiyaga qaytish/i })).toBeEnabled();
  });
});
