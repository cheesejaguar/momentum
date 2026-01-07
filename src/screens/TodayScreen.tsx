import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../data/context';
import { FullPageLoader, EmptyState } from '../components';
import { TaskRow } from '../components/TaskRow';
import { GradeDisplay } from '../components/GradeDisplay';
import { getScheduledTasksForDate, groupTasksByKind } from '../utils/scheduling';
import { getDayStats } from '../utils/grading';
import { getLocalDateString, formatDateForDisplay } from '../utils/date';

export function TodayScreen() {
  const { tasks, completions, isLoading } = useApp();

  const today = getLocalDateString();

  const { scheduledTasks, groupedTasks, todayStats, todaysCompletions } = useMemo(() => {
    const scheduled = getScheduledTasksForDate(tasks, today);
    const grouped = groupTasksByKind(scheduled);
    const stats = getDayStats(tasks, completions, today);
    const completionsMap = new Map(
      completions.filter(c => c.date === today).map(c => [c.taskId, c])
    );

    return {
      scheduledTasks: scheduled,
      groupedTasks: grouped,
      todayStats: stats,
      todaysCompletions: completionsMap,
    };
  }, [tasks, completions, today]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  const hasTasks = scheduledTasks.length > 0;
  const todaysChore = groupedTasks.chores.length > 0 ? groupedTasks.chores[0] : null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 safe-top">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Today</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {formatDateForDisplay(today)}
            </p>
          </div>
          {hasTasks && (
            <GradeDisplay
              grade={todayStats.grade}
              percentage={todayStats.percentage}
              size="sm"
            />
          )}
        </div>

        {/* Encouraging message */}
        {hasTasks && todayStats.percentage < 100 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {todayStats.completedTasks === 0
                ? "Start your day with small wins. You've got this!"
                : todayStats.percentage >= 50
                  ? "Great momentum! Keep it going."
                  : "Making progress. Every check mark counts."}
            </p>
          </div>
        )}

        {hasTasks && todayStats.percentage === 100 && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              All done! You're building great momentum.
            </p>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-5 pb-8">
        {!hasTasks ? (
          <EmptyState
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
            title="No tasks for today"
            description="Add some habits or chores to start building momentum."
            action={
              <Link
                to="/plan"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Task
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Daily Habits */}
            {groupedTasks.habits.length > 0 && (
              <section className="animate-fadeIn">
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Daily Habits
                </h2>
                <div className="space-y-3">
                  {groupedTasks.habits.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      completion={todaysCompletions.get(task.id)}
                      date={today}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Today's 15-minute Chore */}
            {todaysChore && (
              <section className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Today's 15-Minute Chore
                </h2>
                <TaskRow
                  task={todaysChore}
                  completion={todaysCompletions.get(todaysChore.id)}
                  date={today}
                />
                {todaysChore.notes && (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 pl-4">
                    {todaysChore.notes}
                  </p>
                )}
              </section>
            )}

            {/* Custom Tasks */}
            {groupedTasks.custom.length > 0 && (
              <section className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Other Tasks
                </h2>
                <div className="space-y-3">
                  {groupedTasks.custom.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      completion={todaysCompletions.get(task.id)}
                      date={today}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Additional chores if more than one scheduled */}
            {groupedTasks.chores.length > 1 && (
              <section className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  More Chores
                </h2>
                <div className="space-y-3">
                  {groupedTasks.chores.slice(1).map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      completion={todaysCompletions.get(task.id)}
                      date={today}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
