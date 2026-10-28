import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ListeningAudioService,
  validateAudioFile,
  publicAudioUrl,
  checkAudioExists,
  checkAudioHealth,
} from '../ListeningAudioService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

describe('ListeningAudioService Unit Tests (Task 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Audio File Validation (MP3/WAV & Size)', () => {
    it('accepts valid MP3 and WAV files', () => {
      const mp3File = new File(['dummy audio content'], 'audio1.mp3', { type: 'audio/mpeg' });
      const wavFile = new File(['dummy audio content'], 'audio2.wav', { type: 'audio/wav' });

      expect(validateAudioFile(mp3File)).toEqual({ ok: true });
      expect(validateAudioFile(wavFile)).toEqual({ ok: true });
    });

    it('accepts files with audio/mp3 or audio/x-wav mime types and matching extensions', () => {
      const mp3Alt = new File(['content'], 'test.mp3', { type: 'audio/mp3' });
      const wavAlt = new File(['content'], 'test.wav', { type: 'audio/x-wav' });

      expect(validateAudioFile(mp3Alt)).toEqual({ ok: true });
      expect(validateAudioFile(wavAlt)).toEqual({ ok: true });
    });

    it('rejects unsupported file formats', () => {
      const pdfFile = new File(['dummy pdf'], 'exam.pdf', { type: 'application/pdf' });
      const mp4File = new File(['dummy video'], 'video.mp4', { type: 'video/mp4' });

      const resPdf = validateAudioFile(pdfFile);
      expect(resPdf.ok).toBe(false);
      expect((resPdf as any).message).toContain('MP3 yoki WAV');

      const resMp4 = validateAudioFile(mp4File);
      expect(resMp4.ok).toBe(false);
    });

    it('rejects files larger than 25MB', () => {
      const bigFile = new File(['a'], 'huge.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(bigFile, 'size', { value: 26 * 1024 * 1024 });

      const res = validateAudioFile(bigFile);
      expect(res.ok).toBe(false);
      expect((res as any).message).toContain('25 MB');
    });
  });

  describe('Public Audio URL Resolution', () => {
    it('returns public URL from Supabase storage for relative path', () => {
      (supabase.storage.from as any).mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({
          data: {
            publicUrl: 'https://supabase.co/storage/v1/object/public/listening_audios/track.mp3',
          },
        }),
      });

      const url = publicAudioUrl('track.mp3');
      expect(url).toBe('https://supabase.co/storage/v1/object/public/listening_audios/track.mp3');
    });

    it('preserves absolute URLs', () => {
      const absUrl = 'https://example.com/audio/sample.mp3';
      expect(publicAudioUrl(absUrl)).toBe(absUrl);
    });

    it('handles empty string gracefully', () => {
      expect(publicAudioUrl('')).toBe('');
    });
  });

  describe('checkAudioExists & checkAudioHealth', () => {
    it('checkAudioExists returns true when storage download succeeds with content', async () => {
      (supabase.storage.from as any).mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: { size: 1024 },
          error: null,
        }),
      });

      const exists = await checkAudioExists('track.mp3');
      expect(exists).toBe(true);
    });

    it('checkAudioExists returns false when storage download fails', async () => {
      (supabase.storage.from as any).mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('File not found'),
        }),
      });

      const exists = await checkAudioExists('missing.mp3');
      expect(exists).toBe(false);
    });

    it('checkAudioHealth returns missing report when path is empty or file not found', async () => {
      (supabase.storage.from as any).mockReturnValue({
        download: vi.fn().mockResolvedValue({ data: null, error: new Error('404') }),
      });

      const repEmpty = await checkAudioHealth('');
      expect(repEmpty.status).toBe('missing');
      expect(repEmpty.exists).toBe(false);

      const repMissing = await checkAudioHealth('not_found.mp3');
      expect(repMissing.status).toBe('missing');
      expect(repMissing.exists).toBe(false);
    });
  });

  describe('ListeningAudio CRUD & Linked Questions (Task 5)', () => {
    it('listByExam fetches audios and maps linkedQuestionCount correctly', async () => {
      const mockAudios = [
        {
          id: 'audio-1',
          exam_id: 'exam-1',
          title: 'Mondai 1',
          audio_url: 'audio1.mp3',
          transcript: 'Konichiwa',
          uz_translation: 'Salom',
          speaker: 'Tanaka',
          duration_seconds: 45,
          order_index: 0,
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'listening_audios') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockAudios, error: null }),
              }),
            }),
          };
        }
        if (table === 'exam_questions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: 'q-1', question_text: 'Listening Q1', listening_audio_id: 'audio-1' },
                  { id: 'q-2', question_text: 'Listening Q2', listening_audio_id: 'audio-1' },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const list = await ListeningAudioService.listByExam('exam-1');
      expect(list.length).toBe(1);
      expect(list[0].linkedQuestionCount).toBe(2);
      expect(list[0].linkedQuestions?.length).toBe(2);
      expect(list[0].speaker).toBe('Tanaka');
      expect(list[0].uz_translation).toBe('Salom');
    });

    it('delete throws HAS_LINKED_QUESTIONS if questions are attached', async () => {
      const mockAudio = { id: 'audio-1', exam_id: 'exam-1', audio_url: 'a.mp3' };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'listening_audios') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockAudio, error: null }),
              }),
            }),
          };
        }
        if (table === 'exam_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'q-10', question_text: 'Question 10' }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      await expect(ListeningAudioService.delete('audio-1')).rejects.toMatchObject({
        code: 'HAS_LINKED_QUESTIONS',
        linkedCount: 1,
      });
    });

    it('delete with unlinkQuestions: true sets listening_audio_id to null and removes storage object', async () => {
      const mockAudio = { id: 'audio-1', exam_id: 'exam-1', audio_url: 'path/track.mp3' };
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockRemoveStorage = vi.fn().mockResolvedValue({ error: null });

      (supabase.storage.from as any).mockReturnValue({
        remove: mockRemoveStorage,
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'listening_audios') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockAudio, error: null }),
              }),
            }),
            delete: mockDelete,
          };
        }
        if (table === 'exam_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'q-1', question_text: 'Q1' }],
                error: null,
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      await ListeningAudioService.delete('audio-1', { unlinkQuestions: true });

      expect(mockUpdate).toHaveBeenCalledWith({ listening_audio_id: null });
      expect(mockRemoveStorage).toHaveBeenCalledWith(['path/track.mp3']);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('linkQuestion links question to listening audio', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      (supabase.from as any).mockReturnValue({ update: mockUpdate });

      await ListeningAudioService.linkQuestion('q-1', 'audio-55');
      expect(mockUpdate).toHaveBeenCalledWith({ listening_audio_id: 'audio-55' });
    });
  });
});
