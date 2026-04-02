import portfolioJson from "@/data/portfolio.json";
import aboutJson from "@/data/about.json";
import type {
  AboutFile,
  BilingualList,
  BilingualText,
  PortfolioFile,
  ProjectEntry,
} from "@/types/content";

export type ContentLanguage = "en" | "de";

export const portfolioData = portfolioJson as PortfolioFile;
export const aboutData = aboutJson as AboutFile;

export function pickText(
  field: BilingualText | undefined,
  lang: ContentLanguage,
): string {
  if (!field) return "";
  return field[lang] ?? field.en ?? "";
}

export function pickList(
  field: BilingualList | undefined,
  lang: ContentLanguage,
): string[] {
  if (!field) return [];
  return field[lang] ?? field.en ?? [];
}

export function getProjectBySlug(slug: string): ProjectEntry | undefined {
  return portfolioData.projects.find((p) => p.slug === slug);
}

export function getFeaturedProjects(): ProjectEntry[] {
  return portfolioData.featuredSlugs
    .map((slug) => getProjectBySlug(slug))
    .filter((p): p is ProjectEntry => Boolean(p));
}

/** Encode each path segment so spaces / special chars in filenames work in <Image src>. */
export function publicImagePath(path: string): string {
  if (!path) return path;
  return path
    .split("/")
    .map((segment) => (segment === "" ? "" : encodeURIComponent(segment)))
    .join("/");
}
