import type { Grade, Task, CompletionLog, DayStats, WeekStats, StreakState } from '../data/types';
import { getScheduledTasksForDate, isTaskCompleteForDate } from './scheduling';
import { getWeekDates, getLastNDays, getLastNWeekStarts, getWeekStart } from './date';

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
 * Get an encouraging message for a grade (legacy - use microcopy system instead)
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
 * Calculate momentum score (0-100) for a single day
 * This is the primary metric, replacing letter grades as the default
 */
export function calculateMomentumScore(
  tasks: Task[],
  completions: CompletionLog[],
  dateString: string
): number {
  const scheduledTasks = getScheduledTasksForDate(tasks, dateString);

  if (scheduledTasks.length === 0) {
    return 100; // No tasks scheduled = perfect day
  }

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
 * Calculate completion percentage for a single day (alias for momentum score)
 */
export function calculateDayCompletionPercent(
  tasks: Task[],
  completions: CompletionLog[],
  dateString: string
): number {
  return calculateMomentumScore(tasks, completions, dateString);
}

/**
 * Get enhanced stats for a single day
 */
export function getDayStats(
  tasks: Task[],
  completions: CompletionLog[],
  dateString: string
): DayStats {
  const scheduledTasks = getScheduledTasksForDate(tasks, dateString);
  const completionMap = buildCompletionMap(completions);

  let completedCount = 0;
  let totalTarget = 0;
  let totalCompleted = 0;
  let focusTasksCompleted = 0;
  let focusTasksTotal = 0;
  const wins: string[] = [];

  for (const task of scheduledTasks) {
    totalTarget += task.targetPerDay;
    const completion = completionMap.get(`${task.id}:${dateString}`);
    const completedAmount = Math.min(completion?.countCompleted ?? 0, task.targetPerDay);
    totalCompleted += completedAmount;

    const isComplete = isTaskCompleteForDate(task, completion, dateString);
    if (isComplete) {
      completedCount++;
      wins.push(task.name);
    }

    // Track focus tasks separately
    if (task.focus) {
      focusTasksTotal++;
      if (isComplete) {
        focusTasksCompleted++;
      }
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
    totalTarget,
    totalCompleted,
    focusTasksCompleted,
    focusTasksTotal,
    wins,
  };
}

/**
 * Get the next best action (easiest remaining task)
 */
export function getNextBestAction(
  tasks: Task[],
  completions: CompletionLog[],
  dateString: string
): Task | null {
  const scheduledTasks = getScheduledTasksForDate(tasks, dateString);
  const completionMap = buildCompletionMap(completions);

  // Filter to incomplete tasks
  const incompleteTasks = scheduledTasks.filter(task => {
    const completion = completionMap.get(`${task.id}:${dateString}`);
    return !isTaskCompleteForDate(task, completion, dateString);
  });

  if (incompleteTasks.length === 0) {
    return null;
  }

  // Sort by: focus tasks first, then by remaining count (fewer = easier), then by kind (chores are quick)
  incompleteTasks.sort((a, b) => {
    // Focus tasks first
    if (a.focus && !b.focus) return -1;
    if (!a.focus && b.focus) return 1;

    // Get remaining counts
    const aCompletion = completionMap.get(`${a.id}:${dateString}`);
    const bCompletion = completionMap.get(`${b.id}:${dateString}`);
    const aRemaining = a.targetPerDay - (aCompletion?.countCompleted ?? 0);
    const bRemaining = b.targetPerDay - (bCompletion?.countCompleted ?? 0);

    // Fewer remaining = easier
    if (aRemaining !== bRemaining) {
      return aRemaining - bRemaining;
    }

    // Chores are quick 15-min tasks
    if (a.kind === 'chore' && b.kind !== 'chore') return -1;
    if (a.kind !== 'chore' && b.kind === 'chore') return 1;

    return 0;
  });

  return incompleteTasks[0];
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
 * Get enhanced stats for a week with trend calculation
 */
export function getWeekStats(
  tasks: Task[],
  completions: CompletionLog[],
  weekStartDate: string,
  previousWeekStats?: WeekStats
): WeekStats {
  const weekDates = getWeekDates(weekStartDate);
  const dailyStats = weekDates.map(date => getDayStats(tasks, completions, date));

  // Calculate weekly totals
  const totalTasks = dailyStats.reduce((sum, day) => sum + day.totalTasks, 0);
  const completedTasks = dailyStats.reduce((sum, day) => sum + day.completedTasks, 0);

  const percentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 100;

  // Calculate trend vs last week
  const trendVsLastWeek = previousWeekStats
    ? percentage - previousWeekStats.percentage
    : 0;

  // Count consistency days (at least one focus task completed or any task if no focus tasks)
  const consistencyDays = dailyStats.filter(day => {
    if (day.focusTasksTotal > 0) {
      return day.focusTasksCompleted > 0;
    }
    return day.completedTasks > 0;
  }).length;

  // Count perfect days (100% completion)
  const perfectDays = dailyStats.filter(day => day.percentage === 100 && day.totalTasks > 0).length;

  return {
    weekStartDate,
    totalTasks,
    completedTasks,
    percentage,
    grade: gradeForPercent(percentage),
    dailyStats,
    trendVsLastWeek,
    consistencyDays,
    perfectDays,
  };
}

/**
 * Get stats for the last N weeks with trend calculations
 */
export function getLastNWeeksStats(
  tasks: Task[],
  completions: CompletionLog[],
  n: number,
  fromDate?: Date
): WeekStats[] {
  const weekStarts = getLastNWeekStarts(n, fromDate);
  const weekStats: WeekStats[] = [];

  for (let i = 0; i < weekStarts.length; i++) {
    const previousWeek = i > 0 ? weekStats[i - 1] : undefined;
    weekStats.push(getWeekStats(tasks, completions, weekStarts[i], previousWeek));
  }

  return weekStats;
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

// ============ New Streak System ============

/**
 * Calculate consistency streak (completed at least one focus task or any task if no focus)
 */
export function calculateConsistencyStreak(
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

    // Check consistency: at least one focus task, or any task if no focus tasks scheduled
    const isConsistent = stats.focusTasksTotal > 0
      ? stats.focusTasksCompleted > 0
      : stats.completedTasks > 0;

    if (isConsistent) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate perfect day streak (100% completion)
 */
export function calculatePerfectStreak(
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

    if (stats.percentage === 100) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Update streak state based on today's progress
 * Returns updated streak state and whether a grace day prompt should be shown
 */
export function updateStreakState(
  currentStreaks: StreakState,
  tasks: Task[],
  completions: CompletionLog[],
  todayDate: string
): { streaks: StreakState; showGraceDayPrompt: boolean; streakType: 'consistency' | 'perfect' | null } {
  const stats = getDayStats(tasks, completions, todayDate);
  const weekStart = getWeekStart(todayDate);

  // Reset grace days if new week
  let graceDaysUsedThisWeek = currentStreaks.graceDaysUsedThisWeek;
  let graceDayWeekStart = currentStreaks.graceDayWeekStart;
  if (graceDayWeekStart !== weekStart) {
    graceDaysUsedThisWeek = 0;
    graceDayWeekStart = weekStart;
  }

  // Check consistency
  const isConsistent = stats.focusTasksTotal > 0
    ? stats.focusTasksCompleted > 0
    : stats.completedTasks > 0;

  // Check perfect
  const isPerfect = stats.percentage === 100 && stats.totalTasks > 0;

  let consistencyStreak = currentStreaks.consistencyStreak;
  let lastConsistencyDate = currentStreaks.lastConsistencyDate;
  let perfectStreak = currentStreaks.perfectStreak;
  let lastPerfectDate = currentStreaks.lastPerfectDate;
  let showGraceDayPrompt = false;
  let streakType: 'consistency' | 'perfect' | null = null;

  // Update consistency streak
  if (isConsistent) {
    if (lastConsistencyDate === null || isNextDay(lastConsistencyDate, todayDate) || lastConsistencyDate === todayDate) {
      if (lastConsistencyDate !== todayDate) {
        consistencyStreak++;
      }
      lastConsistencyDate = todayDate;
    } else {
      // Gap detected - check if grace day available
      if (graceDaysUsedThisWeek < 1 && consistencyStreak > 0) {
        showGraceDayPrompt = true;
        streakType = 'consistency';
      } else {
        consistencyStreak = 1;
      }
      lastConsistencyDate = todayDate;
    }
  }

  // Update perfect streak
  if (isPerfect) {
    if (lastPerfectDate === null || isNextDay(lastPerfectDate, todayDate) || lastPerfectDate === todayDate) {
      if (lastPerfectDate !== todayDate) {
        perfectStreak++;
      }
      lastPerfectDate = todayDate;
    } else {
      perfectStreak = 1;
      lastPerfectDate = todayDate;
    }
  } else if (lastPerfectDate !== todayDate) {
    // Not perfect today and haven't logged today yet
    if (lastPerfectDate && !isNextDay(lastPerfectDate, todayDate)) {
      // Gap - reset unless using grace day
      if (graceDaysUsedThisWeek < 1 && perfectStreak > 0 && !showGraceDayPrompt) {
        showGraceDayPrompt = true;
        streakType = 'perfect';
      }
    }
  }

  // Update best streaks
  const bestConsistencyStreak = Math.max(currentStreaks.bestConsistencyStreak, consistencyStreak);
  const bestPerfectStreak = Math.max(currentStreaks.bestPerfectStreak, perfectStreak);

  return {
    streaks: {
      consistencyStreak,
      lastConsistencyDate,
      perfectStreak,
      lastPerfectDate,
      graceDaysUsedThisWeek,
      graceDayWeekStart,
      bestConsistencyStreak,
      bestPerfectStreak,
    },
    showGraceDayPrompt,
    streakType,
  };
}

/**
 * Apply a grace day to repair a streak
 */
export function applyGraceDay(
  currentStreaks: StreakState,
  streakType: 'consistency' | 'perfect',
  todayDate: string
): StreakState {
  return {
    ...currentStreaks,
    graceDaysUsedThisWeek: currentStreaks.graceDaysUsedThisWeek + 1,
    // Keep the streak going
    lastConsistencyDate: streakType === 'consistency' ? todayDate : currentStreaks.lastConsistencyDate,
    lastPerfectDate: streakType === 'perfect' ? todayDate : currentStreaks.lastPerfectDate,
  };
}

// ============ Legacy Functions (for backwards compatibility) ============

/**
 * Calculate current streak (legacy - uses passing grade)
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

    if (stats.totalTasks === 0) {
      continue;
    }

    if (isPassingGrade(stats.grade)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest streak ever (legacy)
 */
export function calculateLongestStreak(
  tasks: Task[],
  completions: CompletionLog[]
): number {
  if (completions.length === 0) {
    return 0;
  }

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

    const isConsecutive = prevDate === null || isNextDay(prevDate, dateString);

    if (isPassingGrade(stats.grade)) {
      if (isConsecutive) {
        currentStreak++;
      } else {
        currentStreak = 1;
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
