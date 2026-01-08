import { useState, useMemo, useEffect } from 'react';
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
import {
  getLastNDaysStats,
  getLastNWeeksStats,
  calculateConsistencyStreak,
  calculatePerfectStreak,
  getGradeColor,
} from '../utils/grading';
import { formatDayShort, getLocalDateString, getWeekStart } from '../utils/date';
import { useSettings } from '../hooks/useSettings';
import { getTrendMessage, streakMessages } from '../copy/microcopy';
import { getStreaks } from '../data/repository';
import type { StreakState } from '../data/types';

type TimeRange = '14d' | '30d';

export function ProgressScreen() {
  const { tasks, completions, isLoading } = useApp();
  const { settings, isLoading: settingsLoading } = useSettings();
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');
  const [streakState, setStreakState] = useState<StreakState | null>(null);

  const today = getLocalDateString();
  const currentWeekStart = getWeekStart(today);

  useEffect(() => {
    getStreaks().then(setStreakState);
  }, []);

  const {
    dailyStats,
    weeklyStats,
    todayStats,
    thisWeekStats,
    consistencyStreak,
    perfectStreak,
    trendVsLastWeek,
  } = useMemo(() => {
    const days = timeRange === '14d' ? 14 : 30;
    const daily = getLastNDaysStats(tasks, completions, days);
    const weekly = getLastNWeeksStats(tasks, completions, 8);

    const defaultDayStats = {
      date: today,
      totalTasks: 0,
      completedTasks: 0,
      percentage: 100,
      grade: 'A' as const,
      totalTarget: 0,
      totalCompleted: 0,
      focusTasksCompleted: 0,
      focusTasksTotal: 0,
      wins: [],
    };

    const defaultWeekStats = {
      weekStartDate: currentWeekStart,
      totalTasks: 0,
      completedTasks: 0,
      percentage: 100,
      grade: 'A' as const,
      dailyStats: [],
      trendVsLastWeek: 0,
      consistencyDays: 0,
      perfectDays: 0,
    };

    const todayStat = daily.find(d => d.date === today) ?? defaultDayStats;
    const thisWeek = weekly.find(w => w.weekStartDate === currentWeekStart) ?? defaultWeekStats;

    const cStreak = calculateConsistencyStreak(tasks, completions);
    const pStreak = calculatePerfectStreak(tasks, completions);

    // Calculate trend vs last week
    const currentWeekIndex = weekly.findIndex(w => w.weekStartDate === currentWeekStart);
    const prevWeek = currentWeekIndex > 0 ? weekly[currentWeekIndex - 1] : null;
    const trend = prevWeek ? thisWeek.percentage - prevWeek.percentage : 0;

    return {
      dailyStats: daily,
      weeklyStats: weekly,
      todayStats: todayStat,
      thisWeekStats: thisWeek,
      consistencyStreak: cStreak,
      perfectStreak: pStreak,
      trendVsLastWeek: trend,
    };
  }, [tasks, completions, timeRange, today, currentWeekStart]);

  if (isLoading || settingsLoading) {
    return <FullPageLoader />;
  }

  const hasData = completions.length > 0;
  const tone = settings.tone;

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
    consistencyDays: week.consistencyDays,
    perfectDays: week.perfectDays,
  }));

  // Color for chart based on percentage
  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 80) return '#3b82f6';
    if (percentage >= 70) return '#f59e0b';
    if (percentage >= 60) return '#f97316';
    return '#94a3b8';
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-slate-500';
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
            description="Start completing tasks to see your progress here."
          />
        ) : (
          <div className="space-y-6">
            {/* Today & This Week Scores */}
            <div className="grid grid-cols-2 gap-4">
              {/* Today's Score */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center animate-fadeIn">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Today
                </h3>
                <div className={`text-3xl font-bold ${getScoreColor(todayStats.percentage)}`}>
                  {todayStats.percentage}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">/ 100</div>
                {settings.showLetterGrades && (
                  <div className={`mt-2 text-sm font-medium ${getGradeColor(todayStats.grade)}`}>
                    {todayStats.grade}
                  </div>
                )}
              </div>

              {/* This Week's Score */}
              <div
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center animate-fadeIn"
                style={{ animationDelay: '0.1s' }}
              >
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  This Week
                </h3>
                <div className={`text-3xl font-bold ${getScoreColor(thisWeekStats.percentage)}`}>
                  {thisWeekStats.percentage}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">/ 100</div>
                {settings.showLetterGrades && (
                  <div className={`mt-2 text-sm font-medium ${getGradeColor(thisWeekStats.grade)}`}>
                    {thisWeekStats.grade}
                  </div>
                )}
              </div>
            </div>

            {/* Trend Message */}
            {trendVsLastWeek !== 0 && (
              <div
                className={`p-3 rounded-lg border animate-fadeIn ${
                  trendVsLastWeek > 0
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
                style={{ animationDelay: '0.15s' }}
              >
                <p className={`text-sm ${trendVsLastWeek > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}`}>
                  {getTrendMessage(trendVsLastWeek, tone)}
                </p>
              </div>
            )}

            {/* Streaks Section */}
            {settings.showStreaks && (
              <div
                className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl p-4 animate-fadeIn"
                style={{ animationDelay: '0.2s' }}
              >
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                  Streaks
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Consistency Streak */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xl">🔥</span>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-800 dark:text-white">
                        {consistencyStreak}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Consistency
                      </div>
                    </div>
                  </div>

                  {/* Perfect Day Streak */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xl">⭐</span>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-800 dark:text-white">
                        {perfectStreak}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Perfect days
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best Streaks */}
                {streakState && (streakState.bestConsistencyStreak > 0 || streakState.bestPerfectStreak > 0) && (
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/50 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Best: {streakState.bestConsistencyStreak} days consistency</span>
                    <span>Best: {streakState.bestPerfectStreak} perfect</span>
                  </div>
                )}

                {/* Grace Days Info */}
                {streakState && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Grace days this week: {1 - streakState.graceDaysUsedThisWeek} remaining
                  </div>
                )}

                {consistencyStreak > 0 && (
                  <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                    {streakMessages.streakContinues[tone](consistencyStreak)}
                  </p>
                )}
              </div>
            )}

            {/* Daily Trend Chart */}
            <div
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-fadeIn"
              style={{ animationDelay: '0.25s' }}
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
                      formatter={(value) => [`${value}%`, 'Score']}
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
              style={{ animationDelay: '0.3s' }}
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
                      formatter={(value) => [`${value}%`, 'Score']}
                      labelFormatter={(_label, payload) => {
                        if (payload && payload[0]) {
                          const p = payload[0].payload;
                          return `Week of ${p.weekStart} (${p.consistencyDays}/7 consistent, ${p.perfectDays}/7 perfect)`;
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

              {/* Weekly stats legend */}
              <div className="flex justify-center gap-4 mt-4 text-xs">
                {weekChartData.slice(-4).map((week, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: getBarColor(week.percentage) + '20', color: getBarColor(week.percentage) }}
                    >
                      {week.percentage}
                    </div>
                    <span className="text-slate-500 dark:text-slate-400">{week.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Legend - only show if letter grades are enabled */}
            {settings.showLetterGrades && (
              <div
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 animate-fadeIn"
                style={{ animationDelay: '0.35s' }}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
