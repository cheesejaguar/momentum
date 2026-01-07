# Momentum

A mobile-first web app for building momentum through daily habits and weekly chores. Track your progress, earn grades, and maintain streaks.

## Features

- **Daily Habits**: Track recurring daily tasks like brushing teeth, showering, and washing face
- **Weekly Chores**: 15-minute bite-sized tasks spread across the week
- **Custom Tasks**: Add your own tasks with flexible scheduling options
- **Progress Tracking**: Visualize your completion rates with charts and grades
- **Streaks**: Build momentum with consecutive days of success
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
│   ├── BottomNav.tsx    # Tab navigation
│   ├── EmptyState.tsx   # Empty state placeholder
│   ├── GradeDisplay.tsx # Grade badge component
│   ├── Layout.tsx       # Main layout wrapper
│   ├── LoadingSpinner.tsx
│   ├── Modal.tsx        # Modal dialog
│   ├── TaskForm.tsx     # Add/edit task form
│   └── TaskRow.tsx      # Individual task display
├── data/             # Data layer
│   ├── context.tsx      # React context for app state
│   ├── repository.ts    # IndexedDB operations
│   ├── seedData.ts      # Default tasks for new users
│   └── types.ts         # TypeScript type definitions
├── screens/          # Main screens/pages
│   ├── TodayScreen.tsx  # Daily task view
│   ├── PlanScreen.tsx   # Task management (CRUD)
│   └── ProgressScreen.tsx # Stats and charts
├── utils/            # Utility functions
│   ├── date.ts          # Date manipulation helpers
│   ├── grading.ts       # Grade calculation
│   └── scheduling.ts    # Task scheduling logic
└── test/             # Test setup
    └── setup.ts
```

## Data Model

### Task

```typescript
interface Task {
  id: string;           // UUID
  name: string;         // Display name
  kind: 'habit' | 'chore' | 'custom';
  schedule: {
    type: 'daily' | 'weekdays' | 'times_per_week' | 'every_n_days';
    weekdays?: number[];      // 0=Sun, 1=Mon, ..., 6=Sat
    timesPerWeek?: number;    // For "X times per week"
    everyNDays?: number;      // For "every N days"
  };
  targetPerDay: number;  // How many times per day (e.g., 2 for brushing teeth)
  notes?: string;
  createdAt: string;     // ISO timestamp
  updatedAt: string;
  archived: boolean;
}
```

### Completion Log

```typescript
interface CompletionLog {
  id: string;
  taskId: string;
  date: string;          // YYYY-MM-DD
  countCompleted: number;
  timestamps: string[];  // When each tap occurred
}
```

### Grading System

| Grade | Percentage |
|-------|------------|
| A     | >= 90%     |
| B     | 80-89%     |
| C     | 70-79%     |
| D     | 60-69%     |
| F     | < 60%      |

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
