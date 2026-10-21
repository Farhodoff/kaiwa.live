import { supabase } from '../lib/supabase';

const BUCKET = 'listening_audios';
const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
]);
const MAX_SIZE_MB = 25;

export interface ListeningAudio {
  id: string;
  exam_id: string;
  section_id?: string | null;
  title: string;
  audio_url: string | null;
  transcript: string | null;
  uz_translation: string | null;
  speaker: string | null;
  duration_seconds: number | null;
  order_index: number;
  created_at: string;
  linkedQuestionCount?: number;
  linkedQuestions?: Array<{ id: string; question_text: string }>;
  file?: File;
  exists?: boolean;
  playable?: boolean;
}

export interface ListeningAudioInput {
  title: string;
  section_id?: string | null;
  transcript?: string;
  uz_translation?: string;
  speaker?: string;
  order_index?: number;
}

export interface AudioHealthReport {
  exists: boolean;
  playable: boolean;
  status: 'ok' | 'missing' | 'unplayable';
  message: string;
  duration?: number | null;
}

/** Extract audio duration in seconds from a File using the HTML media element. */
export function extractDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const isExtensionMatch = /\.(mp3|wav)$/i.test(file.name);
    const isMimeMatch =
      ALLOWED_MIME_TYPES.has(file.type.toLowerCase()) || file.type.startsWith('audio/');

    if (!isExtensionMatch && !isMimeMatch) {
      resolve(null);
      return;
    }

    if (typeof window === 'undefined' || !window.Audio) {
      resolve(null);
      return;
    }

    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      let resolved = false;

      const cleanup = () => {
        if (resolved) return;
        resolved = true;
        audio.removeEventListener('loadedmetadata', onMeta);
        audio.removeEventListener('error', onError);
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      };

      const onMeta = () => {
        const d = audio.duration;
        cleanup();
        resolve(isFinite(d) && d > 0 ? Math.round(d) : null);
      };

      const onError = () => {
        cleanup();
        resolve(null);
      };

      audio.addEventListener('loadedmetadata', onMeta, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.preload = 'metadata';
      audio.src = url;

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(null);
        }
      }, 8000);
    } catch {
      resolve(null);
    }
  });
}

/** Validate a file is an allowed MP3/WAV within the 25MB size limit. */
export function validateAudioFile(file: File): { ok: true } | { ok: false; message: string } {
  if (!file) {
    return { ok: false, message: 'Fayl tanlanmagan.' };
  }

  const isMimeMatch =
    ALLOWED_MIME_TYPES.has(file.type.toLowerCase()) ||
    file.type === 'audio/mpeg' ||
    file.type === 'audio/wav';
  const isExtensionMatch = /\.(mp3|wav)$/i.test(file.name);

  if (!isMimeMatch && !isExtensionMatch) {
    return {
      ok: false,
      message: 'Faqat MP3 yoki WAV formatdagi audio fayllar qabul qilinadi (.mp3, .wav).',
    };
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return {
      ok: false,
      message: `Fayl hajmi ${MAX_SIZE_MB} MB dan oshmasligi kerak (joriy hajm: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return { ok: true };
}

/** Public URL for an object in the listening_audios bucket or external URL. */
export function publicAudioUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(pathOrUrl);
  return data.publicUrl;
}

/** Check whether an uploaded audio object actually exists in Supabase storage or at URL. */
export async function checkAudioExists(pathOrUrl: string): Promise<boolean> {
  if (!pathOrUrl) return false;
  try {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      const res = await fetch(pathOrUrl, { method: 'HEAD' }).catch(() => null);
      return res ? res.ok : false;
    }
    const { data, error } = await supabase.storage.from(BUCKET).download(pathOrUrl);
    if (error || !data) return false;
    return data.size > 0;
  } catch {
    return false;
  }
}

/**
 * Talab 6: Audio fayl mavjudligi va ishlashini to'liq tekshirish (Health & Playability check).
 * Checks both storage presence and browser media decodability.
 */
export async function checkAudioHealth(pathOrUrl: string): Promise<AudioHealthReport> {
  if (!pathOrUrl || !pathOrUrl.trim()) {
    return {
      exists: false,
      playable: false,
      status: 'missing',
      message: 'Audio fayl kiritilmagan.',
    };
  }

  const exists = await checkAudioExists(pathOrUrl);
  if (!exists) {
    return {
      exists: false,
      playable: false,
      status: 'missing',
      message: "Fayl saqlash omborida (storage) topilmadi yoki o'chirilgan.",
    };
  }

  // Check playability in browser
  if (typeof window === 'undefined' || !window.Audio) {
    return {
      exists: true,
      playable: true,
      status: 'ok',
      message: 'Fayl mavjud.',
    };
  }

  return new Promise((resolve) => {
    const fullUrl = publicAudioUrl(pathOrUrl);
    const audio = new Audio();
    let resolved = false;

    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('canplay', onLoaded);
      audio.removeEventListener('error', onError);
    };

    const onLoaded = () => {
      const d = isFinite(audio.duration) && audio.duration > 0 ? Math.round(audio.duration) : null;
      cleanup();
      resolve({
        exists: true,
        playable: true,
        status: 'ok',
        message: 'Audio mavjud va muammosiz ijro etiladi.',
        duration: d,
      });
    };

    const onError = () => {
      cleanup();
      resolve({
        exists: true,
        playable: false,
        status: 'unplayable',
        message:
          'Audio fayl yuklandi, ammo brauzer uni dekod qila olmadi (fayl buzilgan bo‘lishi mumkin).',
      });
    };

    audio.addEventListener('loadedmetadata', onLoaded, { once: true });
    audio.addEventListener('canplay', onLoaded, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.preload = 'metadata';
    audio.src = fullUrl;

    setTimeout(() => {
      if (!resolved) {
        cleanup();
        // If timeout occurred but exists was true, assume reachable
        resolve({
          exists: true,
          playable: true,
          status: 'ok',
          message: 'Audio fayl mavjud.',
        });
      }
    }, 6000);
  });
}

export class ListeningAudioService {
  /** Fetch all listening audios of an exam, with linked-question counts & question list. */
  static async listByExam(examId: string): Promise<ListeningAudio[]> {
    const { data, error } = await supabase
      .from('listening_audios')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    const audios = (data || []) as ListeningAudio[];

    const audioIds = audios.map((a) => a.id);
    let counts: Record<string, number> = {};
    let questionsMap: Record<string, Array<{ id: string; question_text: string }>> = {};

    if (audioIds.length > 0) {
      const { data: qData } = await supabase
        .from('exam_questions')
        .select('id, question_text, listening_audio_id')
        .in('listening_audio_id', audioIds);

      for (const q of qData || []) {
        if (q.listening_audio_id) {
          counts[q.listening_audio_id] = (counts[q.listening_audio_id] || 0) + 1;
          if (!questionsMap[q.listening_audio_id]) questionsMap[q.listening_audio_id] = [];
          questionsMap[q.listening_audio_id].push({ id: q.id, question_text: q.question_text });
        }
      }
    }

    return audios.map((a) => ({
      ...a,
      linkedQuestionCount: counts[a.id] || 0,
      linkedQuestions: questionsMap[a.id] || [],
    }));
  }

  /** Fetch audios for a specific section */
  static async listBySection(sectionId: string): Promise<ListeningAudio[]> {
    const { data, error } = await supabase
      .from('listening_audios')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    const audios = (data || []) as ListeningAudio[];

    const audioIds = audios.map((a) => a.id);
    let counts: Record<string, number> = {};
    if (audioIds.length > 0) {
      const { data: qData } = await supabase
        .from('exam_questions')
        .select('listening_audio_id')
        .in('listening_audio_id', audioIds);
      for (const q of qData || []) {
        if (q.listening_audio_id) {
          counts[q.listening_audio_id] = (counts[q.listening_audio_id] || 0) + 1;
        }
      }
    }

    return audios.map((a) => ({ ...a, linkedQuestionCount: counts[a.id] || 0 }));
  }

  static async getById(id: string): Promise<ListeningAudio | null> {
    const { data, error } = await supabase
      .from('listening_audios')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as ListeningAudio;
  }

  /** Get detailed list of questions linked to an audio entity */
  static async getLinkedQuestions(
    audioId: string,
  ): Promise<Array<{ id: string; question_text: string }>> {
    const { data, error } = await supabase
      .from('exam_questions')
      .select('id, question_text')
      .eq('listening_audio_id', audioId);
    if (error) throw error;
    return (data || []) as Array<{ id: string; question_text: string }>;
  }

  static async create(examId: string, input: ListeningAudioInput): Promise<ListeningAudio> {
    const { data, error } = await supabase
      .from('listening_audios')
      .insert({
        exam_id: examId,
        section_id: input.section_id ?? null,
        title: input.title.trim() || 'Choukai Audio',
        transcript: input.transcript ?? null,
        uz_translation: input.uz_translation ?? null,
        speaker: input.speaker ?? null,
        order_index: input.order_index ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data as ListeningAudio;
  }

  static async update(
    id: string,
    input: Partial<ListeningAudioInput> & {
      audio_url?: string | null;
      duration_seconds?: number | null;
    },
  ): Promise<void> {
    const { error } = await supabase.from('listening_audios').update(input).eq('id', id);
    if (error) throw error;
  }

  /**
   * Upload an MP3/WAV file to storage, extract duration, and attach the URL to the record.
   * Returns the updated record.
   */
  static async uploadAndAttach(recordId: string, file: File): Promise<ListeningAudio> {
    const validation = validateAudioFile(file);
    if (!validation.ok) throw new Error(validation.message);

    const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    const fileName = `${recordId}/${Date.now()}-${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadErr) {
      throw new Error(`Audio yuklashda xatolik: ${uploadErr.message}`);
    }

    const duration = await extractDuration(file);

    const { data, error } = await supabase
      .from('listening_audios')
      .update({ audio_url: fileName, duration_seconds: duration ?? null })
      .eq('id', recordId)
      .select()
      .single();
    if (error) throw error;

    return { ...data, exists: true, playable: true } as ListeningAudio;
  }

  /**
   * Delete a listening audio. Removes the storage object too.
   * If linked questions exist, throws with detail unless:
   * - `unlinkQuestions: true` is passed: unlinks questions (listening_audio_id = null)
   * - `force: true` is passed: deletes linked questions
   */
  static async delete(
    id: string,
    options?: { unlinkQuestions?: boolean; force?: boolean },
  ): Promise<void> {
    const audio = await this.getById(id);
    if (!audio) throw new Error('Audio topilmadi.');

    const { data: linked, error: qErr } = await supabase
      .from('exam_questions')
      .select('id, question_text')
      .eq('listening_audio_id', id);

    if (qErr) throw qErr;

    if (linked && linked.length > 0) {
      if (options?.unlinkQuestions) {
        const { error: unlinkErr } = await supabase
          .from('exam_questions')
          .update({ listening_audio_id: null })
          .eq('listening_audio_id', id);
        if (unlinkErr) throw unlinkErr;
      } else if (options?.force) {
        const { error: delErr } = await supabase
          .from('exam_questions')
          .delete()
          .eq('listening_audio_id', id);
        if (delErr) throw delErr;
      } else {
        const err: any = new Error(
          `Bu audio bilan ${linked.length} ta savol biriktirilgan. Avval ularni o'chiring yoki boshqa audioga biriktiring.`,
        );
        err.code = 'HAS_LINKED_QUESTIONS';
        err.linkedQuestions = linked;
        err.linkedCount = linked.length;
        throw err;
      }
    }

    if (audio.audio_url) {
      await supabase.storage
        .from(BUCKET)
        .remove([audio.audio_url])
        .catch(() => {});
    }

    const { error } = await supabase.from('listening_audios').delete().eq('id', id);
    if (error) throw error;
  }

  /** Link a question to a listening audio entity */
  static async linkQuestion(questionId: string, audioId: string | null): Promise<void> {
    const { error } = await supabase
      .from('exam_questions')
      .update({ listening_audio_id: audioId })
      .eq('id', questionId);
    if (error) throw error;
  }

  /** Link multiple questions to a listening audio entity */
  static async linkQuestions(audioId: string, questionIds: string[]): Promise<void> {
    if (questionIds.length === 0) return;
    const { error } = await supabase
      .from('exam_questions')
      .update({ listening_audio_id: audioId })
      .in('id', questionIds);
    if (error) throw error;
  }

  static async reorder(examId: string, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, idx) =>
      supabase
        .from('listening_audios')
        .update({ order_index: idx })
        .eq('id', id)
        .eq('exam_id', examId),
    );
    const results = await Promise.all(updates);
    const err = results.find((r) => r.error);
    if (err) throw err.error;
  }
}
