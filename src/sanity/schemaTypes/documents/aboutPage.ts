import { defineArrayMember, defineField, defineType } from "sanity";
import { UserIcon } from "@sanity/icons/User";

const item = (name: string, fields: ReturnType<typeof defineField>[], title = "title.en") =>
  defineArrayMember({ type: "object", name, fields, preview: { select: { title, media: "image" } } });

/** Singleton — the About page, section by section. */
export default defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  icon: UserIcon,
  groups: [
    { name: "intro", title: "Intro", default: true },
    { name: "story", title: "Story & map" },
    { name: "photos", title: "Behind the lens" },
    { name: "journey", title: "Journey" },
    { name: "work", title: "How I work" },
    { name: "more", title: "Clients & FAQ" },
  ],
  fields: [
    defineField({ name: "portrait", title: "Portrait", type: "image", group: "intro", options: { hotspot: true } }),
    defineField({ name: "tagline", type: "localeString", group: "intro", description: "e.g. Photographer & filmmaker. Raised in India, based in Hamburg." }),
    defineField({ name: "intro", title: "Intro text", type: "localeText", group: "intro" }),
    defineField({ name: "basedIn", title: "“Based in” badge", type: "string", group: "intro", initialValue: "Hamburg, DE" }),
    defineField({
      name: "stats",
      title: "Numbers",
      type: "array",
      group: "intro",
      validation: (R) => R.max(4),
      of: [
        item("stat", [
          defineField({ name: "value", type: "number" }),
          defineField({ name: "suffix", description: "e.g. + or h", type: "string" }),
          defineField({ name: "label", type: "localeString" }),
        ], "label.en"),
      ],
    }),

    defineField({ name: "storyTitle", type: "localeString", group: "story" }),
    defineField({ name: "story", type: "localeBlock", group: "story" }),
    defineField({ name: "quote", title: "Pull quote", type: "localeText", group: "story" }),
    defineField({ name: "signature", type: "string", group: "story", initialValue: "— Somdatt" }),
    defineField({
      name: "map",
      title: "Map labels",
      type: "object",
      group: "story",
      fields: [
        defineField({ name: "from", type: "string", initialValue: "Delhi" }),
        defineField({ name: "fromNote", type: "localeString" }),
        defineField({ name: "to", type: "string", initialValue: "Hamburg" }),
        defineField({ name: "toNote", type: "localeString" }),
        defineField({ name: "distance", type: "string", initialValue: "≈ 6,000 km" }),
      ],
    }),

    defineField({
      name: "behindTheLens",
      title: "Behind-the-lens photos (5 look best)",
      type: "array",
      group: "photos",
      of: [defineArrayMember({ type: "image", options: { hotspot: true }, fields: [defineField({ name: "caption", type: "localeString" })] })],
      options: { layout: "grid" },
    }),

    defineField({
      name: "journey",
      type: "array",
      group: "journey",
      of: [
        item("stop", [
          defineField({ name: "year", type: "string" }),
          defineField({ name: "title", type: "localeString" }),
          defineField({ name: "text", type: "localeText" }),
          defineField({ name: "image", type: "image", options: { hotspot: true } }),
        ]),
      ],
    }),

    defineField({
      name: "process",
      title: "How I work — steps",
      type: "array",
      group: "work",
      of: [item("step", [defineField({ name: "title", type: "localeString" }), defineField({ name: "text", type: "localeText" })])],
    }),
    defineField({
      name: "capabilities",
      title: "What I bring — cards",
      type: "array",
      group: "work",
      of: [
        item("capability", [
          defineField({ name: "title", type: "localeString" }),
          defineField({ name: "image", type: "image", options: { hotspot: true } }),
          defineField({ name: "points", type: "array", of: [defineArrayMember({ type: "localeString" })] }),
        ]),
      ],
    }),

    defineField({
      name: "clients",
      title: "Worked with",
      type: "array",
      group: "more",
      of: [item("client", [defineField({ name: "name", type: "string" }), defineField({ name: "logo", type: "image" })], "name")],
    }),
    defineField({
      name: "faq",
      title: "FAQ",
      type: "array",
      group: "more",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          fields: [defineField({ name: "q", title: "Question", type: "localeString" }), defineField({ name: "a", title: "Answer", type: "localeText" })],
          preview: { select: { title: "q.en" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "About page" }) },
});
