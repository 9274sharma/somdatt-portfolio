import { defineArrayMember, defineField, defineType } from "sanity";
import { CalendarIcon } from "@sanity/icons/Calendar";

/** Times are stored as minutes after the date's 00:00 (night jobs may pass 1440 = midnight).
 *  The `label` next to them is what people read; the numbers are for the site. */
const hhmm = (m?: number) => (typeof m === "number" ? `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}${m >= 1440 ? " (+1)" : ""}` : "—");

/** One booking — a website request, or a confirmed job. Only confirmed bookings block the calendar.
 *  Requests are handled in /admin (accept = set the exact times); edit here only if you know why. */
export default defineType({
  name: "booking",
  title: "Booking",
  type: "document",
  icon: CalendarIcon,
  groups: [
    { name: "main", title: "Booking", default: true },
    { name: "client", title: "Client" },
    { name: "request", title: "What they asked" },
    { name: "system", title: "System" },
  ],
  fields: [
    defineField({ name: "client", title: "Client name", type: "string", group: "main", validation: (r) => r.required() }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "main",
      options: {
        list: [
          { title: "New request", value: "request" },
          { title: "Confirmed", value: "confirmed" },
          { title: "Declined", value: "declined" },
          { title: "Cancelled", value: "cancelled" },
        ],
        layout: "radio",
      },
      initialValue: "confirmed",
    }),
    defineField({ name: "eventType", title: "Event type", type: "string", group: "main" }),
    defineField({ name: "startDate", title: "First day", type: "date", group: "main", options: { dateFormat: "YYYY-MM-DD" }, validation: (r) => r.required() }),
    defineField({ name: "endDate", title: "Last day", type: "date", group: "main", options: { dateFormat: "YYYY-MM-DD" }, validation: (r) => r.required() }),
    defineField({
      name: "sessions",
      title: "Booked times",
      description: "Set when you accept in /admin. Empty on an older booking = the whole day(s) are blocked.",
      type: "array",
      group: "main",
      of: [
        defineArrayMember({
          type: "object",
          name: "session",
          fields: [
            defineField({ name: "date", type: "date", options: { dateFormat: "YYYY-MM-DD" } }),
            defineField({ name: "from", title: "From (minutes)", type: "number" }),
            defineField({ name: "until", title: "Until (minutes, > 1440 = next day)", type: "number" }),
          ],
          preview: {
            select: { date: "date", from: "from", until: "until" },
            prepare: ({ date, from, until }) => ({ title: date || "—", subtitle: `${hhmm(from)} – ${hhmm(until)}` }),
          },
        }),
      ],
    }),
    defineField({ name: "venue", title: "Venue / address", type: "string", group: "main" }),
    defineField({ name: "notes", title: "Older note (private)", description: "From before the notes timeline. Only you see it.", type: "text", rows: 3, group: "main", hidden: ({ value }) => !value }),
    defineField({
      name: "noteLog",
      title: "Notes (private timeline)",
      description: "Only you see these — never sent to the client. Easiest to add in /admin → booking.",
      type: "array",
      group: "main",
      of: [
        defineArrayMember({
          type: "object",
          name: "note",
          fields: [defineField({ name: "at", title: "When", type: "datetime" }), defineField({ name: "text", title: "Note", type: "text", rows: 2 })],
          preview: { select: { title: "text", subtitle: "at" } },
        }),
      ],
    }),

    defineField({ name: "email", title: "Email", type: "string", group: "client" }),
    defineField({ name: "phone", title: "Phone", type: "string", group: "client" }),
    defineField({
      name: "lang",
      title: "Language",
      type: "string",
      group: "client",
      options: { list: [{ title: "English", value: "en" }, { title: "Deutsch", value: "de" }], layout: "radio" },
    }),

    defineField({ name: "wishStartTime", title: "Asked start (minutes, empty = not sure)", type: "number", group: "request" }),
    defineField({ name: "wishEndTime", title: "Asked end (minutes, empty = not sure)", type: "number", group: "request" }),
    defineField({ name: "services", title: "Services", type: "array", group: "request", of: [defineArrayMember({ type: "string" })] }),
    defineField({
      name: "answers",
      title: "Other answers",
      type: "array",
      group: "request",
      of: [
        defineArrayMember({
          type: "object",
          name: "answer",
          fields: [defineField({ name: "label", type: "string" }), defineField({ name: "value", type: "string" })],
          preview: { select: { title: "label", subtitle: "value" } },
        }),
      ],
    }),
    defineField({ name: "message", title: "Message", type: "text", rows: 4, group: "request" }),
    defineField({ name: "receivedAt", title: "Received", type: "datetime", group: "request", readOnly: true }),

    defineField({
      name: "declineReason",
      title: "Decline reason",
      type: "string",
      group: "system",
      description: "Which decline email was sent (or “no email”).",
      readOnly: true,
    }),
    defineField({ name: "googleEventIds", title: "Google Calendar event IDs", type: "array", group: "system", readOnly: true, of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "calSequence", title: "Calendar update counter", type: "number", group: "system", readOnly: true }),
    defineField({
      name: "activity",
      title: "History",
      description: "What happened, automatically: received, accepted, emails sent, cancelled…",
      type: "array",
      group: "system",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          name: "event",
          fields: [defineField({ name: "at", type: "datetime" }), defineField({ name: "kind", type: "string" }), defineField({ name: "text", type: "string" })],
          preview: { select: { title: "text", subtitle: "at" } },
        }),
      ],
    }),
  ],
  orderings: [{ name: "startAsc", title: "First day", by: [{ field: "startDate", direction: "asc" }] }],
  preview: {
    select: { title: "client", type: "eventType", start: "startDate", end: "endDate", status: "status" },
    prepare: ({ title, type, start, end, status }) => ({
      title: `${status === "request" ? "● " : ""}${title || "Booking"}${type ? ` · ${type}` : ""}`,
      subtitle: `${start === end || !end ? start : `${start} – ${end}`}${status && status !== "confirmed" ? ` · ${status}` : ""}`,
    }),
  },
});
