import { Check } from 'lucide-react';
import React, { useState } from 'react';
import { useStudyData } from '../context/StudyPlannerContext';
import { useFocusTimerContext } from '../context/FocusTimerContext';
import { Button } from './ui/Button';

const MOODS = [
  { value: 1, label: 'Stressed', emoji: '😫' },
  { value: 2, label: 'Tired', emoji: '😕' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '🤩' },
];

export const SessionCompleteModal: React.FC = () => {
  const { addSession, awardXP } = useStudyData();
  const { focusState, resetTimer } = useFocusTimerContext();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  if (!focusState.isSessionCompleted || focusState.mode !== 'focus') return null;

  const handleSave = () => {
    addSession({
      subjectId: focusState.selectedSubjectId || undefined,
      startTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 daqiqa oldin boshlangan
      duration: 25,
      type: 'focus',
      completed: true,
      moodAfter: selectedMood || 3, // Default to Okay
    });
    awardXP(250);
    resetTimer();
    setSelectedMood(null);
  };

  const handleSkip = () => {
    resetTimer();
    setSelectedMood(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md scale-100 rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in-95 dark:bg-gray-800">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Tabriklaymiz!</h2>
          <p className="text-gray-500 dark:text-gray-400">
            25 daqiqalik fokus sessiyasi yakunlandi. Hozir o'zingizni qanday his qilyapsiz?
          </p>
        </div>

        <div className="mb-8 grid grid-cols-5 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMood(m.value)}
              className={`flex flex-col items-center gap-2 rounded-xl p-2 transition-all ${selectedMood === m.value ? 'scale-110 transform bg-indigo-100 ring-2 ring-indigo-500 dark:bg-indigo-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <span className="text-3xl" role="img" aria-label={m.label}>
                {m.emoji}
              </span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {m.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <Button variant="secondary" onClick={handleSkip} className="flex-1">
            O'tkazib yuborish
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={!selectedMood}
          >
            Saqlash (+250 XP)
          </Button>
        </div>
      </div>
    </div>
  );
};
