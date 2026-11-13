import "server-only";
import { cache } from "react";
import type { Session, Wish } from "./booking-time";
import { type EmailSet, type Lang, resolveEmails, resolveForm } from "./booking-config";
import { type Activity, type BookingDoc, type Note, getAllBookings, getBookingSettings, isConfirmed, notesOf, sessionsOf, todayHamburg } from "./bookings";
import { calendarConfigured } from "./gcal";
import { travelConfigured } from "./travel";
import { SITE_URL } from "./mailer";
import { getSettings } from "@/sanity/queries";
import { writeClient } from "@/sanity/writeClient";
import type { BookingRequest, Confirmed } from "@/components/admin/RequestsPanel";

export type AdminStatus = "request" | "confirmed" | "declined" | "cancelled";
/** One booking as the admin screens see it (everything already in English labels). */
export type AdminItem = {
  id: string;
  client: string;
  status: AdminStatus;
  type: string;
  start: string;
  end: string;
  /** exact blocks (confirmed) — or the rough wish for a request */
  sessions: Session[];
  timed: boolean;
  wish: Wish;
  venue: string;
  email: string;
  phone: string;
  lang: Lang;
  services: string[];
  answers: { label: string; value: string }[];
  message: string;
  receivedAt: string;
  notes: Note[];
  activity: Activity[];
  declineReason: string;
  inCalendar: boolean;
};

const ago = (iso?: string) => {
  if (!iso) return "";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
};

const statusOf = (b: BookingDoc): AdminStatus => (b.status === "request" || b.status === "declined" || b.status === "cancelled" ? b.status : "confirmed");

function toItem(b: BookingDoc): AdminItem {
  const wish: Wish = { start: b.startDate, end: b.endDate || b.startDate, startTime: b.wishStartTime ?? null, endTime: b.wishEndTime ?? null };
  const status = statusOf(b);
  const timed = Boolean(b.sessions?.length);
  return {
    id: b._id,
    client: b.client,
    status,
    type: b.eventType ?? "Booking",
    start: b.startDate,
    end: b.endDate || b.startDate,
    sessions:
      status === "request"
        ? wish.startTime !== null && wish.endTime !== null && wish.start === wish.end
          ? [{ date: wish.start, from: wish.startTime, until: Math.max(wish.endTime, wish.startTime + 30) }]
          : []
        : sessionsOf(b),
    timed: status === "request" ? wish.startTime !== null && wish.endTime !== null : timed,
    wish,
    venue: b.venue ?? "",
    email: b.email ?? "",
    phone: b.phone ?? "",
    lang: b.lang === "de" ? "de" : "en",
    services: b.services ?? [],
    answers: (b.answers ?? []).map((a) => ({ label: a.label, value: a.value })),
    message: b.message ?? "",
    receivedAt: b.receivedAt ?? b._createdAt ?? "",
    notes: notesOf(b),
    activity: [...(b.activity ?? [])].sort((a, c) => a.at.localeCompare(c.at)),
    declineReason: b.declineReason ?? "",
    inCalendar: Boolean(b.googleEventIds?.length),
  };
}

/** Everything the admin screens need — loaded once per request. */
export const loadAdmin = cache(async () => {
  const [docs, raw, site, reviewsPending] = await Promise.all([
    getAllBookings(),
    getBookingSettings(),
    getSettings().catch(() => null),
    writeClient.fetch<number>(`count(*[_type=="review" && status=="pending"])`, {}, { cache: "no-store" }).catch(() => 0),
  ]);
  const forms = { en: resolveForm(raw, "en"), de: resolveForm(raw, "de") };
  const typeIn = (v: string | undefined, lang: Lang) => {
    if (!v) return "";
    if (v.startsWith("Other: ")) return v.slice(7);
    const i = forms.en.eventTypes.findIndex((x) => x.value === v);
    return i >= 0 ? (forms[lang].eventTypes[i]?.label ?? v) : v;
  };
  const servicesIn = (list: string[] | undefined, lang: Lang) =>
    (list ?? []).map((v) => {
      const i = forms.en.services.findIndex((x) => x.value === v);
      return i >= 0 ? (forms[lang].services[i]?.label ?? v) : v;
    });

  const items = docs.map(toItem);
  const requests: BookingRequest[] = docs
    .filter((b) => b.status === "request")
    .map((b) => {
      const lang: Lang = b.lang === "de" ? "de" : "en";
      const notes = notesOf(b);
      return {
        id: b._id,
        name: b.client,
        email: b.email ?? "",
        type: b.eventType ?? "—",
        wish: { start: b.startDate, end: b.endDate || b.startDate, startTime: b.wishStartTime ?? null, endTime: b.wishEndTime ?? null },
        venue: b.venue ?? "",
        services: b.services ?? [],
        answers: [...(b.answers ?? []).map((a) => ({ label: a.label, value: a.value })), ...(lang === "de" ? [{ label: "Language", value: "Deutsch" }] : [])],
        message: b.message,
        received: ago(b.receivedAt ?? b._createdAt),
        receivedAt: b.receivedAt ?? b._createdAt ?? "",
        notes: notes.at(-1)?.text,
        noteCount: notes.length,
        lang,
        typeLabel: typeIn(b.eventType, lang),
        serviceLabels: servicesIn(b.services, lang),
      };
    });
  const confirmed: Confirmed[] = docs
    .filter(isConfirmed)
    .flatMap((b) => sessionsOf(b).map((s, i) => ({ id: `${b._id}:${i}`, ...s, label: `${b.eventType ?? "Booking"} — ${b.client}`, venue: b.venue ?? "" })));
  const emails: Record<Lang, EmailSet> = { en: resolveEmails(raw, "en"), de: resolveEmails(raw, "de") };

  return {
    items,
    requests,
    confirmed,
    emails,
    templates: emails.en.other.map((t) => ({ key: t.key, name: t.name })),
    eventTypes: forms.en.eventTypes.map((x) => x.value),
    contact: { replyTo: site?.contactEmail || process.env.CONTACT_TO_EMAIL || "", phone: site?.phone, site: SITE_URL },
    calendarConnected: calendarConfigured(),
    travelEnabled: travelConfigured(),
    today: todayHamburg(),
    reviewsPending,
  };
});
export type AdminData = Awaited<ReturnType<typeof loadAdmin>>;
