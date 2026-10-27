import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Sparkles,
  CheckSquare,
  Calendar,
  Target,
  FolderKanban,
  GraduationCap,
  FileText,
  BarChart3,
  Settings,
  X,
  Cloud,
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { activePage, setActivePage, tasks, userProfile } = useApp();
  const { user, signInWithGoogle } = useAuth();
  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;
  const displayName = user?.displayName || userProfile.name || 'Your Profile';
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (!isOpen) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'AI Planner', icon: Sparkles },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badge: pendingTasksCount || undefined },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'goals', label: 'Goals & Habits', icon: Target },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'student', label: 'Learning Center', icon: GraduationCap },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setActivePage(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="app-sidebar relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#07142F] flex items-center justify-center ring-1 ring-slate-200">
              <img
                src="/icons/lifepilot-icon.png"
                alt="LifePilot AI"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-slate-900 text-base">LifePilot AI</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-300/30'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-200 pt-3 text-xs text-slate-500 space-y-2">
          <div className="flex items-center gap-2.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="h-8 w-8 rounded-lg object-cover ring-1 ring-blue-400/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-300/20 bg-blue-50 text-[10px] font-bold text-blue-900">
                {initials || 'LP'}
              </div>
            )}
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-slate-800">{displayName}</span>
              <span className="mt-0.5 truncate text-[10px] text-slate-500">
                {user?.email || 'Local Storage'}
              </span>
            </div>
          </div>
          {!user && (
            <button
              onClick={() => {
                onClose();
                signInWithGoogle();
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
