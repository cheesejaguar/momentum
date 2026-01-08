import { v4 as uuidv4 } from 'uuid';
import type { Task } from './types';

// Default seed tasks for first-time users
export function createSeedTasks(): Task[] {
  const now = new Date().toISOString();

  return [
    // Daily habits
    {
      id: uuidv4(),
      name: 'Shower',
      kind: 'habit',
      schedule: { type: 'daily' },
      targetPerDay: 1,
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: uuidv4(),
      name: 'Brush teeth',
      kind: 'habit',
      schedule: { type: 'daily' },
      targetPerDay: 2, // Morning and evening
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: uuidv4(),
      name: 'Wash face',
      kind: 'habit',
      schedule: { type: 'daily' },
      targetPerDay: 1,
      createdAt: now,
      updatedAt: now,
      archived: false,
    },

    // Weekly chores - one per day (15-minute tasks)
    {
      id: uuidv4(),
      name: 'Kitchen tidy',
      kind: 'chore',
      schedule: { type: 'weekdays', weekdays: [1] }, // Monday
      targetPerDay: 1,
      notes: '15-minute quick clean',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: uuidv4(),
      name: 'Bedroom reset',
      kind: 'chore',
      schedule: { type: 'weekdays', weekdays: [2] }, // Tuesday
      targetPerDay: 1,
      notes: '15-minute tidy up',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: uuidv4(),
      name: 'Bathroom wipe-down',
      kind: 'chore',
      schedule: { type: 'weekdays', weekdays: [3] }, // Wednesday
      targetPerDay: 1,
      notes: '15-minute quick clean',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: uuidv4(),
      name: 'Laundry sort + start',
      kind: 'chore',
      schedule: { type: 'weekdays', weekdays: [4] }, // Thursday
      targetPerDay: 1,
      notes: '15 minutes',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: uuidv4(),
      name: 'Laundry fold + put away',
      kind: 'chore',
      schedule: { type: 'weekdays', weekdays: [5] }, // Friday
      targetPerDay: 1,
      notes: '15 minutes',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: uuidv4(),
      name: 'Floors quick sweep',
      kind: 'chore',
      schedule: { type: 'weekdays', weekdays: [6] }, // Saturday
      targetPerDay: 1,
      notes: '15-minute sweep',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
    {
      id: uuidv4(),
      name: 'Trash + reset week',
      kind: 'chore',
      schedule: { type: 'weekdays', weekdays: [0] }, // Sunday
      targetPerDay: 1,
      notes: '15-minute weekly reset',
      createdAt: now,
      updatedAt: now,
      archived: false,
    },
  ];
}
