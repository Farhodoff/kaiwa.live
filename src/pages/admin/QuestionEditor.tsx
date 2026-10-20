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
} from 'lucide-react';
import { useStudyData } from '../../context/StudyPlannerContext';
import { isAdminEmail, isUserAdmin } from '../../utils/admin';
import { toast } from '../../hooks/use-toast';
import { ExamBulkImportModal } from '../../components/admin/ExamBulkImportModal';

interface QuestionFormData {
  question_text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  explanation: string;
}

export const QuestionEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useStudyData();
  const [exam, setExam] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionQuestions, setSectionQuestions] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  // Question form state
  const [showQuestionForm, setShowQuestionForm] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    question_text: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Content editing state
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Bulk Import state (sectionId)
  const [showBulkModal, setShowBulkModal] = useState<string | null>(null);

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
      const { error } = await supabase.from('exam_sections').insert({
        exam_id: id,
        title,
        type,
        order_index: sections.length,
      });
      if (error) throw error;
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
    if (!confirm("Bu bo'limni o'chirishni xohlaysizmi? Ichidagi barcha savollar ham o'chadi."))
      return;
    try {
      const { error } = await supabase.from('exam_sections').delete().eq('id', sectionId);
      if (error) throw error;
      fetchExamDetails();
      toast({
        title: "🗑️ O'chirildi",
        description: "Bo'lim muvaffaqiyatli o'chirildi.",
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
      const { error } = await supabase.from('exam_questions').insert({
        section_id: sectionId,
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

  const handlePublishToggle = async () => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_published: !exam.is_published })
        .eq('id', exam.id);
      if (error) throw error;
      fetchExamDetails();
      toast({
        title: "📢 Holat O'zgardi",
        description: exam.is_published
          ? "Imtihon qoralama holatiga o'tkazildi."
          : "Imtihon barcha o'quvchilar uchun e'lon qilindi!",
      });
    } catch (err: any) {
      console.error('Publish toggle error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: `Nashr qilishda xatolik: ${err?.message || JSON.stringify(err)}`,
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
              {exam.is_published ? (
                <span className="flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-[11px] font-bold text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> Published
                </span>
              ) : (
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600">
                  Draft
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {exam.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/exams/${exam.id}`)}
            className="gap-2 rounded-xl text-xs font-bold"
          >
            <Eye className="h-4 w-4" /> O'quvchi Ko'rinishi
          </Button>
          <Button
            variant={exam.is_published ? 'outline' : 'default'}
            onClick={handlePublishToggle}
            className={
              !exam.is_published
                ? 'rounded-xl bg-green-600 font-bold text-white shadow-md hover:bg-green-700'
                : 'rounded-xl font-bold'
            }
          >
            {exam.is_published ? 'Bekitish (Draft)' : 'Nashr Qilish 🚀'}
          </Button>
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

              {/* Section Content Editing (Dokkai Passage / Listening Audio / Prompts) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    {section.type === 'Reading'
                      ? '📖 Dokkai Matni (Reading Passage):'
                      : section.type === 'Listening'
                        ? '🎧 Audio URL / Transkript:'
                        : '📝 Prompt / Topshiriq Mavzusi:'}
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
                      placeholder={
                        section.type === 'Reading'
                          ? 'Dokkai matnini shu yerga yozing...'
                          : 'Mavzu yoki matnni yozing...'
                      }
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
                      `+ Dokkai matni yoki mavzu kiritilmagan. Tahrirlash uchun ustiga bosing...`}
                  </div>
                )}
              </div>

              {/* Reading/Listening Questions List */}
              {(section.type === 'Reading' || section.type === 'Listening') && (
                <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Savollar ({questions.length}):
                    </h4>
                  </div>

                  {questions.length > 0 ? (
                    <div className="space-y-3">
                      {questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/80 dark:bg-slate-800/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-2">
                              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                {idx + 1}.
                              </span>
                              <p className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
                                {q.question_text}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

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
                        </div>
                      ))}
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
    </div>
  );
};

export default QuestionEditor;
