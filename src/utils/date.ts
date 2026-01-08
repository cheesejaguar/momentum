// Date utility functions using local timezone

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date object (at midnight local time)
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the day of week (0 = Sunday, 6 = Saturday) for a date string
 */
export function getDayOfWeek(dateString: string): number {
  return parseLocalDate(dateString).getDay();
}

/**
 * Get an array of date strings for the last N days (including today)
 */
export function getLastNDays(n: number, fromDate: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() - i);
    dates.push(getLocalDateString(date));
  }
  return dates;
}

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(dateString: string): string {
  const date = parseLocalDate(dateString);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return getLocalDateString(date);
}

/**
 * Get the end of the week (Saturday) for a given date
 */
export function getWeekEnd(dateString: string): string {
  const date = parseLocalDate(dateString);
  const day = date.getDay();
  date.setDate(date.getDate() + (6 - day));
  return getLocalDateString(date);
}

/**
 * Get all dates in a week starting from the week start date
 */
export function getWeekDates(weekStartDate: string): string[] {
  const dates: string[] = [];
  const startDate = parseLocalDate(weekStartDate);
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(getLocalDateString(date));
  }
  return dates;
}

/**
 * Get start dates of the last N weeks (including current week)
 */
export function getLastNWeekStarts(n: number, fromDate: Date = new Date()): string[] {
  const weekStarts: string[] = [];
  const currentWeekStart = getWeekStart(getLocalDateString(fromDate));

  for (let i = n - 1; i >= 0; i--) {
    const date = parseLocalDate(currentWeekStart);
    date.setDate(date.getDate() - i * 7);
    weekStarts.push(getLocalDateString(date));
  }

  return weekStarts;
}

/**
 * Get the number of days between two date strings
 */
export function daysBetween(dateString1: string, dateString2: string): number {
  const date1 = parseLocalDate(dateString1);
  const date2 = parseLocalDate(dateString2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format a date string for display
 */
export function formatDateForDisplay(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string as a short day name
 */
export function formatDayShort(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Check if two date strings are the same day
 */
export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getLocalDateString();
}

/**
 * Get readable weekday name
 */
export function getWeekdayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

/**
 * Get short weekday name
 */
export function getWeekdayShort(dayIndex: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
}

/**
 * Get the next week's start date
 */
export function getNextWeekStart(weekStartDate: string): string {
  const date = parseLocalDate(weekStartDate);
  date.setDate(date.getDate() + 7);
  return getLocalDateString(date);
}

/**
 * Get the previous week's start date
 */
export function getPrevWeekStart(weekStartDate: string): string {
  const date = parseLocalDate(weekStartDate);
  date.setDate(date.getDate() - 7);
  return getLocalDateString(date);
}

/**
 * Format week range as "Jan 5 - Jan 11" style
 */
export function formatWeekRange(weekStartDate: string): string {
  const startDate = parseLocalDate(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
}
