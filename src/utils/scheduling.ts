import type { Task, TaskSchedule, CompletionLog } from '../data/types';
import { getDayOfWeek, daysBetween, getLocalDateString } from './date';

/**
 * Check if a task is scheduled for a given date
 */
export function isTaskScheduledForDate(task: Task, dateString: string): boolean {
  if (task.archived) {
    return false;
  }

  const schedule = task.schedule;

  switch (schedule.type) {
    case 'daily':
      return true;

    case 'weekdays':
      const dayOfWeek = getDayOfWeek(dateString);
      return schedule.weekdays?.includes(dayOfWeek) ?? false;

    case 'times_per_week':
      // For times_per_week, the task is technically available any day
      // We show it every day but track weekly progress
      return true;

    case 'every_n_days':
      return isEveryNDaysScheduled(task, dateString, schedule.everyNDays ?? 1);

    default:
      return false;
  }
}

/**
 * Check if an "every N days" task is scheduled for a given date
 */
function isEveryNDaysScheduled(task: Task, dateString: string, everyNDays: number): boolean {
  // Calculate days since task creation
  const createdDate = getLocalDateString(new Date(task.createdAt));
  const days = daysBetween(createdDate, dateString);
  return days % everyNDays === 0;
}

/**
 * Get all tasks scheduled for a given date
 */
export function getScheduledTasksForDate(tasks: Task[], dateString: string): Task[] {
  return tasks.filter(task => isTaskScheduledForDate(task, dateString));
}

/**
 * Calculate the target count for a task on a given date
 * For most tasks this is targetPerDay, but times_per_week needs special handling
 */
export function getTargetForDate(task: Task, _dateString: string): number {
  // For times_per_week, we show the task but the target is tracked weekly
  // For simplicity, we'll show it as targetPerDay but evaluate weekly
  return task.targetPerDay;
}

/**
 * Check if a task is complete for a given date
 */
export function isTaskCompleteForDate(
  task: Task,
  completion: CompletionLog | undefined,
  _dateString: string
): boolean {
  if (!completion) {
    return false;
  }
  return completion.countCompleted >= task.targetPerDay;
}

/**
 * Calculate completion progress (0-1) for a task
 */
export function getTaskProgress(
  task: Task,
  completion: CompletionLog | undefined
): number {
  if (!completion || completion.countCompleted === 0) {
    return 0;
  }
  return Math.min(1, completion.countCompleted / task.targetPerDay);
}

/**
 * Group tasks by their kind for display
 */
export function groupTasksByKind(tasks: Task[]): {
  habits: Task[];
  chores: Task[];
  custom: Task[];
} {
  return {
    habits: tasks.filter(t => t.kind === 'habit'),
    chores: tasks.filter(t => t.kind === 'chore'),
    custom: tasks.filter(t => t.kind === 'custom'),
  };
}

/**
 * Get a human-readable description of a task's schedule
 */
export function getScheduleDescription(schedule: TaskSchedule): string {
  switch (schedule.type) {
    case 'daily':
      return 'Every day';

    case 'weekdays':
      if (!schedule.weekdays || schedule.weekdays.length === 0) {
        return 'No days selected';
      }
      if (schedule.weekdays.length === 7) {
        return 'Every day';
      }
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const sortedDays = [...schedule.weekdays].sort((a, b) => a - b);
      return sortedDays.map(d => dayNames[d]).join(', ');

    case 'times_per_week':
      const times = schedule.timesPerWeek ?? 1;
      return `${times}x per week`;

    case 'every_n_days':
      const n = schedule.everyNDays ?? 1;
      if (n === 1) return 'Every day';
      if (n === 2) return 'Every other day';
      return `Every ${n} days`;

    default:
      return 'Custom';
  }
}

/**
 * Get the subtitle text for a task (schedule + target info)
 */
export function getTaskSubtitle(task: Task): string {
  const scheduleText = getScheduleDescription(task.schedule);
  if (task.targetPerDay > 1) {
    return `${scheduleText} · ${task.targetPerDay}x daily`;
  }
  return scheduleText;
}
