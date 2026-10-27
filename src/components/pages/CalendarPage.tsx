import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  Info,
  Repeat,
} from 'lucide-react';
import { getRelativeDate, formatTime12, formatTimeRangeWithMidnight } from '../../data/initialData';
import { Task } from '../../types';

export const CalendarPage: React.FC = () => {
  const { tasks, setTaskModalOpen, setEditingTask } = useApp();

  const [calendarView, setCalendarView] = useState<'week' | 'day'>('week');
  const [currentOffsetDays, setCurrentOffsetDays] = useState(0);

  // Generate 7 days for week view around offset
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + currentOffsetDays + (i - 3)); // 3 days before to 3 days after
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: d.toISOString().split('T')[0] === getRelativeDate(0),
    };
  });

  const selectedDay = weekDays.find((d) => d.dateStr === getRelativeDate(currentOffsetDays)) || weekDays[3];

  const hours = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
    '23:00',
  ];

  // Preset sample routine slots for context (clearly tagged as "Sample Routine")
  const sampleRoutines = [
    { dayOffset: 0, time: '08:30', duration: '30m', title: 'Morning Planning & Goals Review' },
    { dayOffset: 0, time: '13:00', duration: '45m', title: 'Lunch & Technical Podcast' },
    { dayOffset: 1, time: '08:30', duration: '30m', title: 'Morning Diagnostic Review' },
    { dayOffset: 2, time: '18:00', duration: '60m', title: 'Aerobic Exercise & Recovery' },
  ];

  const handleSlotClick = (dateStr: string, timeStr: string) => {
    const startH = parseInt(timeStr.slice(0, 2), 10);
    const endH = (startH + 1) % 24;
    const endTimeStr = `${endH.toString().padStart(2, '0')}:00`;
    setEditingTask({
      id: '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      category: 'study',
      dueDate: dateStr,
      dueTime: timeStr,
      startTime: timeStr,
      endTime: endTimeStr,
      recurrence: 'none',
      estimatedMinutes: 60,
      createdAt: new Date().toISOString(),
      subtasks: [],
    });
    setTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const isTaskForDayAndHour = (t: Task, dateStr: string, hour: string) => {
    const matchesDay = t.recurrence === 'daily' || t.dueDate === dateStr;
    if (!matchesDay) return false;

    const targetHour = hour.slice(0, 2);
    if (t.startTime) {
      return t.startTime.startsWith(targetHour);
    }
    if (t.dueTime) {
      return t.dueTime.startsWith(targetHour);
    }
    return hour === '14:00';
  };

  const formatTaskTimeCompact = (t: Task) => {
    if (t.startTime && t.endTime) {
      return `${formatTime12(t.startTime)} – ${formatTime12(t.endTime)}`;
    }
    if (t.startTime) {
      return formatTime12(t.startTime);
    }
    if (t.dueTime) {
      return formatTime12(t.dueTime);
    }
    return `${t.estimatedMinutes}m`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Calendar Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setCurrentOffsetDays((prev) => prev - (calendarView === 'week' ? 7 : 1))}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentOffsetDays(0)}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentOffsetDays((prev) => prev + (calendarView === 'week' ? 7 : 1))}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-sm font-semibold text-slate-900">
            {weekDays[0].monthName} {weekDays[0].dayNumber} – {weekDays[6].monthName} {weekDays[6].dayNumber}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Day vs Week switcher */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                calendarView === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setCalendarView('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                calendarView === 'day' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Day View
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Task</span>
          </button>
        </div>
      </div>

      {/* Legend Notice for Data Transparency */}
      <div className="px-4 py-2.5 rounded-xl bg-slate-50/60 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-700 shrink-0" />
          <span>Calendar Legend:</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
            <span className="text-slate-800 font-medium">Actual Saved Tasks (Click to edit)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-dashed border-slate-500" />
            <span className="text-slate-500">Sample Study Routine</span>
          </div>
        </div>
      </div>

      {/* Week View Grid */}
      {calendarView === 'week' && (
          <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto shadow-lg">
          {/* Day Headers */}
          <div className="grid min-w-[900px] grid-cols-8 border-b border-slate-200 bg-slate-50">
            <div className="p-3 text-xs font-medium text-slate-500 text-center border-r border-slate-200/80">
              Time
            </div>
            {weekDays.map((d) => (
              <div
                key={d.dateStr}
                className={`p-3 text-center border-r last:border-r-0 border-slate-200/80 ${
                  d.isToday ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {d.dayName}
                </div>
                <div
                  className={`text-sm font-bold mt-0.5 tabular-nums inline-block px-2 py-0.5 rounded-full ${
                    d.isToday ? 'bg-blue-600 text-white' : 'text-slate-800'
                  }`}
                >
                  {d.dayNumber}
                </div>
              </div>
            ))}
          </div>

          {/* Time Rows */}
          <div className="min-w-[900px] max-h-[650px] divide-y divide-slate-200/70 overflow-y-auto">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[82px] group">
                {/* Hour Label */}
                <div className="p-2 text-right pr-3 text-xs font-mono text-slate-500 border-r border-slate-200/80 select-none">
                  {hour}
                </div>

                {/* 7 Day cells */}
                {weekDays.map((d) => {
                  // Find user tasks matching this date and roughly this hour
                  const dayTasks = tasks.filter((t) => isTaskForDayAndHour(t, d.dateStr, hour));

                  // Sample routine
                  const routine = sampleRoutines.find(
                    (r) =>
                      getRelativeDate(r.dayOffset) === d.dateStr &&
                      r.time.startsWith(hour.slice(0, 2))
                  );

                  return (
                    <div
                      key={d.dateStr}
                      onClick={() => handleSlotClick(d.dateStr, hour)}
                      className={`p-1.5 border-r last:border-r-0 border-slate-200/60 hover:bg-slate-50/50 cursor-pointer transition-colors relative min-w-0 overflow-hidden ${
                        d.isToday ? 'bg-blue-50/10' : ''
                      }`}
                    >
                      {/* Actual User Tasks */}
                      {dayTasks.map((t) => {
                        const isDaily = t.recurrence === 'daily';
                        return (
                          <div
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(t);
                            }}
                            className={`p-2 rounded-xl text-xs mb-1.5 transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer border flex flex-col justify-between w-full min-w-0 overflow-hidden ${
                              t.status === 'completed'
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                                : t.priority === 'high'
                                ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                                : 'bg-blue-50/90 border-blue-200 text-blue-950'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              {isDaily ? (
                                <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider shrink-0">
                                  <Repeat className="w-2.5 h-2.5" />
                                  Daily
                                </span>
                              ) : (
                                <span className="text-[9px] uppercase font-bold tracking-wider opacity-75 px-1 py-0.5 rounded bg-slate-200/60">
                                  {t.priority}
                                </span>
                              )}
                            </div>

                            <div
                              className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 break-words"
                              title={t.title}
                            >
                              {t.title}
                            </div>

                            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600 font-medium tabular-nums mt-1.5 pt-1 border-t border-slate-200/60">
                              <Clock className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                              <span className="truncate">{formatTaskTimeCompact(t)}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Sample routine block */}
                      {routine && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-[11px] font-medium bg-slate-100/60 border border-dashed border-slate-300 text-slate-700"
                        >
                          <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                            <span>SAMPLE ROUTINE</span>
                            <span>{routine.duration}</span>
                          </div>
                          <div className="truncate">{routine.title}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day View */}
      {calendarView === 'day' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {selectedDay.dayName}, {selectedDay.monthName} {selectedDay.dayNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Detailed hourly breakdown & focus schedule</p>
            </div>
            <button
              onClick={() => handleSlotClick(selectedDay.dateStr, '09:00')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to this day</span>
            </button>
          </div>

          <div className="space-y-3">
            {hours.map((hour) => {
              const hourTasks = tasks.filter((t) => isTaskForDayAndHour(t, selectedDay.dateStr, hour));

              return (
                <div
                  key={hour}
                  className="flex items-start gap-3 sm:gap-4 p-3 rounded-xl bg-slate-50/60 border border-slate-200/80 hover:border-slate-300 transition-colors"
                >
                  <span className="w-14 sm:w-16 font-mono text-xs font-semibold text-slate-500 tabular-nums shrink-0 pt-1">
                    {hour}
                  </span>

                  <div className="flex-1 min-w-0 space-y-2">
                    {hourTasks.length === 0 ? (
                      <button
                        onClick={() => handleSlotClick(selectedDay.dateStr, hour)}
                        className="text-xs text-slate-500 hover:text-blue-700 transition-colors py-1 block text-left"
                      >
                        + Click to schedule a focus block at {hour}
                      </button>
                    ) : (
                      hourTasks.map((t) => {
                        const isDaily = t.recurrence === 'daily';
                        return (
                          <div
                            key={t.id}
                            onClick={() => handleTaskClick(t)}
                            className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{t.title}</span>
                                {isDaily ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700 font-bold uppercase inline-flex items-center gap-1 border border-blue-200">
                                    <Repeat className="w-3 h-3" />
                                    Daily
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase">
                                    Saved Task
                                  </span>
                                )}
                                <span className="text-[11px] font-mono text-slate-600 font-semibold flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {formatTaskTimeCompact(t)}
                                </span>
                              </div>
                              {t.description && (
                                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{t.description}</p>
                              )}
                            </div>
                            <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              <span className="text-xs font-mono text-blue-700 font-semibold block">
                                {t.estimatedMinutes} mins
                              </span>
                              <span className="text-[11px] text-slate-500 capitalize">{t.priority} Prio</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
