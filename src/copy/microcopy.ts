import type { ToneType } from '../data/types';

/**
 * Microcopy system with tone variants
 * Follows autonomy-supportive language principles:
 * - Avoid "should", "must", "have to"
 * - Use "want to", "you can", "try", "choose"
 * - Be warm but not cheesy
 */

type CopyVariants = {
  gentle: string;
  coach: string;
  minimal: string;
};

// Helper to get copy by tone
export function getCopy(variants: CopyVariants, tone: ToneType): string {
  return variants[tone];
}

// ============ Progress Messages ============

export const progressMessages = {
  justStarting: {
    gentle: "Every journey starts with a single step. You've got this.",
    coach: "Let's build some momentum today.",
    minimal: "Ready when you are.",
  },
  makingProgress: {
    gentle: "You're making progress. Keep going at your own pace.",
    coach: "Good momentum building. Keep it up.",
    minimal: "Making progress.",
  },
  almostThere: {
    gentle: "You're so close! Just a little more.",
    coach: "Almost there. Finish strong.",
    minimal: "Nearly done.",
  },
  allDone: {
    gentle: "You did it! Take a moment to appreciate your effort.",
    coach: "All done. Great work today.",
    minimal: "Complete.",
  },
  perfectDay: {
    gentle: "A perfect day! You showed up for yourself.",
    coach: "100% today. That's how it's done.",
    minimal: "Perfect day.",
  },
};

// Get progress message based on percentage
export function getProgressMessage(percentage: number, tone: ToneType): string {
  if (percentage === 0) {
    return getCopy(progressMessages.justStarting, tone);
  } else if (percentage < 70) {
    return getCopy(progressMessages.makingProgress, tone);
  } else if (percentage < 100) {
    return getCopy(progressMessages.almostThere, tone);
  } else {
    return getCopy(progressMessages.perfectDay, tone);
  }
}

// ============ Completion Celebrations ============

// Rotating completion messages (tasteful, not manipulative)
export const completionCelebrations = {
  gentle: [
    "Nice work.",
    "One more thing done.",
    "Well done.",
    "That's progress.",
    "Good going.",
  ],
  coach: [
    "Done.",
    "Checked off.",
    "Moving forward.",
    "Progress made.",
    "Next.",
  ],
  minimal: [
    "Done.",
    "✓",
    "Complete.",
    "Done.",
    "✓",
  ],
};

// Get a completion message (cycles through based on count)
export function getCompletionMessage(completionCount: number, tone: ToneType): string {
  const messages = completionCelebrations[tone];
  return messages[completionCount % messages.length];
}

// Final task completion (micro-celebration)
export const lastTaskMessages = {
  gentle: "That was your last one! You've completed everything for today.",
  coach: "All tasks done. Solid day.",
  minimal: "All complete.",
};

// ============ Streak Messages ============

export const streakMessages = {
  streakContinues: {
    gentle: (days: number) => `${days} days of consistency. You're building something great.`,
    coach: (days: number) => `${days} day streak. Keep the chain going.`,
    minimal: (days: number) => `${days} day streak.`,
  },
  streakPaused: {
    gentle: "Your streak is paused. Want to use a grace day to keep it going?",
    coach: "Streak paused. Use a grace day?",
    minimal: "Streak paused. Use grace day?",
  },
  graceDayUsed: {
    gentle: "Grace day used. Your streak continues!",
    coach: "Grace day applied. Streak saved.",
    minimal: "Grace day used.",
  },
  noGraceDaysLeft: {
    gentle: "No grace days left this week. That's okay—every week is a fresh start.",
    coach: "No grace days remaining. New week resets it.",
    minimal: "No grace days left.",
  },
  newStreak: {
    gentle: "Starting fresh. Every day is a new opportunity.",
    coach: "New streak starting. Let's go.",
    minimal: "New streak.",
  },
};

// ============ Fresh Start Messages ============

export const freshStartMessages = {
  newDay: {
    gentle: "Good morning! A new day, a fresh start.",
    coach: "New day. What's the focus?",
    minimal: "New day.",
  },
  newWeek: {
    gentle: "A new week begins. What would you like to focus on?",
    coach: "New week. Time to set your priorities.",
    minimal: "New week.",
  },
  missedYesterday: {
    gentle: "Yesterday didn't go as planned? That's okay. Today is here.",
    coach: "Missed yesterday? Today's a reset.",
    minimal: "New day.",
  },
  encourageReturn: {
    gentle: "Welcome back! No pressure—start wherever feels right.",
    coach: "Back at it. Pick one thing to start.",
    minimal: "Welcome back.",
  },
};

// ============ Focus Task Messages ============

export const focusMessages = {
  setFocus: {
    gentle: "Choose up to 3 tasks to focus on today.",
    coach: "Select your priorities.",
    minimal: "Set focus tasks.",
  },
  focusComplete: {
    gentle: "You've completed your focus tasks! Everything else is a bonus.",
    coach: "Focus tasks done. Bonus time.",
    minimal: "Focus complete.",
  },
  suggestFocus: {
    gentle: "Want to set some focus tasks for today?",
    coach: "Set your focus?",
    minimal: "Set focus?",
  },
};

// ============ Next Action Messages ============

export const nextActionMessages = {
  suggestion: {
    gentle: (taskName: string) => `Try "${taskName}" next—it's a quick one.`,
    coach: (taskName: string) => `Next up: ${taskName}`,
    minimal: (taskName: string) => `Next: ${taskName}`,
  },
  noTasksLeft: {
    gentle: "You've done everything! Enjoy your free time.",
    coach: "All clear.",
    minimal: "Done.",
  },
};

// ============ Settings Descriptions ============

export const settingsDescriptions = {
  tone: {
    gentle: "Warm, supportive messages that encourage without pressure.",
    coach: "Direct, action-focused language to keep you moving.",
    minimal: "Brief, no-frills messages.",
  },
  scoringEmphasis: {
    consistencyFirst: "Focus tasks count slightly more toward your score.",
    allTasksEqual: "All tasks contribute equally to your score.",
  },
  letterGrades: "Show letter grades (A-F) alongside your momentum score.",
  streaks: "Track your consistency and perfect day streaks.",
  reminders: "Get gentle reminders based on your task timing preferences.",
  freshStart: "See a fresh start banner at the beginning of each day and week.",
};

// ============ Empty States ============

export const emptyStates = {
  noTasksToday: {
    gentle: "Nothing scheduled for today. Want to add something?",
    coach: "No tasks today. Add one?",
    minimal: "No tasks.",
  },
  noTasksYet: {
    gentle: "Add some tasks to start building momentum.",
    coach: "Add tasks to begin.",
    minimal: "Add tasks.",
  },
  noProgressYet: {
    gentle: "Complete some tasks to see your progress here.",
    coach: "Progress will show once you start.",
    minimal: "No data yet.",
  },
};

// ============ When Labels ============

export const whenLabels: Record<string, CopyVariants> = {
  morning: {
    gentle: "Morning",
    coach: "AM",
    minimal: "AM",
  },
  afternoon: {
    gentle: "Afternoon",
    coach: "Midday",
    minimal: "PM",
  },
  evening: {
    gentle: "Evening",
    coach: "PM",
    minimal: "Eve",
  },
  anytime: {
    gentle: "Anytime",
    coach: "Flexible",
    minimal: "Any",
  },
};

// ============ Trend Messages ============

export const trendMessages = {
  improving: {
    gentle: (delta: number) => `Up ${delta}% from last week. You're growing!`,
    coach: (delta: number) => `+${delta}% vs last week.`,
    minimal: (delta: number) => `+${delta}%`,
  },
  steady: {
    gentle: "Holding steady from last week. Consistency is key.",
    coach: "Same as last week.",
    minimal: "Steady.",
  },
  declining: {
    gentle: (delta: number) => `Down ${Math.abs(delta)}% from last week. That's okay—this week is fresh.`,
    coach: (delta: number) => `${delta}% vs last week. Room to grow.`,
    minimal: (delta: number) => `${delta}%`,
  },
};

export function getTrendMessage(delta: number, tone: ToneType): string {
  if (delta > 2) {
    return trendMessages.improving[tone](delta);
  } else if (delta < -2) {
    return trendMessages.declining[tone](delta);
  } else {
    return getCopy(trendMessages.steady, tone);
  }
}
