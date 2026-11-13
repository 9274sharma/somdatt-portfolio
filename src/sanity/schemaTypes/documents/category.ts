import { defineField, defineType } from "sanity";
import { FolderIcon } from "@sanity/icons/Folder";

/** A Work category = a chip on the Work page + a folder in the Studio. */
export default defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: FolderIcon,
  fields: [
    defineField({ name: "title", title: "Name (chip label)", type: "localeString", validation: (R) => R.required() }),
    defineField({
      name: "slug",
      description: "Used in the link, e.g. /portfolio?cat=weddings",
      type: "slug",
      options: { source: "title.en", maxLength: 96 },
      validation: (R) => R.required(),
    }),
    defineField({ name: "cover", title: "Cover image (category card)", type: "image", options: { hotspot: true } }),
    defineField({ name: "description", title: "Short description (card & under the title)", type: "localeText" }),
    defineField({ name: "intro", title: "Longer text (optional)", type: "localeBlock" }),
    defineField({
      name: "cta",
      title: "Bottom call-to-action",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "title", type: "localeString" }),
        defineField({ name: "text", type: "localeText" }),
      ],
    }),
    defineField({ name: "order", title: "Chip order", type: "number", initialValue: 0 }),
  ],
  orderings: [{ title: "Chip order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title.en", subtitle: "slug.current", media: "cover" } },
});
