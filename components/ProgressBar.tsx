import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = 'bg-blue-600' }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`${color} h-2.5 rounded-full transition-all duration-300 ease-in-out`}
        style={{ width: `${clampedProgress}%` }}
      ></div>
    </div>
  );
};
