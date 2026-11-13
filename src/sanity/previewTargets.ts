/** Where each document appears on the website: page path + the section to scroll to. */
export type PreviewTarget = { path: string; anchor?: string; title: string };

type Doc = { _id?: string; _type?: string; slug?: { current?: string } | string; category?: { _ref?: string } } | null | undefined;

const bare = (id?: string) => (id ?? "").replace(/^drafts\./, "");
const slugOf = (d: Doc) => (typeof d?.slug === "string" ? d.slug : d?.slug?.current);

export function previewTarget(doc: Doc): PreviewTarget | null {
  switch (doc?._type) {
    case "homeHero":
      return { path: "/", anchor: "top", title: "Home · Main frame" };
    case "homeWork":
      return { path: "/", anchor: "work", title: "Home · Selected work" };
    case "homeServices":
      return { path: "/", anchor: "services", title: "Home · What I do" };
    case "homeAbout":
      return { path: "/", anchor: "about", title: "Home · Short about" };
    case "homeReviews":
      return { path: "/", anchor: "reviews", title: "Home · What clients say" };
    case "homeContact":
      return { path: "/", anchor: "contact", title: "Home · Get in touch" };
    case "workPage":
      return { path: "/portfolio", title: "Work page" };
    case "category": {
      const s = slugOf(doc);
      return s ? { path: `/portfolio?cat=${s}`, title: "Work · category" } : { path: "/portfolio", title: "Work page" };
    }
    case "project": {
      const s = slugOf(doc);
      return s ? { path: `/projects/${s}`, title: "Project page" } : null;
    }
    case "service":
      return { path: "/services", anchor: `svc-${bare(doc?._id)}`, title: "Services page" };
    case "servicesPage":
      return { path: "/services", title: "Services page" };
    case "aboutPage":
      return { path: "/about", title: "About page" };
    case "review":
      return { path: "/about", anchor: "reviews", title: "About · reviews" };
    case "siteSettings":
      return { path: "/", anchor: "site-footer", title: "Footer" };
    case "bookingSettings":
      return { path: "/contact", title: "Contact form" };
    default:
      return null;
  }
}

export const PREVIEWABLE = new Set([
  "homeHero",
  "homeWork",
  "homeServices",
  "homeAbout",
  "homeReviews",
  "homeContact",
  "workPage",
  "category",
  "project",
  "service",
  "servicesPage",
  "aboutPage",
  "review",
  "siteSettings",
  "bookingSettings",
]);
