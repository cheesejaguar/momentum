// Core data types for Momentum app

export type TaskKind = 'habit' | 'chore' | 'custom';

export type ScheduleType = 'daily' | 'weekdays' | 'times_per_week' | 'every_n_days';

export interface TaskSchedule {
  type: ScheduleType;
  weekdays?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  timesPerWeek?: number;
  everyNDays?: number;
}

export interface Task {
  id: string;
  name: string;
  kind: TaskKind;
  schedule: TaskSchedule;
  targetPerDay: number; // default 1; brush teeth = 2
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  archived: boolean;
}

export interface CompletionLog {
  id: string;
  taskId: string;
  date: string; // YYYY-MM-DD format in local time
  countCompleted: number;
  timestamps: string[]; // ISO timestamps for each completion tap
}

// Grade type
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

// For displaying tasks on a given day
export interface ScheduledTask {
  task: Task;
  completion: CompletionLog | null;
  isComplete: boolean;
  progress: number; // 0-1
}

// Stats for progress tracking
export interface DayStats {
  date: string;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  grade: Grade;
}

export interface WeekStats {
  weekStartDate: string;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  grade: Grade;
  dailyStats: DayStats[];
}

// App state for context
export interface AppState {
  tasks: Task[];
  completions: CompletionLog[];
  isLoading: boolean;
  error: string | null;
}
