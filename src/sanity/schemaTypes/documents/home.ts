import { defineField, defineType } from "sanity";
import { ImagesIcon } from "@sanity/icons/Images";
import { ProjectsIcon } from "@sanity/icons/Projects";
import { ThListIcon } from "@sanity/icons/ThList";
import { UserIcon } from "@sanity/icons/User";
import { CommentIcon } from "@sanity/icons/Comment";
import { EnvelopeIcon } from "@sanity/icons/Envelope";

/** Home page sections — one small singleton each, shown as folders under "Home". */

export const homeHero = defineType({
  name: "homeHero",
  title: "Main frame",
  type: "document",
  icon: ImagesIcon,
  fields: [
    defineField({ name: "eyebrow", title: "Small line above", type: "localeString" }),
    defineField({ name: "line1", title: "Headline — line 1", description: "e.g. “Weddings. Brands.”", type: "localeString" }),
    defineField({ name: "line2", title: "Headline — line 2 (accent colour)", description: "e.g. “Nightlife.”", type: "localeString" }),
    defineField({ name: "sub", title: "Text under the headline", type: "localeText" }),
    defineField({ name: "cta1", title: "Button 1 (to Work)", type: "localeString" }),
    defineField({ name: "cta2", title: "Button 2 (to Contact)", type: "localeString" }),
    defineField({
      name: "images",
      title: "Background photos (they rotate)",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      options: { layout: "grid" },
      validation: (R) => R.max(8),
    }),
  ],
  preview: { prepare: () => ({ title: "Main frame" }) },
});

export const homeWork = defineType({
  name: "homeWork",
  title: "Selected work",
  type: "document",
  icon: ProjectsIcon,
  description: "Photos appear here when “Show on Home” is ticked on them inside a project.",
  fields: [
    defineField({ name: "eyebrow", type: "localeString" }),
    defineField({ name: "heading", type: "localeString" }),
    defineField({ name: "linkLabel", title: "Link text (to Work)", type: "localeString" }),
  ],
  preview: { prepare: () => ({ title: "Selected work" }) },
});

export const homeServices = defineType({
  name: "homeServices",
  title: "What I do",
  type: "document",
  icon: ThListIcon,
  fields: [
    defineField({ name: "eyebrow", type: "localeString" }),
    defineField({ name: "heading", description: "e.g. “One team, the full job”", type: "localeString" }),
    defineField({ name: "linkLabel", title: "Link text (to Services)", type: "localeString" }),
  ],
  preview: { prepare: () => ({ title: "What I do — heading" }) },
});

export const homeAbout = defineType({
  name: "homeAbout",
  title: "Short about",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({ name: "photo", type: "image", options: { hotspot: true } }),
    defineField({ name: "eyebrow", type: "localeString" }),
    defineField({ name: "title", type: "localeString" }),
    defineField({ name: "body", title: "Text", type: "localeBlock" }),
    defineField({ name: "linkLabel", title: "Link text (to About)", type: "localeString" }),
  ],
  preview: { prepare: () => ({ title: "Short about" }) },
});

export const homeReviews = defineType({
  name: "homeReviews",
  title: "What clients say",
  type: "document",
  icon: CommentIcon,
  description: "Shows the 3 newest approved reviews. Approve reviews in Admin → Reviews.",
  fields: [
    defineField({ name: "show", title: "Show on Home", type: "boolean", initialValue: true }),
    defineField({ name: "eyebrow", type: "localeString" }),
    defineField({ name: "heading", type: "localeString" }),
    defineField({ name: "linkLabel", title: "Link text (to all reviews)", type: "localeString" }),
  ],
  preview: { prepare: () => ({ title: "What clients say" }) },
});

export const homeContact = defineType({
  name: "homeContact",
  title: "Get in touch",
  type: "document",
  icon: EnvelopeIcon,
  fields: [
    defineField({ name: "eyebrow", type: "localeString" }),
    defineField({ name: "heading", type: "localeString" }),
    defineField({ name: "text", type: "localeText" }),
    defineField({ name: "button", title: "Button text", type: "localeString" }),
  ],
  preview: { prepare: () => ({ title: "Get in touch" }) },
});
