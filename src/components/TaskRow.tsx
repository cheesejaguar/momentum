import { useApp } from '../data/context';
import type { Task, CompletionLog } from '../data/types';
import { getTaskSubtitle, getTaskProgress } from '../utils/scheduling';

interface TaskRowProps {
  task: Task;
  completion: CompletionLog | undefined;
  date: string;
}

export function TaskRow({ task, completion, date }: TaskRowProps) {
  const { incrementCompletion, decrementCompletion } = useApp();

  const count = completion?.countCompleted ?? 0;
  const target = task.targetPerDay;
  const isComplete = count >= target;
  const progress = getTaskProgress(task, completion);
  const subtitle = getTaskSubtitle(task);

  const handleIncrement = () => {
    if (count < target) {
      incrementCompletion(task.id, date);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (count > 0) {
      decrementCompletion(task.id, date);
    }
  };

  // Binary task (target = 1)
  if (target === 1) {
    return (
      <button
        onClick={handleIncrement}
        onContextMenu={handleDecrement}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all touch-target ${
          isComplete
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
        }`}
      >
        {/* Checkbox */}
        <div
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            isComplete
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {isComplete && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
                className="animate-checkmark"
              />
            </svg>
          )}
        </div>

        {/* Task info */}
        <div className="flex-1 text-left">
          <div
            className={`font-medium ${
              isComplete
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {task.name}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>
        </div>

        {/* Undo button for completed */}
        {isComplete && (
          <button
            onClick={handleDecrement}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Undo"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>
        )}
      </button>
    );
  }

  // Count-based task (target > 1)
  return (
    <div
      className={`w-full p-4 rounded-xl transition-all ${
        isComplete
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Progress ring */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-slate-200 dark:text-slate-700"
            />
            {/* Progress circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              className={isComplete ? 'text-emerald-500' : 'text-blue-500'}
              strokeDasharray={`${progress * 125.6} 125.6`}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-sm font-semibold ${
                isComplete
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {count}/{target}
            </span>
          </div>
        </div>

        {/* Task info */}
        <div className="flex-1">
          <div
            className={`font-medium ${
              isComplete
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {task.name}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>
        </div>

        {/* Plus/Minus buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrement}
            disabled={count === 0}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors touch-target ${
              count === 0
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleIncrement}
            disabled={isComplete}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors touch-target ${
              isComplete
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-300 dark:text-emerald-700 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
