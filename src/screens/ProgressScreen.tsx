import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useApp } from '../data/context';
import { FullPageLoader, EmptyState } from '../components';
import { GradeDisplay } from '../components/GradeDisplay';
import {
  getLastNDaysStats,
  getLastNWeeksStats,
  calculateCurrentStreak,
  getGradeColor,
} from '../utils/grading';
import { formatDayShort, getLocalDateString, getWeekStart } from '../utils/date';

type TimeRange = '14d' | '30d';

export function ProgressScreen() {
  const { tasks, completions, isLoading } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');

  const today = getLocalDateString();
  const currentWeekStart = getWeekStart(today);

  const { dailyStats, weeklyStats, todayStats, thisWeekStats, currentStreak } = useMemo(() => {
    const days = timeRange === '14d' ? 14 : 30;
    const daily = getLastNDaysStats(tasks, completions, days);
    const weekly = getLastNWeeksStats(tasks, completions, 8);
    const todayStat = daily.find(d => d.date === today) ?? {
      date: today,
      totalTasks: 0,
      completedTasks: 0,
      percentage: 100,
      grade: 'A' as const,
    };
    const thisWeek = weekly.find(w => w.weekStartDate === currentWeekStart) ?? {
      weekStartDate: currentWeekStart,
      totalTasks: 0,
      completedTasks: 0,
      percentage: 100,
      grade: 'A' as const,
      dailyStats: [],
    };
    const streak = calculateCurrentStreak(tasks, completions);

    return {
      dailyStats: daily,
      weeklyStats: weekly,
      todayStats: todayStat,
      thisWeekStats: thisWeek,
      currentStreak: streak,
    };
  }, [tasks, completions, timeRange, today, currentWeekStart]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  const hasData = completions.length > 0;

  // Chart data
  const chartData = dailyStats.map(day => ({
    date: day.date,
    label: formatDayShort(day.date),
    percentage: day.percentage,
    grade: day.grade,
  }));

  const weekChartData = weeklyStats.map(week => ({
    weekStart: week.weekStartDate,
    label: formatDayShort(week.weekStartDate),
    percentage: week.percentage,
    grade: week.grade,
  }));

  // Color for chart based on percentage
  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 80) return '#3b82f6';
    if (percentage >= 70) return '#f59e0b';
    if (percentage >= 60) return '#f97316';
    return '#94a3b8';
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 safe-top">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Progress</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Track your momentum over time
        </p>
      </header>

      {/* Content */}
      <div className="px-5 pb-8">
        {!hasData && tasks.length === 0 ? (
          <EmptyState
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            title="No progress data yet"
            description="Start completing tasks to see your progress and grades here."
          />
        ) : (
          <div className="space-y-6">
            {/* Today & This Week Grades */}
            <div className="grid grid-cols-2 gap-4">
              {/* Today's Grade */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center animate-fadeIn">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                  Today
                </h3>
                <GradeDisplay
                  grade={todayStats.grade}
                  percentage={todayStats.percentage}
                  size="md"
                />
              </div>

              {/* This Week's Grade */}
              <div
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center animate-fadeIn"
                style={{ animationDelay: '0.1s' }}
              >
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                  This Week
                </h3>
                <GradeDisplay
                  grade={thisWeekStats.grade}
                  percentage={thisWeekStats.percentage}
                  size="md"
                />
              </div>
            </div>

            {/* Current Streak */}
            <div
              className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-4 animate-fadeIn"
              style={{ animationDelay: '0.15s' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">
                    {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Current streak</div>
                </div>
              </div>
            </div>

            {/* Daily Trend Chart */}
            <div
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-fadeIn"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Daily Trend</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setTimeRange('14d')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      timeRange === '14d'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    14 days
                  </button>
                  <button
                    onClick={() => setTimeRange('30d')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      timeRange === '30d'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    30 days
                  </button>
                </div>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      interval={timeRange === '14d' ? 1 : 'preserveStartEnd'}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [`${value}%`, 'Completion']}
                      labelFormatter={(_label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.date;
                        }
                        return '';
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorPercent)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Summary Chart */}
            <div
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-fadeIn"
              style={{ animationDelay: '0.25s' }}
            >
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Weekly Summary (Last 8 weeks)
              </h3>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [`${value}%`, 'Completion']}
                      labelFormatter={(_label, payload) => {
                        if (payload && payload[0]) {
                          return `Week of ${payload[0].payload.weekStart}`;
                        }
                        return '';
                      }}
                    />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {weekChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly grades legend */}
              <div className="flex justify-center gap-4 mt-4 text-xs">
                {weekChartData.slice(-4).map((week, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${getGradeColor(week.grade)}`}
                      style={{ backgroundColor: getBarColor(week.percentage) + '20' }}
                    >
                      {week.grade}
                    </div>
                    <span className="text-slate-500 dark:text-slate-400">{week.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Legend */}
            <div
              className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 animate-fadeIn"
              style={{ animationDelay: '0.3s' }}
            >
              <h3 className="font-medium text-slate-700 dark:text-slate-200 mb-3 text-sm">
                Grade Scale
              </h3>
              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  { grade: 'A', range: '90%+', color: '#10b981' },
                  { grade: 'B', range: '80-89%', color: '#3b82f6' },
                  { grade: 'C', range: '70-79%', color: '#f59e0b' },
                  { grade: 'D', range: '60-69%', color: '#f97316' },
                  { grade: 'F', range: '<60%', color: '#94a3b8' },
                ].map(g => (
                  <div key={g.grade}>
                    <div
                      className="w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ backgroundColor: g.color + '20', color: g.color }}
                    >
                      {g.grade}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{g.range}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
