"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptRequest, addNote, declineRequest, travelTimes } from "@/app/admin/actions";
import {
  type Busy,
  type Session,
  type Wish,
  DAY_START,
  WORK_END,
  WORK_START,
  absolute,
  busyOn,
  clock,
  dateRange,
  daysBetween,
  duration,
  fmtDate,
  longSpan,
  span,
} from "@/lib/booking-time";
import { useModal } from "@/components/work/Lightbox";
import { EmailFrame } from "@/components/booking/EmailFrame";
import type { EmailSet, Lang } from "@/lib/booking-config";
import { bookingConfirmed, bookingDeclined, type EmailData } from "@/lib/emails";
import { sessionBlocks, sessionRange, whenLabel, wishBlocks } from "@/lib/booking-format";

export type Confirmed = Busy & { id: string; label: string; venue: string };
export type BookingRequest = {
  id: string;
  name: string;
  email: string;
  type: string;
  /** what the client asked for: dates + rough first/last times */
  wish: Wish;
  venue: string;
  services: string[];
  answers: { label: string; value: string }[];
  message?: string;
  received: string;
  /** ISO time it arrived (for sorting) */
  receivedAt?: string;
  /** private — the latest note (only the owner sees it) */
  notes?: string;
  /** how many notes in the timeline */
  noteCount?: number;
  /** the client's language + their event type / services in it (for the email) */
  lang?: Lang;
  typeLabel?: string;
  serviceLabels?: string[];
};
export type Travel = { car?: number; transit?: number } | null;
type Mode = "car" | "transit";
type Tone = "ok" | "tight" | "bad" | "unknown" | "clash";
type Plan = "continuous" | "daily" | "custom";

const maps = (a: string, b: string, mode: "driving" | "transit") =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(a)}&destination=${encodeURIComponent(b)}&travelmode=${mode}`;
const place = (a: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
const MODE_LABEL: Record<Mode, string> = { car: "by car", transit: "by train" };
const TONE: Record<Tone, string> = {
  ok: "border-[#2f9e6f]/45 bg-[#2f9e6f]/12 text-[#2f9e6f]",
  tight: "border-[#c98a0a]/50 bg-[#c98a0a]/12 text-[#c98a0a]",
  bad: "border-danger/50 bg-danger/10 text-danger",
  clash: "border-danger/50 bg-danger/10 text-danger",
  unknown: "border-ink-soft/40 text-ink-soft",
};
const RANK: Record<Tone, number> = { ok: 0, unknown: 1, tight: 2, bad: 3, clash: 4 };
/* Same 06:00 → 06:00 day as the client calendar, so blocks of one booking can never overlap each other. */
const FROM_OPTS = Array.from({ length: 36 }, (_, i) => DAY_START + i * 30); // 06:00 … 23:30
const UNTIL_OPTS = Array.from({ length: 48 }, (_, i) => DAY_START + 30 + i * 30); // 06:30 … 06:00 (+1)
type T = number | null;

type Neighbour = { c: Confirmed; gap: number; a: string; b: string; t: Travel; tone: Tone; text: string };

function analyseDay(day: Session, venue: string, confirmed: Confirmed[], travel: Record<string, Travel>, mode: Mode) {
  const me = absolute(day);
  const all = confirmed.map((c) => ({ c, abs: absolute(c) }));
  const clash = all.filter((x) => x.abs.start < me.end && me.start < x.abs.end).map((x) => x.c);
  const judge = (x: { c: Confirmed; abs: { start: number; end: number } } | undefined, kind: "before" | "after"): Neighbour | null => {
    if (!x) return null;
    const gap = kind === "before" ? me.start - x.abs.end : x.abs.start - me.end;
    const here = day.venue?.trim() || venue;
    const [a, b] = kind === "before" ? [x.c.venue, here] : [here, x.c.venue];
    if (!a.trim() || !b.trim()) return { c: x.c, gap, a, b, t: null, tone: "unknown", text: "Venue missing — ask the client" };
    const key = `${a}→${b}`;
    if (!(key in travel)) return { c: x.c, gap, a, b, t: null, tone: "unknown", text: "Checking travel time…" };
    const t = travel[key] ?? null;
    const mins = t?.[mode];
    if (mins === undefined) return { c: x.c, gap, a, b, t, tone: "unknown", text: "Travel time unknown — check the route" };
    const spare = gap - mins;
    if (spare < 0) return { c: x.c, gap, a, b, t, tone: "bad", text: `Not enough ${MODE_LABEL[mode]} — ${duration(-spare)} short` };
    if (spare < 30) return { c: x.c, gap, a, b, t, tone: "tight", text: `Tight ${MODE_LABEL[mode]} — ${duration(spare)} spare` };
    return { c: x.c, gap, a, b, t, tone: "ok", text: `OK ${MODE_LABEL[mode]} — ${duration(spare)} spare` };
  };
  const before = judge(all.filter((x) => x.abs.end <= me.start && me.start - x.abs.end < 12 * 60).sort((p, q) => q.abs.end - p.abs.end)[0], "before");
  const after = judge(all.filter((x) => x.abs.start >= me.end && x.abs.start - me.end < 12 * 60).sort((p, q) => p.abs.start - q.abs.start)[0], "after");
  const worst: Tone = clash.length ? "clash" : [before?.tone, after?.tone].reduce<Tone>((w, t) => (t && RANK[t] > RANK[w] ? t : w), "ok");
  return { day, clash, before, after, worst };
}
function analyse(sessions: Session[], venue: string, confirmed: Confirmed[], travel: Record<string, Travel>, mode: Mode) {
  const days = sessions.map((d) => analyseDay(d, venue, confirmed, travel, mode));
  const worst = days.reduce<Tone>((w, d) => (RANK[d.worst] > RANK[w] ? d.worst : w), "ok");
  const summary =
    worst === "clash"
      ? "✗ Overlaps a confirmed booking"
      : worst === "bad"
        ? "✗ Not enough travel time"
        : worst === "tight"
          ? "⚠ Tight travel time"
          : worst === "unknown"
            ? "? Check travel"
            : "✓ Fits";
  return { days, worst, summary, clash: days.some((d) => d.clash.length) };
}

const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** What is already booked on the requested dates, e.g. "10:00–14:00, 22:00–04:00 (+1)". */
function bookedText(w: Wish, confirmed: Busy[]) {
  const multi = daysBetween(w.start, w.end) > 0;
  return dateRange(w.start, w.end)
    .flatMap((d) => busyOn(d, confirmed).map((b) => `${multi ? `${shortDay(d)} ` : ""}${span(b.from, b.until)}`))
    .join(", ");
}

/** The plan the editor opens with: one block for a single day; per day for several
 *  (first day from the client's start, middle days 08:00–02:00, last day until the client's end).
 *  Unknown times stay null — nothing is invented. */
function defaultDays(w: Wish): { date: string; on: boolean; from: T; until: T }[] {
  const st = w.startTime;
  const et = w.endTime;
  return dateRange(w.start, w.end).map((date, i, arr) => {
    const firstDay = i === 0;
    const lastDay = i === arr.length - 1;
    if (firstDay && lastDay) return { date, on: true, from: st, until: et };
    return {
      date,
      on: true,
      from: firstDay ? st : lastDay && et !== null && et <= WORK_START ? DAY_START : WORK_START,
      until: lastDay ? et : WORK_END,
    };
  });
}

/** Card verdict, judged on the editor's default plan. Never on guessed times. */
function cardVerdict(w: Wish, venue: string, confirmed: Confirmed[], travel: Record<string, Travel>, mode: Mode): { tone: Tone; text: string; detail?: string } {
  if (w.startTime === null || w.endTime === null) {
    const booked = bookedText(w, confirmed);
    return booked ? { tone: "unknown", text: "? Time not set", detail: `Already booked: ${booked}` } : { tone: "ok", text: "✓ Nothing else booked on these dates" };
  }
  const sessions = defaultDays(w)
    .filter((d): d is { date: string; on: boolean; from: number; until: number } => d.from !== null && d.until !== null && d.until > d.from)
    .map(({ date, from, until }) => ({ date, from, until }));
  const a = analyse(sessions, venue, confirmed, travel, mode);
  return { tone: a.worst, text: a.summary, detail: daysBetween(w.start, w.end) ? "with the default per-day plan" : "with the client's rough times" };
}
const wishText = (w: Wish) => {
  const n = daysBetween(w.start, w.end);
  const t = (m: number | null) => (m === null ? "time?" : clock(m));
  return n
    ? `${fmtDate(w.start)} ${t(w.startTime)} → ${fmtDate(w.end)} ${t(w.endTime)} · ${n + 1} days`
    : `${fmtDate(w.start)} · ${w.startTime === null && w.endTime === null ? "time not sure yet" : `${t(w.startTime)}–${t(w.endTime)}`}`;
};

/** Admin → Bookings → Requests. Accept = set the exact schedule (one block / same hours daily / per day),
 *  check travel against it, add private notes, then block the time. */
export function RequestsPanel({
  requests,
  confirmed,
  emails,
  contact,
  calendarConnected,
  travelEnabled,
  onCount,
  layout = "list",
  base = "/admin",
}: {
  requests: BookingRequest[];
  confirmed: Confirmed[];
  /** templates from Studio, per language */
  emails: Record<Lang, EmailSet>;
  contact: { replyTo: string; phone?: string; site: string };
  calendarConnected: boolean;
  /** OpenRouteService key present — otherwise travel shows as unknown with Maps links */
  travelEnabled: boolean;
  onCount?: (n: number) => void;
  /** "list" = request cards; "actions" = only the Accept / Reply / Decline buttons (booking detail page) */
  layout?: "list" | "actions";
  base?: string;
}) {
  const mode: Mode = "car";
  const router = useRouter();
  const [items, setItems] = useState(requests);
  // fresh server data (after accept/decline elsewhere) replaces the list
  const [prevRequests, setPrevRequests] = useState(requests);
  if (requests !== prevRequests) {
    setPrevRequests(requests);
    setItems(requests);
  }
  useEffect(() => onCount?.(items.length), [items.length, onCount]);
  const [open, setOpen] = useState<BookingRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toCalendar, setToCalendar] = useState(calendarConnected);
  const [emailClient, setEmailClient] = useState(true);
  const [confirmKey, setConfirmKey] = useState("");
  const [preview, setPreview] = useState(false);
  const langOf = (r: BookingRequest): Lang => (r.lang === "de" ? "de" : "en");
  /** what the email will show for this request (same data the server uses) */
  const emailData = (r: BookingRequest, blocks: EmailData["blocks"], when: string): EmailData => ({
    ...contact,
    lang: langOf(r),
    name: r.name,
    type: r.typeLabel || r.type,
    when,
    blocks,
    venue: r.venue,
    services: r.serviceLabels ?? r.services,
  });
  /** "origin→destination" → minutes; missing = still checking, null = unknown */
  const [travel, setTravel] = useState<Record<string, Travel>>({});
  const asked = useRef(new Set<string>());
  const ref = useRef<HTMLDivElement>(null);
  const savedNotes = useRef("");
  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 6000);
  };

  const [plan, setPlan] = useState<Plan>("continuous");
  const [cont, setCont] = useState<{ from: T; until: T }>({ from: null, until: null });
  const [daily, setDaily] = useState<{ from: T; until: T }>({ from: null, until: null });
  const [custom, setCustom] = useState<{ date: string; on: boolean; from: T; until: T }[]>([]);
  const [notes, setNotes] = useState("");
  const close = useCallback(() => {
    // a note typed but not accepted yet is still kept (added to the timeline)
    if (open && notes.trim() && notes !== savedNotes.current) {
      const id = open.id;
      const n = notes.trim();
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, notes: n, noteCount: (x.noteCount ?? 0) + 1 } : x)));
      void addNote(id, n).then(() => router.refresh());
    }
    setOpen(null);
    setError(null);
  }, [open, notes, router]);
  useModal(Boolean(open), ref, close);

  /** Start from what the client said. Unknown times stay empty ("Pick…") — nothing is invented. */
  const openReq = (r: BookingRequest) => {
    const multi = daysBetween(r.wish.start, r.wish.end) > 0;
    const st = r.wish.startTime;
    const et = r.wish.endTime;
    setPlan(multi ? "custom" : "continuous");
    setCont({ from: st, until: et });
    setDaily({ from: st, until: st === null ? null : Math.min(st + 8 * 60, WORK_END) });
    setCustom(defaultDays(r.wish));
    setNotes("");
    savedNotes.current = "";
    setToCalendar(calendarConnected);
    setEmailClient(Boolean(r.email));
    setConfirmKey(emails[langOf(r)].confirm[0]?.key ?? "");
    setPreview(false);
    setError(null);
    setOpen(r);
  };

  const { sessions, missing } = useMemo(() => {
    if (!open) return { sessions: [] as Session[], missing: false };
    const dates = dateRange(open.wish.start, open.wish.end);
    const mk = (date: string, from: T, until: T, extraDays = 0): Session | null => (from === null || until === null ? null : { date, from, until: extraDays * 1440 + until });
    const list =
      plan === "continuous"
        ? [mk(open.wish.start, cont.from, cont.until, dates.length - 1)]
        : plan === "daily"
          ? dates.map((d) => mk(d, daily.from, daily.until))
          : custom.filter((d) => d.on).map((d) => mk(d.date, d.from, d.until));
    return { sessions: list.filter((x): x is Session => x !== null), missing: list.some((x) => x === null) };
  }, [open, plan, cont, daily, custom]);

  const ordered = sessions.map(absolute).sort((a, b) => a.start - b.start);
  const problem = missing
    ? "Pick the missing times."
    : !sessions.length
      ? "Tick at least one day."
      : sessions.some((x) => x.until <= x.from)
        ? "An end time is before its start."
        : ordered.some((x, i) => i > 0 && ordered[i - 1].end > x.start)
          ? "Two of the days overlap."
          : null;
  const invalid = Boolean(problem);
  /** Blocks that reach outside what the client asked for — a warning only, he decides. */
  const outside =
    open && !invalid && open.wish.startTime !== null && open.wish.endTime !== null
      ? (() => {
          const w0 = absolute({ date: open.wish.start, from: open.wish.startTime, until: open.wish.startTime }).start;
          const w1 = absolute({ date: open.wish.end, from: open.wish.endTime, until: open.wish.endTime }).start;
          return sessions
            .filter((x) => {
              const a = absolute(x);
              return a.start < w0 || a.end > w1;
            })
            .map((x) => {
              const a = absolute(x);
              return `${fmtDate(x.date)} ${span(x.from, x.until)} is ${a.start < w0 ? `before the client's start (${clock(open.wish.startTime!)})` : `after the client's end (${clock(open.wish.endTime!)})`}`;
            });
        })()
      : [];
  const ctx = open && !invalid ? analyse(sessions, open.venue, confirmed, travel, mode) : null;

  /* Ask for driving times of every neighbour pair we show (cards' default plans + the open editor). */
  const neededKeys = useMemo(() => {
    const keys = new Set<string>();
    const collect = (list: Session[], venue: string) =>
      analyse(list, venue, confirmed, {}, mode).days.forEach((d) =>
        [d.before, d.after].forEach((n) => {
          if (n && n.a.trim() && n.b.trim()) keys.add(`${n.a}→${n.b}`);
        }),
      );
    for (const r of items) {
      if (r.wish.startTime === null || r.wish.endTime === null) continue;
      collect(
        defaultDays(r.wish)
          .filter((d): d is { date: string; on: boolean; from: number; until: number } => d.from !== null && d.until !== null && d.until > d.from)
          .map(({ date, from, until }) => ({ date, from, until })),
        r.venue,
      );
    }
    if (open && !invalid) collect(sessions, open.venue);
    return [...keys];
  }, [items, confirmed, open, invalid, sessions, mode]);
  useEffect(() => {
    const missing = neededKeys.filter((k) => !asked.current.has(k));
    if (!missing.length) return;
    missing.forEach((k) => asked.current.add(k));
    if (!travelEnabled) {
      setTravel((t) => ({ ...t, ...Object.fromEntries(missing.map((k) => [k, null])) }));
      return;
    }
    travelTimes(missing.map((k) => k.split("→") as [string, string]))
      .then((res) => setTravel((t) => ({ ...t, ...Object.fromEntries(missing.map((k) => [k, res[k] ?? null])) })))
      .catch(() => setTravel((t) => ({ ...t, ...Object.fromEntries(missing.map((k) => [k, null])) })));
  }, [neededKeys, travelEnabled]);

  const accept = () => {
    if (!open || invalid) return;
    const r = open;
    setError(null);
    startBusy(async () => {
      const res = await acceptRequest({ id: r.id, sessions, notes, addToCalendar: toCalendar, emailClient, templateKey: confirmKey });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems((xs) => xs.filter((x) => x.id !== r.id));
      setOpen(null);
      router.refresh();
      flash(
        `Accepted · ${r.name} — ${sessions.length} block${sessions.length > 1 ? "s" : ""} booked${res.calendar ? ", in Google Calendar" : ""}${
          emailClient ? (res.emailed ? ", confirmation sent." : " — but the email failed, reply by hand.") : "."
        }`,
      );
    });
  };

  /* decline sheet */
  const [declining, setDeclining] = useState<BookingRequest | null>(null);
  const [declineKey, setDeclineKey] = useState("none");
  const [declinePreview, setDeclinePreview] = useState(false);
  const declineRef = useRef<HTMLDivElement>(null);
  const closeDecline = useCallback(() => setDeclining(null), []);
  useModal(Boolean(declining), declineRef, closeDecline);
  const openDecline = (r: BookingRequest) => {
    const list = emails[langOf(r)].decline;
    // a sensible start: "booked"-style template if that day has other bookings, else the first one
    const booked = bookedText(r.wish, confirmed) ? list.find((x) => x.freeDates) : undefined;
    setDeclineKey(r.email ? ((booked ?? list[0])?.key ?? "none") : "none");
    setDeclinePreview(false);
    setDeclining(r);
  };
  const decline = () => {
    if (!declining) return;
    const r = declining;
    startBusy(async () => {
      const res = await declineRequest({ id: r.id, templateKey: declineKey });
      if (!res.ok) {
        flash(res.error);
        return;
      }
      setItems((xs) => xs.filter((x) => x.id !== r.id));
      setDeclining(null);
      router.refresh();
      flash(`Declined · ${r.name}${declineKey === "none" ? " — no email sent." : res.emailed ? " — email sent." : " — but the email failed."}`);
    });
  };

  const btn =
    "inline-flex min-h-11 items-center rounded-full px-5 text-xs uppercase tracking-[0.16em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  const ghost = `${btn} border border-ink-soft/40 text-ink-soft hover:text-ink`;
  const sel = "min-h-11 rounded-xl border border-ink-soft/40 bg-page px-2.5 text-sm text-ink focus:border-accent focus:outline-none";
  const timeSelect = (value: T, onChange: (v: T) => void, opts: number[], label: string) => (
    <select
      aria-label={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={`${sel} w-[7.5rem] shrink-0 ${value === null ? "border-[#c98a0a]/70 text-ink-soft" : ""}`}
    >
      {value === null ? <option value="">Pick…</option> : null}
      {opts.map((t) => (
        <option key={t} value={t}>
          {clock(t)}
        </option>
      ))}
    </select>
  );

  const neighbourCard = (n: Neighbour | null, kind: "before" | "after") => {
    if (!n)
      return (
        <div className="rounded-2xl border border-dashed border-sand/70 px-4 py-3 text-sm text-ink-soft">
          {kind === "before" ? "Nothing booked in the 12 hours before." : "Nothing booked in the 12 hours after."}
        </div>
      );
    return (
      <div className="rounded-2xl border border-sand/60 p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">{kind === "before" ? "Booked before" : "Booked after"}</p>
        <p className="mt-1 font-semibold text-ink">
          {n.c.label} <span className="font-normal text-ink-soft">· {span(n.c.from, n.c.until)}</span>
        </p>
        {n.c.venue ? (
          <a href={place(n.c.venue)} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-soft underline underline-offset-2 hover:text-ink">
            {n.c.venue}
          </a>
        ) : null}
        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
          {[
            ["Gap", duration(n.gap)],
            ["By car", n.t?.car !== undefined ? `≈ ${duration(n.t.car)}` : "—"],
            ["By train", n.t?.transit !== undefined ? `≈ ${duration(n.t.transit)}` : "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-sand/20 px-3 py-2">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">{k}</dt>
              <dd className="font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${TONE[n.tone]}`}>{n.text}</span>
          {n.a && n.b ? (
            <span className="flex gap-3 text-xs">
              <a href={maps(n.a, n.b, "driving")} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2 hover:text-accent">
                Route by car ↗
              </a>
              <a href={maps(n.a, n.b, "transit")} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2 hover:text-accent">
                By train ↗
              </a>
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  const single = layout === "actions" ? items[0] : null;
  return (
    <div>
      {layout === "actions" ? (
        single ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openReq(single)} className={`${btn} bg-accent text-white hover:opacity-90`}>
              Set times & accept
            </button>
            {single.email ? (
              <a href={`mailto:${single.email}`} className={ghost}>
                Reply
              </a>
            ) : null}
            <button type="button" onClick={() => openDecline(single)} className={ghost}>
              Decline…
            </button>
          </div>
        ) : null
      ) : items.length ? (
        <ul className="grid gap-3">
          {items.map((r) => {
            const a = cardVerdict(r.wish, r.venue, confirmed, travel, mode);
            return (
              <li key={r.id} className="rounded-2xl border border-sand/55 bg-page/50 p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">New</span>
                  <p className="font-display text-base font-bold">{r.name}</p>
                  <span className="text-sm text-ink-soft">· {r.type}</span>
                  <span className="ml-auto text-xs text-ink-soft">{r.received}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">{wishText(r.wish)}</p>
                <p className="mt-0.5 text-sm text-ink">
                  {r.venue ? (
                    <a href={place(r.venue)} target="_blank" rel="noopener noreferrer" className="-my-2 inline-flex min-h-11 items-center underline underline-offset-2">
                      {r.venue}
                    </a>
                  ) : (
                    <span className="text-danger">venue missing</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {r.services.join(" · ")}
                  {r.answers.map((x) => ` · ${x.label}: ${x.value}`).join("")}
                </p>
                {r.message ? <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">&ldquo;{r.message}&rdquo;</p> : null}
                {r.notes ? (
                  <p className="mt-2 rounded-xl bg-[#c98a0a]/10 px-3 py-2 text-sm text-ink">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c98a0a]">
                      Your note{r.noteCount && r.noteCount > 1 ? `s · ${r.noteCount}` : ""} ·{" "}
                    </span>
                    {r.notes}
                  </p>
                ) : null}
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
                  <span className={`rounded-full border px-3 py-1 font-semibold ${TONE[a.tone]}`}>{a.text}</span>
                  {a.detail ? <span>{a.detail}</span> : null}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  <Link
                    href={`${base}/bookings/${encodeURIComponent(r.id)}`}
                    className="mr-auto inline-flex min-h-11 items-center text-xs font-semibold text-ink-soft underline underline-offset-4 hover:text-ink"
                  >
                    Details & notes →
                  </Link>
                  <button type="button" onClick={() => openReq(r)} className={`${btn} bg-ink text-page hover:bg-accent hover:text-white`}>
                    Set times & accept
                  </button>
                  <a href={`mailto:${r.email}`} className={ghost}>
                    Reply
                  </a>
                  <button type="button" onClick={() => openDecline(r)} className={ghost}>
                    Decline…
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-sand/60 px-6 py-12 text-center">
          <p className="font-display text-2xl font-bold">Inbox zero.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">New requests from the website land here — and in your email and WhatsApp the moment they arrive.</p>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={close}>
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={`Accept ${open.name}`}
            onClick={(e) => e.stopPropagation()}
            className="view-in flex max-h-[92svh] w-full max-w-[min(44rem,100vw)] flex-col overflow-hidden rounded-t-3xl border border-sand/50 bg-page shadow-2xl sm:rounded-3xl"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-accent">Set the times & accept</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">
                    {open.name} · {open.type}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Client asked for: <span className="inline-block text-ink">{wishText(open.wish)}</span>
                  </p>
                  {open.venue ? (
                    <a href={place(open.venue)} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-soft underline underline-offset-2">
                      {open.venue}
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  data-autofocus
                  onClick={close}
                  aria-label="Close"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-sand/60 text-xl text-ink-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  ×
                </button>
              </div>

              {/* schedule editor */}
              <section className="mt-5 rounded-2xl border border-sand/60 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">Final schedule</p>
                <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl border border-sand/50 p-1" role="radiogroup" aria-label="Schedule type">
                  {(
                    [
                      ["continuous", "One block"],
                      ["daily", "Same hours daily"],
                      ["custom", "Per day"],
                    ] as [Plan, string][]
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={plan === k}
                      onClick={() => setPlan(k)}
                      disabled={k !== "continuous" && daysBetween(open.wish.start, open.wish.end) === 0}
                      className={`min-h-11 rounded-xl px-2 text-center text-xs font-semibold leading-tight transition disabled:opacity-35 ${plan === k ? "bg-ink text-page" : "text-ink-soft hover:text-ink"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {plan === "continuous" ? (
                  <div className="mt-3 grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 text-sm">
                    <span className="text-ink-soft">Starts</span>
                    <span className="min-w-0 truncate">{fmtDate(open.wish.start)}</span>
                    {timeSelect(cont.from, (v) => setCont((c) => ({ ...c, from: v })), FROM_OPTS, "Start time")}
                    <span className="text-ink-soft">Ends</span>
                    <span className="min-w-0 truncate">{fmtDate(open.wish.end)}</span>
                    {timeSelect(cont.until, (v) => setCont((c) => ({ ...c, until: v })), UNTIL_OPTS, "End time")}
                  </div>
                ) : plan === "daily" ? (
                  <div className="mt-3 text-sm">
                    <p className="text-ink-soft">
                      Every day, {fmtDate(open.wish.start)} – {fmtDate(open.wish.end)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {timeSelect(daily.from, (v) => setDaily((c) => ({ ...c, from: v })), FROM_OPTS, "From")}
                      <span aria-hidden>–</span>
                      {timeSelect(daily.until, (v) => setDaily((c) => ({ ...c, until: v })), UNTIL_OPTS, "Until")}
                    </div>
                  </div>
                ) : (
                  <ul className="mt-3 grid gap-2">
                    {custom.map((d, i) => (
                      <li key={d.date} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-sand/40 pb-2 text-sm last:border-0 last:pb-0">
                        <label className="flex min-h-11 w-full items-center gap-2 sm:w-[9.5rem]">
                          <input
                            type="checkbox"
                            checked={d.on}
                            onChange={(e) => setCustom((xs) => xs.map((x, k) => (k === i ? { ...x, on: e.target.checked } : x)))}
                            className="h-5 w-5 accent-[var(--color-accent)]"
                          />
                          {fmtDate(d.date)}
                        </label>
                        {d.on ? (
                          <span className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
                            {timeSelect(d.from, (v) => setCustom((xs) => xs.map((x, k) => (k === i ? { ...x, from: v } : x))), FROM_OPTS, `From, ${fmtDate(d.date)}`)}
                            <span aria-hidden>–</span>
                            {timeSelect(d.until, (v) => setCustom((xs) => xs.map((x, k) => (k === i ? { ...x, until: v } : x))), UNTIL_OPTS, `Until, ${fmtDate(d.date)}`)}
                            <button
                              type="button"
                              onClick={() => setCustom((xs) => xs.map((x, k) => (k === i ? { ...x, from: WORK_START, until: WORK_END } : x)))}
                              title="08:00 – 02:00 (+1)"
                              className="min-h-11 px-2 text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
                            >
                              All day
                            </button>
                          </span>
                        ) : (
                          <span className="text-xs text-ink-soft">not booked</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {open.wish.startTime === null || open.wish.endTime === null ? (
                  <p className="mt-3 rounded-xl bg-[#c98a0a]/10 px-3 py-2 text-xs text-ink">
                    The client wasn&apos;t sure about the time.{" "}
                    {bookedText(open.wish, confirmed) ? `Already booked on these dates: ${bookedText(open.wish, confirmed)}.` : "Nothing else is booked on these dates."}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-ink-soft">
                  {problem ? (
                    <span className="text-danger">{problem}</span>
                  ) : (
                    <>
                      Will block: {sessions.map((s) => longSpan(s)).join(" · ")} ({duration(sessions.reduce((m, s) => m + s.until - s.from, 0))} in total)
                    </>
                  )}
                </p>
              </section>

              {outside.length ? (
                <p className="mt-3 rounded-xl border border-[#c98a0a]/50 bg-[#c98a0a]/10 px-3 py-2 text-xs text-ink">Heads-up: {outside.join("; ")}. Fine if you agreed on it.</p>
              ) : null}

              {/* travel / clash check on the final schedule */}
              {ctx?.days.map((d, i) => (
                <section key={i} className="mt-5">
                  {ctx.days.length > 1 ? (
                    <p className="mb-2 font-display text-base font-bold">
                      {fmtDate(d.day.date)} <span className="text-sm font-normal text-ink-soft">· {span(d.day.from, d.day.until)}</span>
                    </p>
                  ) : null}
                  {d.clash.length ? (
                    <div role="alert" className="rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm text-ink">
                      <b>Overlaps</b> with {d.clash.map((c) => `${c.label} (${fmtDate(c.date)}, ${span(c.from, c.until)})`).join("; ")} — change the times above or reply to the
                      client.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {!d.before && !d.after ? (
                        <div className="rounded-2xl border border-dashed border-sand/70 px-4 py-3 text-sm text-ink-soft">Nothing booked in the 12 hours before or after.</div>
                      ) : (
                        <>
                          {neighbourCard(d.before, "before")}
                          {neighbourCard(d.after, "after")}
                        </>
                      )}
                    </div>
                  )}
                </section>
              ))}

              {/* private notes */}
              <section className="mt-5">
                <label htmlFor="bk-notes" className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">
                  Add a note — only you see it
                </label>
                {open.notes ? (
                  <p className="mt-1 text-xs text-ink-soft">
                    Latest note{open.noteCount && open.noteCount > 1 ? ` (of ${open.noteCount})` : ""}: <span className="text-ink">{open.notes}</span>
                  </p>
                ) : null}
                <textarea
                  id="bk-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. 30% deposit received · bring the drone · bride's sister: +49 …"
                  className="mt-1 w-full rounded-xl border border-ink-soft/40 bg-transparent px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
                />
              </section>

              <section className="mt-5 grid gap-3 rounded-2xl border border-sand/60 p-4 text-sm text-ink">
                <p className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">When you accept</p>
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={toCalendar}
                    onChange={(e) => setToCalendar(e.target.checked)}
                    disabled={!calendarConnected}
                    className="h-5 w-5 accent-[var(--color-accent)]"
                  />
                  Add to Google Calendar (with your notes)
                  {!calendarConnected ? <span className="text-xs text-ink-soft">— not connected yet</span> : null}
                </label>
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={emailClient}
                    onChange={(e) => setEmailClient(e.target.checked)}
                    disabled={!open.email}
                    className="h-5 w-5 accent-[var(--color-accent)]"
                  />
                  Email the client
                </label>
                {emailClient && open.email ? (
                  <div className="grid gap-1 pl-8">
                    <div className="flex items-center gap-2">
                      <select
                        aria-label="Confirmation template"
                        value={confirmKey}
                        onChange={(e) => setConfirmKey(e.target.value)}
                        className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink-soft/40 bg-page px-2.5 text-sm text-ink focus:border-accent focus:outline-none"
                      >
                        {emails[langOf(open)].confirm.map((x) => (
                          <option key={x.key} value={x.key}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setPreview((v) => !v)}
                        aria-expanded={preview}
                        className="min-h-11 px-1 text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
                      >
                        {preview ? "Hide preview" : "Preview"}
                      </button>
                    </div>
                    <span className="text-xs text-ink-soft">{langOf(open) === "de" ? "in German" : "in English"} · edit in Studio → Booking settings</span>
                  </div>
                ) : null}
              </section>

              {preview && emailClient && open.email && !invalid ? (
                <section className="mt-5">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-ink-soft">Email preview — to {open.email}</p>
                  {(() => {
                    const tpl = emails[langOf(open)].confirm.find((x) => x.key === confirmKey) ?? emails[langOf(open)].confirm[0];
                    const rng = sessionRange(sessions);
                    const m = bookingConfirmed(
                      {
                        ...emailData(open, sessionBlocks(sessions, langOf(open)), whenLabel(rng.start, rng.end, langOf(open))),
                        calendar: { ics: "#", google: sessions.map((x) => ({ label: fmtDate(x.date, langOf(open)), url: "#" })) },
                      },
                      tpl,
                    );
                    return (
                      <>
                        <p className="mb-2 text-sm font-semibold text-ink">{m.subject}</p>
                        <EmailFrame html={m.html} />
                      </>
                    );
                  })()}
                </section>
              ) : null}
            </div>

            <div className="border-t border-sand/60 bg-page px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:px-7 md:pt-4">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {error || problem || ctx?.clash ? (
                  <p role="status" className="w-full text-xs text-danger sm:mr-auto sm:w-auto">
                    {error ?? problem ?? "Change the times so nothing overlaps."}
                  </p>
                ) : null}
                <button type="button" onClick={close} className={`${ghost} justify-center`}>
                  Not now
                </button>
                <button
                  type="button"
                  onClick={accept}
                  disabled={busy || invalid || Boolean(ctx?.clash)}
                  aria-busy={busy}
                  className={`${btn} flex-1 justify-center bg-accent text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none`}
                >
                  Accept & block
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {declining ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={closeDecline}>
          <div
            ref={declineRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Decline ${declining.name}`}
            onClick={(e) => e.stopPropagation()}
            className="view-in max-h-[92svh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl border border-sand/50 bg-page p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl md:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-danger">Decline</p>
                <h2 className="mt-1 font-display text-2xl font-bold">{declining.name}</h2>
                <p className="mt-1 text-sm text-ink-soft">{wishText(declining.wish)}</p>
              </div>
              <button
                type="button"
                onClick={closeDecline}
                aria-label="Close"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-sand/60 text-xl text-ink-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                ×
              </button>
            </div>
            <fieldset className="mt-5">
              <legend className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">Email the client {langOf(declining) === "de" ? "(in German)" : "(in English)"}</legend>
              <div className="mt-2 grid gap-1">
                {[
                  ...emails[langOf(declining)].decline.map((x) => ({ key: x.key, label: x.name, hint: x.freeDates ? "with “See free dates”" : x.heading })),
                  { key: "none", label: "Don't email", hint: "Just remove it (e.g. spam)" },
                ].map((o) => (
                  <label key={o.key} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm hover:bg-sand/20">
                    <input
                      type="radio"
                      name="decline-template"
                      checked={declineKey === o.key}
                      disabled={o.key !== "none" && !declining.email}
                      onChange={() => setDeclineKey(o.key)}
                      className="h-5 w-5 accent-[var(--color-accent)]"
                    />
                    <span className="min-w-0">
                      {o.label}
                      <span className="block truncate text-xs text-ink-soft">{o.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="mt-1 text-xs text-ink-soft">Add or change these in Studio → Bookings → Booking settings → Decline emails.</p>
            {declineKey !== "none" ? (
              <button
                type="button"
                onClick={() => setDeclinePreview((v) => !v)}
                aria-expanded={declinePreview}
                className="mt-1 min-h-11 text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
              >
                {declinePreview ? "Hide preview" : "Preview the email"}
              </button>
            ) : null}
            {declinePreview && declineKey !== "none"
              ? (() => {
                  const tpl = emails[langOf(declining)].decline.find((x) => x.key === declineKey);
                  if (!tpl) return null;
                  const w = declining.wish;
                  const m = bookingDeclined(emailData(declining, wishBlocks(w, langOf(declining)), whenLabel(w.start, w.end, langOf(declining))), tpl);
                  return (
                    <div className="mt-2">
                      <p className="mb-2 text-sm font-semibold text-ink">{m.subject}</p>
                      <EmailFrame html={m.html} />
                    </div>
                  );
                })()
              : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" data-autofocus onClick={closeDecline} className={ghost}>
                Keep it
              </button>
              <button type="button" onClick={decline} disabled={busy} aria-busy={busy} className={`${btn} bg-danger text-white hover:opacity-90 disabled:opacity-50`}>
                Decline
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[130] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm text-page shadow-2xl"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
