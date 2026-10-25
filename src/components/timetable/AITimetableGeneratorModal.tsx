import React, { useState } from 'react';
import { X, Sparkles, Calendar, Check, Plus } from 'lucide-react';
import { generateAITimetable, AITimetableScheduleItem } from '../../utils/ai';
import { useStudyData } from '../../context/StudyPlannerContext';

interface AITimetableGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AITimetableGeneratorModal: React.FC<AITimetableGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addEvent, addTask } = useStudyData();
  const [goalDescription, setGoalDescription] = useState('');
  const [dailyHours, setDailyHours] = useState(3);
  const [daysCount, setDaysCount] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<AITimetableScheduleItem[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const PRESET_GOALS = [
    {
      label: "🎌 JLPT N5 Boshlang'ich",
      text: "JLPT N5 imtihoniga tayyorgarlik: Hiragana, Katakana va boshlang'ich lug'at",
      hours: 1,
      days: 7,
    },
    {
      label: "🎌 JLPT N3 O'rta Reja",
      text: "JLPT N3 imtihoniga tayyorgarlik: Kanji, Dokkai va o'rta daraja grammatika",
      hours: 2,
      days: 14,
    },
    {
      label: '🎌 JLPT N2 Rejasi',
      text: 'JLPT N2 imtihoniga tayyorgarlik: Kanji, Dokkai va Kaiwa mashqlari',
      hours: 3,
      days: 14,
    },
    {
      label: '🎌 JLPT N1 Intensiv',
      text: 'JLPT N1 imtihoniga tayyorgarlik: Kengaytirilgan kanji, murakkab matnlar va listening',
      hours: 4,
      days: 14,
    },
  ];

  const handleGenerate = async () => {
    if (!goalDescription.trim()) return;
    setIsLoading(true);
    setIsSuccess(false);
    const items = await generateAITimetable(goalDescription, dailyHours, daysCount);
    setScheduleItems(items);
    setIsLoading(false);
  };

  const handleImportEvents = async () => {
    for (const item of scheduleItems) {
      // Add as Calendar Event
      await addEvent({
        title: item.title,
        description: item.description,
        eventDate: `${item.date}T${item.startTime}:00`,
        eventType: 'personal',
        notifyBeforeMinutes: 15,
        repetitionType: 'none',
      });

      // Also Add as kaiwa.live Task
      await addTask({
        title: item.title,
        dueDate: item.date,
        priority: 'medium',
        status: 'todo',
      });
    }
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
      setScheduleItems([]);
      setIsSuccess(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md duration-200 animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-500/20 p-3 text-indigo-600 dark:text-indigo-400">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Aqlli Dars Jadvali Generator
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sun'iy intellekt yordamida imtihon va maqsadlaringizga mos jadval tuzish
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {scheduleItems.length === 0 ? (
            <>
              {/* Preset Goals */}
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  ⚡ Tayyor Imtihon Rejalari:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_GOALS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setGoalDescription(p.text);
                        setDailyHours(p.hours);
                        setDaysCount(p.days);
                      }}
                      className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-extrabold text-indigo-600 transition-all hover:bg-indigo-500/20 active:scale-95 dark:text-indigo-300"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  O'quv maqsadingiz (nima uchun tayyorlanmoqchisiz?)
                </label>
                <textarea
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Masalan: 3 oydan keyin JLPT N3 topshiraman, Kanji va Grammatika bo'yicha intensiv tayyorgarlik kerak..."
                  rows={3}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Kunlik tayyorgarlik vaqti (soat)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Necha kunlik reja tuzilsin?
                  </label>
                  <select
                    value={daysCount}
                    onChange={(e) => setDaysCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value={7}>1 Hafta (7 kun)</option>
                    <option value={14}>2 Hafta (14 kun)</option>
                    <option value={30}>1 Oy (30 kun)</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <Calendar size={16} className="text-indigo-500" />
                  Tuzilgan Jadval ({scheduleItems.length} ta mashg'ulot)
                </h4>
                <button
                  onClick={() => setScheduleItems([])}
                  className="text-xs font-medium text-indigo-500 hover:underline"
                >
                  Qayta tuzish
                </button>
              </div>

              <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
                {scheduleItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200/60 bg-gray-50 p-3.5 text-sm dark:border-gray-700/60 dark:bg-gray-800/80"
                  >
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-right font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      <div>📅 {item.date}</div>
                      <div>
                        ⏰ {item.startTime} ({item.durationMinutes}m)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/80">
          {scheduleItems.length === 0 ? (
            <button
              disabled={isLoading || !goalDescription.trim()}
              onClick={handleGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  AI Jadval Tuzmoqda...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  AI Jadval Yaratish
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleImportEvents}
              disabled={isSuccess}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700"
            >
              {isSuccess ? (
                <>
                  <Check size={18} />
                  Jadval Kalendarga Qo'shildi! ✅
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Jadvalni Kalendarga Saqlash
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITimetableGeneratorModal;
