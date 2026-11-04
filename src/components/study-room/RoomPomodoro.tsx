import React from 'react';
import { RotateCcw, Pause, Play, Sparkles } from 'lucide-react';

interface RoomPomodoroProps {
  pomodoroMode: 'focus' | 'short_break' | 'long_break';
  timeLeft: number;
  isRunning: boolean;
  handleModeChange: (mode: 'focus' | 'short_break' | 'long_break', duration: number) => void;
  handleStart: () => void;
  handlePause: () => void;
  handleReset: (time?: number) => void;
  formatTime: (sec: number) => string;
}

export const RoomPomodoro: React.FC<RoomPomodoroProps> = ({
  pomodoroMode,
  timeLeft,
  isRunning,
  handleModeChange,
  handleStart,
  handlePause,
  handleReset,
  formatTime,
}) => {
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const maxTime =
    pomodoroMode === 'focus' ? 25 * 60 : pomodoroMode === 'short_break' ? 5 * 60 : 15 * 60;
  const strokeDashoffset = circumference - ((maxTime - timeLeft) / maxTime) * circumference;

  return (
    <div className="flex flex-1 flex-col items-center justify-center space-y-8 py-6 duration-300 animate-in fade-in">
      {/* Mode selection */}
      <div className="flex w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-1">
        <button
          onClick={() => handleModeChange('focus', 25)}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${pomodoroMode === 'focus' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Fokus (25)
        </button>
        <button
          onClick={() => handleModeChange('short_break', 5)}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${pomodoroMode === 'short_break' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Tanaffus (5)
        </button>
        <button
          onClick={() => handleModeChange('long_break', 15)}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${pomodoroMode === 'long_break' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Uzoq (15)
        </button>
      </div>

      {/* Circular Timer Display */}
      <div className="relative flex h-56 w-56 items-center justify-center">
        <svg className="h-full w-full -rotate-90 transform">
          {/* Background Circle */}
          <circle
            cx="112"
            cy="112"
            r={radius}
            className="fill-none stroke-slate-800"
            strokeWidth="8"
          />
          {/* Progress Circle */}
          <circle
            cx="112"
            cy="112"
            r={radius}
            className={`fill-none transition-all duration-1000 ${
              pomodoroMode === 'focus'
                ? 'stroke-indigo-500'
                : pomodoroMode === 'short_break'
                  ? 'stroke-green-500'
                  : 'stroke-cyan-500'
            }`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Text display */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-mono text-4xl font-black tracking-tight text-white">
            {formatTime(timeLeft)}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <Sparkles size={10} className="text-indigo-400" />
            {pomodoroMode === 'focus' ? 'Fokus rejim' : 'Tanaffus'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={() =>
            handleReset(
              pomodoroMode === 'focus'
                ? 25 * 60
                : pomodoroMode === 'short_break'
                  ? 5 * 60
                  : 15 * 60,
            )
          }
          className="bg-slate-850 rounded-2xl border border-slate-700/60 p-4 text-slate-400 transition-all hover:bg-slate-800 hover:text-white active:scale-90"
          title="Qayta boshlash"
        >
          <RotateCcw size={22} />
        </button>
        {isRunning ? (
          <button
            onClick={handlePause}
            className="shadow-red-650/20 flex items-center justify-center rounded-[2rem] bg-red-600 p-6 text-white shadow-lg transition-all hover:bg-red-700 active:scale-95"
          >
            <Pause size={30} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleStart}
            className={`flex items-center justify-center rounded-[2rem] p-6 text-white shadow-lg transition-all active:scale-95 ${
              pomodoroMode === 'focus'
                ? 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700'
                : 'bg-green-600 shadow-green-600/20 hover:bg-green-700'
            }`}
          >
            <Play size={30} fill="currentColor" className="ml-1" />
          </button>
        )}
        <div className="w-14" /> {/* Spacer to align reset button */}
      </div>
    </div>
  );
};
