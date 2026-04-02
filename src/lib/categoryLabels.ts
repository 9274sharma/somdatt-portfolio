import type { ProjectCategory } from "@/types/content";

const keys: Record<ProjectCategory, string> = {
  Weddings: "portfolioPage.categoryWeddings",
  Commercial: "portfolioPage.categoryCommercial",
  Social: "portfolioPage.categorySocial",
  Personal: "portfolioPage.categoryPersonal",
};

/** i18n message keys under portfolioPage.* */
export function portfolioCategoryKey(category: ProjectCategory): string {
  return keys[category];
}
