import { defineField, defineType } from "sanity";
import { CommentIcon } from "@sanity/icons/Comment";

/** A client review — submitted through /review, approved in Admin → Reviews (or here). */
export default defineType({
  name: "review",
  title: "Review",
  type: "document",
  icon: CommentIcon,
  fields: [
    defineField({
      name: "status",
      type: "string",
      options: { list: ["pending", "published", "hidden"], layout: "radio", direction: "horizontal" },
      initialValue: "pending",
      validation: (R) => R.required(),
    }),
    defineField({ name: "rating", type: "number", validation: (R) => R.min(1).max(5).integer() }),
    defineField({ name: "type", title: "Shoot type", type: "string", options: { list: ["wedding", "event", "brand", "portrait", "other"] } }),
    defineField({ name: "name", type: "string", validation: (R) => R.required().max(60) }),
    defineField({ name: "role", title: "About them", type: "string" }),
    defineField({ name: "text", title: "Review", type: "text", rows: 5, validation: (R) => R.required().max(600) }),
    defineField({
      name: "verified",
      title: "Verified client (came through a booking's personal link)",
      type: "boolean",
      readOnly: true,
      initialValue: false,
    }),
    defineField({ name: "booking", type: "reference", to: [{ type: "booking" }], readOnly: true, weak: true }),
    defineField({ name: "tokenReused", title: "Personal link was used before — check the name", type: "boolean", readOnly: true }),
    defineField({ name: "rejectReason", title: "Reject reason", type: "string", hidden: ({ document }) => document?.status !== "hidden" }),
    defineField({ name: "rejectedAt", type: "datetime", readOnly: true, hidden: true }),
    defineField({ name: "lang", title: "Written in", type: "string", options: { list: ["en", "de"] }, readOnly: true }),
    defineField({ name: "consent", title: "Agreed to publication", type: "boolean", readOnly: true }),
    defineField({ name: "submittedAt", type: "datetime", readOnly: true }),
  ],
  orderings: [{ title: "Newest", name: "new", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { title: "name", subtitle: "text", status: "status", rating: "rating" },
    prepare: ({ title, subtitle, status, rating }) => ({
      title: `${"★".repeat(rating ?? 0)} ${title ?? ""}`,
      subtitle: `${status ?? ""} · ${subtitle ?? ""}`,
    }),
  },
});
