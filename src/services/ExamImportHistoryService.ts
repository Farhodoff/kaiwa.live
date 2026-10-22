import { supabase } from '../lib/supabase';
import { isAdminEmail } from '../utils/admin';
import { sanitizeErrorMessage } from '../components/ErrorBoundary';

export type ExamImportMode = 'section' | 'full-exam' | 'existing-exam' | 'revert';
export type ExamImportBatchStatus = 'pending' | 'applied' | 'failed' | 'rolled_back';

export interface ImportActor {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
}

export interface ExamImportBatch {
  id: string;
  exam_id: string | null;
  section_id: string | null;
  mode: ExamImportMode | string;
  source_format: string | null;
  status: ExamImportBatchStatus | string;
  question_count: number;
  imported_question_ids: string[];
  imported_by: string | null;
  imported_by_email: string | null;
  imported_by_name: string | null;
  metadata: Record<string, any>;
  rollback_reason: string | null;
  rolled_back_at: string | null;
  rolled_back_by: string | null;
  rolled_back_by_email: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ExamImportBatchItem {
  id: string;
  batch_id: string;
  question_id: string | null;
  section_id: string | null;
  question_snapshot: Record<string, any>;
  created_at: string;
}

export interface ExamImportBatchDetails {
  batch: ExamImportBatch;
  items: ExamImportBatchItem[];
}

export interface ExamContentVersion {
  id: string;
  exam_id: string;
  batch_id: string | null;
  version_number: number;
  label: string | null;
  is_current: boolean;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
}

export interface ExamContentVersionWithSnapshot extends ExamContentVersion {
  snapshot: ExamContentSnapshot;
}

export interface ExamContentSnapshot {
  exam: Record<string, any>;
  sections: Array<Record<string, any>>;
  questions: Array<Record<string, any>>;
  passages: Array<Record<string, any>>;
  audios: Array<Record<string, any>>;
  capturedAt: string;
}

export interface ExamExportBundle {
  version: string;
  exportedAt: string;
  exam: Record<string, any>;
  sections: Array<{
    title: string;
    type: string;
    content?: string | null;
    questions: Array<Record<string, any>>;
  }>;
  readingPassages: Array<Record<string, any>>;
  listeningAudios: Array<Record<string, any>>;
}

export interface BatchQuestionInput {
  questionId: string | null;
  sectionId: string | null;
  snapshot: Record<string, any>;
}

export interface CreateImportBatchInput {
  examId?: string | null;
  sectionId?: string | null;
  mode: ExamImportMode;
  sourceFormat?: string | null;
  actor?: ImportActor;
  metadata?: Record<string, any>;
}

export interface RollbackOptions {
  adminConfirmed: boolean;
  reason?: string;
  actor?: ImportActor;
}

export interface RevertVersionOptions extends RollbackOptions {
  label?: string;
}

const BATCH_COLUMNS =
  'id, exam_id, section_id, mode, source_format, status, question_count, imported_question_ids, imported_by, imported_by_email, imported_by_name, metadata, rollback_reason, rolled_back_at, rolled_back_by, rolled_back_by_email, created_at, completed_at';

const VERSION_COLUMNS =
  'id, exam_id, batch_id, version_number, label, is_current, created_by, created_by_email, created_at';

export class ExamImportHistoryService {
  /**
   * Resolves the currently logged-in admin. It is intentionally public so UI
   * callers can display who will be recorded as the import author.
   */
  static async getCurrentActor(): Promise<ImportActor> {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      return {
        id: user?.id || null,
        email: user?.email || null,
        name: (user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.name || null,
        role: (user?.app_metadata as any)?.role || (user?.user_metadata as any)?.role || null,
      };
    } catch {
      return { id: null, email: null, name: null };
    }
  }

  /**
   * Ensures the actor is an admin. The database RLS policies enforce the same
   * rule, but this gives an explicit error before destructive operations.
   */
  static async requireAdmin(actor?: ImportActor): Promise<ImportActor> {
    const resolved = actor || (await this.getCurrentActor());

    let isAdminByRpc: boolean | null = null;
    try {
      if (typeof (supabase as any).rpc === 'function') {
        const { data, error } = await supabase.rpc('is_admin');
        if (!error && typeof data === 'boolean') isAdminByRpc = data;
      }
    } catch {
      // RPC is optional in test environments; fall through to profile lookup.
    }

    if (isAdminByRpc === true) return resolved;
    if (isAdminByRpc === false) {
      throw new Error('Rollback faqat admin tomonidan amalga oshirilishi mumkin.');
    }

    let role: string | null = null;
    if (resolved.id) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', resolved.id)
          .maybeSingle();
        role = (profile as any)?.role || null;
      } catch {
        // Ignore profile lookup errors; the RLS policy remains the final guard.
      }
    }

    if (!isAdminEmail(resolved.email || undefined, role)) {
      throw new Error('Rollback faqat admin tomonidan amalga oshirilishi mumkin.');
    }

    return resolved;
  }

  /**
   * Creates a pending batch before questions are inserted so failed imports are
   * still visible in the audit trail.
   */
  static async createImportBatch(input: CreateImportBatchInput): Promise<string> {
    const actor = input.actor || (await this.getCurrentActor());
    const { data, error } = await supabase
      .from('exam_import_batches')
      .insert({
        exam_id: input.examId || null,
        section_id: input.sectionId || null,
        mode: input.mode,
        source_format: input.sourceFormat || null,
        status: 'pending',
        imported_by: actor.id || null,
        imported_by_email: actor.email || null,
        imported_by_name: actor.name || null,
        metadata: input.metadata || {},
      })
      .select('id')
      .single();

    if (error || !data?.id) {
      throw new Error(
        `Import batch yaratishda xatolik: ${sanitizeErrorMessage(error?.message || '')}`,
      );
    }

    return data.id;
  }

  /**
   * Stores the imported question snapshots so they remain viewable by batch
   * even after a rollback deletes the underlying questions.
   */
  static async appendBatchItems(batchId: string, items: BatchQuestionInput[]): Promise<void> {
    if (!items.length) return;

    const rows = items.map((item) => ({
      batch_id: batchId,
      question_id: item.questionId,
      section_id: item.sectionId,
      question_snapshot: item.snapshot || {},
    }));

    const { error } = await supabase.from('exam_import_batch_items').insert(rows);
    if (error) {
      throw new Error(
        `Import batch savollarini yozishda xatolik: ${sanitizeErrorMessage(error.message)}`,
      );
    }
  }

  /**
   * Marks a batch as successfully applied and links all inserted question IDs.
   */
  static async finalizeBatch(
    batchId: string,
    input: {
      examId?: string | null;
      sectionId?: string | null;
      questionIds: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    const { error } = await supabase
      .from('exam_import_batches')
      .update({
        status: 'applied',
        exam_id: input.examId || null,
        section_id: input.sectionId || null,
        question_count: input.questionIds.length,
        imported_question_ids: input.questionIds,
        metadata: input.metadata || {},
        completed_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    if (error) {
      throw new Error(`Import batch yakunlashda xatolik: ${sanitizeErrorMessage(error.message)}`);
    }
  }

  static async failBatch(batchId: string, reason: string, metadata?: Record<string, any>) {
    try {
      await supabase
        .from('exam_import_batches')
        .update({
          status: 'failed',
          metadata: metadata || {},
          rollback_reason: reason,
          completed_at: new Date().toISOString(),
        })
        .eq('id', batchId);
    } catch {
      // Failure recording must never hide the original import error.
    }
  }

  static async listImportBatches(options: { examId?: string; limit?: number } = {}) {
    let query = supabase
      .from('exam_import_batches')
      .select(BATCH_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(options.limit || 100);

    if (options.examId) {
      query = query.eq('exam_id', options.examId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Import tarixini olishda xatolik: ${sanitizeErrorMessage(error.message)}`);
    }
    return (data || []) as ExamImportBatch[];
  }

  static async getImportBatchDetails(batchId: string): Promise<ExamImportBatchDetails> {
    const { data: batch, error: batchErr } = await supabase
      .from('exam_import_batches')
      .select(BATCH_COLUMNS)
      .eq('id', batchId)
      .single();

    if (batchErr || !batch) {
      throw new Error(`Import batch topilmadi: ${sanitizeErrorMessage(batchErr?.message || '')}`);
    }

    const { data: items, error: itemsErr } = await supabase
      .from('exam_import_batch_items')
      .select('id, batch_id, question_id, section_id, question_snapshot, created_at')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    if (itemsErr) {
      throw new Error(
        `Batch savollarini olishda xatolik: ${sanitizeErrorMessage(itemsErr.message)}`,
      );
    }

    return {
      batch: batch as ExamImportBatch,
      items: (items || []) as ExamImportBatchItem[],
    };
  }

  static async getBatchQuestions(batchId: string): Promise<ExamImportBatchItem[]> {
    const details = await this.getImportBatchDetails(batchId);
    return details.items;
  }

  static async getImportStats(examId?: string) {
    const batches = await this.listImportBatches({ examId, limit: 1000 });
    const admins = new Set(
      batches.map((batch) => batch.imported_by_email).filter(Boolean) as string[],
    );
    return {
      totalBatches: batches.length,
      totalQuestions: batches.reduce((sum, batch) => sum + (batch.question_count || 0), 0),
      lastImportAt: batches[0]?.created_at || null,
      distinctAdmins: admins.size,
      rolledBackCount: batches.filter((batch) => batch.status === 'rolled_back').length,
    };
  }

  /**
   * Captures the complete exam content as an immutable version snapshot.
   */
  static async createVersionSnapshot(
    examId: string,
    options: { batchId?: string | null; label?: string; actor?: ImportActor } = {},
  ): Promise<ExamContentVersion | null> {
    const snapshot = await this.buildSnapshot(examId);
    if (!snapshot) return null;

    const actor = options.actor || (await this.getCurrentActor());

    const { data: latest } = await supabase
      .from('exam_content_versions')
      .select('version_number')
      .eq('exam_id', examId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = ((latest as any)?.version_number || 0) + 1;

    await supabase
      .from('exam_content_versions')
      .update({ is_current: false })
      .eq('exam_id', examId);

    const { data, error } = await supabase
      .from('exam_content_versions')
      .insert({
        exam_id: examId,
        batch_id: options.batchId || null,
        version_number: nextVersion,
        label: options.label || `Versiya ${nextVersion}`,
        snapshot,
        is_current: true,
        created_by: actor.id || null,
        created_by_email: actor.email || null,
      })
      .select(VERSION_COLUMNS)
      .single();

    if (error || !data) {
      throw new Error(
        `Versiya snapshot yaratishda xatolik: ${sanitizeErrorMessage(error?.message || '')}`,
      );
    }

    return data as ExamContentVersion;
  }

  static async listVersions(examId: string): Promise<ExamContentVersion[]> {
    const { data, error } = await supabase
      .from('exam_content_versions')
      .select(VERSION_COLUMNS)
      .eq('exam_id', examId)
      .order('version_number', { ascending: false });

    if (error) {
      throw new Error(
        `Versiyalar tarixini olishda xatolik: ${sanitizeErrorMessage(error.message)}`,
      );
    }
    return (data || []) as ExamContentVersion[];
  }

  static async getVersion(versionId: string): Promise<ExamContentVersionWithSnapshot> {
    const { data, error } = await supabase
      .from('exam_content_versions')
      .select(`${VERSION_COLUMNS}, snapshot`)
      .eq('id', versionId)
      .single();

    if (error || !data) {
      throw new Error(`Versiya topilmadi: ${sanitizeErrorMessage(error?.message || '')}`);
    }
    return data as ExamContentVersionWithSnapshot;
  }

  /**
   * Fully rolls back a single import batch. Requires an explicit admin
   * confirmation flag and verifies the current user is an admin.
   */
  static async rollbackBatch(
    batchId: string,
    options: RollbackOptions,
  ): Promise<{ batchId: string; deletedCount: number; status: 'rolled_back' }> {
    if (!options.adminConfirmed) {
      throw new Error("Rollback uchun admin tasdig'i talab qilinadi.");
    }
    const actor = await this.requireAdmin(options.actor);
    const { batch, items } = await this.getImportBatchDetails(batchId);

    if (batch.status === 'rolled_back') {
      throw new Error('Ushbu import batch allaqachon rollback qilingan.');
    }
    if (batch.status === 'pending') {
      throw new Error("Pending import batchni rollback qilib bo'lmaydi.");
    }

    const examId = batch.exam_id;

    // Keep a safety snapshot before destructive changes.
    if (examId) {
      try {
        await this.createVersionSnapshot(examId, {
          batchId,
          label: `Rollback oldidan snapshot (${new Date().toISOString()})`,
          actor,
        });
      } catch (snapshotErr) {
        console.warn('Rollback safety snapshot failed:', snapshotErr);
      }
    }

    let deletedCount = 0;
    const createdExam =
      batch.mode === 'full-exam' || Boolean((batch.metadata as any)?.created_exam);

    if (createdExam && examId) {
      const { error } = await supabase.from('exams').delete().eq('id', examId);
      if (error) {
        throw new Error(
          `Import qilingan imtihonni rollback qilishda xatolik: ${sanitizeErrorMessage(error.message)}`,
        );
      }
      deletedCount = batch.question_count;
    } else {
      const questionIds =
        batch.imported_question_ids?.length > 0
          ? batch.imported_question_ids
          : (items.map((item) => item.question_id).filter(Boolean) as string[]);

      if (questionIds.length > 0) {
        const { data, error } = await supabase
          .from('exam_questions')
          .delete()
          .in('id', questionIds)
          .select('id');

        if (error) {
          throw new Error(
            `Import qilingan savollarni rollback qilishda xatolik: ${sanitizeErrorMessage(error.message)}`,
          );
        }
        deletedCount = (data || []).length;
      }
    }

    const { error: updateErr } = await supabase
      .from('exam_import_batches')
      .update({
        status: 'rolled_back',
        rollback_reason: options.reason || 'Admin tomonidan rollback qilindi.',
        rolled_back_at: new Date().toISOString(),
        rolled_back_by: actor.id || null,
        rolled_back_by_email: actor.email || null,
      })
      .eq('id', batchId);

    if (updateErr) {
      throw new Error(
        `Batch holatini yangilashda xatolik: ${sanitizeErrorMessage(updateErr.message)}`,
      );
    }

    return { batchId, deletedCount, status: 'rolled_back' };
  }

  /**
   * Restores an exam to an earlier snapshot. This is a destructive operation
   * guarded by both an explicit confirmation flag and an admin check.
   */
  static async revertToVersion(
    versionId: string,
    options: RevertVersionOptions,
  ): Promise<{ examId: string; versionNumber: number; restoredQuestions: number }> {
    if (!options.adminConfirmed) {
      throw new Error("Versiyaga qaytish uchun admin tasdig'i talab qilinadi.");
    }
    const actor = await this.requireAdmin(options.actor);
    const version = await this.getVersion(versionId);
    const snapshot = version.snapshot;

    if (!snapshot?.exam?.id) {
      throw new Error("Versiya snapshotida imtihon ma'lumotlari topilmadi.");
    }

    const examId = snapshot.exam.id as string;

    // Safety snapshot of the current state before restoring the old version.
    try {
      await this.createVersionSnapshot(examId, {
        label: `Revert oldidan snapshot (${new Date().toISOString()})`,
        actor,
      });
    } catch (snapshotErr) {
      console.warn('Revert safety snapshot failed:', snapshotErr);
    }

    // A version restore is content-only: workflow/publish state is owned by the
    // transition matrix (Task 19) and must never be rolled back by a snapshot.
    const { data: currentExam } = await supabase
      .from('exams')
      .select('status,is_published,reviewed_by,reviewed_at,archived_at,rejection_comment')
      .eq('id', examId)
      .maybeSingle();
    const restoredExam: Record<string, any> = { ...snapshot.exam };
    if (currentExam) {
      Object.entries(currentExam as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined) restoredExam[key] = value;
      });
    }

    const { error: examErr } = await supabase.from('exams').upsert(restoredExam);
    if (examErr) {
      throw new Error(`Imtihonni tiklashda xatolik: ${sanitizeErrorMessage(examErr.message)}`);
    }

    const { data: currentSections } = await supabase
      .from('exam_sections')
      .select('id')
      .eq('exam_id', examId);
    const sectionIds = (currentSections || []).map((section: any) => section.id);

    if (sectionIds.length > 0) {
      const { error } = await supabase.from('exam_questions').delete().in('section_id', sectionIds);
      if (error) {
        throw new Error(
          `Joriy savollarni tozalashda xatolik: ${sanitizeErrorMessage(error.message)}`,
        );
      }
    }

    await supabase.from('reading_passages').delete().eq('exam_id', examId);
    await supabase.from('listening_audios').delete().eq('exam_id', examId);
    await supabase.from('exam_sections').delete().eq('exam_id', examId);

    if (snapshot.sections?.length) {
      const { error } = await supabase.from('exam_sections').insert(snapshot.sections);
      if (error) {
        throw new Error(`Bo'limlarni tiklashda xatolik: ${sanitizeErrorMessage(error.message)}`);
      }
    }
    if (snapshot.passages?.length) {
      const { error } = await supabase.from('reading_passages').insert(snapshot.passages);
      if (error) {
        throw new Error(`Passagelarni tiklashda xatolik: ${sanitizeErrorMessage(error.message)}`);
      }
    }
    if (snapshot.audios?.length) {
      const { error } = await supabase.from('listening_audios').insert(snapshot.audios);
      if (error) {
        throw new Error(`Audiolarni tiklashda xatolik: ${sanitizeErrorMessage(error.message)}`);
      }
    }
    if (snapshot.questions?.length) {
      const { error } = await supabase.from('exam_questions').insert(snapshot.questions);
      if (error) {
        throw new Error(`Savollarni tiklashda xatolik: ${sanitizeErrorMessage(error.message)}`);
      }
    }

    await supabase
      .from('exam_content_versions')
      .update({ is_current: false })
      .eq('exam_id', examId);
    await supabase.from('exam_content_versions').update({ is_current: true }).eq('id', versionId);

    return {
      examId,
      versionNumber: version.version_number,
      restoredQuestions: snapshot.questions?.length || 0,
    };
  }

  /**
   * Convenience helper: restores the version immediately before the latest
   * snapshot (the latest snapshot normally represents the current state).
   */
  static async revertToPreviousVersion(
    examId: string,
    options: RevertVersionOptions,
  ): Promise<{ examId: string; versionNumber: number; restoredQuestions: number }> {
    const versions = await this.listVersions(examId);
    if (versions.length < 2) {
      throw new Error('Qaytish uchun oldingi versiya topilmadi.');
    }
    const target =
      versions.find((version, index) => index > 0 && !version.is_current) || versions[1];
    return this.revertToVersion(target.id, options);
  }

  static async buildSnapshot(examId: string): Promise<ExamContentSnapshot | null> {
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .maybeSingle();

    if (examErr || !exam) return null;

    const [{ data: sections }, { data: passages }, { data: audios }] = await Promise.all([
      supabase.from('exam_sections').select('*').eq('exam_id', examId).order('order_index'),
      supabase.from('reading_passages').select('*').eq('exam_id', examId).order('order_index'),
      supabase.from('listening_audios').select('*').eq('exam_id', examId).order('order_index'),
    ]);

    const sectionIds = (sections || []).map((section: any) => section.id);
    let questions: any[] = [];
    if (sectionIds.length > 0) {
      const { data } = await supabase
        .from('exam_questions')
        .select('*')
        .in('section_id', sectionIds)
        .order('order_index');
      questions = data || [];
    }

    return {
      exam,
      sections: sections || [],
      questions,
      passages: passages || [],
      audios: audios || [],
      capturedAt: new Date().toISOString(),
    };
  }

  static async getExamExportData(examId: string): Promise<ExamExportBundle> {
    const snapshot = await this.buildSnapshot(examId);
    if (!snapshot) {
      throw new Error('Eksport uchun imtihon topilmadi.');
    }

    const level = String(snapshot.exam.type || '')
      .match(/N[1-5]/i)?.[0]
      ?.toUpperCase();

    const passageById = new Map(snapshot.passages.map((passage: any) => [passage.id, passage]));

    const sections = snapshot.sections.map((section: any) => {
      const questions = snapshot.questions
        .filter((question: any) => question.section_id === section.id)
        .map((question: any) => ({
          id: question.id,
          section: section.title,
          section_type: section.type,
          question_text: question.question_text,
          type: question.type || 'multiple_choice',
          question_type: question.question_type || null,
          question_payload: question.question_payload || {},
          options: Array.isArray(question.options)
            ? question.options
            : this.safeJsonArray(question.options),
          correct_answer: question.correct_answer,
          explanation: question.explanation || '',
          translation: question.translation || '',
          passage:
            (question.passage_id && (passageById.get(question.passage_id) as any)?.content) ||
            section.content ||
            '',
          level: question.level || level || '',
          difficulty: question.difficulty || '',
        }));

      return {
        title: section.title,
        type: section.type,
        content: section.content || '',
        questions,
      };
    });

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exam: snapshot.exam,
      sections,
      readingPassages: snapshot.passages,
      listeningAudios: snapshot.audios,
    };
  }

  static async exportExamAsJson(examId: string): Promise<string> {
    const bundle = await this.getExamExportData(examId);
    return JSON.stringify(bundle, null, 2);
  }

  static async exportExamAsCsv(examId: string): Promise<string> {
    const bundle = await this.getExamExportData(examId);
    return this.buildCsv(bundle);
  }

  private static buildCsv(bundle: ExamExportBundle): string {
    const headers = [
      'id',
      'section',
      'section_type',
      'question',
      'passage',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correctAnswer',
      'explanation',
      'level',
      'difficulty',
    ];

    const rows: string[][] = [];
    for (const section of bundle.sections) {
      for (const question of section.questions) {
        const options = Array.isArray(question.options) ? question.options : [];
        rows.push([
          String(question.id || ''),
          section.title,
          section.type,
          question.question_text || '',
          question.passage || '',
          options[0] || '',
          options[1] || '',
          options[2] || '',
          options[3] || '',
          question.correct_answer || '',
          question.explanation || '',
          question.level || '',
          question.difficulty || '',
        ]);
      }
    }

    return [headers, ...rows]
      .map((row) => row.map((value) => this.escapeCsv(value)).join(','))
      .join('\n');
  }

  static async downloadExamExport(examId: string, format: 'json' | 'csv'): Promise<void> {
    const bundle = await this.getExamExportData(examId);
    const content = format === 'json' ? JSON.stringify(bundle, null, 2) : this.buildCsv(bundle);
    const safeTitle = String(bundle.exam.title || 'exam')
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    const date = new Date().toISOString().split('T')[0];
    this.downloadFile(
      content,
      `${safeTitle || 'exam'}-${date}.${format}`,
      format === 'json' ? 'application/json' : 'text/csv',
    );
  }

  private static escapeCsv(value: unknown): string {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private static safeJsonArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return value
          .split('|')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
    return [];
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
