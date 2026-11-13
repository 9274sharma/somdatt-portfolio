import { defineArrayMember, defineField, defineType } from "sanity";
import { LocaleInput } from "../../components/LocaleInput";

/** Bookkeeping for auto-translation (hidden from editors). */
const tracking = [
  defineField({ name: "deFor", type: "string", hidden: true, readOnly: true }),
  defineField({ name: "deMode", type: "string", hidden: true, readOnly: true }),
];

/** Bilingual string — type English, German fills in automatically (editable). */
export const localeString = defineType({
  name: "localeString",
  title: "Localized string",
  type: "object",
  components: { input: LocaleInput },
  fields: [
    defineField({ name: "en", title: "English", type: "string" }),
    defineField({ name: "de", title: "Deutsch", type: "string" }),
    ...tracking,
  ],
  preview: { select: { title: "en", subtitle: "de" } },
});

/** Bilingual multi-line text. */
export const localeText = defineType({
  name: "localeText",
  title: "Localized text",
  type: "object",
  components: { input: LocaleInput },
  fields: [
    defineField({ name: "en", title: "English", type: "text", rows: 3 }),
    defineField({ name: "de", title: "Deutsch", type: "text", rows: 3 }),
    ...tracking,
  ],
});

/** Word-like rich text: headings, bold/italic, bullet & numbered lists, links, inline logos/images. */
export const richText = defineType({
  name: "richText",
  title: "Rich text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading", value: "h3" },
        { title: "Small heading", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullets", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
          { title: "Underline", value: "underline" },
        ],
        annotations: [
          defineArrayMember({
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              defineField({
                name: "href",
                type: "url",
                validation: (R) => R.uri({ allowRelative: true, scheme: ["http", "https", "mailto", "tel"] }),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      title: "Image / logo",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt text", type: "string" }),
        defineField({
          name: "size",
          type: "string",
          options: { list: ["logo", "small", "full"], layout: "radio", direction: "horizontal" },
          initialValue: "full",
        }),
      ],
    }),
  ],
});

/** Bilingual rich text (English → German auto-translated, formatting kept). */
export const localeBlock = defineType({
  name: "localeBlock",
  title: "Localized rich text",
  type: "object",
  components: { input: LocaleInput },
  fields: [
    defineField({ name: "en", title: "English", type: "richText" }),
    defineField({ name: "de", title: "Deutsch", type: "richText" }),
    ...tracking,
  ],
});
