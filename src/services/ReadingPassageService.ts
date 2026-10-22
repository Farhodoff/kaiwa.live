/**
 * ReadingPassageService
 *
 * Manages JLPT Dokkai (reading comprehension) passages, section bindings,
 * and relational linkage to comprehension questions.
 */

import { supabase } from '../lib/supabase';

export interface ReadingPassage {
  id: string;
  exam_id: string;
  section_id?: string | null;
  title: string;
  content: string;
  order_index: number;
  created_at: string;
  linkedQuestionCount?: number;
  linkedQuestions?: Array<{ id: string; question_text: string }>;
}

export interface ReadingPassageInput {
  title: string;
  content: string;
  order_index?: number;
  section_id?: string | null;
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

    // Count and list linked questions per passage
    const passageIds = passages.map((p) => p.id);
    let counts: Record<string, number> = {};
    let questionsMap: Record<string, Array<{ id: string; question_text: string }>> = {};

    if (passageIds.length > 0) {
      const { data: qData } = await supabase
        .from('exam_questions')
        .select('id, question_text, passage_id')
        .in('passage_id', passageIds);

      for (const q of qData || []) {
        if (q.passage_id) {
          counts[q.passage_id] = (counts[q.passage_id] || 0) + 1;
          if (!questionsMap[q.passage_id]) questionsMap[q.passage_id] = [];
          questionsMap[q.passage_id].push({ id: q.id, question_text: q.question_text });
        }
      }
    }

    return passages.map((p) => ({
      ...p,
      linkedQuestionCount: counts[p.id] || 0,
      linkedQuestions: questionsMap[p.id] || [],
    }));
  }

  /** Fetch passages for a specific section */
  static async listBySection(sectionId: string): Promise<ReadingPassage[]> {
    const { data, error } = await supabase
      .from('reading_passages')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    const passages = (data || []) as ReadingPassage[];

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

  static async getById(id: string): Promise<ReadingPassage | null> {
    const { data, error } = await supabase
      .from('reading_passages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as ReadingPassage;
  }

  /** Get detailed list of questions linked to a passage */
  static async getLinkedQuestions(
    passageId: string,
  ): Promise<Array<{ id: string; question_text: string }>> {
    const { data, error } = await supabase
      .from('exam_questions')
      .select('id, question_text')
      .eq('passage_id', passageId);
    if (error) throw error;
    return (data || []) as Array<{ id: string; question_text: string }>;
  }

  static async create(examId: string, input: ReadingPassageInput): Promise<ReadingPassage> {
    const { data, error } = await supabase
      .from('reading_passages')
      .insert({
        exam_id: examId,
        section_id: input.section_id ?? null,
        title: input.title.trim() || 'Dokkai Matni',
        content: input.content ?? '',
        order_index: input.order_index ?? 0,
      })
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
   * Delete a passage. If it has linked questions, throws with detail unless:
   * - `unlinkQuestions: true` is passed: decouples questions (sets passage_id = null)
   * - `force: true` is passed: cascades deletion of linked questions
   */
  static async delete(
    id: string,
    options?: { unlinkQuestions?: boolean; force?: boolean },
  ): Promise<void> {
    const passage = await this.getById(id);
    if (!passage) throw new Error('Passage topilmadi.');

    const { data: linked, error: qErr } = await supabase
      .from('exam_questions')
      .select('id, question_text')
      .eq('passage_id', id);

    if (qErr) throw qErr;

    if (linked && linked.length > 0) {
      if (options?.unlinkQuestions) {
        // Unlink questions so they don't get deleted
        const { error: unlinkErr } = await supabase
          .from('exam_questions')
          .update({ passage_id: null })
          .eq('passage_id', id);
        if (unlinkErr) throw unlinkErr;
      } else if (options?.force) {
        // Force delete linked questions
        const { error: delErr } = await supabase
          .from('exam_questions')
          .delete()
          .eq('passage_id', id);
        if (delErr) throw delErr;
      } else {
        const err: any = new Error(
          `Bu matnga ${linked.length} ta savol biriktirilgan. Avval ularni o'chiring yoki boshqa matnga biriktiring.`,
        );
        err.code = 'HAS_LINKED_QUESTIONS';
        err.linkedQuestions = linked;
        err.linkedCount = linked.length;
        throw err;
      }
    }

    const { error } = await supabase.from('reading_passages').delete().eq('id', id);
    if (error) throw error;
  }

  /** Link a question to a reading passage (or unlink if null) */
  static async linkQuestion(questionId: string, passageId: string | null): Promise<void> {
    const { error } = await supabase
      .from('exam_questions')
      .update({ passage_id: passageId })
      .eq('id', questionId);
    if (error) throw error;
  }

  /** Link multiple questions to a reading passage */
  static async linkQuestions(passageId: string, questionIds: string[]): Promise<void> {
    if (questionIds.length === 0) return;
    const { error } = await supabase
      .from('exam_questions')
      .update({ passage_id: passageId })
      .in('id', questionIds);
    if (error) throw error;
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
