# Momentum

A mobile-first web app for building momentum through daily habits and weekly chores. Built with evidence-based motivation design principles from Self-Determination Theory.

## Features

### Core Functionality
- **Daily Habits**: Track recurring daily tasks like brushing teeth, showering, and washing face
- **Weekly Chores**: 15-minute bite-sized tasks spread across the week
- **Custom Tasks**: Add your own tasks with flexible scheduling options
- **Implementation Intentions**: Link habits to triggers (e.g., "After I brush my teeth...")
- **Time of Day**: Schedule tasks for morning, afternoon, or evening

### Motivation Design
- **Momentum Score**: A supportive 0-100 score instead of judgmental letter grades
- **Focus Tasks**: Mark up to 3 tasks as priorities for consistency tracking
- **Dual Streak System**:
  - Consistency Streak: Did you show up today? (focus task or any task)
  - Perfect Day Streak: 100% completion days
- **Grace Days**: One per week to repair a streak without breaking it
- **Fresh Start**: Encouraging banners for new days and weeks
- **Microcopy System**: Autonomy-supportive language in 3 tones (Gentle, Coach, Minimal)
- **"What's Next" Suggestions**: Smart recommendations for the easiest remaining task

### Data & Display
- **Progress Tracking**: Visualize completion rates with charts and trends
- **Trend vs Last Week**: See how you're improving over time
- **Customizable Display**: Toggle letter grades, streaks, and fresh start banners
- **Offline-First**: All data stored locally using IndexedDB
- **Dark Mode**: Automatic dark mode support based on system preference
- **PWA-Ready**: Includes manifest for "Add to Home Screen" functionality

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

### Run Tests

```bash
npm test              # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── BottomNav.tsx      # Tab navigation
│   ├── EmptyState.tsx     # Empty state placeholder
│   ├── FocusSection.tsx   # Focus tasks section
│   ├── FreshStartBanner.tsx # New day/week banners
│   ├── GradeDisplay.tsx   # Grade badge component
│   ├── Layout.tsx         # Main layout wrapper
│   ├── LoadingSpinner.tsx
│   ├── Modal.tsx          # Modal dialog
│   ├── NextAction.tsx     # "What's next" suggestion
│   ├── ProgressCard.tsx   # Momentum score display
│   ├── TaskForm.tsx       # Add/edit task form
│   └── TaskRow.tsx        # Individual task display
├── copy/             # Microcopy system
│   └── microcopy.ts     # Tone-based messages
├── data/             # Data layer
│   ├── context.tsx      # React context for app state
│   ├── repository.ts    # IndexedDB operations
│   ├── seedData.ts      # Default tasks for new users
│   └── types.ts         # TypeScript type definitions
├── hooks/            # Custom hooks
│   └── useSettings.ts   # Settings management
├── screens/          # Main screens/pages
│   ├── TodayScreen.tsx    # Daily task view
│   ├── PlanScreen.tsx     # Task management (CRUD)
│   ├── ProgressScreen.tsx # Stats and charts
│   └── SettingsScreen.tsx # User preferences
├── utils/            # Utility functions
│   ├── date.ts          # Date manipulation helpers
│   ├── grading.ts       # Score/streak calculation
│   └── scheduling.ts    # Task scheduling logic
└── test/             # Test setup
    └── setup.ts
```

## Data Model

### Task

```typescript
interface Task {
  id: string;
  name: string;
  kind: 'habit' | 'chore' | 'custom';
  schedule: {
    type: 'daily' | 'weekdays' | 'times_per_week' | 'every_n_days';
    weekdays?: number[];
    timesPerWeek?: number;
    everyNDays?: number;
  };
  targetPerDay: number;
  notes?: string;
  focus?: boolean;              // Priority task for consistency
  when?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  trigger?: string;             // Implementation intention
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}
```

### Settings

```typescript
interface Settings {
  tone: 'gentle' | 'coach' | 'minimal';
  showLetterGrades: boolean;
  showStreaks: boolean;
  scoringMode: 'momentumScore' | 'letterGradeOnly' | 'both';
  scoringEmphasis: 'consistencyFirst' | 'allTasksEqual';
  enableReminders: boolean;
  showFreshStartBanner: boolean;
}
```

### Streak State

```typescript
interface StreakState {
  consistencyStreak: number;      // Days showing up
  lastConsistencyDate: string | null;
  perfectStreak: number;          // 100% days
  lastPerfectDate: string | null;
  graceDaysUsedThisWeek: number;  // 1 allowed per week
  graceDayWeekStart: string;
  bestConsistencyStreak: number;  // Personal best
  bestPerfectStreak: number;
}
```

### Scoring System

**Momentum Score (Primary)**
- 0-100 based on task completion percentage
- Supportive framing: "You're 75% done" not "You got a C"

**Letter Grades (Optional)**
| Grade | Percentage |
|-------|------------|
| A     | >= 90%     |
| B     | 80-89%     |
| C     | 70-79%     |
| D     | 60-69%     |
| F     | < 60%      |

## Microcopy Tones

**Gentle** (default): Warm, supportive messages
- "Every journey starts with a single step. You've got this."
- "You're so close! Just a little more."

**Coach**: Direct, action-focused
- "Let's build some momentum today."
- "Almost there. Finish strong."

**Minimal**: Brief, no-frills
- "Ready when you are."
- "Nearly done."

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4
- **Routing**: React Router v7
- **Storage**: IndexedDB (via `idb` library)
- **Charts**: Recharts
- **Testing**: Vitest + Testing Library

## Default Tasks

The app comes pre-seeded with:

**Daily Habits**
- Shower (1x/day)
- Brush teeth (2x/day)
- Wash face (1x/day)

**Weekly Chores (15 minutes each)**
- Monday: Kitchen tidy
- Tuesday: Bedroom reset
- Wednesday: Bathroom wipe-down
- Thursday: Laundry sort + start
- Friday: Laundry fold + put away
- Saturday: Floors quick sweep
- Sunday: Trash + reset week

## Design Philosophy

Momentum is built on principles from Self-Determination Theory:

1. **Autonomy**: Users choose their focus tasks and tone preferences
2. **Competence**: Progress bars, "You're close" messaging, and small wins
3. **Relatedness**: Supportive, warm language that feels like a friend

Key design decisions:
- No shame: Momentum Score replaces letter grades by default
- Fresh starts: Every day and week is a new opportunity
- Grace days: One "free pass" per week protects streaks
- Implementation intentions: Linking habits to triggers increases follow-through

## Future Improvements

- [ ] Cloud sync with authentication
- [ ] Push notifications/reminders
- [ ] Custom color themes
- [ ] Data export/import (JSON)
- [ ] Habit insights and analytics
- [ ] Social features (accountability partners)
- [ ] Widgets for iOS/Android home screen
- [ ] Voice input for task completion
- [ ] Apple Watch / Wear OS companion app
- [ ] Recurring task templates library
- [ ] Goal setting with milestones
- [ ] Gamification (achievements, levels)

## License

MIT
