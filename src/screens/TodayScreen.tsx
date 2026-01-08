import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../data/context';
import { FullPageLoader, EmptyState, ProgressCard, FocusSection, NextAction, FreshStartBanner } from '../components';
import { TaskRow } from '../components/TaskRow';
import { getScheduledTasksForDate, groupTasksByKind, isTaskCompleteForDate } from '../utils/scheduling';
import { getDayStats, getNextBestAction } from '../utils/grading';
import { getLocalDateString, formatDateForDisplay } from '../utils/date';
import { useSettings } from '../hooks/useSettings';

export function TodayScreen() {
  const { tasks, completions, isLoading, incrementCompletion } = useApp();
  const { settings, isLoading: settingsLoading } = useSettings();

  const today = getLocalDateString();

  const {
    scheduledTasks,
    groupedTasks,
    todayStats,
    todaysCompletions,
    focusTasks,
    allFocusComplete,
    nextAction,
    nonFocusHabits,
  } = useMemo(() => {
    const scheduled = getScheduledTasksForDate(tasks, today);
    const grouped = groupTasksByKind(scheduled);
    const stats = getDayStats(tasks, completions, today);
    const completionsMap = new Map(
      completions.filter(c => c.date === today).map(c => [c.taskId, c])
    );

    // Get focus tasks (up to 3)
    const focus = scheduled.filter(t => t.focus).slice(0, 3);

    // Check if all focus tasks are complete
    const allFocusDone = focus.length > 0 && focus.every(t => {
      const completion = completionsMap.get(t.id);
      return isTaskCompleteForDate(t, completion, today);
    });

    // Get next best action
    const next = getNextBestAction(tasks, completions, today);

    // Separate focus habits from non-focus habits
    const focusIds = new Set(focus.map(t => t.id));
    const nonFocus = grouped.habits.filter(t => !focusIds.has(t.id));

    return {
      scheduledTasks: scheduled,
      groupedTasks: grouped,
      todayStats: stats,
      todaysCompletions: completionsMap,
      focusTasks: focus,
      allFocusComplete: allFocusDone,
      nextAction: next,
      nonFocusHabits: nonFocus,
    };
  }, [tasks, completions, today]);

  if (isLoading || settingsLoading) {
    return <FullPageLoader />;
  }

  const hasTasks = scheduledTasks.length > 0;
  const todaysChore = groupedTasks.chores.length > 0 ? groupedTasks.chores[0] : null;

  // Handle quick complete from NextAction
  const handleQuickComplete = () => {
    if (nextAction) {
      incrementCompletion(nextAction.id, today);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 safe-top">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Today</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {formatDateForDisplay(today)}
            </p>
          </div>
        </div>

        {/* Fresh Start Banner */}
        <FreshStartBanner
          tone={settings.tone}
          showBanner={settings.showFreshStartBanner}
        />

        {/* Progress Card */}
        {hasTasks && (
          <ProgressCard
            momentumScore={todayStats.percentage}
            percentage={todayStats.percentage}
            tone={settings.tone}
            showLetterGrade={settings.showLetterGrades}
            grade={todayStats.grade}
          />
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
            {/* Next Action Suggestion */}
            {nextAction && todayStats.percentage < 100 && (
              <NextAction
                task={nextAction}
                tone={settings.tone}
                onComplete={handleQuickComplete}
              />
            )}

            {/* Focus Tasks Section */}
            {focusTasks.length > 0 && (
              <FocusSection
                focusTasks={focusTasks}
                completions={todaysCompletions}
                date={today}
                tone={settings.tone}
                allFocusComplete={allFocusComplete}
              />
            )}

            {/* Daily Habits (non-focus) */}
            {nonFocusHabits.length > 0 && (
              <section className="animate-fadeIn">
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Daily Habits
                </h2>
                <div className="space-y-3">
                  {nonFocusHabits.map(task => (
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
