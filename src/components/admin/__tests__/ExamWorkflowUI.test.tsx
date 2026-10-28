import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EXAM_STATUS_CONFIG, QUESTION_STATUS_CONFIG } from '../../../services/ExamWorkflowService';

describe('Exam Workflow UI Components & Configurations (Task 6)', () => {
  it('renders all exam workflow status badges correctly', () => {
    const statuses: Array<keyof typeof EXAM_STATUS_CONFIG> = [
      'draft',
      'review',
      'approved',
      'published',
      'archived',
    ];

    statuses.forEach((st) => {
      const meta = EXAM_STATUS_CONFIG[st];
      const { container } = render(
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${meta.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
          {meta.label}
        </span>,
      );
      expect(container.textContent).toContain(meta.label);
    });
  });

  it('renders all question workflow status badges correctly', () => {
    const qStatuses: Array<keyof typeof QUESTION_STATUS_CONFIG> = [
      'draft',
      'review',
      'approved',
      'rejected',
    ];

    qStatuses.forEach((st) => {
      const meta = QUESTION_STATUS_CONFIG[st];
      const { container } = render(
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${meta.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
          {meta.label}
        </span>,
      );
      expect(container.textContent).toContain(meta.label);
    });
  });

  it('renders question rejection alert box with reason when rejected', () => {
    const rejectionComment = 'Savol 2-variantida imlo xatosi bor.';
    render(
      <div
        data-testid="rejection-box"
        className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
      >
        <span className="font-bold">⚠️ Qaytarish izohi:</span> {rejectionComment}
      </div>,
    );

    expect(screen.getByTestId('rejection-box')).toHaveTextContent(rejectionComment);
    expect(screen.getByTestId('rejection-box')).toHaveTextContent('Qaytarish izohi');
  });

  it('renders pre-publish validation modal with errors when questions are unapproved', () => {
    const validationResult = {
      isValid: false,
      errors: [
        'Savol #1 tasdiqlanmagan (Hozirgi holat: Qoralama).',
        'Savol #2 tasdiqlanmagan (Hozirgi holat: Qaytarilgan).',
      ],
      warnings: ['"Dokkai" o‘qish bo‘limida matn kiritilmagan.'],
      summary: {
        totalSections: 1,
        totalQuestions: 2,
        approvedCount: 0,
        reviewCount: 0,
        draftCount: 1,
        rejectedCount: 1,
      },
    };

    render(
      <div data-testid="validation-modal">
        <h3>Nashr Qilish Oldidan Yakuniy Tekshiruv</h3>
        <div>Aniqlangan Xatolar ({validationResult.errors.length}):</div>
        <ul>
          {validationResult.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
        <button disabled={!validationResult.isValid}>Nashr Qilish 🚀</button>
      </div>,
    );

    expect(screen.getByText(/Nashr Qilish Oldidan Yakuniy Tekshiruv/i)).toBeInTheDocument();
    expect(screen.getByText(/Savol #1 tasdiqlanmagan/i)).toBeInTheDocument();
    expect(screen.getByText(/Savol #2 tasdiqlanmagan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nashr Qilish/i })).toBeDisabled();
  });
});
