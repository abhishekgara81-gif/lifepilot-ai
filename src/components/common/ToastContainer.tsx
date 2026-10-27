import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let borderClass = 'border-slate-300 bg-white text-slate-800';
        let Icon = Info;
        let iconColor = 'text-blue-700';

        if (toast.type === 'success') {
          borderClass = 'border-emerald-600/40 bg-emerald-50 text-emerald-800';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-700';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-600/40 bg-rose-50 text-rose-800';
          Icon = AlertCircle;
          iconColor = 'text-rose-700';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-600/40 bg-amber-50 text-amber-800';
          Icon = AlertTriangle;
          iconColor = 'text-amber-700';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md text-xs sm:text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${borderClass}`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 leading-snug">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded text-slate-500 hover:text-slate-900 shrink-0 -mr-1 -mt-1"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
