import React, { useState } from 'react';
import {
  FileText,
  Edit3,
  Trash2,
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ReadingPassageService, type ReadingPassage } from '../../services/ReadingPassageService';
import { toast } from '../../hooks/use-toast';

interface ReadingPassageEditorProps {
  passage?: ReadingPassage | null;
  passages?: ReadingPassage[];
  sectionId?: string;
  examId?: string;
  onUpdate: (passage: ReadingPassage) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
  isSaving?: boolean;
}

export const ReadingPassageEditor: React.FC<ReadingPassageEditorProps> = ({
  passage,
  passages,
  sectionId,
  examId,
  onUpdate,
  onDelete,
  onRefresh,
  isSaving = false,
}) => {
  // If `passages` is passed, use it; otherwise wrap `passage` if present
  const allPassages = passages && passages.length > 0 ? passages : passage ? [passage] : [];

  const [activePassageId, setActivePassageId] = useState<string | null>(allPassages[0]?.id || null);
  const activePassage = allPassages.find((p) => p.id === activePassageId) || allPassages[0] || null;

  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(activePassage?.title ?? 'Dokkai Matni');
  const [draftContent, setDraftContent] = useState(activePassage?.content ?? '');
  const [savingPassage, setSavingPassage] = useState(false);

  // Linked questions accordion view
  const [showQuestions, setShowQuestions] = useState(false);

  // Delete confirmation modal with linked questions warning (Talab 7)
  const [deleteModalPassage, setDeleteModalPassage] = useState<ReadingPassage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync draft when active passage changes
  React.useEffect(() => {
    if (activePassage) {
      setDraftTitle(activePassage.title);
      setDraftContent(activePassage.content);
    }
  }, [activePassage?.id]);

  const handleStartEditing = () => {
    if (!activePassage) return;
    setDraftTitle(activePassage.title);
    setDraftContent(activePassage.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!activePassage) return;
    setSavingPassage(true);
    try {
      await ReadingPassageService.update(activePassage.id, {
        title: draftTitle.trim() || 'Dokkai Matni',
        content: draftContent,
      });
      const updated = {
        ...activePassage,
        title: draftTitle.trim() || 'Dokkai Matni',
        content: draftContent,
      };
      onUpdate(updated);
      setIsEditing(false);
      toast({
        title: '💾 Saqlandi',
        description: 'Dokkai matni muvaffaqiyatli yangilandi.',
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || 'Matnni saqlashda xatolik yuz berdi.',
      });
    } finally {
      setSavingPassage(false);
    }
  };

  const handleCreateNewPassage = async () => {
    if (!examId) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Imtihon ID topilmadi.',
      });
      return;
    }
    const defaultTitle = `Dokkai Matni ${allPassages.length + 1}`;
    const title = prompt('Yangi Dokkai matni uchun sarlavha kiriting:', defaultTitle);
    if (!title) return;

    try {
      const created = await ReadingPassageService.create(examId, {
        title,
        content: '',
        section_id: sectionId ?? null,
        order_index: allPassages.length,
      });
      onUpdate(created);
      setActivePassageId(created.id);
      setIsEditing(true);
      setDraftTitle(created.title);
      setDraftContent('');
      toast({
        title: '✅ Matn Yaratildi',
        description: `"${created.title}" bo'limga qo'shildi.`,
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || 'Yangi matn yaratishda xatolik.',
      });
    }
  };

  const promptDelete = (target: ReadingPassage) => {
    if (!target) return;
    if ((target.linkedQuestionCount || 0) > 0) {
      // Open warning modal with linked questions (Talab 7)
      setDeleteModalPassage(target);
    } else {
      if (confirm(`"${target.title}" matnini o'chirishni tasdiqlaysizmi?`)) {
        performDelete(target.id, false);
      }
    }
  };

  const performDelete = async (passageId: string, unlinkQuestions: boolean, force = false) => {
    setIsDeleting(true);
    try {
      await ReadingPassageService.delete(passageId, { unlinkQuestions, force });
      onDelete(passageId);
      setDeleteModalPassage(null);
      toast({
        title: "🗑️ O'chirildi",
        description: unlinkQuestions
          ? "Matn o'chirildi, savollarning bog'lanishi uzildi."
          : "Matn o'chirildi.",
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || "O'chirishda xatolik yuz berdi.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (allPassages.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/60">
        <FileText className="mx-auto h-8 w-8 text-emerald-500" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Ushbu bo‘limda hali Dokkai matni mavjud emas
        </h4>
        <p className="text-xs text-slate-500">
          O‘qish bo‘limidagi savollar bitta yoki bir nechta matnga biriktiriladi.
        </p>
        {examId && (
          <Button
            size="sm"
            onClick={handleCreateNewPassage}
            className="gap-1.5 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            data-testid="create-reading-passage-btn"
          >
            <Plus className="h-4 w-4" /> + Yangi Dokkai Matni Qo'shish
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
      {/* Passage Selector Tabs (if multiple) & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            📖 Dokkai Matnlari ({allPassages.length})
          </span>

          {allPassages.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {allPassages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePassageId(p.id);
                    setIsEditing(false);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    activePassage?.id === p.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {p.title || `${idx + 1}-matn`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activePassage && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                (activePassage.linkedQuestionCount || 0) > 0
                  ? 'border border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              {activePassage.linkedQuestionCount || 0} ta savol biriktirilgan
            </span>
          )}

          {examId && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateNewPassage}
              className="gap-1 rounded-xl text-xs font-bold"
              title="Yana bitta matn qo'shish"
            >
              <Plus className="h-3.5 w-3.5" /> Yangi Matn
            </Button>
          )}

          {activePassage && (
            <button
              onClick={() => promptDelete(activePassage)}
              className="rounded-xl p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              title="Matnni o'chirish"
              data-testid="delete-passage-btn"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Editing View */}
      {activePassage && (
        <>
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Matn Sarlavhasi
                </label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Dokkai Matni sarlavhasi..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Dokkai Matni (Yaponcha)
                </label>
                <textarea
                  rows={8}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Yaponcha matnni shu yerga yozing yoki nusxalang..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 font-sans text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Bekor
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={savingPassage || isSaving}
                  className="gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  {savingPassage ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Saqlash
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activePassage.title}
                </h5>
                <button
                  onClick={handleStartEditing}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  data-testid="edit-passage-btn"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Matnni tahrirlash
                </button>
              </div>

              <div
                onClick={handleStartEditing}
                className="max-h-60 cursor-pointer overflow-y-auto whitespace-pre-wrap rounded-2xl border border-dashed border-slate-200 bg-white p-4 font-sans text-sm leading-relaxed text-slate-800 transition hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                title="Tahrirlash uchun bosing"
              >
                {activePassage.content || (
                  <span className="text-slate-400">
                    + Hali matn kiritilmagan. Tahrirlash uchun ustiga bosing...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Linked Questions Summary & Toggle */}
          {activePassage.linkedQuestions && activePassage.linkedQuestions.length > 0 && (
            <div className="border-t border-slate-200/80 pt-2 dark:border-slate-700">
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {showQuestions ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                <span>
                  Ushbu matnga biriktirilgan savollar ({activePassage.linkedQuestions.length})
                </span>
              </button>

              {showQuestions && (
                <div className="mt-2 space-y-1.5 pl-4">
                  {activePassage.linkedQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-1.5 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
                    >
                      <span className="font-bold text-emerald-600">{idx + 1}.</span>
                      <span className="truncate">{q.question_text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal (Talab 7: Warning when deleting passage with linked questions) */}
      {deleteModalPassage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/40 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Dokkai matnini o‘chirish
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Ushbu matnga{' '}
                  <span className="font-bold text-rose-600">
                    {deleteModalPassage.linkedQuestionCount} ta savol
                  </span>{' '}
                  biriktirilgan.
                </p>
              </div>
              <button
                onClick={() => setDeleteModalPassage(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {deleteModalPassage.linkedQuestions &&
              deleteModalPassage.linkedQuestions.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                  <p className="mb-1 font-bold text-slate-500">Bog'langan savollar:</p>
                  <ul className="list-inside list-disc space-y-1">
                    {deleteModalPassage.linkedQuestions.map((q) => (
                      <li key={q.id} className="truncate">
                        {q.question_text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <p className="text-xs text-slate-500">Qanday amaliyotni bajarishni xohlaysiz?</p>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => performDelete(deleteModalPassage.id, true)}
                disabled={isDeleting}
                className="justify-center rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-50"
              >
                Bog‘lanishni uzish va faqat matnni o‘chirish (Savollar saqlanadi)
              </Button>

              <Button
                size="sm"
                onClick={() => performDelete(deleteModalPassage.id, false, true)}
                disabled={isDeleting}
                className="justify-center rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
              >
                {isDeleting
                  ? 'O‘chirilmoqda...'
                  : 'Matn va biriktirilgan barcha savollarni o‘chirish'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModalPassage(null)}
                disabled={isDeleting}
                className="justify-center rounded-xl text-xs font-bold"
              >
                Bekor qilish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
