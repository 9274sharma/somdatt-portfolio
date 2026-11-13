"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, useMemo, useState, useTransition } from "react";
import { addNote, deleteBooking, deleteNote, restoreNote, sendTemplateEmail, setBookingStatus } from "@/app/admin/actions";
import type { AdminItem } from "@/lib/admin-data";
import type { Note } from "@/lib/bookings";
import { clock, dateRange, fmtDate, span } from "@/lib/booking-time";
import { Icon, useAdminUI } from "./AdminShell";
import { RequestsPanel } from "./RequestsPanel";
import { StatusPill, card, daysUntil, mapsUrl, relDay, rise, waUrl } from "./admin-ui";

type PanelProps = Omit<ComponentProps<typeof RequestsPanel>, "layout">;

const KIND_ICON: Record<string, string> = {
  received: "inbox",
  created: "plus",
  accepted: "M5 12l5 5L20 7",
  declined: "M6 6l12 12M18 6 6 18",
  cancelled: "M6 6l12 12M18 6 6 18",
  restored: "M4 12a8 8 0 1 0 3-6.2M4 4v4h4",
  email: "M4 6h16v12H4zM4 7l8 6 8-6",
  calendar: "calendar",
  note: "M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4",
};
const when = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/Berlin", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

/** One booking: who, when, where — actions — and a timeline of notes + what happened. */
export function BookingDetail({
  b,
  today,
  templates,
  request,
}: {
  b: AdminItem;
  today: string;
  templates: { key: string; name: string }[];
  /** set for requests: everything the accept / decline dialogs need */
  request?: PanelProps;
}) {
  const router = useRouter();
  const { toast, ask } = useAdminUI();
  const [busy, start] = useTransition();
  const [notes, setNotes] = useState<Note[]>(b.notes);
  const [draft, setDraft] = useState("");
  const [tpl, setTpl] = useState(templates[0]?.key ?? "");

  const timeline = useMemo(
    () =>
      [
        ...notes.map((n, i) => ({ key: `n-${n._key}`, at: n.at, i, kind: "note", text: n.text, note: n })),
        ...b.activity.map((a, i) => ({ key: `a-${a._key}`, at: a.at, i, kind: a.kind as string, text: a.text, note: undefined as Note | undefined })),
      ].sort((x, y) => y.at.localeCompare(x.at) || y.i - x.i),
    [notes, b.activity],
  );

  const first = b.status === "request" ? b.wish.start : (b.sessions[0]?.date ?? b.start);
  const n = daysUntil(first, today);
  const save = () => {
    const t = draft.trim();
    if (!t) return;
    start(async () => {
      const added = await addNote(b.id, t);
      if (added) {
        setNotes((xs) => [...xs, added]);
        setDraft("");
        toast("Note added");
      }
    });
  };
  const removeNote = (n: Note) => {
    setNotes((xs) => xs.filter((x) => x._key !== n._key));
    void deleteNote(b.id, n._key);
    toast("Note deleted", {
      label: "Undo",
      run: () =>
        start(async () => {
          // put the same note back — same key and time, so it returns to its place
          setNotes((xs) => [...xs, n]);
          await restoreNote(b.id, n);
        }),
    });
  };
  const btn = "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.12em] transition disabled:opacity-50";
  const ghost = `${btn} border border-sand/70 text-ink-soft hover:text-ink`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-5 md:px-8 md:pt-8">
      <button type="button" onClick={() => (history.length > 1 ? router.back() : router.push("/admin/calendar"))} className="mb-3 inline-flex min-h-11 items-center gap-1.5 pr-3 text-sm text-ink-soft hover:text-ink">
        <Icon d="M15 6l-6 6 6 6" className="h-4 w-4" /> Back
      </button>

      <header className="adm-rise relative" style={rise(0)}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={b.status} />
          <span className="text-sm text-ink-soft">{b.type}</span>
          {b.status !== "declined" && b.status !== "cancelled" ? <span className="text-sm text-ink-soft">· {relDay(n)}</span> : null}
        </div>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-[0.95] tracking-tight md:text-5xl">{b.client}</h1>
        {b.status === "request" && b.receivedAt ? <p className="mt-2 text-sm text-ink-soft">Request received {when(b.receivedAt)}</p> : null}
        {/* contact */}
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {b.phone ? (
            <>
              <a href={`tel:${b.phone.replace(/\s/g, "")}`} className={ghost}>
                <Icon d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" className="h-4 w-4" /> Call
              </a>
              <a href={waUrl(b.phone)} target="_blank" rel="noopener noreferrer" className={ghost}>
                <Icon d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z" className="h-4 w-4" /> WhatsApp
              </a>
            </>
          ) : null}
          {b.email ? (
            <a href={`mailto:${b.email}`} className={ghost}>
              <Icon d="M4 6h16v12H4zM4 7l8 6 8-6" className="h-4 w-4" /> Email
            </a>
          ) : null}
          {b.venue ? (
            <a href={mapsUrl(b.venue)} target="_blank" rel="noopener noreferrer" className={ghost}>
              <Icon d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11ZM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4" className="h-4 w-4" /> Route
            </a>
          ) : null}
        </div>
      </header>

      {/* phone: When → Notes & history → Details → Actions; desktop: two columns */}
      <div className="mt-6 flex flex-col gap-5 lg:grid lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <div className="contents lg:grid lg:content-start lg:gap-5">
          {/* when */}
          <section className={`adm-rise order-1 lg:order-none ${card} p-5 md:p-6`} style={rise(1)}>
            <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft">{b.status === "request" ? "What they asked for" : "When"}</h2>
            {b.status === "request" ? (
              <ul className="mt-3 grid gap-2">
                {dateRange(b.wish.start, b.wish.end).map((d, i, arr) => (
                  <li key={d} className="flex items-baseline justify-between gap-3 border-t border-sand/50 pt-2 first:border-0 first:pt-0">
                    <span className="font-semibold">{fmtDate(d)}</span>
                    <span className="text-sm text-ink-soft">
                      {i === 0 && b.wish.startTime !== null ? `from ${clock(b.wish.startTime)}` : ""}
                      {i === arr.length - 1 && b.wish.endTime !== null ? `${i === 0 && b.wish.startTime !== null ? " " : ""}until ${clock(b.wish.endTime)}` : ""}
                      {(i === 0 && b.wish.startTime !== null) || (i === arr.length - 1 && b.wish.endTime !== null) ? "" : "time not set"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-3 grid gap-2">
                {b.sessions.map((s) => (
                  <li key={s.date + s.from} className="flex items-baseline justify-between gap-3 border-t border-sand/50 pt-2 first:border-0 first:pt-0">
                    <span className="font-semibold">{fmtDate(s.date)}</span>
                    <span className="text-sm tabular-nums text-ink-soft">{b.timed ? span(s.from, s.until) : "whole day"}</span>
                  </li>
                ))}
              </ul>
            )}
            {b.venue ? (
              <a href={mapsUrl(b.venue)} target="_blank" rel="noopener noreferrer" className="mt-2 flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">
                <Icon d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11ZM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4" className="h-4 w-4 shrink-0 text-accent" />
                {b.venue}
              </a>
            ) : (
              <p className="mt-4 text-sm text-[#c98a0a]">Venue missing — ask the client.</p>
            )}
            {b.inCalendar ? <p className="mt-2 text-xs text-ink-soft">✓ In your Google Calendar</p> : null}
          </section>

          {/* details */}
          {b.services.length || b.answers.length || b.message || b.email ? (
            <section className={`adm-rise order-3 lg:order-none ${card} p-5 md:p-6`} style={rise(2)}>
              <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft">Details</h2>
              <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {b.services.length ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-soft">Services</dt>
                    <dd className="mt-0.5 font-semibold">{b.services.join(" · ")}</dd>
                  </div>
                ) : null}
                {b.answers.map((a) => (
                  <div key={a.label}>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-soft">{a.label}</dt>
                    <dd className="mt-0.5 font-semibold">{a.value}</dd>
                  </div>
                ))}
                {b.email ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-soft">Email</dt>
                    <dd className="mt-0.5 break-all font-semibold">{b.email}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-soft">Language</dt>
                  <dd className="mt-0.5 font-semibold">{b.lang === "de" ? "Deutsch" : "English"}</dd>
                </div>
              </dl>
              {b.message ? <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-sand/20 px-4 py-3 text-sm leading-relaxed">“{b.message}”</p> : null}
            </section>
          ) : null}

          {/* actions */}
          <section className={`adm-rise order-4 lg:order-none ${card} p-5 md:p-6`} style={rise(3)}>
            <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft">Actions</h2>
            <div className="mt-3 grid gap-3">
              {b.status === "request" && request ? <RequestsPanel {...request} layout="actions" /> : null}
              {b.status === "confirmed" && b.email && templates.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Email template"
                    value={tpl}
                    onChange={(e) => setTpl(e.target.value)}
                    className="min-h-11 rounded-full border border-sand/70 bg-page px-4 text-sm text-ink focus:border-accent focus:outline-none"
                  >
                    {templates.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy || !tpl}
                    onClick={async () => {
                      const t = templates.find((x) => x.key === tpl);
                      if (!t || !(await ask({ title: `Send “${t.name}”?`, body: `To ${b.email}, in ${b.lang === "de" ? "German" : "English"}.`, confirm: "Send" }))) return;
                      start(async () => {
                        const r = await sendTemplateEmail({ id: b.id, templateKey: t.key });
                        toast(r.ok ? `“${t.name}” sent` : r.error);
                        router.refresh();
                      });
                    }}
                    className={`${btn} bg-ink text-page hover:bg-accent hover:text-white`}
                  >
                    Send email
                  </button>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {b.status === "confirmed" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        !(await ask({
                          title: `Cancel ${b.client}?`,
                          body: `The time becomes free again on the website${b.inCalendar ? " and the event is removed from your Google Calendar" : ""}. You can restore it later.`,
                          confirm: "Cancel booking",
                          danger: true,
                        }))
                      )
                        return;
                      start(async () => {
                        await setBookingStatus(b.id, "cancelled");
                        toast("Booking cancelled");
                        router.refresh();
                      });
                    }}
                    className={ghost}
                  >
                    Cancel booking
                  </button>
                ) : null}
                {b.status === "cancelled" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      start(async () => {
                        await setBookingStatus(b.id, "confirmed");
                        toast("Booking restored");
                        router.refresh();
                      })
                    }
                    className={ghost}
                  >
                    Restore
                  </button>
                ) : null}
              </div>
              <div className="mt-2 border-t border-sand/50 pt-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (!(await ask({ title: `Delete ${b.client} for good?`, body: "The booking, its notes and history are removed. This can't be undone.", confirm: "Delete", danger: true }))) return;
                    start(async () => {
                      await deleteBooking(b.id);
                      toast("Deleted");
                      router.push("/admin/calendar");
                    });
                  }}
                  className="inline-flex min-h-11 items-center px-1 text-xs text-ink-soft underline underline-offset-4 hover:text-danger"
                >
                  Delete booking…
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* timeline */}
        <section className={`adm-rise order-2 lg:order-none ${card} p-5 md:p-6`} style={rise(4)}>
          <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft">Notes & history</h2>
          <div className="mt-3">
            <label htmlFor="note" className="sr-only">
              New note
            </label>
            <textarea
              id="note"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
              }}
              rows={3}
              placeholder="Add a note — only you see it (deposit paid, bring the drone, best man's number…)"
              className="w-full rounded-2xl border border-sand/70 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
              <button type="button" onClick={save} disabled={busy || !draft.trim()} className={`${btn} bg-accent text-white hover:opacity-90`}>
                Add note
              </button>
            </div>
          </div>
          <ol className="relative mt-4 grid gap-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-sand/70">
            {timeline.map((t) => (
              <li key={t.key} className="relative flex gap-3">
                <span
                  className={`relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full border ${
                    t.kind === "note" ? "border-[#c98a0a]/50 bg-[#c98a0a]/15 text-[#c98a0a]" : t.kind === "accepted" ? "border-[#2f9e6f]/50 bg-[#2f9e6f]/15 text-[#2f9e6f]" : "border-sand/70 bg-page text-ink-soft"
                  }`}
                >
                  <Icon d={KIND_ICON[t.kind] ?? "M12 8v4l3 2"} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className={`whitespace-pre-wrap text-sm ${t.kind === "note" ? "rounded-2xl bg-[#c98a0a]/10 px-3 py-2 text-ink" : "text-ink"}`}>{t.text}</p>
                  <p className="mt-1 flex items-center gap-3 text-[11px] text-ink-soft">
                    {when(t.at)}
                    {t.note ? (
                      <button type="button" className="-my-3 inline-flex min-h-11 items-center px-3 underline underline-offset-2 hover:text-danger" onClick={() => removeNote(t.note!)}>
                        Delete
                      </button>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
            {!timeline.length ? <li className="pl-11 text-sm text-ink-soft">Nothing yet.</li> : null}
          </ol>
          <p className="mt-4 text-[11px] text-ink-soft">
            Notes are copied into your Google Calendar event — never to the client.{" "}
            <Link href="/admin/guide#notes" className="inline-flex min-h-9 items-center underline underline-offset-2">
              How it works
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
