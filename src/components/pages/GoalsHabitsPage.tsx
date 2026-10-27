import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Target,
  Flame,
  Plus,
  CheckCircle2,
  Calendar,
  Check,
  Edit2,
  Trash2,
  TrendingUp,
  Award,
} from 'lucide-react';
import { getRelativeDate } from '../../data/initialData';

export const GoalsHabitsPage: React.FC = () => {
  const {
    goals,
    habits,
    toggleMilestone,
    toggleHabitDate,
    deleteHabit,
    addHabit,
    setGoalModalOpen,
    setEditingGoal,
    deleteGoal,
  } = useApp();

  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Study');
  const [newHabitDays, setNewHabitDays] = useState(7);
  const [showHabitForm, setShowHabitForm] = useState(false);

  // Past 7 days for habit matrix
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const offset = 6 - i; // from 6 days ago up to today (0)
    const dateStr = getRelativeDate(-offset);
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return {
      dateStr,
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      isToday: offset === 0,
      formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit(newHabitName.trim(), newHabitCategory, newHabitDays);
    setNewHabitName('');
    setShowHabitForm(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Section 1: Strategic Goals */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-0.5">
              <Target className="w-4 h-4" />
              <span>Milestone Architecture</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Semester Goals</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              High-impact targets broken down into measurable checkpoints and deadlines.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingGoal(null);
              setGoalModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Establish Goal</span>
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-slate-300/70 bg-white px-6 py-10 text-center">
              <Target className="mx-auto h-5 w-5 text-slate-500" />
              <p className="mt-3 text-sm font-semibold text-slate-800">No goals yet</p>
              <p className="mt-1 text-xs text-slate-500">Turn a longer-term intention into a goal with clear milestones.</p>
            </div>
          ) : goals.map((goal) => {
            const completedMilestones = goal.milestones.filter((m) => m.completed).length;

            return (
              <div
                key={goal.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className="goal-category text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ backgroundColor: goal.color || '#245EEA' }}
                    >
                      {goal.category}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setGoalModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-slate-900"
                        title="Edit goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-700"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">{goal.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {goal.description}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Target Progress</span>
                      <span className="font-mono tabular-nums font-bold text-slate-800">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${goal.progress}%`,
                          backgroundColor: goal.color || '#245EEA',
                        }}
                      />
                    </div>
                  </div>

                  {/* Milestones checklist */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Milestones ({completedMilestones}/{goal.milestones.length})
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {goal.milestones.map((m) => (
                        <label
                          key={m.id}
                          className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={m.completed}
                            onChange={() => toggleMilestone(goal.id, m.id)}
                            className="mt-0.5 w-3.5 h-3.5 rounded text-blue-700 bg-slate-50 border-slate-300"
                          />
                          <span
                            className={`flex-1 leading-tight ${
                              m.completed ? 'line-through text-slate-500' : ''
                            }`}
                          >
                            {m.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="tabular-nums flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Target: {goal.targetDate}
                  </span>
                  <span
                    className={
                      goal.status === 'achieved'
                        ? 'text-emerald-700 font-semibold'
                        : 'text-blue-700 font-medium'
                    }
                  >
                    {goal.status === 'achieved' ? 'Achieved' : 'In Progress'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Habit Consistency Tracker */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-0.5">
              <Flame className="w-4 h-4" />
              <span>Daily Habits & Streaks</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Habit Tracker</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Build unshakeable momentum. Consistency compounds exponentially over semesters.
            </p>
          </div>

          <button
            onClick={() => setShowHabitForm(!showHabitForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Habit</span>
          </button>
        </div>

        {/* Inline Add Habit Form */}
        {showHabitForm && (
          <form
            onSubmit={handleCreateHabit}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3 animate-in fade-in"
          >
            <input
              type="text"
              required
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Read 30 mins C++ reference docs"
              className="flex-1 min-w-[200px] px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-300"
            />
            <select
              value={newHabitCategory}
              onChange={(e) => setNewHabitCategory(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800"
            >
              <option value="Coding">Coding</option>
              <option value="Academics">Academics</option>
              <option value="Productivity">Productivity</option>
              <option value="Wellness">Wellness</option>
            </select>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-xl text-xs font-semibold"
            >
              Save Habit
            </button>
            <button
              type="button"
              onClick={() => setShowHabitForm(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </form>
        )}

        {/* 7-Day Matrix Table */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto shadow-lg">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="p-4 font-semibold">Habit Routine</th>
                <th className="p-4 font-semibold text-center">Category</th>
                <th className="p-4 font-semibold text-center">Current Streak</th>
                {past7Days.map((d) => (
                  <th
                    key={d.dateStr}
                    className={`p-3 font-semibold text-center min-w-[48px] ${
                      d.isToday ? 'bg-blue-50 text-blue-700 font-bold' : ''
                    }`}
                  >
                    <div>{d.dayLabel}</div>
                    <div className="text-[10px] font-normal text-slate-500">{d.formatted}</div>
                  </th>
                ))}
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {habits.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-9 text-center">
                    <p className="text-xs font-medium text-slate-700">No habits in your tracker yet</p>
                    <p className="mt-1 text-[10px] text-slate-500">Add a habit to start recording daily check-ins.</p>
                  </td>
                </tr>
              ) : habits.map((habit) => (
                <tr key={habit.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-4 font-medium text-slate-800">
                    <div className="font-semibold text-sm">{habit.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Goal: {habit.targetDaysPerWeek} days/week · Best: {habit.bestStreak} days
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {habit.category}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-1 font-mono font-bold text-amber-700 tabular-nums">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{habit.streak} days</span>
                    </div>
                  </td>
                  {/* 7 Day Matrix Checkboxes */}
                  {past7Days.map((d) => {
                    const isDone = habit.completedDates.includes(d.dateStr);

                    return (
                      <td
                        key={d.dateStr}
                        className={`p-3 text-center ${d.isToday ? 'bg-blue-50/15' : ''}`}
                      >
                        <button
                          onClick={() => toggleHabitDate(habit.id, d.dateStr)}
                          className={`w-7 h-7 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer ${
                            isDone
                              ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-sm shadow-amber-500/20'
                              : 'border-slate-300 bg-slate-50 hover:border-slate-500'
                          }`}
                          aria-label={`Toggle habit on ${d.dateStr}`}
                        >
                          {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                      </td>
                    );
                  })}
                  <td className="p-4 text-right">
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-700"
                      title="Remove habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
