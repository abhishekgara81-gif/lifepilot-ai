import React from 'react';
import { Cloud, ArrowRight, ShieldCheck, Database, RefreshCw, X } from 'lucide-react';
import { Task, Goal, Habit } from '../../types';
import { CloudWorkspacePayload } from '../../services/cloudSyncService';

interface DataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  localStats: {
    tasksCount: number;
    goalsCount: number;
    habitsCount: number;
  };
  cloudData: CloudWorkspacePayload | null;
  onConfirmMerge: () => Promise<void>;
  onConfirmUseCloud: () => Promise<void>;
  onConfirmUploadLocal: () => Promise<void>;
  isProcessing: boolean;
}

export const DataMigrationModal: React.FC<DataMigrationModalProps> = ({
  isOpen,
  onClose,
  localStats,
  cloudData,
  onConfirmMerge,
  onConfirmUseCloud,
  onConfirmUploadLocal,
  isProcessing,
}) => {
  if (!isOpen) return null;

  const cloudTasksCount = cloudData?.tasks?.length || 0;
  const cloudGoalsCount = cloudData?.goals?.length || 0;
  const cloudHabitsCount = cloudData?.habits?.length || 0;
  const hasCloudData = Boolean(cloudData && (cloudTasksCount > 0 || cloudGoalsCount > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {hasCloudData ? 'Sync Account Workspace' : 'Upload Local Data to Cloud'}
              </h2>
              <p className="text-[11px] text-slate-500">Google Cloud Workspace Synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
            aria-label="Close migration dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {hasCloudData ? (
              <>
                We found workspace data in your <strong>Google Cloud account</strong> and on this <strong>device</strong>.
                Choose how you want to synchronize them:
              </>
            ) : (
              <>
                You have active tasks and workspace data on this device. Would you like to upload them to your Google
                account so you can access them on your phone and laptop?
              </>
            )}
          </p>

          {/* Stats Comparison */}
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-blue-600" />
                <span>On This Device</span>
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {localStats.tasksCount} Tasks · {localStats.goalsCount} Goals
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{localStats.habitsCount} Habits</div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-blue-50/40">
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Cloud className="w-3 h-3 text-blue-600" />
                <span>In Google Cloud</span>
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {hasCloudData ? `${cloudTasksCount} Tasks · ${cloudGoalsCount} Goals` : 'Empty (First Sync)'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {hasCloudData ? `${cloudHabitsCount} Habits` : 'Ready to receive data'}
              </div>
            </div>
          </div>

          {/* Safety Backup Notice */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex items-start gap-2 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Safety Backup Created:</span> An automatic snapshot of this device's data
              has been saved in local storage. You can revert at any time in Settings.
            </div>
          </div>

          {/* Action Choices */}
          <div className="space-y-2 pt-2">
            {hasCloudData ? (
              <>
                <button
                  onClick={onConfirmMerge}
                  disabled={isProcessing}
                  className="w-full p-3 rounded-xl border-2 border-blue-600 bg-blue-50/50 hover:bg-blue-100/60 transition-colors text-left flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <span>Merge Both Datasets</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-600 text-white font-medium">Recommended</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Combines items from both device and cloud without creating duplicates.
                    </div>
                  </div>
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-blue-600 transition-transform group-hover:translate-x-1" />
                  )}
                </button>

                <button
                  onClick={onConfirmUseCloud}
                  disabled={isProcessing}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors text-left flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Use Cloud Workspace Only</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Loads data from your Google Cloud account. Local items remain safely in backup.
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={onConfirmUploadLocal}
                  disabled={isProcessing}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors text-left text-xs text-slate-600 hover:text-slate-900"
                >
                  Overwrite Cloud with This Device's Data
                </button>
              </>
            ) : (
              <button
                onClick={onConfirmUploadLocal}
                disabled={isProcessing}
                className="w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading Workspace...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Upload &amp; Enable Real-Time Cloud Sync</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

