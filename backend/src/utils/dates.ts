// All calendar dates are plain "YYYY-MM-DD" strings. They sort lexicographically,
// so <, >, === compare them correctly.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parse(date: string): Date {
    return new Date(`${date}T00:00:00Z`);
}

function format(d: Date): string {
    return d.toISOString().slice(0, 10);
}

export function isValidDate(value: unknown): value is string {
    if (typeof value !== "string" || !DATE_RE.test(value)) return false;
    const d = parse(value);
    return !Number.isNaN(d.getTime()) && format(d) === value;
}

export function isValidTimeZone(tz: string): boolean {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

/** Today's calendar date in the given IANA timezone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Last day (inclusive) of the one-year window starting at `start`. */
export function trackingEndDate(start: string): string {
    const d = parse(start);
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    d.setUTCDate(d.getUTCDate() - 1);
    return format(d);
}
