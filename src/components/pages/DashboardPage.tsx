import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Star,
  Clock,
  FileCheck2,
  Briefcase,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Award,
  Check,
  Flame,
  Layers,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Target,
  FileText,
} from 'lucide-react';
import { getRelativeDate, formatTime12, formatTimeRangeWithMidnight } from '../../data/initialData';
import { Task, CrashStudyTask } from '../../types';
import { AcademicSetupModal } from '../modals/AcademicSetupModal';

export const DashboardPage: React.FC = () => {
  const [academicModalOpen, setAcademicModalOpen] = React.useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return new URLSearchParams(window.location.search).get('modal') === 'academic';
      }
    } catch {}
    return false;
  });
  const {
    subjects,
    selectedSubjectId,
    setSelectedSubjectId,
    questions,
    crashPlans,
    activeCrashPlan,
    toggleCrashTask,
    testAttempts,
    interviewReports,
    userProfile,
    tasks,
    toggleTaskStatus,
    setActivePage,
    hasGeminiKey,
  } = useApp();

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const todayStr = getRelativeDate(0);

  // Today's Study Priorities from Crash Planner
  const activePlan = activeCrashPlan;
  const todayCrashDay = activePlan?.days.find((d) => d.date === todayStr) || activePlan?.days[0];
  const todayCrashTasks = todayCrashDay ? todayCrashDay.tasks : [];

  // Pinned Daily Spoken English Task
  const dailyEnglishTask = tasks.find(
    (t) => t.id === 'task-daily-spoken-english' || t.title.toLowerCase().includes('spoken english')
  );

  // Today's study hours calculation
  const totalPlannedMinutes = todayCrashTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0) + (dailyEnglishTask ? 60 : 0);
  const targetFocusMinutes = userProfile.dailyTargetFocusMinutes || 240;
  const studyHoursProgress = Math.min(100, Math.round((totalPlannedMinutes / targetFocusMinutes) * 100));

  // Study plan completion percentage
  const allCrashTasks = activePlan ? activePlan.days.flatMap((d) => d.tasks) : [];
  const completedCrashTasks = allCrashTasks.filter((t) => t.completed);
  const planCompletionPct = allCrashTasks.length
    ? Math.round((completedCrashTasks.length / allCrashTasks.length) * 100)
    : 0;

  // Recent test attempts & average score
  const recentTests = testAttempts.slice(0, 3);
  const avgTestScore = testAttempts.length
    ? Math.round(testAttempts.reduce((sum, t) => sum + t.percentage, 0) / testAttempts.length)
    : 0;

  // Recent mock interview
  const latestInterview = interviewReports[0] || null;

  // Question bank statistics
  const threeStarCount = questions.filter((q) => q.stars === 3).length;

  return (
    <div className="space-y-7 pb-16 max-w-6xl">
      {/* Top Academic Greeting Header */}
      <div className="page-intro p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Academic Performance Dashboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome back, {userProfile.name.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {userProfile.courseOrClass || userProfile.branch || 'B.Tech CSE'}
            {userProfile.educationLevel === 'school'
              ? ` · ${userProfile.boardOrUniversity || 'CBSE'}${userProfile.branchOrStream ? ` (${userProfile.branchOrStream})` : ''}`
              : ` (${userProfile.currentYearOrSem || `Semester ${userProfile.semester || 5}`}) · ${userProfile.boardOrUniversity || userProfile.university || 'Curriculum'}`}
          </p>
        </div>

        {/* Engine Status, Exam Alert & Stream Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setAcademicModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors shadow-xs"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Switch Stream</span>
          </button>

          <div
            title={hasGeminiKey ? 'Gemini API key configured. Deterministic local fallbacks automatically engaged on network timeouts.' : 'Local academic engine active.'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-medium"
          >
            <span className={`w-2 h-2 rounded-full ${hasGeminiKey ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span>{hasGeminiKey ? 'Gemini Key Configured · Hybrid' : 'Local Fallback Engine Active'}</span>
          </div>

          {activeSubject?.examDate && (
            <div
              title={`${activeSubject.name} Exam: ${activeSubject.examDate}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200/80 dark:border-blue-900/60"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Exam Date: {activeSubject.examDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Core Student Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Planned Study Hours */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today&apos;s Focus Hours</span>
            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {Math.round(totalPlannedMinutes / 60 * 10) / 10} <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">/ {Math.round(targetFocusMinutes / 60)}h Target</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, studyHoursProgress)}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            {todayCrashTasks.length} topics scheduled today
          </span>
        </div>

        {/* Metric 2: Study Plan Completion */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Crash Plan Progress</span>
            <TrendingUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {planCompletionPct}% <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Done</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, planCompletionPct)}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            {completedCrashTasks.length} / {allCrashTasks.length} tasks completed
          </span>
        </div>

        {/* Metric 3: Recent Test Average Score */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Test Average Score</span>
            <Award className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {testAttempts.length > 0 ? `${avgTestScore}%` : '—'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            {testAttempts.length > 0
              ? `${testAttempts.length} evaluated ${testAttempts.length === 1 ? 'test' : 'tests'} on record`
              : 'No evaluated tests yet'}
          </span>
          <button
            onClick={() => setActivePage('tests')}
            className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 pt-0.5"
          >
            <span>Take test or check copy</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 4: Placement Readiness */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {userProfile.showPlacementModule === false ? 'Viva Readiness' : 'Placement Readiness'}
            </span>
            <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
            {latestInterview?.readinessRating
              ? latestInterview.readinessRating
              : (userProfile.showPlacementModule === false ? 'Viva Prep Pending' : 'Evaluation Pending')}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
            {latestInterview
              ? `Tech: ${latestInterview.overallTechnicalScore}% · Comm: ${latestInterview.overallCommunicationScore}%`
              : (userProfile.showPlacementModule === false
                  ? 'Take a viva round to assess concept defense'
                  : 'Take an interview round to get scored')}
          </span>
          <button
            onClick={() => setActivePage('interviews')}
            className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 pt-0.5"
          >
            <span>{userProfile.showPlacementModule === false ? 'Practice viva' : 'View placement report'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Access to the Five Core Modules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Core Student Modules
          </h2>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Exam preparation, practice, evaluation &amp; hiring</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Module 1 Card */}
          <div
            onClick={() => setActivePage('syllabus')}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400 transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Module 1</span>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Syllabus &amp; Notes
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Configure units, upload PDFs &amp; search syllabus topics.
            </p>
          </div>

          {/* Module 2 Card */}
          <div
            onClick={() => setActivePage('questions')}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400 transition-colors">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Module 2</span>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Question Bank
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Smart 3★ PYQs backed by previous year frequency records.
            </p>
          </div>

          {/* Module 3 Card */}
          <div
            onClick={() => setActivePage('planner')}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400 transition-colors">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Module 3</span>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Crash Planner
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Day-wise timeblocked schedule with automatic rescheduling.
            </p>
          </div>

          {/* Module 4 Card */}
          <div
            onClick={() => setActivePage('tests')}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400 transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Module 4</span>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Copy Checking
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Handwritten photo check, voice viva &amp; typed answer scoring.
            </p>
          </div>

          {/* Module 5 Card */}
          <div
            onClick={() => setActivePage('interviews')}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400 transition-colors">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Module 5</span>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {userProfile.showPlacementModule === false ? 'Viva & Oral Prep' : 'Mock Interview'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {userProfile.showPlacementModule === false
                ? 'Practical viva, oral examiner questions & concept defense.'
                : 'Placement technical rounds for CSE, ECE, AI/ML & Mechanical.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Priorities (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Today&apos;s High-Yield Study Priorities</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Day {todayCrashDay?.dayNumber || 1} of your crash study plan for {activeSubject?.name || 'Selected Subject'}
                </p>
              </div>

              <button
                onClick={() => setActivePage('planner')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Full Schedule</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Pinned Daily Spoken English Practice Routine */}
            {dailyEnglishTask && (
              <div
                onClick={() => toggleTaskStatus(dailyEnglishTask.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  dailyEnglishTask.status === 'completed'
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-75'
                    : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    dailyEnglishTask.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'border-2 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                  }`}
                >
                  {dailyEnglishTask.status === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      Core Routine
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      11:00 PM – 12:00 AM (midnight)
                    </span>
                  </div>
                  <h4
                    className={`text-sm font-semibold text-slate-900 dark:text-slate-100 ${
                      dailyEnglishTask.status === 'completed' ? 'line-through text-slate-500 dark:text-slate-400' : ''
                    }`}
                  >
                    {dailyEnglishTask.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {dailyEnglishTask.description}
                  </p>
                </div>
              </div>
            )}

            {/* Day Tasks from Crash Plan */}
            <div className="space-y-2.5">
              {todayCrashTasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No crash tasks generated yet. Visit Crash Planner to generate your schedule.
                </div>
              ) : (
                todayCrashTasks.map((t: CrashStudyTask) => (
                  <div
                    key={t.id}
                    onClick={() => activePlan && toggleCrashTask(activePlan.id, t.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      t.completed
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-75'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        t.completed
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-600'
                      }`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                          {t.type.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {t.durationMinutes} mins
                        </span>
                      </div>
                      <h4
                        className={`text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 ${
                          t.completed ? 'line-through text-slate-500 dark:text-slate-400' : ''
                        }`}
                      >
                        {t.topic}
                      </h4>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Exam Countdowns & Verified PYQ Highlights (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Upcoming Exam Countdowns */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{userProfile.educationLevel === 'school' ? 'Upcoming Board & School Examinations' : 'Upcoming Examinations'}</span>
            </h3>

            <div className="space-y-2.5">
              {subjects.map((sub) => {
                const daysDiff = sub.examDate
                  ? Math.max(0, Math.ceil((new Date(`${sub.examDate}T00:00:00`).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                  : null;

                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubjectId(sub.id);
                      setActivePage('planner');
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-800/50 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {sub.code && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {sub.code}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{sub.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                        {sub.units.length} Syllabus Units
                      </span>
                    </div>

                    <div className="text-right">
                      {daysDiff !== null ? (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          daysDiff <= 7
                            ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                            : daysDiff <= 30
                            ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                            : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                        }`}>
                          {daysDiff} Days
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">Date pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High-Yield 3-Star PYQs Highlight */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>High-Yield 3-Star PYQs ({threeStarCount})</span>
              </h3>
              <button
                onClick={() => setActivePage('questions')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Questions with repeated verified appearance in previous university papers:
            </p>

            <div className="space-y-2">
              {questions
                .filter((q) => q.stars === 3)
                .slice(0, 2)
                .map((q) => (
                  <div
                    key={q.id}
                    onClick={() => setActivePage('questions')}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                      <span>{q.subjectName} · Unit {q.unit}</span>
                      <span>{q.expectedMarks} Marks</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 line-clamp-2">{q.question}</p>
                    <div className="text-[10px] text-amber-800 dark:text-amber-400 font-medium">
                      Repeated {q.repetitionCount}x in {q.sourcePapers?.join(', ')}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <AcademicSetupModal
        isOpen={academicModalOpen}
        onClose={() => setAcademicModalOpen(false)}
      />
    </div>
  );
};
