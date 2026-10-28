import React, { useState } from 'react';
import { Headphones, Trash2, Plus, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { AudioUploadPreview } from './AudioUploadPreview';
import { ListeningAudioService, type ListeningAudio } from '../../services/ListeningAudioService';
import { toast } from '../../hooks/use-toast';

interface ListeningAudioEditorProps {
  audio?: ListeningAudio | null;
  audios?: ListeningAudio[];
  sectionId?: string;
  examId?: string;
  onUpdate: (audio: ListeningAudio) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
  isUploading?: boolean;
}

export const ListeningAudioEditor: React.FC<ListeningAudioEditorProps> = ({
  audio,
  audios,
  sectionId,
  examId,
  onUpdate,
  onDelete,
  onRefresh,
  isUploading = false,
}) => {
  const allAudios = audios && audios.length > 0 ? audios : audio ? [audio] : [];

  const [activeAudioId, setActiveAudioId] = useState<string | null>(allAudios[0]?.id || null);
  const activeAudio = allAudios.find((a) => a.id === activeAudioId) || allAudios[0] || null;

  const [isSaving, setIsSaving] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  // Delete modal state (Talab 7)
  const [deleteModalAudio, setDeleteModalAudio] = useState<ListeningAudio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateNewAudio = async () => {
    if (!examId) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Imtihon ID topilmadi.',
      });
      return;
    }
    const defaultTitle = `Choukai Audio ${allAudios.length + 1}`;
    const title = prompt('Yangi Audio uchun sarlavha kiriting:', defaultTitle);
    if (!title) return;

    try {
      const created = await ListeningAudioService.create(examId, {
        title,
        section_id: sectionId ?? null,
        order_index: allAudios.length,
      });
      onUpdate(created);
      setActiveAudioId(created.id);
      toast({
        title: '✅ Audio Yaratildi',
        description: `"${created.title}" ro'yxatga qo'shildi. Endi unga MP3/WAV fayl yuklashingiz mumkin.`,
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || 'Yangi audio yaratishda xatolik yuz berdi.',
      });
    }
  };

  const handleUpdateActiveAudio = async (updates: Partial<ListeningAudio>) => {
    if (!activeAudio) return;
    const merged = { ...activeAudio, ...updates };
    onUpdate(merged);

    // Persist text changes to database
    try {
      setIsSaving(true);
      await ListeningAudioService.update(activeAudio.id, {
        title: merged.title,
        transcript: merged.transcript ?? undefined,
        uz_translation: merged.uz_translation ?? undefined,
        speaker: merged.speaker ?? undefined,
        duration_seconds: merged.duration_seconds ?? undefined,
      });
    } catch (err: any) {
      console.warn('Auto-save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!activeAudio) return;
    try {
      const updated = await ListeningAudioService.uploadAndAttach(activeAudio.id, file);
      onUpdate(updated);
      toast({
        title: '✅ Audio Yuklandi',
        description: `Fayl muvaffaqiyatli saqlandi. Davomiylik: ${updated.duration_seconds || 0} soniya.`,
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Yuklashda Xatolik',
        description: err?.message || 'Audio yuklashda xatolik yuz berdi.',
      });
    }
  };

  const promptDelete = (target: ListeningAudio) => {
    if (!target) return;
    if ((target.linkedQuestionCount || 0) > 0) {
      setDeleteModalAudio(target);
    } else {
      if (confirm(`"${target.title}" audiosini o'chirishni xohlaysizmi?`)) {
        performDelete(target.id, false);
      }
    }
  };

  const performDelete = async (audioId: string, unlinkQuestions: boolean, force = false) => {
    setIsDeleting(true);
    try {
      await ListeningAudioService.delete(audioId, { unlinkQuestions, force });
      onDelete(audioId);
      setDeleteModalAudio(null);
      toast({
        title: "🗑️ O'chirildi",
        description: unlinkQuestions
          ? "Audio o'chirildi, unga bog'langan savollar saqlab qolindi."
          : "Audio fayl o'chirildi.",
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: "O'chirishda Xatolik",
        description: err?.message || 'Xatolik yuz berdi.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (allAudios.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/60">
        <Headphones className="mx-auto h-8 w-8 text-blue-500" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Ushbu bo‘limda hali Choukai audiosi mavjud emas
        </h4>
        <p className="text-xs text-slate-500">
          Tinglash bo‘limidagi savollar bitta yoki bir nechta audio faylga biriktiriladi.
        </p>
        {examId && (
          <Button
            size="sm"
            onClick={handleCreateNewAudio}
            className="gap-1.5 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
            data-testid="create-listening-audio-btn"
          >
            <Plus className="h-4 w-4" /> + Yangi Choukai Audio Qo'shish
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
      {/* Audio Selector Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <Headphones className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            🎧 Choukai Audio ({allAudios.length})
          </span>

          {allAudios.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {allAudios.map((a, idx) => (
                <button
                  key={a.id}
                  onClick={() => setActiveAudioId(a.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    activeAudio?.id === a.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {a.title || `${idx + 1}-audio`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-[10px] font-semibold text-slate-400">Saqlanmoqda...</span>
          )}
          {activeAudio && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                (activeAudio.linkedQuestionCount || 0) > 0
                  ? 'border border-blue-500/20 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              {activeAudio.linkedQuestionCount || 0} ta savol biriktirilgan
            </span>
          )}

          {examId && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateNewAudio}
              className="gap-1 rounded-xl text-xs font-bold"
              title="Yana bitta audio qo'shish"
            >
              <Plus className="h-3.5 w-3.5" /> Yangi Audio
            </Button>
          )}

          {activeAudio && (
            <button
              onClick={() => promptDelete(activeAudio)}
              className="rounded-xl p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              title="Audioni o'chirish"
              data-testid="delete-audio-btn"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Audio Preview & Upload Controller */}
      {activeAudio && (
        <>
          <AudioUploadPreview
            audio={activeAudio}
            onChange={handleUpdateActiveAudio}
            onUpload={handleUploadFile}
            onRemoveAudio={() => promptDelete(activeAudio)}
            isUploading={isUploading}
          />

          {/* Linked Questions Accordion */}
          {activeAudio.linkedQuestions && activeAudio.linkedQuestions.length > 0 && (
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
                  Ushbu audioga biriktirilgan savollar ({activeAudio.linkedQuestions.length})
                </span>
              </button>

              {showQuestions && (
                <div className="mt-2 space-y-1.5 pl-4">
                  {activeAudio.linkedQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-1.5 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
                    >
                      <span className="font-bold text-blue-600">{idx + 1}.</span>
                      <span className="truncate">{q.question_text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal (Talab 7: Warning when deleting audio with linked questions) */}
      {deleteModalAudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/40 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Audio faylni o‘chirish
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Ushbu audio bilan{' '}
                  <span className="font-bold text-rose-600">
                    {deleteModalAudio.linkedQuestionCount} ta savol
                  </span>{' '}
                  biriktirilgan.
                </p>
              </div>
              <button
                onClick={() => setDeleteModalAudio(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {deleteModalAudio.linkedQuestions && deleteModalAudio.linkedQuestions.length > 0 && (
              <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                <p className="mb-1 font-bold text-slate-500">Bog'langan savollar:</p>
                <ul className="list-inside list-disc space-y-1">
                  {deleteModalAudio.linkedQuestions.map((q) => (
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
                onClick={() => performDelete(deleteModalAudio.id, true)}
                disabled={isDeleting}
                className="justify-center rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-50"
              >
                Bog‘lanishni uzish va audioni o‘chirish (Savollar saqlanadi)
              </Button>

              <Button
                size="sm"
                onClick={() => performDelete(deleteModalAudio.id, false, true)}
                disabled={isDeleting}
                className="justify-center rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
              >
                {isDeleting
                  ? 'O‘chirilmoqda...'
                  : 'Audio va biriktirilgan barcha savollarni o‘chirish'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModalAudio(null)}
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
