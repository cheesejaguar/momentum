import { describe, it, expect } from 'vitest';
import type { Task, CompletionLog } from '../data/types';
import {
  gradeForPercent,
  getGradeColor,
  getGradeBgColor,
  getGradeMessage,
  isPassingGrade,
  calculateDayCompletionPercent,
  calculateMomentumScore,
  getDayStats,
  getLastNDaysStats,
  getWeekStats,
  getLastNWeeksStats,
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateConsistencyStreak,
  calculatePerfectStreak,
  getNextBestAction,
} from './grading';

// Helper to create test data
function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-id',
    name: 'Test Task',
    kind: 'habit',
    schedule: { type: 'daily' },
    targetPerDay: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    archived: false,
    ...overrides,
  };
}

function createCompletion(overrides: Partial<CompletionLog> = {}): CompletionLog {
  return {
    id: 'completion-id',
    taskId: 'test-id',
    date: '2025-01-15',
    countCompleted: 1,
    timestamps: ['2025-01-15T10:00:00.000Z'],
    ...overrides,
  };
}

describe('gradeForPercent', () => {
  it('returns A for 90-100%', () => {
    expect(gradeForPercent(90)).toBe('A');
    expect(gradeForPercent(95)).toBe('A');
    expect(gradeForPercent(100)).toBe('A');
  });

  it('returns B for 80-89%', () => {
    expect(gradeForPercent(80)).toBe('B');
    expect(gradeForPercent(85)).toBe('B');
    expect(gradeForPercent(89)).toBe('B');
  });

  it('returns C for 70-79%', () => {
    expect(gradeForPercent(70)).toBe('C');
    expect(gradeForPercent(75)).toBe('C');
    expect(gradeForPercent(79)).toBe('C');
  });

  it('returns D for 60-69%', () => {
    expect(gradeForPercent(60)).toBe('D');
    expect(gradeForPercent(65)).toBe('D');
    expect(gradeForPercent(69)).toBe('D');
  });

  it('returns F for < 60%', () => {
    expect(gradeForPercent(0)).toBe('F');
    expect(gradeForPercent(30)).toBe('F');
    expect(gradeForPercent(59)).toBe('F');
  });
});

describe('getGradeColor', () => {
  it('returns correct color classes', () => {
    expect(getGradeColor('A')).toContain('emerald');
    expect(getGradeColor('B')).toContain('blue');
    expect(getGradeColor('C')).toContain('amber');
    expect(getGradeColor('D')).toContain('orange');
    expect(getGradeColor('F')).toContain('slate');
  });
});

describe('getGradeBgColor', () => {
  it('returns correct background color classes', () => {
    expect(getGradeBgColor('A')).toContain('emerald');
    expect(getGradeBgColor('B')).toContain('blue');
    expect(getGradeBgColor('C')).toContain('amber');
    expect(getGradeBgColor('D')).toContain('orange');
    expect(getGradeBgColor('F')).toContain('slate');
  });
});

describe('getGradeMessage', () => {
  it('returns encouraging messages for each grade', () => {
    expect(getGradeMessage('A')).toContain('Excellent');
    expect(getGradeMessage('B')).toContain('Great');
    expect(getGradeMessage('C')).toContain('progress');
    expect(getGradeMessage('D')).toContain('showed up');
    expect(getGradeMessage('F')).toContain('fresh start');
  });
});

describe('isPassingGrade', () => {
  it('returns true for A, B, and C grades', () => {
    expect(isPassingGrade('A')).toBe(true);
    expect(isPassingGrade('B')).toBe(true);
    expect(isPassingGrade('C')).toBe(true);
  });

  it('returns false for D and F grades', () => {
    expect(isPassingGrade('D')).toBe(false);
    expect(isPassingGrade('F')).toBe(false);
  });
});

describe('calculateDayCompletionPercent', () => {
  it('returns 100 when no tasks scheduled', () => {
    const tasks = [
      createTask({ schedule: { type: 'weekdays', weekdays: [1] } }), // Monday only
    ];
    const result = calculateDayCompletionPercent(tasks, [], '2025-01-15'); // Wednesday
    expect(result).toBe(100);
  });

  it('returns 0 when no completions', () => {
    const tasks = [createTask({ id: '1' })];
    const result = calculateDayCompletionPercent(tasks, [], '2025-01-15');
    expect(result).toBe(0);
  });

  it('returns 100 when all tasks complete', () => {
    const tasks = [createTask({ id: '1' })];
    const completions = [createCompletion({ taskId: '1', date: '2025-01-15' })];
    const result = calculateDayCompletionPercent(tasks, completions, '2025-01-15');
    expect(result).toBe(100);
  });

  it('calculates partial completion correctly', () => {
    const tasks = [
      createTask({ id: '1', targetPerDay: 2 }),
      createTask({ id: '2', targetPerDay: 2 }),
    ];
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15', countCompleted: 2 }),
      createCompletion({ taskId: '2', date: '2025-01-15', countCompleted: 1 }),
    ];
    const result = calculateDayCompletionPercent(tasks, completions, '2025-01-15');
    expect(result).toBe(75); // 3/4 = 75%
  });

  it('caps completion at target', () => {
    const tasks = [createTask({ id: '1', targetPerDay: 1 })];
    const completions = [createCompletion({ taskId: '1', date: '2025-01-15', countCompleted: 5 })];
    const result = calculateDayCompletionPercent(tasks, completions, '2025-01-15');
    expect(result).toBe(100); // Even though count is 5, target is 1
  });
});

describe('getDayStats', () => {
  it('returns correct stats structure', () => {
    const tasks = [createTask({ id: '1' })];
    const completions = [createCompletion({ taskId: '1', date: '2025-01-15' })];
    const result = getDayStats(tasks, completions, '2025-01-15');

    expect(result).toHaveProperty('date', '2025-01-15');
    expect(result).toHaveProperty('totalTasks', 1);
    expect(result).toHaveProperty('completedTasks', 1);
    expect(result).toHaveProperty('percentage', 100);
    expect(result).toHaveProperty('grade', 'A');
  });

  it('counts completed tasks correctly', () => {
    const tasks = [
      createTask({ id: '1' }),
      createTask({ id: '2' }),
      createTask({ id: '3' }),
    ];
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15' }),
      createCompletion({ taskId: '2', date: '2025-01-15' }),
    ];
    const result = getDayStats(tasks, completions, '2025-01-15');

    expect(result.totalTasks).toBe(3);
    expect(result.completedTasks).toBe(2);
  });
});

describe('getLastNDaysStats', () => {
  it('returns stats for each day', () => {
    const tasks = [createTask({ id: '1' })];
    const completions: CompletionLog[] = [];
    const result = getLastNDaysStats(tasks, completions, 7, new Date(2025, 0, 15));

    expect(result).toHaveLength(7);
    expect(result[6].date).toBe('2025-01-15');
    expect(result[0].date).toBe('2025-01-09');
  });
});

describe('getWeekStats', () => {
  it('returns correct weekly stats', () => {
    const tasks = [createTask({ id: '1' })];
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-12' }),
      createCompletion({ taskId: '1', date: '2025-01-13' }),
      createCompletion({ taskId: '1', date: '2025-01-14' }),
    ];
    const result = getWeekStats(tasks, completions, '2025-01-12');

    expect(result.weekStartDate).toBe('2025-01-12');
    expect(result.totalTasks).toBe(7); // 7 days × 1 task
    expect(result.completedTasks).toBe(3);
    expect(result.dailyStats).toHaveLength(7);
  });

  it('calculates weekly percentage correctly', () => {
    const tasks = [createTask({ id: '1' })];
    const completions: CompletionLog[] = [];
    const result = getWeekStats(tasks, completions, '2025-01-12');

    expect(result.percentage).toBe(0);
    expect(result.grade).toBe('F');
  });
});

describe('getLastNWeeksStats', () => {
  it('returns stats for each week', () => {
    const tasks = [createTask({ id: '1' })];
    const completions: CompletionLog[] = [];
    const result = getLastNWeeksStats(tasks, completions, 4, new Date(2025, 0, 15));

    expect(result).toHaveLength(4);
    expect(result[3].weekStartDate).toBe('2025-01-12');
  });
});

describe('calculateCurrentStreak', () => {
  it('returns 0 when no completions', () => {
    const tasks = [createTask({ id: '1' })];
    const result = calculateCurrentStreak(tasks, []);
    expect(result).toBe(0);
  });

  it('counts consecutive passing days', () => {
    const tasks = [createTask({ id: '1' })];
    const today = new Date(2025, 0, 15);
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15' }),
      createCompletion({ taskId: '1', date: '2025-01-14' }),
      createCompletion({ taskId: '1', date: '2025-01-13' }),
    ];
    const result = calculateCurrentStreak(tasks, completions, today);
    expect(result).toBe(3);
  });

  it('breaks streak on failing day', () => {
    const tasks = [createTask({ id: '1' })];
    const today = new Date(2025, 0, 15);
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15' }),
      // Missing 2025-01-14
      createCompletion({ taskId: '1', date: '2025-01-13' }),
    ];
    const result = calculateCurrentStreak(tasks, completions, today);
    expect(result).toBe(1); // Only today counts
  });
});

describe('calculateLongestStreak', () => {
  it('returns 0 when no completions', () => {
    const tasks = [createTask({ id: '1' })];
    const result = calculateLongestStreak(tasks, []);
    expect(result).toBe(0);
  });

  it('finds the longest streak', () => {
    const tasks = [createTask({ id: '1' })];
    const completions = [
      // Streak of 2
      createCompletion({ taskId: '1', date: '2025-01-10' }),
      createCompletion({ taskId: '1', date: '2025-01-11' }),
      // Gap
      // Streak of 3
      createCompletion({ taskId: '1', date: '2025-01-13' }),
      createCompletion({ taskId: '1', date: '2025-01-14' }),
      createCompletion({ taskId: '1', date: '2025-01-15' }),
    ];
    const result = calculateLongestStreak(tasks, completions);
    expect(result).toBe(3);
  });
});

describe('calculateMomentumScore', () => {
  it('returns 100 when no tasks scheduled', () => {
    const tasks = [
      createTask({ schedule: { type: 'weekdays', weekdays: [1] } }), // Monday only
    ];
    const result = calculateMomentumScore(tasks, [], '2025-01-15'); // Wednesday
    expect(result).toBe(100);
  });

  it('returns 0 when no completions', () => {
    const tasks = [createTask({ id: '1' })];
    const result = calculateMomentumScore(tasks, [], '2025-01-15');
    expect(result).toBe(0);
  });

  it('returns 100 when all tasks complete', () => {
    const tasks = [createTask({ id: '1' })];
    const completions = [createCompletion({ taskId: '1', date: '2025-01-15' })];
    const result = calculateMomentumScore(tasks, completions, '2025-01-15');
    expect(result).toBe(100);
  });

  it('calculates partial completion correctly', () => {
    const tasks = [
      createTask({ id: '1', targetPerDay: 2 }),
      createTask({ id: '2', targetPerDay: 2 }),
    ];
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15', countCompleted: 2 }),
      createCompletion({ taskId: '2', date: '2025-01-15', countCompleted: 1 }),
    ];
    const result = calculateMomentumScore(tasks, completions, '2025-01-15');
    expect(result).toBe(75); // 3/4 = 75%
  });
});

describe('calculateConsistencyStreak', () => {
  it('returns 0 when no completions', () => {
    const tasks = [createTask({ id: '1' })];
    const result = calculateConsistencyStreak(tasks, []);
    expect(result).toBe(0);
  });

  it('counts consecutive days with any completion', () => {
    const tasks = [createTask({ id: '1' })];
    const today = new Date(2025, 0, 15);
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15' }),
      createCompletion({ taskId: '1', date: '2025-01-14' }),
      createCompletion({ taskId: '1', date: '2025-01-13' }),
    ];
    const result = calculateConsistencyStreak(tasks, completions, today);
    expect(result).toBe(3);
  });

  it('counts focus task completions for consistency', () => {
    const tasks = [
      createTask({ id: '1', focus: true }),
      createTask({ id: '2', focus: false }),
    ];
    const today = new Date(2025, 0, 15);
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15' }), // Focus task done
      createCompletion({ taskId: '1', date: '2025-01-14' }), // Focus task done
    ];
    const result = calculateConsistencyStreak(tasks, completions, today);
    expect(result).toBe(2);
  });
});

describe('calculatePerfectStreak', () => {
  it('returns 0 when no completions', () => {
    const tasks = [createTask({ id: '1' })];
    const result = calculatePerfectStreak(tasks, []);
    expect(result).toBe(0);
  });

  it('counts consecutive 100% days', () => {
    const tasks = [createTask({ id: '1' })];
    const today = new Date(2025, 0, 15);
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15' }),
      createCompletion({ taskId: '1', date: '2025-01-14' }),
      createCompletion({ taskId: '1', date: '2025-01-13' }),
    ];
    const result = calculatePerfectStreak(tasks, completions, today);
    expect(result).toBe(3);
  });

  it('breaks on non-perfect day', () => {
    const tasks = [
      createTask({ id: '1' }),
      createTask({ id: '2' }),
    ];
    const today = new Date(2025, 0, 15);
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15' }),
      createCompletion({ taskId: '2', date: '2025-01-15' }),
      createCompletion({ taskId: '1', date: '2025-01-14' }), // Only 1 of 2 done
    ];
    const result = calculatePerfectStreak(tasks, completions, today);
    expect(result).toBe(1); // Only today is perfect
  });
});

describe('getNextBestAction', () => {
  it('returns null when all tasks complete', () => {
    const tasks = [createTask({ id: '1' })];
    const completions = [createCompletion({ taskId: '1', date: '2025-01-15' })];
    const result = getNextBestAction(tasks, completions, '2025-01-15');
    expect(result).toBeNull();
  });

  it('returns incomplete task', () => {
    const tasks = [
      createTask({ id: '1' }),
      createTask({ id: '2', name: 'Second Task' }),
    ];
    const completions = [createCompletion({ taskId: '1', date: '2025-01-15' })];
    const result = getNextBestAction(tasks, completions, '2025-01-15');
    expect(result?.id).toBe('2');
  });

  it('prioritizes focus tasks', () => {
    const tasks = [
      createTask({ id: '1', focus: false }),
      createTask({ id: '2', focus: true, name: 'Focus Task' }),
    ];
    const result = getNextBestAction(tasks, [], '2025-01-15');
    expect(result?.id).toBe('2');
  });

  it('prioritizes tasks with fewer remaining', () => {
    const tasks = [
      createTask({ id: '1', targetPerDay: 5 }),
      createTask({ id: '2', targetPerDay: 2 }),
    ];
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15', countCompleted: 2 }), // 3 remaining
      createCompletion({ taskId: '2', date: '2025-01-15', countCompleted: 1 }), // 1 remaining
    ];
    const result = getNextBestAction(tasks, completions, '2025-01-15');
    expect(result?.id).toBe('2'); // Fewer remaining
  });
});

describe('getDayStats extended fields', () => {
  it('tracks focus tasks correctly', () => {
    const tasks = [
      createTask({ id: '1', focus: true }),
      createTask({ id: '2', focus: true }),
      createTask({ id: '3', focus: false }),
    ];
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15' }),
    ];
    const result = getDayStats(tasks, completions, '2025-01-15');

    expect(result.focusTasksTotal).toBe(2);
    expect(result.focusTasksCompleted).toBe(1);
  });

  it('tracks wins correctly', () => {
    const tasks = [
      createTask({ id: '1', name: 'Task One' }),
      createTask({ id: '2', name: 'Task Two' }),
    ];
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15' }),
    ];
    const result = getDayStats(tasks, completions, '2025-01-15');

    expect(result.wins).toContain('Task One');
    expect(result.wins).not.toContain('Task Two');
  });

  it('tracks total target and completed counts', () => {
    const tasks = [
      createTask({ id: '1', targetPerDay: 3 }),
      createTask({ id: '2', targetPerDay: 2 }),
    ];
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-15', countCompleted: 2 }),
      createCompletion({ taskId: '2', date: '2025-01-15', countCompleted: 2 }),
    ];
    const result = getDayStats(tasks, completions, '2025-01-15');

    expect(result.totalTarget).toBe(5);
    expect(result.totalCompleted).toBe(4); // 2 + 2, not exceeding targets
  });
});

describe('getWeekStats extended fields', () => {
  it('calculates trend vs last week', () => {
    const tasks = [createTask({ id: '1' })];
    const completions = [
      // This week (week of Jan 12)
      createCompletion({ taskId: '1', date: '2025-01-12' }),
      createCompletion({ taskId: '1', date: '2025-01-13' }),
      createCompletion({ taskId: '1', date: '2025-01-14' }),
      createCompletion({ taskId: '1', date: '2025-01-15' }),
      createCompletion({ taskId: '1', date: '2025-01-16' }),
      createCompletion({ taskId: '1', date: '2025-01-17' }),
      createCompletion({ taskId: '1', date: '2025-01-18' }),
    ];

    // Previous week stats (simulated)
    const previousWeekStats = {
      weekStartDate: '2025-01-05',
      totalTasks: 7,
      completedTasks: 4,
      percentage: 57,
      grade: 'F' as const,
      dailyStats: [],
      trendVsLastWeek: 0,
      consistencyDays: 4,
      perfectDays: 4,
    };

    const result = getWeekStats(tasks, completions, '2025-01-12', previousWeekStats);

    expect(result.trendVsLastWeek).toBe(43); // 100 - 57
  });

  it('counts consistency days', () => {
    const tasks = [createTask({ id: '1' })];
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-12' }),
      createCompletion({ taskId: '1', date: '2025-01-14' }),
      createCompletion({ taskId: '1', date: '2025-01-16' }),
    ];
    const result = getWeekStats(tasks, completions, '2025-01-12');

    expect(result.consistencyDays).toBe(3); // 3 days with at least one completion
  });

  it('counts perfect days', () => {
    const tasks = [createTask({ id: '1' })];
    const completions = [
      createCompletion({ taskId: '1', date: '2025-01-12' }),
      createCompletion({ taskId: '1', date: '2025-01-13' }),
    ];
    const result = getWeekStats(tasks, completions, '2025-01-12');

    expect(result.perfectDays).toBe(2); // 2 days with 100%
  });
});
