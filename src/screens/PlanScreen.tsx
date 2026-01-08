import { useState, useMemo } from 'react';
import { useApp } from '../data/context';
import type { Task, TaskKind } from '../data/types';
import { FullPageLoader, EmptyState } from '../components';
import { Modal } from '../components/Modal';
import { TaskForm } from '../components/TaskForm';
import { ViewToggle, type ViewMode } from '../components/ViewToggle';
import { WeeklyCalendar } from '../components/WeeklyCalendar';
import { DayTasksList } from '../components/DayTasksList';
import { getScheduleDescription, getScheduledTasksForDate } from '../utils/scheduling';
import { getWeekStart, getLocalDateString } from '../utils/date';

type FilterType = 'all' | TaskKind;

export function PlanScreen() {
  const { tasks, isLoading, addTask, updateTask, deleteTask } = useApp();

  const [filter, setFilter] = useState<FilterType>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getWeekStart(getLocalDateString())
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter(t => t.kind === filter);
  }, [tasks, filter]);

  const groupedByKind = useMemo(() => {
    const habits = tasks.filter(t => t.kind === 'habit');
    const chores = tasks.filter(t => t.kind === 'chore');
    const custom = tasks.filter(t => t.kind === 'custom');
    return { habits, chores, custom };
  }, [tasks]);

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return getScheduledTasksForDate(tasks, selectedDate);
  }, [tasks, selectedDate]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date === selectedDate ? null : date);
  };

  const handleWeekChange = (weekStart: string) => {
    setCurrentWeekStart(weekStart);
    setSelectedDate(null);
  };

  if (isLoading) {
    return <FullPageLoader />;
  }

  const handleAddTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleSaveTask = async (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived'>
  ) => {
    if (editingTask) {
      await updateTask({ ...editingTask, ...taskData });
    } else {
      await addTask(taskData);
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (task: Task) => {
    setConfirmDelete(task);
  };

  const confirmDeleteTask = async () => {
    if (confirmDelete) {
      await deleteTask(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Habits', value: 'habit' },
    { label: 'Chores', value: 'chore' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Plan</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <button
            onClick={handleAddTask}
            className="p-3 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* View Toggle */}
        {tasks.length > 0 && (
          <div className="mt-4">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        )}

        {/* Filters - only show in list view */}
        {tasks.length > 0 && viewMode === 'list' && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-1 px-1">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
                {f.value !== 'all' && (
                  <span className="ml-1.5 text-xs opacity-75">
                    (
                    {f.value === 'habit'
                      ? groupedByKind.habits.length
                      : f.value === 'chore'
                        ? groupedByKind.chores.length
                        : groupedByKind.custom.length}
                    )
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-5 pb-8">
        {tasks.length === 0 ? (
          <EmptyState
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            }
            title="No tasks yet"
            description="Start by adding some daily habits or weekly chores to track."
            action={
              <button
                onClick={handleAddTask}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Your First Task
              </button>
            }
          />
        ) : viewMode === 'calendar' ? (
          /* Calendar View */
          <div className="space-y-4">
            <WeeklyCalendar
              tasks={tasks}
              weekStartDate={currentWeekStart}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onWeekChange={handleWeekChange}
            />

            {selectedDate && (
              <DayTasksList
                date={selectedDate}
                tasks={tasksForSelectedDate}
                onEditTask={handleEditTask}
                onClose={() => setSelectedDate(null)}
              />
            )}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              No {filter} tasks found.
            </p>
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-fadeIn"
              >
                <div className="flex items-start gap-3">
                  {/* Kind badge */}
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                      task.kind === 'habit'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : task.kind === 'chore'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {task.kind}
                  </div>

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 dark:text-slate-100 truncate">
                      {task.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {getScheduleDescription(task.schedule)}
                      {task.targetPerDay > 1 && ` · ${task.targetPerDay}x daily`}
                    </p>
                    {task.notes && (
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 truncate">
                        {task.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Add Task'}
      >
        <TaskForm
          task={editingTask ?? undefined}
          onSave={handleSaveTask}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Task?"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to delete "{confirmDelete?.name}"? This will also remove all
            completion history for this task.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="flex-1 py-3 rounded-lg font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteTask}
              className="flex-1 py-3 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
