import { defineArrayMember, defineField, defineType } from "sanity";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { emailPreviewInput } from "../../components/EmailTemplateInput";

const VARS = "Use {name}, {dates} and {type} — they're filled in for each client. A blank line starts a new paragraph.";

const subject = defineField({ name: "subject", title: "Subject", type: "localeString", validation: (r) => r.required() });
const heading = defineField({ name: "heading", title: "Big heading", type: "localeString" });
const text = defineField({ name: "text", title: "Text", description: VARS, type: "localeText", validation: (r) => r.required() });
const name = defineField({ name: "name", title: "Name (only for you — shown in /admin)", type: "string", validation: (r) => r.required() });

/** Singleton — the booking form on /contact and every email the client can get. The design stays fixed in code. */
export default defineType({
  name: "bookingSettings",
  title: "Booking settings",
  type: "document",
  icon: CalendarIcon,
  groups: [
    { name: "form", title: "Contact form", default: true },
    { name: "received", title: "Auto reply" },
    { name: "confirm", title: "Accept emails" },
    { name: "decline", title: "Decline emails" },
    { name: "other", title: "Other emails" },
  ],
  fields: [
    // ── contact form ───────────────────────────────────
    defineField({
      name: "eventTypes",
      title: "Event types",
      description: "The dropdown on the form. “Other…” (with a text box) is always added at the end.",
      type: "array",
      group: "form",
      of: [defineArrayMember({ type: "localeString" })],
    }),
    defineField({
      name: "services",
      title: "Services (chips)",
      type: "array",
      group: "form",
      of: [
        defineArrayMember({
          type: "object",
          name: "serviceChip",
          fields: [
            defineField({ name: "label", title: "Label", type: "localeString", validation: (r) => r.required() }),
            defineField({ name: "preselected", title: "Ticked by default", type: "boolean", initialValue: false }),
          ],
          preview: { select: { title: "label.en", on: "preselected" }, prepare: ({ title, on }) => ({ title, subtitle: on ? "ticked by default" : "" }) },
        }),
      ],
    }),
    defineField({
      name: "fields",
      title: "Extra questions",
      description: "Asked after name and email. Name, email, dates, venue, event type, services and the message box are always there.",
      type: "array",
      group: "form",
      of: [
        defineArrayMember({
          type: "object",
          name: "formField",
          fields: [
            defineField({ name: "label", title: "Question", type: "localeString", validation: (r) => r.required() }),
            defineField({
              name: "type",
              title: "Answer type",
              type: "string",
              initialValue: "text",
              options: {
                list: [
                  { title: "Short text", value: "text" },
                  { title: "Phone number", value: "tel" },
                  { title: "Number", value: "number" },
                  { title: "Choice (dropdown)", value: "select" },
                  { title: "Long text", value: "textarea" },
                ],
                layout: "radio",
              },
            }),
            defineField({
              name: "options",
              title: "Choices",
              type: "array",
              of: [defineArrayMember({ type: "localeString" })],
              hidden: ({ parent }) => (parent as { type?: string } | undefined)?.type !== "select",
            }),
            defineField({ name: "placeholder", title: "Example text in the box (optional)", type: "localeString" }),
            defineField({ name: "required", title: "Required", type: "boolean", initialValue: false }),
            defineField({ name: "half", title: "Half width (two side by side)", type: "boolean", initialValue: true }),
          ],
          preview: {
            select: { title: "label.en", type: "type", req: "required" },
            prepare: ({ title, type, req }) => ({ title, subtitle: `${type ?? "text"}${req ? " · required" : " · optional"}` }),
          },
        }),
      ],
    }),

    // ── auto reply ─────────────────────────────────────
    defineField({
      name: "emailReceived",
      title: "Request received",
      description: "Sent automatically the moment someone sends the form.",
      type: "object",
      group: "received",
      components: { input: emailPreviewInput("received") },
      fields: [subject, heading, text, defineField({ name: "note", title: "Small note under the summary", type: "localeText" })],
    }),

    // ── accept ─────────────────────────────────────────
    defineField({
      name: "confirmTemplates",
      title: "Accept emails",
      description: "When you accept a request in /admin you pick one of these. The first one is pre-selected. The schedule, venue and “Add to calendar” are added automatically.",
      type: "array",
      group: "confirm",
      of: [
        defineArrayMember({
          type: "object",
          name: "confirmTemplate",
          components: { input: emailPreviewInput("confirm") },
          fields: [
            name,
            subject,
            heading,
            text,
            defineField({ name: "steps", title: "“What happens next” points", type: "array", of: [defineArrayMember({ type: "localeString" })] }),
            defineField({ name: "closing", title: "Last line", type: "localeString" }),
          ],
          preview: { select: { title: "name", subtitle: "subject.en" } },
        }),
      ],
    }),

    // ── decline ────────────────────────────────────────
    defineField({
      name: "declineTemplates",
      title: "Decline emails",
      description: "When you decline in /admin you pick one of these (or send nothing).",
      type: "array",
      group: "decline",
      of: [
        defineArrayMember({
          type: "object",
          name: "declineTemplate",
          components: { input: emailPreviewInput("decline") },
          fields: [
            name,
            subject,
            heading,
            text,
            defineField({ name: "freeDates", title: "Add a “See free dates” button", type: "boolean", initialValue: false }),
          ],
          preview: { select: { title: "name", subtitle: "subject.en" } },
        }),
      ],
    }),

    // ── other ──────────────────────────────────────────
    defineField({
      name: "otherTemplates",
      title: "Other emails",
      description: "Send these by hand from /admin to any confirmed booking — e.g. a deposit reminder or “your gallery is ready”.",
      type: "array",
      group: "other",
      of: [
        defineArrayMember({
          type: "object",
          name: "otherTemplate",
          components: { input: emailPreviewInput("other") },
          fields: [
            name,
            subject,
            heading,
            text,
            defineField({ name: "buttonLabel", title: "Button text (optional)", type: "localeString" }),
            defineField({ name: "buttonUrl", title: "Button link (optional)", type: "url" }),
          ],
          preview: { select: { title: "name", subtitle: "subject.en" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Booking settings" }) },
});
