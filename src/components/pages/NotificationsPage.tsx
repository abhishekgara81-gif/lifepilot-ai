import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TimePicker12 } from '../common/TimePicker12';
import {
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  AlertCircle,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  ShieldAlert,
  Moon,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    clearAllNotifications,
    requestBrowserNotificationPermission,
    userProfile,
    updateUserProfile,
    showToast,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [leadMinutes, setLeadMinutes] = useState(
    userProfile.notificationPreferences?.leadMinutes || 15
  );
  const [briefingTime, setBriefingTime] = useState(
    userProfile.notificationPreferences?.dailyBriefingTime || '08:00'
  );

  const displayedNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleEnableBrowserNotifications = async () => {
    const res = await requestBrowserNotificationPermission();
    if (res === 'granted') {
      showToast('Browser notifications enabled successfully!', 'success');
    }
  };

  const handleSavePreferences = () => {
    updateUserProfile({
      notificationPreferences: {
        ...(userProfile.notificationPreferences || {
          enabled: true,
          quietHoursStart: '23:00',
          quietHoursEnd: '07:00',
          browserAllowed: false,
        }),
        leadMinutes: Number(leadMinutes),
        dailyBriefingTime: briefingTime,
      },
    });
    showToast('Notification preferences saved', 'success');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exam_countdown':
        return <Calendar className="w-4 h-4 text-rose-500" />;
      case 'task_reminder':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'daily_briefing':
        return <Sparkles className="w-4 h-4 text-blue-500" />;
      case 'achievement':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                Notification Center & Study Reminders
              </h1>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                  {unreadNotificationsCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exam deadlines, study schedule alerts, daily briefings, and real-time reminders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              notifications.forEach((n) => markNotificationRead(n.id));
              showToast('All marked as read', 'info');
            }}
            disabled={unreadNotificationsCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
            Mark all read
          </button>
          <button
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>
      </div>

      {/* Honest Browser Notification Capability Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold">Browser & Device Notification Sync:</span>{' '}
            Web push notifications work actively while this browser tab is open or running in the background. Note that mobile operating systems (Android/iOS) may put background tabs to sleep to save battery. In-app alerts will always appear instantly whenever you reopen LifePilot.
          </div>
        </div>
        <button
          onClick={handleEnableBrowserNotifications}
          className="shrink-0 px-3 py-1.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
        >
          Enable Browser Push
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Notification List */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filter Pills */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Unread ({unreadNotificationsCount})
              </button>
            </div>
          </div>

          {displayedNotifications.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Bell className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No notifications right now
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upcoming exam dates, session reminders and daily study goals will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedNotifications.map((notif) => {
                const isUnread = !notif.read;
                return (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isUnread
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(notif.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Reminder & Quiet Hours Preferences */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Reminder Preferences
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Advance Study Task Reminder
              </label>
              <select
                value={leadMinutes}
                onChange={(e) => setLeadMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value={5}>5 minutes before scheduled session</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before (Recommended)</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daily Study Briefing Time (12-Hour AM/PM)
              </label>
              <TimePicker12 value={briefingTime} onChange={setBriefingTime} />
            </div>

            <button
              onClick={handleSavePreferences}
              className="w-full py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Save Preferences
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              Do Not Disturb / Quiet Hours
            </div>
            <p className="text-[11px] leading-relaxed">
              Quiet hours are active between 11:00 PM and 7:00 AM by default so you can rest uninterrupted before exam days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

