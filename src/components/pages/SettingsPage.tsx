import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  User,
  Clock,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Check,
  Info,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  LogIn,
  Database,
  ExternalLink,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    hasGeminiKey,
    exportAllData,
    importAllData,
    resetToSampleData,
    clearAllData,
    showToast,
    syncStatus,
    lastSyncedAt,
    triggerManualSync,
    hasPreSyncBackup,
    restorePreSyncBackup,
    openMigrationModal,
  } = useApp();
  const { user, isConfigured, authError, signInWithGoogle, logout, clearAuthError } = useAuth();

  const [name, setName] = useState(userProfile.name);
  const [title, setTitle] = useState(userProfile.title);
  const [email, setEmail] = useState(userProfile.email);
  const [university, setUniversity] = useState(userProfile.university || '');
  const [dailyFocusHours, setDailyFocusHours] = useState(
    Math.round(userProfile.dailyTargetFocusMinutes / 60)
  );
  const [dayStartTime, setDayStartTime] = useState(userProfile.dayStartTime);
  const [dayEndTime, setDayEndTime] = useState(userProfile.dayEndTime);

  const [importJsonText, setImportJsonText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim(),
      title: title.trim(),
      email: email.trim(),
      university: university.trim(),
      dailyTargetFocusMinutes: dailyFocusHours * 60,
      dayStartTime,
      dayEndTime,
    });
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifepilot-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup JSON exported successfully', 'success');
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    const ok = importAllData(importJsonText.trim());
    if (ok) {
      setImportJsonText('');
      setShowImportArea(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importAllData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {/* Top Header */}
      <div className="page-intro p-6 rounded-2xl border">
        <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>System & Preferences</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure personal study habits, AI model integration status, and manage workspace data.
        </p>
      </div>

      {/* Section 0: Google Account & Cloud Synchronization */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>Google Account &amp; Real-Time Cloud Sync</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sync tasks, recurring schedules, goals, and notes across your laptop and Android phone for ₹0.
            </p>
          </div>
          {user && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Connected
            </span>
          )}
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{authError}</div>
            </div>
            <button
              onClick={clearAuthError}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {!isConfigured && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="font-semibold flex items-center gap-2 text-amber-800">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Firebase Spark Plan Setup Required for Cloud Sync</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              LifePilot is currently running in local storage mode. To activate free Google Sign-In and real-time syncing across your laptop and Android phone, create a free Firebase project (Spark Plan) and add your credentials to <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px] font-mono">.env</code>.
            </p>
            <p className="text-[11px] text-amber-700">
              See <strong className="font-semibold">FIREBASE_SETUP.md</strong> in your project folder for exact 3-minute steps.
            </p>
          </div>
        )}

        {user ? (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google Account'}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-base">
                    {(user.displayName || user.email || 'LP')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{user.displayName || 'Google User'}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Google OAuth
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">UID: {user.uid}</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Sync Controls & Status */}
            <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Sync Status:</span>
                  {syncStatus === 'synced' && (
                    <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      All changes synced in real time
                    </span>
                  )}
                  {syncStatus === 'syncing' && (
                    <span className="font-semibold text-blue-700 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                      Syncing to Google Cloud...
                    </span>
                  )}
                  {syncStatus === 'offline' && (
                    <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                      <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                      Offline — Changes saved locally on this device
                    </span>
                  )}
                  {syncStatus === 'error' && (
                    <span className="font-semibold text-rose-700 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Sync error — Saved in local storage
                    </span>
                  )}
                  {syncStatus === 'idle' && (
                    <span className="font-medium text-slate-700">Ready</span>
                  )}
                </div>

                {lastSyncedAt && (
                  <span className="text-[11px] text-slate-400">
                    Last synced: {lastSyncedAt.toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={triggerManualSync}
                  disabled={syncStatus === 'syncing'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>

                <button
                  onClick={openMigrationModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>Resolve / Migrate Data</span>
                </button>

                {hasPreSyncBackup && (
                  <button
                    onClick={restorePreSyncBackup}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition-colors cursor-pointer"
                    title="Restore the local backup snapshot taken before cloud sync"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Restore Pre-Sync Local Backup</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-800">
                  You are currently using Local Storage Mode
                </div>
                <div className="text-xs text-slate-500">
                  Data stays stored only in this browser until you sign in with your Google account.
                </div>
              </div>

              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer shrink-0"
              >
                <Cloud className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        )}

        {/* Free Plan & Security Notice */}
        <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>₹0 Free Tier (Firebase Spark Plan) &amp; Private User Isolation</span>
          </div>
          <p>
            This app uses Cloud Firestore strictly within the free Spark Plan (50,000 reads, 20,000 writes/day free). Restrictive security rules ensure that documents under <code className="font-mono text-slate-700">users/{'{userId}'}</code> can only be read or written by your authenticated Google account.
          </p>
        </div>
      </div>

      {/* Section 1: AI Integration Status (Anti-pretend honesty) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>AI Engine Configuration & Status</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent reporting of server-side Gemini API key configuration and request status.
            </p>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
              hasGeminiKey
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-700/50'
                : 'bg-amber-50 text-amber-700 border border-amber-700/50'
            }`}
          >
            {hasGeminiKey ? 'Gemini 3.8 Flash Key Configured' : 'Gemini Setup Required'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
          {hasGeminiKey ? (
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block mb-0.5">Gemini API key detected</strong>
                <span>
                  AI Planner requests are sent from the server to Google GenAI (`gemini-3.8-flash`). The key remains on the server and is never sent to the browser.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block mb-0.5">Gemini is not configured</strong>
                <span>
                  No <code className="px-1 py-0.5 rounded bg-white text-amber-700">GEMINI_API_KEY</code> was detected. Add it to the project root `.env` file and restart the server to enable real Gemini requests.
                </span>
                <span className="block mt-1 text-slate-500">
                  API keys stay server-side. Gemini errors will be reported in the planner without generating a substitute plan.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Student Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-700" />
              <span>User Profile & Identity</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Customize your greeting and academic details.</p>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            Save Preferences
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Academic Role / Major</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Institution / Department</label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
            />
          </div>
        </div>

        {/* Scheduling Preferences */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Clock className="w-4 h-4 text-blue-700" />
            <span>Daily Schedule Constraints</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Day Start Time</label>
              <input
                type="time"
                value={dayStartTime}
                onChange={(e) => setDayStartTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Day End Time</label>
              <input
                type="time"
                value={dayEndTime}
                onChange={(e) => setDayEndTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Daily Focus Target</label>
              <select
                value={dailyFocusHours}
                onChange={(e) => setDailyFocusHours(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-300"
              >
                <option value={2}>2 Hours / day</option>
                <option value={3}>3 Hours / day</option>
                <option value={4}>4 Hours / day (Standard)</option>
                <option value={6}>6 Hours / day (Intensive)</option>
                <option value={8}>8 Hours / day (Immersive)</option>
              </select>
            </div>
          </div>
        </div>
      </form>

      {/* Section 3: Data Backup, Import, and Reset */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900">Data Management & Backup</h3>
        <p className="text-xs text-slate-500">
          Export your entire workspace including tasks, goals, habits, and notes as portable JSON.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import JSON File</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={resetToSampleData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-amber-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Student Sample Data</span>
          </button>

          <button
            onClick={clearAllData}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50/40 hover:bg-rose-50 text-rose-700 border border-rose-900/50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Workspace</span>
          </button>
        </div>

        {/* Textarea for manual JSON pasting */}
        {showImportArea ? (
          <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Paste Backup JSON Payload
            </label>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste complete JSON data here..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900"
            />
            <div className="flex gap-2">
              <button
                onClick={handleImportSubmit}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-xl text-xs font-semibold"
              >
                Apply Import
              </button>
              <button
                onClick={() => setShowImportArea(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowImportArea(true)}
            className="text-xs text-blue-700 hover:underline block pt-1"
          >
            Paste JSON manually instead?
          </button>
        )}
      </div>

      {/* About Box */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-500 space-y-1">
        <div className="font-semibold text-slate-800 text-sm mb-1">
          LifePilot AI — Your Personal AI Action Planner
        </div>
        <p>Engineered with React 19, TypeScript, Tailwind CSS, Express, and Google GenAI SDK.</p>
        <p className="text-[11px] pt-1 text-slate-500">
          Designed for high-leverage students, developers, and goal-driven achievers.
        </p>
      </div>
    </div>
  );
};
