import React from 'react';

interface CircularProgressBarProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export const CircularProgressBar: React.FC<CircularProgressBarProps> = ({ progress, size = 120, strokeWidth = 10 }) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const progressColor = progress >= 100 ? 'text-green-500' : 'text-indigo-600';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-gray-200"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        <circle
          className={`${progressColor} transition-all duration-500 ease-in-out`}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${progressColor}`}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};
