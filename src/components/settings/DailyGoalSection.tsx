import React, { useState } from 'react';
import { useStudyData } from '../../context/StudyPlannerContext';
import { Button } from '../ui/Button';

const DailyGoalSection: React.FC = () => {
  const { settings, updateSettings } = useStudyData();
  const [goalHours, setGoalHours] = useState(
    Math.floor((settings.dailyStudyGoalMinutes || 240) / 60),
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    const clampedHours = Math.max(1, Math.min(24, goalHours || 4));
    setGoalHours(clampedHours);
    const minutes = clampedHours * 60;
    await updateSettings({ dailyStudyGoalMinutes: minutes });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 rounded-[2.5rem] border border-gray-200/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl duration-300 animate-in fade-in dark:border-slate-800/80 dark:bg-[#111827]/80 md:p-8">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-slate-800">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            NAZORAT & MONTIORING
          </span>
          <h3 className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">
            ⏱ Kunlik O'qish Maqsadi
          </h3>
        </div>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 dark:border-indigo-800/50 dark:bg-indigo-900/40 dark:text-indigo-400">
          {goalHours} Soat / Kun
        </span>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-400">
            Kunlik O'qish Vaqti (Soat)
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="24"
              value={goalHours}
              onChange={(e) => setGoalHours(Number(e.target.value))}
              className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-5 py-4 text-lg font-bold text-gray-900 shadow-inner transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
              Soat
            </span>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
            🤖 AI Ustoz ushbu belgilangan maqsadga qarab darslaringizni kuzatib boradi hamda vaqtida
            bajarmasangiz bildirishnoma beradi.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleSave}
            className={`w-full rounded-2xl py-4 text-base font-bold shadow-lg transition-all active:scale-95 ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-emerald-500/25 hover:bg-emerald-700'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500'
            }`}
          >
            {isSaved ? '✅ Maqsad Muvaffaqiyatli Saqlandi!' : "O'zgarishlarni Saqlash"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyGoalSection;
