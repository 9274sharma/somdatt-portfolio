"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminItem } from "@/lib/admin-data";
import { dateRange, span } from "@/lib/booking-time";
import { Icon } from "./AdminShell";
import { StatusPill, daysUntil, relDay } from "./admin-ui";

type View = "month" | "week" | "list";
type Ev = { key: string; id: string; client: string; type: string; status: AdminItem["status"]; date: string; from: number | null; until: number | null };

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const at = (d: string) => Date.parse(`${d}T12:00:00Z`);
const addDays = (d: string, n: number) => iso(at(d) + n * DAY);
const monday = (d: string) => addDays(d, -((new Date(at(d)).getUTCDay() + 6) % 7));
const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Date(at(d)).toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
const href = (id: string) => `/admin/bookings/${encodeURIComponent(id)}`;

/** Bookings as events: confirmed = exact blocks; requests = the days they asked for (tentative). */
function toEvents(items: AdminItem[]): Ev[] {
  return items.flatMap((b): Ev[] => {
    if (b.status === "confirmed")
      return b.sessions.map((s, i) => ({ key: `${b.id}:${i}`, id: b.id, client: b.client, type: b.type, status: b.status, date: s.date, from: b.timed ? s.from : null, until: b.timed ? s.until : null }));
    if (b.status === "request")
      return dateRange(b.wish.start, b.wish.end).map((date, i, arr) => ({
        key: `${b.id}:${i}`,
        id: b.id,
        client: b.client,
        type: b.type,
        status: b.status,
        date,
        from: arr.length === 1 && b.wish.startTime !== null && b.wish.endTime !== null ? b.wish.startTime : null,
        until: arr.length === 1 && b.wish.startTime !== null && b.wish.endTime !== null ? b.wish.endTime : null,
      }));
    return [];
  });
}

const chip = (e: Ev) =>
  e.status === "request" ? "border border-dashed border-accent/70 bg-accent/10 text-accent" : "bg-accent text-white";

export function CalendarView({ items, today, initialView }: { items: AdminItem[]; today: string; initialView?: View }) {
  const [view, setView] = useState<View>(initialView ?? "month");
  const [cursor, setCursor] = useState(today);
  const [selected, setSelected] = useState(today);
  const [showRequests, setShowRequests] = useState(true);
  const [type, setType] = useState("");
  const [past, setPast] = useState(false);

  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set("view", view);
    window.history.replaceState(null, "", u);
  }, [view]);

  const types = useMemo(() => [...new Set(items.filter((x) => x.status === "confirmed" || x.status === "request").map((x) => x.type))].sort(), [items]);
  const events = useMemo(
    () => toEvents(items).filter((e) => (showRequests || e.status !== "request") && (!type || e.type === type)),
    [items, showRequests, type],
  );
  const byDay = useMemo(() => {
    const m = new Map<string, Ev[]>();
    for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    for (const list of m.values()) list.sort((a, b) => (a.from ?? -1) - (b.from ?? -1));
    return m;
  }, [events]);

  const step = (n: number) => {
    if (view === "month") {
      const d = new Date(at(cursor));
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + n);
      setCursor(iso(d.getTime()));
    } else setCursor(addDays(cursor, 7 * n));
  };
  const weekStart = monday(cursor);
  const label =
    view === "month"
      ? fmt(cursor, { month: "long", year: "numeric" })
      : view === "week"
        ? `${fmt(weekStart, { day: "numeric", month: "short" })} – ${fmt(addDays(weekStart, 6), { day: "numeric", month: "short", year: "numeric" })}`
        : past
          ? "All bookings"
          : "Coming up";

  const seg = (on: boolean) => `inline-flex min-h-11 items-center rounded-full px-4 text-xs font-semibold transition ${on ? "bg-ink text-page" : "text-ink-soft hover:text-ink"}`;

  return (
    <div>
      {/* toolbar: title + paging, then one scrollable row of view / filters */}
      <div className="mb-4 grid gap-3">
        <div className="flex items-center gap-2">
          <h2 className="mr-auto font-display text-2xl font-extrabold tracking-tight md:text-3xl" aria-live="polite">
            {label}
          </h2>
          {view !== "list" ? (
            <>
              <button type="button" onClick={() => step(-1)} aria-label="Previous" className="grid h-11 w-11 place-items-center rounded-full border border-sand/60 text-ink-soft hover:text-ink">
                <Icon d="M15 6l-6 6 6 6" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCursor(today);
                  setSelected(today);
                }}
                className="min-h-11 rounded-full border border-sand/60 px-4 text-xs font-semibold text-ink-soft hover:text-ink"
              >
                Today
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next" className="grid h-11 w-11 place-items-center rounded-full border border-sand/60 text-ink-soft hover:text-ink">
                <Icon d="M9 6l6 6-6 6" className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex shrink-0 gap-1 rounded-full border border-sand/60 p-1" role="radiogroup" aria-label="View">
            {(["month", "week", "list"] as View[]).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)} className={seg(view === v)}>
                {v === "list" ? "List" : v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </span>
          <div className="flex w-full min-w-0 gap-2 sm:w-auto">
          <button
            type="button"
            aria-pressed={showRequests}
            onClick={() => setShowRequests((x) => !x)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition ${
              showRequests ? "border-dashed border-accent/70 bg-accent/10 text-accent" : "border-sand/60 text-ink-soft"
            }`}
          >
            {showRequests ? "✓ " : ""}Requests
          </button>
          {view === "list" ? (
            <button
              type="button"
              aria-pressed={past}
              onClick={() => setPast((x) => !x)}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-xs font-semibold transition ${past ? "border-ink bg-ink text-page" : "border-sand/60 text-ink-soft"}`}
            >
              {past ? "✓ " : ""}Past
            </button>
          ) : null}
          {types.length > 1 ? (
            <select
              aria-label="Event type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-full border border-sand/60 bg-page px-4 text-xs text-ink focus:border-accent focus:outline-none sm:flex-none"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          ) : null}
          </div>
        </div>
      </div>

      {view === "month" ? (
        <Month cursor={cursor} today={today} byDay={byDay} selected={selected} onSelect={setSelected} />
      ) : view === "week" ? (
        <Week start={weekStart} today={today} byDay={byDay} />
      ) : (
        <List events={events} today={today} past={past} />
      )}
    </div>
  );
}

/* ── month ─────────────────────────────────────────────────────── */

function Month({ cursor, today, byDay, selected, onSelect }: { cursor: string; today: string; byDay: Map<string, Ev[]>; selected: string; onSelect: (d: string) => void }) {
  const first = `${cursor.slice(0, 7)}-01`;
  const start = monday(first);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const weeks = days[35].slice(0, 7) === cursor.slice(0, 7) ? 6 : 5;
  const sel = byDay.get(selected) ?? [];
  const agenda = useRef<HTMLElement>(null);
  const pick = (d: string) => {
    onSelect(d);
    if (window.matchMedia("(max-width: 767px)").matches) setTimeout(() => agenda.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };
  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-sand/60">
        <div className="grid grid-cols-7 border-b border-sand/60 bg-sand/15 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          {DOW.map((d) => (
            <span key={d} className="py-2">
              <span className="md:hidden">{d[0]}</span>
              <span className="hidden md:inline">{d}</span>
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.slice(0, weeks * 7).map((d, i) => {
            const evs = byDay.get(d) ?? [];
            const inMonth = d.slice(0, 7) === cursor.slice(0, 7);
            const isToday = d === today;
            const isSel = d === selected;
            const past = d < today;
            return (
              <div
                key={d}
                className={`relative min-h-[3.75rem] border-sand/50 p-1 md:min-h-[7.5rem] md:p-1.5 ${i % 7 ? "border-l" : ""} ${i >= 7 ? "border-t" : ""} ${inMonth ? "" : "bg-sand/10"} ${
                  isSel ? "bg-accent/[0.07]" : ""
                } ${past && !isSel ? "opacity-55" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => pick(d)}
                  aria-label={`${fmt(d, { weekday: "long", day: "numeric", month: "long" })}${evs.length ? `, ${evs.length} item${evs.length > 1 ? "s" : ""}` : ""}`}
                  aria-pressed={isSel}
                  className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                />
                <span
                  className={`relative inline-grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${isToday ? "bg-accent text-white" : inMonth ? "text-ink" : "text-ink-soft/60"}`}
                >
                  {+d.slice(8)}
                </span>
                {/* phone: dots */}
                <span className="relative mt-0.5 flex flex-wrap gap-1 px-1 md:hidden">
                  {evs.slice(0, 4).map((e) => (
                    <span key={e.key} className={`h-1.5 w-1.5 rounded-full ${e.status === "request" ? "border border-accent" : "bg-accent"}`} />
                  ))}
                </span>
                {/* desktop: chips */}
                <ul className="relative mt-1 hidden gap-1 md:grid">
                  {evs.slice(0, 3).map((e) => (
                    <li key={e.key}>
                      <Link href={href(e.id)} className={`block truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-5 ${chip(e)}`} title={`${e.client} · ${e.type}`}>
                        {e.from !== null && e.until !== null ? <span className="opacity-80">{span(e.from, e.until).split("–")[0]} </span> : null}
                        {e.client}
                      </Link>
                    </li>
                  ))}
                  {evs.length > 3 ? <li className="px-1.5 text-[11px] text-ink-soft">+{evs.length - 3} more</li> : null}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <Legend />

      {/* the selected day */}
      <section ref={agenda} className="mt-5 scroll-mt-20">
        <h3 className="text-xs uppercase tracking-[0.2em] text-ink-soft">
          {fmt(selected, { weekday: "long", day: "numeric", month: "long" })} · {relDay(daysUntil(selected, today))}
        </h3>
        {sel.length ? (
          <ul className="mt-3 grid gap-2">
            {sel.map((e) => (
              <EventRow key={e.key} e={e} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-sand/60 px-4 py-5 text-sm text-ink-soft">Free — nothing booked.</p>
        )}
      </section>
    </>
  );
}

function Legend() {
  return (
    <p className="mt-3 flex flex-wrap gap-4 text-xs text-ink-soft">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent md:h-3 md:w-5 md:rounded" /> Booked
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full border border-accent md:h-3 md:w-5 md:rounded md:border-dashed md:border-accent/70 md:bg-accent/10" /> Request (not booked yet)
      </span>
    </p>
  );
}

/* ── week ──────────────────────────────────────────────────────── */

const H0 = 6; // 06:00
const H1 = 26; // 02:00 next day
const ROW = 44;

/** Minutes since midnight in Hamburg right now (for the "now" line). */
const nowMinutes = () => {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const h = +(p.find((x) => x.type === "hour")?.value ?? 0);
  const m = +(p.find((x) => x.type === "minute")?.value ?? 0);
  return h * 60 + m;
};

function Week({ start, today, byDay }: { start: string; today: string; byDay: Map<string, Ev[]> }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const grid = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<number | null>(null);
  // scroll the hour grid to the first job of the week (or 08:00), and keep a "now" line
  useEffect(() => {
    const first = days.flatMap((d) => (byDay.get(d) ?? []).filter((e) => e.from !== null).map((e) => e.from!)).sort((a, b) => a - b)[0] ?? 8 * 60;
    if (grid.current) grid.current.scrollTop = Math.max(0, ((first - H0 * 60) / 60) * ROW - ROW);
    const tick = () => setNow(nowMinutes());
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per week shown
  }, [start]);
  return (
    <>
      {/* phone: agenda per day */}
      <ul className="grid gap-4 md:hidden">
        {days.map((d) => {
          const evs = byDay.get(d) ?? [];
          return (
            <li key={d}>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${d === today ? "text-accent" : "text-ink-soft"}`}>
                {fmt(d, { weekday: "long", day: "numeric", month: "short" })}
                {d === today ? " · Today" : ""}
              </p>
              {evs.length ? (
                <ul className="mt-2 grid gap-2">
                  {evs.map((e) => (
                    <EventRow key={e.key} e={e} />
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-sm text-ink-soft/70">Free</p>
              )}
            </li>
          );
        })}
      </ul>

      {/* desktop: time grid 06:00 → 02:00 */}
      <div className="hidden overflow-hidden rounded-3xl border border-sand/60 md:block">
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-sand/60 bg-sand/15">
          <span />
          {days.map((d) => (
            <span key={d} className={`border-l border-sand/50 px-2 py-2 text-center text-xs ${d === today ? "font-bold text-accent" : "text-ink-soft"}`}>
              {fmt(d, { weekday: "short" })} <span className="font-display text-base font-extrabold text-ink">{+d.slice(8)}</span>
            </span>
          ))}
        </div>
        {/* all-day row */}
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-sand/60">
          <span className="px-1 py-1.5 text-right text-[10px] uppercase tracking-[0.1em] text-ink-soft">All day</span>
          {days.map((d) => (
            <div key={d} className="grid min-h-8 gap-1 border-l border-sand/50 p-1">
              {(byDay.get(d) ?? [])
                .filter((e) => e.from === null)
                .map((e) => (
                  <Link key={e.key} href={href(e.id)} className={`truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${chip(e)}`}>
                    {e.client}
                  </Link>
                ))}
            </div>
          ))}
        </div>
        <div ref={grid} className="max-h-[70svh] overflow-y-auto">
        <div className="relative grid grid-cols-[3.5rem_repeat(7,1fr)]" style={{ height: (H1 - H0) * ROW }}>
          <div>
            {Array.from({ length: H1 - H0 }, (_, i) => (
              <span key={i} className="block pr-1.5 text-right text-[11px] text-ink-soft" style={{ height: ROW }}>
                {String((H0 + i) % 24).padStart(2, "0")}:00
              </span>
            ))}
          </div>
          {days.map((d) => {
            const evs = (byDay.get(d) ?? []).filter((e) => e.from !== null && e.until !== null);
            // simple lanes so overlapping items sit side by side
            const lanes: number[] = [];
            const placed = evs.map((e) => {
              let lane = lanes.findIndex((end) => end <= e.from!);
              if (lane < 0) lane = lanes.length;
              lanes[lane] = e.until!;
              return { e, lane };
            });
            const n = Math.max(1, lanes.length);
            return (
              <div key={d} className={`relative border-l border-sand/50 ${d === today ? "bg-accent/[0.04]" : d < today ? "opacity-55" : ""}`}>
                {Array.from({ length: H1 - H0 }, (_, i) => (
                  <span key={i} className="block border-t border-sand/30" style={{ height: ROW }} />
                ))}
                {d === today && now !== null && now >= H0 * 60 ? (
                  <span aria-hidden className="absolute inset-x-0 z-[2] h-0.5 bg-accent" style={{ top: ((now - H0 * 60) / 60) * ROW }}>
                    <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-accent" />
                  </span>
                ) : null}
                {placed.map(({ e, lane }) => {
                  const top = ((Math.max(e.from!, H0 * 60) - H0 * 60) / 60) * ROW;
                  const h = Math.max(22, ((Math.min(e.until!, H1 * 60) - Math.max(e.from!, H0 * 60)) / 60) * ROW - 2);
                  return (
                    <Link
                      key={e.key}
                      href={href(e.id)}
                      className={`absolute overflow-hidden rounded-lg px-1.5 py-1 text-[11px] leading-tight shadow-sm ${chip(e)}`}
                      style={{ top, height: h, left: `calc(${(lane / n) * 100}% + 2px)`, width: `calc(${100 / n}% - 4px)` }}
                      title={`${e.client} · ${span(e.from!, e.until!)}`}
                    >
                      <span className="block font-semibold">{e.client}</span>
                      <span className="block opacity-80">{span(e.from!, e.until!)}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
        </div>
      </div>
      <Legend />
    </>
  );
}

/* ── list ──────────────────────────────────────────────────────── */

function List({ events, today, past }: { events: Ev[]; today: string; past: boolean }) {
  // one row per booking per day, soonest first; grouped by month
  const list = events.filter((e) => past || e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || (a.from ?? -1) - (b.from ?? -1));
  const groups = new Map<string, Ev[]>();
  for (const e of list) groups.set(e.date.slice(0, 7), [...(groups.get(e.date.slice(0, 7)) ?? []), e]);
  if (!list.length) return <p className="rounded-3xl border border-dashed border-sand/60 p-10 text-center text-sm text-ink-soft">Nothing coming up.</p>;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {[...groups].map(([m, evs]) => (
        <section key={m} className="min-w-0">
          <h3 className="mb-2 font-display text-lg font-extrabold">{fmt(`${m}-01`, { month: "long", year: "numeric" })}</h3>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
            {evs.map((e) => (
              <EventRow key={e.key} e={e} today={today} withDate />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function EventRow({ e, today, withDate }: { e: Ev; today?: string; withDate?: boolean }) {
  return (
    <li>
      <Link href={href(e.id)} className="flex min-w-0 items-center gap-3 rounded-2xl border border-sand/60 px-3.5 py-3 transition hover:-translate-y-px hover:border-accent/40">
        {withDate ? (
          <span className="grid w-11 shrink-0 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">{fmt(e.date, { weekday: "short" })}</span>
            <span className="font-display text-xl font-extrabold leading-none">{+e.date.slice(8)}</span>
          </span>
        ) : (
          <span className={`h-9 w-1.5 shrink-0 rounded-full ${e.status === "request" ? "border border-dashed border-accent" : "bg-accent"}`} />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{e.client}</span>
          <span className="block truncate text-sm text-ink-soft">
            {e.type} · {e.from !== null && e.until !== null ? span(e.from, e.until) : e.status === "request" ? "time not set" : "whole day"}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <StatusPill status={e.status} />
          {today ? <span className="text-[11px] text-ink-soft">{relDay(daysUntil(e.date, today))}</span> : null}
        </span>
      </Link>
    </li>
  );
}
