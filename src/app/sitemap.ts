import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.somdattsharma.com";
  const routes = ["", "/portfolio", "/about", "/services", "/contact"];
  return routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: r === "" ? 1 : 0.7,
  }));
}
