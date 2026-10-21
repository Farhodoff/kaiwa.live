import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import {
  ArrowLeft,
  Plus,
  Loader2,
  List,
  FileText,
  Headphones,
  Mic,
  PenTool,
  Trash2,
  X,
  Edit3,
  CheckCircle2,
  Eye,
  Sparkles,
  Upload,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  Send,
  ShieldCheck,
  CornerDownLeft,
} from 'lucide-react';
import { useStudyData } from '../../context/StudyPlannerContext';
import { isAdminEmail, isUserAdmin } from '../../utils/admin';
import { toast } from '../../hooks/use-toast';
import { ExamBulkImportModal } from '../../components/admin/ExamBulkImportModal';
import { ReadingPassageEditor } from '../../components/admin/ReadingPassageEditor';
import { ListeningAudioEditor } from '../../components/admin/ListeningAudioEditor';
import { ReadingPassageService } from '../../services/ReadingPassageService';
import { ListeningAudioService } from '../../services/ListeningAudioService';
import {
  ExamWorkflowService,
  EXAM_STATUS_CONFIG,
  QUESTION_STATUS_CONFIG,
  ExamWorkflowStatus,
  QuestionWorkflowStatus,
  PrePublishValidationResult,
} from '../../services/ExamWorkflowService';

interface QuestionFormData {
  question_text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  explanation: string;
  passage_id?: string | null;
  listening_audio_id?: string | null;
}

export const QuestionEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useStudyData();
  const [exam, setExam] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionQuestions, setSectionQuestions] = useState<Record<string, any[]>>({});
  const [readingPassages, setReadingPassages] = useState<any[]>([]);
  const [listeningAudios, setListeningAudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Question form state
  const [showQuestionForm, setShowQuestionForm] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    question_text: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    passage_id: null,
    listening_audio_id: null,
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Content editing state
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Bulk Import state (sectionId)
  const [showBulkModal, setShowBulkModal] = useState<string | null>(null);

  // Question Rejection Modal State
  const [rejectingQuestionId, setRejectingQuestionId] = useState<string | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [submittingRejection, setSubmittingRejection] = useState(false);

  // Pre-Publish Validation Modal State
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState<PrePublishValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchExamDetails = async () => {
    try {
      const { data: examData, error: examErr } = await supabase
        .from('exams')
        .select('*')
        .eq('id', id)
        .single();
      if (examErr) console.error('Error fetching exam:', examErr);
      setExam(examData);

      const { data: sectionsData, error: secErr } = await supabase
        .from('exam_sections')
        .select('*')
        .eq('exam_id', id)
        .order('order_index', { ascending: true });

      if (secErr) console.error('Error fetching sections:', secErr);

      const secs = sectionsData || [];
      setSections(secs);

      // Load separate passage / audio entities for this exam
      try {
        const [pRes, aRes] = await Promise.all([
          ReadingPassageService.listByExam(id!),
          ListeningAudioService.listByExam(id!),
        ]);
        setReadingPassages(pRes);
        setListeningAudios(aRes);
      } catch (err: any) {
        console.error('Error fetching passage/audio entities:', err?.message || err);
      }

      const questionsMap: Record<string, any[]> = {};
      const sectionIds = secs.map((s) => s.id);
      if (sectionIds.length > 0) {
        const { data: allQuestions } = await supabase
          .from('exam_questions')
          .select('*')
          .in('section_id', sectionIds)
          .order('order_index', { ascending: true });

        // Group questions by section_id
        for (const secId of sectionIds) {
          questionsMap[secId] = [];
        }
        if (allQuestions) {
          for (const q of allQuestions) {
            if (questionsMap[q.section_id]) {
              questionsMap[q.section_id].push(q);
            }
          }
        }
      }
      setSectionQuestions(questionsMap);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserAdmin(user) || isAdminEmail(user?.email, (user as any)?.role)) {
      fetchExamDetails();
    } else {
      setLoading(false);
    }
  }, [user, id]);

  const handleAddSection = async (type: string) => {
    const defaultTitle =
      type === 'Reading'
        ? 'Dokkai (読解) Part 1'
        : type === 'Listening'
          ? 'Choukai (聴解) Part 1'
          : `${type} Part 1`;
    const title = prompt(`${type} bo'limi uchun nom kiriting:`, defaultTitle);
    if (!title) return;

    try {
      const { data: newSec, error } = await supabase
        .from('exam_sections')
        .insert({
          exam_id: id,
          title,
          type,
          order_index: sections.length,
        })
        .select()
        .single();
      if (error) throw error;

      // Create separate passage / audio entity for Reading / Listening sections
      if (type === 'Reading') {
        await ReadingPassageService.create(id!, {
          title: `${title} Matni`,
          content: '',
          section_id: newSec.id,
          order_index: 0,
        });
      } else if (type === 'Listening') {
        await ListeningAudioService.create(id!, {
          title: `${title} Audio`,
          section_id: newSec.id,
          order_index: 0,
        });
      }

      fetchExamDetails();
      toast({
        title: "✅ Bo'lim Qo'shildi",
        description: `"${title}" muvaffaqiyatli saqlandi.`,
      });
    } catch (err: any) {
      console.error('Section creation error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: `Bo'lim qo'shishda xatolik: ${err?.message || JSON.stringify(err)}`,
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm(`Bu bo'limni o'chirishni xohlaysizmi? Ichidagi barcha savollar ham o'chadi.`))
      return;

    try {
      // Warning about linked passage / audio questions (Talab 7)
      const passage = readingPassages.find((p) => p.section_id === sectionId);
      const audio = listeningAudios.find((a) => a.section_id === sectionId);
      const linkedCount = (passage?.linkedQuestionCount || 0) + (audio?.linkedQuestionCount || 0);

      if (linkedCount > 0) {
        const ok = confirm(
          `${linkedCount} ta savol shu bo'limning matni / audio'iga biriktirilgan. Ular ham o'chiriladi. Davom etasizmi?`,
        );
        if (!ok) return;
      }

      // Remove linked passage / audio entities first
      if (passage) {
        await supabase.from('reading_passages').delete().eq('id', passage.id);
      }
      if (audio && audio.audio_url) {
        await supabase.storage.from('listening_audios').remove([audio.audio_url]);
        await supabase.from('listening_audios').delete().eq('id', audio.id);
      }

      const { error } = await supabase.from('exam_sections').delete().eq('id', sectionId);
      if (error) throw error;
      fetchExamDetails();
      toast({
        title: "🗑️ O'chirildi",
        description: "Bo'lim (va bog'liq kontent) muvaffaqiyatli o'chirildi.",
      });
    } catch (err: any) {
      console.error('Section delete error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: `O'chirishda xatolik: ${err?.message || JSON.stringify(err)}`,
      });
    }
  };

  const handleSaveQuestion = async (sectionId: string, keepOpen = false) => {
    if (!questionForm.question_text.trim()) {
      toast({
        variant: 'destructive',
        title: 'Diqqat',
        description: 'Savol matnini kiriting!',
      });
      return;
    }
    setSavingQuestion(true);
    try {
      const existingQuestions = sectionQuestions[sectionId] || [];
      const section = sections.find((s) => s.id === sectionId);
      const sectionPassages = readingPassages.filter(
        (p) => p.section_id === sectionId || !p.section_id,
      );
      const sectionAudios = listeningAudios.filter(
        (a) => a.section_id === sectionId || !a.section_id,
      );

      const resolvedPassageId =
        section?.type === 'Reading'
          ? questionForm.passage_id !== undefined && questionForm.passage_id !== null
            ? questionForm.passage_id
            : (sectionPassages[0]?.id ?? null)
          : null;

      const resolvedAudioId =
        section?.type === 'Listening'
          ? questionForm.listening_audio_id !== undefined &&
            questionForm.listening_audio_id !== null
            ? questionForm.listening_audio_id
            : (sectionAudios[0]?.id ?? null)
          : null;

      const { error } = await supabase.from('exam_questions').insert({
        section_id: sectionId,
        passage_id: resolvedPassageId,
        listening_audio_id: resolvedAudioId,
        question_text: questionForm.question_text,
        type: questionForm.type,
        options:
          questionForm.type === 'multiple_choice'
            ? questionForm.options.filter((o) => o.trim())
            : null,
        correct_answer: questionForm.correct_answer,
        explanation: questionForm.explanation || null,
        order_index: existingQuestions.length,
      });
      if (error) throw error;

      setQuestionForm({
        question_text: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        passage_id: null,
        listening_audio_id: null,
      });
      if (!keepOpen) {
        setShowQuestionForm(null);
      }
      fetchExamDetails();
      toast({
        title: "✅ Savol Qo'shildi",
        description: 'Savol muvaffaqiyatli saqlandi.',
      });
    } catch (err: any) {
      console.error('Question creation error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: `Savol qo'shishda xatolik: ${err?.message || JSON.stringify(err)}`,
      });
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Bu savolni o'chirishni xohlaysizmi?")) return;
    try {
      const { error } = await supabase.from('exam_questions').delete().eq('id', questionId);
      if (error) throw error;
      fetchExamDetails();
      toast({
        title: "🗑️ O'chirildi",
        description: "Savol muvaffaqiyatli o'chirildi.",
      });
    } catch (err: any) {
      console.error('Question delete error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: `Savolni o'chirishda xatolik: ${err?.message || JSON.stringify(err)}`,
      });
    }
  };

  const handleSaveContent = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('exam_sections')
        .update({ content: editContent })
        .eq('id', sectionId);
      if (error) throw error;
      setEditingContentId(null);
      fetchExamDetails();
      toast({
        title: '💾 Saqlandi',
        description: "Bo'lim matni saqlandi.",
      });
    } catch (err: any) {
      console.error('Content save error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: `Kontentni saqlashda xatolik: ${err?.message || JSON.stringify(err)}`,
      });
    }
  };

  const handleQuestionStatusChange = async (
    questionId: string,
    targetStatus: QuestionWorkflowStatus,
    comment?: string,
  ) => {
    try {
      const res = await ExamWorkflowService.transitionQuestionStatus(
        questionId,
        targetStatus,
        user?.email,
        comment,
      );
      fetchExamDetails();
      toast({
        title: targetStatus === 'approved' ? '✅ Tasdiqlandi' : "Holat O'zgardi",
        description: res.message,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || 'Holatni o‘zgartirishda xatolik',
      });
    }
  };

  const handleBulkApprove = async (qIds: string[]) => {
    if (!qIds.length) return;
    try {
      const res = await ExamWorkflowService.bulkTransitionQuestions(qIds, 'approved', user?.email);
      fetchExamDetails();
      toast({
        title: '✅ Ommaviy Tasdiqlandi',
        description: `${res.count} ta savol muvaffaqiyatli tasdiqlandi.`,
      });
      if (showValidationModal) {
        handleValidate(false);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || 'Savollarni tasdiqlashda xatolik yuz berdi.',
      });
    }
  };

  const handleExamStatusChange = async (targetStatus: ExamWorkflowStatus) => {
    try {
      await ExamWorkflowService.transitionExamStatus(exam.id, targetStatus, user?.email);
      fetchExamDetails();
      toast({
        title: 'Status yangilandi',
        description: `Imtihon holati: ${EXAM_STATUS_CONFIG[targetStatus]?.label || targetStatus}`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message,
      });
    }
  };

  const handleValidate = async (openModalOnSuccess = true) => {
    if (!exam?.id) return;
    setIsValidating(true);
    try {
      const result = await ExamWorkflowService.validateForPublish(exam.id);
      setValidationResult(result);
      if (!result.isValid || openModalOnSuccess) {
        setShowValidationModal(true);
      }
      return result;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Validatsiya xatoligi',
        description: err?.message,
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecutePublish = async () => {
    if (!exam?.id) return;
    setIsPublishing(true);
    try {
      await ExamWorkflowService.transitionExamStatus(exam.id, 'published', user?.email);
      setShowValidationModal(false);
      fetchExamDetails();
      toast({
        title: '🚀 Muvaffaqiyatli Nashr Qilindi!',
        description: 'Imtihon endi JLPT sahifasida barcha talabalar uchun ko‘rinadi.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Nashr qilishda xatolik',
        description: err?.message,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublishExam = async () => {
    if (
      !confirm(
        'Imtihonni nashrdan olib qoralama (draft) holatiga qaytarishni xohlaysizmi?\n\nImtihon talabalar sahifasidan yashiriladi.',
      )
    )
      return;
    try {
      await ExamWorkflowService.transitionExamStatus(exam.id, 'draft', user?.email);
      fetchExamDetails();
      toast({
        title: 'Qoralama holatiga o‘tkazildi',
        description: 'Imtihon endi talabalar ro‘yxatida ko‘rinmaydi.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message,
      });
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold text-slate-500">Imtihon ma'lumotlari yuklanmoqda...</p>
      </div>
    );

  if (!isAdminEmail(user?.email))
    return <div className="p-8 text-center font-bold text-red-500">Siz admin emassiz!</div>;
  if (!exam) return <div className="p-8 text-center text-slate-500">Imtihon topilmadi.</div>;

  const currentExamStatus: ExamWorkflowStatus =
    exam.status || (exam.is_published ? 'published' : 'draft');
  const examStatusMeta = EXAM_STATUS_CONFIG[currentExamStatus] || EXAM_STATUS_CONFIG.draft;
  const isExamPublished = currentExamStatus === 'published' || Boolean(exam.is_published);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 duration-300 animate-in fade-in">
      {/* Header Area */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/exams')}
            className="rounded-2xl bg-slate-100 p-3 transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-black text-indigo-600 dark:text-indigo-400">
                {exam.type}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${examStatusMeta.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${examStatusMeta.dotColor}`} />
                {examStatusMeta.label}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {exam.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/exams/${exam.id}`)}
            className="gap-2 rounded-xl text-xs font-bold"
          >
            <Eye className="h-4 w-4" /> O'quvchi Ko'rinishi
          </Button>

          {isExamPublished ? (
            <Button
              variant="outline"
              onClick={handleUnpublishExam}
              className="gap-1.5 rounded-xl border-amber-500/30 font-bold text-amber-600 hover:bg-amber-50"
            >
              <CornerDownLeft className="h-4 w-4" /> Bekitish (Draft)
            </Button>
          ) : (
            <Button
              onClick={() => handleValidate(true)}
              disabled={isValidating}
              className="gap-1.5 rounded-xl bg-green-600 font-bold text-white shadow-md hover:bg-green-700"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Nashr Qilish 🚀
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Stepper Bar (Talab 1 & 5) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {[
              { id: 'draft', label: '1. Qoralama' },
              { id: 'review', label: '2. Ko‘rib chiqish' },
              { id: 'approved', label: '3. Tasdiqlangan' },
              { id: 'published', label: '4. Nashr qilingan' },
            ].map((step, idx) => {
              const isCurrent = currentExamStatus === step.id;
              const order = ['draft', 'review', 'approved', 'published'];
              const isPassed = order.indexOf(currentExamStatus) > order.indexOf(step.id);

              return (
                <div key={step.id} className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-bold transition ${
                      isCurrent
                        ? 'border border-indigo-500/30 bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-950/50 dark:text-indigo-300'
                        : isPassed
                          ? 'border border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/40'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </span>
                    <span>{step.label}</span>
                  </div>
                  {idx < 3 && <span className="text-slate-300 dark:text-slate-700">➔</span>}
                </div>
              );
            })}
          </div>

          {/* Workflow quick transition triggers */}
          <div className="flex items-center gap-2">
            {currentExamStatus === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExamStatusChange('review')}
                className="gap-1.5 rounded-xl border-blue-500/30 text-xs font-bold text-blue-600 hover:bg-blue-50"
              >
                <Send className="h-3.5 w-3.5" /> Reviewga yuborish
              </Button>
            )}
            {currentExamStatus === 'review' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExamStatusChange('draft')}
                  className="rounded-xl text-xs font-bold"
                >
                  <CornerDownLeft className="h-3.5 w-3.5" /> Qoralama qilish
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleExamStatusChange('approved')}
                  className="gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Imtihonni Tasdiqlash
                </Button>
              </>
            )}
            {currentExamStatus === 'approved' && (
              <Button
                size="sm"
                onClick={() => handleValidate(true)}
                className="gap-1.5 rounded-xl bg-green-600 text-xs font-bold text-white shadow-md hover:bg-green-700"
              >
                <Sparkles className="h-3.5 w-3.5" /> Nashr Qilish 🚀
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Section Add Bar */}
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-4 w-4 text-indigo-500" /> Bo'lim Qo'shish (Sections):
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            variant="outline"
            className="justify-start gap-2 bg-white hover:border-emerald-500 dark:bg-slate-900"
            onClick={() => handleAddSection('Reading')}
          >
            <FileText className="h-4 w-4 text-emerald-500" />
            <span>+ Reading (読解)</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 bg-white hover:border-blue-500 dark:bg-slate-900"
            onClick={() => handleAddSection('Listening')}
          >
            <Headphones className="h-4 w-4 text-blue-500" />
            <span>+ Listening (聴解)</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 bg-white hover:border-purple-500 dark:bg-slate-900"
            onClick={() => handleAddSection('Writing')}
          >
            <PenTool className="h-4 w-4 text-purple-500" />
            <span>+ Writing (作文)</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 bg-white hover:border-rose-500 dark:bg-slate-900"
            onClick={() => handleAddSection('Speaking')}
          >
            <Mic className="h-4 w-4 text-rose-500" />
            <span>+ Speaking (会話)</span>
          </Button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {sections.map((section) => {
          const questions = sectionQuestions[section.id] || [];

          return (
            <div
              key={section.id}
              className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {section.title}
                  </h3>
                  <span className="rounded-full border border-indigo-500/20 bg-indigo-50 px-3 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {section.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(section.type === 'Reading' || section.type === 'Listening') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 rounded-xl text-xs font-bold"
                        onClick={() => setShowBulkModal(section.id)}
                      >
                        <Upload className="h-3.5 w-3.5" /> Bulk Import (JSON/CSV)
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                        onClick={() => setShowQuestionForm(section.id)}
                      >
                        <Plus className="h-4 w-4" /> Savol Qo'shish
                      </Button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    title="Bo'limni o'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Section Content Editing */}
              <div className="space-y-2">
                {section.type === 'Reading' ? (
                  <ReadingPassageEditor
                    passages={readingPassages.filter(
                      (x) =>
                        x.section_id === section.id ||
                        (!x.section_id && readingPassages.length === 1),
                    )}
                    sectionId={section.id}
                    examId={id}
                    onUpdate={() => fetchExamDetails()}
                    onDelete={() => fetchExamDetails()}
                    onRefresh={() => fetchExamDetails()}
                  />
                ) : section.type === 'Listening' ? (
                  <ListeningAudioEditor
                    audios={listeningAudios.filter(
                      (x) =>
                        x.section_id === section.id ||
                        (!x.section_id && listeningAudios.length === 1),
                    )}
                    sectionId={section.id}
                    examId={id}
                    onUpdate={() => fetchExamDetails()}
                    onDelete={() => fetchExamDetails()}
                    onRefresh={() => fetchExamDetails()}
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        📝 Prompt / Topshiriq Mavzusi:
                      </span>
                      {editingContentId !== section.id && (
                        <button
                          onClick={() => {
                            setEditingContentId(section.id);
                            setEditContent(section.content || '');
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Matnni Tahrirlash
                        </button>
                      )}
                    </div>
                    {editingContentId === section.id ? (
                      <div className="space-y-3 rounded-2xl border border-indigo-300 bg-slate-50 p-4 dark:border-indigo-700 dark:bg-slate-800">
                        <textarea
                          rows={7}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Mavzu yoki matnni yozing..."
                          className="w-full rounded-xl border border-slate-200 bg-white p-3.5 font-sans text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingContentId(null)}
                            className="rounded-xl"
                          >
                            Bekor
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveContent(section.id)}
                            className="rounded-xl bg-indigo-600 font-bold"
                          >
                            Saqlash
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingContentId(section.id);
                          setEditContent(section.content || '');
                        }}
                        className="max-h-48 cursor-pointer overflow-y-auto rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 transition hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                      >
                        {section.content ||
                          '+ Mavzu kiritilmagan. Tahrirlash uchun ustiga bosing...'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reading/Listening Questions List */}
              {(section.type === 'Reading' || section.type === 'Listening') && (
                <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Savollar ({questions.length}):
                      </h4>
                      {questions.length > 0 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800">
                          {questions.filter((q) => q.status === 'approved').length} /{' '}
                          {questions.length} tasdiqlangan
                        </span>
                      )}
                    </div>
                    {questions.length > 0 && (
                      <button
                        onClick={() => handleBulkApprove(questions.map((q) => q.id))}
                        className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        title="Ushbu bo'limdagi barcha savollarni tasdiqlash"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Barchasini tasdiqlash
                      </button>
                    )}
                  </div>

                  {questions.length > 0 ? (
                    <div className="space-y-3">
                      {questions.map((q, idx) => {
                        const qStatus: QuestionWorkflowStatus = q.status || 'draft';
                        const qStatusMeta =
                          QUESTION_STATUS_CONFIG[qStatus] || QUESTION_STATUS_CONFIG.draft;

                        return (
                          <div
                            key={q.id}
                            className={`space-y-3 rounded-2xl border p-4 transition-all duration-200 ${
                              qStatus === 'rejected'
                                ? 'border-red-300 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20'
                                : qStatus === 'approved'
                                  ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/10'
                                  : 'border-slate-100 bg-slate-50 dark:border-slate-700/80 dark:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex items-start gap-2">
                                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                  {idx + 1}.
                                </span>
                                <div>
                                  <div className="mb-1">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${qStatusMeta.badgeClass}`}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${qStatusMeta.dotColor}`}
                                      />
                                      {qStatusMeta.label}
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
                                    {q.question_text}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                {qStatus !== 'approved' && (
                                  <button
                                    onClick={() => handleQuestionStatusChange(q.id, 'approved')}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-white px-2 py-1 text-[11px] font-bold text-emerald-600 shadow-sm transition hover:bg-emerald-600 hover:text-white dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-600"
                                    title="Savolni tasdiqlash (Approved)"
                                    data-testid={`approve-btn-${q.id}`}
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5" /> Tasdiqlash
                                  </button>
                                )}

                                {qStatus !== 'rejected' && (
                                  <button
                                    onClick={() => {
                                      setRejectingQuestionId(q.id);
                                      setRejectionComment(q.rejection_comment || '');
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-[11px] font-bold text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white dark:border-red-900/40 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-600"
                                    title="Savolni rad etish va izoh yozish"
                                    data-testid={`reject-btn-${q.id}`}
                                  >
                                    <AlertCircle className="h-3.5 w-3.5" /> Qaytarish
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                                  title="Savolni o'chirish"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Rejection comment display (Talab 3 & 4) */}
                            {qStatus === 'rejected' && q.rejection_comment && (
                              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 font-bold">
                                    <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />{' '}
                                    Qaytarish izohi:
                                  </span>
                                  <button
                                    onClick={() => handleQuestionStatusChange(q.id, 'review')}
                                    className="text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                  >
                                    Tuzatildi ➔ Reviewga yuborish
                                  </button>
                                </div>
                                <p className="mt-1 font-medium">{q.rejection_comment}</p>
                              </div>
                            )}

                            {q.options && (
                              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                                {(q.options as string[]).map((opt, i) => {
                                  const isCorrect = opt === q.correct_answer;
                                  return (
                                    <div
                                      key={i}
                                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium ${
                                        isCorrect
                                          ? 'border-green-500/30 bg-green-500/10 font-bold text-green-600'
                                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                                      }`}
                                    >
                                      <span>
                                        {String.fromCharCode(65 + i)}) {opt}
                                      </span>
                                      {isCorrect && (
                                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Linked Passage / Audio Tag & Re-linker (Talab 2) */}
                            {section.type === 'Reading' && (
                              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                                <span className="flex items-center gap-1 font-bold text-slate-500">
                                  <FileText className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Biriktirilgan matn:</span>
                                </span>
                                <select
                                  value={q.passage_id || ''}
                                  onChange={async (e) => {
                                    const newId = e.target.value || null;
                                    try {
                                      await ReadingPassageService.linkQuestion(q.id, newId);
                                      fetchExamDetails();
                                      toast({
                                        title: 'Bog‘landi',
                                        description: 'Savol matnga biriktirildi.',
                                      });
                                    } catch (err: any) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'Xatolik',
                                        description: err?.message,
                                      });
                                    }
                                  }}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                  data-testid={`link-passage-select-${q.id}`}
                                >
                                  <option value="">(Umumiy / Bog'lanmagan)</option>
                                  {readingPassages
                                    .filter((p) => p.section_id === section.id || !p.section_id)
                                    .map((p) => (
                                      <option key={p.id} value={p.id}>
                                        📖 {p.title}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}

                            {section.type === 'Listening' && (
                              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                                <span className="flex items-center gap-1 font-bold text-slate-500">
                                  <Headphones className="h-3.5 w-3.5 text-blue-500" />
                                  <span>Biriktirilgan audio:</span>
                                </span>
                                <select
                                  value={q.listening_audio_id || ''}
                                  onChange={async (e) => {
                                    const newId = e.target.value || null;
                                    try {
                                      await ListeningAudioService.linkQuestion(q.id, newId);
                                      fetchExamDetails();
                                      toast({
                                        title: 'Bog‘landi',
                                        description: 'Savol audioga biriktirildi.',
                                      });
                                    } catch (err: any) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'Xatolik',
                                        description: err?.message,
                                      });
                                    }
                                  }}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                  data-testid={`link-audio-select-${q.id}`}
                                >
                                  <option value="">(Umumiy / Bog'lanmagan)</option>
                                  {listeningAudios
                                    .filter((a) => a.section_id === section.id || !a.section_id)
                                    .map((a) => (
                                      <option key={a.id} value={a.id}>
                                        🎧 {a.title}{' '}
                                        {a.duration_seconds
                                          ? `(${Math.floor(a.duration_seconds / 60)}:${(a.duration_seconds % 60).toString().padStart(2, '0')})`
                                          : ''}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-800/40">
                      Hali savollar kiritilmagan. Yuqoridagi "+ Savol Qo'shish" yoki "Bulk Import"
                      tugmasini bosing.
                    </p>
                  )}
                </div>
              )}

              {/* Rapid Question Creation Form */}
              {showQuestionForm === section.id && (
                <div className="mt-4 space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 duration-200 animate-in fade-in dark:border-indigo-500/20 dark:bg-indigo-500/10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-300">
                      Yangi Savol Qo'shish
                    </h4>
                    <button
                      onClick={() => setShowQuestionForm(null)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-500">
                      Savol Matni *
                    </label>
                    <textarea
                      rows={2}
                      value={questionForm.question_text}
                      onChange={(e) =>
                        setQuestionForm((f) => ({ ...f, question_text: e.target.value }))
                      }
                      placeholder="Savol matni (masalan: 本文の内容と合っているものはどれか)..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 font-sans text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                      autoFocus
                    />
                  </div>

                  {section.type === 'Reading' && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                        📖 Qaysi Dokkai Matniga biriktirilsin?
                      </label>
                      <select
                        value={questionForm.passage_id || ''}
                        onChange={(e) =>
                          setQuestionForm((f) => ({ ...f, passage_id: e.target.value || null }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                        data-testid="question-form-passage-select"
                      >
                        <option value="">(Umumiy / Bo'lim matnisiz)</option>
                        {readingPassages
                          .filter((p) => p.section_id === section.id || !p.section_id)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              📖 {p.title}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {section.type === 'Listening' && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                        🎧 Qaysi Choukai Audiosiga biriktirilsin?
                      </label>
                      <select
                        value={questionForm.listening_audio_id || ''}
                        onChange={(e) =>
                          setQuestionForm((f) => ({
                            ...f,
                            listening_audio_id: e.target.value || null,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                        data-testid="question-form-audio-select"
                      >
                        <option value="">(Umumiy / Audiosiz)</option>
                        {listeningAudios
                          .filter((a) => a.section_id === section.id || !a.section_id)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              🎧 {a.title}{' '}
                              {a.duration_seconds
                                ? `(${Math.floor(a.duration_seconds / 60)}:${(a.duration_seconds % 60).toString().padStart(2, '0')})`
                                : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {questionForm.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500">
                        4 ta Variant va To'g'ri javobni tanlang:
                      </label>
                      <div className="space-y-2">
                        {questionForm.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-5 text-center text-xs font-bold text-slate-400">
                              {String.fromCharCode(65 + i)})
                            </span>
                            <input
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...questionForm.options];
                                const oldVal = newOpts[i];
                                newOpts[i] = e.target.value;
                                setQuestionForm((f) => ({
                                  ...f,
                                  options: newOpts,
                                  // Sync correct_answer if this option was the selected one
                                  correct_answer:
                                    f.correct_answer === oldVal ? e.target.value : f.correct_answer,
                                }));
                              }}
                              placeholder={`Variant ${String.fromCharCode(65 + i)}`}
                              className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setQuestionForm((f) => ({ ...f, correct_answer: opt }))
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                questionForm.correct_answer === opt && opt
                                  ? 'border-green-600 bg-green-600 text-white shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-green-400 dark:border-slate-700 dark:bg-slate-800'
                              }`}
                            >
                              {questionForm.correct_answer === opt && opt ? "✓ To'g'ri" : 'Tanlash'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 border-t border-indigo-100 pt-2 dark:border-indigo-900/30">
                    <Button
                      size="sm"
                      onClick={() => handleSaveQuestion(section.id, true)}
                      disabled={savingQuestion}
                      className="gap-1 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
                    >
                      {savingQuestion ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Saqlash va Yana Qo'shish (+1)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveQuestion(section.id, false)}
                      disabled={savingQuestion}
                      className="rounded-xl font-bold"
                    >
                      Saqlash va Yopish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto rounded-xl text-slate-400"
                      onClick={() => setShowQuestionForm(null)}
                    >
                      Bekor
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sections.length === 0 && (
          <div className="space-y-3 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-400 dark:border-slate-700 dark:bg-slate-800/40">
            <List className="mx-auto h-16 w-16 opacity-20" />
            <p className="text-base font-bold text-slate-600 dark:text-slate-300">
              Hali hech qanday bo'lim qo'shilmagan.
            </p>
            <p className="mx-auto max-w-sm text-xs text-slate-400">
              Yuqoridagi tugmalar orqali Reading (Dokkai) / Listening / Writing / Speaking
              bo'limlarini qo'shing.
            </p>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <ExamBulkImportModal
          isOpen={Boolean(showBulkModal)}
          onClose={() => setShowBulkModal(null)}
          onSuccess={() => {
            fetchExamDetails();
          }}
          mode="section"
          sectionId={showBulkModal}
          sectionTitle={sections.find((s) => s.id === showBulkModal)?.title}
          examLevel={(exam?.type?.match(/N[1-5]/i)?.[0]?.toUpperCase() as any) || 'N3'}
          existingQuestions={sectionQuestions[showBulkModal] || []}
        />
      )}

      {/* Question Rejection Modal (Talab 3 & 4) */}
      {rejectingQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" /> Savolni Qaytarish (Rad Etish)
              </h3>
              <button
                onClick={() => {
                  setRejectingQuestionId(null);
                  setRejectionComment('');
                }}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Savol nima sababdan rad etilayotganini va muallif nimani to'g'irlashi kerakligini
              yozing. Bu izoh savol kartasida ko'rinadi.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tezkor sabablar:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "To'g'ri javob noto'g'ri belgilangan",
                  'Variantlarda noaniqlik yoki xato mavjud',
                  'Savol matnida imlo/kanji xatosi bor',
                  'Biriktirilgan matnga mos emas',
                  'JLPT darajasi mezoniga to‘g‘ri kelmaydi',
                ].map((tpl) => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => setRejectionComment(tpl)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    + {tpl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Izoh matni *
              </label>
              <textarea
                rows={3}
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Savolni qaytarish sababi va ko'rsatmalar..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingQuestionId(null);
                  setRejectionComment('');
                }}
                className="rounded-xl text-xs font-bold"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={async () => {
                  if (!rejectionComment.trim()) {
                    toast({
                      variant: 'destructive',
                      title: 'Izoh kiritilmadi',
                      description: 'Iltimos, qaytarish sababini yozing.',
                    });
                    return;
                  }
                  setSubmittingRejection(true);
                  try {
                    await handleQuestionStatusChange(
                      rejectingQuestionId,
                      'rejected',
                      rejectionComment,
                    );
                    setRejectingQuestionId(null);
                    setRejectionComment('');
                  } finally {
                    setSubmittingRejection(false);
                  }
                }}
                disabled={submittingRejection || !rejectionComment.trim()}
                className="rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700"
              >
                {submittingRejection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Qaytarish va Saqlash'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Publish Validation Modal (Talab 5 & 6) */}
      {showValidationModal && validationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-white ${
                    validationResult.isValid ? 'bg-emerald-600' : 'bg-red-600'
                  }`}
                >
                  {validationResult.isValid ? '✓' : '!'}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {validationResult.isValid
                      ? 'Nashr Qilishga Tayyor! 🎉'
                      : 'Nashr Qilish Oldidan Yakuniy Tekshiruv'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {validationResult.isValid
                      ? 'Barcha talablar va mezonlar to‘liq bajarildi.'
                      : 'Quyidagi kamchiliklarni bartaraf qilmasdan imtihonni nashr qilib bo‘lmaydi.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60">
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {validationResult.summary.totalQuestions}
                </div>
                <div className="text-[11px] font-semibold text-slate-400">Jami Savollar</div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {validationResult.summary.approvedCount}
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Tasdiqlangan
                </div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3 text-center dark:border-blue-900/40 dark:bg-blue-950/20">
                <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {validationResult.summary.reviewCount + validationResult.summary.draftCount}
                </div>
                <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                  Review / Qoralama
                </div>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-3 text-center dark:border-red-900/40 dark:bg-red-950/20">
                <div className="text-lg font-black text-red-600 dark:text-red-400">
                  {validationResult.summary.rejectedCount}
                </div>
                <div className="text-[11px] font-semibold text-red-700 dark:text-red-300">
                  Rad etilgan
                </div>
              </div>
            </div>

            {/* Error List */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" /> Aniqlangan Xatolar (
                  {validationResult.errors.length}):
                </div>
                <ul className="max-h-48 list-disc space-y-1.5 overflow-y-auto pl-5 text-xs text-red-800 dark:text-red-300">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings List */}
            {validationResult.warnings.length > 0 && (
              <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> Ogohlantirishlar (
                  {validationResult.warnings.length}):
                </div>
                <ul className="list-disc space-y-1.5 pl-5 text-xs text-amber-800 dark:text-amber-300">
                  {validationResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick action: bulk approve if only non-approved questions are blocking */}
            {validationResult.summary.approvedCount < validationResult.summary.totalQuestions &&
              validationResult.summary.rejectedCount === 0 && (
                <div className="flex flex-col gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3 text-xs dark:border-indigo-800/40 dark:bg-indigo-950/20 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                    💡 Barcha savollar to‘g‘ri kiritilgan bo‘lsa, ularni 1 ta tugma bilan
                    tasdiqlashingiz mumkin:
                  </span>
                  <Button
                    size="sm"
                    onClick={async () => {
                      const allQIds = Object.values(sectionQuestions)
                        .flat()
                        .map((q) => q.id);
                      await handleBulkApprove(allQIds);
                    }}
                    className="gap-1 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Barchasini Tasdiqlash
                  </Button>
                </div>
              )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setShowValidationModal(false)}
                className="rounded-xl text-xs font-bold"
              >
                Yopish
              </Button>
              <Button
                onClick={handleExecutePublish}
                disabled={!validationResult.isValid || isPublishing}
                className="gap-2 rounded-xl bg-green-600 px-5 text-xs font-bold text-white shadow-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Ha, Nashr Qilish 🚀
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;
