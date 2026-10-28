import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Star,
  Clock,
  FileCheck2,
  Briefcase,
  CheckSquare,
  Calendar as CalendarIcon,
  Target,
  Settings as SettingsIcon,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    sidebarCollapsed,
    setSidebarCollapsed,
    tasks,
    hasGeminiKey,
    userProfile,
    unreadNotificationsCount,
  } = useApp();

  const { user } = useAuth();
  const pendingTasksCount = tasks.filter((task) => task.status !== 'completed').length;
  const displayName = user?.displayName || userProfile.name || 'Your Profile';
  const displaySubtitle = user?.email || (hasGeminiKey ? 'Gemini Key Configured' : 'Local Workspace');
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Student Workspace',
      items: [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'syllabus', label: 'My Learning', icon: BookOpen },
        { id: 'questions', label: 'Question Bank', icon: Star, badge: '3★ PYQ' },
        { id: 'planner', label: 'Study Planner', icon: Clock },
        { id: 'tests', label: 'Tests & Evaluation', icon: FileCheck2 },
        {
          id: 'interviews',
          label: userProfile.showPlacementModule === false ? 'Viva & Oral Prep' : 'Mock Interview',
          icon: Briefcase,
        },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount || undefined },
      ],
    },
    {
      label: 'Daily Routine',
      items: [
        { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: pendingTasksCount || undefined },
        { id: 'calendar', label: 'Exam Calendar', icon: CalendarIcon },
        { id: 'goals', label: 'Goals & Habits', icon: Target },
      ],
    },
  ];

  return (
    <aside
      className={`app-sidebar fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r transition-[width] duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      <div className={`flex h-[76px] shrink-0 items-center border-b border-slate-200 dark:border-slate-700 px-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        <button
          onClick={() => setActivePage('dashboard')}
          className={`flex min-w-0 items-center gap-3 rounded-xl text-left ${sidebarCollapsed ? '' : 'flex-1'}`}
          aria-label="LifePilot AI dashboard"
        >
          <span className="logo-mark flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#07142F] shadow-sm ring-1 ring-white/10">
            <img
              src="/icons/lifepilot-icon.png"
              alt="LifePilot AI"
              className="h-full w-full object-contain"
            />
          </span>
          {!sidebarCollapsed && (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] font-bold tracking-[-0.02em] text-slate-900 dark:text-slate-100">LifePilot AI</span>
              <span className="mt-0.5 truncate text-[10px] font-medium tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">Student Platform</span>
            </span>
          )}
        </button>

        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="ml-2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <section key={group.label}>
            {!sidebarCollapsed && (
              <h2 className="mb-2 px-3 text-[10px] font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                {group.label}
              </h2>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`nav-item group flex w-full items-center gap-3 rounded-xl px-3 py-[9px] text-[12px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className={`h-[17px] w-[17px] shrink-0 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold tabular-nums ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && isActive && <span className="absolute right-1 h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 p-3">
        {sidebarCollapsed ? (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setActivePage('settings')}
            className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 p-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Open profile and settings"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-blue-400/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                {initials || 'LP'}
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-200">{displayName}</span>
              <span className="mt-0.5 truncate text-[9px] text-slate-500 dark:text-slate-400">{displaySubtitle}</span>
            </span>
            <SettingsIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          </button>
        )}
      </div>
    </aside>
  );
};
