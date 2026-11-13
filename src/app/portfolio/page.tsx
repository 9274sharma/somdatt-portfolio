import type { Metadata } from "next";
import { img, type LocaleString } from "@/sanity/content";
import { aspect, cropUrl } from "@/sanity/media";
import { getWork, type GalleryImg } from "@/sanity/queries";
import { getLang } from "@/i18n/server";
import { pick, tr, type MsgKey } from "@/i18n/messages";
import { ui } from "@/i18n/ui";
import {
  WorkExplorer,
  type ExplorerCategory,
  type ExplorerFrame,
  type ExplorerProject,
} from "@/components/work/WorkExplorer";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Work",
  description: "Selected photography & film work — weddings, brands, nightlife and events across Hamburg.",
};

export default async function WorkPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const [{ cat }, lang, data] = await Promise.all([searchParams, getLang(), getWork()]);
  const t = (f: LocaleString | undefined, key: MsgKey) => pick(f, lang) || tr(key, lang);
  const u = ui(lang).work;

  const meta = (p: (typeof data.projects)[number]) => [pick(p.location, lang), p.date].filter(Boolean).join(" · ");

  const projects: ExplorerProject[] = data.projects.map((p) => {
    const c = data.categories.find((x) => x._id === p.catId);
    return {
      slug: p.slug,
      title: pick(p.title, lang) || "Untitled",
      meta: meta(p) || undefined,
      summary: pick(p.description, lang) || undefined,
      cover: cropUrl(p.cover, 760, 4 / 5),
      wide: cropUrl(p.cover, 1400, 3 / 2),
      href: `/projects/${p.slug}`,
      catSlug: c?.slug ?? "",
      photos: p.photoCount || undefined,
      photosLabel: lang === "de" ? "Fotos" : "photos",
      thumbs: (p.firstFrames ?? []).slice(1, 4).map((g) => cropUrl(g, 200, 1)).filter((x): x is string => Boolean(x)),
    };
  });
  const totalPhotos = data.projects.reduce((n, p) => n + (p.photoCount ?? 0), 0);

  // "Recent frames": photos ticked "Recent frames" in a project; until any are ticked, its first few.
  const frames: ExplorerFrame[] = [];
  for (const p of data.projects) {
    const c = data.categories.find((x) => x._id === p.catId);
    if (!c) continue;
    const list: GalleryImg[] = p.mix?.length ? p.mix : (p.firstFrames ?? []);
    for (const g of list) {
      const src = img(g, 900);
      if (!src) continue;
      frames.push({
        src,
        full: img(g, 1600) ?? src,
        fullSet: `${img(g, 1600)} 1600w, ${img(g, 2400)} 2400w`,
        alt: g.alt || pick(p.title, lang),
        caption: pick(p.title, lang),
        href: `/projects/${p.slug}`,
        aspect: aspect(g),
        catSlug: c.slug,
      });
    }
  }

  // Categories without projects stay hidden until their first project is published.
  const categories: ExplorerCategory[] = data.categories
    .filter((c) => data.projects.some((p) => p.catId === c._id))
    .map((c) => {
    const first = data.projects.find((p) => p.catId === c._id);
    return {
      slug: c.slug,
      title: pick(c.title, lang),
      description: pick(c.description, lang),
      cover: cropUrl(c.cover ?? first?.cover, 1400, 16 / 11),
      count: projects.filter((p) => p.catSlug === c.slug).length,
      cta: {
        title: pick(c.cta?.title, lang) || pick(data.page?.ctaTitle, lang) || tr("cta.worthKeeping", lang),
        text: pick(c.cta?.text, lang) || pick(data.page?.ctaText, lang) || tr("cta.tellMe", lang),
      },
    };
  });

  return (
    <div className="hm-wrap" style={{ paddingBottom: "1rem" }}>
      <WorkExplorer
        basePath="/portfolio"
        initialCat={cat}
        categories={categories}
        projects={projects}
        frames={frames}
        labels={{
          eyebrow: t(data.page?.eyebrow, "home.selectedWork"),
          title: t(data.page?.title, "work.title"),
          lead: t(data.page?.lead, "work.lead"),
          all: tr("work.all", lang),
          project: u.project,
          projects: u.projects,
          recent: u.recent,
          mix: u.mix,
          empty: u.empty,
          emptyCta: u.emptyCta,
          viewStory: u.viewStory,
          from: u.from,
          ctaEyebrow: u.ctaEyebrow,
          ctaAllTitle: pick(data.page?.ctaTitle, lang) || tr("cta.worthKeeping", lang),
          ctaAllText: pick(data.page?.ctaText, lang) || tr("cta.tellMe", lang),
          ctaButton: pick(data.page?.ctaButton, lang) || tr("cta.checkAvail", lang),
          photos: lang === "de" ? "Fotos" : "photos",
          place: "Hamburg",
        }}
        totals={{ projects: projects.length, photos: totalPhotos }}
      />
    </div>
  );
}
