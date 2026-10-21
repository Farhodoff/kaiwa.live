import { supabase } from '../lib/supabase';

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
      .select('id, title, type, is_published, status')
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

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalSections: secList.length,
        totalQuestions: questions.length,
        approvedCount,
        reviewCount,
        draftCount,
        rejectedCount,
      },
    };
  }

  /**
   * Transition Exam status with workflow rules.
   * If target is 'published', runs pre-publish validation.
   */
  static async transitionExamStatus(
    examId: string,
    targetStatus: ExamWorkflowStatus,
    reviewerEmail?: string,
    rejectionComment?: string,
  ): Promise<{ success: boolean; validation?: PrePublishValidationResult }> {
    // If target is published, enforce pre-publish validation
    if (targetStatus === 'published') {
      const validation = await this.validateForPublish(examId);
      if (!validation.isValid) {
        throw new Error(
          `Nashr qilish rad etildi! Quyidagi kamchiliklarni bartaraf qiling:\n\n• ${validation.errors.join('\n• ')}`,
        );
      }

      const { error } = await supabase
        .from('exams')
        .update({
          status: 'published',
          is_published: true,
          rejection_comment: null,
          reviewed_by: reviewerEmail || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', examId);

      if (error) throw error;
      return { success: true, validation };
    }

    // For other statuses:
    const updatePayload: Record<string, any> = {
      status: targetStatus,
      is_published: false, // Never published unless targetStatus is 'published'
    };

    if (targetStatus === 'archived') {
      updatePayload.archived_at = new Date().toISOString();
    } else {
      updatePayload.archived_at = null;
    }

    if (reviewerEmail) {
      updatePayload.reviewed_by = reviewerEmail;
      updatePayload.reviewed_at = new Date().toISOString();
    }

    if (targetStatus === 'draft' && rejectionComment) {
      updatePayload.rejection_comment = rejectionComment.trim();
    } else if (targetStatus === 'approved') {
      updatePayload.rejection_comment = null;
    }

    const { error } = await supabase.from('exams').update(updatePayload).eq('id', examId);
    if (error) throw error;

    return { success: true };
  }

  /**
   * Archive a published or completed exam.
   * Hides it from students and moves it to the archive section.
   */
  static async archiveExam(examId: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('exams')
      .update({
        status: 'archived',
        is_published: false,
        archived_at: new Date().toISOString(),
      })
      .eq('id', examId);

    if (error) throw error;
    return {
      success: true,
      message: "Imtihon arxivga ko'chirildi. Talabalar endi ushbu imtihonni ko'ra olmaydi.",
    };
  }

  /**
   * Restore an archived exam back to Draft.
   */
  static async restoreExam(examId: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('exams')
      .update({
        status: 'draft',
        is_published: false,
        archived_at: null,
      })
      .eq('id', examId);

    if (error) throw error;
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
   * Reviewer or Admin transitions Question status.
   * If rejected, a rejection comment is required.
   */
  static async transitionQuestionStatus(
    questionId: string,
    targetStatus: QuestionWorkflowStatus,
    reviewerEmail?: string,
    rejectionComment?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (targetStatus === 'rejected') {
      if (!rejectionComment || !rejectionComment.trim()) {
        throw new Error('Savolni qaytarish (rad etish) uchun izoh yozish majburiy.');
      }
    }

    const updatePayload: Record<string, any> = {
      status: targetStatus,
      reviewed_by: reviewerEmail || null,
      reviewed_at: new Date().toISOString(),
    };

    if (targetStatus === 'rejected') {
      updatePayload.rejection_comment = rejectionComment ? rejectionComment.trim() : '';
    } else if (targetStatus === 'approved') {
      updatePayload.rejection_comment = null;
    }

    const { error } = await supabase
      .from('exam_questions')
      .update(updatePayload)
      .eq('id', questionId);

    if (error) throw error;

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
   * Bulk approve, review, or draft questions.
   */
  static async bulkTransitionQuestions(
    questionIds: string[],
    targetStatus: QuestionWorkflowStatus,
    reviewerEmail?: string,
  ): Promise<{ count: number }> {
    if (!questionIds || questionIds.length === 0) return { count: 0 };

    const updatePayload: Record<string, any> = {
      status: targetStatus,
      reviewed_by: reviewerEmail || null,
      reviewed_at: new Date().toISOString(),
    };

    if (targetStatus === 'approved') {
      updatePayload.rejection_comment = null;
    }

    const { error } = await supabase
      .from('exam_questions')
      .update(updatePayload)
      .in('id', questionIds);

    if (error) throw error;
    return { count: questionIds.length };
  }
}
