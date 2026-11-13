import { defineField, defineType } from "sanity";
import { CogIcon } from "@sanity/icons/Cog";

/** Singleton — font, contact details and the whole footer. */
export default defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "general", title: "General", default: true },
    { name: "footer", title: "Footer" },
  ],
  fields: [
    defineField({
      name: "font",
      title: "Site font",
      type: "string",
      group: "general",
      options: {
        list: [
          { title: "Bricolage Grotesque", value: "bricolage" },
          { title: "Archivo", value: "archivo" },
          { title: "Fraunces", value: "fraunces" },
        ],
        layout: "radio",
      },
      initialValue: "bricolage",
    }),
    defineField({ name: "contactEmail", title: "Contact email", type: "string", group: "general" }),
    defineField({ name: "phone", title: "Phone (shown in footer)", type: "string", group: "general" }),
    // Not shown anywhere on the site yet (WhatsApp alerts use the server env). Hidden until a WhatsApp button is wanted.
    defineField({ name: "whatsapp", title: "WhatsApp number", type: "string", group: "general", hidden: true }),
    defineField({ name: "instagram", title: "Instagram URL", type: "url", group: "general" }),
    defineField({ name: "linkedin", title: "LinkedIn URL", type: "url", group: "general" }),
    defineField({
      name: "googleReviewUrl",
      title: "Google review link (optional)",
      description: "Shown after someone leaves a review on the site: “Also post it on Google”.",
      type: "url",
      group: "general",
    }),

    defineField({ name: "footerTagline", title: "Footer text under the logo", type: "localeText", group: "footer" }),
    defineField({ name: "footerContactHeading", title: "“Contact” heading", type: "localeString", group: "footer" }),
    defineField({ name: "footerLegalHeading", title: "“Legal” heading", type: "localeString", group: "footer" }),
    defineField({ name: "footerCopyright", title: "Copyright line", description: "{year} is replaced automatically.", type: "localeString", group: "footer" }),

  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
