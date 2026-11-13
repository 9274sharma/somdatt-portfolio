import { defineArrayMember, defineField, defineType } from "sanity";
import { CaseIcon } from "@sanity/icons/Case";

/** One shoot (a wedding, a night, a campaign) inside a category. */
export default defineType({
  name: "project",
  title: "Project",
  type: "document",
  icon: CaseIcon,
  groups: [
    { name: "basics", title: "Basics", default: true },
    { name: "story", title: "Story" },
    { name: "photos", title: "Photos" },
    { name: "videos", title: "Videos" },
  ],
  fields: [
    defineField({ name: "title", type: "localeString", group: "basics", validation: (R) => R.required() }),
    defineField({
      name: "slug",
      type: "slug",
      group: "basics",
      options: { source: "title.en", maxLength: 96 },
      validation: (R) => R.required(),
    }),
    defineField({
      name: "category",
      type: "reference",
      group: "basics",
      to: [{ type: "category" }],
      validation: (R) => R.required(),
    }),
    defineField({
      name: "cover",
      title: "Cover image",
      description: "Click the image → “Edit hotspot” and mark the face, so crops never cut it.",
      type: "image",
      group: "basics",
      options: { hotspot: true },
      validation: (R) => R.required(),
    }),
    defineField({ name: "description", title: "Short description (cards & hover)", type: "localeText", group: "basics" }),
    defineField({ name: "date", title: "Date / month", description: "e.g. “Sep 2026”", type: "string", group: "basics" }),
    defineField({ name: "location", type: "localeString", group: "basics" }),
    defineField({ name: "order", title: "Sort order (lower = first)", type: "number", group: "basics", initialValue: 0 }),

    defineField({ name: "headline", title: "Story headline", type: "localeString", group: "story" }),
    defineField({ name: "story", title: "Story", type: "localeBlock", group: "story" }),
    defineField({
      name: "facts",
      title: "Quick facts (shown in the header)",
      type: "array",
      group: "story",
      validation: (R) => R.max(4),
      of: [
        defineArrayMember({
          type: "object",
          name: "fact",
          fields: [
            defineField({ name: "label", description: "e.g. Venue", type: "localeString" }),
            defineField({ name: "value", description: "e.g. Uebel & Gefährlich", type: "localeString" }),
          ],
          preview: { select: { title: "label.en", subtitle: "value.en" } },
        }),
      ],
    }),
    defineField({
      name: "highlights",
      title: "What made it unique",
      type: "array",
      group: "story",
      validation: (R) => R.max(3),
      of: [
        defineArrayMember({
          type: "object",
          name: "highlight",
          fields: [
            defineField({ name: "title", type: "localeString" }),
            defineField({ name: "text", type: "localeText" }),
          ],
          preview: { select: { title: "title.en" } },
        }),
      ],
    }),

    defineField({
      name: "gallery",
      title: "Photos",
      description: "Drag to reorder. Click a photo to tick “Show on Home” or “Recent frames”.",
      type: "array",
      group: "photos",
      options: { layout: "grid" },
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "showOnHome", title: "Show on Home (Selected work)", type: "boolean", initialValue: false }),
            defineField({ name: "inMix", title: "Show in Work → Recent frames", type: "boolean", initialValue: false }),
            defineField({ name: "alt", title: "Alt text (optional)", type: "string" }),
          ],
        }),
      ],
    }),

    defineField({
      name: "videos",
      title: "Videos & reels",
      type: "array",
      group: "videos",
      of: [
        defineArrayMember({
          type: "object",
          name: "video",
          fields: [
            defineField({ name: "title", type: "localeString" }),
            defineField({ name: "url", title: "YouTube / Vimeo / Instagram link", type: "url" }),
            defineField({
              name: "file",
              title: "…or upload a video file (MP4)",
              type: "file",
              options: { accept: "video/mp4,video/webm,video/quicktime" },
            }),
            defineField({ name: "vertical", title: "Vertical reel (9:16)", type: "boolean", initialValue: false }),
            defineField({ name: "poster", title: "Thumbnail", type: "image", options: { hotspot: true } }),
            defineField({ name: "duration", description: "e.g. 0:45", type: "string" }),
          ],
          preview: { select: { title: "title.en", subtitle: "url", media: "poster" } },
        }),
      ],
    }),
  ],
  orderings: [
    { title: "Sort order", name: "order", by: [{ field: "order", direction: "asc" }, { field: "_createdAt", direction: "desc" }] },
  ],
  preview: { select: { title: "title.en", subtitle: "category.title.en", media: "cover" } },
});
