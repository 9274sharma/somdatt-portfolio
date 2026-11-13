import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { defineLocations, presentationTool } from "sanity/presentation";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schema, SINGLETONS } from "./src/sanity/schemaTypes";
import { defaultDocumentNode, structure } from "./src/sanity/structure";
import { DeleteCategoryAction } from "./src/sanity/components/DeleteCategoryAction";
import { RootInput, StudioLayout } from "./src/sanity/components/RootInput";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  // Content releases are not used here — keep the top bar simple.
  releases: { enabled: false },
  // Token login: lets the Studio prove who is asking when it calls /api/translate.
  auth: { loginMethod: "token" },
  schema: {
    ...schema,
    templates: (prev) => [
      ...prev,
      {
        id: "project-in-category",
        title: "Project in this category",
        schemaType: "project",
        parameters: [{ name: "catId", type: "string" }],
        value: (p: { catId: string }) => ({ category: { _type: "reference", _ref: p.catId } }),
      },
    ],
  },
  plugins: [
    presentationTool({
      previewUrl: { previewMode: { enable: "/api/draft-mode/enable" } },
      // "Used on" links at the top of each document → open that exact page in Presentation.
      resolve: {
        locations: {
          ...Object.fromEntries(
            (
              [
                ["homeHero", "Home — Main frame"],
                ["homeWork", "Home — Selected work"],
                ["homeServices", "Home — What I do"],
                ["homeAbout", "Home — Short about"],
                ["homeReviews", "Home — What clients say"],
                ["homeContact", "Home — Get in touch"],
              ] as const
            ).map(([type, title]) => [type, defineLocations({ locations: [{ title, href: "/" }] })]),
          ),
          workPage: defineLocations({ locations: [{ title: "Work", href: "/portfolio" }] }),
          servicesPage: defineLocations({ locations: [{ title: "Services", href: "/services" }] }),
          aboutPage: defineLocations({ locations: [{ title: "About", href: "/about" }] }),
          siteSettings: defineLocations({ locations: [{ title: "Every page (footer)", href: "/" }] }),
          bookingSettings: defineLocations({ locations: [{ title: "Contact form", href: "/contact" }] }),
          service: defineLocations({ locations: [{ title: "Services", href: "/services" }, { title: "Home — What I do", href: "/" }] }),
          review: defineLocations({ locations: [{ title: "About — reviews", href: "/about" }, { title: "Home", href: "/" }] }),
          category: defineLocations({
            select: { title: "title.en", slug: "slug.current" },
            resolve: (doc) => ({
              locations: [
                { title: `Work — ${doc?.title ?? "category"}`, href: doc?.slug ? `/portfolio?cat=${doc.slug}` : "/portfolio" },
                { title: "Work — All", href: "/portfolio" },
              ],
            }),
          }),
          project: defineLocations({
            select: { title: "title.en", slug: "slug.current" },
            resolve: (doc) => ({
              locations: [
                ...(doc?.slug ? [{ title: doc.title ?? "Project", href: `/projects/${doc.slug}` }] : []),
                { title: "Work", href: "/portfolio" },
              ],
            }),
          }),
        },
      },
    }),
    structureTool({ structure, defaultDocumentNode }),
    // GROQ playground is a developer tool — local dev only.
    ...(process.env.NODE_ENV === "development" ? [visionTool({ defaultApiVersion: apiVersion })] : []),
  ],
  // Editor + live Preview side by side (auto split) for every page-backed document.
  form: { components: { input: RootInput } },
  studio: { components: { layout: StudioLayout } },
  document: {
    // Singletons never appear in "Create new"; the in-category template is only offered inside a folder.
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === "global"
        ? prev.filter((t) => !SINGLETONS.includes(t.templateId) && t.templateId !== "project-in-category")
        : prev,
    actions: (prev, { schemaType }) => {
      if (SINGLETONS.includes(schemaType)) {
        return prev.filter((a) => !["duplicate", "delete", "unpublish"].includes(a.action ?? ""));
      }
      if (schemaType === "category") {
        return [...prev.filter((a) => a.action !== "delete"), DeleteCategoryAction];
      }
      return prev;
    },
  },
});
