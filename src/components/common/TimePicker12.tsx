import React, { useId, useState } from 'react';
import { Clock, Check } from 'lucide-react';

export interface Time12Components {
  hour12: number;
  minute: number;
  period: 'AM' | 'PM';
  formatted12: string;
}

/**
 * Converts standard 24-hour time string ("HH:MM") to 12-hour components.
 * Midnight "00:00" -> 12:00 AM
 * Noon "12:00" -> 12:00 PM
 * "23:59" -> 11:59 PM
 */
export function time24To12(time24?: string): Time12Components {
  const [rawHStr, rawMStr] = (time24 || '09:00').split(':');
  const rawH = parseInt(rawHStr || '9', 10);
  const rawM = parseInt(rawMStr || '0', 10);

  const safeH = isNaN(rawH) ? 9 : Math.max(0, Math.min(23, rawH));
  const safeM = isNaN(rawM) ? 0 : Math.max(0, Math.min(59, rawM));

  const period: 'AM' | 'PM' = safeH >= 12 ? 'PM' : 'AM';
  const hour12 = safeH % 12 === 0 ? 12 : safeH % 12;
  const minute = safeM;
  const formatted12 = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;

  return { hour12, minute, period, formatted12 };
}

/**
 * Converts 12-hour components back into standard 24-hour "HH:MM" string.
 * 12:00 AM -> "00:00"
 * 12:30 AM -> "00:30"
 * 12:00 PM -> "12:00"
 * 1:30 PM -> "13:30"
 * 11:59 PM -> "23:59"
 */
export function time12To24(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  const safeH = Math.max(1, Math.min(12, hour12));
  const safeM = Math.max(0, Math.min(59, minute));

  let finalH24: number;
  if (period === 'AM') {
    finalH24 = safeH === 12 ? 0 : safeH;
  } else {
    finalH24 = safeH === 12 ? 12 : safeH + 12;
  }

  const hStr = finalH24.toString().padStart(2, '0');
  const mStr = safeM.toString().padStart(2, '0');
  return `${hStr}:${mStr}`;
}

interface TimePicker12Props {
  value?: string; // Stored internally as 'HH:MM' (24-hour e.g. '09:30' or '23:00')
  onChange: (time24: string) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Strict 12-Hour AM/PM Time Picker Component
 * Ensures the student is never presented with a 13:00–23:00 selector,
 * but stores standard 24h HH:MM internally for reliable timestamps and storage.
 */
export const TimePicker12: React.FC<TimePicker12Props> = ({
  value = '09:00',
  onChange,
  label,
  id: customId,
  disabled = false,
  className = '',
}) => {
  const generatedId = useId();
  const id = customId || generatedId;

  const { hour12, minute, period, formatted12 } = time24To12(value);
  const [showCustomMinute, setShowCustomMinute] = useState(false);
  const [customMinInput, setCustomMinInput] = useState(String(minute));

  const standardMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  // Ensure the current minute is in the options list if custom
  const minuteOptions = standardMinutes.includes(minute)
    ? standardMinutes
    : [...standardMinutes, minute].sort((a, b) => a - b);

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newH = parseInt(e.target.value, 10);
    onChange(time12To24(newH, minute, period));
  };

  const handleMinuteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setShowCustomMinute(true);
      return;
    }
    const newM = parseInt(val, 10);
    setShowCustomMinute(false);
    onChange(time12To24(hour12, newM, period));
  };

  const handleApplyCustomMin = () => {
    const parsed = parseInt(customMinInput, 10);
    const validM = isNaN(parsed) ? 0 : Math.max(0, Math.min(59, parsed));
    onChange(time12To24(hour12, validM, period));
    setShowCustomMinute(false);
  };

  const handlePeriodToggle = (newPeriod: 'AM' | 'PM') => {
    onChange(time12To24(hour12, minute, newPeriod));
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            {label}
          </span>
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 tabular-nums">
            {formatted12}
          </span>
        </label>
      )}

      <div className="flex items-center gap-1.5">
        {/* Hour (1–12) */}
        <select
          id={id}
          value={hour12}
          onChange={handleHourChange}
          disabled={disabled}
          aria-label="Hour (1 to 12)"
          className="flex-1 min-w-[64px] p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <span className="text-slate-400 font-bold">:</span>

        {/* Minute (00 to 55 by 5s, or custom minute) */}
        {!showCustomMinute ? (
          <select
            value={minute}
            onChange={handleMinuteSelect}
            disabled={disabled}
            aria-label="Minute"
            className="flex-1 min-w-[64px] p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m}>
                {m.toString().padStart(2, '0')}
              </option>
            ))}
            <option value="custom">Custom...</option>
          </select>
        ) : (
          <div className="flex items-center gap-1 flex-1 min-w-[64px]">
            <input
              type="number"
              min="0"
              max="59"
              value={customMinInput}
              onChange={(e) => setCustomMinInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCustomMin();
                }
              }}
              autoFocus
              className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-blue-400 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 text-center focus:outline-none"
              placeholder="0-59"
              aria-label="Custom Minute"
            />
            <button
              type="button"
              onClick={handleApplyCustomMin}
              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              title="Apply custom minute"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AM / PM Toggle Pills */}
        <div className="flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePeriodToggle('AM')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'AM'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handlePeriodToggle('PM')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'PM'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};
