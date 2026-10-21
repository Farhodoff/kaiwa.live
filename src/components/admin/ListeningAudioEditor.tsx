import React, { useState } from 'react';
import { Headphones, Edit3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { AudioUploadPreview } from './AudioUploadPreview';
import { ListeningAudioService, type ListeningAudio } from '../../services/ListeningAudioService';
import { toast } from '../../hooks/use-toast';

interface ListeningAudioEditorProps {
  audio: ListeningAudio | null;
  onUpdate: (audio: ListeningAudio) => void;
  onDelete: (id: string) => void;
  isUploading?: boolean;
}

export const ListeningAudioEditor: React.FC<ListeningAudioEditorProps> = ({
  audio,
  onUpdate,
  onDelete,
  isUploading = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<ListeningAudio>>({
    title: audio?.title ?? '',
    transcript: audio?.transcript ?? '',
    uz_translation: audio?.uz_translation ?? '',
    speaker: audio?.speaker ?? '',
  });

  const handleSave = async () => {
    if (!audio) return;
    try {
      await ListeningAudioService.update(audio.id, {
        title: draft.title ?? '',
        transcript: draft.transcript ?? '',
        uz_translation: draft.uz_translation ?? '',
        speaker: draft.speaker ?? '',
      });
      setEditing(false);
      onUpdate({ ...audio, ...draft });
      toast({ title: 'Saqlandi', description: 'Audio ma\u2019lumotlari yangilandi.' });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || 'Audio ma\u2019lumotlarini saqlashda xatolik.',
      });
    }
  };

  const handleDelete = async () => {
    if (!audio) return;
    if (
      !confirm(
        `Bu audio faylni o'chirishni xohlaysizmi? Uga ${audio.linkedQuestionCount || 0} ta savol biriktirilgan.`,
      )
    )
      return;
    try {
      await ListeningAudioService.delete(audio.id);
      onDelete(audio.id);
      toast({ title: "O'chirildi", description: "Audio fayl o'chirildi." });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: "O'chirib bo'lmadi",
        description: err?.message || 'Xatolik yuz berdi.',
      });
    }
  };

  const formatDuration = (sec: number | null) => {
    if (!sec) return '-';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            🎧 Audio (MP3 / WAV)
          </span>
        </div>
        {audio?.linkedQuestionCount && audio.linkedQuestionCount > 0 && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/20">
            {audio.linkedQuestionCount} ta savol
          </span>
        )}
      </div>

      <AudioUploadPreview
        audio={audio}
        onChange={(updates) => setDraft({ ...draft, ...updates })}
        onUpload={(file) => {
          if (!audio) return;
          ListeningAudioService.uploadAndAttach(audio.id, file)
            .then((updated) => {
              onUpdate({ ...audio, ...updated });
              setDraft({ ...draft, ...updated });
            })
            .catch((err) => {
              toast({
                variant: 'destructive',
                title: 'Xatolik',
                description: err?.message || 'Audio yuklashda xatolik.',
              });
            });
        }}
        onRemoveAudio={() => handleDelete()}
        isUploading={isUploading}
      />

      {editing ? (
        <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-2 dark:border-slate-700/50 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Sarlavha</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Transkript
            </label>
            <textarea
              rows={2}
              value={draft.transcript ?? ''}
              onChange={(e) => setDraft({ ...draft, transcript: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Oʻzbekcha tarjima
            </label>
            <input
              value={draft.uz_translation ?? ''}
              onChange={(e) => setDraft({ ...draft, uz_translation: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Suvor</label>
            <input
              value={draft.speaker ?? ''}
              onChange={(e) => setDraft({ ...draft, speaker: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="col-span-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setDraft({
                  title: audio?.title ?? '',
                  transcript: audio?.transcript ?? '',
                  uz_translation: audio?.uz_translation ?? '',
                  speaker: audio?.speaker ?? '',
                });
              }}
              className="rounded-xl"
            >
              Bekor
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="rounded-xl bg-indigo-600 font-bold text-white"
            >
              Saqlash
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">
            {audio?.audio_url
              ? `Davomiylik: ${formatDuration(audio.duration_seconds)}`
              : 'Audio hali yuklanmagan.'}
          </div>
          <button
            onClick={() => {
              setEditing(true);
              setDraft({
                title: audio?.title ?? '',
                transcript: audio?.transcript ?? '',
                uz_translation: audio?.uz_translation ?? '',
                speaker: audio?.speaker ?? '',
              });
            }}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <Edit3 className="h-3.5 w-3.5" /> Tahrirlash
          </button>
        </div>
      )}
    </div>
  );
};
