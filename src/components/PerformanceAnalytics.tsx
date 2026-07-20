import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Zap, Target, Activity, TrendingUp, Filter } from 'lucide-react';
import { TypingAttempt } from '../types';

interface Props {
  attempts: TypingAttempt[];
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'alltime';
type MetricType = 'avgVelocity' | 'peakPerformance' | 'totalExercises' | 'avgAccuracy' | 'consistency';

export default function PerformanceAnalytics({ attempts }: Props) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [selectedMetrics, setSelectedMetrics] = useState<Set<MetricType>>(
    new Set(['avgVelocity', 'peakPerformance', 'totalExercises', 'avgAccuracy'])
  );

  const metrics = [
    { id: 'avgVelocity' as MetricType, label: 'Average Velocity (WPM)', icon: '⚡' },
    { id: 'peakPerformance' as MetricType, label: 'All-time Peak (WPM)', icon: '🎯' },
    { id: 'totalExercises' as MetricType, label: 'Total Exercises', icon: '📊' },
    { id: 'avgAccuracy' as MetricType, label: 'Average Accuracy', icon: '🎯' },
    { id: 'consistency' as MetricType, label: 'Consistency Score', icon: '📈' },
  ];

  // Helper: Get date range based on period
  const getDateRange = (period: TimePeriod) => {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yearly':
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'alltime':
        startDate = new Date(0);
        break;
    }

    return { startDate, endDate: now };
  };

  // Filter attempts by time period
  const filteredAttempts = useMemo(() => {
    const { startDate, endDate } = getDateRange(timePeriod);
    return attempts.filter(attempt => {
      const attemptDate = new Date(attempt.createdAt);
      return attemptDate >= startDate && attemptDate <= endDate;
    });
  }, [attempts, timePeriod]);

  // Calculate metrics
  const analytics = useMemo(() => {
    if (filteredAttempts.length === 0) {
      return {
        avgVelocity: 0,
        peakPerformance: 0,
        totalExercises: 0,
        avgAccuracy: 0,
        consistency: 0,
        chartData: [],
      };
    }

    const validAttempts = filteredAttempts.filter(a => (a.wpm || 0) > 0);
    const totalWpm = validAttempts.reduce((sum, a) => sum + (a.wpm || 0), 0);
    const totalAccuracy = validAttempts.reduce((sum, a) => sum + (a.accuracy || 0), 0);
    const wpmValues = validAttempts.map(a => a.wpm || 0);

    // Calculate consistency (coefficient of variation)
    const avgWpm = validAttempts.length > 0 ? totalWpm / validAttempts.length : 0;
    const variance = validAttempts.length > 0 
      ? validAttempts.reduce((sum, a) => sum + Math.pow((a.wpm || 0) - avgWpm, 2), 0) / validAttempts.length 
      : 0;
    const stdDev = Math.sqrt(variance);
    const consistency = avgWpm > 0 ? Math.max(0, 100 - (stdDev / avgWpm) * 100) : 0;

    // Group by day for chart
    const groupedByDay: Record<string, TypingAttempt[]> = {};
    validAttempts.forEach(attempt => {
      const date = new Date(attempt.createdAt).toLocaleDateString();
      if (!groupedByDay[date]) groupedByDay[date] = [];
      groupedByDay[date].push(attempt);
    });

    const chartData = Object.entries(groupedByDay).map(([date, dayAttempts]) => ({
      date,
      avgWpm: Math.round(dayAttempts.reduce((sum, a) => sum + (a.wpm || 0), 0) / dayAttempts.length),
      count: dayAttempts.length,
      accuracy: Math.round(dayAttempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / dayAttempts.length),
    }));

    return {
      avgVelocity: Math.round(avgWpm),
      peakPerformance: Math.max(...wpmValues, 0),
      totalExercises: filteredAttempts.length,
      avgAccuracy: Math.round(totalAccuracy / validAttempts.length),
      consistency: Math.round(consistency),
      chartData,
    };
  }, [filteredAttempts]);

  const toggleMetric = (metricId: MetricType) => {
    const newMetrics = new Set(selectedMetrics);
    if (newMetrics.has(metricId)) {
      newMetrics.delete(metricId);
    } else {
      newMetrics.add(metricId);
    }
    setSelectedMetrics(newMetrics);
  };

  const visibleMetrics = metrics.filter(m => selectedMetrics.has(m.id));

  return (
    <div className="w-full rounded-lg border border-slate-700 bg-slate-900/50 p-6 shadow-xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="flex items-center gap-2 text-sm text-slate-400">
          <Calendar className="h-4 w-4" />
          Period:
        </span>
        {(['daily', 'weekly', 'monthly', 'yearly', 'alltime'] as TimePeriod[]).map(period => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              timePeriod === period
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Metric Selection */}
      <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-300">Select Metrics to Display</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {metrics.map(metric => (
            <button
              key={metric.id}
              onClick={() => toggleMetric(metric.id)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                selectedMetrics.has(metric.id)
                  ? 'bg-purple-500/40 text-purple-200 border border-purple-500'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {metric.icon} {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      {filteredAttempts.length > 0 ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {selectedMetrics.has('avgVelocity') && (
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Average Velocity</span>
                  <Zap className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-bold text-cyan-400">{analytics.avgVelocity}</div>
                <div className="text-xs text-slate-500">WPM</div>
              </div>
            )}

            {selectedMetrics.has('peakPerformance') && (
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">All-time Peak</span>
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-purple-400">{analytics.peakPerformance}</div>
                <div className="text-xs text-slate-500">WPM</div>
              </div>
            )}

            {selectedMetrics.has('totalExercises') && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Total Exercises</span>
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-emerald-400">{analytics.totalExercises}</div>
                <div className="text-xs text-slate-500">runs</div>
              </div>
            )}

            {selectedMetrics.has('avgAccuracy') && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Avg Accuracy</span>
                  <Target className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-yellow-400">{analytics.avgAccuracy}%</div>
                <div className="text-xs text-slate-500">precision</div>
              </div>
            )}
          </div>

          {/* Chart */}
          {analytics.chartData.length > 0 && selectedMetrics.has('avgVelocity') && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
              <h3 className="mb-4 text-sm font-semibold text-slate-300">Velocity Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#00F3FF' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgWpm"
                    stroke="#00F3FF"
                    strokeWidth={2}
                    dot={{ fill: '#00F3FF', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center">
          <Activity className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-slate-400">No data available for {timePeriod} period</p>
          <p className="text-xs text-slate-500">Start practicing to see your performance analytics</p>
        </div>
      )}
    </div>
  );
}
