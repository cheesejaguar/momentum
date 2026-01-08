import { openDB, type IDBPDatabase } from 'idb';
import type { Task, CompletionLog, Settings, StreakState } from './types';
import { createSeedTasks } from './seedData';

const DB_NAME = 'momentum-db';
const DB_VERSION = 2; // Bumped for new stores

interface MomentumDB {
  tasks: Task;
  completions: CompletionLog;
  meta: { key: string; value: string };
}

let dbInstance: IDBPDatabase<MomentumDB> | null = null;

/**
 * Initialize and get the database instance
 */
async function getDB(): Promise<IDBPDatabase<MomentumDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<MomentumDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, _transaction) {
      // Tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }

      // Completions store with index on taskId and date
      if (!db.objectStoreNames.contains('completions')) {
        const completionsStore = db.createObjectStore('completions', { keyPath: 'id' });
        completionsStore.createIndex('taskId', 'taskId');
        completionsStore.createIndex('date', 'date');
        completionsStore.createIndex('taskId_date', ['taskId', 'date']);
      }

      // Meta store for app state (e.g., seeded flag, settings, streaks)
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }

      // Migration from v1 to v2: no schema changes needed, just use meta store for settings/streaks
      if (oldVersion < 2) {
        // Settings and streaks will be stored in meta store
        // No additional stores needed
      }
    },
  });

  return dbInstance;
}

// ============ Task Operations ============

/**
 * Get all tasks (non-archived by default)
 */
export async function getAllTasks(includeArchived = false): Promise<Task[]> {
  const db = await getDB();
  const tasks = await db.getAll('tasks');

  // Migration: ensure all tasks have new fields with defaults
  const migratedTasks = tasks.map(task => ({
    ...task,
    focus: task.focus ?? false,
    when: task.when ?? undefined,
    trigger: task.trigger ?? undefined,
  }));

  if (includeArchived) {
    return migratedTasks;
  }

  return migratedTasks.filter(t => !t.archived);
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDB();
  const task = await db.get('tasks', id);
  if (task) {
    // Migration: ensure new fields
    return {
      ...task,
      focus: task.focus ?? false,
      when: task.when ?? undefined,
      trigger: task.trigger ?? undefined,
    };
  }
  return undefined;
}

/**
 * Create a new task
 */
export async function createTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put('tasks', task);
}

/**
 * Update an existing task
 */
export async function updateTask(task: Task): Promise<void> {
  const db = await getDB();
  task.updatedAt = new Date().toISOString();
  await db.put('tasks', task);
}

/**
 * Delete a task (and its completions)
 */
export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();

  // Delete associated completions
  const tx = db.transaction(['tasks', 'completions'], 'readwrite');
  const completionsStore = tx.objectStore('completions');
  const taskIdIndex = completionsStore.index('taskId');

  let cursor = await taskIdIndex.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.objectStore('tasks').delete(id);
  await tx.done;
}

/**
 * Archive a task (soft delete)
 */
export async function archiveTask(id: string): Promise<void> {
  const db = await getDB();
  const task = await db.get('tasks', id);
  if (task) {
    task.archived = true;
    task.updatedAt = new Date().toISOString();
    await db.put('tasks', task);
  }
}

/**
 * Unarchive a task
 */
export async function unarchiveTask(id: string): Promise<void> {
  const db = await getDB();
  const task = await db.get('tasks', id);
  if (task) {
    task.archived = false;
    task.updatedAt = new Date().toISOString();
    await db.put('tasks', task);
  }
}

/**
 * Set focus status on a task
 */
export async function setTaskFocus(id: string, focus: boolean): Promise<void> {
  const db = await getDB();
  const task = await db.get('tasks', id);
  if (task) {
    task.focus = focus;
    task.updatedAt = new Date().toISOString();
    await db.put('tasks', task);
  }
}

// ============ Completion Operations ============

/**
 * Get all completions
 */
export async function getAllCompletions(): Promise<CompletionLog[]> {
  const db = await getDB();
  return db.getAll('completions');
}

/**
 * Get completions for a specific date
 */
export async function getCompletionsForDate(date: string): Promise<CompletionLog[]> {
  const db = await getDB();
  const index = db.transaction('completions').objectStore('completions').index('date');
  return index.getAll(date);
}

/**
 * Get completion for a specific task and date
 */
export async function getCompletion(
  taskId: string,
  date: string
): Promise<CompletionLog | undefined> {
  const db = await getDB();
  const index = db.transaction('completions').objectStore('completions').index('taskId_date');
  return index.get([taskId, date]);
}

/**
 * Create or update a completion log
 */
export async function upsertCompletion(completion: CompletionLog): Promise<void> {
  const db = await getDB();
  await db.put('completions', completion);
}

/**
 * Delete a completion
 */
export async function deleteCompletion(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('completions', id);
}

// ============ Settings Operations ============

const SETTINGS_KEY = 'settings';
const DEFAULT_SETTINGS_VALUE: Settings = {
  tone: 'gentle',
  showLetterGrades: false,
  showStreaks: true,
  scoringMode: 'momentumScore',
  scoringEmphasis: 'allTasksEqual',
  enableReminders: false,
  showFreshStartBanner: true,
};

/**
 * Get user settings
 */
export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const meta = await db.get('meta', SETTINGS_KEY);
  if (meta?.value) {
    try {
      const parsed = JSON.parse(meta.value);
      // Merge with defaults to handle new fields
      return { ...DEFAULT_SETTINGS_VALUE, ...parsed };
    } catch {
      return DEFAULT_SETTINGS_VALUE;
    }
  }
  return DEFAULT_SETTINGS_VALUE;
}

/**
 * Save user settings
 */
export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('meta', { key: SETTINGS_KEY, value: JSON.stringify(settings) });
}

// ============ Streak Operations ============

const STREAKS_KEY = 'streaks';
const DEFAULT_STREAKS_VALUE: StreakState = {
  consistencyStreak: 0,
  lastConsistencyDate: null,
  perfectStreak: 0,
  lastPerfectDate: null,
  graceDaysUsedThisWeek: 0,
  graceDayWeekStart: '',
  bestConsistencyStreak: 0,
  bestPerfectStreak: 0,
};

/**
 * Get streak state
 */
export async function getStreaks(): Promise<StreakState> {
  const db = await getDB();
  const meta = await db.get('meta', STREAKS_KEY);
  if (meta?.value) {
    try {
      const parsed = JSON.parse(meta.value);
      return { ...DEFAULT_STREAKS_VALUE, ...parsed };
    } catch {
      return DEFAULT_STREAKS_VALUE;
    }
  }
  return DEFAULT_STREAKS_VALUE;
}

/**
 * Save streak state
 */
export async function saveStreaks(streaks: StreakState): Promise<void> {
  const db = await getDB();
  await db.put('meta', { key: STREAKS_KEY, value: JSON.stringify(streaks) });
}

// ============ Fresh Start Operations ============

const LAST_OPEN_KEY = 'lastOpenDate';
const FOCUS_TASKS_KEY = 'focusTasks';

/**
 * Get last open date
 */
export async function getLastOpenDate(): Promise<string | null> {
  const db = await getDB();
  const meta = await db.get('meta', LAST_OPEN_KEY);
  return meta?.value ?? null;
}

/**
 * Save last open date
 */
export async function saveLastOpenDate(date: string): Promise<void> {
  const db = await getDB();
  await db.put('meta', { key: LAST_OPEN_KEY, value: date });
}

/**
 * Get focus task IDs for today
 */
export async function getFocusTasks(): Promise<string[]> {
  const db = await getDB();
  const meta = await db.get('meta', FOCUS_TASKS_KEY);
  if (meta?.value) {
    try {
      return JSON.parse(meta.value);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Save focus task IDs
 */
export async function saveFocusTasks(taskIds: string[]): Promise<void> {
  const db = await getDB();
  await db.put('meta', { key: FOCUS_TASKS_KEY, value: JSON.stringify(taskIds) });
}

// ============ Initialization ============

/**
 * Check if this is the first run and seed data if needed
 */
export async function initializeAppData(): Promise<void> {
  const db = await getDB();

  // Check if we've already seeded
  const seededFlag = await db.get('meta', 'seeded');

  if (!seededFlag) {
    // First run - seed default tasks
    const seedTasks = createSeedTasks();

    const tx = db.transaction('tasks', 'readwrite');
    for (const task of seedTasks) {
      await tx.store.put(task);
    }
    await tx.done;

    // Mark as seeded
    await db.put('meta', { key: 'seeded', value: 'true' });
  }

  // Ensure settings exist
  const settings = await getSettings();
  await saveSettings(settings);

  // Ensure streaks exist
  const streaks = await getStreaks();
  await saveStreaks(streaks);
}

/**
 * Clear all data (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(['tasks', 'completions', 'meta'], 'readwrite');
  await tx.objectStore('tasks').clear();
  await tx.objectStore('completions').clear();
  await tx.objectStore('meta').clear();
  await tx.done;
}

/**
 * Export all data for backup
 */
export async function exportData(): Promise<{
  tasks: Task[];
  completions: CompletionLog[];
  settings: Settings;
  streaks: StreakState;
}> {
  const db = await getDB();
  const tasks = await db.getAll('tasks');
  const completions = await db.getAll('completions');
  const settings = await getSettings();
  const streaks = await getStreaks();
  return { tasks, completions, settings, streaks };
}

/**
 * Import data from backup
 */
export async function importData(data: {
  tasks: Task[];
  completions: CompletionLog[];
  settings?: Settings;
  streaks?: StreakState;
}): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(['tasks', 'completions'], 'readwrite');

  for (const task of data.tasks) {
    await tx.objectStore('tasks').put(task);
  }

  for (const completion of data.completions) {
    await tx.objectStore('completions').put(completion);
  }

  await tx.done;

  if (data.settings) {
    await saveSettings(data.settings);
  }
  if (data.streaks) {
    await saveStreaks(data.streaks);
  }
}
