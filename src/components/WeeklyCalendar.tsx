import { useMemo } from 'react';
import type { Task } from '../data/types';
import {
  getWeekDates,
  getWeekdayShort,
  isToday,
  formatWeekRange,
  getNextWeekStart,
  getPrevWeekStart,
  getDayOfWeek,
  parseLocalDate,
} from '../utils/date';
import { getScheduledTasksForDate } from '../utils/scheduling';

interface WeeklyCalendarProps {
  tasks: Task[];
  weekStartDate: string;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onWeekChange: (weekStartDate: string) => void;
}

export function WeeklyCalendar({
  tasks,
  weekStartDate,
  selectedDate,
  onSelectDate,
  onWeekChange,
}: WeeklyCalendarProps) {
  const weekDates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);

  const taskCountsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    weekDates.forEach(date => {
      counts[date] = getScheduledTasksForDate(tasks, date).length;
    });
    return counts;
  }, [tasks, weekDates]);

  const handlePrevWeek = () => {
    onWeekChange(getPrevWeekStart(weekStartDate));
  };

  const handleNextWeek = () => {
    onWeekChange(getNextWeekStart(weekStartDate));
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevWeek}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {formatWeekRange(weekStartDate)}
        </span>
        <button
          onClick={handleNextWeek}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 7-Day Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map(date => {
          const dayOfWeek = getDayOfWeek(date);
          const taskCount = taskCountsByDay[date];
          const isSelected = selectedDate === date;
          const isTodayDate = isToday(date);
          const dayNumber = parseLocalDate(date).getDate();

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-emerald-500 text-white'
                  : isTodayDate
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <span className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'opacity-60'}`}>
                {getWeekdayShort(dayOfWeek)}
              </span>
              <span className="text-lg font-semibold">
                {dayNumber}
              </span>
              {/* Task indicator dots */}
              {taskCount > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: Math.min(taskCount, 3) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white/70' : 'bg-emerald-500'
                      }`}
                    />
                  ))}
                  {taskCount > 3 && (
                    <span className={`text-xs ml-0.5 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                      +{taskCount - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
