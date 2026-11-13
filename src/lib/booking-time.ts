/** Booking time maths. A "day" runs 06:00 → 06:00 next morning, so night jobs (22:00–04:00) belong to one date. */

export const DAY_START = 6 * 60; // 06:00
export const DAY_END = DAY_START + 24 * 60; // 06:00 next day
/** A confirmed booking on a date: minutes after that date's 00:00 (until may pass 24:00 for night jobs). */
export type Busy = { date: string; from: number; until: number; label?: string };

const dayIndex = (date: string) => Math.round(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 86_400_000);
export const absolute = (b: Busy) => ({ start: dayIndex(b.date) * 1440 + b.from, end: dayIndex(b.date) * 1440 + b.until });

/** Busy intervals that touch a date's 06:00→06:00 window, in that date's minutes. */
export function busyOn(date: string, all: Busy[]): { from: number; until: number; label?: string }[] {
  const base = dayIndex(date) * 1440;
  const w0 = base + DAY_START;
  const w1 = base + DAY_END;
  return all
    .map((b) => ({ ...absolute(b), label: b.label }))
    .filter((b) => b.start < w1 && b.end > w0)
    .map((b) => ({ from: Math.max(b.start, w0) - base, until: Math.min(b.end, w1) - base, label: b.label }))
    .sort((a, b) => a.from - b.from);
}

export function overlaps(a: { from: number; until: number }, b: { from: number; until: number }) {
  return a.from < b.until && b.from < a.until;
}

/** "free" | "partly" | "full" for the calendar. Full = no 2-hour gap left between 08:00 and 02:00. */
export function dayStatus(date: string, all: Busy[]): "free" | "partly" | "full" {
  const busy = busyOn(date, all);
  if (!busy.length) return "free";
  let cursor = 8 * 60;
  const stop = 26 * 60;
  for (const b of busy) {
    if (b.from - cursor >= 120) return "partly";
    cursor = Math.max(cursor, b.until);
  }
  return stop - cursor >= 120 ? "partly" : "full";
}

export const hhmm = (m: number) => {
  const mm = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
};
export const span = (from: number, until: number) => `${hhmm(from)}–${hhmm(until)}${until >= 1440 ? " (+1)" : ""}`;
/** "18:00", "02:00 (+1)" for an end time that runs past midnight. */
export const clock = (m: number) => `${hhmm(m)}${m >= 1440 ? " (+1)" : ""}`;
export const duration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
};

/** "Sat, 21 Nov 2026" / "Sa., 21. Nov. 2026" */
export function fmtDate(date: string, lang: "en" | "de" = "en") {
  const d = new Date(`${date}T12:00:00Z`);
  return d.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** One day of a (possibly multi-day) booking, e.g. haldi · sangeet · wedding. */
export type Session = { date: string; from: number; until: number; /** if this day is somewhere else */ venue?: string };

/** Working hours used for the fully-booked rule: 08:00 → 02:00 next day. */
export const WORK_START = 8 * 60;
export const WORK_END = 26 * 60;

/** Every date from start to end (inclusive), as YYYY-MM-DD. */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  const d0 = Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 1, +start.slice(8, 10));
  const d1 = Date.UTC(+end.slice(0, 4), +end.slice(5, 7) - 1, +end.slice(8, 10));
  for (let t = d0; t <= d1 && out.length < 60; t += 86_400_000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}
export const daysBetween = (a: string, b: string) => dateRange(a, b).length - 1;

/** A session written out in full, also when it runs over several days: "Wed, 2 Dec 18:00 → Fri, 4 Dec 11:00". */
export function longSpan(s: Session, lang: "en" | "de" = "en") {
  const extra = Math.floor(s.until / 1440);
  if (s.until <= 1440 + DAY_START && extra <= 1) return `${fmtDate(s.date, lang)} · ${span(s.from, s.until)}`;
  const endDate = new Date(Date.UTC(+s.date.slice(0, 4), +s.date.slice(5, 7) - 1, +s.date.slice(8, 10)) + extra * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return `${fmtDate(s.date, lang)} ${hhmm(s.from)} → ${fmtDate(endDate, lang)} ${hhmm(s.until)}`;
}

/** What a client asked for: a date range with approximate first/last times (null = "not sure yet"). */
export type Wish = { start: string; end: string; startTime: number | null; endTime: number | null };

/** The real moment of "date + minutes" in Hamburg (Europe/Berlin), summer/winter time handled. */
export function toInstant(date: string, minutes: number, tz = "Europe/Berlin"): Date {
  const wall = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), 0, minutes);
  const offset = (t: number) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
        .formatToParts(t)
        .map((x) => [x.type, x.value]),
    );
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t;
  };
  let t = wall - offset(wall);
  const again = offset(t);
  if (wall - again !== t) t = wall - again;
  return new Date(t);
}

/** Longest date range a client can request in one go. */
export const MAX_DAYS = 7;
