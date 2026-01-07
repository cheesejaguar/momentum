import { openDB, type IDBPDatabase } from 'idb';
import type { Task, CompletionLog } from './types';
import { createSeedTasks } from './seedData';

const DB_NAME = 'momentum-db';
const DB_VERSION = 1;

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
    upgrade(db) {
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

      // Meta store for app state (e.g., seeded flag)
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
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

  if (includeArchived) {
    return tasks;
  }

  return tasks.filter(t => !t.archived);
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDB();
  return db.get('tasks', id);
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
export async function exportData(): Promise<{ tasks: Task[]; completions: CompletionLog[] }> {
  const db = await getDB();
  const tasks = await db.getAll('tasks');
  const completions = await db.getAll('completions');
  return { tasks, completions };
}

/**
 * Import data from backup
 */
export async function importData(data: {
  tasks: Task[];
  completions: CompletionLog[];
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
}
