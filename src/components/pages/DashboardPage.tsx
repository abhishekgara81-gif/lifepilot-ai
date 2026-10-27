import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Flame,
  Plus,
  Play,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { getRelativeDate, formatTime12, formatTimeRangeWithMidnight } from '../../data/initialData';
import { Task } from '../../types';

const formatDate = (dateStr: string) => {
  const date = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
};

const activityLabel = (timestamp?: string) => {
  if (!timestamp) return 'Recently completed';
  const day = new Date(timestamp);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const daysAgo = Math.max(0, Math.round((startOfToday - startOfDay) / 86_400_000));
  if (daysAgo === 0) return 'Completed today';
  if (daysAgo === 1) return 'Completed yesterday';
  if (daysAgo < 7) return `Completed ${daysAgo} days ago`;
  return `Completed ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(day)}`;
};

const priorityColor: Record<Task['priority'], string> = {
  high: 'bg-rose-400',
  medium: 'bg-amber-300',
  low: 'bg-slate-500',
};

export const DashboardPage: React.FC = () => {
  const {
    tasks,
    goals,
    habits,
    userProfile,
    setActivePage,
    toggleTaskStatus,
    setTaskModalOpen,
    setEditingTask,
    searchQuery,
    hasGeminiKey,
  } = useApp();

  const todayStr = getRelativeDate(0);
  const nextWeekStr = getRelativeDate(7);
  const todayTasks = tasks.filter((task) => (task.dueDate === todayStr || task.recurrence === 'daily') && task.status !== 'cancelled');
  const completedTodayTasks = todayTasks.filter((task) => task.status === 'completed');
  const pendingTodayCount = todayTasks.filter((task) => task.status !== 'completed').length;
  const todayCompletionRate = todayTasks.length
    ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
    : 0;
  const activeGoals = goals.filter((goal) => goal.status === 'in_progress').slice(0, 3);
  const maxHabitStreak = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);
  const plannedFocusMinutes = todayTasks
    .filter((task) => task.status !== 'completed')
    .reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
  const focusTarget = userProfile.dailyTargetFocusMinutes || 0;
  const focusProgress = focusTarget ? Math.min(100, Math.round((plannedFocusMinutes / focusTarget) * 100)) : 0;

  const visibleTodayTasks = [...todayTasks]
    .filter((task) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99');
    });

  const todaySchedule = [...todayTasks].sort((a, b) => (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99'));
  const upcomingDeadlines = tasks
    .filter((task) => task.status !== 'completed' && task.status !== 'cancelled' && task.dueDate > todayStr && task.dueDate <= nextWeekStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || (a.dueTime || '').localeCompare(b.dueTime || ''))
    .slice(0, 5);
  const recentActivity = tasks
    .filter((task) => task.status === 'completed')
    .sort((a, b) => (b.completedAt || b.createdAt).localeCompare(a.completedAt || a.createdAt))
    .slice(0, 4);

  const firstName = userProfile.name.trim().split(/\s+/)[0] || 'there';
  const todayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const openTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-14 sm:space-y-6">
      <section className="dashboard-hero rounded-[22px] px-5 py-6 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[0.13em] text-white/80 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-200 shadow-[0_0_12px_rgba(153,246,228,0.7)]" />
              {todayLabel}
            </div>
            <h2 className="text-[25px] font-semibold leading-tight tracking-[-0.045em] text-white sm:text-[32px]">
              Good to see you, {firstName}.
            </h2>
            <p className="mt-2 max-w-xl text-[12px] leading-6 text-white/85 sm:text-[13px]">
              LifePilot turns meaningful goals into focused, manageable next actions.
            </p>
            <p className="mt-1 max-w-xl text-[11px] leading-5 text-white/70 sm:text-[12px]">
              {pendingTodayCount > 0
                ? `You have ${pendingTodayCount} ${pendingTodayCount === 1 ? 'priority' : 'priorities'} planned for today.`
                : 'Your day is open. Choose one meaningful next step and build momentum.'}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row lg:shrink-0">
            <button
              onClick={() => setActivePage('planner')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/95 px-4 py-2.5 text-[11px] font-semibold text-blue-800 transition-all hover:bg-white"
            >
              <Sparkles className="h-4 w-4 text-blue-700" />
              Open AI planner
            </button>
            <button
              onClick={handleCreateTask}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/12 px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:bg-white/20"
            >
              <Plus className="h-4 w-4" />
              Add a task
            </button>
          </div>
        </div>
        <div className="dashboard-dot-grid pointer-events-none absolute bottom-0 right-0 hidden h-28 w-48 opacity-35 lg:block" />
      </section>

      <section className="dashboard-ai-panel p-5 sm:p-6">
        <div className="relative z-10 grid items-center gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(250px,0.8fr)]">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2 py-1 text-[9px] font-bold tracking-[0.11em] text-blue-800 uppercase">
                <Sparkles className="h-3 w-3" /> AI action planner
              </span>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-medium text-slate-600">
                <i className={`h-1.5 w-1.5 rounded-full ${hasGeminiKey ? 'bg-teal-600' : 'bg-amber-500'}`} />
                {hasGeminiKey ? 'Gemini API key configured' : 'Gemini setup required'}
              </span>
            </div>
            <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900 sm:text-[19px]">
              Turn a big goal into a clear plan.
            </h3>
            <p className="mt-1.5 max-w-xl text-[11px] leading-5 text-slate-600 sm:text-xs">
              Describe an outcome, review an editable roadmap, then approve the tasks and milestones you want to keep.
            </p>
            <button
              onClick={() => setActivePage('planner')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-[10px] font-semibold text-white shadow-sm shadow-blue-900/15 transition-colors hover:bg-blue-700"
            >
              Build an action plan <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-1">
            {[
              ['01', 'Describe the goal'],
              ['02', 'Review the roadmap'],
              ['03', 'Approve what fits'],
            ].map(([step, label]) => (
              <div key={step} className="dashboard-ai-step flex items-center gap-3 rounded-xl px-3 py-2.5">
                <span className="font-mono text-[9px] font-semibold text-blue-700">{step}</span>
                <span className="text-[10px] font-semibold text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Productivity summary" className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-stat dashboard-stat--progress p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Today’s progress</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-4 flex items-end justify-between gap-2">
            <span className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-slate-900 tabular-nums">{todayCompletionRate}%</span>
            <span className="text-[10px] text-slate-500">{completedTodayTasks.length} of {todayTasks.length} done</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100/80">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all" style={{ width: `${todayCompletionRate}%` }} />
          </div>
        </div>

        <div className="dashboard-stat dashboard-stat--goals p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Active goals</span>
            <Target className="h-4 w-4 text-blue-700" />
          </div>
          <div className="mt-4 flex items-end justify-between gap-2">
            <span className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-slate-900 tabular-nums">{goals.filter((goal) => goal.status === 'in_progress').length}</span>
            <span className="text-[10px] text-slate-500">{goals.filter((goal) => goal.status === 'achieved').length} achieved</span>
          </div>
          <button onClick={() => setActivePage('goals')} className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 transition-colors hover:text-blue-800">
            Review goals <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="dashboard-stat dashboard-stat--streak p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Best active streak</span>
            <Flame className="h-4 w-4 text-amber-700" />
          </div>
          <div className="mt-4 flex items-end justify-between gap-2">
            <span className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-slate-900 tabular-nums">{maxHabitStreak}<span className="ml-1 text-[13px] font-medium tracking-normal text-slate-500">days</span></span>
            <span className="text-[10px] text-slate-500">Across {habits.length} {habits.length === 1 ? 'habit' : 'habits'}</span>
          </div>
          <button onClick={() => setActivePage('goals')} className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-amber-800/80 transition-colors hover:text-amber-800">
            Open habit tracker <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="dashboard-stat dashboard-stat--focus p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Focus planned</span>
            <Timer className="h-4 w-4 text-sky-700" />
          </div>
          <div className="mt-4 flex items-end justify-between gap-2">
            <span className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-slate-900 tabular-nums">{(plannedFocusMinutes / 60).toFixed(plannedFocusMinutes % 60 === 0 ? 0 : 1)}h</span>
            <span className="text-[10px] text-slate-500">of {(focusTarget / 60).toFixed(focusTarget % 60 === 0 ? 0 : 1)}h daily target</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100/80">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-300 transition-all" style={{ width: `${focusProgress}%` }} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.85fr)]">
        <div className="space-y-4">
          <section className="dashboard-surface p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold tracking-[0.15em] text-blue-700 uppercase">Focus list</p>
                <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-slate-900">Today’s priorities</h3>
                <p className="mt-1 text-[10px] text-slate-500">Tasks scheduled for {formatDate(todayStr)}</p>
              </div>
              <button onClick={() => setActivePage('tasks')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800">
                All tasks <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {visibleTodayTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300/70 bg-slate-50/35 px-4 py-7 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 text-slate-500"><CheckCircle2 className="h-4 w-4" /></div>
                <p className="mt-3 text-[11px] font-medium text-slate-700">{searchQuery ? 'No tasks match your search' : 'Nothing scheduled for today'}</p>
                <p className="mt-1 text-[10px] text-slate-500">{searchQuery ? 'Try another search term.' : 'Add a task or make a plan to get started.'}</p>
                {!searchQuery && <button onClick={handleCreateTask} className="mt-3 text-[10px] font-semibold text-blue-700 hover:text-blue-800">Create a task</button>}
              </div>
            ) : (
              <div className="space-y-2">
                {visibleTodayTasks.slice(0, 6).map((task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <div key={task.id} className={`dashboard-task group flex items-start gap-3 rounded-xl border border-slate-300/45 bg-slate-50/35 p-3 transition-colors ${isDone ? 'opacity-65' : ''}`}>
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-colors ${isDone ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-300 bg-white/40 text-transparent hover:border-blue-300 hover:text-blue-800'}`}
                        aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
                      >
                        {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <button onClick={() => openTask(task)} className={`block max-w-full truncate text-left text-[11px] font-semibold transition-colors ${isDone ? 'text-slate-500 line-through' : 'text-slate-800 hover:text-blue-800'}`}>
                          {task.title}
                        </button>
                        {task.description && <p className="mt-1 truncate text-[10px] text-slate-500">{task.description}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] text-slate-500">
                          <span className="capitalize">{task.category === 'learning' ? 'Learning' : task.category}</span>
                          {task.recurrence === 'daily' && <span className="text-blue-700 font-semibold">Daily</span>}
                          <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{task.estimatedMinutes} min</span>
                          {task.recurrence === 'daily' ? (
                            <span className="text-blue-700 font-medium">{formatTimeRangeWithMidnight(task.startTime, task.endTime)}</span>
                          ) : task.startTime && task.endTime ? (
                            <span>{task.startTime} - {task.endTime}</span>
                          ) : task.dueTime ? (
                            <span>{task.dueTime}</span>
                          ) : null}
                          <span className="inline-flex items-center gap-1.5 capitalize"><i className={`h-1.5 w-1.5 rounded-full ${priorityColor[task.priority]}`} />{task.priority}</span>
                        </div>
                      </div>
                      <button onClick={() => openTask(task)} className="hidden rounded-lg p-1.5 text-slate-500 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-800 group-hover:opacity-100 sm:block" aria-label={`Edit ${task.title}`}>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
                {visibleTodayTasks.length > 6 && <button onClick={() => setActivePage('tasks')} className="w-full pt-1 text-center text-[10px] font-medium text-slate-500 hover:text-blue-700">View {visibleTodayTasks.length - 6} more tasks</button>}
              </div>
            )}
          </section>

          <section className="dashboard-surface p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold tracking-[0.15em] text-sky-700 uppercase">Time blocks</p>
                <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-slate-900">Today’s schedule</h3>
                <p className="mt-1 text-[10px] text-slate-500">Built from your scheduled tasks</p>
              </div>
              <button onClick={() => setActivePage('calendar')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800">
                Calendar <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {todaySchedule.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300/70 bg-slate-50/35 px-4 py-6 text-center">
                <CalendarDays className="mx-auto h-4 w-4 text-slate-500" />
                <p className="mt-2 text-[10px] text-slate-500">No tasks are on today’s schedule yet.</p>
              </div>
            ) : (
              <div className="relative space-y-2 before:absolute before:bottom-3 before:left-[57px] before:top-3 before:w-px before:bg-slate-200/60">
                {todaySchedule.slice(0, 6).map((task) => (
                  <button key={task.id} onClick={() => openTask(task)} className="group relative grid w-full grid-cols-[48px_1fr] items-stretch gap-3 text-left">
                    <span className="pt-3 text-right font-mono text-[9px] font-medium tabular-nums text-slate-500">
                      {task.startTime ? formatTime12(task.startTime) : task.dueTime || '—'}
                    </span>
                    <span className="relative rounded-xl border border-slate-300/40 bg-slate-50/35 px-3 py-2.5 transition-colors group-hover:border-blue-400/25 group-hover:bg-slate-50/70">
                      <i className={`absolute -left-[18px] top-[15px] h-2 w-2 rounded-full border-2 border-white ${task.status === 'completed' ? 'bg-emerald-400' : task.status === 'in_progress' ? 'bg-blue-300' : 'bg-slate-500'}`} />
                      <span className="block truncate text-[10px] font-semibold text-slate-800">{task.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-slate-500">
                        <span className="capitalize">{task.category === 'learning' ? 'Learning' : task.category}</span>
                        <span>·</span>
                        <span>{task.estimatedMinutes} min</span>
                        {task.recurrence === 'daily' && (
                          <>
                            <span>·</span>
                            <span className="text-blue-700 font-medium">{formatTimeRangeWithMidnight(task.startTime, task.endTime)}</span>
                          </>
                        )}
                        <span className="capitalize">· {task.status.replace('_', ' ')}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="dashboard-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold tracking-[0.15em] text-amber-800/75 uppercase">Coming up</p>
                <h3 className="mt-1 text-[14px] font-semibold text-slate-900">Next 7 days</h3>
              </div>
              <CalendarDays className="h-4 w-4 text-blue-700" />
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300/70 px-3 py-5 text-center">
                <p className="text-[10px] font-medium text-slate-500">No upcoming task deadlines</p>
                <p className="mt-1 text-[9px] text-slate-500">Your next week is clear.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((task) => (
                  <button key={task.id} onClick={() => openTask(task)} className="group flex w-full items-start gap-3 rounded-xl border border-slate-300/40 bg-slate-50/35 p-3 text-left transition-colors hover:border-slate-300/70 hover:bg-slate-50/70">
                    <span className="flex min-w-[44px] flex-col items-center rounded-lg border border-slate-300/55 bg-white/35 px-1.5 py-1.5">
                      <span className="text-[8px] font-bold tracking-wide text-slate-500 uppercase">{formatDate(task.dueDate).split(',')[0]}</span>
                      <span className="mt-0.5 text-[14px] font-semibold leading-none text-slate-800">{new Date(`${task.dueDate}T12:00:00`).getDate()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] font-semibold text-slate-800 group-hover:text-blue-800">{task.title}</span>
                      <span className="mt-1 block truncate text-[9px] capitalize text-slate-500">{task.category}{task.dueTime ? ` · ${task.dueTime}` : ''}</span>
                    </span>
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${priorityColor[task.priority]}`} aria-label={`${task.priority} priority`} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-surface p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold tracking-[0.15em] text-emerald-800/75 uppercase">Long-term direction</p>
                <h3 className="mt-1 text-[14px] font-semibold text-slate-900">Active goals</h3>
              </div>
              <button onClick={() => setActivePage('goals')} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-800" aria-label="Manage goals"><ArrowRight className="h-4 w-4" /></button>
            </div>
            {activeGoals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300/70 px-3 py-5 text-center">
                <Target className="mx-auto h-4 w-4 text-slate-500" />
                <p className="mt-2 text-[10px] text-slate-500">No active goals yet.</p>
                <button onClick={() => setActivePage('goals')} className="mt-2 text-[9px] font-semibold text-blue-700 hover:text-blue-800">Set a goal</button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal) => {
                  const milestoneCount = goal.milestones.length;
                  const completedMilestones = goal.milestones.filter((milestone) => milestone.completed).length;
                  return (
                    <button key={goal.id} onClick={() => setActivePage('goals')} className="block w-full text-left">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] font-semibold text-slate-800">{goal.title}</span>
                        <span className="shrink-0 font-mono text-[9px] text-slate-500 tabular-nums">{goal.progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100/80">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%`, backgroundColor: goal.color || '#818cf8' }} />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-500">
                        <span>Target {formatDate(goal.targetDate)}</span>
                        <span>{completedMilestones}/{milestoneCount} milestones</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="dashboard-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold tracking-[0.15em] text-blue-700 uppercase">Momentum</p>
                <h3 className="mt-1 text-[14px] font-semibold text-slate-900">Recent activity</h3>
              </div>
              <TrendingUp className="h-4 w-4 text-blue-700" />
            </div>
            {recentActivity.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300/70 px-3 py-5 text-center text-[10px] text-slate-500">Completed tasks will show up here.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((task) => (
                  <div key={task.id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-700"><Check className="h-3 w-3" /></span>
                    <div className="min-w-0">
                      <button onClick={() => openTask(task)} className="block max-w-full truncate text-left text-[10px] font-medium text-slate-700 hover:text-blue-800">{task.title}</button>
                      <p className="mt-0.5 text-[9px] text-slate-500">{activityLabel(task.completedAt || task.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button onClick={() => setActivePage('student')} className="group flex w-full items-center gap-3 rounded-2xl border border-blue-400/15 bg-gradient-to-br from-blue-500/[0.12] to-blue-500/[0.04] p-4 text-left transition-colors hover:border-blue-300/30 hover:from-blue-500/[0.18]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-300/15 bg-blue-400/10 text-blue-800"><Play className="h-4 w-4 fill-current" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold text-slate-900">Start a focus session</span>
              <span className="mt-1 block text-[9px] text-slate-500">Open your Pomodoro timer</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-800" />
          </button>
        </aside>
      </div>
    </div>
  );
};
