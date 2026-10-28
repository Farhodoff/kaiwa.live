import React, { useState } from 'react';
import { Cpu, X, Clock, Check } from 'lucide-react';
import { safeLocalStorage } from '../../utils/storage/safeLocalStorage';

interface CoachSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  userEmail?: string;
  onSave?: () => void;
  targetLevel?: string;
  onTargetLevelChange?: (level: string) => void;
  speechSpeed?: number;
  onSpeechSpeedChange?: (speed: number) => void;
  onOpenPitchTrainer?: () => void;
  onToggleFullscreen?: () => void;
}

export const CoachSettingsModal: React.FC<CoachSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  targetLevel = 'N5',
  onTargetLevelChange,
  speechSpeed = 1,
  onSpeechSpeedChange,
  onOpenPitchTrainer,
  onToggleFullscreen,
}) => {
  const [pauseDelay, setPauseDelay] = useState<string>(() => {
    return safeLocalStorage.getItem('speaking_coach_pause_delay') || '2800';
  });

  if (!isOpen) return null;

  const handleSelectDelay = (val: string) => {
    setPauseDelay(val);
    safeLocalStorage.setItem('speaking_coach_pause_delay', val);
  };

  const handleSaveAndClose = () => {
    safeLocalStorage.setItem('speaking_coach_pause_delay', pauseDelay);
    if (onSave) onSave();
    onClose();
  };

  const pauseOptions = [
    { value: '2000', label: '2.0 soniya' },
    { value: '2800', label: '2.8 soniya (Tavsiya)' },
    { value: '3500', label: '3.5 soniya' },
    { value: '4500', label: '4.5 soniya' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xl duration-200 animate-in fade-in">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-gray-200/60 bg-white shadow-2xl duration-200 animate-in zoom-in-95 dark:border-gray-800/60 dark:bg-gray-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent p-5 dark:border-gray-800">
          <h3 className="flex items-center gap-2.5 font-extrabold text-gray-900 dark:text-white">
            <div className="rounded-xl bg-indigo-500/10 p-2">
              <Cpu size={18} className="text-indigo-500" />
            </div>
            Speaking Coach Sozlamalari
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6 text-sm">
          <section className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">JLPT darajasi</h4>
            <div className="grid grid-cols-5 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
              {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onTargetLevelChange?.(level)}
                  className={`min-h-10 rounded-lg text-xs font-bold transition ${
                    targetLevel === level
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-gray-500 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">AI ovoz tezligi</h4>
            <div className="grid grid-cols-3 gap-2">
              {([0.8, 1, 1.2] as const).map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => onSpeechSpeedChange?.(speed)}
                  className={`min-h-10 rounded-xl border text-xs font-semibold transition ${
                    Math.abs(speechSpeed - speed) < 0.05
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </section>

          {/* Pause Delay Setting */}
          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
              <Clock size={14} className="text-primary" />
              Nutq orasidagi pauza vaqti:
            </label>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {pauseOptions.map((opt) => {
                const isSelected = pauseDelay === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectDelay(opt.value)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 font-bold text-primary shadow-xs'
                        : 'border-border bg-card font-medium text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    {isSelected && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {(onOpenPitchTrainer || onToggleFullscreen) && (
            <div className="grid grid-cols-2 gap-2">
              {onOpenPitchTrainer && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPitchTrainer();
                  }}
                  className="min-h-10 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Pitch Accent mashqi
                </button>
              )}
              {onToggleFullscreen && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onToggleFullscreen();
                  }}
                  className="min-h-10 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  To‘liq ekran
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl active:scale-[0.98]"
          >
            Saqlash va Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
