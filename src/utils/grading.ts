import type { Grade, Task, CompletionLog, DayStats, WeekStats } from '../data/types';
import { getScheduledTasksForDate, isTaskCompleteForDate } from './scheduling';
import { getWeekDates, getLastNDays, getLastNWeekStarts } from './date';

/**
 * Calculate grade from completion percentage
 * A: >= 90%, B: 80-89%, C: 70-79%, D: 60-69%, F: < 60%
 */
export function gradeForPercent(percent: number): Grade {
  if (percent >= 90) return 'A';
  if (percent >= 80) return 'B';
  if (percent >= 70) return 'C';
  if (percent >= 60) return 'D';
  return 'F';
}

/**
 * Get the color class for a grade
 */
export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'A': return 'text-emerald-500';
    case 'B': return 'text-blue-500';
    case 'C': return 'text-amber-500';
    case 'D': return 'text-orange-500';
    case 'F': return 'text-slate-400';
  }
}

/**
 * Get the background color class for a grade
 */
export function getGradeBgColor(grade: Grade): string {
  switch (grade) {
    case 'A': return 'bg-emerald-50 dark:bg-emerald-900/20';
    case 'B': return 'bg-blue-50 dark:bg-blue-900/20';
    case 'C': return 'bg-amber-50 dark:bg-amber-900/20';
    case 'D': return 'bg-orange-50 dark:bg-orange-900/20';
    case 'F': return 'bg-slate-50 dark:bg-slate-800/40';
  }
}

/**
 * Get an encouraging message for a grade
 */
export function getGradeMessage(grade: Grade): string {
  switch (grade) {
    case 'A': return 'Excellent! You\'re building great momentum.';
    case 'B': return 'Great job! Keep up the good work.';
    case 'C': return 'Making progress! Every step counts.';
    case 'D': return 'You showed up. That matters.';
    case 'F': return 'Tomorrow is a fresh start.';
  }
}

/**
 * Check if a grade counts as "passing" for streaks (C or better)
 */
export function isPassingGrade(grade: Grade): boolean {
  return grade === 'A' || grade === 'B' || grade === 'C';
}

/**
 * Build a lookup map for completions by taskId+date for O(1) access
 */
function buildCompletionMap(completions: CompletionLog[]): Map<string, CompletionLog> {
  const map = new Map<string, CompletionLog>();
  for (const c of completions) {
    map.set(`${c.taskId}:${c.date}`, c);
  }
  return map;
}

/**
 * Calculate completion percentage for a single day
 */
export function calculateDayCompletionPercent(
  tasks: Task[],
  completions: CompletionLog[],
  dateString: string
): number {
  const scheduledTasks = getScheduledTasksForDate(tasks, dateString);

  if (scheduledTasks.length === 0) {
    return 100; // No tasks scheduled = perfect day
  }

  // Build map for O(1) lookup
  const completionMap = buildCompletionMap(completions);

  let totalTarget = 0;
  let totalCompleted = 0;

  for (const task of scheduledTasks) {
    totalTarget += task.targetPerDay;
    const completion = completionMap.get(`${task.id}:${dateString}`);
    totalCompleted += Math.min(completion?.countCompleted ?? 0, task.targetPerDay);
  }

  if (totalTarget === 0) {
    return 100;
  }

  return Math.round((totalCompleted / totalTarget) * 100);
}

/**
 * Get stats for a single day
 */
export function getDayStats(
  tasks: Task[],
  completions: CompletionLog[],
  dateString: string
): DayStats {
  const scheduledTasks = getScheduledTasksForDate(tasks, dateString);

  // Build map for O(1) lookup
  const completionMap = buildCompletionMap(completions);

  let completedCount = 0;
  let totalTarget = 0;
  let totalCompleted = 0;

  for (const task of scheduledTasks) {
    totalTarget += task.targetPerDay;
    const completion = completionMap.get(`${task.id}:${dateString}`);
    totalCompleted += Math.min(completion?.countCompleted ?? 0, task.targetPerDay);
    if (isTaskCompleteForDate(task, completion, dateString)) {
      completedCount++;
    }
  }

  const percentage = totalTarget > 0
    ? Math.round((totalCompleted / totalTarget) * 100)
    : 100;

  return {
    date: dateString,
    totalTasks: scheduledTasks.length,
    completedTasks: completedCount,
    percentage,
    grade: gradeForPercent(percentage),
  };
}

/**
 * Get stats for the last N days
 */
export function getLastNDaysStats(
  tasks: Task[],
  completions: CompletionLog[],
  n: number,
  fromDate?: Date
): DayStats[] {
  const dates = getLastNDays(n, fromDate);
  return dates.map(date => getDayStats(tasks, completions, date));
}

/**
 * Get stats for a week
 */
export function getWeekStats(
  tasks: Task[],
  completions: CompletionLog[],
  weekStartDate: string
): WeekStats {
  const weekDates = getWeekDates(weekStartDate);
  const dailyStats = weekDates.map(date => getDayStats(tasks, completions, date));

  // Calculate weekly totals
  const totalTasks = dailyStats.reduce((sum, day) => sum + day.totalTasks, 0);
  const completedTasks = dailyStats.reduce((sum, day) => sum + day.completedTasks, 0);

  const percentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 100;

  return {
    weekStartDate,
    totalTasks,
    completedTasks,
    percentage,
    grade: gradeForPercent(percentage),
    dailyStats,
  };
}

/**
 * Get stats for the last N weeks
 */
export function getLastNWeeksStats(
  tasks: Task[],
  completions: CompletionLog[],
  n: number,
  fromDate?: Date
): WeekStats[] {
  const weekStarts = getLastNWeekStarts(n, fromDate);
  return weekStarts.map(startDate => getWeekStats(tasks, completions, startDate));
}

/**
 * Calculate current streak (consecutive days with grade >= C)
 */
export function calculateCurrentStreak(
  tasks: Task[],
  completions: CompletionLog[],
  fromDate?: Date
): number {
  let streak = 0;
  const today = fromDate ?? new Date();

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    const stats = getDayStats(tasks, completions, dateString);

    // Skip days with no tasks
    if (stats.totalTasks === 0) {
      continue;
    }

    // Streak continues if grade is C or better
    if (isPassingGrade(stats.grade)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest streak ever
 */
export function calculateLongestStreak(
  tasks: Task[],
  completions: CompletionLog[]
): number {
  if (completions.length === 0) {
    return 0;
  }

  // Get all unique dates from completions, sorted
  const dates = [...new Set(completions.map(c => c.date))].sort();

  if (dates.length === 0) {
    return 0;
  }

  let longestStreak = 0;
  let currentStreak = 0;
  let prevDate: string | null = null;

  for (const dateString of dates) {
    const stats = getDayStats(tasks, completions, dateString);

    if (stats.totalTasks === 0) {
      continue;
    }

    // Check if this date is consecutive with the previous one
    const isConsecutive = prevDate === null || isNextDay(prevDate, dateString);

    if (isPassingGrade(stats.grade)) {
      if (isConsecutive) {
        currentStreak++;
      } else {
        currentStreak = 1; // Start new streak
      }
      longestStreak = Math.max(longestStreak, currentStreak);
      prevDate = dateString;
    } else {
      currentStreak = 0;
      prevDate = null;
    }
  }

  return longestStreak;
}

/**
 * Check if date2 is the day after date1
 */
function isNextDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  const diffMs = d2.getTime() - d1.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}
