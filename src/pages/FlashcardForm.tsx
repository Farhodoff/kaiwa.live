import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useStudyData } from '../context/StudyPlannerContext';
import { toast } from '../hooks/use-toast';

const FlashcardForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultSubjectId = searchParams.get('subjectId') || '';

  const [isCreatingNewSub, setIsCreatingNewSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState('#8b5cf6');

  const { addFlashcard, addSubject, subjects } = useStudyData();

  const handleCreateSubjectInline = async () => {
    if (!newSubName.trim()) return;
    const created = await addSubject({
      name: newSubName.trim(),
      color: newSubColor,
      schedule: [],
    });
    if (created && created.id) {
      setSubjectId(created.id);
      setIsCreatingNewSub(false);
      setNewSubName('');
    }
  };

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front || !back || isSubmitting) return;

    const targetSubId = subjectId || subjects.find((s) => !s.isArchived)?.id || '';

    setIsSubmitting(true);
    try {
      await addFlashcard({
        subjectId: targetSubId,
        front,
        back,
      });
      toast({
        title: 'Fleshkarta Saqlandi',
        description: 'Yangi fleshkarta muvaffaqiyatli saqlandi!',
      });
      navigate('/flashcards');
    } catch (error) {
      console.error('Failed to add flashcard:', error);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: "Fleshkarta saqlashda xatolik yuz berdi. Qayta urinib ko'ring.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate('/flashcards')}
          className="rounded-lg p-2 transition-colors hover:bg-muted"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <h2 className="text-2xl font-bold text-foreground">Yangi Fleshkarta</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-border bg-card p-8 shadow-xl"
      >
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-bold text-foreground">Fan</label>
            <button
              type="button"
              onClick={() => setIsCreatingNewSub(!isCreatingNewSub)}
              className="text-xs font-bold text-primary hover:underline"
            >
              + Yangi Fan Yaratish
            </button>
          </div>

          {isCreatingNewSub ? (
            <div className="mb-2 space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <input
                type="text"
                placeholder="Fan nomi (masalan, Yapon tili)..."
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="outline-hidden w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {['#E8483A', '#C9A961', '#10b981', '#3b82f6', '#8b5cf6'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSubColor(c)}
                      className={`h-6 w-6 rounded-full transition-transform ${newSubColor === c ? 'scale-125 ring-2 ring-primary' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewSub(false)}
                    className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSubjectInline}
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="focus:outline-hidden w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground focus:ring-2 focus:ring-primary"
            >
              <option value="">Avtomatik Fan (yoki tanlang)</option>
              {subjects
                .filter((s) => !s.isArchived)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-foreground">
            Old tomoni (Savol / Ie / So'z)
          </label>
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="focus:outline-hidden h-32 w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            placeholder="masalan, ありがとう (Arigatou)"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-foreground">
            Orqa tomoni (Javob / Ma'nosi)
          </label>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            className="focus:outline-hidden h-32 w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            placeholder="masalan, Rahmat, tashakkur"
            required
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-md hover:bg-primary/90"
          >
            Fleshkarta Yaratish
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FlashcardForm;
