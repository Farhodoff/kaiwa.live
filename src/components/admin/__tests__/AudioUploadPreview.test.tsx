import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioUploadPreview } from '../AudioUploadPreview';
import * as ListeningService from '../../../services/ListeningAudioService';

describe('AudioUploadPreview Component Tests (Task 5)', () => {
  const mockAudio: ListeningService.ListeningAudio = {
    id: 'audio-1',
    exam_id: 'exam-1',
    title: 'Mondai 1 Audio',
    audio_url: 'tracks/audio1.mp3',
    transcript: 'Tanaka: Konnichiwa',
    uz_translation: 'Tanaka: Salom',
    speaker: 'Tanaka',
    duration_seconds: 65,
    order_index: 0,
    created_at: '2026-10-21T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders audio player preview, formatted duration, speaker, and transcript', () => {
    render(
      <AudioUploadPreview
        audio={mockAudio}
        onChange={vi.fn()}
        onUpload={vi.fn()}
        onRemoveAudio={vi.fn()}
      />,
    );

    expect(screen.getByText(/Audio Pleyer \(Preview\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Davomiylik: 1:05 \(65 soniya\)/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tanaka')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tanaka: Konnichiwa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tanaka: Salom')).toBeInTheDocument();
  });

  it('validates file upload and triggers onUpload when valid MP3 is chosen', async () => {
    const handleUpload = vi.fn();
    render(<AudioUploadPreview audio={mockAudio} onChange={vi.fn()} onUpload={handleUpload} />);

    const input = screen.getByTestId('audio-file-input');
    const validFile = new File(['dummy audio'], 'sample.mp3', { type: 'audio/mpeg' });

    fireEvent.change(input, { target: { files: [validFile] } });

    const uploadBtn = screen.getByRole('button', { name: /Saqlash omboriga yuklash/i });
    expect(uploadBtn).toBeInTheDocument();

    fireEvent.click(uploadBtn);
    expect(handleUpload).toHaveBeenCalledWith(validFile);
  });

  it('displays validation error if invalid file format is chosen', () => {
    render(<AudioUploadPreview audio={mockAudio} onChange={vi.fn()} onUpload={vi.fn()} />);

    const input = screen.getByTestId('audio-file-input');
    const invalidFile = new File(['text'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(
      screen.getByText(/Faqat MP3 yoki WAV formatdagi audio fayllar qabul qilinadi/i),
    ).toBeInTheDocument();
  });

  it('runs health check and displays status banner upon clicking check button (Talab 6)', async () => {
    vi.spyOn(ListeningService, 'checkAudioHealth').mockResolvedValue({
      exists: true,
      playable: true,
      status: 'ok',
      message: 'Audio mavjud va muammosiz ijro etiladi.',
      duration: 65,
    });

    render(<AudioUploadPreview audio={mockAudio} onChange={vi.fn()} onUpload={vi.fn()} />);

    const checkBtn = screen.getByTestId('check-audio-health-btn');
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(ListeningService.checkAudioHealth).toHaveBeenCalledWith('tracks/audio1.mp3');
      expect(screen.getByTestId('audio-health-banner')).toBeInTheDocument();
      expect(screen.getByText(/Audio holati: Alo/i)).toBeInTheDocument();
      expect(screen.getByText(/Audio mavjud va muammosiz ijro etiladi/i)).toBeInTheDocument();
    });
  });
});
