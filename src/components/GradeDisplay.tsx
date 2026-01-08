import type { Grade } from '../data/types';
import { getGradeColor, getGradeBgColor, getGradeMessage } from '../utils/grading';

interface GradeDisplayProps {
  grade: Grade;
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showMessage?: boolean;
}

export function GradeDisplay({ grade, percentage, size = 'md', showMessage = false }: GradeDisplayProps) {
  const gradeColor = getGradeColor(grade);
  const gradeBg = getGradeBgColor(grade);

  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${sizeClasses[size]} rounded-full ${gradeBg} flex items-center justify-center font-bold ${gradeColor} transition-all animate-scaleIn`}
      >
        {grade}
      </div>
      <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {percentage}% complete
      </div>
      {showMessage && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 text-center max-w-xs">
          {getGradeMessage(grade)}
        </p>
      )}
    </div>
  );
}
