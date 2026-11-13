import { defineArrayMember, defineField, defineType } from "sanity";
import { ThListIcon } from "@sanity/icons/ThList";

/** One service box — used on Home (“What I do”) and on the Services page. */
export default defineType({
  name: "service",
  title: "Service",
  type: "document",
  icon: ThListIcon,
  fields: [
    defineField({ name: "title", type: "localeString", validation: (R) => R.required() }),
    defineField({ name: "description", type: "localeText" }),
    defineField({
      name: "icon",
      description: "Leave empty to pick automatically from the title.",
      type: "string",
      options: {
        list: [
          { title: "Camera (photography)", value: "photo" },
          { title: "Video camera (film)", value: "video" },
          { title: "Edit / sliders", value: "edit" },
          { title: "Rings (weddings)", value: "wedding" },
          { title: "Spark (events)", value: "event" },
          { title: "Briefcase (brands)", value: "brand" },
        ],
      },
    }),
    defineField({ name: "intro", title: "Intro (Services page)", description: "1–2 sentences under the title on the Services page.", type: "localeText" }),
    defineField({ name: "image", title: "Photo (Services page)", type: "image", options: { hotspot: true } }),
    defineField({
      name: "video",
      title: "Short looping clip instead of the photo (optional)",
      description: "MP4, muted, 6–10 seconds, under ~1 MB. It only plays while visible and never for visitors who prefer reduced motion.",
      type: "file",
      options: { accept: "video/mp4,video/webm" },
    }),
    defineField({
      name: "bestFor",
      title: "Best for (links to Work categories)",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "category" }] })],
    }),
    defineField({ name: "points", title: "What's included", type: "array", of: [defineArrayMember({ type: "localeString" })] }),
    defineField({ name: "deliverables", title: "You get", type: "array", of: [defineArrayMember({ type: "localeString" })] }),
    defineField({ name: "turnaround", title: "Delivery time", description: "e.g. 2–3 weeks", type: "localeString" }),
    defineField({
      name: "priceFrom",
      title: "Price (optional)",
      description: "e.g. “From €890”. Leave empty to show “On request · quote in 24 h”.",
      type: "localeString",
    }),
    defineField({ name: "showOnHome", title: "Show on Home", type: "boolean", initialValue: true }),
    defineField({ name: "order", title: "Sort order", type: "number", initialValue: 0 }),
  ],
  orderings: [{ title: "Sort order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title.en", subtitle: "description.en" } },
});
