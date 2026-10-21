import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ListeningAudioEditor } from '../ListeningAudioEditor';
import {
  ListeningAudioService,
  type ListeningAudio,
} from '../../../services/ListeningAudioService';

vi.mock('../../../services/ListeningAudioService', async () => {
  const actual = await vi.importActual('../../../services/ListeningAudioService');
  return {
    ...actual,
    ListeningAudioService: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      uploadAndAttach: vi.fn(),
    },
  };
});

describe('ListeningAudioEditor Component Tests (Task 5)', () => {
  const mockAudio: ListeningAudio = {
    id: 'a-1',
    exam_id: 'exam-1',
    section_id: 'sec-2',
    title: 'Mondai 1 Track',
    audio_url: 'tracks/audio1.mp3',
    transcript: 'Tanaka suhbati',
    uz_translation: 'Tanaka suhbati tarjimasi',
    speaker: 'Tanaka & Satou',
    duration_seconds: 90,
    order_index: 0,
    created_at: '2026-10-21T00:00:00Z',
    linkedQuestionCount: 3,
    linkedQuestions: [
      { id: 'q-1', question_text: 'Tanaka qayerga boradi?' },
      { id: 'q-2', question_text: 'Satou nima buyurdi?' },
      { id: 'q-3', question_text: 'Uchrashuv soati nechada?' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders audio title, speaker, linked question badge, and preview', () => {
    render(<ListeningAudioEditor audio={mockAudio} onUpdate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByDisplayValue('Mondai 1 Track')).toBeInTheDocument();
    expect(screen.getByText('3 ta savol biriktirilgan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tanaka & Satou')).toBeInTheDocument();
  });

  it('opens delete confirmation warning modal when deleting audio with linked questions (Talab 7)', () => {
    render(<ListeningAudioEditor audio={mockAudio} onUpdate={vi.fn()} onDelete={vi.fn()} />);

    const deleteBtn = screen.getByTestId('delete-audio-btn');
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Audio faylni o‘chirish/i)).toBeInTheDocument();
    expect(screen.getAllByText(/3 ta savol/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Ushbu audio bilan/i)).toBeInTheDocument();
    expect(screen.getByText('Tanaka qayerga boradi?')).toBeInTheDocument();
    expect(screen.getByText('Satou nima buyurdi?')).toBeInTheDocument();
    expect(screen.getByText('Uchrashuv soati nechada?')).toBeInTheDocument();
    expect(screen.getByText(/Bog‘lanishni uzish va audioni o‘chirish/i)).toBeInTheDocument();
  });

  it('unlinks questions safely when selecting unlink option in delete warning modal', async () => {
    const handleDelete = vi.fn();
    (ListeningAudioService.delete as any).mockResolvedValue(undefined);

    render(<ListeningAudioEditor audio={mockAudio} onUpdate={vi.fn()} onDelete={handleDelete} />);

    const deleteBtn = screen.getByTestId('delete-audio-btn');
    fireEvent.click(deleteBtn);

    const unlinkBtn = screen.getByRole('button', {
      name: /Bog‘lanishni uzish va audioni o‘chirish \(Savollar saqlanadi\)/i,
    });
    fireEvent.click(unlinkBtn);

    await waitFor(() => {
      expect(ListeningAudioService.delete).toHaveBeenCalledWith('a-1', {
        unlinkQuestions: true,
        force: false,
      });
      expect(handleDelete).toHaveBeenCalledWith('a-1');
    });
  });

  it('displays empty state and allows creating first audio track when audios array is empty', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Mondai 1 Yangi Audio');
    (ListeningAudioService.create as any).mockResolvedValue({
      id: 'a-new',
      exam_id: 'exam-1',
      title: 'Mondai 1 Yangi Audio',
      order_index: 0,
    });

    const handleUpdate = vi.fn();

    render(
      <ListeningAudioEditor
        audios={[]}
        examId="exam-1"
        sectionId="sec-2"
        onUpdate={handleUpdate}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Ushbu bo‘limda hali Choukai audiosi mavjud emas/i),
    ).toBeInTheDocument();
    const createBtn = screen.getByTestId('create-listening-audio-btn');
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(ListeningAudioService.create).toHaveBeenCalledWith('exam-1', {
        title: 'Mondai 1 Yangi Audio',
        section_id: 'sec-2',
        order_index: 0,
      });
    });
  });
});
