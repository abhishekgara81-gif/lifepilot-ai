import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Flame,
  Check,
  Plus,
  RefreshCw,
  HelpCircle,
  Sun,
  Target,
} from 'lucide-react';
import { generateCrashPlan } from '../../services/studentAIService';
import { getRelativeDate, formatTime12 } from '../../data/initialData';
import { CrashStudyPlan, StudyTaskType } from '../../types';

export const CrashPlannerPage: React.FC = () => {
  const {
    subjects,
    selectedSubjectId,
    setSelectedSubjectId,
    crashPlans,
    activeCrashPlan,
    saveCrashPlan,
    toggleCrashTask,
    rescheduleMissedTasks,
    userProfile,
    showToast,
  } = useApp();

  const [examDate, setExamDate] = useState(() => getRelativeDate(18));
  const [dailyHours, setDailyHours] = useState<number>(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handleGeneratePlan = async () => {
    if (!activeSubject) {
      showToast('Please select or add a subject first.', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const plan = await generateCrashPlan({
        subjectName: activeSubject.name,
        subjectId: activeSubject.id,
        examDate,
        dailyHours,
        units: activeSubject.units.map((u) => ({
          unitNumber: u.unitNumber,
          title: u.title,
          topics: u.topics,
        })),
      });

      saveCrashPlan(plan);
      showToast(`Crash study plan generated for ${activeSubject.name}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate crash study plan.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculations for current plan
  const plan = activeCrashPlan;
  const allTasks = plan ? plan.days.flatMap((d) => d.tasks) : [];
  const completedTasks = allTasks.filter((t) => t.completed);
  const missedTasks = allTasks.filter((t) => t.missed);
  const pendingTasks = allTasks.filter((t) => !t.completed && !t.missed);
  const completionPercentage = allTasks.length
    ? Math.round((completedTasks.length / allTasks.length) * 100)
    : 0;

  const todayStr = getRelativeDate(0);
  const activeDay = plan?.days.find((d) => d.dayNumber === selectedDayNumber) || plan?.days[0];

  const getTaskTimeSlot = (index: number, durationMinutes: number) => {
    const startHourMin = userProfile.studyHours?.start || userProfile.dayStartTime || '08:00';
    const [startH, startM] = startHourMin.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM + index * 90;
    const endTotalMinutes = startTotalMinutes + durationMinutes;

    const toHHMM = (totalM: number) => {
      const h = Math.floor((totalM % 1440) / 60);
      const m = totalM % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    return `${formatTime12(toHHMM(startTotalMinutes))} – ${formatTime12(toHHMM(endTotalMinutes))}`;
  };

  const taskTypeBadge = (type: StudyTaskType) => {
    switch (type) {
      case 'study':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">Concept Study</span>;
      case 'practice_questions':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">PYQ Practice</span>;
      case 'revision':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300">Rapid Revision</span>;
      case 'mock_test':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">Timed Mock Test</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-6xl">
      {/* Header Banner */}
      <div className="page-intro p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Module 3 · Exam Countdown Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Day-Wise Crash Study Planner
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Transform syllabus topics into a daily timeblocked study plan. Missed a day? Reschedule without losing progress.
          </p>
        </div>

        {plan && (
          <button
            onClick={() => rescheduleMissedTasks(plan.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Reschedule Missed Tasks</span>
          </button>
        )}
      </div>

      {/* Plan Generator & Parameter Controls Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Study Plan Parameters</span>
          </span>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Target Subject: <strong className="text-slate-900 dark:text-slate-100">{activeSubject?.name || 'None'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Exam Date</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Daily Study Hours</label>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value={2}>2 Hours / Day (Light Revision)</option>
              <option value={3}>3 Hours / Day (Steady)</option>
              <option value={4}>4 Hours / Day (Intensive Recommended)</option>
              <option value={6}>6 Hours / Day (Final Week Sprint)</option>
              <option value={8}>8 Hours / Day (Full Day Immersion)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Building Daily Schedule...' : 'Generate Day-Wise Crash Plan'}</span>
          </button>
        </div>
      </div>

      {/* Plan Dashboard Cards */}
      {plan ? (
        <div className="space-y-6">
          {/* Daily Briefing Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-base font-bold">
                  Daily Study Briefing: Day {activeDay?.dayNumber || 1} of {plan.totalDays || plan.days.length}
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 font-semibold backdrop-blur-xs">
                Window: {formatTime12(userProfile.studyHours?.start || userProfile.dayStartTime || '08:00')} – {formatTime12(userProfile.studyHours?.end || userProfile.dayEndTime || '22:00')}
              </span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Today&apos;s Focus Theme: <strong className="text-white">{activeDay?.theme}</strong>. You have {activeDay?.tasks.length || 0} scheduled sessions totaling {Math.round((activeDay?.targetMinutes || 180) / 60)} hours. Complete each session to maintain your countdown streak.
            </p>
          </div>

          {/* Progress Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Days to Exam</span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{plan.daysRemaining} Days</div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Exam: {plan.examDate}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan Completion</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{completionPercentage}%</div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed Tasks</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {completedTasks.length} / {allTasks.length}
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                {pendingTasks.length} pending
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Missed Topics</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{missedTasks.length}</div>
              <span className="text-[11px] text-amber-700 dark:text-amber-400">Can be rescheduled anytime</span>
            </div>
          </div>

          {/* Day Selector Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {plan.days.map((day) => {
              const isSelected = activeDay?.dayNumber === day.dayNumber;
              const dayCompletedCount = day.tasks.filter((t) => t.completed).length;
              const allDone = dayCompletedCount === day.tasks.length && day.tasks.length > 0;
              const isToday = day.date === todayStr;

              return (
                <button
                  key={day.dayNumber}
                  onClick={() => setSelectedDayNumber(day.dayNumber)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>Day {day.dayNumber}</span>
                  {isToday && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${isSelected ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'}`}>
                      Today
                    </span>
                  )}
                  {allDone && (
                    <span className={isSelected ? 'text-white' : 'text-emerald-600'}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Day Detail Card */}
          {activeDay && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      Day {activeDay.dayNumber}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{activeDay.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{activeDay.theme}</h3>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Target: {Math.round(activeDay.targetMinutes / 60)} Hours</span>
                </div>
              </div>

              {/* Day Tasks List */}
              <div className="space-y-3">
                {activeDay.tasks.map((task, tIdx) => (
                  <div
                    key={task.id}
                    onClick={() => toggleCrashTask(plan.id, task.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      task.completed
                        ? 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 opacity-75'
                        : task.missed
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        task.completed
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-600'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {taskTypeBadge(task.type)}
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Unit {task.unit}
                          </span>
                          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded tabular-nums">
                            {getTaskTimeSlot(tIdx, task.durationMinutes)}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{task.durationMinutes} mins</span>
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug ${
                          task.completed ? 'line-through text-slate-500 dark:text-slate-400' : ''
                        }`}
                      >
                        {task.topic}
                      </h4>

                      {task.missed && (
                        <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Past deadline — Click &quot;Reschedule Missed Tasks&quot; to roll into future days.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No active crash study plan</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pick your exam date and study hours above to build an optimized day-wise schedule.
          </p>
        </div>
      )}
    </div>
  );
};

