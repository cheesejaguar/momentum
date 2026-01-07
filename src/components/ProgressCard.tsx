import type { ToneType } from '../data/types';
import { getProgressMessage } from '../copy/microcopy';

interface ProgressCardProps {
  momentumScore: number;
  percentage: number;
  tone: ToneType;
  showLetterGrade?: boolean;
  grade?: string;
}

export function ProgressCard({
  momentumScore,
  percentage,
  tone,
  showLetterGrade = false,
  grade,
}: ProgressCardProps) {
  const message = getProgressMessage(percentage, tone);

  // Determine the progress bar color based on score
  const getProgressColor = () => {
    if (momentumScore >= 90) return 'bg-emerald-500';
    if (momentumScore >= 70) return 'bg-blue-500';
    if (momentumScore >= 50) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  const getScoreColor = () => {
    if (momentumScore >= 90) return 'text-emerald-500';
    if (momentumScore >= 70) return 'text-blue-500';
    if (momentumScore >= 50) return 'text-amber-500';
    return 'text-slate-500';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      {/* Score and Progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${getScoreColor()}`}>
            {momentumScore}
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-sm">
            / 100
          </span>
          {showLetterGrade && grade && (
            <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
              {grade}
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {percentage}% done
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${getProgressColor()} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Supportive Message */}
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {message}
      </p>
    </div>
  );
}
