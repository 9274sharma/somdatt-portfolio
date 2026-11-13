import { defineArrayMember, defineField, defineType } from "sanity";
import { DocumentIcon } from "@sanity/icons/Document";

/** Work page "main folder": lead text + the closing call-to-action. Chips = categories. */
export const workPage = defineType({
  name: "workPage",
  title: "Work page",
  type: "document",
  icon: DocumentIcon,
  fields: [
    defineField({ name: "eyebrow", type: "localeString" }),
    defineField({ name: "title", type: "localeString" }),
    defineField({ name: "lead", title: "Lead text", description: "Shown under the title when “All” is selected.", type: "localeText" }),
    defineField({ name: "ctaTitle", title: "Bottom CTA — title (All view)", type: "localeString" }),
    defineField({ name: "ctaText", title: "Bottom CTA — text (All view)", type: "localeText" }),
    defineField({ name: "ctaButton", title: "Bottom CTA — button", type: "localeString" }),
  ],
  preview: { prepare: () => ({ title: "Work page" }) },
});

/** Services page header. The service boxes themselves are the "Service" documents. */
export const servicesPage = defineType({
  name: "servicesPage",
  title: "Services page",
  type: "document",
  icon: DocumentIcon,
  fields: [
    defineField({ name: "eyebrow", type: "localeString" }),
    defineField({ name: "title", type: "localeString" }),
    defineField({ name: "lead", type: "localeText" }),
    defineField({ name: "heroImage", title: "Header photo (desktop)", type: "image", options: { hotspot: true } }),
    defineField({
      name: "vat",
      title: "VAT note next to prices (required in Germany)",
      description: "Pick what applies to you — ask your tax adviser if unsure.",
      type: "string",
      options: {
        list: [
          { title: "Prices include 19 % VAT", value: "incl" },
          { title: "Small business — no VAT charged (§19 UStG)", value: "small" },
        ],
        layout: "radio",
      },
      initialValue: "incl",
    }),
    defineField({
      name: "pricingNote",
      title: "What the price depends on",
      description: "One honest line shown next to the bundles, e.g. “Hours, second shooter, film length and travel decide the price.”",
      type: "localeText",
    }),
    defineField({
      name: "bundles",
      title: "Bundles (book it together)",
      type: "array",
      validation: (R) => R.max(3),
      of: [
        defineArrayMember({
          type: "object",
          name: "bundle",
          fields: [
            defineField({ name: "title", type: "localeString" }),
            defineField({ name: "bestFor", title: "Best for", description: "e.g. Weddings", type: "localeString" }),
            defineField({ name: "text", type: "localeText" }),
            defineField({ name: "includes", description: "Use real numbers: hours, ~photos, film length.", type: "array", of: [defineArrayMember({ type: "localeString" })] }),
            defineField({ name: "price", title: "Price (optional)", type: "localeString" }),
            defineField({ name: "featured", title: "Highlight as “Most booked”", type: "boolean", initialValue: false }),
          ],
          preview: { select: { title: "title.en", featured: "featured" }, prepare: ({ title, featured }) => ({ title: `${featured ? "★ " : ""}${title ?? ""}` }) },
        }),
      ],
    }),
    defineField({
      name: "timeline",
      title: "When you get what",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "milestone",
          fields: [
            defineField({ name: "when", description: "e.g. 48 hours", type: "localeString" }),
            defineField({ name: "what", description: "e.g. Sneak peeks", type: "localeString" }),
            defineField({ name: "text", type: "localeText" }),
          ],
          preview: { select: { title: "when.en", subtitle: "what.en" } },
        }),
      ],
    }),
    defineField({
      name: "faq",
      title: "FAQ (before you book)",
      type: "array",
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
  preview: { prepare: () => ({ title: "Services page" }) },
});
