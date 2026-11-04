import { Bot, Loader2, Save, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useStudyData } from '../context/StudyPlannerContext';
import { generateFlashcardsWithAI, parseAIError } from '../utils/ai';
import { toast } from '../hooks/use-toast';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId?: string; // Optional now
}

const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  subjectId: propSubjectId,
}) => {
  const { importFlashcards, subjects, addSubject } = useStudyData();
  const [topic, setTopic] = useState('');
  const [subjectId, setSubjectId] = useState(propSubjectId || '');
  const [count, setCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<{ front: string; back: string }[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    if (!subjectId) {
      toast({
        variant: 'destructive',
        title: 'Fan tanlanmagan',
        description: 'Iltimos, avval fanni tanlang!',
      });
      return;
    }
    setIsLoading(true);
    try {
      const cards = await generateFlashcardsWithAI(topic, count);
      setGeneratedCards(cards);
      setStep('preview');
    } catch (error: any) {
      console.error('Error generating flashcards:', error);
      const friendlyError = parseAIError(error);
      toast({ variant: 'destructive', title: 'Xatolik', description: friendlyError });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    let targetSubjectId = subjectId || propSubjectId;

    // Auto-resolve subject if not selected
    if (!targetSubjectId) {
      const firstActiveSub = subjects.find((s) => !s.isArchived);
      if (firstActiveSub) {
        targetSubjectId = firstActiveSub.id;
      } else {
        const newSub = await addSubject({
          name: 'AI Fleshkartalar',
          color: '#6366f1',
          icon: 'Sparkles',
          isArchived: false,
        });
        targetSubjectId = newSub?.id;
      }
    }

    if (!targetSubjectId) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Iltimos, avval fanni tanlang!',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Use bulk import with chunking and optimistic local update
      const success = await importFlashcards(targetSubjectId, generatedCards);

      if (!success) {
        throw new Error('Failed to bulk save flashcards');
      }

      toast({
        title: '🧠 Fleshkartalar Saqlandi',
        description: `${generatedCards.length} ta karta muvaffaqiyatli saqlandi!`,
      });

      onClose();
      setTopic('');
      setGeneratedCards([]);
      setStep('input');
    } catch (error) {
      console.error('Failed to save flashcards:', error);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: "Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#1f2937]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-700">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles size={24} />
            <h2 className="text-xl font-bold">AI Fleshkarta Sehrgari</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {step === 'input' ? (
            <div className="space-y-6">
              {!propSubjectId && (
                <div>
                  <label
                    htmlFor="subject-select"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Fan
                  </label>
                  <select
                    id="subject-select"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">-- Fanni Tanlang --</option>
                    {subjects
                      .filter((s) => !s.isArchived)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="topic-input"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mavzu yoki Matn:
                </label>
                <textarea
                  id="topic-input"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Mavzu nomini yozing (masalan: 'Python Asoslari') yoki o'quv materialini shu yerga nusxalab qo'ying..."
                  className="h-32 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-2 text-xs text-gray-500">
                  AI siz kiritgan matndan yoki mavzudan avtomatik savol-javob yaratadi.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label
                  htmlFor="count-select"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Kartalar soni:
                </label>
                <select
                  id="count-select"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="rounded-lg border-none bg-gray-50 px-3 py-2 outline-none dark:bg-gray-800"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isLoading || !topic.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 py-4 text-lg hover:from-indigo-600 hover:to-purple-700"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" /> Yaratilmoqda...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Bot /> AI bilan Yaratish
                  </span>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex h-[60vh] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {generatedCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-2">
                      <span className="text-xs font-bold uppercase text-gray-400">Savol</span>
                      <p className="font-medium text-gray-900 dark:text-white">{card.front}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase text-gray-400">Javob</span>
                      <p className="text-gray-600 dark:text-gray-300">{card.back}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-4 border-t border-gray-100 pt-6 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => setStep('input')}
                  className="flex-1"
                  disabled={isSaving}
                >
                  Orqaga
                </Button>
                <Button onClick={handleSaveAll} className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" /> Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" /> Kartalarni Saqlash
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGeneratorModal;
