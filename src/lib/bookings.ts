import "server-only";
import { writeClient } from "@/sanity/writeClient";
import { type Busy, type Session, DAY_END, DAY_START, dateRange } from "./booking-time";
import type { RawBookingSettings } from "./booking-config";

/** Bookings hold personal data, so new ones get a private ID: `bookings.<uuid>`.
 *  The dataset is public, but documents whose ID contains a "." are only readable with a token. */
export const PRIVATE_PREFIX = "bookings.";
export const newBookingId = () => `${PRIVATE_PREFIX}${crypto.randomUUID()}`;

export type BookingStatus = "request" | "confirmed" | "declined" | "cancelled";
export type BookingDoc = {
  _id: string;
  _createdAt?: string;
  client: string;
  status?: BookingStatus;
  eventType?: string;
  startDate: string;
  endDate?: string;
  sessions?: { _key?: string; date: string; from: number; until: number }[];
  venue?: string;
  notes?: string;
  email?: string;
  phone?: string;
  lang?: "en" | "de";
  wishStartTime?: number | null;
  wishEndTime?: number | null;
  services?: string[];
  answers?: { label: string; value: string }[];
  message?: string;
  receivedAt?: string;
  declineReason?: string;
  googleEventIds?: string[];
  calSequence?: number;
  noteLog?: Note[];
  activity?: Activity[];
};
export type Note = { _key: string; at: string; text: string };
export type ActivityKind = "received" | "created" | "accepted" | "declined" | "cancelled" | "restored" | "email" | "calendar" | "edited";
export type Activity = { _key: string; at: string; kind: ActivityKind; text: string };
export const newKey = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);
/** One line for the booking's history. */
export const activityItem = (kind: ActivityKind, text: string): Activity => ({ _key: newKey(), at: new Date().toISOString(), kind, text });
/** All notes, oldest first (the old single note counts as the first one). */
export function notesOf(b: BookingDoc): Note[] {
  const log = [...(b.noteLog ?? [])].sort((a, c) => a.at.localeCompare(c.at));
  return b.notes?.trim() ? [{ _key: "legacy", at: b._createdAt ?? "", text: b.notes.trim() }, ...log] : log;
}

/** Token reads, published documents only (never drafts), never cached. */
const read = <T>(query: string, params: Record<string, unknown> = {}) =>
  writeClient.withConfig({ perspective: "published", useCdn: false }).fetch<T>(query, params, { cache: "no-store" });

const FIELDS = `_id,_createdAt,client,status,eventType,startDate,endDate,sessions,venue,notes,email,phone,lang,wishStartTime,wishEndTime,services,answers,message,receivedAt,declineReason,googleEventIds,calSequence,noteLog,activity`;

export const getAllBookings = () => read<BookingDoc[]>(`*[_type=="booking"]|order(startDate desc){${FIELDS}}`);
export const getBooking = (id: string) => read<BookingDoc | null>(`*[_type=="booking" && _id==$id][0]{${FIELDS}}`, { id });
export const getBookingSettings = () => read<RawBookingSettings>(`*[_id=="bookingSettings"][0]`);

export const isConfirmed = (b: BookingDoc) => !b.status || b.status === "confirmed";

/** The blocked time of a booking. Older bookings without times block their whole day(s). */
export function sessionsOf(b: BookingDoc): Session[] {
  if (b.sessions?.length) return b.sessions.map(({ date, from, until }) => ({ date, from, until }));
  return dateRange(b.startDate, b.endDate || b.startDate).map((date) => ({ date, from: DAY_START, until: DAY_END }));
}

/** Busy times for the public calendar — confirmed bookings only, times only (no names or places).
 *  His personal Google Calendar is deliberately not read. */
export function publicBusy(all: BookingDoc[]): Busy[] {
  return all.filter(isConfirmed).flatMap((b) => sessionsOf(b).map(({ date, from, until }) => ({ date, from, until })));
}

/** Today in Hamburg as YYYY-MM-DD. */
export const todayHamburg = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
