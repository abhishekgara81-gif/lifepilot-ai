import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Tag,
  AlertCircle,
  Repeat,
  Layers,
} from 'lucide-react';
import {
  formatLocalDate,
  parseLocalDate,
  formatDisplayDate,
  getMonthMatrix,
  getRelativeDate,
  isSameDay,
  CalendarMonthCell,
} from '../../utils/dateUtils';
import { formatTime12, formatTimeRangeWithMidnight } from '../../data/initialData';
import { Task } from '../../types';

export const CalendarPage: React.FC = () => {
  const { tasks, setTaskModalOpen, setEditingTask, toggleTaskStatus, deleteTask } = useApp();

  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Currently viewed month/year (defaults to current date)
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth()); // 0-11
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatLocalDate(today));

  // Month navigation
  const handlePrev = () => {
    if (calendarView === 'month') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else if (calendarView === 'week') {
      const prevDate = parseLocalDate(selectedDateStr);
      prevDate.setDate(prevDate.getDate() - 7);
      const newDateStr = formatLocalDate(prevDate);
      setSelectedDateStr(newDateStr);
      setViewMonth(prevDate.getMonth());
      setViewYear(prevDate.getFullYear());
    } else {
      const prevDate = parseLocalDate(selectedDateStr);
      prevDate.setDate(prevDate.getDate() - 1);
      const newDateStr = formatLocalDate(prevDate);
      setSelectedDateStr(newDateStr);
      setViewMonth(prevDate.getMonth());
      setViewYear(prevDate.getFullYear());
    }
  };

  const handleNext = () => {
    if (calendarView === 'month') {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else if (calendarView === 'week') {
      const nextDate = parseLocalDate(selectedDateStr);
      nextDate.setDate(nextDate.getDate() + 7);
      const newDateStr = formatLocalDate(nextDate);
      setSelectedDateStr(newDateStr);
      setViewMonth(nextDate.getMonth());
      setViewYear(nextDate.getFullYear());
    } else {
      const nextDate = parseLocalDate(selectedDateStr);
      nextDate.setDate(nextDate.getDate() + 1);
      const newDateStr = formatLocalDate(nextDate);
      setSelectedDateStr(newDateStr);
      setViewMonth(nextDate.getMonth());
      setViewYear(nextDate.getFullYear());
    }
  };

  const handleToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDateStr(formatLocalDate(now));
  };

  // Month Matrix (35 or 42 grid cells)
  const monthWeeks = useMemo(() => {
    return getMonthMatrix(viewYear, viewMonth, true);
  }, [viewYear, viewMonth]);

  const monthTitle = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  // Tasks mapped by local date string
  const tasksForDate = (dateStr: string) => {
    return tasks.filter((t) => {
      if (t.recurrence === 'daily') return true;
      return t.dueDate === dateStr;
    });
  };

  const selectedDateTasks = useMemo(() => {
    return tasksForDate(selectedDateStr);
  }, [tasks, selectedDateStr]);

  // Event category indicator style
  const getEventBadgeStyle = (task: Task) => {
    const titleLower = task.title.toLowerCase();
    const isExam =
      task.category === 'study' &&
      (titleLower.includes('exam') ||
        titleLower.includes('test') ||
        titleLower.includes('pyq') ||
        titleLower.includes('midterm') ||
        titleLower.includes('final'));

    if (isExam) {
      return {
        label: 'Exam',
        badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900',
        dot: 'bg-rose-500',
      };
    }
    if (task.category === 'project' || task.category === 'coding') {
      return {
        label: 'Assignment',
        badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900',
        dot: 'bg-blue-500',
      };
    }
    if (task.category === 'study' || task.category === 'revision') {
      return {
        label: 'Study Session',
        badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        dot: 'bg-amber-500',
      };
    }
    return {
      label: 'Reminder',
      badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900',
      dot: 'bg-purple-500',
    };
  };

  const handleQuickAddTask = (targetDateStr = selectedDateStr) => {
    setEditingTask({
      id: '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      category: 'study',
      dueDate: targetDateStr,
      dueTime: '14:00',
      startTime: '14:00',
      endTime: '15:00',
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

  // Week View calculation (7 days around selectedDateStr)
  const weekDays = useMemo(() => {
    const base = parseLocalDate(selectedDateStr);
    let dayOfWeek = base.getDay(); // 0 = Sun, 1 = Mon ...
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(base.getTime());
    monday.setDate(monday.getDate() + offsetToMonday);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday.getTime());
      d.setDate(d.getDate() + i);
      const dateStr = formatLocalDate(d);
      return {
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
      };
    });
  }, [selectedDateStr, todayStr]);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00',
  ];

  return (
    <div className="space-y-6 pb-16 max-w-7xl">
      {/* Top Controls Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation & Month Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {calendarView === 'month'
                ? monthTitle
                : calendarView === 'week'
                ? `${weekDays[0].monthName} ${weekDays[0].dayNumber} – ${weekDays[6].monthName} ${weekDays[6].dayNumber}, ${viewYear}`
                : formatDisplayDate(selectedDateStr, { includeWeekday: true })}
            </h2>
          </div>
        </div>

        {/* View Switcher & Add Action */}
        <div className="flex items-center gap-3">
          {/* Legend indicators */}
          <div className="hidden xl:flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Exam</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Assignment</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Study</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Reminder</span>
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                calendarView === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                calendarView === 'week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCalendarView('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                calendarView === 'day'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Day
            </button>
          </div>

          <button
            onClick={() => handleQuickAddTask(selectedDateStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Main Grid & Agenda Panel Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: Calendar View (Month / Week / Day) */}
        <div className="lg:col-span-3 space-y-4">
          {/* 1. MONTH VIEW */}
          {calendarView === 'month' && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              {/* Day Name Header Row (Mon - Sun) */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-center py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Month Grid Cells */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {monthWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-700/60 min-h-[96px] sm:min-h-[110px]">
                    {week.map((cell: CalendarMonthCell) => {
                      const dayTasks = tasksForDate(cell.dateStr);
                      const isSelected = cell.dateStr === selectedDateStr;

                      return (
                        <div
                          key={cell.dateStr}
                          onClick={() => setSelectedDateStr(cell.dateStr)}
                          onDoubleClick={() => handleQuickAddTask(cell.dateStr)}
                          className={`p-1.5 sm:p-2 transition-colors cursor-pointer flex flex-col justify-between ${
                            !cell.isCurrentMonth
                              ? 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-400'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200'
                          } ${isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/30 dark:bg-blue-950/20' : ''}`}
                        >
                          {/* Top: Day Number and Badges */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                                cell.isToday
                                  ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                                  : isSelected
                                  ? 'text-blue-700 dark:text-blue-400 font-extrabold'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {cell.dayNumber}
                            </span>
                            {dayTasks.length > 0 && (
                              <span className="text-[10px] font-semibold text-slate-400 px-1">
                                {dayTasks.length}
                              </span>
                            )}
                          </div>

                          {/* Middle: Event Pills (up to 2 visible, +N more badge) */}
                          <div className="space-y-1 my-1">
                            {dayTasks.slice(0, 2).map((t) => {
                              const style = getEventBadgeStyle(t);
                              return (
                                <div
                                  key={t.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTaskClick(t);
                                  }}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-md truncate border flex items-center gap-1 ${style.badge}`}
                                  title={`${t.title} (${t.dueTime ? formatTime12(t.dueTime) : 'Due'})`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                                  <span className="truncate font-medium">{t.title}</span>
                                </div>
                              );
                            })}
                            {dayTasks.length > 2 && (
                              <span className="text-[10px] font-bold text-slate-400 px-1 block truncate">
                                +{dayTasks.length - 2} more
                              </span>
                            )}
                          </div>

                          {/* Bottom space */}
                          <div className="h-1" />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. WEEK VIEW */}
          {calendarView === 'week' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {/* Header: 7 Days */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                {weekDays.map((d) => (
                  <div
                    key={d.dateStr}
                    onClick={() => setSelectedDateStr(d.dateStr)}
                    className={`p-2.5 text-center cursor-pointer transition-colors ${
                      d.isSelected ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700' : ''
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase text-slate-400">{d.dayName}</div>
                    <div
                      className={`text-sm font-extrabold mx-auto w-7 h-7 flex items-center justify-center rounded-full mt-0.5 ${
                        d.isToday ? 'bg-blue-600 text-white' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {d.dayNumber}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[580px] overflow-y-auto">
                {timeSlots.map((hour) => (
                  <div key={hour} className="grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-800 min-h-[52px]">
                    {weekDays.map((d) => {
                      const dayTasks = tasksForDate(d.dateStr).filter((t) => {
                        const targetH = hour.slice(0, 2);
                        if (t.startTime) return t.startTime.startsWith(targetH);
                        if (t.dueTime) return t.dueTime.startsWith(targetH);
                        return hour === '14:00';
                      });

                      return (
                        <div
                          key={d.dateStr + hour}
                          onClick={() => {
                            setSelectedDateStr(d.dateStr);
                            handleQuickAddTask(d.dateStr);
                          }}
                          className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer relative"
                        >
                          {dayTasks.map((t) => {
                            const style = getEventBadgeStyle(t);
                            return (
                              <div
                                key={t.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskClick(t);
                                }}
                                className={`text-[11px] p-1.5 rounded-lg border shadow-xs mb-1 ${style.badge}`}
                              >
                                <div className="font-bold truncate">{t.title}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{t.startTime ? formatTime12(t.startTime) : '14:00'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. DAY VIEW */}
          {calendarView === 'day' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {formatDisplayDate(selectedDateStr, { includeWeekday: true, monthFormat: 'long' })}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedDateTasks.length} Scheduled items for today
                  </span>
                </div>
                <button
                  onClick={() => handleQuickAddTask(selectedDateStr)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                >
                  + Add Item
                </button>
              </div>

              {/* Day Time slots */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {timeSlots.map((hour) => {
                  const matchingTasks = selectedDateTasks.filter((t) => {
                    const h = hour.slice(0, 2);
                    if (t.startTime) return t.startTime.startsWith(h);
                    if (t.dueTime) return t.dueTime.startsWith(h);
                    return hour === '14:00';
                  });

                  return (
                    <div key={hour} className="py-2.5 flex items-start gap-4">
                      <span className="text-xs font-mono font-bold text-slate-400 w-16 shrink-0 pt-1">
                        {formatTime12(hour)}
                      </span>
                      <div className="flex-1 space-y-2">
                        {matchingTasks.length > 0 ? (
                          matchingTasks.map((t) => {
                            const style = getEventBadgeStyle(t);
                            return (
                              <div
                                key={t.id}
                                onClick={() => handleTaskClick(t)}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer hover:shadow-sm ${style.badge}`}
                              >
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h4>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span>{style.label}</span>
                                    <span>·</span>
                                    <span>{t.startTime && t.endTime ? `${formatTime12(t.startTime)} – ${formatTime12(t.endTime)}` : formatTime12(t.dueTime || hour)}</span>
                                  </div>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                                  {t.status === 'completed' ? 'Done' : 'To Do'}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div
                            onClick={() => handleQuickAddTask(selectedDateStr)}
                            className="h-7 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Selected Date Agenda & Scheduled Tasks */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Selected Agenda</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatDisplayDate(selectedDateStr, { includeWeekday: true })}
                </h4>
              </div>
              <button
                onClick={() => handleQuickAddTask(selectedDateStr)}
                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                title="Add task for this date"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {selectedDateTasks.length > 0 ? (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {selectedDateTasks.map((task) => {
                  const style = getEventBadgeStyle(task);
                  const isDone = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition-all text-left ${
                        isDone
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(task.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0" onClick={() => handleTaskClick(task)}>
                          <h5
                            className={`text-xs font-bold text-slate-900 dark:text-white truncate cursor-pointer ${
                              isDone ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </h5>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${style.badge}`}>
                              {style.label}
                            </span>
                            {task.dueTime && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {formatTime12(task.dueTime)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTaskClick(task)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No tasks or exams scheduled for this date.
                </p>
                <button
                  onClick={() => handleQuickAddTask(selectedDateStr)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  + Add Event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
