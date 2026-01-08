import { describe, it, expect } from 'vitest';
import type { Task, CompletionLog } from '../data/types';
import {
  isTaskScheduledForDate,
  getScheduledTasksForDate,
  isTaskCompleteForDate,
  getTaskProgress,
  groupTasksByKind,
  getScheduleDescription,
  getTaskSubtitle,
} from './scheduling';

// Helper to create a test task
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

describe('isTaskScheduledForDate', () => {
  it('returns false for archived tasks', () => {
    const task = createTask({ archived: true });
    expect(isTaskScheduledForDate(task, '2025-01-15')).toBe(false);
  });

  it('returns true for daily tasks on any day', () => {
    const task = createTask({ schedule: { type: 'daily' } });
    expect(isTaskScheduledForDate(task, '2025-01-15')).toBe(true);
    expect(isTaskScheduledForDate(task, '2025-01-16')).toBe(true);
  });

  it('returns true for weekdays schedule on matching day', () => {
    const task = createTask({
      schedule: { type: 'weekdays', weekdays: [1, 3, 5] }, // Mon, Wed, Fri
    });
    expect(isTaskScheduledForDate(task, '2025-01-13')).toBe(true); // Monday
    expect(isTaskScheduledForDate(task, '2025-01-15')).toBe(true); // Wednesday
  });

  it('returns false for weekdays schedule on non-matching day', () => {
    const task = createTask({
      schedule: { type: 'weekdays', weekdays: [1, 3, 5] },
    });
    expect(isTaskScheduledForDate(task, '2025-01-14')).toBe(false); // Tuesday
    expect(isTaskScheduledForDate(task, '2025-01-12')).toBe(false); // Sunday
  });

  it('returns false for weekdays with empty array', () => {
    const task = createTask({
      schedule: { type: 'weekdays', weekdays: [] },
    });
    expect(isTaskScheduledForDate(task, '2025-01-15')).toBe(false);
  });

  it('returns true for times_per_week on any day', () => {
    const task = createTask({
      schedule: { type: 'times_per_week', timesPerWeek: 3 },
    });
    expect(isTaskScheduledForDate(task, '2025-01-15')).toBe(true);
  });

  it('returns true for every_n_days on correct interval', () => {
    const task = createTask({
      schedule: { type: 'every_n_days', everyNDays: 3 },
      createdAt: '2025-01-01T00:00:00.000Z',
    });
    expect(isTaskScheduledForDate(task, '2025-01-01')).toBe(true); // Day 0
    expect(isTaskScheduledForDate(task, '2025-01-04')).toBe(true); // Day 3
    expect(isTaskScheduledForDate(task, '2025-01-07')).toBe(true); // Day 6
  });

  it('returns false for every_n_days on wrong interval', () => {
    const task = createTask({
      schedule: { type: 'every_n_days', everyNDays: 3 },
      createdAt: '2025-01-01T00:00:00.000Z',
    });
    expect(isTaskScheduledForDate(task, '2025-01-02')).toBe(false); // Day 1
    expect(isTaskScheduledForDate(task, '2025-01-03')).toBe(false); // Day 2
  });
});

describe('getScheduledTasksForDate', () => {
  it('returns empty array when no tasks match', () => {
    const tasks = [
      createTask({ id: '1', schedule: { type: 'weekdays', weekdays: [1] } }), // Monday only
    ];
    const result = getScheduledTasksForDate(tasks, '2025-01-15'); // Wednesday
    expect(result).toHaveLength(0);
  });

  it('returns matching tasks', () => {
    const tasks = [
      createTask({ id: '1', schedule: { type: 'daily' } }),
      createTask({ id: '2', schedule: { type: 'weekdays', weekdays: [3] } }), // Wednesday
      createTask({ id: '3', schedule: { type: 'weekdays', weekdays: [1] } }), // Monday
    ];
    const result = getScheduledTasksForDate(tasks, '2025-01-15'); // Wednesday
    expect(result).toHaveLength(2);
    expect(result.map(t => t.id)).toEqual(['1', '2']);
  });

  it('excludes archived tasks', () => {
    const tasks = [
      createTask({ id: '1', archived: true }),
      createTask({ id: '2', archived: false }),
    ];
    const result = getScheduledTasksForDate(tasks, '2025-01-15');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});

describe('isTaskCompleteForDate', () => {
  it('returns false when no completion exists', () => {
    const task = createTask({ targetPerDay: 1 });
    expect(isTaskCompleteForDate(task, undefined, '2025-01-15')).toBe(false);
  });

  it('returns true when completion count meets target', () => {
    const task = createTask({ targetPerDay: 1 });
    const completion = createCompletion({ countCompleted: 1 });
    expect(isTaskCompleteForDate(task, completion, '2025-01-15')).toBe(true);
  });

  it('returns true when completion count exceeds target', () => {
    const task = createTask({ targetPerDay: 1 });
    const completion = createCompletion({ countCompleted: 2 });
    expect(isTaskCompleteForDate(task, completion, '2025-01-15')).toBe(true);
  });

  it('returns false when completion count is less than target', () => {
    const task = createTask({ targetPerDay: 2 });
    const completion = createCompletion({ countCompleted: 1 });
    expect(isTaskCompleteForDate(task, completion, '2025-01-15')).toBe(false);
  });
});

describe('getTaskProgress', () => {
  it('returns 0 when no completion', () => {
    const task = createTask({ targetPerDay: 2 });
    expect(getTaskProgress(task, undefined)).toBe(0);
  });

  it('returns 0 when count is 0', () => {
    const task = createTask({ targetPerDay: 2 });
    const completion = createCompletion({ countCompleted: 0 });
    expect(getTaskProgress(task, completion)).toBe(0);
  });

  it('returns correct progress fraction', () => {
    const task = createTask({ targetPerDay: 2 });
    const completion = createCompletion({ countCompleted: 1 });
    expect(getTaskProgress(task, completion)).toBe(0.5);
  });

  it('caps progress at 1', () => {
    const task = createTask({ targetPerDay: 1 });
    const completion = createCompletion({ countCompleted: 2 });
    expect(getTaskProgress(task, completion)).toBe(1);
  });
});

describe('groupTasksByKind', () => {
  it('groups tasks correctly', () => {
    const tasks = [
      createTask({ id: '1', kind: 'habit' }),
      createTask({ id: '2', kind: 'chore' }),
      createTask({ id: '3', kind: 'custom' }),
      createTask({ id: '4', kind: 'habit' }),
    ];
    const result = groupTasksByKind(tasks);
    expect(result.habits).toHaveLength(2);
    expect(result.chores).toHaveLength(1);
    expect(result.custom).toHaveLength(1);
  });

  it('returns empty arrays when no tasks of a kind', () => {
    const tasks = [createTask({ kind: 'habit' })];
    const result = groupTasksByKind(tasks);
    expect(result.chores).toHaveLength(0);
    expect(result.custom).toHaveLength(0);
  });
});

describe('getScheduleDescription', () => {
  it('returns "Every day" for daily', () => {
    expect(getScheduleDescription({ type: 'daily' })).toBe('Every day');
  });

  it('returns weekday names for weekdays', () => {
    expect(getScheduleDescription({ type: 'weekdays', weekdays: [1, 3, 5] })).toBe(
      'Mon, Wed, Fri'
    );
  });

  it('returns "Every day" when all weekdays selected', () => {
    expect(
      getScheduleDescription({ type: 'weekdays', weekdays: [0, 1, 2, 3, 4, 5, 6] })
    ).toBe('Every day');
  });

  it('returns "No days selected" for empty weekdays', () => {
    expect(getScheduleDescription({ type: 'weekdays', weekdays: [] })).toBe('No days selected');
  });

  it('returns times per week description', () => {
    expect(getScheduleDescription({ type: 'times_per_week', timesPerWeek: 3 })).toBe(
      '3x per week'
    );
  });

  it('returns every N days description', () => {
    expect(getScheduleDescription({ type: 'every_n_days', everyNDays: 3 })).toBe('Every 3 days');
    expect(getScheduleDescription({ type: 'every_n_days', everyNDays: 2 })).toBe(
      'Every other day'
    );
    expect(getScheduleDescription({ type: 'every_n_days', everyNDays: 1 })).toBe('Every day');
  });
});

describe('getTaskSubtitle', () => {
  it('returns schedule description for single target', () => {
    const task = createTask({ targetPerDay: 1 });
    expect(getTaskSubtitle(task)).toBe('Every day');
  });

  it('includes target count for multi-target tasks', () => {
    const task = createTask({ targetPerDay: 2 });
    expect(getTaskSubtitle(task)).toBe('Every day · 2x daily');
  });
});
