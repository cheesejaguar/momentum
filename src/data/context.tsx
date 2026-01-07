import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task, CompletionLog, AppState } from './types';
import * as repo from './repository';
import { getLocalDateString } from '../utils/date';

interface AppContextType extends AppState {
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;

  // Completion operations
  incrementCompletion: (taskId: string, date?: string) => Promise<void>;
  decrementCompletion: (taskId: string, date?: string) => Promise<void>;
  setCompletion: (taskId: string, count: number, date?: string) => Promise<void>;

  // Data management
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    tasks: [],
    completions: [],
    isLoading: true,
    error: null,
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Initialize (seeds on first run)
      await repo.initializeAppData();

      // Load all data
      const [tasks, completions] = await Promise.all([
        repo.getAllTasks(),
        repo.getAllCompletions(),
      ]);

      setState({
        tasks,
        completions,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  };

  const refreshData = useCallback(async () => {
    await loadData();
  }, []);

  const addTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => {
      const now = new Date().toISOString();
      const task: Task = {
        ...taskData,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        archived: false,
      };

      await repo.createTask(task);
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, task],
      }));
    },
    []
  );

  const updateTask = useCallback(async (task: Task) => {
    await repo.updateTask(task);
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === task.id ? { ...task, updatedAt: new Date().toISOString() } : t)),
    }));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await repo.deleteTask(id);
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
      completions: prev.completions.filter(c => c.taskId !== id),
    }));
  }, []);

  const archiveTask = useCallback(async (id: string) => {
    await repo.archiveTask(id);
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id), // Remove from active list
    }));
  }, []);

  const getOrCreateCompletion = useCallback(
    (taskId: string, date: string): CompletionLog => {
      const existing = state.completions.find(c => c.taskId === taskId && c.date === date);
      if (existing) {
        return existing;
      }
      return {
        id: uuidv4(),
        taskId,
        date,
        countCompleted: 0,
        timestamps: [],
      };
    },
    [state.completions]
  );

  const incrementCompletion = useCallback(
    async (taskId: string, date?: string) => {
      const targetDate = date ?? getLocalDateString();
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      const completion = getOrCreateCompletion(taskId, targetDate);

      // Don't exceed target
      if (completion.countCompleted >= task.targetPerDay) {
        return;
      }

      const updatedCompletion: CompletionLog = {
        ...completion,
        countCompleted: completion.countCompleted + 1,
        timestamps: [...completion.timestamps, new Date().toISOString()],
      };

      await repo.upsertCompletion(updatedCompletion);

      setState(prev => {
        const existingIndex = prev.completions.findIndex(
          c => c.taskId === taskId && c.date === targetDate
        );

        if (existingIndex >= 0) {
          const newCompletions = [...prev.completions];
          newCompletions[existingIndex] = updatedCompletion;
          return { ...prev, completions: newCompletions };
        } else {
          return { ...prev, completions: [...prev.completions, updatedCompletion] };
        }
      });
    },
    [state.tasks, getOrCreateCompletion]
  );

  const decrementCompletion = useCallback(
    async (taskId: string, date?: string) => {
      const targetDate = date ?? getLocalDateString();

      const completion = state.completions.find(c => c.taskId === taskId && c.date === targetDate);
      if (!completion || completion.countCompleted <= 0) {
        return;
      }

      const updatedCompletion: CompletionLog = {
        ...completion,
        countCompleted: completion.countCompleted - 1,
        timestamps: completion.timestamps.slice(0, -1),
      };

      if (updatedCompletion.countCompleted === 0) {
        await repo.deleteCompletion(completion.id);
        setState(prev => ({
          ...prev,
          completions: prev.completions.filter(c => c.id !== completion.id),
        }));
      } else {
        await repo.upsertCompletion(updatedCompletion);
        setState(prev => ({
          ...prev,
          completions: prev.completions.map(c =>
            c.id === completion.id ? updatedCompletion : c
          ),
        }));
      }
    },
    [state.completions]
  );

  const setCompletion = useCallback(
    async (taskId: string, count: number, date?: string) => {
      const targetDate = date ?? getLocalDateString();
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      const clampedCount = Math.max(0, Math.min(count, task.targetPerDay));
      const completion = getOrCreateCompletion(taskId, targetDate);

      if (clampedCount === 0) {
        const existing = state.completions.find(c => c.taskId === taskId && c.date === targetDate);
        if (existing) {
          await repo.deleteCompletion(existing.id);
          setState(prev => ({
            ...prev,
            completions: prev.completions.filter(c => c.id !== existing.id),
          }));
        }
        return;
      }

      const updatedCompletion: CompletionLog = {
        ...completion,
        countCompleted: clampedCount,
        timestamps:
          clampedCount > completion.countCompleted
            ? [
                ...completion.timestamps,
                ...Array(clampedCount - completion.countCompleted)
                  .fill(null)
                  .map(() => new Date().toISOString()),
              ]
            : completion.timestamps.slice(0, clampedCount),
      };

      await repo.upsertCompletion(updatedCompletion);

      setState(prev => {
        const existingIndex = prev.completions.findIndex(
          c => c.taskId === taskId && c.date === targetDate
        );

        if (existingIndex >= 0) {
          const newCompletions = [...prev.completions];
          newCompletions[existingIndex] = updatedCompletion;
          return { ...prev, completions: newCompletions };
        } else {
          return { ...prev, completions: [...prev.completions, updatedCompletion] };
        }
      });
    },
    [state.tasks, state.completions, getOrCreateCompletion]
  );

  const value: AppContextType = {
    ...state,
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
    incrementCompletion,
    decrementCompletion,
    setCompletion,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
