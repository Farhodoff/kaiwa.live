import { supabase } from '../lib/supabase';

const BUCKET = 'listening_audios';
const ALLOWED_TYPES = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav']);
const MAX_SIZE_MB = 25;

export interface ListeningAudio {
  id: string;
  exam_id: string;
  title: string;
  audio_url: string | null;
  transcript: string | null;
  uz_translation: string | null;
  speaker: string | null;
  duration_seconds: number | null;
  order_index: number;
  created_at: string;
  linkedQuestionCount?: number;
  file?: File;
  exists?: boolean;
  playable?: boolean;
}

export interface ListeningAudioInput {
  title: string;
  transcript?: string;
  uz_translation?: string;
  speaker?: string;
  order_index?: number;
}

/** Extract audio duration in seconds from a File using the HTML media element. */
export function extractDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    if (!/^(audio\/(mpeg|mp3|wav))$/i.test(file.type)) {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let resolved = false;
    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
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
  });
}

/** Validate a file is an allowed MP3/WAV within the size limit. */
export function validateAudioFile(file: File): { ok: true } | { ok: false; message: string } {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, message: 'Faqat MP3 yoki WAV formatdagi audio fayl qabul qilinadi.' };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { ok: false, message: `Fayl hajmi ${MAX_SIZE_MB} MB dan oshmasligi kerak.` };
  }
  return { ok: true };
}

/** Public URL for an object in the listening_audios bucket. */
export function publicAudioUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Check whether an uploaded audio object actually exists and is reachable (HEAD request). */
export async function checkAudioExists(path: string): Promise<boolean> {
  if (!path) return false;
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) return false;
    return data.size > 0;
  } catch {
    return false;
  }
}
export class ListeningAudioService {
  /** Fetch all listening audios of an exam, with linked-question counts. */
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
    if (audioIds.length > 0) {
      const { data: qData } = await supabase
        .from('exam_questions')
        .select('listening_audio_id')
        .in('listening_audio_id', audioIds);
      for (const q of qData || []) {
        if (q.listening_audio_id)
          counts[q.listening_audio_id] = (counts[q.listening_audio_id] || 0) + 1;
      }
    }
    return audios.map((a) => ({ ...a, linkedQuestionCount: counts[a.id] || 0 }));
  }

  static async create(examId: string, input: ListeningAudioInput): Promise<ListeningAudio> {
    const { data, error } = await supabase
      .from('listening_audios')
      .insert({
        exam_id: examId,
        ...input,
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

    const fileName = `${recordId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadErr) throw uploadErr;

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
   * Delete a listening audio. Removes the storage object too. If linked questions
   * exist, throws with detail so the caller can warn instead of cascading.
   */
  static async delete(id: string): Promise<void> {
    const audio = await this.getById(id);
    if (!audio) throw new Error('Audio topilmadi.');

    const { data: linked, error: qErr } = await supabase
      .from('exam_questions')
      .select('id, question_text')
      .eq('listening_audio_id', id);

    if (qErr) throw qErr;
    if (linked && linked.length > 0) {
      const err: any = new Error(
        `Bu audio bilan ${linked.length} ta savol biriktirilgan. Avval ularni o'chiring yoki boshqa audioga biriktiring.`,
      );
      err.code = 'HAS_LINKED_QUESTIONS';
      err.linkedQuestions = linked;
      throw err;
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

  private static async getById(id: string): Promise<ListeningAudio | null> {
    const { data, error } = await supabase
      .from('listening_audios')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as ListeningAudio;
  }
}
