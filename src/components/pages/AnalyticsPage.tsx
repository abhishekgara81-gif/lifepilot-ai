import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Target,
  Flame,
} from 'lucide-react';
import { getRelativeDate } from '../../data/initialData';

export const AnalyticsPage: React.FC = () => {
  const { tasks, goals, habits, userProfile } = useApp();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const completionRate = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Count only explicitly recorded focus time as logged time.
  const completedFocusMinutes = completedTasks.reduce(
    (sum, t) => sum + (t.actualMinutes || 0),
    0
  );

  // Weekly Activity Trend (past 7 days)
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const offset = 6 - i;
    const dateStr = getRelativeDate(-offset);
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayCompleted = tasks.filter((t) => t.completedAt && t.completedAt.startsWith(dateStr)).length;
    return {
      dayLabel,
      dateStr,
      completed: dayCompleted,
    };
  });
  const weeklyCompletedCount = past7Days.reduce((sum, day) => sum + day.completed, 0);
  const averageCompletedPerDay = (weeklyCompletedCount / past7Days.length).toFixed(1);

  // Category distribution
  const categories = ['study', 'coding', 'project', 'revision', 'personal', 'learning'] as const;
  const categoryStats = categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat);
    const catCompleted = catTasks.filter((t) => t.status === 'completed').length;
    return {
      name: cat,
      count: catTasks.length,
      completed: catCompleted,
      plannedMinutes: catTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0),
      percent: totalTasks ? Math.round((catTasks.length / totalTasks) * 100) : 0,
    };
  });

  // Priority distribution
  const priorityStats = (['high', 'medium', 'low'] as const).map((prio) => {
    const prioTasks = tasks.filter((t) => t.priority === prio);
    const prioCompleted = prioTasks.filter((t) => t.status === 'completed').length;
    return {
      priority: prio,
      count: prioTasks.length,
      completed: prioCompleted,
      rate: prioTasks.length ? Math.round((prioCompleted / prioTasks.length) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="page-intro p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Productivity Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Performance Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Real-time telemetry measuring task completion rates, weekly velocity, focus hours, and study consistency.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block font-semibold">Weekly Velocity</span>
            <span className="text-base font-bold text-emerald-700 font-mono tabular-nums">
              {weeklyCompletedCount} Tasks
            </span>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Task Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
            {completionRate}%
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {completedTasks.length} done of {totalTasks} total tasks
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Focus Time Logged</span>
            <Clock className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
            {Math.round(completedFocusMinutes / 60)}h{' '}
            <span className="text-xs font-normal text-slate-500">logged</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Target: ~{Math.round(userProfile.dailyTargetFocusMinutes * 7 / 60)}h / week
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Milestones</span>
            <Target className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
            {goals.reduce((acc, g) => acc + g.milestones.filter((m) => m.completed).length, 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2">Checkpoints cleared</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Habit Consistency</span>
            <Flame className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
            {Math.max(...habits.map((h) => h.streak), 0)}{' '}
            <span className="text-xs font-normal text-slate-500">days</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">Peak active streak</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Task Output Chart (SVG Bar Chart) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Completed tasks</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tasks completed each day over the past week</p>
            </div>
            <span className="text-xs text-slate-500 font-mono font-semibold">{weeklyCompletedCount} this week</span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-200">
            {past7Days.map((day, i) => {
              const maxVal = Math.max(1, ...past7Days.map((item) => item.completed));
              const heightPercent = Math.min(100, Math.round((day.completed / maxVal) * 100));

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-500 transition-opacity tabular-nums">
                    {day.completed}
                  </span>
                  <div className="w-full max-w-[36px] bg-slate-50 rounded-t-lg h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{day.dayLabel}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Based on completion timestamps in your task list</span>
            <span className="tabular-nums">Avg {averageCompletedPerDay} / day</span>
          </div>
        </div>

        {/* Priority Fulfillment Breakdown */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Priority Execution Rates</h3>
              <p className="text-xs text-slate-500 mt-0.5">High vs Medium vs Low priority fulfillment</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {priorityStats.map((item) => (
              <div key={item.priority} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        item.priority === 'high'
                          ? 'bg-rose-50 text-rose-700'
                          : item.priority === 'medium'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.priority} Priority
                    </span>
                    <span className="text-slate-500">
                      ({item.completed} of {item.count} done)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 tabular-nums">{item.rate}%</span>
                </div>

                <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.priority === 'high'
                        ? 'bg-rose-500'
                        : item.priority === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200 text-xs text-slate-500 leading-relaxed mt-4">
            <strong className="text-slate-800">Your data:</strong> Completion rates use task status; weekly activity uses recorded completion dates.
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-slate-900">Planned focus by domain</h3>
          <p className="mt-1 text-xs text-slate-500">Estimated task time grouped by category</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {categoryStats.map((cat) => (
            <div key={cat.name} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold capitalize text-blue-700 block mb-1">
                {cat.name}
              </span>
              <div className="text-xl font-bold text-slate-900 tabular-nums">{Math.round(cat.plannedMinutes / 60 * 10) / 10}h</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {cat.count} {cat.count === 1 ? 'task' : 'tasks'} · {cat.completed} completed
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
