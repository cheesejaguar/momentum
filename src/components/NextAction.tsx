import type { Task, ToneType } from '../data/types';
import { nextActionMessages } from '../copy/microcopy';

interface NextActionProps {
  task: Task | null;
  tone: ToneType;
  onComplete?: () => void;
}

export function NextAction({ task, tone, onComplete }: NextActionProps) {
  if (!task) {
    return null;
  }

  const message = nextActionMessages.suggestion[tone](task.name);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {message}
          </p>
        </div>
        {onComplete && (
          <button
            onClick={onComplete}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex-shrink-0"
          >
            Do it
          </button>
        )}
      </div>
    </div>
  );
}
