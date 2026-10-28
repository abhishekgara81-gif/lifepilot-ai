import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  Search,
  Menu,
  Sparkles,
  X,
  Cloud,
  CloudOff,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  GraduationCap,
} from 'lucide-react';
import { AcademicSetupModal } from '../modals/AcademicSetupModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

const PAGE_TITLES: Record<string, { crumb: string; title: string }> = {
  dashboard: { crumb: 'Overview', title: 'Student Success Dashboard' },
  syllabus: { crumb: 'Module 1', title: 'Syllabus & Notes Input' },
  questions: { crumb: 'Module 2', title: 'Smart Star Question Bank' },
  planner: { crumb: 'Module 3', title: 'Day-Wise Crash Study Planner' },
  tests: { crumb: 'Module 4', title: 'Multimodal Copy Checking' },
  interviews: { crumb: 'Module 5', title: 'Placement Mock Interview' },
  tasks: { crumb: 'Execution', title: 'Daily Tasks' },
  calendar: { crumb: 'Countdown', title: 'Exam Calendar' },
  goals: { crumb: 'Targets', title: 'Goals & Habits' },
  projects: { crumb: 'Portfolio', title: 'Academic Projects' },
  notifications: { crumb: 'Alerts', title: 'Notification Center' },
  settings: { crumb: 'Preferences', title: 'Settings' },
  documents: { crumb: 'Module 1', title: 'Syllabus & Notes Input' },
  student: { crumb: 'Overview', title: 'Student Success Dashboard' },
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    activePage,
    setActivePage,
    searchQuery,
    setSearchQuery,
    setTaskModalOpen,
    setEditingTask,
    userProfile,
    syncStatus,
    theme,
    toggleTheme,
    unreadNotificationsCount,
    showToast,
  } = useApp();
  const { user, signInWithGoogle } = useAuth();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [academicModalOpen, setAcademicModalOpen] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.message) {
        showToast(err.message, 'error');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const pageInfo = PAGE_TITLES[activePage] || { crumb: 'Workspace', title: 'LifePilot' };
  const todayStr = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const displayName = user?.displayName || userProfile.name || 'Your Profile';
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleQuickAddTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  return (
    <header className="app-header sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b px-3 sm:px-5 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-900 md:hidden"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <div className="hidden items-center gap-2 text-[10px] font-medium tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase sm:flex">
            <span>{pageInfo.crumb}</span>
            <span className="text-slate-400 dark:text-slate-600">/</span>
          </div>
          <h1 className="truncate text-[13px] font-semibold tracking-[-0.015em] text-slate-900 dark:text-slate-100 sm:mt-0.5 sm:text-[14px]">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      <div className="hidden w-full max-w-[420px] flex-1 sm:block">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks, goals, syllabus..."
            aria-label="Search workspace"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-10 pr-14 text-[11px] text-slate-800 dark:text-slate-200 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
          />
        </label>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <span className="mr-1 hidden text-[10px] font-medium text-slate-500 lg:inline">{todayStr}</span>

        {/* Cloud Sync Status Indicator */}
        {user ? (
          <div className="hidden lg:flex items-center">
            {syncStatus === 'synced' && (
              <span
                title="Real-time cloud sync active with your Google account"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-700 border border-emerald-200/60"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Cloud Synced
              </span>
            )}
            {syncStatus === 'syncing' && (
              <span
                title="Syncing workspace changes to Google Cloud..."
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-medium text-blue-700 border border-blue-200/60"
              >
                <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                Syncing...
              </span>
            )}
            {syncStatus === 'offline' && (
              <span
                title="Offline: Changes are saved locally on this device"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-medium text-amber-700 border border-amber-200/60"
              >
                <CloudOff className="w-3 h-3 text-amber-600" />
                Offline
              </span>
            )}
            {syncStatus === 'error' && (
              <span
                title="Cloud sync encountered an issue. Changes remain saved locally."
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-[10px] font-medium text-rose-700 border border-rose-200/60"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Sync Alert
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-[10px] font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-xs disabled:opacity-60"
            title="Sign in with your Google account for cross-device synchronization"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{isSigningIn ? 'Connecting...' : 'Google Sign-In'}</span>
          </button>
        )}

        {/* Academic Stream Pill */}
        <button
          onClick={() => setAcademicModalOpen(true)}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-[10px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100/60 transition-colors"
          title="Change academic stream / curriculum setup"
        >
          <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="truncate max-w-[130px]">{userProfile.courseOrClass || 'Academic Setup'}</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setActivePage('notifications')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
          title="Notifications & reminders"
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
          )}
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        <button
          onClick={() => setMobileSearchOpen((open) => !open)}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-900 sm:hidden"
          aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
          aria-expanded={mobileSearchOpen}
        >
          {mobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </button>
        {activePage !== 'planner' && (
          <button
            onClick={() => setActivePage('planner')}
            className="hidden items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/50 px-3 py-2 text-[10px] font-semibold text-blue-700 dark:text-blue-300 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/60 md:flex"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            AI Planner
          </button>
        )}
        <button
          onClick={handleQuickAddTask}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-2.5 py-2 text-[10px] font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 sm:px-3"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New task</span>
          <span className="sm:hidden">Add</span>
        </button>
        <button
          onClick={() => setActivePage('settings')}
          className="group flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800"
          title="Open profile and settings"
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="h-8 w-8 rounded-[11px] object-cover ring-1 ring-blue-400/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-[11px] border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-[10px] font-bold text-blue-700 dark:text-blue-300">
              {initials || 'LP'}
            </span>
          )}
          <span className="hidden max-w-[125px] flex-col text-left lg:flex">
            <span className="truncate text-[10px] font-semibold text-slate-800 dark:text-slate-200">{displayName}</span>
            <span className="truncate text-[9px] text-slate-500 dark:text-slate-400">
              {user ? 'Google Account' : 'Local Storage'}
            </span>
          </span>
        </button>
      </div>

      {mobileSearchOpen && (
        <div className="absolute inset-x-0 top-full border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-xl sm:hidden">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search your workspace..."
              aria-label="Search workspace"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </label>
        </div>
      )}

      <AcademicSetupModal
        isOpen={academicModalOpen}
        onClose={() => setAcademicModalOpen(false)}
      />
    </header>
  );
};
