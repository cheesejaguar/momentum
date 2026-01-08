// Core data types for Momentum app

export type TaskKind = 'habit' | 'chore' | 'custom';

export type ScheduleType = 'daily' | 'weekdays' | 'times_per_week' | 'every_n_days';

// Implementation intentions: when to do a task
export type TaskWhen = 'morning' | 'afternoon' | 'evening' | 'anytime';

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
  // New fields for motivation design
  focus?: boolean; // Is this a Focus task?
  when?: TaskWhen; // When to do it (implementation intention)
  trigger?: string; // Contextual cue e.g., "after coffee"
}

export interface CompletionLog {
  id: string;
  taskId: string;
  date: string; // YYYY-MM-DD format in local time
  countCompleted: number;
  timestamps: string[]; // ISO timestamps for each completion tap
}

// Grade type (now optional, secondary to momentum score)
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

// Tone options for microcopy
export type ToneType = 'gentle' | 'coach' | 'minimal';

// Scoring mode options
export type ScoringMode = 'momentumScore' | 'letterGradeOnly' | 'both';

// Scoring emphasis
export type ScoringEmphasis = 'consistencyFirst' | 'allTasksEqual';

// User settings
export interface Settings {
  tone: ToneType;
  showLetterGrades: boolean; // Off by default
  showStreaks: boolean;
  scoringMode: ScoringMode;
  scoringEmphasis: ScoringEmphasis;
  enableReminders: boolean;
  // Fresh start preferences
  showFreshStartBanner: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  tone: 'gentle',
  showLetterGrades: false,
  showStreaks: true,
  scoringMode: 'momentumScore',
  scoringEmphasis: 'allTasksEqual',
  enableReminders: false,
  showFreshStartBanner: true,
};

// Streak tracking
export interface StreakState {
  // Consistency streak: completed at least one Focus task per day
  consistencyStreak: number;
  lastConsistencyDate: string | null; // YYYY-MM-DD

  // Perfect day streak: 100% completion (de-emphasized)
  perfectStreak: number;
  lastPerfectDate: string | null;

  // Grace day tracking (1 per week)
  graceDaysUsedThisWeek: number;
  graceDayWeekStart: string; // YYYY-MM-DD of week start

  // Historical bests
  bestConsistencyStreak: number;
  bestPerfectStreak: number;
}

export const DEFAULT_STREAK_STATE: StreakState = {
  consistencyStreak: 0,
  lastConsistencyDate: null,
  perfectStreak: 0,
  lastPerfectDate: null,
  graceDaysUsedThisWeek: 0,
  graceDayWeekStart: '',
  bestConsistencyStreak: 0,
  bestPerfectStreak: 0,
};

// For displaying tasks on a given day
export interface ScheduledTask {
  task: Task;
  completion: CompletionLog | null;
  isComplete: boolean;
  progress: number; // 0-1
}

// Stats for progress tracking (enhanced with momentum score)
export interface DayStats {
  date: string;
  totalTasks: number;
  completedTasks: number;
  percentage: number; // This is now the momentum score (0-100)
  grade: Grade; // Optional, secondary
  // New fields
  totalTarget: number; // Sum of all targetPerDay
  totalCompleted: number; // Sum of all completed counts
  focusTasksCompleted: number;
  focusTasksTotal: number;
  wins: string[]; // Names of completed tasks
}

export interface WeekStats {
  weekStartDate: string;
  totalTasks: number;
  completedTasks: number;
  percentage: number; // Weekly momentum score
  grade: Grade;
  dailyStats: DayStats[];
  // New fields
  trendVsLastWeek: number; // Positive = improvement, negative = decline
  consistencyDays: number; // Days where at least one Focus task was done
  perfectDays: number; // Days with 100% completion
}

// App state for context
// Note: Settings and Streaks are managed separately via useSettings hook and repository
export interface AppState {
  tasks: Task[];
  completions: CompletionLog[];
  isLoading: boolean;
  error: string | null;
}

// Fresh start state
export interface FreshStartState {
  isNewDay: boolean;
  isNewWeek: boolean;
  lastOpenDate: string | null;
  focusTasks: string[]; // Task IDs selected as focus
}
