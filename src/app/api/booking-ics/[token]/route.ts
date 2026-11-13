import { readSignedId } from "@/lib/reviewToken";
import { getBooking, getBookingSettings, isConfirmed } from "@/lib/bookings";
import { resolveForm } from "@/lib/booking-config";
import { icsFile } from "@/lib/emails";

/** The client's calendar file for a confirmed booking (signed link from the confirmation email).
 *  A cancelled booking returns a CANCEL file, so re-opening the link removes the events. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const id = readSignedId("ics", (await params).token);
  const b = id ? await getBooking(id) : null;
  if (!b?.sessions?.length || b.status === "request" || b.status === "declined") return new Response("Not found", { status: 404 });
  const raw = await getBookingSettings();
  const lang = b.lang === "de" ? "de" : "en";
  const en = resolveForm(raw, "en");
  const i = en.eventTypes.findIndex((x) => x.value === b.eventType);
  const type = b.eventType?.startsWith("Other: ") ? b.eventType.slice(7) : i >= 0 ? resolveForm(raw, lang).eventTypes[i]?.label : b.eventType;
  const events = b.sessions.map((s) => ({ uid: `${b._id}-${s.date}`, title: `${type ?? "Booking"} — Somdatt Sharma`, date: s.date, from: s.from, until: s.until, location: b.venue }));
  const cancel = !isConfirmed(b);
  return new Response(icsFile(events, { method: cancel ? "CANCEL" : "PUBLISH", sequence: (b.calSequence ?? 0) + (cancel ? 1 : 0) }), {
    headers: {
      "content-type": `text/calendar; charset=utf-8; method=${cancel ? "CANCEL" : "PUBLISH"}`,
      "content-disposition": 'inline; filename="booking.ics"',
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}
