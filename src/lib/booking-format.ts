/** Human labels for booking dates/times in EN/DE (emails, admin, success messages). */
import { type Session, clock, dateRange, fmtDate, hhmm, span } from "./booking-time";
import type { Lang } from "./booking-config";

const W = {
  en: { notSure: "Time not sure yet", from: "from", until: "until", start: "start time not sure", end: "end time not sure" },
  de: { notSure: "Zeit noch offen", from: "ab", until: "bis", start: "Beginn noch offen", end: "Ende noch offen" },
};

const dm = (d: string, lang: Lang, o: Intl.DateTimeFormatOptions) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { ...o, timeZone: "UTC" });

/** "Sat, 21 Nov 2026" or "10–13 Dec 2026" / "30 Nov – 2 Dec 2026". */
export function whenLabel(start: string, end: string, lang: Lang) {
  if (start === end) return fmtDate(start, lang);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const a = dm(start, lang, sameMonth ? { day: "numeric" } : sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
  const b = dm(end, lang, { day: "numeric", month: "short", year: "numeric" });
  return lang === "de" && sameMonth ? `${a.replace(/\.$/, "")}.–${b}` : `${a}${sameMonth ? "–" : " – "}${b}`;
}

/** The client's rough wish as rows for the "request received" email. */
export function wishBlocks(w: { start: string; end: string; startTime: number | null; endTime: number | null }, lang: Lang) {
  const t = W[lang];
  if (w.start === w.end) {
    const time =
      w.startTime !== null && w.endTime !== null
        ? `${hhmm(w.startTime)}–${clock(w.endTime)}`
        : w.startTime !== null
          ? `${t.from} ${hhmm(w.startTime)}`
          : w.endTime !== null
            ? `${t.until} ${clock(w.endTime)}`
            : t.notSure;
    return [{ date: fmtDate(w.start, lang), time }];
  }
  return [
    { date: fmtDate(w.start, lang), time: w.startTime !== null ? `${t.from} ${hhmm(w.startTime)}` : t.start },
    { date: fmtDate(w.end, lang), time: w.endTime !== null ? `${t.until} ${clock(w.endTime)}` : t.end },
  ];
}

/** Final schedule rows for the confirmation email. */
export const sessionBlocks = (sessions: Session[], lang: Lang) => sessions.map((s) => ({ date: fmtDate(s.date, lang), time: span(s.from, s.until) }));

/** First and last date of a schedule. */
export function sessionRange(sessions: Session[]) {
  const dates = sessions.map((s) => s.date).sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}
export { dateRange };
