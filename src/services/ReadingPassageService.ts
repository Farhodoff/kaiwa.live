import { supabase } from '../lib/supabase';

export interface ReadingPassage {
  id: string;
  exam_id: string;
  title: string;
  content: string;
  order_index: number;
  created_at: string;
  linkedQuestionCount?: number;
}

export interface ReadingPassageInput {
  title: string;
  content: string;
  order_index?: number;
}

export class ReadingPassageService {
  /** Fetch all passages of an exam, with linked-question counts. */
  static async listByExam(examId: string): Promise<ReadingPassage[]> {
    const { data, error } = await supabase
      .from('reading_passages')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    const passages = (data || []) as ReadingPassage[];

    // Count linked questions per passage
    const passageIds = passages.map((p) => p.id);
    let counts: Record<string, number> = {};
    if (passageIds.length > 0) {
      const { data: qData } = await supabase
        .from('exam_questions')
        .select('passage_id')
        .in('passage_id', passageIds);
      for (const q of qData || []) {
        if (q.passage_id) counts[q.passage_id] = (counts[q.passage_id] || 0) + 1;
      }
    }
    return passages.map((p) => ({ ...p, linkedQuestionCount: counts[p.id] || 0 }));
  }

  static async create(examId: string, input: ReadingPassageInput): Promise<ReadingPassage> {
    const { data, error } = await supabase
      .from('reading_passages')
      .insert({ exam_id: examId, ...input, order_index: input.order_index ?? 0 })
      .select()
      .single();
    if (error) throw error;
    return data as ReadingPassage;
  }

  static async update(id: string, input: Partial<ReadingPassageInput>): Promise<void> {
    const { error } = await supabase.from('reading_passages').update(input).eq('id', id);
    if (error) throw error;
  }

  /**
   * Delete a passage. If it has linked questions, throws with a detail message
   * so the caller can surface a warning instead of silently cascading.
   */
  static async delete(id: string): Promise<void> {
    const passage = await this.getById(id);
    if (!passage) throw new Error('Passage topilmadi.');

    const { data: linked, error: qErr } = await supabase
      .from('exam_questions')
      .select('id, question_text')
      .eq('passage_id', id);

    if (qErr) throw qErr;
    if (linked && linked.length > 0) {
      const err: any = new Error(
        `Bu matniga ${linked.length} ta savol biriktirilgan. Avval ularni o'chiring yoki boshqa matnga biriktiring.`,
      );
      err.code = 'HAS_LINKED_QUESTIONS';
      err.linkedQuestions = linked;
      throw err;
    }

    const { error } = await supabase.from('reading_passages').delete().eq('id', id);
    if (error) throw error;
  }

  private static async getById(id: string): Promise<ReadingPassage | null> {
    const { data, error } = await supabase
      .from('reading_passages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as ReadingPassage;
  }

  /** Reorder passages within an exam. */
  static async reorder(examId: string, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, idx) =>
      supabase
        .from('reading_passages')
        .update({ order_index: idx })
        .eq('id', id)
        .eq('exam_id', examId),
    );
    const results = await Promise.all(updates);
    const err = results.find((r) => r.error);
    if (err) throw err.error;
  }
}
