/**
 * ExamWorkflowService
 *
 * Orchestrates the full lifecycle of exam content across Draft -> Review -> Approved -> Published states.
 * Integrates role-based gating, legal checklist evaluation, and atomic state transitions.
 */

import { supabase } from '../lib/supabase';
import { canImportExamContent, canPublishExamContent } from '../utils/examImportSecurity';
import { evaluateLegalGates, type LegalGate } from '../utils/examLegalGates';
import {
  assertExamTransition,
  assertQuestionTransition,
  canTransitionQuestion,
  getExamTransitionActorPolicy,
  isExamWorkflowStatus,
  isQuestionWorkflowStatus,
} from '../utils/examWorkflowTransitions';
import {
  type ExamLicenseType,
  type ExamSourceLicenseMeta,
  normalizeLicenseType,
} from '../types/examMetadata';

export type ExamWorkflowStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type QuestionWorkflowStatus = 'draft' | 'review' | 'approved' | 'rejected';

export interface PrePublishValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalSections: number;
    totalQuestions: number;
    approvedCount: number;
    reviewCount: number;
    draftCount: number;
    rejectedCount: number;
  };
  metadata?: {
    sourceName?: string | null;
    sourceUrl?: string | null;
    author?: string | null;
    licenseType?: ExamLicenseType;
    isRestricted?: boolean;
    copyrightConfirmed?: boolean;
    isOfficialJlpt?: boolean;
  };
  /** Task 18 — structured legal gates (copyright / license / metadata). */
  legalGates?: LegalGate[];
}

export interface WorkflowStatusMeta {
  label: string;
  badgeClass: string;
  dotColor: string;
  description: string;
}

export const EXAM_STATUS_CONFIG: Record<ExamWorkflowStatus, WorkflowStatusMeta> = {
  draft: {
    label: 'Qoralama (Draft)',
    badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    description: 'Imtihon tayyorlanmoqda, tahrir bosqichida.',
  },
  review: {
    label: "Ko'rib chiqilmoqda (In Review)",
    badgeClass: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    dotColor: 'bg-blue-500',
    description: "Reviewer tomonidan tekshirishga jo'natilgan.",
  },
  approved: {
    label: 'Tasdiqlangan (Approved)',
    badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    description: 'Tekshiruvdan muvaffaqiyatli o‘tgan, nashrga tayyor.',
  },
  published: {
    label: 'Nashr qilingan (Published)',
    badgeClass: 'border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400',
    dotColor: 'bg-green-600',
    description: "Barcha foydalanuvchilar va o'quvchilar uchun faol.",
  },
  archived: {
    label: 'Arxivlangan (Archived)',
    badgeClass: 'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400',
    dotColor: 'bg-slate-500',
    description: "Imtihon faoliyatdan olingan va arxivga qo'yilgan.",
  },
};

export const QUESTION_STATUS_CONFIG: Record<QuestionWorkflowStatus, WorkflowStatusMeta> = {
  draft: {
    label: 'Qoralama',
    badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    description: 'Savol tuzilmoqda.',
  },
  review: {
    label: "Ko'rib chiqishda",
    badgeClass: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    dotColor: 'bg-blue-500',
    description: 'Reviewer tekshirishi kutilmoqda.',
  },
  approved: {
    label: 'Tasdiqlangan',
    badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    description: 'Savol tasdiqlangan va nashrga yaroqli.',
  },
  rejected: {
    label: 'Qaytarilgan (Rad etilgan)',
    badgeClass: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
    dotColor: 'bg-red-500',
    description: 'Tuzatish uchun izoh bilan qaytarilgan.',
  },
};

export class ExamWorkflowService {
  /**
   * Pre-publish comprehensive validation.
   * Checks if an exam is ready to be published:
   * - Must have sections and questions.
   * - 100% of questions must be in 'approved' status.
   * - Every question must have text, valid options, and correct answer.
   * - Reading sections must have passage or content.
   * - Listening sections must have audio tracks or audio_url.
   */
  static async validateForPublish(examId: string): Promise<PrePublishValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Fetch Exam
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select(
        'id, title, type, is_published, status, source_name, source_url, author, license_type, copyright_confirmed, is_official_jlpt',
      )
      .eq('id', examId)
      .single();

    if (examErr || !exam) {
      return {
        isValid: false,
        errors: ["Imtihon ma'lumotlari topilmadi."],
        warnings: [],
        summary: {
          totalSections: 0,
          totalQuestions: 0,
          approvedCount: 0,
          reviewCount: 0,
          draftCount: 0,
          rejectedCount: 0,
        },
      };
    }

    // 2. Fetch Sections
    const { data: sections, error: secErr } = await supabase
      .from('exam_sections')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });

    if (secErr) {
      errors.push(`Bo'limlarni tekshirishda xatolik: ${secErr.message}`);
    }

    const secList = sections || [];
    if (secList.length === 0) {
      errors.push("Imtihonda kamida bitta bo'lim (section) bo'lishi shart.");
    }

    // 3. Fetch Questions
    const sectionIds = secList.map((s) => s.id);
    let questions: any[] = [];
    if (sectionIds.length > 0) {
      const { data: qData, error: qErr } = await supabase
        .from('exam_questions')
        .select('*')
        .in('section_id', sectionIds)
        .order('order_index', { ascending: true });

      if (qErr) {
        errors.push(`Savollarni tekshirishda xatolik: ${qErr.message}`);
      }
      questions = qData || [];
    }

    if (questions.length === 0) {
      errors.push('Imtihonda kamida 1 ta savol mavjud bo‘lishi shart.');
    }

    // 4. Check separate passages & audios
    const [{ data: passages }, { data: audios }] = await Promise.all([
      supabase.from('reading_passages').select('id, section_id, title').eq('exam_id', examId),
      supabase
        .from('listening_audios')
        .select('id, section_id, title, audio_url')
        .eq('exam_id', examId),
    ]);

    const passageList = passages || [];
    const audioList = audios || [];

    // Summary counts
    let approvedCount = 0;
    let reviewCount = 0;
    let draftCount = 0;
    let rejectedCount = 0;

    questions.forEach((q, idx) => {
      const qStatus = (q.status || 'draft') as QuestionWorkflowStatus;
      if (qStatus === 'approved') approvedCount++;
      else if (qStatus === 'review') reviewCount++;
      else if (qStatus === 'rejected') rejectedCount++;
      else draftCount++;

      // Requirement: 100% of questions must be approved
      if (qStatus !== 'approved') {
        const statusLabel = QUESTION_STATUS_CONFIG[qStatus]?.label || qStatus;
        errors.push(
          `Savol #${idx + 1} ("${q.question_text?.slice(0, 30) || 'Matnsiz'}...") tasdiqlanmagan (Hozirgi holat: ${statusLabel}).`,
        );
      }

      // Check Question content
      if (!q.question_text || !q.question_text.trim()) {
        errors.push(`Savol #${idx + 1}: Savol matni bo'sh bo'lishi mumkin emas.`);
      }

      let parsedOptions: string[] = [];
      if (Array.isArray(q.options)) {
        parsedOptions = q.options.map(String);
      } else if (typeof q.options === 'string') {
        try {
          parsedOptions = JSON.parse(q.options);
        } catch {
          parsedOptions = [q.options];
        }
      }

      if (parsedOptions.length < 2) {
        errors.push(`Savol #${idx + 1}: Variantlar soni kamida 2 ta bo'lishi kerak.`);
      }

      if (
        q.correct_answer === undefined ||
        q.correct_answer === null ||
        String(q.correct_answer).trim() === ''
      ) {
        errors.push(`Savol #${idx + 1}: To'g'ri javob belgilanmagan.`);
      }
    });

    // 5. Check section-specific content
    for (const sec of secList) {
      const secType = (sec.type || '').toLowerCase();
      const secTitle = sec.title || "Nomsiz bo'lim";

      if (secType.includes('reading') || secTitle.toLowerCase().includes('dokkai')) {
        const secPassages = passageList.filter(
          (p) => p.section_id === sec.id || (!p.section_id && passageList.length === 1),
        );
        const hasTextContent = sec.content && sec.content.trim().length > 10;
        if (!hasTextContent && secPassages.length === 0) {
          warnings.push(`"${secTitle}" o'qish bo'limida matn (passage) kiritilmagan.`);
        }
      }

      if (secType.includes('listening') || secTitle.toLowerCase().includes('choukai')) {
        const secAudios = audioList.filter(
          (a) => a.section_id === sec.id || (!a.section_id && audioList.length === 1),
        );
        const hasAudioUrl = Boolean(sec.audio_url && sec.audio_url.trim());
        if (!hasAudioUrl && secAudios.length === 0) {
          errors.push(`"${secTitle}" tinglash (choukai) bo'limida audio fayl biriktirilmagan.`);
        }
      }
    }

    // 6. Legal gates: copyright, license and required metadata (Task 18)
    const normLicense = normalizeLicenseType(exam.license_type);
    const isRestricted = normLicense === 'restricted';
    const legalGates = evaluateLegalGates({
      copyrightConfirmed: Boolean(exam.copyright_confirmed),
      licenseType: exam.license_type,
      sourceName: exam.source_name,
      sourceUrl: exam.source_url,
      author: exam.author,
      isOfficialJlpt: Boolean(exam.is_official_jlpt),
      title: exam.title,
    });

    for (const gate of legalGates) {
      if (gate.blocking) {
        errors.push(gate.message);
      } else {
        warnings.push(gate.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      legalGates,
      summary: {
        totalSections: secList.length,
        totalQuestions: questions.length,
        approvedCount,
        reviewCount,
        draftCount,
        rejectedCount,
      },
      metadata: {
        sourceName: exam.source_name || null,
        sourceUrl: exam.source_url || null,
        author: exam.author || null,
        licenseType: normLicense,
        isRestricted,
        copyrightConfirmed: Boolean(exam.copyright_confirmed),
        isOfficialJlpt: Boolean(exam.is_official_jlpt),
      },
    };
  }

  /**
   * Update source and license metadata for an exam (Task 7)
   */
  static async updateExamSourceLicense(
    examId: string,
    meta: Partial<ExamSourceLicenseMeta>,
  ): Promise<void> {
    const updates: Record<string, any> = {};
    if (meta.sourceName !== undefined) updates.source_name = meta.sourceName;
    if (meta.sourceUrl !== undefined) updates.source_url = meta.sourceUrl;
    if (meta.author !== undefined) updates.author = meta.author;
    if (meta.licenseType !== undefined) updates.license_type = meta.licenseType;
    if (meta.copyrightConfirmed !== undefined)
      updates.copyright_confirmed = meta.copyrightConfirmed;
    if (meta.isOfficialJlpt !== undefined) updates.is_official_jlpt = meta.isOfficialJlpt;

    const { error } = await supabase.from('exams').update(updates).eq('id', examId);
    if (error) {
      throw new Error(`Manba va litsenziyani yangilashda xatolik: ${error.message}`);
    }
  }

  /**
   * Task 19 — transition an exam status through the strict workflow matrix.
   *
   * Allowed: draft->review, review->draft, review->approved,
   *          approved->published, published->archived, archived->draft.
   * Every transition is role-checked and written to the audit log.
   */
  static async transitionExamStatus(
    examId: string,
    targetStatus: ExamWorkflowStatus,
    reviewerEmail?: string,
    rejectionComment?: string,
    actorRole?: string | null,
  ): Promise<{ success: boolean; validation?: PrePublishValidationResult }> {
    if (!isExamWorkflowStatus(targetStatus)) {
      throw new Error(`Noma'lum exam maqsad holati: "${targetStatus}".`);
    }

    // Publishing is admin-only. Check this first so a reviewer always gets the
    // clear permission error, even from a non-approved status.
    if (targetStatus === 'published' && !canPublishExamContent(reviewerEmail, actorRole)) {
      throw new Error(
        "Nashr qilish (publish) faqat admin uchun ruxsat etilgan. Reviewer kontentni import va ko'rib chiqishi mumkin, lekin publish qila olmaydi.",
      );
    }

    const currentStatus = await this.fetchExamStatus(examId);
    assertExamTransition(currentStatus, targetStatus);
    this.assertExamTransitionRole(currentStatus, targetStatus, reviewerEmail, actorRole);

    let validation: PrePublishValidationResult | undefined;
    if (targetStatus === 'published') {
      validation = await this.validateForPublish(examId);
      if (!validation.isValid) {
        throw new Error(
          `Nashr qilish rad etildi! Quyidagi kamchiliklarni bartaraf qiling:\n\n• ${validation.errors.join('\n• ')}`,
        );
      }
    }

    const updatePayload: Record<string, any> = {
      status: targetStatus,
      is_published: targetStatus === 'published',
      archived_at: targetStatus === 'archived' ? new Date().toISOString() : null,
    };

    if (reviewerEmail) {
      updatePayload.reviewed_by = reviewerEmail;
      updatePayload.reviewed_at = new Date().toISOString();
    }

    if (targetStatus === 'published' || targetStatus === 'approved') {
      updatePayload.rejection_comment = null;
    } else if (targetStatus === 'draft' && rejectionComment) {
      updatePayload.rejection_comment = rejectionComment.trim();
    }

    const { error } = await supabase.from('exams').update(updatePayload).eq('id', examId);
    if (error) throw error;

    await this.recordTransitionEvent({
      entityType: 'exam',
      entityId: examId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      actorEmail: reviewerEmail ?? null,
      actorRole: actorRole ?? null,
      comment: rejectionComment?.trim() || null,
    });

    return { success: true, validation };
  }

  private static async fetchExamStatus(examId: string): Promise<ExamWorkflowStatus> {
    const { data, error } = await supabase
      .from('exams')
      .select('id, status')
      .eq('id', examId)
      .maybeSingle();

    if (error) {
      throw new Error(`Imtihon holatini tekshirishda xatolik: ${error.message}`);
    }
    if (!data) {
      throw new Error('Imtihon topilmadi.');
    }

    const status = (data as any).status || 'draft';
    if (!isExamWorkflowStatus(status)) {
      throw new Error(`Noma'lum exam holati: "${status}".`);
    }
    return status;
  }

  private static assertExamTransitionRole(
    from: ExamWorkflowStatus,
    to: ExamWorkflowStatus,
    actorEmail?: string | null,
    actorRole?: string | null,
  ): void {
    const policy = getExamTransitionActorPolicy(from, to);
    if (policy === 'admin' && !canPublishExamContent(actorEmail, actorRole)) {
      throw new Error(`"${from}" → "${to}" o'tishi faqat admin uchun ruxsat etilgan.`);
    }
    if (policy === 'reviewer' && !canImportExamContent(actorEmail, actorRole)) {
      throw new Error(`"${from}" → "${to}" o'tishi uchun reviewer yoki admin roli talab qilinadi.`);
    }
  }

  private static assertQuestionTransitionRole(
    _from: QuestionWorkflowStatus,
    to: QuestionWorkflowStatus,
    actorEmail?: string | null,
    actorRole?: string | null,
  ): void {
    if (!canImportExamContent(actorEmail, actorRole)) {
      throw new Error(
        `Savolni "${to}" holatiga o'tkazish uchun reviewer yoki admin roli talab qilinadi.`,
      );
    }
  }

  /**
   * Persist a workflow transition in the audit log. The event is append-only;
   * the database has no UPDATE/DELETE policy for this table.
   */
  private static async recordTransitionEvent(event: {
    entityType: 'exam' | 'question';
    entityId: string;
    examId?: string | null;
    fromStatus: string;
    toStatus: string;
    actorEmail?: string | null;
    actorRole?: string | null;
    comment?: string | null;
  }): Promise<void> {
    const { error } = await supabase.from('exam_workflow_events').insert({
      entity_type: event.entityType,
      entity_id: event.entityId,
      exam_id: event.examId ?? null,
      from_status: event.fromStatus,
      to_status: event.toStatus,
      actor_email: event.actorEmail ?? null,
      actor_role: event.actorRole ?? null,
      comment: event.comment ?? null,
    });

    if (error) {
      throw new Error(`Workflow audit log yozishda xatolik: ${error.message}`);
    }
  }

  /**
   * Archive a published exam (published -> archived).
   * Hides it from students and moves it to the archive section.
   */
  static async archiveExam(
    examId: string,
    actorEmail?: string,
    actorRole?: string | null,
  ): Promise<{ success: boolean; message: string }> {
    await this.transitionExamStatus(examId, 'archived', actorEmail, undefined, actorRole);
    return {
      success: true,
      message: "Imtihon arxivga ko'chirildi. Talabalar endi ushbu imtihonni ko'ra olmaydi.",
    };
  }

  /**
   * Restore an archived exam back to Draft (archived -> draft).
   */
  static async restoreExam(
    examId: string,
    actorEmail?: string,
    actorRole?: string | null,
  ): Promise<{ success: boolean; message: string }> {
    await this.transitionExamStatus(examId, 'draft', actorEmail, undefined, actorRole);
    return {
      success: true,
      message: 'Imtihon arxivdan chiqarilib, qoralama (draft) holatiga qaytarildi.',
    };
  }

  /**
   * Check whether an exam can be deleted directly.
   * Published exams cannot be deleted directly; they must be archived first.
   */
  static canDeleteExam(status?: ExamWorkflowStatus, isPublished?: boolean): boolean {
    if (status === 'published' || isPublished) return false;
    return true;
  }

  /**
   * Safely deletes an exam, preventing direct deletion of published exams.
   */
  static async deleteExamSafely(
    examId: string,
    status?: ExamWorkflowStatus,
    isPublished?: boolean,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.canDeleteExam(status, isPublished)) {
      throw new Error(
        "Faol nashr qilingan imtihonni to'g'ridan-to'g'ri o'chirib bo'lmaydi! Avval uni arxivlang (Archive).",
      );
    }

    const { error } = await supabase.from('exams').delete().eq('id', examId);
    if (error) throw error;

    return {
      success: true,
      message: "Imtihon muvaffaqiyatli o'chirildi.",
    };
  }

  /**
   * Task 19 — reviewer/admin question transition through the strict matrix.
   *
   * Allowed: draft->review, review->approved, review->rejected, rejected->draft.
   * `approved` is the published-ready terminal state; the exam publish step
   * owns moving approved questions into a published exam.
   */
  static async transitionQuestionStatus(
    questionId: string,
    targetStatus: QuestionWorkflowStatus,
    reviewerEmail?: string,
    rejectionComment?: string,
    actorRole?: string | null,
  ): Promise<{ success: boolean; message: string }> {
    if (!isQuestionWorkflowStatus(targetStatus)) {
      throw new Error(`Noma'lum savol maqsad holati: "${targetStatus}".`);
    }
    if (targetStatus === 'rejected' && (!rejectionComment || !rejectionComment.trim())) {
      throw new Error('Savolni qaytarish (rad etish) uchun izoh yozish majburiy.');
    }

    const { data, error } = await supabase
      .from('exam_questions')
      .select('id, status')
      .eq('id', questionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Savol holatini tekshirishda xatolik: ${error.message}`);
    }
    if (!data) {
      throw new Error('Savol topilmadi.');
    }

    const currentStatus = ((data as any).status || 'draft') as QuestionWorkflowStatus;
    if (!isQuestionWorkflowStatus(currentStatus)) {
      throw new Error(`Noma'lum savol holati: "${currentStatus}".`);
    }

    assertQuestionTransition(currentStatus, targetStatus);
    this.assertQuestionTransitionRole(currentStatus, targetStatus, reviewerEmail, actorRole);

    const updatePayload: Record<string, any> = {
      status: targetStatus,
      reviewed_by: reviewerEmail || null,
      reviewed_at: new Date().toISOString(),
    };

    if (targetStatus === 'rejected') {
      updatePayload.rejection_comment = rejectionComment!.trim();
    } else if (targetStatus === 'approved') {
      updatePayload.rejection_comment = null;
    }

    const { error: updateError } = await supabase
      .from('exam_questions')
      .update(updatePayload)
      .eq('id', questionId);

    if (updateError) throw updateError;

    await this.recordTransitionEvent({
      entityType: 'question',
      entityId: questionId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      actorEmail: reviewerEmail ?? null,
      actorRole: actorRole ?? null,
      comment: rejectionComment?.trim() || null,
    });

    return {
      success: true,
      message:
        targetStatus === 'approved'
          ? 'Savol muvaffaqiyatli tasdiqlandi.'
          : targetStatus === 'rejected'
            ? 'Savol rad etildi va tuzatish uchun izoh saqlandi.'
            : 'Savol holati yangilandi.',
    };
  }

  /**
   * Bulk transition. Every question must be allowed to reach the target from
   * its current status — otherwise the whole batch is rejected and nothing is
   * written.
   */
  static async bulkTransitionQuestions(
    questionIds: string[],
    targetStatus: QuestionWorkflowStatus,
    reviewerEmail?: string,
    rejectionComment?: string,
    actorRole?: string | null,
  ): Promise<{ count: number }> {
    if (!questionIds || questionIds.length === 0) return { count: 0 };
    if (!isQuestionWorkflowStatus(targetStatus)) {
      throw new Error(`Noma'lum savol maqsad holati: "${targetStatus}".`);
    }
    if (targetStatus === 'rejected' && (!rejectionComment || !rejectionComment.trim())) {
      throw new Error('Savollarni qaytarish (rad etish) uchun izoh yozish majburiy.');
    }

    this.assertQuestionTransitionRole('review', targetStatus, reviewerEmail, actorRole);

    const { data, error } = await supabase
      .from('exam_questions')
      .select('id, status')
      .in('id', questionIds);

    if (error) {
      throw new Error(`Savollar holatini tekshirishda xatolik: ${error.message}`);
    }

    const rows = (data || []) as Array<{ id: string; status?: string }>;
    const byId = new Map(rows.map((row) => [row.id, row.status || 'draft']));

    const missing = questionIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new Error(`Savollar topilmadi: ${missing.join(', ')}.`);
    }

    const invalid = questionIds
      .filter((id) => {
        const current = byId.get(id) as QuestionWorkflowStatus;
        return !isQuestionWorkflowStatus(current) || !canTransitionQuestion(current, targetStatus);
      })
      .map((id) => `${id} (${byId.get(id)} → ${targetStatus})`);

    if (invalid.length > 0) {
      throw new Error(
        `Noto'g'ri savol status o'tishi: ${invalid.join(', ')}. ` +
          'Har bir savol faqat draft → review → approved/rejected → draft zanjirida harakatlanadi.',
      );
    }

    const updatePayload: Record<string, any> = {
      status: targetStatus,
      reviewed_by: reviewerEmail || null,
      reviewed_at: new Date().toISOString(),
    };

    if (targetStatus === 'approved') {
      updatePayload.rejection_comment = null;
    } else if (targetStatus === 'rejected') {
      updatePayload.rejection_comment = rejectionComment!.trim();
    }

    const { error: updateError } = await supabase
      .from('exam_questions')
      .update(updatePayload)
      .in('id', questionIds);

    if (updateError) throw updateError;

    await supabase.from('exam_workflow_events').insert(
      questionIds.map((id) => ({
        entity_type: 'question',
        entity_id: id,
        exam_id: null,
        from_status: byId.get(id),
        to_status: targetStatus,
        actor_email: reviewerEmail ?? null,
        actor_role: actorRole ?? null,
        comment: rejectionComment?.trim() || null,
      })),
    );

    return { count: questionIds.length };
  }

  /**
   * Bulk-approve convenience that walks every question along legal edges only:
   * rejected -> draft -> review -> approved. Already-approved questions are
   * left untouched.
   */
  static async bulkApproveQuestions(
    questionIds: string[],
    reviewerEmail?: string,
    actorRole?: string | null,
  ): Promise<{ count: number }> {
    if (!questionIds || questionIds.length === 0) return { count: 0 };

    const { data, error } = await supabase
      .from('exam_questions')
      .select('id, status')
      .in('id', questionIds);

    if (error) {
      throw new Error(`Savollar holatini tekshirishda xatolik: ${error.message}`);
    }

    const rows = (data || []) as Array<{ id: string; status?: string }>;
    const byId = new Map(rows.map((row) => [row.id, row.status || 'draft']));

    const missing = questionIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new Error(`Savollar topilmadi: ${missing.join(', ')}.`);
    }

    const rejectedIds: string[] = [];
    const draftIds: string[] = [];
    const reviewIds: string[] = [];
    const approvedIds: string[] = [];

    for (const id of questionIds) {
      const status = byId.get(id);
      if (status === 'rejected') rejectedIds.push(id);
      else if (status === 'draft') draftIds.push(id);
      else if (status === 'review') reviewIds.push(id);
      else if (status === 'approved') approvedIds.push(id);
      else throw new Error(`Noma'lum savol holati: "${status}" (${id}).`);
    }

    if (rejectedIds.length > 0) {
      await this.bulkTransitionQuestions(rejectedIds, 'draft', reviewerEmail, undefined, actorRole);
    }

    const toReview = [...draftIds, ...rejectedIds];
    if (toReview.length > 0) {
      await this.bulkTransitionQuestions(toReview, 'review', reviewerEmail, undefined, actorRole);
    }

    const toApprove = [...reviewIds, ...toReview];
    if (toApprove.length > 0) {
      await this.bulkTransitionQuestions(
        toApprove,
        'approved',
        reviewerEmail,
        undefined,
        actorRole,
      );
    }

    return { count: approvedIds.length + toApprove.length };
  }
}
