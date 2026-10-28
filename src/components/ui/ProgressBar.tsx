import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color, height = 8 }) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      role="progressbar"
      aria-valuenow={normalizedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full overflow-hidden rounded-full border border-border/50 bg-secondary"
      style={{ height }}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{
          width: `${normalizedProgress}%`,
          ...(color ? { backgroundColor: color } : {}),
        }}
      />
    </div>
  );
};
