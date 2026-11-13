import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loadAdmin, type AdminItem } from "@/lib/admin-data";
import { dateRange, fmtDate, span } from "@/lib/booking-time";
import { CountUp } from "@/components/about/CountUp";
import { Icon } from "@/components/admin/AdminShell";
import { QuickActions } from "@/components/admin/QuickActions";
import { StatusPill, card, daysUntil, mapsUrl, relDay, rise } from "@/components/admin/admin-ui";

export const metadata = { title: "Dashboard" };

const greet = () => {
  const h = +new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "numeric", hourCycle: "h23" }).format(new Date());
  return h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
/** Whole days since an ISO time. */
const ageDays = (iso: string) => Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
const dm = (d: string, o: Intl.DateTimeFormatOptions) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });

/** Dashboard: what needs him now, what's next, the numbers that matter. */
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  if (!(await auth())) return null;
  if ((await searchParams).tab === "reviews") redirect("/admin/reviews");
  const d = await loadAdmin();
  const { today } = d;

  const confirmed = d.items.filter((x) => x.status === "confirmed");
  const upcoming = confirmed
    .flatMap((b) => b.sessions.map((s) => ({ b, s })))
    .filter(({ s }) => s.date >= today)
    .sort((p, q) => p.s.date.localeCompare(q.s.date) || p.s.from - q.s.from);
  // one row per booking (its first upcoming day), soonest first
  const seen = new Set<string>();
  const nextByBooking = upcoming.filter(({ b }) => (seen.has(b.id) ? false : (seen.add(b.id), true)));
  const next = nextByBooking[0];
  const later = nextByBooking.slice(1, 7);

  const week = dateRange(today, new Date(Date.parse(`${today}T12:00:00Z`) + 6 * 86_400_000).toISOString().slice(0, 10));
  const shootsThisWeek = new Set(upcoming.filter(({ s }) => week.includes(s.date)).map(({ b }) => b.id)).size;
  const month = today.slice(0, 7);
  const bookedDaysMonth = new Set(confirmed.flatMap((b) => b.sessions.map((s) => s.date)).filter((x) => x.startsWith(month))).size;

  const oldestWaiting = [...d.requests].sort((a, b) => (a.receivedAt ?? "").localeCompare(b.receivedAt ?? ""))[0];
  const waitedDays = oldestWaiting?.receivedAt ? ageDays(oldestWaiting.receivedAt) : 0;
  const soonRequests = d.items.filter((x) => x.status === "request" && daysUntil(x.start, today) <= 14);
  /** What a request runs into: a confirmed booking at the same time (or on the same day if no time yet). */
  const conflictOf = (r: AdminItem) => {
    const days = dateRange(r.wish.start, r.wish.end);
    for (const c of confirmed)
      for (const s of c.sessions) {
        if (!days.includes(s.date)) continue;
        const timed = r.sessions[0];
        if (!timed || !c.timed) return { name: c.client, hard: false };
        if (timed.from < s.until && s.from < timed.until) return { name: c.client, hard: true };
      }
    return null;
  };
  const clashing = d.items.filter((x) => x.status === "request").map((r) => ({ r, c: conflictOf(r) })).filter((x) => x.c);

  const needs: { href: string; text: string; tone: "accent" | "warn" | "soft" }[] = [
    ...(d.requests.length
      ? [{ href: "/admin/requests", text: `${d.requests.length} request${d.requests.length > 1 ? "s" : ""} waiting${waitedDays >= 1 ? ` — oldest ${waitedDays} day${waitedDays > 1 ? "s" : ""}` : ""}`, tone: waitedDays >= 1 ? ("warn" as const) : ("accent" as const) }]
      : []),
    ...clashing.slice(0, 3).map(({ r, c }) => ({
      href: `/admin/bookings/${encodeURIComponent(r.id)}`,
      text: `${r.client} · ${dm(r.start, { day: "numeric", month: "short" })} ${c!.hard ? "clashes with" : "— you already have"} ${c!.name}${c!.hard ? "" : " that day"}`,
      tone: "warn" as const,
    })),
    ...soonRequests
      .filter((x) => !clashing.some((c) => c.r.id === x.id))
      .slice(0, 2)
      .map((x) => ({ href: `/admin/bookings/${encodeURIComponent(x.id)}`, text: `${x.client} wants ${dm(x.start, { day: "numeric", month: "short" })} — that's ${relDay(daysUntil(x.start, today)).toLowerCase()}`, tone: "warn" as const })),
    ...confirmed
      .filter((b) => !b.venue && b.end >= today)
      .slice(0, 2)
      .map((b) => ({ href: `/admin/bookings/${encodeURIComponent(b.id)}`, text: `${b.client}: venue missing`, tone: "soft" as const })),
    ...(d.reviewsPending ? [{ href: "/admin/reviews", text: `${d.reviewsPending} review${d.reviewsPending > 1 ? "s" : ""} to approve`, tone: "accent" as const }] : []),
  ];

  const stats = [
    { n: d.requests.length, label: "New requests", href: "/admin/requests" },
    { n: shootsThisWeek, label: "Shoots in the next 7 days", href: "/admin/calendar?view=week" },
    { n: bookedDaysMonth, label: `Booked days in ${dm(today, { month: "long" })}`, href: "/admin/calendar" },
    { n: d.reviewsPending, label: "Reviews to approve", href: "/admin/reviews" },
  ];

  return (
    <div className="relative overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-48 h-[30rem] w-[30rem] rounded-full bg-accent/15 blur-[120px]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-10">
        <section className="adm-rise" style={rise(0)}>
          <p className="text-xs uppercase tracking-[0.24em] text-accent">{dm(today, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-[0.95] tracking-tight md:text-6xl">
            {greet()},
            <br className="md:hidden" /> Somdatt.
          </h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            {d.requests.length ? `${d.requests.length} new request${d.requests.length > 1 ? "s" : ""} to answer` : "No open requests"}
            {next ? ` · next shoot ${relDay(daysUntil(next.s.date, today)).toLowerCase()}` : ""}.
          </p>
        </section>

        {/* numbers, like the About page */}
        <section className="adm-rise mt-8 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-sand/60 py-8 md:grid-cols-4 md:py-10" style={rise(1)}>
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="group">
              <p className="font-display text-5xl font-extrabold tracking-tight transition group-hover:text-accent md:text-6xl">
                <CountUp to={s.n} duration={900} />
              </p>
              <p className="mt-1.5 text-sm leading-snug text-ink-soft">{s.label}</p>
            </Link>
          ))}
        </section>

        {/* phone: Needs you → Next up → Coming up → Quick actions; desktop: two columns */}
        <div className="mt-8 flex flex-col gap-5 lg:grid lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="contents lg:grid lg:content-start lg:gap-5">
            {next ? <NextUp b={next.b} date={next.s.date} from={next.s.from} until={next.s.until} today={today} /> : <EmptyNext />}

            <section className={`adm-rise order-3 lg:order-none ${card} overflow-hidden`} style={rise(3)}>
              <div className="flex items-center justify-between px-5 pt-5 md:px-6">
                <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft">Coming up</h2>
                <Link href="/admin/calendar?view=list" className="-my-2 inline-flex min-h-11 items-center text-xs font-semibold text-ink-soft underline underline-offset-4 hover:text-ink">
                  All bookings →
                </Link>
              </div>
              {later.length ? (
                <ul className="mt-2 divide-y divide-sand/50">
                  {later.map(({ b, s }) => (
                    <li key={b.id}>
                      <Link href={`/admin/bookings/${encodeURIComponent(b.id)}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-sand/20 md:px-6">
                        <span className="grid w-12 shrink-0 text-center">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">{dm(s.date, { month: "short" })}</span>
                          <span className="font-display text-2xl font-extrabold leading-none">{+s.date.slice(8)}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{b.client}</span>
                          <span className="block truncate text-sm text-ink-soft">
                            {b.type} · {dm(s.date, { weekday: "short" })} {b.timed ? span(s.from, s.until) : "whole day"}
                          </span>
                        </span>
                        <span className="hidden shrink-0 text-xs text-ink-soft sm:block">{relDay(daysUntil(s.date, today))}</span>
                        <Icon d="M9 6l6 6-6 6" className="h-4 w-4 shrink-0 text-ink-soft" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 pb-6 pt-3 text-sm text-ink-soft md:px-6">{next ? "Nothing else booked yet." : "No bookings yet — accepted requests show up here."}</p>
              )}
              <div className="h-2" />
            </section>
          </div>

          <div className="contents lg:grid lg:content-start lg:gap-5">
            <section className={`adm-rise order-1 lg:order-none ${card} p-5 md:p-6`} style={rise(4)}>
              <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft">Needs you</h2>
              {needs.length ? (
                <ul className="mt-3 grid gap-2">
                  {needs.map((n) => (
                    <li key={n.text}>
                      <Link
                        href={n.href}
                        className={`flex min-h-11 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-sm transition hover:-translate-y-px ${
                          n.tone === "warn" ? "border-[#c98a0a]/45 bg-[#c98a0a]/10" : n.tone === "accent" ? "border-accent/40 bg-accent/10" : "border-sand/60"
                        }`}
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${n.tone === "warn" ? "bg-[#c98a0a]" : n.tone === "accent" ? "bg-accent" : "bg-ink-soft"}`} />
                        <span className="flex-1">{n.text}</span>
                        <Icon d="M9 6l6 6-6 6" className="h-4 w-4 text-ink-soft" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#2f9e6f]/15 text-[#2f9e6f]">✓</span> All caught up.
                </p>
              )}
            </section>
            <QuickActions style={rise(5)} className="order-4 hidden lg:order-none lg:block" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NextUp({ b, date, from, until, today }: { b: AdminItem; date: string; from: number; until: number; today: string }) {
  const n = daysUntil(date, today);
  return (
    <section className={`adm-rise relative order-2 overflow-hidden lg:order-none ${card}`} style={rise(2)}>
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/15 blur-[80px]" />
      <div className="relative grid gap-5 p-5 sm:grid-cols-[auto_1fr] md:p-7">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Next up · {relDay(n)}</p>
          <div className="mt-2 flex items-end gap-3 sm:mt-3 sm:block">
          <p className="font-display text-7xl font-extrabold leading-[0.85] tracking-tighter md:text-8xl">{+date.slice(8)}</p>
          <p className="font-display text-lg font-bold uppercase tracking-[0.14em] text-ink-soft sm:mt-1">
            {dm(date, { weekday: "short" })} · {dm(date, { month: "short" })}
          </p>
          </div>
        </div>
        <div className="min-w-0 sm:border-l sm:border-sand/60 sm:pl-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={b.status} />
            {b.inCalendar ? <span className="text-xs text-ink-soft">in Google Calendar</span> : null}
          </div>
          <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight">{b.client}</h2>
          <p className="mt-1 text-ink-soft">
            {b.type} · {b.timed ? span(from, until) : "whole day"}
            {b.sessions.length > 1 ? ` · ${b.sessions.length} days` : ""}
          </p>
          {b.venue ? (
            <a href={mapsUrl(b.venue)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-sm text-ink underline underline-offset-4">
              {b.venue}
            </a>
          ) : null}
          {b.notes.at(-1) ? <p className="mt-3 rounded-xl bg-[#c98a0a]/10 px-3 py-2 text-sm">📝 {b.notes.at(-1)!.text}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/admin/bookings/${encodeURIComponent(b.id)}`} className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-xs font-semibold uppercase tracking-[0.14em] text-page hover:bg-accent hover:text-white">
              Open booking
            </Link>
            {b.venue ? (
              <a href={mapsUrl(b.venue)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-sand/70 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft hover:text-ink">
                Route ↗
              </a>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-ink-soft">{fmtDate(date)}</p>
        </div>
      </div>
    </section>
  );
}

function EmptyNext() {
  return (
    <section className={`adm-rise order-2 lg:order-none ${card} p-6 md:p-7`} style={rise(2)}>
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Next up</p>
      <p className="mt-2 font-display text-2xl font-bold">Nothing booked yet.</p>
      <p className="mt-1 text-sm text-ink-soft">When you accept a request — or add a booking by hand — it shows up here with a countdown.</p>
    </section>
  );
}
