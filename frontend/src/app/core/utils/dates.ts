// Calendar dates are "YYYY-MM-DD" strings everywhere (same as the API).
// They're handled as UTC midnight so the browser's timezone never shifts a day.
// "Today" always comes from the server, which knows the user's timezone.

export type DateString = string;

const DAY_MS = 86_400_000;

export function parseDate(date: DateString): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function toDateString(d: Date): DateString {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: DateString, days: number): DateString {
  return toDateString(new Date(parseDate(date).getTime() + days * DAY_MS));
}

/** Whole days from a to b (b - a). */
export function diffDays(a: DateString, b: DateString): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / DAY_MS);
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(date: DateString): number {
  return (parseDate(date).getUTCDay() + 6) % 7;
}

export function formatDate(
  date: DateString,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
): string {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' }).format(
    parseDate(date),
  );
}

/** Last day (inclusive) of the one-year window — mirrors the backend. */
export function trackingEndDate(start: DateString): DateString {
  const d = parseDate(start);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(d.getUTCDate() - 1);
  return toDateString(d);
}
