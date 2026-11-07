// Pure heatmap/stats logic — no Angular, easy to unit test.
import {
  type DateString,
  addDays,
  diffDays,
  formatDate,
  parseDate,
  weekdayIndex,
} from '../../core/utils/dates';

/**
 * done    — went to the gym
 * missed  — a past day without a check-in (locked forever)
 * pending — today, not checked yet (the only day you can act on)
 * future  — not reached yet
 */
export type DayState = 'done' | 'missed' | 'pending' | 'future';

export interface HeatmapDay {
  date: DateString;
  state: DayState;
  isToday: boolean;
  label: string;
}

export interface MonthLabel {
  label: string;
  /** Week column where the month starts. */
  column: number;
}

export interface Heatmap {
  /** Columns of 7 slots (Mon..Sun); null pads days outside the range. */
  weeks: (HeatmapDay | null)[][];
  months: MonthLabel[];
  /** Column containing today, or null if today is outside the range. */
  todayColumn: number | null;
}

export interface TrackerStats {
  done: number;
  missed: number;
  /** done / days that have counted so far (past days + today if done), 0..1 */
  completion: number;
  currentStreak: number;
  longestStreak: number;
  /** Days after today until the end date. */
  remaining: number;
  totalDays: number;
}

export interface TrackingWindow {
  startDate: DateString;
  endDate: DateString;
  today: DateString;
  checked: ReadonlySet<DateString>;
}

export function dayState(date: DateString, today: DateString, checked: ReadonlySet<DateString>): DayState {
  if (checked.has(date)) return 'done';
  if (date < today) return 'missed';
  if (date === today) return 'pending';
  return 'future';
}

const STATE_LABEL: Record<DayState, string> = {
  done: 'Went to the gym',
  missed: 'Missed',
  pending: 'Today — not marked yet',
  future: 'Upcoming',
};

export function buildHeatmap({ startDate, endDate, today, checked }: TrackingWindow): Heatmap {
  const weeks: (HeatmapDay | null)[][] = [];
  const months: MonthLabel[] = [];
  let week: (HeatmapDay | null)[] = Array.from({ length: weekdayIndex(startDate) }, () => null);
  let todayColumn: number | null = null;
  let lastMonth = '';

  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    const state = dayState(date, today, checked);
    const isToday = date === today;
    if (isToday) todayColumn = weeks.length;

    const month = date.slice(0, 7);
    if (month !== lastMonth) {
      // Label a month in the first column where it has a day. Skip it if
      // the previous label is right next to it (it would overlap).
      const column = weeks.length;
      const prev = months.at(-1);
      if (!prev || column - prev.column >= 3) {
        months.push({ label: formatDate(date, { month: 'short' }), column });
      }
      lastMonth = month;
    }

    week.push({
      date,
      state,
      isToday,
      label: `${formatDate(date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · ${isToday && state === 'done' ? 'Today — done' : STATE_LABEL[state]}`,
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)]);
  }

  return { weeks, months, todayColumn };
}

export function computeStats({ startDate, endDate, today, checked }: TrackingWindow): TrackerStats {
  const inRange = [...checked].filter((d) => d >= startDate && d <= endDate).sort();
  const done = inRange.length;
  const totalDays = diffDays(startDate, endDate) + 1;

  // Past days in range (strictly before today).
  const lastPast = today > endDate ? endDate : addDays(today, -1);
  const pastDays = lastPast < startDate ? 0 : diffDays(startDate, lastPast) + 1;
  const pastDone = inRange.filter((d) => d < today).length;
  const missed = pastDays - pastDone;

  const todayCounted = checked.has(today) && today >= startDate && today <= endDate ? 1 : 0;
  const countedDays = pastDays + todayCounted;
  const completion = countedDays === 0 ? 0 : done / countedDays;

  // Longest run of consecutive days.
  let longestStreak = 0;
  let run = 0;
  let prev: DateString | null = null;
  for (const d of inRange) {
    run = prev && diffDays(prev, d) === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = d;
  }

  // Current streak: ends today if today is done, otherwise yesterday
  // (today isn't over, so not having checked in yet doesn't break it).
  let currentStreak = 0;
  let cursor = checked.has(today) ? today : addDays(today, -1);
  while (cursor >= startDate && cursor <= endDate && checked.has(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  const remaining = today >= endDate ? 0 : diffDays(today < startDate ? addDays(startDate, -1) : today, endDate);

  return { done, missed, completion, currentStreak, longestStreak, remaining, totalDays };
}

export function isWithin(date: DateString, startDate: DateString, endDate: DateString): boolean {
  const d = parseDate(date).getTime();
  return d >= parseDate(startDate).getTime() && d <= parseDate(endDate).getTime();
}
