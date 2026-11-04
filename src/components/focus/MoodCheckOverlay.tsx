import React from 'react';
import { MOODS } from './constants';

interface MoodCheckOverlayProps {
  isVisible: boolean;
  checkType: 'before' | 'after' | null;
  onSelect: (value: number) => void;
  onSkip: () => void;
}

const MoodCheckOverlay: React.FC<MoodCheckOverlayProps> = ({
  isVisible,
  checkType,
  onSelect,
  onSkip,
}) => {
  if (!isVisible || !checkType) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl bg-white/90 backdrop-blur-sm animate-in fade-in dark:bg-gray-900/95">
      <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        {checkType === 'before'
          ? "O'zingizni qanday his qilyapsiz?"
          : 'Hozir qanday his qilyapsiz?'}
      </h3>
      <div className="flex gap-4">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => onSelect(m.value)}
            className="flex transform flex-col items-center gap-2 rounded-2xl p-4 transition-all hover:scale-110 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <span className="text-4xl" role="img" aria-label={m.label}>
              {m.emoji}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{m.label}</span>
          </button>
        ))}
      </div>
      <button onClick={onSkip} className="mt-8 text-gray-400">
        O'tkazib yuborish
      </button>
    </div>
  );
};

export default MoodCheckOverlay;
