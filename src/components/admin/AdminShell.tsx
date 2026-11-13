"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";
import { createBooking, signOutAdmin } from "@/app/admin/actions";
import { useModal } from "@/components/work/Lightbox";

/* ── shared UI: toast (with Undo), in-app confirm, "new booking" from anywhere ── */

type Ask = { title: string; body?: string; confirm: string; danger?: boolean };
type UI = {
  toast: (msg: string, action?: { label: string; run: () => void }) => void;
  openAdd: () => void;
  /** in-app confirm sheet (no browser "…says" dialogs in the installed app) */
  ask: (a: Ask) => Promise<boolean>;
};
const Ctx = createContext<UI>({ toast: () => {}, openAdd: () => {}, ask: async () => false });
export const useAdminUI = () => useContext(Ctx);

/* ── icons (1.6px stroke, 24 grid) ────────────────────────────────── */

const I = {
  home: "M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9",
  inbox: "M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6H3v-6l2-8Z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  star: "m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.6 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3Z",
  book: "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4ZM5 16a4 4 0 0 1 4-4h10",
  more: "M4.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0M10.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0M16.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0",
  plus: "M12 5v14M5 12h14",
  out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  ext: "M14 5h5v5M19 5l-8 8M18 14v5H5V6h5",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z",
};
export function Icon({ d, className = "h-5 w-5" }: { d: keyof typeof I | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={(I as Record<string, string>)[d] ?? d} />
    </svg>
  );
}

const NAV = [
  { href: "", label: "Dashboard", short: "Home", icon: "home" },
  { href: "/requests", label: "Requests", short: "Requests", icon: "inbox", badge: "requests" },
  { href: "/calendar", label: "Calendar", short: "Calendar", icon: "calendar" },
  { href: "/reviews", label: "Reviews", short: "Reviews", icon: "star", badge: "reviews" },
  { href: "/guide", label: "Guide", short: "Guide", icon: "book" },
] as const;

const flipTheme = () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    /* ignore */
  }
};

export function AdminShell({
  children,
  counts,
  user,
  eventTypes,
  base = "/admin",
}: {
  children: ReactNode;
  counts: { requests: number; reviews: number };
  user: string;
  eventTypes: string[];
  base?: string;
}) {
  const pathname = usePathname() ?? "";
  const [toast, setToast] = useState<{ msg: string; action?: { label: string; run: () => void } } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adding, setAdding] = useState(false);
  const [more, setMore] = useState(false);
  const [asking, setAsking] = useState<(Ask & { resolve: (v: boolean) => void }) | null>(null);

  const showToast = useCallback((msg: string, action?: { label: string; run: () => void }) => {
    setToast({ msg, action });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), action ? 7000 : 5000);
  }, []);
  const openAdd = useCallback(() => setAdding(true), []);
  const ask = useCallback((a: Ask) => new Promise<boolean>((resolve) => setAsking({ ...a, resolve })), []);

  const active = (href: string) =>
    href === "/calendar" ? pathname.startsWith(`${base}/calendar`) || pathname.startsWith(`${base}/bookings`) : href ? pathname.startsWith(base + href) : pathname === base;
  const badge = (k?: string) => (k === "requests" ? counts.requests : k === "reviews" ? counts.reviews : 0);
  const tabs = NAV.filter((n) => n.href !== "/guide");

  return (
    <Ctx.Provider value={{ toast: showToast, openAdd, ask }}>
      <div className="adm-app min-h-[100svh] bg-page text-ink lg:grid lg:grid-cols-[16rem_1fr]">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-[100svh] flex-col border-r border-sand/60 px-4 py-6 lg:flex">
          <Link href={base} className="px-3">
            <span className="block font-display text-lg font-extrabold tracking-[0.18em]">
              SOM<span className="text-accent">·</span>DATT
            </span>
            <span className="mt-0.5 block text-[11px] uppercase tracking-[0.2em] text-ink-soft">Booking desk</span>
          </Link>
          <button
            type="button"
            onClick={openAdd}
            className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Icon d="plus" className="h-4 w-4" /> New booking
          </button>
          <nav className="mt-6 grid gap-1" aria-label="Admin">
            {NAV.map((n) => {
              const on = active(n.href);
              const b = badge("badge" in n ? n.badge : undefined);
              return (
                <Link
                  key={n.href}
                  href={base + n.href}
                  aria-current={on ? "page" : undefined}
                  className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${on ? "bg-ink text-page" : "text-ink-soft hover:bg-sand/30 hover:text-ink"}`}
                >
                  <Icon d={n.icon} />
                  <span className="flex-1">{n.label}</span>
                  {b ? <span className={`min-w-6 rounded-full px-1.5 text-center text-[11px] font-bold leading-6 ${on ? "bg-accent text-white" : "bg-accent/15 text-accent"}`}>{b}</span> : null}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 grid gap-1 border-t border-sand/60 pt-4 text-sm">
            <Link href="/studio/structure/bookings" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-ink-soft hover:bg-sand/30 hover:text-ink">
              <Icon d="ext" className="h-4 w-4" /> Texts & emails (Studio)
            </Link>
            <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-ink-soft hover:bg-sand/30 hover:text-ink">
              <Icon d="ext" className="h-4 w-4" /> View website
            </Link>
          </div>
          <div className="mt-auto flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={flipTheme}
              aria-label="Switch light / dark"
              className="adm-theme grid h-11 w-11 place-items-center rounded-full border border-sand/60 text-ink-soft hover:text-ink"
            >
              <Icon d="sun" className="adm-sun h-4 w-4" />
              <Icon d="moon" className="adm-moon h-4 w-4" />
            </button>
            <form action={signOutAdmin} className="flex-1">
              <button type="submit" title={user} className="flex min-h-11 w-full items-center gap-2 rounded-full border border-sand/60 px-3 text-xs text-ink-soft hover:text-ink">
                <Icon d="out" className="h-4 w-4" /> Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-sand/60 bg-page/90 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
          <Link href={base} className="flex min-h-11 items-center font-display text-base font-extrabold tracking-[0.16em]">
            SOM<span className="text-accent">·</span>DATT
          </Link>
          <button type="button" onClick={openAdd} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent pl-3 pr-4 text-sm font-semibold text-white">
            <Icon d="plus" className="h-5 w-5" /> Booking
          </button>
        </header>

        <main className="min-w-0 overflow-x-clip pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-12">{children}</main>

        {/* mobile bottom tab bar */}
        <nav
          aria-label="Admin"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-sand/60 bg-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        >
          {tabs.map((n) => {
            const on = active(n.href);
            const b = badge("badge" in n ? n.badge : undefined);
            return (
              <Link
                key={n.href}
                href={base + n.href}
                aria-current={on ? "page" : undefined}
                className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${on ? "text-accent" : "text-ink-soft"}`}
              >
                <span className="relative">
                  <Icon d={n.icon} className="h-6 w-6" />
                  {b ? (
                    <span className="absolute -right-2.5 -top-1.5 min-w-[1.15rem] rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-[1.15rem] text-white">{b}</span>
                  ) : null}
                </span>
                {n.short}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMore(true)}
            aria-haspopup="dialog"
            className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
              active("/guide") ? "text-accent" : "text-ink-soft"
            }`}
          >
            <Icon d="more" className="h-6 w-6" />
            More
          </button>
        </nav>
      </div>

      {more ? <MoreSheet base={base} user={user} onClose={() => setMore(false)} /> : null}
      {adding ? <AddBookingDialog eventTypes={eventTypes} onClose={() => setAdding(false)} onDone={(m) => showToast(m)} /> : null}
      {asking ? (
        <AskSheet
          a={asking}
          onAnswer={(v) => {
            asking.resolve(v);
            setAsking(null);
          }}
        />
      ) : null}

      {toast ? (
        <div
          role="status"
          className="view-in fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[130] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-sm text-page shadow-2xl lg:bottom-8"
        >
          <span className="py-1">{toast.msg}</span>
          {toast.action ? (
            <button
              type="button"
              onClick={() => {
                toast.action!.run();
                setToast(null);
              }}
              className="min-h-9 rounded-full bg-page/15 px-4 text-xs font-bold uppercase tracking-[0.12em]"
            >
              {toast.action.label}
            </button>
          ) : (
            <span className="pr-3" />
          )}
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

/* ── sheets ───────────────────────────────────────────────────────── */

function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useModal(true, ref, onClose);
  return (
    <div className="fixed inset-0 z-[125] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="view-in w-full max-w-md rounded-t-3xl border border-sand/50 bg-page p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl md:p-6"
      >
        {children}
      </div>
    </div>
  );
}

function MoreSheet({ base, user, onClose }: { base: string; user: string; onClose: () => void }) {
  const row = "flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-base hover:bg-sand/25";
  return (
    <Sheet label="More" onClose={onClose}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">More</p>
        <button type="button" data-autofocus onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full border border-sand/60 text-xl text-ink-soft">
          ×
        </button>
      </div>
      <Link href={`${base}/guide`} onClick={onClose} className={row}>
        <Icon d="book" /> Guide — how everything works
      </Link>
      <Link href="/studio/structure/bookings" onClick={onClose} className={row}>
        <Icon d="ext" /> Texts & emails (Studio)
      </Link>
      <Link href="/" onClick={onClose} className={row}>
        <Icon d="ext" /> View website
      </Link>
      <button type="button" onClick={flipTheme} className={`adm-theme ${row}`}>
        <Icon d="sun" className="adm-sun h-5 w-5" />
        <Icon d="moon" className="adm-moon h-5 w-5" /> Light / dark
      </button>
      <form action={signOutAdmin}>
        <button type="submit" className={`${row} text-danger`}>
          <Icon d="out" /> Sign out <span className="ml-auto truncate text-xs text-ink-soft">{user}</span>
        </button>
      </form>
    </Sheet>
  );
}

function AskSheet({ a, onAnswer }: { a: Ask; onAnswer: (v: boolean) => void }) {
  return (
    <Sheet label={a.title} onClose={() => onAnswer(false)}>
      <h2 className="font-display text-2xl font-bold">{a.title}</h2>
      {a.body ? <p className="mt-2 text-sm text-ink-soft">{a.body}</p> : null}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" data-autofocus onClick={() => onAnswer(false)} className="inline-flex min-h-11 items-center rounded-full border border-sand/70 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft hover:text-ink">
          Keep it
        </button>
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className={`inline-flex min-h-11 items-center rounded-full px-5 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:opacity-90 ${a.danger ? "bg-danger" : "bg-accent"}`}
        >
          {a.confirm}
        </button>
      </div>
    </Sheet>
  );
}

/* ── page header used by every admin page ─────────────────────────── */

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="relative mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

/* ── new booking (phone / WhatsApp clients) ───────────────────────── */

const inputCls =
  "w-full min-h-11 rounded-xl border border-sand/70 bg-transparent px-3 py-2 text-sm normal-case tracking-normal text-ink placeholder:text-ink-soft/50 focus:border-accent focus:outline-none";
const labelCls = "grid gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ink-soft";

function AddBookingDialog({ eventTypes, onClose, onDone }: { eventTypes: string[]; onClose: () => void; onDone: (msg: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState(eventTypes[0] ?? "__other");
  const [clash, setClash] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useModal(true, ref, onClose);

  async function save(force: boolean) {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    const fd = new FormData(form);
    if (type === "__other") fd.set("eventType", String(fd.get("eventOther") ?? ""));
    if (force) fd.set("force", "1");
    setSaving(true);
    setError(null);
    try {
      const r = await createBooking(fd);
      if (!r.ok) {
        setError(r.error);
        setClash(r.clash ?? null);
        return;
      }
      onDone(`Booking added · ${String(fd.get("client") ?? "")}`);
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="New booking"
        onClick={(e) => e.stopPropagation()}
        className="view-in max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-sand/50 bg-page p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl md:p-8"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">New booking</h2>
          <button type="button" data-autofocus onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full border border-sand/60 text-xl text-ink-soft hover:text-ink">
            ×
          </button>
        </div>
        <p className="mb-5 text-sm text-ink-soft">For clients who booked by phone or WhatsApp — confirmed straight away. No email is sent.</p>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            void save(false);
          }}
          onChange={() => {
            setClash(null);
            setError(null);
          }}
          className="grid gap-4"
        >
          <label className={labelCls}>
            Client
            <input name="client" required className={inputCls} placeholder="e.g. Priya & Arjun" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelCls}>
              First day
              <input type="date" name="startDate" required className={inputCls} />
            </label>
            <label className={labelCls}>
              Last day <span className="normal-case tracking-normal">(empty = one day)</span>
              <input type="date" name="endDate" className={inputCls} />
            </label>
            <label className={labelCls}>
              From
              <input type="time" name="from" step={1800} className={inputCls} />
            </label>
            <label className={labelCls}>
              Until
              <input type="time" name="until" step={1800} className={inputCls} />
            </label>
          </div>
          <p className="-mt-2 text-xs text-ink-soft">Empty times = whole day(s). An “until” earlier than “from” means the next morning.</p>
          <label className={labelCls}>
            Event type
            <select value={type} onChange={(e) => setType(e.target.value)} name="eventType" className={`${inputCls} bg-page`}>
              {eventTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
              <option value="__other">Other…</option>
            </select>
          </label>
          {type === "__other" ? (
            <label className={labelCls}>
              What kind of event?
              <input name="eventOther" required className={inputCls} placeholder="e.g. Baby shower" />
            </label>
          ) : null}
          <label className={labelCls}>
            Venue
            <input name="venue" className={inputCls} placeholder="Address or district" />
          </label>
          <label className={labelCls}>
            Client email <span className="normal-case tracking-normal">(optional — for emails later)</span>
            <input name="email" type="email" className={inputCls} />
          </label>
          <label className={labelCls}>
            First note — only you see it
            <textarea name="notes" rows={3} className={`${inputCls} min-h-24`} placeholder="Package, deposit, contact person…" />
          </label>
          {error ? (
            <div role="alert" className="rounded-2xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm">
              <b>{error}</b>
              {clash?.length ? (
                <ul className="mt-1 list-disc pl-5 text-ink-soft">
                  {clash.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <div className="mt-1 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center rounded-full border border-sand/60 px-5 text-xs uppercase tracking-[0.16em] text-ink-soft hover:text-ink">
              Cancel
            </button>
            {clash?.length ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void save(true)}
                className="inline-flex min-h-11 items-center rounded-full bg-danger px-5 text-xs uppercase tracking-[0.16em] text-white hover:opacity-90 disabled:opacity-60"
              >
                Book anyway
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-xs uppercase tracking-[0.18em] text-page transition hover:bg-accent hover:text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Add booking"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
