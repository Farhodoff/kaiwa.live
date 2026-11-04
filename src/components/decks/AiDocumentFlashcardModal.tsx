import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Upload, Check, Loader2, BookOpen, HelpCircle, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { useStudyData } from '../../context/StudyPlannerContext';
import { Subject } from '../../types';
import { callSelectedAIProvider } from '../../utils/ai/aiCore';
import { toast } from '../../hooks/use-toast';

interface AiDocumentFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
}

type GeneratorMode = 'vocab' | 'qa' | 'quiz';

interface GeneratedCard {
  front: string;
  back: string;
  type?: string;
  selected: boolean;
}

export const AiDocumentFlashcardModal: React.FC<AiDocumentFlashcardModalProps> = ({
  isOpen,
  onClose,
  subjects,
}) => {
  const { addFlashcardsBatch } = useStudyData();
  const [rawText, setRawText] = useState('');
  const [mode, setMode] = useState<GeneratorMode>('qa');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        toast({
          title: '📄 Fayl yuklandi',
          description: `${file.name} matni muvaffaqiyatli olindi.`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!rawText.trim() || isLoading) return;

    setIsLoading(true);
    setCards([]);

    const promptByMode = {
      vocab: `Quyidagi o'quv materialidan eng muhim so'zlar va atamalarni ajratib, JSON formatida taqdim et.
Format:
[
  {"front": "Term / So'z", "back": "Ta'rif, tarjima va misol"}
]
Faqat toza JSON array qaytar, hech qanday markdown belgilari (masalan \`\`\`json) qo'shma.`,
      qa: `Quyidagi o'quv materialidan imtihon va darslar uchun eng muhim tushunchalar bo'yicha Savol-Javob (Q&A) fleshkartalari tuz.
Format:
[
  {"front": "Savol yoki asosiy tushuncha?", "back": "Aniq va lo'nda javob / tushuntirish"}
]
Faqat toza JSON array qaytar, hech qanday markdown belgilari qo'shma.`,
      quiz: `Quyidagi o'quv materialidan ko'p variantli test / viktorina fleshkartalarini tuz.
Format:
[
  {"front": "Savol?\nA) Variant\nB) Variant\nC) Variant", "back": "To'g'ri javob: B) ... (Tushuntirish bilan)"}
]
Faqat toza JSON array qaytar, hech qanday markdown belgilari qo'shma.`,
    };

    const systemPrompt = `Sen professional o'quv metodisti va fleshkarta mutaxassisisan. Berilgan matndan o'quvchiga darsni tez va sifatli o'rganishiga yordam beruvchi eng sara fleshkartalarni tuzasan.`;
    const userPrompt = `${promptByMode[mode]}\n\nO'quv materiali:\n${rawText.slice(0, 8000)}`;

    try {
      const response = await callSelectedAIProvider(userPrompt, systemPrompt, true);

      const cleanJson = response
        .trim()
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        setCards(
          parsed.map((item: any) => ({
            front: item.front || item.question || item.term || '',
            back: item.back || item.answer || item.definition || '',
            type: mode,
            selected: true,
          })),
        );
      } else {
        throw new Error("Noto'g'ri format qaytdi");
      }
    } catch (err) {
      console.error('AI Flashcard Generation Error:', err);
      toast({
        title: 'Xatolik yuz berdi',
        description:
          "Fleshkartalarni tuzishda xatolik yuz berdi. Matnni qisqartirib qayta urinib ko'ring.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSelected = () => {
    if (!selectedSubjectId) {
      toast({
        title: 'Fan tanlanmagan',
        description: 'Iltimos, fleshkartalar uchun fanni tanlang.',
        variant: 'destructive',
      });
      return;
    }

    const selectedCards = cards.filter((c) => c.selected);
    if (selectedCards.length === 0) return;

    const newFlashcards = selectedCards.map((c) => ({
      subjectId: selectedSubjectId,
      front: c.front,
      back: c.back,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
    }));

    addFlashcardsBatch(newFlashcards);
    toast({
      title: '🎉 Muvaffaqiyatli saqlandi!',
      description: `${newFlashcards.length} ta yangi fleshkarta fanga qo'shildi.`,
    });
    onClose();
  };

  const toggleCard = (index: number) => {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                AI Hujjat & Konspektdan Fleshkarta Generator
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Matn, leksiya yoki konspektdan 1 soniyada professional fleshkartalar yarating
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Mode Selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Generatsiya Formati:
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode('qa')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  mode === 'qa'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                }`}
              >
                <HelpCircle className="h-4 w-4 text-indigo-500" />
                <span>Savol-Javob (Q&A)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('vocab')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  mode === 'vocab'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                }`}
              >
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <span>Lug'at & Atamalar</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('quiz')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  mode === 'quiz'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                }`}
              >
                <Layers className="h-4 w-4 text-indigo-500" />
                <span>Viktorina & Test</span>
              </button>
            </div>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Fleshkartalar Qo'shiladigan Fan:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Raw Text Input with File Upload Button */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                O'quv Materiali yoki Konspekt Matni:
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Fayl yuklash (.txt, .md)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Darslik konspekti, maqola yoki istalgan o'quv materialini bu yerga joylashtiring..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Generate Action */}
          <Button
            onClick={handleGenerate}
            disabled={!rawText.trim() || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI tahlil qilmoqda va fleshkartalar tuzmoqda...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Fleshkartalarni Generatsiya Qilish</span>
              </>
            )}
          </Button>

          {/* Results List */}
          {cards.length > 0 && (
            <div className="space-y-3 border-t border-gray-100 pt-3 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Yaratilgan Fleshkartalar ({cards.filter((c) => c.selected).length}/{cards.length})
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCards((prev) => prev.map((c) => ({ ...c, selected: true })))}
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Hammasini tanlash
                  </button>
                </div>
              </div>

              <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleCard(idx)}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                      card.selected
                        ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-900/20'
                        : 'border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800/50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        card.selected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-gray-400 bg-white dark:bg-gray-900'
                      }`}
                    >
                      {card.selected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 space-y-1 text-xs">
                      <p className="font-semibold text-gray-900 dark:text-white">{card.front}</p>
                      <p className="text-gray-600 dark:text-gray-400">{card.back}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cards.length > 0 && (
          <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <Button variant="secondary" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleSaveSelected}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Check className="mr-1.5 h-4 w-4" />
              {cards.filter((c) => c.selected).length} ta Fleshkartani Saqlash
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
