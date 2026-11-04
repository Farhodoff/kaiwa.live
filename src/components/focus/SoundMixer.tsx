import React from 'react';
import { Bell, Music, Volume2, VolumeX } from 'lucide-react';
import { SOUNDS } from './constants';

interface SoundMixerProps {
  selectedSound: string;
  isMuted: boolean;
  isDisabled: boolean;
  onSoundChange: (id: string) => void;
  onMuteToggle: () => void;
  onTestSound: () => void;
}

const SoundMixer: React.FC<SoundMixerProps> = ({
  selectedSound,
  isMuted,
  isDisabled,
  onSoundChange,
  onMuteToggle,
  onTestSound,
}) => {
  return (
    <div className="mb-8 flex items-center justify-center gap-4 rounded-xl border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <Music size={18} className="text-indigo-500" />
      <select
        value={selectedSound}
        onChange={(e) => onSoundChange(e.target.value)}
        className="bg-transparent text-sm font-medium text-gray-700 outline-none dark:text-gray-200"
        disabled={isDisabled}
      >
        {SOUNDS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <button onClick={onMuteToggle} className="text-gray-400 hover:text-indigo-500">
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
      <button
        onClick={onTestSound}
        className="text-gray-400 hover:text-indigo-500"
        title="Test ringtone"
      >
        <Bell size={18} />
      </button>
    </div>
  );
};

export default SoundMixer;
