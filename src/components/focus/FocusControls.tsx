import React from 'react';
import { Pause, Play, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface FocusControlsProps {
  isActive: boolean;
  onToggle: () => void;
  onReset: () => void;
}

const FocusControls: React.FC<FocusControlsProps> = ({ isActive, onToggle, onReset }) => {
  return (
    <div className="flex gap-4">
      <Button
        onClick={onToggle}
        className={`flex w-32 items-center justify-center gap-2 ${isActive ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}`}
      >
        {isActive ? (
          <>
            <Pause size={20} /> Pauza
          </>
        ) : (
          <>
            <Play size={20} /> Boshlash
          </>
        )}
      </Button>
      <Button
        variant="secondary"
        onClick={onReset}
        className="flex h-10 w-12 items-center justify-center px-0"
      >
        <RefreshCw size={20} />
      </Button>
    </div>
  );
};

export default FocusControls;
