import type { Task, CompletionLog, ToneType } from '../data/types';
import { getCopy, focusMessages } from '../copy/microcopy';
import { TaskRow } from './TaskRow';

interface FocusSectionProps {
  focusTasks: Task[];
  completions: Map<string, CompletionLog>;
  date: string;
  tone: ToneType;
  allFocusComplete: boolean;
}

export function FocusSection({
  focusTasks,
  completions,
  date,
  tone,
  allFocusComplete,
}: FocusSectionProps) {
  if (focusTasks.length === 0) {
    return null;
  }

  return (
    <section className="animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Focus Tasks
        </h2>
        {allFocusComplete && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ All done!
          </span>
        )}
      </div>

      {allFocusComplete && (
        <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {getCopy(focusMessages.focusComplete, tone)}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {focusTasks.map(task => (
          <div key={task.id} className="relative">
            <TaskRow
              task={task}
              completion={completions.get(task.id)}
              date={date}
            />
            {/* Focus indicator */}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-400 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
