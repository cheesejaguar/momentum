import { useState, useEffect } from 'react';
import type { Task, TaskKind, ScheduleType, TaskSchedule, TaskWhen } from '../data/types';
import { getWeekdayShort } from '../utils/date';

interface TaskFormProps {
  task?: Task;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => void;
  onCancel: () => void;
}

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

export function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [name, setName] = useState(task?.name ?? '');
  const [kind, setKind] = useState<TaskKind>(task?.kind ?? 'habit');
  const [scheduleType, setScheduleType] = useState<ScheduleType>(task?.schedule.type ?? 'daily');
  const [weekdays, setWeekdays] = useState<number[]>(task?.schedule.weekdays ?? []);
  const [timesPerWeek, setTimesPerWeek] = useState(task?.schedule.timesPerWeek ?? 3);
  const [everyNDays, setEveryNDays] = useState(task?.schedule.everyNDays ?? 2);
  const [targetPerDay, setTargetPerDay] = useState(task?.targetPerDay ?? 1);
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [focus, setFocus] = useState(task?.focus ?? false);
  const [when, setWhen] = useState<TaskWhen | undefined>(task?.when);
  const [trigger, setTrigger] = useState(task?.trigger ?? '');
  const [showAdvanced, setShowAdvanced] = useState(!!task?.when || !!task?.trigger || !!task?.focus);

  const isEditing = !!task;

  // Reset schedule options when type changes
  useEffect(() => {
    if (scheduleType === 'weekdays' && weekdays.length === 0) {
      setWeekdays([1]); // Default to Monday
    }
  }, [scheduleType, weekdays.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const schedule: TaskSchedule = { type: scheduleType };

    if (scheduleType === 'weekdays') {
      schedule.weekdays = weekdays;
    } else if (scheduleType === 'times_per_week') {
      schedule.timesPerWeek = timesPerWeek;
    } else if (scheduleType === 'every_n_days') {
      schedule.everyNDays = everyNDays;
    }

    onSave({
      name: name.trim(),
      kind,
      schedule,
      targetPerDay,
      notes: notes.trim() || undefined,
      focus,
      when,
      trigger: trigger.trim() || undefined,
    });
  };

  const toggleWeekday = (day: number) => {
    setWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Task Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., Take vitamins"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Kind */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['habit', 'chore', 'custom'] as TaskKind[]).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                kind === k
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Schedule
        </label>
        <select
          value={scheduleType}
          onChange={e => setScheduleType(e.target.value as ScheduleType)}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="daily">Every day</option>
          <option value="weekdays">Specific days</option>
          <option value="times_per_week">X times per week</option>
          <option value="every_n_days">Every N days</option>
        </select>
      </div>

      {/* Weekday selector */}
      {scheduleType === 'weekdays' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Select Days
          </label>
          <div className="flex gap-2">
            {WEEKDAYS.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleWeekday(day)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  weekdays.includes(day)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {getWeekdayShort(day)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Times per week */}
      {scheduleType === 'times_per_week' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Times Per Week
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTimesPerWeek(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              -
            </button>
            <span className="text-xl font-semibold text-slate-800 dark:text-slate-100 w-8 text-center">
              {timesPerWeek}
            </span>
            <button
              type="button"
              onClick={() => setTimesPerWeek(prev => Math.min(7, prev + 1))}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Every N days */}
      {scheduleType === 'every_n_days' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Every N Days
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEveryNDays(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              -
            </button>
            <span className="text-xl font-semibold text-slate-800 dark:text-slate-100 w-8 text-center">
              {everyNDays}
            </span>
            <button
              type="button"
              onClick={() => setEveryNDays(prev => Math.min(30, prev + 1))}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Target per day */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Daily Target
        </label>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          How many times should this be done each day?
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTargetPerDay(prev => Math.max(1, prev - 1))}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            -
          </button>
          <span className="text-xl font-semibold text-slate-800 dark:text-slate-100 w-8 text-center">
            {targetPerDay}
          </span>
          <button
            type="button"
            onClick={() => setTargetPerDay(prev => Math.min(10, prev + 1))}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any helpful reminders..."
          rows={2}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Advanced Options */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Advanced options
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            {/* Focus Task */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-700 dark:text-slate-200">Focus Task</div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Prioritize this task for consistency tracking
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFocus(!focus)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  focus ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    focus ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* When (Time of Day) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                When (time of day)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([undefined, 'morning', 'afternoon', 'evening'] as const).map(w => (
                  <button
                    key={w ?? 'anytime'}
                    type="button"
                    onClick={() => setWhen(w)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      when === w
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {w ? w.charAt(0).toUpperCase() + w.slice(1) : 'Anytime'}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger (Implementation Intention) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Trigger (implementation intention)
              </label>
              <input
                type="text"
                value={trigger}
                onChange={e => setTrigger(e.target.value)}
                placeholder="e.g., After I brush my teeth..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Link this habit to an existing routine for better follow-through
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 py-3 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isEditing ? 'Save Changes' : 'Add Task'}
        </button>
      </div>
    </form>
  );
}
