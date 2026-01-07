import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  parseLocalDate,
  getDayOfWeek,
  getLastNDays,
  getWeekStart,
  getWeekEnd,
  getWeekDates,
  getLastNWeekStarts,
  daysBetween,
  formatDateForDisplay,
  formatDayShort,
  isSameDay,
  isToday,
  getWeekdayName,
  getWeekdayShort,
} from './date';

describe('getLocalDateString', () => {
  it('returns date in YYYY-MM-DD format', () => {
    const date = new Date(2025, 0, 15); // Jan 15, 2025
    expect(getLocalDateString(date)).toBe('2025-01-15');
  });

  it('pads single digit months and days', () => {
    const date = new Date(2025, 2, 5); // Mar 5, 2025
    expect(getLocalDateString(date)).toBe('2025-03-05');
  });

  it('uses current date when no argument provided', () => {
    const result = getLocalDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD string to Date at midnight', () => {
    const date = parseLocalDate('2025-01-15');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });

  it('handles different months correctly', () => {
    const date = parseLocalDate('2025-12-25');
    expect(date.getMonth()).toBe(11); // December
    expect(date.getDate()).toBe(25);
  });
});

describe('getDayOfWeek', () => {
  it('returns 0 for Sunday', () => {
    expect(getDayOfWeek('2025-01-05')).toBe(0); // Jan 5, 2025 is Sunday
  });

  it('returns 1 for Monday', () => {
    expect(getDayOfWeek('2025-01-06')).toBe(1);
  });

  it('returns 6 for Saturday', () => {
    expect(getDayOfWeek('2025-01-04')).toBe(6);
  });
});

describe('getLastNDays', () => {
  it('returns correct number of days', () => {
    const fromDate = new Date(2025, 0, 15);
    const days = getLastNDays(7, fromDate);
    expect(days).toHaveLength(7);
  });

  it('includes today as the last element', () => {
    const fromDate = new Date(2025, 0, 15);
    const days = getLastNDays(7, fromDate);
    expect(days[6]).toBe('2025-01-15');
  });

  it('starts from N-1 days ago', () => {
    const fromDate = new Date(2025, 0, 15);
    const days = getLastNDays(7, fromDate);
    expect(days[0]).toBe('2025-01-09');
  });

  it('returns days in chronological order', () => {
    const fromDate = new Date(2025, 0, 15);
    const days = getLastNDays(3, fromDate);
    expect(days).toEqual(['2025-01-13', '2025-01-14', '2025-01-15']);
  });
});

describe('getWeekStart', () => {
  it('returns Sunday for any day in the week', () => {
    // Wednesday
    expect(getWeekStart('2025-01-15')).toBe('2025-01-12');
  });

  it('returns same date for Sunday', () => {
    expect(getWeekStart('2025-01-12')).toBe('2025-01-12');
  });

  it('returns previous Sunday for Saturday', () => {
    expect(getWeekStart('2025-01-18')).toBe('2025-01-12');
  });
});

describe('getWeekEnd', () => {
  it('returns Saturday for any day in the week', () => {
    expect(getWeekEnd('2025-01-15')).toBe('2025-01-18');
  });

  it('returns same date for Saturday', () => {
    expect(getWeekEnd('2025-01-18')).toBe('2025-01-18');
  });

  it('returns next Saturday for Sunday', () => {
    expect(getWeekEnd('2025-01-12')).toBe('2025-01-18');
  });
});

describe('getWeekDates', () => {
  it('returns 7 dates starting from week start', () => {
    const dates = getWeekDates('2025-01-12');
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe('2025-01-12'); // Sunday
    expect(dates[6]).toBe('2025-01-18'); // Saturday
  });

  it('returns consecutive dates', () => {
    const dates = getWeekDates('2025-01-12');
    expect(dates).toEqual([
      '2025-01-12',
      '2025-01-13',
      '2025-01-14',
      '2025-01-15',
      '2025-01-16',
      '2025-01-17',
      '2025-01-18',
    ]);
  });
});

describe('getLastNWeekStarts', () => {
  it('returns correct number of week starts', () => {
    const fromDate = new Date(2025, 0, 15);
    const weeks = getLastNWeekStarts(4, fromDate);
    expect(weeks).toHaveLength(4);
  });

  it('returns week starts in chronological order', () => {
    const fromDate = new Date(2025, 0, 15);
    const weeks = getLastNWeekStarts(3, fromDate);
    expect(weeks[2]).toBe('2025-01-12'); // Current week
    expect(weeks[1]).toBe('2025-01-05'); // Previous week
    expect(weeks[0]).toBe('2024-12-29'); // Two weeks ago
  });
});

describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2025-01-15', '2025-01-15')).toBe(0);
  });

  it('returns correct difference for consecutive days', () => {
    expect(daysBetween('2025-01-15', '2025-01-16')).toBe(1);
  });

  it('returns correct difference for a week', () => {
    expect(daysBetween('2025-01-15', '2025-01-22')).toBe(7);
  });

  it('returns absolute difference regardless of order', () => {
    expect(daysBetween('2025-01-22', '2025-01-15')).toBe(7);
  });
});

describe('formatDateForDisplay', () => {
  it('formats date with weekday, month, and day', () => {
    const formatted = formatDateForDisplay('2025-01-15');
    expect(formatted).toContain('Wed');
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
  });
});

describe('formatDayShort', () => {
  it('returns short day name', () => {
    const formatted = formatDayShort('2025-01-15');
    expect(formatted).toBe('Wed');
  });
});

describe('isSameDay', () => {
  it('returns true for same date', () => {
    expect(isSameDay('2025-01-15', '2025-01-15')).toBe(true);
  });

  it('returns false for different dates', () => {
    expect(isSameDay('2025-01-15', '2025-01-16')).toBe(false);
  });
});

describe('isToday', () => {
  it('returns true for today', () => {
    const today = getLocalDateString();
    expect(isToday(today)).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(getLocalDateString(yesterday))).toBe(false);
  });
});

describe('getWeekdayName', () => {
  it('returns full weekday names', () => {
    expect(getWeekdayName(0)).toBe('Sunday');
    expect(getWeekdayName(1)).toBe('Monday');
    expect(getWeekdayName(6)).toBe('Saturday');
  });
});

describe('getWeekdayShort', () => {
  it('returns short weekday names', () => {
    expect(getWeekdayShort(0)).toBe('Sun');
    expect(getWeekdayShort(1)).toBe('Mon');
    expect(getWeekdayShort(6)).toBe('Sat');
  });
});
