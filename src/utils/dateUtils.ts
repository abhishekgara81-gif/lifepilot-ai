/**
 * LifePilot AI - Unified Timezone-Safe Date Utility
 *
 * Prevents timezone-drift bugs where ISO UTC formatting (toISOString)
 * or UTC string parsing (new Date('YYYY-MM-DD')) shifts dates forward or
 * backward by one day depending on the user's local timezone.
 */

/**
 * Format a Date object into a local 'YYYY-MM-DD' string without UTC conversion drift.
 */
export function formatLocalDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date();
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a 'YYYY-MM-DD' string into a Date object at local midnight (00:00:00 local time).
 * Standard `new Date('YYYY-MM-DD')` parses as UTC midnight, which shifts dates
 * backwards by 1 day in western timezones (e.g. EST, PST).
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

/**
 * Returns a 'YYYY-MM-DD' string for a date offset by `offsetDays` from today (or from baseDate).
 * Safe from UTC conversion drift.
 */
export function getRelativeDate(offsetDays: number, baseDate?: Date | string): string {
  let base: Date;
  if (!baseDate) {
    base = new Date();
  } else if (typeof baseDate === 'string') {
    base = parseLocalDate(baseDate);
  } else {
    base = new Date(baseDate.getTime());
  }
  base.setDate(base.getDate() + offsetDays);
  return formatLocalDate(base);
}

/**
 * Check whether two date strings or Date objects represent the same calendar day.
 */
export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  const str1 = typeof date1 === 'string' ? date1 : formatLocalDate(date1);
  const str2 = typeof date2 === 'string' ? date2 : formatLocalDate(date2);
  return str1 === str2;
}

/**
 * Compare two 'YYYY-MM-DD' date strings.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
export function compareDates(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

/**
 * Returns a human-friendly display string for a 'YYYY-MM-DD' date
 * e.g. "Oct 28, 2026" or "Wed, Oct 28, 2026"
 */
export function formatDisplayDate(
  dateStr: string,
  options: { includeWeekday?: boolean; monthFormat?: 'short' | 'long' } = {}
): string {
  const d = parseLocalDate(dateStr);
  const weekday = options.includeWeekday
    ? d.toLocaleDateString('en-US', { weekday: 'short' }) + ', '
    : '';
  const month = d.toLocaleDateString('en-US', {
    month: options.monthFormat || 'short',
  });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${weekday}${month} ${day}, ${year}`;
}

/**
 * Returns short day name for a 'YYYY-MM-DD' string: 'Mon', 'Tue', etc.
 */
export function getDayOfWeek(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Accurately calculate total days in a given year and month (0-indexed month: 0=Jan, 1=Feb...).
 * Handles leap years correctly (e.g. Feb 2024 -> 29, Feb 2025 -> 28, Feb 2028 -> 29).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Is the given year a leap year?
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export interface CalendarMonthCell {
  dateStr: string;
  dayNumber: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Generates a full month calendar grid (weeks array of 7 days)
 * with leading days from previous month and trailing days from next month.
 * Starts on Monday (ISO standard) or Sunday depending on weekStartsOnMonday.
 */
export function getMonthMatrix(
  year: number,
  month: number, // 0-11
  weekStartsOnMonday = true
): CalendarMonthCell[][] {
  const todayStr = formatLocalDate(new Date());
  const firstDayOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  let firstDayIndex = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  if (weekStartsOnMonday) {
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  }

  const daysInCurrentMonth = getDaysInMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const cells: CalendarMonthCell[] = [];

  // 1. Leading days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const d = new Date(prevYear, prevMonth, day, 0, 0, 0, 0);
    const dateStr = formatLocalDate(d);
    cells.push({
      dateStr,
      dayNumber: day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const d = new Date(year, month, day, 0, 0, 0, 0);
    const dateStr = formatLocalDate(d);
    cells.push({
      dateStr,
      dayNumber: day,
      month,
      year,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // 3. Trailing days from next month to complete standard 35 or 42 grid cells
  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  const targetTotal = cells.length + remaining < 35 ? 35 : cells.length + remaining;
  const trailingNeeded = targetTotal - cells.length;

  for (let day = 1; day <= trailingNeeded; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const d = new Date(nextYear, nextMonth, day, 0, 0, 0, 0);
    const dateStr = formatLocalDate(d);
    cells.push({
      dateStr,
      dayNumber: day,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Chunk into 7-day rows
  const weeks: CalendarMonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

