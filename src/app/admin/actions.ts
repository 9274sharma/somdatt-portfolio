"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { writeClient } from "@/sanity/writeClient";
import { getSettings } from "@/sanity/queries";
import { type Lang, type RawBookingSettings, resolveEmails, resolveForm } from "@/lib/booking-config";
import { DAY_END, DAY_START, absolute, dateRange, fmtDate, span, toInstant } from "@/lib/booking-time";
import { type Activity, type BookingDoc, type Note, activityItem, getAllBookings, getBooking, getBookingSettings, isConfirmed, newBookingId, newKey, notesOf, sessionsOf } from "@/lib/bookings";
import { sessionBlocks, sessionRange, whenLabel, wishBlocks } from "@/lib/booking-format";
import { type CalEvent, bookingConfirmed, bookingDeclined, customEmail, googleCalendarUrl, icsFile } from "@/lib/emails";
import { SITE_URL, sendMail } from "@/lib/mailer";
import { calendarConfigured, createEvent, deleteEvent, updateEventDescription } from "@/lib/gcal";
import { driveMinutes } from "@/lib/travel";
import { signedId } from "@/lib/reviewToken";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

/* ---------- bookings ---------- */

type SessionIn = { date: string; from: number; until: number };
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const refresh = () => {
  revalidatePath("/admin", "layout");
  revalidatePath("/contact");
};
/** Add lines to a booking's history. */
const log = (id: string, ...items: Activity[]) => writeClient.patch(id).setIfMissing({ activity: [] }).append("activity", items).commit();
const noteItem = (text: string): Note => ({ _key: newKey(), at: new Date().toISOString(), text: text.slice(0, 4000) });
/** His Google Calendar event text: notes + client details (never sent to the client). */
function eventDescription(b: BookingDoc, extraNote?: string) {
  const all = notesText(b, extraNote);
  return [
    all && `Notes: ${all}`,
    `Client: ${b.client}${b.email ? ` · ${b.email}` : ""}${b.phone ? ` · ${b.phone}` : ""}`,
    b.services?.length ? `Services: ${b.services.join(", ")}` : "",
    ...(b.answers ?? []).map((a) => `${a.label}: ${a.value}`),
    b.message ? `\nMessage:\n${b.message}` : "",
    `\n${SITE_URL}/admin/bookings/${encodeURIComponent(b._id)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
/** Keep his calendar events in step after notes change — after the response, so the note shows at once.
 *  A failure is written into the booking's history (it's retried with the next note change). */
function syncCalendarNotes(id: string) {
  if (!calendarConfigured()) return;
  after(async () => {
    const b = await getBooking(id);
    if (!b?.googleEventIds?.length) return;
    const desc = eventDescription(b);
    const ok = await Promise.all(b.googleEventIds.map((e) => updateEventDescription(e, desc)));
    if (ok.some((x) => !x)) await log(id, activityItem("calendar", "Couldn't update the notes in Google Calendar — they'll sync with the next note change"));
  });
}
/** Notes for his own Google Calendar event (never the client's). */
const notesText = (b: BookingDoc, extra?: string) => [...notesOf(b).map((n) => n.text), ...(extra ? [extra] : [])].join("\n— ");

/** Valid blocks: inside their own 06:00→06:00 day, start before end, no two overlapping. */
function cleanSessions(input: unknown): SessionIn[] | null {
  if (!Array.isArray(input) || !input.length || input.length > 14) return null;
  const out: SessionIn[] = [];
  for (const x of input as SessionIn[]) {
    if (!x || !DATE.test(String(x.date)) || !Number.isInteger(x.from) || !Number.isInteger(x.until)) return null;
    if (x.from < DAY_START || x.until > DAY_END || x.until <= x.from) return null;
    out.push({ date: x.date, from: x.from, until: x.until });
  }
  out.sort((a, b) => absolute(a).start - absolute(b).start);
  for (let i = 1; i < out.length; i++) if (absolute(out[i - 1]).end > absolute(out[i]).start) return null;
  return out;
}

/** Other confirmed bookings that overlap these blocks. */
async function clashes(sessions: SessionIn[], exceptId: string) {
  const all = await getAllBookings();
  const others = all
    .filter((b) => isConfirmed(b) && b._id !== exceptId)
    .flatMap((b) => sessionsOf(b).map((s) => ({ ...s, label: `${b.eventType ?? "Booking"} — ${b.client}` })));
  const hit = (a: { start: number; end: number }, b: { start: number; end: number }) => a.start < b.end && b.start < a.end;
  return others.filter((o) => sessions.some((s) => hit(absolute(s), absolute(o))));
}

/** Words in the client's language for what is stored in English. */
function labels(raw: RawBookingSettings, b: BookingDoc, lang: Lang) {
  const en = resolveForm(raw, "en");
  const loc = resolveForm(raw, lang);
  const t = b.eventType ?? "";
  const i = en.eventTypes.findIndex((x) => x.value === t);
  const type = t.startsWith("Other: ") ? t.slice(7) : i >= 0 ? (loc.eventTypes[i]?.label ?? t) : t;
  const services = (b.services ?? []).map((v) => {
    const k = en.services.findIndex((x) => x.value === v);
    return k >= 0 ? (loc.services[k]?.label ?? v) : v;
  });
  return { type, services };
}

async function emailBase(b: BookingDoc) {
  const s = await getSettings().catch(() => null);
  const lang: Lang = b.lang === "de" ? "de" : "en";
  return { lang, replyTo: s?.contactEmail || process.env.CONTACT_TO_EMAIL || "hello@somdattsharma.com", phone: s?.phone, site: SITE_URL };
}

const calEvents = (b: BookingDoc, sessions: SessionIn[], title: string): CalEvent[] =>
  sessions.map((s) => ({ uid: `${b._id}-${s.date}`, title, date: s.date, from: s.from, until: s.until, location: b.venue }));

/** Accept a request with the final schedule: block it, (optionally) add it to Google Calendar, email the client. */
export async function acceptRequest(input: { id: string; sessions: SessionIn[]; notes: string; addToCalendar: boolean; emailClient: boolean; templateKey?: string }) {
  await requireAuth();
  const sessions = cleanSessions(input?.sessions);
  if (!sessions) return { ok: false as const, error: "Those times aren't valid." };
  const b = await getBooking(String(input.id));
  if (!b) return { ok: false as const, error: "Booking not found." };
  const clash = await clashes(sessions, b._id);
  if (clash.length) return { ok: false as const, error: `Overlaps ${clash.map((c) => `${c.label} (${c.date})`).join(", ")}.` };

  const note = String(input.notes ?? "").trim();
  let googleEventIds: string[] = [];
  if (input.addToCalendar && calendarConfigured()) {
    const desc = eventDescription(b, note);
    const ids = await Promise.all(
      sessions.map((s) =>
        createEvent({ summary: `${b.eventType ?? "Booking"} — ${b.client}`, location: b.venue, description: desc, start: toInstant(s.date, s.from), end: toInstant(s.date, s.until), bookingId: b._id }),
      ),
    );
    googleEventIds = ids.filter((x): x is string => !!x);
  }

  const range = sessionRange(sessions);
  await writeClient
    .patch(b._id)
    .set({
      status: "confirmed",
      sessions: sessions.map((s, i) => ({ _key: `s${i}${s.date.replace(/-/g, "")}`, ...s })),
      startDate: range.start,
      endDate: range.end,
      googleEventIds,
      calSequence: (b.calSequence ?? -1) + 1,
    })
    .unset(["declineReason"])
    .setIfMissing({ noteLog: [], activity: [] })
    .append("noteLog", note ? [noteItem(note)] : [])
    .append("activity", [
      activityItem("accepted", `Accepted — ${sessions.length} time block${sessions.length > 1 ? "s" : ""} booked`),
      ...(googleEventIds.length ? [activityItem("calendar", "Added to Google Calendar")] : []),
    ])
    .commit();
  refresh();

  let emailed = false;
  if (input.emailClient && b.email) {
    const raw = await getBookingSettings();
    const base = await emailBase(b);
    const { type, services } = labels(raw, b, base.lang);
    const events = calEvents(b, sessions, `${type} — Somdatt Sharma`);
    const ics = icsFile(events, { sequence: (b.calSequence ?? -1) + 1 });
    const mail = bookingConfirmed(
      {
        ...base,
        name: b.client,
        type,
        when: whenLabel(range.start, range.end, base.lang),
        blocks: sessionBlocks(sessions, base.lang),
        venue: b.venue,
        services,
        calendar: {
          ics: `${SITE_URL}/api/booking-ics/${signedId("ics", b._id)}`,
          google: events.map((e) => ({ label: fmtDate(e.date, base.lang), url: googleCalendarUrl(e) })),
        },
      },
      (() => {
        const list = resolveEmails(raw, base.lang).confirm;
        return list.find((x) => x.key === input.templateKey) ?? list[0];
      })(),
    );
    emailed = (
      await sendMail({
        to: b.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        replyTo: base.replyTo,
        attachments: [{ filename: "booking.ics", content: ics, contentType: "text/calendar; charset=utf-8; method=PUBLISH" }],
      })
    ).ok;
  }
  if (input.emailClient && b.email) {
    const tplName = resolveEmails(await getBookingSettings(), b.lang === "de" ? "de" : "en").confirm.find((x) => x.key === input.templateKey)?.name ?? "Confirmation";
    await log(b._id, activityItem("email", emailed ? `Email sent: “${tplName}”` : `Email failed: “${tplName}”`));
  }
  return { ok: true as const, emailed, calendar: googleEventIds.length > 0 };
}

/** Decline a request, optionally with one of the decline templates ("none" = no email). */
export async function declineRequest(input: { id: string; templateKey: string }) {
  await requireAuth();
  const b = await getBooking(String(input?.id));
  if (!b) return { ok: false as const, error: "Booking not found." };
  const raw = await getBookingSettings();
  const base = await emailBase(b);
  const tpl = input?.templateKey === "none" ? null : resolveEmails(raw, base.lang).decline.find((x) => x.key === input?.templateKey);
  await writeClient
    .patch(b._id)
    .set({ status: "declined", declineReason: tpl?.name ?? "no email" })
    .setIfMissing({ activity: [] })
    .append("activity", [activityItem("declined", tpl ? `Declined — “${tpl.name}”` : "Declined — no email")])
    .commit();
  refresh();
  let emailed = false;
  if (tpl && b.email) {
    const { type, services } = labels(raw, b, base.lang);
    const wish = { start: b.startDate, end: b.endDate || b.startDate, startTime: b.wishStartTime ?? null, endTime: b.wishEndTime ?? null };
    const mail = bookingDeclined(
      { ...base, name: b.client, type, when: whenLabel(wish.start, wish.end, base.lang), blocks: wishBlocks(wish, base.lang), venue: b.venue, services },
      tpl,
    );
    emailed = (await sendMail({ to: b.email, subject: mail.subject, html: mail.html, text: mail.text, replyTo: base.replyTo })).ok;
    await log(b._id, activityItem("email", emailed ? `Email sent: “${tpl.name}”` : `Email failed: “${tpl.name}”`));
  }
  return { ok: true as const, emailed };
}

/** Add a private note to a booking's timeline. */
export async function addNote(id: string, text: string) {
  await requireAuth();
  const t = String(text ?? "").trim();
  if (!id || !t) return null;
  const n = noteItem(t);
  await writeClient.patch(id).setIfMissing({ noteLog: [] }).append("noteLog", [n]).commit();
  syncCalendarNotes(id);
  revalidatePath("/admin", "layout");
  return n;
}

export async function deleteNote(id: string, key: string) {
  await requireAuth();
  if (!id || !key) return;
  if (key === "legacy") await writeClient.patch(id).unset(["notes"]).commit();
  else await writeClient.patch(id).unset([`noteLog[_key=="${key.replace(/[^a-zA-Z0-9]/g, "")}"]`]).commit();
  syncCalendarNotes(id);
  revalidatePath("/admin", "layout");
}

/** Undo of a deleted note: put the very same note back (same key and time). */
export async function restoreNote(id: string, note: Note) {
  await requireAuth();
  if (!id || !note?._key || !note.text) return;
  const n: Note = { _key: String(note._key).replace(/[^a-zA-Z0-9]/g, "") || newKey(), at: String(note.at || new Date().toISOString()), text: String(note.text).slice(0, 4000) };
  if (n._key === "legacy") await writeClient.patch(id).set({ notes: n.text }).commit();
  else await writeClient.patch(id).setIfMissing({ noteLog: [] }).append("noteLog", [n]).commit();
  syncCalendarNotes(id);
  revalidatePath("/admin", "layout");
}

/** One of the Studio templates, sent by hand to a booking's client. */
export async function sendTemplateEmail(input: { id: string; templateKey: string }) {
  await requireAuth();
  const b = await getBooking(String(input?.id));
  if (!b?.email) return { ok: false as const, error: "This booking has no email address." };
  const raw = await getBookingSettings();
  const base = await emailBase(b);
  const tpl = resolveEmails(raw, base.lang).other.find((t) => t.key === input.templateKey);
  if (!tpl) return { ok: false as const, error: "Template not found." };
  const { type, services } = labels(raw, b, base.lang);
  const sessions = b.status === "request" ? [] : sessionsOf(b);
  const mail = customEmail(
    {
      ...base,
      name: b.client,
      type,
      when: whenLabel(b.startDate, b.endDate || b.startDate, base.lang),
      blocks: sessions.length && b.sessions?.length ? sessionBlocks(sessions, base.lang) : [],
      venue: b.venue,
      services,
    },
    tpl,
  );
  const r = await sendMail({ to: b.email, subject: mail.subject, html: mail.html, text: mail.text, replyTo: base.replyTo });
  await log(b._id, activityItem("email", r.ok ? `Email sent: “${tpl.name}”` : `Email failed: “${tpl.name}”`));
  revalidatePath("/admin", "layout");
  return r.ok ? { ok: true as const } : { ok: false as const, error: "Sending failed — check the email settings." };
}

/** Driving minutes between venue pairs (OpenRouteService). Missing key or failure → null = unknown. */
export async function travelTimes(pairs: [string, string][]) {
  await requireAuth();
  const out: Record<string, { car?: number } | null> = {};
  await Promise.all(
    (Array.isArray(pairs) ? pairs.slice(0, 20) : []).map(async ([a, b]) => {
      const m = await driveMinutes(String(a), String(b));
      out[`${a}→${b}`] = m === null ? null : { car: m };
    }),
  );
  return out;
}

/** A booking you add yourself (phone/WhatsApp clients): confirmed right away.
 *  Refuses an overlap with another confirmed booking unless "Book anyway" (force) was pressed. */
export async function createBooking(formData: FormData): Promise<{ ok: true } | { ok: false; error: string; clash?: string[] }> {
  await requireAuth();
  const client = String(formData.get("client") ?? "").trim().slice(0, 120);
  const startDate = String(formData.get("startDate") ?? "");
  let endDate = String(formData.get("endDate") ?? "") || startDate;
  const eventType = String(formData.get("eventType") ?? "").trim().slice(0, 120);
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 4000);
  const venue = String(formData.get("venue") ?? "").trim().slice(0, 240);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const toMin = (v: FormDataEntryValue | null, next = false) => {
    const m = /^(\d{2}):(\d{2})$/.exec(String(v ?? ""));
    if (!m) return null;
    const x = +m[1] * 60 + +m[2];
    return next && x <= DAY_START ? x + 1440 : x;
  };
  if (!client || !DATE.test(startDate)) return { ok: false, error: "Add a name and a first day." };
  if (endDate < startDate) endDate = startDate;
  const from = toMin(formData.get("from"));
  const untilRaw = toMin(formData.get("until"));
  const until = from !== null && untilRaw !== null && untilRaw <= from ? untilRaw + 1440 : untilRaw;
  if ((from === null) !== (untilRaw === null)) return { ok: false, error: "Fill in both times — or leave both empty for whole days." };
  if (from !== null && until !== null && (from < DAY_START || until > DAY_END || until <= from))
    return { ok: false, error: "Those times don't work: start at 06:00 or later, and end by 06:00 the next morning." };
  const sessions =
    from !== null && until !== null ? dateRange(startDate, endDate).map((date, i) => ({ _key: `s${i}`, date, from, until })) : [];
  const blocks = sessions.length ? sessions : dateRange(startDate, endDate).map((date) => ({ date, from: DAY_START, until: DAY_END }));
  if (formData.get("force") !== "1") {
    const clash = await clashes(blocks, "");
    if (clash.length)
      return {
        ok: false,
        error: "This overlaps another booking.",
        clash: [...new Set(clash.map((c) => `${c.label} · ${fmtDate(c.date)} ${c.from === DAY_START && c.until === DAY_END ? "(whole day)" : span(c.from, c.until)}`))],
      };
  }

  await writeClient.create({
    _id: newBookingId(),
    _type: "booking",
    status: "confirmed",
    client,
    startDate,
    endDate,
    ...(sessions.length ? { sessions } : {}),
    ...(eventType ? { eventType } : {}),
    ...(venue ? { venue } : {}),
    ...(email ? { email } : {}),
    ...(notes ? { noteLog: [noteItem(notes)] } : {}),
    activity: [activityItem("created", "Added by hand in /admin")],
  });
  refresh();
  return { ok: true };
}

export async function deleteBooking(id: string) {
  await requireAuth();
  if (!id) return;
  const b = await getBooking(id);
  await Promise.all((b?.googleEventIds ?? []).map(deleteEvent));
  await writeClient.delete(id);
  refresh();
}

/** Cancel removes it from Google Calendar too; restore puts it back. */
export async function setBookingStatus(id: string, status: "confirmed" | "cancelled") {
  await requireAuth();
  if (!id) return;
  const b = await getBooking(id);
  if (!b) return;
  let googleEventIds = b.googleEventIds ?? [];
  if (status === "cancelled") {
    await Promise.all(googleEventIds.map(deleteEvent));
    googleEventIds = [];
  } else if (calendarConfigured() && b.sessions?.length && !googleEventIds.length) {
    const ids = await Promise.all(
      b.sessions.map((s) =>
        createEvent({ summary: `${b.eventType ?? "Booking"} — ${b.client}`, location: b.venue, description: eventDescription(b), start: toInstant(s.date, s.from), end: toInstant(s.date, s.until), bookingId: b._id }),
      ),
    );
    googleEventIds = ids.filter((x): x is string => !!x);
  }
  await writeClient
    .patch(id)
    .set({ status, googleEventIds })
    .setIfMissing({ activity: [] })
    .append("activity", [
      activityItem(status === "cancelled" ? "cancelled" : "restored", status === "cancelled" ? "Cancelled — time is free again" : "Restored — time blocked again"),
      ...(b.googleEventIds?.length && status === "cancelled" ? [activityItem("calendar", "Removed from Google Calendar")] : []),
      ...(status === "confirmed" && googleEventIds.length ? [activityItem("calendar", "Added to Google Calendar")] : []),
    ])
    .commit();
  refresh();
}

export async function signInPassword(formData: FormData) {
  try {
    await signIn("credentials", {
      password: String(formData.get("password") ?? ""),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/admin?error=invalid");
    throw error; // re-throw the success redirect
  }
}

export async function signOutAdmin() {
  await signOut({ redirectTo: "/admin" });
}

// ---------- reviews ----------
const REVIEW_STATUS = new Set(["pending", "published", "hidden"]);

export async function setReviewStatus(id: string, status: "pending" | "published" | "hidden", reason?: string) {
  await requireAuth();
  if (!id || !REVIEW_STATUS.has(status)) throw new Error("Invalid");
  const patch = writeClient.patch(id).set({ status });
  if (status === "hidden" && reason) patch.set({ rejectReason: reason.slice(0, 80), rejectedAt: new Date().toISOString() });
  else patch.unset(["rejectReason", "rejectedAt"]);
  await patch.commit();
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/admin");
}

export async function deleteReview(id: string) {
  await requireAuth();
  if (!id) throw new Error("Invalid");
  await writeClient.delete(id);
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/admin");
}
