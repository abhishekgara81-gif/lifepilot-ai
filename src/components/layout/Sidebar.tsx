import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Sparkles,
  CheckSquare,
  Calendar as CalendarIcon,
  Target,
  FolderKanban,
  GraduationCap,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
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
  } = useApp();

  const { user } = useAuth();
  const pendingTasksCount = tasks.filter((task) => task.status !== 'completed').length;
  const displayName = user?.displayName || userProfile.name || 'Your Profile';
  const displaySubtitle = user?.email || (hasGeminiKey ? 'Gemini connected' : 'Local workspace');
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'planner', label: 'AI Planner', icon: Sparkles, badge: hasGeminiKey ? 'Live' : 'Setup' },
        { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: pendingTasksCount || undefined },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
      ],
    },
    {
      label: 'Growth',
      items: [
        { id: 'goals', label: 'Goals & Habits', icon: Target },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'student', label: 'Learning Center', icon: GraduationCap },
      ],
    },
    {
      label: 'Library',
      items: [
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
  ];

  return (
    <aside
      className={`app-sidebar fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r transition-[width] duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      <div className={`flex h-[76px] shrink-0 items-center border-b px-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        <button
          onClick={() => setActivePage('dashboard')}
          className={`flex min-w-0 items-center gap-3 rounded-xl text-left ${sidebarCollapsed ? '' : 'flex-1'}`}
          aria-label="LifePilot AI dashboard"
        >
          <span className="logo-mark flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#07142F] shadow-md ring-1 ring-white/20">
            <img
              src="/icons/lifepilot-icon.png"
              alt="LifePilot AI"
              className="h-full w-full object-contain"
            />
          </span>
          {!sidebarCollapsed && (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] font-bold tracking-[-0.03em] text-slate-900">LifePilot AI</span>
              <span className="mt-0.5 truncate text-[10px] font-medium tracking-[0.12em] text-slate-500 uppercase">Personal workspace</span>
            </span>
          )}
        </button>

        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="ml-2 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-800"
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
              <h2 className="mb-2 px-3 text-[9px] font-bold tracking-[0.16em] text-slate-500 uppercase">
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
                    className={`nav-item group flex w-full items-center gap-3 rounded-xl px-3 py-[10px] text-[12px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'text-blue-800'
                        : 'text-slate-500 hover:bg-slate-100/45 hover:text-slate-800'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className={`h-[17px] w-[17px] shrink-0 transition-colors ${isActive ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-700'}`} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold tabular-nums ${
                            isActive ? 'bg-blue-400/15 text-blue-800' : 'bg-slate-100/90 text-slate-500 group-hover:text-slate-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && isActive && <span className="absolute right-1 h-1.5 w-1.5 rounded-full bg-blue-300" />}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <section>
          {!sidebarCollapsed && (
            <h2 className="mb-2 px-3 text-[9px] font-bold tracking-[0.16em] text-slate-500 uppercase">Preferences</h2>
          )}
          <button
            onClick={() => setActivePage('settings')}
            aria-current={activePage === 'settings' ? 'page' : undefined}
            className={`nav-item group flex w-full items-center gap-3 rounded-xl px-3 py-[10px] text-[12px] font-medium transition-all duration-150 ${
              activePage === 'settings' ? 'text-blue-800' : 'text-slate-500 hover:bg-slate-100/45 hover:text-slate-800'
            } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
            title={sidebarCollapsed ? 'Settings' : undefined}
          >
            <SettingsIcon className={`h-[17px] w-[17px] shrink-0 ${activePage === 'settings' ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-700'}`} />
            {!sidebarCollapsed && <span className="text-left">Settings</span>}
          </button>
        </section>
      </nav>

      <div className="shrink-0 border-t border-slate-200/70 p-3">
        {sidebarCollapsed ? (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100/70 hover:text-slate-900"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setActivePage('settings')}
            className="flex w-full items-center gap-2.5 rounded-xl border border-slate-300/50 bg-slate-50/55 p-2.5 text-left transition-colors hover:border-slate-300/70 hover:bg-slate-50"
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
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-blue-500/20 text-[10px] font-bold text-blue-900">
                {initials || 'LP'}
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[11px] font-semibold text-slate-800">{displayName}</span>
              <span className="mt-0.5 truncate text-[9px] text-slate-500">{displaySubtitle}</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          </button>
        )}
      </div>
    </aside>
  );
};
