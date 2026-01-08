import type { Task } from '../data/types';
import { formatDateForDisplay } from '../utils/date';
import { getScheduleDescription } from '../utils/scheduling';

interface DayTasksListProps {
  date: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onClose: () => void;
}

export function DayTasksList({ date, tasks, onEditTask, onClose }: DayTasksListProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200">
          {formatDateForDisplay(date)}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Task List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {tasks.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
            No tasks scheduled for this day
          </div>
        ) : (
          tasks.map(task => (
            <button
              key={task.id}
              onClick={() => onEditTask(task)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              {/* Kind badge */}
              <div
                className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                  task.kind === 'habit'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : task.kind === 'chore'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                }`}
              >
                {task.kind}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 dark:text-slate-100 truncate">
                  {task.name}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {getScheduleDescription(task.schedule)}
                </div>
              </div>
              {/* Chevron icon */}
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
