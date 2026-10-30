import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Edit2,
  Loader2,
  Trash2,
  X,
  Sparkles,
  CheckCircle2,
  Search,
  Shield,
  Eye,
  Upload,
  Archive,
  ArchiveRestore,
  Clock,
  History,
} from 'lucide-react';
import { useStudyData } from '../../context/StudyPlannerContext';
import { isAdminEmail, isUserAdmin } from '../../utils/admin';
import { ExamBulkImportModal } from '../../components/admin/ExamBulkImportModal';
import { ExamImportHistoryModal } from '../../components/admin/ExamImportHistoryModal';
import { JlptTimingConfigModal } from '../../components/admin/JlptTimingConfigModal';
import {
  ExamWorkflowService,
  EXAM_STATUS_CONFIG,
  ExamWorkflowStatus,
} from '../../services/ExamWorkflowService';
import { LICENSE_CONFIG, normalizeLicenseType } from '../../types/examMetadata';

import { toast } from '../../hooks/use-toast';

export const ExamsManager: React.FC = () => {
  const { user } = useStudyData();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'PUBLISHED' | 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED'
  >('ALL');

  // Step-by-Step Creation Wizard State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showTimingModal, setShowTimingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedExamForHistory, setSelectedExamForHistory] = useState<any | null>(null);
  const [jlptLevel, setJlptLevel] = useState<'N5' | 'N4' | 'N3' | 'N2' | 'N1'>('N3');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchExams = async () => {
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching exams:', error.message);
        setFetchError(error.message);
        setExams([]);
      } else {
        setExams(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching exams:', err);
      setFetchError(err?.message || 'Imtihonlarni yuklashda kutilmagan xatolik yuz berdi.');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserAdmin(user) || isAdminEmail(user?.email, (user as any)?.role)) {
      fetchExams();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleCreateExam = async () => {
    const fullType = `JLPT ${jlptLevel}`;
    const titleToSave = newTitle.trim() || `${fullType} Mock Test`;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert({
          title: titleToSave,
          type: fullType,
          description: newDesc.trim() || null,
          status: 'draft',
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;

      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchExams();
      toast({
        title: '✅ Imtihon Yaratildi (Draft)',
        description: `"${titleToSave}" muvaffaqiyatli saqlandi va ko'rib chiqishga tayyor.`,
      });

      if (data?.id) {
        navigate(`/admin/exams/${data.id}`);
      }
    } catch (err: any) {
      console.error('Exam creation error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: `Xatolik: ${err?.message || JSON.stringify(err)}`,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleArchiveExam = async (examId: string, examTitle: string) => {
    if (
      !confirm(
        `"${examTitle}" imtihonini arxivlashni xohlaysizmi?\n\nImtihon talabalar sahifasidan yashiriladi va arxiv bo'limiga o'tkaziladi.`,
      )
    )
      return;
    try {
      const res = await ExamWorkflowService.archiveExam(examId, user?.email, (user as any)?.role);
      fetchExams();
      toast({
        title: '📦 Arxivlandi',
        description: res.message,
      });
    } catch (err: any) {
      console.error('Archive error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || 'Arxivlashda xatolik yuz berdi.',
      });
    }
  };

  const handleRestoreExam = async (examId: string, _examTitle?: string) => {
    try {
      const res = await ExamWorkflowService.restoreExam(examId, user?.email, (user as any)?.role);
      fetchExams();
      toast({
        title: '♻️ Qayta Tiklandi',
        description: res.message,
      });
    } catch (err: any) {
      console.error('Restore error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || 'Qayta tiklashda xatolik yuz berdi.',
      });
    }
  };

  const handleDeleteExam = async (
    examId: string,
    examTitle: string,
    status?: ExamWorkflowStatus,
    isPublished?: boolean,
  ) => {
    if (status === 'published' || isPublished) {
      toast({
        variant: 'destructive',
        title: "O'chirib bo'lmaydi",
        description:
          "Faol chop etilgan imtihonni to'g'ridan-to'g'ri o'chirib bo'lmaydi! Uni avval arxivlang.",
      });
      return;
    }

    if (
      !confirm(`"${examTitle}" imtihonini butunlay o'chirishni xohlaysizmi? Bu qaytarib bo'lmaydi.`)
    )
      return;

    try {
      const res = await ExamWorkflowService.deleteExamSafely(examId, status, isPublished);
      fetchExams();
      toast({
        title: "🗑️ O'chirildi",
        description: res.message,
      });
    } catch (err: any) {
      console.error('Exam delete error:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: `O'chirishda xatolik: ${err?.message || JSON.stringify(err)}`,
      });
    }
  };

  // Filter logic
  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.type.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const currentStatus: ExamWorkflowStatus =
      exam.status || (exam.is_published ? 'published' : 'draft');

    if (activeTab === 'PUBLISHED') return currentStatus === 'published';
    if (activeTab === 'DRAFT') return currentStatus === 'draft';
    if (activeTab === 'REVIEW') return currentStatus === 'review';
    if (activeTab === 'APPROVED') return currentStatus === 'approved';
    if (activeTab === 'ARCHIVED') return currentStatus === 'archived';

    // ALL tab shows all active non-archived exams (unless user explicitly searches)
    if (activeTab === 'ALL') {
      return searchQuery ? true : currentStatus !== 'archived';
    }

    return true;
  });

  const stats = {
    total: exams.filter((e) => e.status !== 'archived').length,
    published: exams.filter((e) => e.status === 'published' || (!e.status && e.is_published))
      .length,
    review: exams.filter((e) => e.status === 'review').length,
    draft: exams.filter((e) => e.status === 'draft' || (!e.status && !e.is_published)).length,
    approved: exams.filter((e) => e.status === 'approved').length,
    archived: exams.filter((e) => e.status === 'archived').length,
  };

  if (loading)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold text-slate-500">Imtihonlar yuklanmoqda...</p>
      </div>
    );

  if (!isAdminEmail(user?.email))
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <Shield className="mx-auto mb-3 h-12 w-12 text-red-500" />
          <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Ruxsat Yo'q</h3>
          <p className="mt-1 text-sm text-slate-500">
            Siz admin emassiz! Faqat tasdiqlangan adminlar ushbu sahifaga kirishi mumkin.
          </p>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 duration-300 animate-in fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl shadow-rose-500/10">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> JLPT Exam Studio
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">
              JLPT Imtihonlar Markazi
            </h1>
            <p className="max-w-xl text-sm text-rose-100">
              Rasmiy JLPT N5–N1 mock testlari, Dokkai o'qish matnlari va Listening qismlarini
              boshqarish.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowTimingModal(true)}
              className="transform gap-2 rounded-2xl border-white/40 bg-white/10 px-5 py-3 font-extrabold text-white shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white hover:text-rose-700 hover:shadow-xl"
            >
              <Clock className="h-5 w-5" /> JLPT Vaqt Sozlamalari
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(true)}
              className="transform gap-2 rounded-2xl border-white/40 bg-white/10 px-5 py-3 font-extrabold text-white shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white hover:text-rose-700 hover:shadow-xl"
            >
              <Upload className="h-5 w-5" /> Ommaviy Import (JSON / CSV)
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="transform gap-2 rounded-2xl bg-white px-6 py-3 font-extrabold text-rose-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl"
            >
              <Plus className="h-5 w-5" /> Yangi JLPT Imtihoni Qo'shish
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 font-bold text-indigo-600 dark:text-indigo-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{stats.total}</div>
            <div className="text-xs font-semibold text-slate-400">Faol Imtihonlar</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 font-bold text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {stats.published}
            </div>
            <div className="text-xs font-semibold text-slate-400">Nashr Qilingan</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 font-bold text-amber-600 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {stats.review + stats.draft}
            </div>
            <div className="text-xs font-semibold text-slate-400">Review & Draft</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-500/10 font-bold text-slate-600 dark:text-slate-400">
            <Archive className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {stats.archived}
            </div>
            <div className="text-xs font-semibold text-slate-400">Arxivlangan</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
        <div className="flex w-full gap-1.5 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
          {[
            { id: 'ALL', label: 'Barchasi' },
            { id: 'PUBLISHED', label: `Nashr qilingan (${stats.published})` },
            { id: 'REVIEW', label: `Ko'rib chiqishda (${stats.review})` },
            { id: 'APPROVED', label: `Tasdiqlangan (${stats.approved})` },
            { id: 'DRAFT', label: `Qoralama (${stats.draft})` },
            { id: 'ARCHIVED', label: `Arxiv (${stats.archived})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Imtihon nomini izlash..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {fetchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
          ⚠️ {fetchError}
        </div>
      )}

      {/* Exams Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredExams.map((exam) => {
          const currentStatus: ExamWorkflowStatus =
            exam.status || (exam.is_published ? 'published' : 'draft');
          const statusMeta = EXAM_STATUS_CONFIG[currentStatus] || EXAM_STATUS_CONFIG.draft;
          const isPublished = currentStatus === 'published' || Boolean(exam.is_published);
          const isArchived = currentStatus === 'archived';

          return (
            <div
              key={exam.id}
              className={`group flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:bg-slate-900 ${
                isArchived
                  ? 'border-slate-300/70 opacity-75 dark:border-slate-800'
                  : 'border-slate-200 hover:border-indigo-400 dark:border-slate-800 dark:hover:border-indigo-500'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      exam.type.includes('JLPT')
                        ? 'border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {exam.type}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.badgeClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotColor}`} />
                    {statusMeta.label}
                  </span>
                </div>

                <h3 className="text-xl font-bold leading-snug text-slate-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                  {exam.title}
                </h3>
                {exam.description && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {exam.description}
                  </p>
                )}

                {/* Source & License Metadata (Task 7) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  {exam.is_official_jlpt ? (
                    <span className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 font-bold text-rose-700 dark:text-rose-400">
                      🏛️ Rasmiy JLPT
                    </span>
                  ) : (
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      Amaliyot / Mock
                    </span>
                  )}

                  {(() => {
                    const licType = normalizeLicenseType(exam.license_type);
                    const licMeta = LICENSE_CONFIG[licType];
                    return (
                      <span
                        className={`rounded-md border px-2 py-0.5 font-bold ${licMeta.badgeClass}`}
                        title={licMeta.description}
                      >
                        {licMeta.shortLabel}
                      </span>
                    );
                  })()}

                  {exam.source_name && (
                    <span
                      className="max-w-[150px] truncate text-slate-500 dark:text-slate-400"
                      title={`Manba: ${exam.source_name}`}
                    >
                      {exam.source_url ? (
                        <a
                          href={exam.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline dark:text-indigo-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔗 {exam.source_name}
                        </a>
                      ) : (
                        `📚 ${exam.source_name}`
                      )}
                    </span>
                  )}
                  {exam.author && (
                    <span className="text-slate-400 dark:text-slate-500">• {exam.author}</span>
                  )}
                </div>

                {exam.rejection_comment && currentStatus !== 'published' && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                    <span className="font-bold">⚠️ Qaytarish izohi:</span> {exam.rejection_comment}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-xs font-bold transition hover:bg-indigo-600 hover:text-white"
                  onClick={() => navigate(`/admin/exams/${exam.id}`)}
                >
                  <Edit2 className="h-3.5 w-3.5" /> Savollar va Bo'limlar
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 border-rose-500/30 px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-500 hover:text-white dark:text-rose-400"
                  onClick={() => {
                    const lvlMatch = exam.type.match(/N[1-5]/i);
                    const lvl = lvlMatch ? lvlMatch[0].toUpperCase() : 'N5';
                    navigate(`/jlpt?tab=mock&level=${lvl}&examId=${exam.id}`);
                  }}
                  title="Talaba sifatida sinab ko'rish (Preview)"
                >
                  <Eye className="h-3.5 w-3.5" /> Sinash
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 border-slate-300 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => {
                    setSelectedExamForHistory(exam);
                    setShowHistoryModal(true);
                  }}
                  title="Import tarixi, Rollback va Versiyalarni tiklash"
                >
                  <History className="h-3.5 w-3.5 text-indigo-500" /> Tarix / Rollback
                </Button>

                {isArchived ? (
                  <>
                    <button
                      onClick={() => handleRestoreExam(exam.id, exam.title)}
                      className="rounded-xl border border-indigo-200 p-2 text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                      title="Arxivdan qayta tiklash (Draft)"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteExam(exam.id, exam.title, currentStatus, isPublished)
                      }
                      className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      title="Butunlay o'chirish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : isPublished ? (
                  <button
                    onClick={() => handleArchiveExam(exam.id, exam.title)}
                    className="rounded-xl border border-amber-200 p-2 text-amber-600 transition hover:bg-amber-50 dark:border-amber-700/60 dark:text-amber-400 dark:hover:bg-amber-950/40"
                    title="Chop etilgan imtihonni arxivlash (O'chirish o'rniga)"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleDeleteExam(exam.id, exam.title, currentStatus, isPublished)
                    }
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    title="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredExams.length === 0 && !fetchError && (
          <div className="col-span-full space-y-3 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-400 dark:border-slate-700 dark:bg-slate-800/40">
            <BookOpen className="mx-auto h-16 w-16 opacity-20" />
            <p className="text-base font-bold text-slate-600 dark:text-slate-300">
              Testlar topilmadi.
            </p>
            <p className="mx-auto max-w-sm text-xs text-slate-400">
              Hali hech qanday imtihon yaratilmagan yoki qidiruv bo'yicha imtihon mavjud emas.
              Yuqoridagi tugmani bosib yaratishingiz mumkin.
            </p>
          </div>
        )}
      </div>

      {/* Step-by-Step Create Exam Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-200 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Yangi Imtihon Qo'shish
                </h3>
                <p className="text-xs text-slate-400">Bo'lim va savollarni yaratish rejimi</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step 1: Level Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                1. JLPT Darajasini Tanlang (N1 - N5):
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setJlptLevel(lvl)}
                    className={`cursor-pointer rounded-xl border py-3 text-sm font-black transition ${
                      jlptLevel === lvl
                        ? 'scale-[1.05] border-rose-600 bg-rose-600 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Title & Description */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">Imtihon Nomi</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={`JLPT ${jlptLevel} Mock Test 1`}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 font-sans text-sm outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">
                  Tavsif (ixtiyoriy)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Imtihon haqida qisqacha ma'lumot..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 font-sans text-sm outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleCreateExam}
                disabled={creating}
                className="cursor-pointer gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-3 font-bold text-white shadow-lg"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Davom etish va Savollar qo'shish ➔
              </Button>
            </div>
          </div>
        </div>
      )}

      <JlptTimingConfigModal
        isOpen={showTimingModal}
        onClose={() => setShowTimingModal(false)}
        user={user}
      />

      {/* Full Exam Bulk Import Modal */}
      <ExamBulkImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={({ examId }) => {
          fetchExams();
          if (examId) {
            navigate(`/admin/exams/${examId}`);
          }
        }}
        mode="full-exam"
        availableExams={exams}
        currentUserEmail={user?.email}
        currentUserRole={(user as any)?.role}
      />

      {/* Exam Import History, Rollback & Version Restore Modal */}
      {selectedExamForHistory && (
        <ExamImportHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedExamForHistory(null);
          }}
          examId={selectedExamForHistory.id}
          examTitle={selectedExamForHistory.title}
          onChanged={fetchExams}
        />
      )}
    </div>
  );
};

export default ExamsManager;
