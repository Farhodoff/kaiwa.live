import React from 'react';
import { Edit3, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { ReadingPassageService, type ReadingPassage } from '../../services/ReadingPassageService';

interface ReadingPassageEditorProps {
  passage: ReadingPassage | null;
  onUpdate: (passage: ReadingPassage) => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
}

export const ReadingPassageEditor: React.FC<ReadingPassageEditorProps> = ({
  passage,
  onUpdate,
  onDelete,
  isSaving = false,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(passage?.content ?? '');

  const handleSave = async () => {
    if (!passage) return;
    try {
      await ReadingPassageService.update(passage.id, { content: draft });
      setEditing(false);
      onUpdate({ ...passage, content: draft });
    } catch (err: any) {
      // eslint-disable-next-line no-alert
      alert(err?.message || 'Matnni saqlashda xatolik.');
    }
  };

  const handleDelete = () => {
    if (!passage) return;
    if (
      !confirm(
        `Bu matnni o'chirishni xohlaysizmi? Uga ${passage.linkedQuestionCount || 0} ta savol biriktirilgan.`,
      )
    )
      return;
    onDelete(passage.id);
  };

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            📖 Dokkai Matni (Reading Passage)
          </span>
        </div>
        {passage?.linkedQuestionCount && passage.linkedQuestionCount > 0 && (
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/20">
            {passage.linkedQuestionCount} ta savol
          </span>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            rows={7}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Dokkai matnini shu yerga yozing..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 font-sans text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setDraft(passage?.content ?? '');
              }}
              className="rounded-xl"
            >
              Bekor
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-indigo-600 font-bold text-white"
            >
              {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="max-h-48 cursor-pointer overflow-y-auto rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 transition hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            {passage?.content || '+ Matn kiritilmagan. Tahrirlash uchun ustiga bosing...'}
          </div>
          <button
            onClick={() => {
              setEditing(true);
              setDraft(passage?.content ?? '');
            }}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <Edit3 className="h-3.5 w-3.5" /> Tahrirlash
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            title="Matnni o'chirish"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
